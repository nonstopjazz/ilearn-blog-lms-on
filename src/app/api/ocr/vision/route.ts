import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

interface OCRRequest {
  image_url?: string;
  image_urls?: string[];
}

interface OCRResponse {
  success: boolean;
  data?: {
    text: string;
    individual_texts?: string[];
  };
  error?: string;
  message?: string;
}

/**
 * POST /api/ocr/vision
 * 使用 Google Cloud Vision API 辨識圖片中的文字
 */
export async function POST(request: NextRequest): Promise<NextResponse<OCRResponse>> {
  try {
    const body: OCRRequest = await request.json();
    const { image_url, image_urls } = body;

    // 驗證參數
    if (!image_url && (!image_urls || image_urls.length === 0)) {
      return NextResponse.json({
        success: false,
        error: '缺少圖片 URL',
        message: '請提供 image_url 或 image_urls'
      }, { status: 400 });
    }

    // 檢查環境變數
    const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
    if (!credentialsJson) {
      console.error('[OCR] GOOGLE_CLOUD_CREDENTIALS_JSON not configured');
      return NextResponse.json({
        success: false,
        error: '伺服器配置錯誤',
        message: 'Google Cloud credentials 未設定'
      }, { status: 500 });
    }

    // 解析 credentials
    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch (e) {
      console.error('[OCR] Failed to parse credentials JSON:', e);
      return NextResponse.json({
        success: false,
        error: '伺服器配置錯誤',
        message: 'Google Cloud credentials 格式錯誤'
      }, { status: 500 });
    }

    // 初始化 Vision API client
    const client = new ImageAnnotatorClient({
      credentials: credentials
    });

    // 處理單張或多張圖片
    const urls = image_urls || [image_url!];
    const individualTexts: string[] = [];

    console.log(`[OCR] Processing ${urls.length} image(s)...`);

    // 對每張圖片進行 OCR
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[OCR] Processing image ${i + 1}/${urls.length}: ${url.substring(0, 50)}...`);

      try {
        const [result] = await client.textDetection({
          image: { source: { imageUri: url } }
        });

        const detections = result.textAnnotations;

        if (detections && detections.length > 0) {
          // 第一個 annotation 包含完整文字
          const fullText = detections[0].description || '';
          individualTexts.push(fullText);
          console.log(`[OCR] Image ${i + 1} detected ${fullText.length} characters`);
        } else {
          console.warn(`[OCR] Image ${i + 1}: No text detected`);
          individualTexts.push('');
        }
      } catch (error) {
        console.error(`[OCR] Error processing image ${i + 1}:`, error);
        // 繼續處理其他圖片
        individualTexts.push('');
      }
    }

    // 合併所有圖片的文字
    const combinedText = individualTexts
      .filter(text => text.trim().length > 0)
      .join('\n\n');

    if (combinedText.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'OCR 辨識失敗',
        message: '無法從圖片中辨識出文字，請確認圖片清晰度'
      }, { status: 400 });
    }

    console.log(`[OCR] Successfully extracted ${combinedText.length} characters from ${urls.length} image(s)`);

    return NextResponse.json({
      success: true,
      data: {
        text: combinedText,
        individual_texts: individualTexts
      },
      message: 'OCR 辨識完成'
    });

  } catch (error) {
    console.error('[OCR] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'OCR 辨識失敗',
      message: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
