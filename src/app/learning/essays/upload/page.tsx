'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Send, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import { compressImage, formatFileSize, isImageFile } from '@/lib/imageCompression';

type SubmissionMode = 'image' | 'text';

export default function EssayUploadPage() {
  const router = useRouter();
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [essayTitle, setEssayTitle] = useState('');
  const [essayContent, setEssayContent] = useState(''); // 文字作文內容
  const [studentNotes, setStudentNotes] = useState('');
  const [essayDate, setEssayDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 驗證檔案類型
      if (!isImageFile(file)) {
        toast.error('請選擇圖片檔案 (JPG, PNG, HEIC)');
        return;
      }

      // 檢查檔案大小 (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('檔案大小不能超過 50MB');
        return;
      }

      setSelectedFile(file);

      // 建立預覽
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // 如果標題為空，自動設定為檔案名稱
      if (!essayTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setEssayTitle(nameWithoutExt);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      if (!isImageFile(file)) {
        toast.error('請選擇圖片檔案 (JPG, PNG, HEIC)');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (!essayTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setEssayTitle(nameWithoutExt);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    // 驗證
    if (submissionMode === 'image' && !selectedFile) {
      toast.error('請選擇圖片檔案');
      return;
    }

    if (submissionMode === 'text' && !essayContent.trim()) {
      toast.error('請輸入作文內容');
      return;
    }

    if (!essayTitle.trim()) {
      toast.error('請輸入作文標題');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = getSupabase();

      // 獲取當前用戶
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('請先登入');
        router.push('/login');
        return;
      }

      let requestData: any = {
        user_id: user.id, // 傳遞用戶 ID 給 Admin Client API
        submission_type: submissionMode,
        essay_title: essayTitle.trim(),
        essay_date: essayDate,
        student_notes: studentNotes.trim() || null,
        tags: ['作文'],
        status: 'submitted',
      };

      // 圖片模式：壓縮並上傳圖片
      if (submissionMode === 'image' && selectedFile) {
        // 1. 壓縮圖片
        toast.info('正在壓縮圖片...');
        const compressionResult = await compressImage(selectedFile);

        setCompressionInfo({
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          ratio: compressionResult.compressionRatio,
        });

        console.log('[Upload] 壓縮完成:', {
          原始: formatFileSize(compressionResult.originalSize),
          壓縮後: formatFileSize(compressionResult.compressedSize),
          壓縮率: `${compressionResult.compressionRatio}%`,
        });

        // 2. 上傳到 Supabase Storage
        toast.info('正在上傳圖片...');

        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        const fileExt = 'jpg'; // 壓縮後統一為 JPEG
        // 使用時間戳 + 隨機數作為檔名，避免中文字符問題
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${timestamp}_${randomStr}.${fileExt}`;

        // 按照 學生ID/年/月 的結構儲存
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const storagePath = `${user.id}/${year}/${month}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('essays')
          .upload(storagePath, compressionResult.file, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('[Upload] Storage error:', uploadError);
          toast.error('上傳失敗: ' + uploadError.message);
          return;
        }

        // 3. 獲取公開 URL
        const { data: urlData } = supabase.storage
          .from('essays')
          .getPublicUrl(storagePath);

        console.log('[Upload] 上傳成功:', urlData.publicUrl);

        requestData = {
          ...requestData,
          image_url: urlData.publicUrl,
          file_name: fileName,
          original_file_size: compressionResult.originalSize,
          compressed_file_size: compressionResult.compressedSize,
          mime_type: 'image/jpeg',
          image_width: compressionResult.width,
          image_height: compressionResult.height,
        };
      }
      // 文字模式：直接提交文字內容
      else if (submissionMode === 'text') {
        requestData = {
          ...requestData,
          essay_content: essayContent.trim(),
        };
      }

      // 4. 建立資料庫記錄
      toast.info('正在建立記錄...');

      const response = await fetch('/api/essays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '建立記錄失敗');
      }

      console.log('[Upload] 記錄建立成功:', result.data);

      // 5. 成功提示並跳轉
      toast.success('作文提交成功！');

      setTimeout(() => {
        router.push('/learning/essays');
      }, 1000);

    } catch (error: any) {
      console.error('[Upload] Error:', error);
      toast.error('提交失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">提交作文</h1>
          <p className="text-muted-foreground">選擇提交方式：上傳圖片或輸入文字</p>
        </div>

        <Card className="p-8">
          {/* 提交模式切換 */}
          <div className="mb-6 flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setSubmissionMode('image')}
              disabled={isUploading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
                submissionMode === 'image'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              上傳圖片
            </button>
            <button
              onClick={() => setSubmissionMode('text')}
              disabled={isUploading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
                submissionMode === 'text'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-5 h-5" />
              輸入文字
            </button>
          </div>

          {/* 圖片上傳模式 */}
          {submissionMode === 'image' && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="file-upload" className="text-lg mb-2 block">
                作文圖片 <span className="text-red-500">*</span>
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/heic"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="預覽"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-lg font-medium text-primary">
                        {selectedFile?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile && formatFileSize(selectedFile.size)}
                      </p>
                      {compressionInfo && (
                        <p className="text-xs text-green-600">
                          壓縮後約 {formatFileSize(compressionInfo.compressedSize)}
                          （減少 {compressionInfo.ratio}%）
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        點擊上傳或拖放圖片
                      </p>
                      <p className="text-sm text-muted-foreground">
                        支援 JPG、PNG、HEIC 格式，最大 50MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* 作文標題 */}
            <div>
              <Label htmlFor="essay-title" className="text-lg mb-2 block">
                作文標題 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="essay-title"
                type="text"
                placeholder="例如：我的暑假生活"
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                disabled={isUploading}
                className="text-base"
              />
            </div>

            {/* 日期 */}
            <div>
              <Label htmlFor="essay-date" className="text-lg mb-2 block">
                日期
              </Label>
              <Input
                id="essay-date"
                type="date"
                value={essayDate}
                onChange={(e) => setEssayDate(e.target.value)}
                disabled={isUploading}
                className="text-base"
              />
            </div>

            {/* 學生備註 */}
            <div>
              <Label htmlFor="student-notes" className="text-lg mb-2 block">
                備註說明（選填）
              </Label>
              <Textarea
                id="student-notes"
                placeholder="可以寫下這篇作文的想法、遇到的困難，或想問老師的問題..."
                className="min-h-[120px] text-base"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>
          )}

          {/* 文字輸入模式 */}
          {submissionMode === 'text' && (
          <div className="space-y-6">
            {/* 作文標題 */}
            <div>
              <Label htmlFor="essay-title-text" className="text-lg mb-2 block">
                作文標題 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="essay-title-text"
                type="text"
                placeholder="例如：我的暑假生活"
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                disabled={isUploading}
                className="text-base"
              />
            </div>

            {/* 日期 */}
            <div>
              <Label htmlFor="essay-date-text" className="text-lg mb-2 block">
                日期
              </Label>
              <Input
                id="essay-date-text"
                type="date"
                value={essayDate}
                onChange={(e) => setEssayDate(e.target.value)}
                disabled={isUploading}
                className="text-base"
              />
            </div>

            {/* 作文內容 */}
            <div>
              <Label htmlFor="essay-content" className="text-lg mb-2 block">
                作文內容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="essay-content"
                placeholder="請輸入您的作文內容..."
                className="min-h-[400px] text-base font-serif leading-relaxed"
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                已輸入 {essayContent.length} 字
              </p>
            </div>

            {/* 學生備註 */}
            <div>
              <Label htmlFor="student-notes-text" className="text-lg mb-2 block">
                備註說明（選填）
              </Label>
              <Textarea
                id="student-notes-text"
                placeholder="可以寫下這篇作文的想法、遇到的困難，或想問老師的問題..."
                className="min-h-[120px] text-base"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>
          )}

          {/* 按鈕 */}
          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/learning/essays')}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isUploading ||
                (submissionMode === 'image' && !selectedFile) ||
                (submissionMode === 'text' && !essayContent.trim())
              }
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {submissionMode === 'image' ? '上傳中...' : '提交中...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交作文
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
