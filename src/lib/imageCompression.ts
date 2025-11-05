/**
 * 圖片壓縮工具
 * 使用 browser-image-compression 庫進行前端圖片壓縮
 */

import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width?: number;
  height?: number;
}

/**
 * 壓縮圖片
 * @param file - 原始圖片檔案
 * @returns 壓縮後的檔案和相關資訊
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const options = {
    maxSizeMB: 1,                  // 最大 1MB
    maxWidthOrHeight: 1920,        // 最大寬高 1920px
    useWebWorker: true,            // 使用 Web Worker 提升性能
    fileType: 'image/jpeg' as const, // 統一轉為 JPEG
    initialQuality: 0.8,           // 初始品質 80%
  };

  try {
    console.log('[Image Compression] 開始壓縮...');
    console.log('[Image Compression] 原始大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    const compressedFile = await imageCompression(file, options);

    // 獲取圖片尺寸
    const dimensions = await getImageDimensions(compressedFile);

    const result: CompressionResult = {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: parseFloat(((1 - compressedFile.size / file.size) * 100).toFixed(1)),
      width: dimensions.width,
      height: dimensions.height,
    };

    console.log('[Image Compression] 壓縮完成!');
    console.log('[Image Compression] 壓縮後:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[Image Compression] 壓縮率:', result.compressionRatio, '%');
    console.log('[Image Compression] 尺寸:', `${dimensions.width}x${dimensions.height}`);

    return result;
  } catch (error) {
    console.error('[Image Compression] 壓縮失敗:', error);
    throw new Error('圖片壓縮失敗，請稍後再試');
  }
}

/**
 * 生成縮圖
 * @param file - 原始圖片檔案
 * @returns 縮圖檔案
 */
export async function generateThumbnail(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.1,               // 縮圖最大 100KB
    maxWidthOrHeight: 400,        // 縮圖最大 400px
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.7,
  };

  try {
    console.log('[Thumbnail] 生成縮圖中...');
    const thumbnail = await imageCompression(file, options);
    console.log('[Thumbnail] 縮圖生成完成:', (thumbnail.size / 1024).toFixed(2), 'KB');
    return thumbnail;
  } catch (error) {
    console.error('[Thumbnail] 縮圖生成失敗:', error);
    throw new Error('縮圖生成失敗');
  }
}

/**
 * 獲取圖片尺寸
 * @param file - 圖片檔案
 * @returns 寬度和高度
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('無法讀取圖片尺寸'));
    };

    img.src = url;
  });
}

/**
 * 驗證檔案是否為圖片
 * @param file - 檔案
 * @returns 是否為圖片
 */
export function isImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * 格式化檔案大小
 * @param bytes - 位元組數
 * @returns 格式化後的字串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
