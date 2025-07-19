// src/lib/bunny-api.ts - 客戶端安全版本
export interface BunnyConfig {
  apiKey: string;
  libraryId: string;
  cdnHostname: string;
  testVideoId: string;
}

export interface BunnyConfigCheck {
  isValid: boolean;
  missing: string[];
  hasAll: boolean;
}

export class BunnyAPI {
  private apiKey: string;
  private libraryId: string;
  private cdnHostname: string;
  private testVideoId: string;
  private baseURL = 'https://video.bunnycdn.com/library';
  private isServerSide: boolean;

  constructor() {
    // 檢測是否在伺服器端
    this.isServerSide = typeof window === 'undefined';
    
    if (this.isServerSide) {
      // 伺服器端：使用 process.env
      this.apiKey = process.env.BUNNY_API_KEY || '';
      this.libraryId = process.env.BUNNY_LIBRARY_ID || '';
      this.cdnHostname = process.env.BUNNY_CDN_HOSTNAME || '';
      this.testVideoId = process.env.BUNNY_TEST_VIDEO_ID || '';
      
      // 改進的環境變數檢查
      const configCheck = this.checkConfig();
      if (!configCheck.isValid) {
        console.error('Bunny.net credentials missing in environment variables:', configCheck.missing);
      } else {
        console.log('✅ Bunny.net 配置已載入 (伺服器端)');
      }
    } else {
      // 客戶端：使用預設值，不檢查 process.env
      this.apiKey = '';
      this.libraryId = '467399'; // 從專案文件獲取
      this.cdnHostname = 'vz-a6d0df2a-1de.b-cdn.net'; // 從專案文件獲取
      this.testVideoId = '2764c2d9-d41b-44ef-9ae2-52d94495eec8'; // 從專案文件獲取
      
      console.log('📱 Bunny.net 客戶端模式啟動');
    }
  }

  // 檢查配置是否完整
  checkConfig(): BunnyConfigCheck {
    if (!this.isServerSide) {
      // 客戶端模式：假設配置正確（實際檢查由伺服器端處理）
      return {
        isValid: true,
        missing: [],
        hasAll: true
      };
    }
    
    const missing: string[] = [];
    
    if (!this.apiKey) missing.push('BUNNY_API_KEY');
    if (!this.libraryId) missing.push('BUNNY_LIBRARY_ID');
    if (!this.cdnHostname) missing.push('BUNNY_CDN_HOSTNAME');
    if (!this.testVideoId) missing.push('BUNNY_TEST_VIDEO_ID');
    
    return {
      isValid: missing.length === 0,
      missing,
      hasAll: missing.length === 0
    };
  }

  // 取得配置資訊（不包含敏感資料）
  getConfigInfo(): { isConfigured: boolean; libraryId: string; cdnHostname: string; testVideoId: string; apiKeyPreview: string; environment: string } {
    return {
      isConfigured: this.checkConfig().isValid,
      libraryId: this.libraryId,
      cdnHostname: this.cdnHostname,
      testVideoId: this.testVideoId,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'client-mode',
      environment: this.isServerSide ? 'server' : 'client'
    };
  }

  // 檢查是否已正確配置
  isConfigured(): boolean {
    return this.checkConfig().isValid;
  }

