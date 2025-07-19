'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Package, AlertCircle, CheckCircle, Eye, Download } from 'lucide-react';

interface Course {
  id: string;
  title: string;
}

interface QuestionType {
  [key: string]: number;
}

interface Question {
  id: string;
  type: string;
  question: string;
  hasImage: boolean;
  options?: string[];
  correctAnswer: string;
  points: number;
}

interface PreviewData {
  totalQuestions: number;
  questionTypes: QuestionType;
  questions: Question[];
  imagesFound: number;
  errors: string[];
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const QuizUploadPage: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [quizDescription, setQuizDescription] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 模擬課程資料
  const courses: Course[] = [
    { id: 'course_001', title: 'React 基礎課程' },
    { id: 'course_002', title: 'JavaScript 進階' },
    { id: 'course_003', title: 'Node.js 後端開發' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        setUploadedFile(file);
        setUploadStatus('idle');
        setErrorMessages([]);
      } else {
        setErrorMessages(['請上傳 ZIP 格式的檔案']);
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !selectedCourse || !quizTitle) {
      setErrorMessages(['請填寫所有必要欄位並選擇檔案']);
      return;
    }

    setUploadStatus('uploading');
    setErrorMessages([]);

    try {
      const formData = new FormData();
      formData.append('courseId', selectedCourse);
      formData.append('title', quizTitle);
      formData.append('description', quizDescription);
      formData.append('zipFile', uploadedFile);
      formData.append('preview', 'true');

      const response = await fetch('/api/quiz/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // 顯示詳細錯誤信息
        let errorMessages = [result.error || '上傳失敗'];
        
        if (result.details) {
          errorMessages.push(`詳細信息：${result.details}`);
        }
        
        if (result.foundFiles && result.foundFiles.length > 0) {
          errorMessages.push(`ZIP檔案中找到的檔案：${result.foundFiles.join(', ')}`);
        }
        
        if (result.parseErrors && result.parseErrors.length > 0) {
          errorMessages.push('解析錯誤詳細信息：');
          errorMessages.push(...result.parseErrors.slice(0, 10));
          if (result.totalErrors > 10) {
            errorMessages.push(`...還有 ${result.totalErrors - 10} 個錯誤`);
          }
        }
        
        setErrorMessages(errorMessages);
        setUploadStatus('error');
        return;
      }

      // 檢查是否有解析錯誤
      if (result.preview && result.preview.errors && result.preview.errors.length > 0) {
        setErrorMessages([
          '檔案解析有錯誤：',
          ...result.preview.errors.slice(0, 10), // 只顯示前10個錯誤
          ...(result.preview.errors.length > 10 ? [`...還有 ${result.preview.errors.length - 10} 個錯誤`] : [])
        ]);
      }

      setPreviewData(result.preview);
      setUploadStatus('success');
      
    } catch (error) {
      setUploadStatus('error');
      setErrorMessages([error instanceof Error ? error.message : '未知錯誤']);
    }
  };

  const handleConfirmImport = async () => {
    if (!uploadedFile || !selectedCourse || !quizTitle) {
      return;
    }

    try {
      setUploadStatus('processing');
      
      const formData = new FormData();
      formData.append('courseId', selectedCourse);
      formData.append('title', quizTitle);
      formData.append('description', quizDescription);
      formData.append('zipFile', uploadedFile);
      formData.append('preview', 'false');

      const response = await fetch('/api/quiz/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '導入失敗');
      }
      
      alert('測驗題目已成功導入！');
      
      // 重置表單
      setUploadedFile(null);
      setPreviewData(null);
      setUploadStatus('idle');
      setSelectedCourse('');
      setQuizTitle('');
      setQuizDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      setUploadStatus('error');
      setErrorMessages([error instanceof Error ? error.message : '導入失敗']);
    }
  };

