import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

interface ImageUrl {
  url: string;
  order: number;
}

interface AIGradingRequest {
  essay_id: string;
}

interface AIGradingResponse {
  success: boolean;
  data?: {
    scores: {
      content: number;
      grammar: number;
      structure: number;
      vocabulary: number;
      creativity: number;
    };
    teacher_comment: string;
    overall_comment: string;
    suggestions: string[];
    ocr_text?: string; // 如果是圖片作文，返回 OCR 文字
  };
  error?: string;
  message?: string;
}

/**
 * POST /api/essays/ai-grade
 * 使用 DeepSeek AI 批改作文（支援文字作文和圖片作文）
 * 圖片作文會先使用 Google Cloud Vision OCR 辨識
 */
export async function POST(request: NextRequest): Promise<NextResponse<AIGradingResponse>> {
  try {
    const body: AIGradingRequest = await request.json();
    const { essay_id } = body;

    // 驗證必填參數
    if (!essay_id || essay_id.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少作文 ID',
        message: '請提供 essay_id'
      }, { status: 400 });
    }

    // 從資料庫讀取作文資料
    console.log(`[AI Grading] Fetching essay ${essay_id}...`);
    const supabase = createSupabaseAdminClient();

    const { data: essay, error: fetchError } = await supabase
      .from('essay_submissions')
      .select('*')
      .eq('id', essay_id)
      .single();

    if (fetchError || !essay) {
      console.error('[AI Grading] Essay not found:', fetchError);
      return NextResponse.json({
        success: false,
        error: '作文不存在',
        message: '找不到指定的作文'
      }, { status: 404 });
    }

    console.log(`[AI Grading] Essay type: ${essay.submission_type}`);

    let essayContent = '';
    let ocrText = '';

    // 根據作文類型處理
    if (essay.submission_type === 'text') {
      // 文字作文：直接使用內容
      if (!essay.essay_content || essay.essay_content.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: '作文內容為空',
          message: '文字作文沒有內容'
        }, { status: 400 });
      }
      essayContent = essay.essay_content;

    } else if (essay.submission_type === 'image') {
      // 圖片作文：先進行 OCR
      const imageUrls: ImageUrl[] = essay.image_urls || [];

      if (imageUrls.length === 0 && !essay.image_url) {
        return NextResponse.json({
          success: false,
          error: '沒有圖片',
          message: '圖片作文沒有上傳圖片'
        }, { status: 400 });
      }

      // 準備圖片 URL 列表
      const urls = imageUrls.length > 0
        ? imageUrls.sort((a, b) => a.order - b.order).map(img => img.url)
        : [essay.image_url];

      console.log(`[AI Grading] Performing OCR on ${urls.length} image(s)...`);

      // 呼叫 OCR API
      try {
        const ocrResponse = await fetch(`${request.nextUrl.origin}/api/ocr/vision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image_urls: urls })
        });

        const ocrResult = await ocrResponse.json();

        if (!ocrResult.success) {
          throw new Error(ocrResult.error || 'OCR 辨識失敗');
        }

        essayContent = ocrResult.data.text;
        ocrText = essayContent;
        console.log(`[AI Grading] OCR extracted ${essayContent.length} characters`);

      } catch (ocrError) {
        console.error('[AI Grading] OCR failed:', ocrError);
        return NextResponse.json({
          success: false,
          error: 'OCR 辨識失敗',
          message: ocrError instanceof Error ? ocrError.message : '無法辨識圖片中的文字'
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: '不支援的作文類型',
        message: `未知的作文類型: ${essay.submission_type}`
      }, { status: 400 });
    }

    // 驗證作文內容
    if (!essayContent || essayContent.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '作文內容為空',
        message: '無法獲取作文內容'
      }, { status: 400 });
    }

    // 檢查環境變數
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('[AI Grading] DEEPSEEK_API_KEY not configured');
      return NextResponse.json({
        success: false,
        error: '伺服器配置錯誤',
        message: 'DeepSeek API Key 未設定'
      }, { status: 500 });
    }

    // 建構 AI 提示詞
    const prompt = buildGradingPrompt(
      essayContent,
      essay.essay_title,
      essay.essay_topic,
      essay.submission_type === 'image' ? 'OCR' : undefined
    );

    console.log('[AI Grading] Calling DeepSeek API...');

    // 呼叫 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced English teacher specializing in essay grading. You provide detailed, constructive feedback and accurate scoring based on established criteria.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Grading] DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API 呼叫失敗: ${response.status}`);
    }

    const result = await response.json();
    console.log('[AI Grading] DeepSeek API response received');

    // 解析 AI 回應
    const aiContent = result.choices?.[0]?.message?.content;
    if (!aiContent) {
      throw new Error('DeepSeek API 回應格式錯誤');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiContent);
    } catch (e) {
      console.error('[AI Grading] JSON parse error:', aiContent);
      throw new Error('AI 回應格式解析失敗');
    }

    // 驗證並標準化分數（確保在 0-100 範圍內）
    const normalizeScore = (score: any): number => {
      const num = parseInt(score);
      if (isNaN(num)) return 0;
      return Math.max(0, Math.min(100, num));
    };

    const gradingData = {
      scores: {
        content: normalizeScore(parsedResult.scores?.content || 0),
        grammar: normalizeScore(parsedResult.scores?.grammar || 0),
        structure: normalizeScore(parsedResult.scores?.structure || 0),
        vocabulary: normalizeScore(parsedResult.scores?.vocabulary || 0),
        creativity: normalizeScore(parsedResult.scores?.creativity || 0),
      },
      teacher_comment: parsedResult.teacher_comment || '',
      overall_comment: parsedResult.overall_comment || '',
      suggestions: parsedResult.suggestions || [],
      ocr_text: ocrText || undefined // 如果是圖片作文，返回 OCR 文字
    };

    console.log('[AI Grading] Grading completed successfully');

    return NextResponse.json({
      success: true,
      data: gradingData,
      message: essay.submission_type === 'image' ? 'OCR + AI 批改完成' : 'AI 批改完成'
    });

  } catch (error) {
    console.error('[AI Grading] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'AI 批改失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

/**
 * 建構 AI 批改的提示詞
 */
function buildGradingPrompt(
  essayContent: string,
  essayTitle?: string,
  essayTopic?: string,
  source?: 'OCR'
): string {
  let prompt = `Please grade the following English essay according to these five criteria (each scored 0-100):

1. **Content Completeness (內容完整性)**: Are the arguments complete? Is the content substantial?
2. **Grammar Accuracy (文法正確性)**: Sentence structure and punctuation correctness
3. **Structure Organization (結構組織)**: Paragraph arrangement and logical coherence
4. **Vocabulary Precision (用詞精確度)**: Word choice and expression accuracy
5. **Creative Expression (創意表達)**: Innovation in ideas and uniqueness in expression

`;

  if (source === 'OCR') {
    prompt += `**Note**: This essay was extracted from handwritten images using OCR. There may be minor OCR errors in the text, but please grade based on the intended content and overall quality.\n\n`;
  }

  if (essayTitle) {
    prompt += `**Essay Title**: ${essayTitle}\n\n`;
  }

  if (essayTopic) {
    prompt += `**Essay Topic/Prompt**: ${essayTopic}\n\n`;
  }

  prompt += `**Essay Content**:
${essayContent}

---

Please provide your grading in the following JSON format:

{
  "scores": {
    "content": <0-100>,
    "grammar": <0-100>,
    "structure": <0-100>,
    "vocabulary": <0-100>,
    "creativity": <0-100>
  },
  "teacher_comment": "<detailed analysis of strengths and areas for improvement in Traditional Chinese>",
  "overall_comment": "<a concise overall evaluation in Traditional Chinese>",
  "suggestions": [
    "<specific improvement suggestion 1 in Traditional Chinese>",
    "<specific improvement suggestion 2 in Traditional Chinese>",
    "<specific improvement suggestion 3 in Traditional Chinese>"
  ]
}

Important notes:
- All scores must be integers between 0-100
- Comments and suggestions should be written in Traditional Chinese (繁體中文)
- Be constructive, specific, and encouraging in your feedback
- Highlight both strengths and areas for improvement
- Provide actionable suggestions for improvement`;

  if (source === 'OCR') {
    prompt += `\n- If there are obvious OCR errors that don't affect the overall meaning, be lenient in your grammar scoring`;
  }

  return prompt;
}