  // 獲取影片資訊 - 僅伺服器端
  async getVideo(videoId: string) {
    if (!this.isServerSide) {
      throw new Error('getVideo() 只能在伺服器端使用');
    }

    if (!this.isConfigured()) {
      const configCheck = this.checkConfig();
      throw new Error(`Bunny.net 配置不完整，缺少: ${configCheck.missing.join(', ')}`);
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.libraryId}/videos/${videoId}`, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Bunny API error: ${response.status} - ${response.statusText}`);
      }
      
      const videoData = await response.json();
      console.log('✅ 成功獲取 Bunny 影片資訊:', videoId);
      return videoData;
    } catch (error) {
      console.error('Failed to get video from Bunny:', error);
      throw error;
    }
  }

  // 獲取影片播放 URL (iframe 嵌入) - 客戶端安全
  getEmbedURL(videoId: string, options: {
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
    loop?: boolean;
    preload?: boolean;
  } = {}): string {
    // 客戶端模式：直接使用硬編碼的配置值
    const libraryId = this.libraryId || '467399';
    
    const {
      autoplay = false,
      controls = true,
      muted = false,
      loop = false,
      preload = true
    } = options;

    const params = new URLSearchParams({
      autoplay: autoplay.toString(),
      controls: controls.toString(),
      muted: muted.toString(),
      loop: loop.toString(),
      preload: preload.toString()
    });

    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${params.toString()}`;
    console.log('🎬 生成 Bunny 嵌入 URL:', embedUrl);
    return embedUrl;
  }

  // 獲取直接播放 URL (HLS/MP4) - 客戶端安全
  getDirectPlayURL(videoId: string, quality?: string): string {
    // 客戶端模式：直接使用硬編碼的配置值
    const cdnHostname = this.cdnHostname || 'vz-a6d0df2a-1de.b-cdn.net';
    
    const qualityParam = quality ? `_${quality}` : '';
    const playUrl = `https://${cdnHostname}/${videoId}/playlist${qualityParam}.m3u8`;
    console.log('🎥 生成 Bunny 直播 URL:', playUrl);
    return playUrl;
  }

  // 獲取縮圖 URL - 客戶端安全
  getThumbnailURL(videoId: string, options: {
    width?: number;
    height?: number;
    time?: number; // 時間點（秒）
  } = {}): string {
    // 客戶端模式：直接使用硬編碼的配置值
    const cdnHostname = this.cdnHostname || 'vz-a6d0df2a-1de.b-cdn.net';
    
    const { width = 1280, height = 720, time = 0 } = options;
    return `https://${cdnHostname}/${videoId}/thumbnail_${time}_${width}x${height}.jpg`;
  }

  // 獲取影片統計 - 僅伺服器端
  async getVideoStatistics(videoId: string) {
    if (!this.isServerSide) {
      throw new Error('getVideoStatistics() 只能在伺服器端使用');
    }

    if (!this.isConfigured()) {
      const configCheck = this.checkConfig();
      throw new Error(`Bunny.net 配置不完整，缺少: ${configCheck.missing.join(', ')}`);
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.libraryId}/videos/${videoId}/statistics`, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Bunny API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get video statistics:', error);
      throw error;
    }
  }

  // 上傳影片 - 僅伺服器端
  async uploadVideo(title: string, file: File) {
    if (!this.isServerSide) {
      throw new Error('uploadVideo() 只能在伺服器端使用');
    }

    if (!this.isConfigured()) {
      const configCheck = this.checkConfig();
      throw new Error(`Bunny.net 配置不完整，缺少: ${configCheck.missing.join(', ')}`);
    }

    try {
      // 第一步：創建影片記錄
      const createResponse = await fetch(`${this.baseURL}/${this.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create video: ${createResponse.status}`);
      }

      const video = await createResponse.json();
      
      // 第二步：上傳影片檔案
      const uploadResponse = await fetch(`${this.baseURL}/${this.libraryId}/videos/${video.guid}`, {
        method: 'PUT',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload video: ${uploadResponse.status}`);
      }

      return video;
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  }

  // 檢查 API 連接 - 僅伺服器端
  async testConnection(): Promise<boolean> {
    if (!this.isServerSide) {
      console.warn('⚠️ testConnection() 只能在伺服器端使用');
      return false;
    }

    if (!this.isConfigured()) {
      console.warn('⚠️ Bunny.net 配置不完整，無法測試連接');
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.libraryId}`, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      const isConnected = response.ok;
      if (isConnected) {
        console.log('✅ Bunny.net API 連接成功');
      } else {
        console.error('❌ Bunny.net API 連接失敗:', response.status);
      }
      
      return isConnected;
    } catch (error) {
      console.error('❌ Bunny API connection test failed:', error);
      return false;
    }
  }

  // 測試影片播放（使用 testVideoId） - 僅伺服器端
  async testVideoPlayback(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    if (!this.isServerSide) {
      return {
        success: false,
        message: 'testVideoPlayback() 只能在伺服器端使用'
      };
    }

    if (!this.isConfigured()) {
      const configCheck = this.checkConfig();
      return {
        success: false,
        message: `Bunny.net 配置不完整，缺少: ${configCheck.missing.join(', ')}`
      };
    }

    try {
      const videoInfo = await this.getVideo(this.testVideoId);
      const embedUrl = this.getEmbedURL(this.testVideoId);
      const directUrl = this.getDirectPlayURL(this.testVideoId);
      
      return {
        success: true,
        message: '✅ Bunny.net 影片測試成功',
        data: {
          testVideoId: this.testVideoId,
          videoInfo: {
            title: videoInfo.title,
            duration: videoInfo.length,
            status: videoInfo.status
          },
          urls: {
            embed: embedUrl,
            direct: directUrl
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Bunny.net 影片測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }
}

// 單例模式
export const bunnyAPI = new BunnyAPI();

// 便利函數 - 客戶端安全
export function checkBunnyConfig(): BunnyConfigCheck {
  return bunnyAPI.checkConfig();
}

export function generateBunnyPlayUrl(videoId: string): string {
  return bunnyAPI.getDirectPlayURL(videoId);
}

export function generateBunnyEmbedUrl(videoId: string, options?: any): string {
  return bunnyAPI.getEmbedURL(videoId, options);
}

// 伺服器端專用函數
export async function testBunnyConnection(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  return bunnyAPI.testVideoPlayback();
}