'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Send, Loader2, Image as ImageIcon, FileText, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import { compressImage, formatFileSize, isImageFile } from '@/lib/imageCompression';

type SubmissionMode = 'image' | 'text';

interface FileWithPreview {
  id: string;
  file: File;
  preview: string;
  annotation: string;
}

export default function EssayUploadPage() {
  const router = useRouter();
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('image');
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]); // 改為陣列
  const [essayTitle, setEssayTitle] = useState('');
  const [essayContent, setEssayContent] = useState(''); // 文字作文內容
  const [studentNotes, setStudentNotes] = useState('');
  const [essayDate, setEssayDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    // 檢查總數量限制（最多 5 張）
    if (selectedFiles.length + newFiles.length > 5) {
      toast.error('最多只能上傳 5 張圖片');
      return;
    }

    // 驗證每個檔案
    for (const file of newFiles) {
      // 驗證檔案類型
      if (!isImageFile(file)) {
        toast.error(`${file.name} 不是有效的圖片檔案 (請選擇 JPG, PNG, HEIC)`);
        return;
      }

      // 檢查檔案大小 (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} 檔案大小超過 50MB`);
        return;
      }
    }

    // 建立 FileWithPreview 物件
    const newFilesWithPreview: FileWithPreview[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      file,
      preview: URL.createObjectURL(file),
      annotation: '',
    }));

    setSelectedFiles([...selectedFiles, ...newFilesWithPreview]);

    // 如果標題為空且是第一次上傳，自動設定為第一個檔案名稱
    if (!essayTitle && selectedFiles.length === 0 && newFilesWithPreview.length > 0) {
      const nameWithoutExt = newFilesWithPreview[0].file.name.replace(/\.[^/.]+$/, '');
      setEssayTitle(nameWithoutExt);
    }

    // 重置 input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const newFiles = Array.from(e.dataTransfer.files);

    // 檢查總數量限制（最多 5 張）
    if (selectedFiles.length + newFiles.length > 5) {
      toast.error('最多只能上傳 5 張圖片');
      return;
    }

    // 驗證每個檔案
    for (const file of newFiles) {
      if (!isImageFile(file)) {
        toast.error(`${file.name} 不是有效的圖片檔案 (請選擇 JPG, PNG, HEIC)`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} 檔案大小超過 50MB`);
        return;
      }
    }

    // 建立 FileWithPreview 物件
    const newFilesWithPreview: FileWithPreview[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      file,
      preview: URL.createObjectURL(file),
      annotation: '',
    }));

    setSelectedFiles([...selectedFiles, ...newFilesWithPreview]);

    if (!essayTitle && selectedFiles.length === 0 && newFilesWithPreview.length > 0) {
      const nameWithoutExt = newFilesWithPreview[0].file.name.replace(/\.[^/.]+$/, '');
      setEssayTitle(nameWithoutExt);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 移除圖片
  const removeFile = (id: string) => {
    setSelectedFiles(selectedFiles.filter((f) => f.id !== id));
  };

  // 移動圖片（拖拉排序）
  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...selectedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setSelectedFiles(newFiles);
  };

  // 更新圖片註解
  const updateAnnotation = (id: string, annotation: string) => {
    setSelectedFiles(
      selectedFiles.map((f) => (f.id === id ? { ...f, annotation } : f))
    );
  };

  const handleSubmit = async () => {
    // 驗證
    if (submissionMode === 'image' && selectedFiles.length === 0) {
      toast.error('請選擇至少一張圖片');
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
    setUploadProgress({ current: 0, total: selectedFiles.length });

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
        user_id: user.id,
        submission_type: submissionMode,
        essay_title: essayTitle.trim(),
        essay_date: essayDate,
        student_notes: studentNotes.trim() || null,
        tags: ['作文'],
        status: 'submitted',
      };

      // 圖片模式：批次壓縮並上傳多張圖片
      if (submissionMode === 'image' && selectedFiles.length > 0) {
        const imageUrls: any[] = [];
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // 處理每張圖片
        for (let i = 0; i < selectedFiles.length; i++) {
          const fileItem = selectedFiles[i];
          setUploadProgress({ current: i + 1, total: selectedFiles.length });

          // 1. 壓縮圖片
          toast.info(`正在壓縮圖片 ${i + 1}/${selectedFiles.length}...`);
          const compressionResult = await compressImage(fileItem.file);

          console.log(`[Upload] 圖片 ${i + 1} 壓縮完成:`, {
            原始: formatFileSize(compressionResult.originalSize),
            壓縮後: formatFileSize(compressionResult.compressedSize),
            壓縮率: `${compressionResult.compressionRatio}%`,
          });

          // 2. 上傳到 Supabase Storage
          toast.info(`正在上傳圖片 ${i + 1}/${selectedFiles.length}...`);

          const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `${timestamp}_${randomStr}_${i}.jpg`;
          const storagePath = `${user.id}/${year}/${month}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('essays')
            .upload(storagePath, compressionResult.file, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) {
            console.error(`[Upload] 圖片 ${i + 1} 上傳失敗:`, uploadError);
            toast.error(`圖片 ${i + 1} 上傳失敗: ${uploadError.message}`);
            return;
          }

          // 3. 獲取公開 URL
          const { data: urlData } = supabase.storage
            .from('essays')
            .getPublicUrl(storagePath);

          console.log(`[Upload] 圖片 ${i + 1} 上傳成功:`, urlData.publicUrl);

          // 加入 imageUrls 陣列
          imageUrls.push({
            url: urlData.publicUrl,
            width: compressionResult.width,
            height: compressionResult.height,
            size: compressionResult.compressedSize,
            order: i,
            annotation: fileItem.annotation || '',
          });
        }

        // 設定第一張圖片為主圖（向後兼容）
        requestData = {
          ...requestData,
          image_url: imageUrls[0].url,
          image_urls: imageUrls,
          file_name: `多張圖片作文 (${imageUrls.length} 張)`,
          mime_type: 'image/jpeg',
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

      // 取得 auth token 用於 API 認證
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/essays', {
        method: 'POST',
        headers: authHeaders,
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
      setUploadProgress({ current: 0, total: 0 });
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
                <span className="text-sm text-muted-foreground ml-2">
                  （已選擇 {selectedFiles.length}/5 張）
                </span>
              </Label>

              {/* 上傳區域 */}
              {selectedFiles.length < 5 && (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer mb-4"
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
                    multiple
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-base font-medium mb-1">
                      點擊上傳或拖放圖片
                    </p>
                    <p className="text-sm text-muted-foreground">
                      支援 JPG、PNG、HEIC 格式，最大 50MB，最多 5 張
                    </p>
                  </label>
                </div>
              )}

              {/* 已選圖片列表（垂直排列）*/}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  {selectedFiles.map((fileItem, index) => (
                    <div
                      key={fileItem.id}
                      className="border border-border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* 拖拉手柄 */}
                        <div className="flex flex-col justify-between items-center">
                          <button
                            type="button"
                            onClick={() => index > 0 && moveFile(index, index - 1)}
                            disabled={index === 0 || isUploading}
                            className="p-1 hover:bg-background rounded disabled:opacity-30"
                            title="向上移動"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => index < selectedFiles.length - 1 && moveFile(index, index + 1)}
                            disabled={index === selectedFiles.length - 1 || isUploading}
                            className="p-1 hover:bg-background rounded disabled:opacity-30"
                            title="向下移動"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground rotate-180" />
                          </button>
                        </div>

                        {/* 圖片預覽 */}
                        <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                          <img
                            src={fileItem.preview}
                            alt={`預覽 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* 圖片資訊和註解 */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="text-sm font-medium truncate">
                              {fileItem.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(fileItem.file.size)}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor={`annotation-${fileItem.id}`} className="text-xs text-muted-foreground">
                              圖片註解（選填）
                            </Label>
                            <Input
                              id={`annotation-${fileItem.id}`}
                              type="text"
                              placeholder="例如：第一段、開頭..."
                              value={fileItem.annotation}
                              onChange={(e) => updateAnnotation(fileItem.id, e.target.value)}
                              disabled={isUploading}
                              className="text-sm mt-1"
                            />
                          </div>
                        </div>

                        {/* 移除按鈕 */}
                        <div>
                          <button
                            type="button"
                            onClick={() => removeFile(fileItem.id)}
                            disabled={isUploading}
                            className="p-2 hover:bg-destructive/10 rounded-lg text-destructive disabled:opacity-30"
                            title="移除圖片"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 上傳進度 */}
              {isUploading && uploadProgress.total > 0 && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      正在上傳圖片 {uploadProgress.current}/{uploadProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
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
                (submissionMode === 'image' && selectedFiles.length === 0) ||
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
