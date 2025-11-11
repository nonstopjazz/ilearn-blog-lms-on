import { NextRequest, NextResponse } from 'next/server';

interface AIGradingRequest {
  essay_content: string;
  essay_title?: string;
  essay_topic?: string;
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
  };
  error?: string;
  message?: string;
}

/**
 * POST /api/essays/ai-grade
 * 使用 DeepSeek AI 批改作文（僅支援文字作文）
 */
export async function POST(request: NextRequest): Promise<NextResponse<AIGradingResponse>> {
  try {
    const body: AIGradingRequest = await request.json();
    const { essay_content, essay_title, essay_topic } = body;

    // 驗證必填參數
    if (!essay_content || essay_content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少作文內容',
        message: '請提供作文內容'
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
    const prompt = buildGradingPrompt(essay_content, essay_title, essay_topic);

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
      suggestions: parsedResult.suggestions || []
    };

    console.log('[AI Grading] Grading completed successfully');

    return NextResponse.json({
      success: true,
      data: gradingData,
      message: 'AI 批改完成'
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
  essayTopic?: string
): string {
  let prompt = `Please grade the following English essay according to these five criteria (each scored 0-100):

1. **Content Completeness (內容完整性)**: Are the arguments complete? Is the content substantial?
2. **Grammar Accuracy (文法正確性)**: Sentence structure and punctuation correctness
3. **Structure Organization (結構組織)**: Paragraph arrangement and logical coherence
4. **Vocabulary Precision (用詞精確度)**: Word choice and expression accuracy
5. **Creative Expression (創意表達)**: Innovation in ideas and uniqueness in expression

`;

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

  return prompt;
}