  const downloadTemplate = () => {
    // 創建Excel範本內容（使用中文欄位名稱）
    const headers = [
      '題號', '題型', '題目', '選項A', '選項B', '選項C', '選項D', 
      '正確答案', '分數', '解析', '圖片檔名'
    ];
    
    const sampleData = [
      [
        '1', 
        '單選題', 
        'React 中的 useState 是什麼？', 
        'React Hook', 
        'React 組件', 
        'React 方法', 
        'React 屬性',
        'A',
        '10',
        'useState 是 React 的一個 Hook',
        ''
      ],
      [
        '2',
        '單選題',
        'JavaScript 的數據類型中哪一個是原始類型？',
        'Object',
        'Array', 
        'String',
        'Function',
        'C',
        '5',
        'String 是原始數據類型',
        ''
      ],
      [
        '3',
        '單選題',
        'HTML 是編程語言嗎？',
        '是',
        '否',
        '',
        '',
        'B',
        '5',
        'HTML 是標記語言',
        ''
      ]
    ];

    // 創建CSV內容
    const csvContent = [
      headers.map(header => `"${header}"`).join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 創建BOM以支持中文
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // 創建並下載檔案
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', '測驗題目範本.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">測驗題目上傳</h1>
        <p className="text-gray-600 mt-1">批量上傳測驗題目，支援 Excel + 圖片的 ZIP 格式</p>
      </div>

      {/* 下載範本區域 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Excel 範本檔案</h3>
              <p className="text-sm text-blue-700">下載標準格式範本，了解正確的填寫方式</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>下載範本</span>
          </button>
        </div>
      </div>

      {/* 基本設定 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">測驗基本設定</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇課程 *
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">請選擇課程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              測驗標題 *
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="例：第一章測驗"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            測驗說明
          </label>
          <textarea
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            placeholder="測驗說明和注意事項..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 檔案上傳區域 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">上傳測驗檔案</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {uploadedFile ? (
            <div className="space-y-4">
              <Package className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  檔案大小: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                重新選擇檔案
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">上傳 ZIP 檔案</p>
                <p className="text-sm text-gray-500">
                  包含 questions.csv (或 questions.xlsx) 和圖片檔案
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                選擇檔案
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 錯誤訊息 */}
      {errorMessages.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">上傳錯誤</h3>
              <div className="mt-2 text-sm text-red-700">
                {errorMessages.map((error, index) => (
                  <div key={index} className="mb-1">
                    {error.includes('第') && error.includes('行') ? (
                      <div className="bg-red-100 p-2 rounded border-l-4 border-red-400">
                        <span className="font-medium">行號錯誤：</span>{error}
                      </div>
                    ) : (
                      <div>• {error}</div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 修復建議 */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-900 mb-2">修復建議：</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 確保CSV檔案每行都有11個欄位（用逗號分隔）</li>
                  <li>• 檢查是否有空白行或格式錯誤的行</li>
                  <li>• 避免在文字內容中使用換行符</li>
                  <li>• 使用UTF-8編碼保存CSV檔案</li>
                  <li>• 建議使用純文字編輯器而非Excel編輯CSV</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 上傳按鈕 */}
      {uploadedFile && uploadStatus === 'idle' && (
        <div className="text-center">
          <button
            onClick={handleUpload}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            開始上傳並解析
          </button>
        </div>
      )}

      {/* 處理狀態 */}
      {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-900 font-medium">
            {uploadStatus === 'uploading' ? '正在上傳檔案...' : '正在解析測驗內容...'}
          </p>
        </div>
      )}

      {/* 預覽結果 */}
      {uploadStatus === 'success' && previewData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">解析結果預覽</h2>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">解析成功</span>
            </div>
          </div>

          {/* 統計資訊 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{previewData.totalQuestions}</div>
              <div className="text-sm text-blue-700">總題數</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{previewData.imagesFound}</div>
              <div className="text-sm text-green-700">圖片檔案</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(previewData.questionTypes).length}
              </div>
              <div className="text-sm text-purple-700">題型種類</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{previewData.errors.length}</div>
              <div className="text-sm text-orange-700">錯誤數量</div>
            </div>
          </div>

          {/* 題型分布 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">題型分布</h3>
            <div className="space-y-2">
              {Object.entries(previewData.questionTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-medium text-gray-900">{count} 題</span>
                </div>
              ))}
            </div>
          </div>

          {/* 題目預覽 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">題目預覽（前3題）</h3>
            <div className="space-y-4">
              {previewData.questions.slice(0, 3).map((question, index) => (
                <div key={question.id} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-blue-600">{question.id}</span>
                      <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">{question.type}</span>
                      {question.hasImage && (
                        <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                          有圖片
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{question.points} 分</span>
                  </div>
                  <p className="text-gray-900 mb-2">{question.question}</p>
                  {question.options && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="bg-gray-50 p-2 rounded">
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-green-600">
                    正確答案: {question.correctAnswer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 確認導入 */}
          <div className="text-center pt-4 border-t">
            <button
              onClick={handleConfirmImport}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              確認導入測驗題目
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizUploadPage;