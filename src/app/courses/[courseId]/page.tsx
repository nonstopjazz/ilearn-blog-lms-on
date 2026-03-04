// 🎨 修正影片時長顯示 - 完整替換 src/app/courses/[courseId]/page.tsx 檔案

'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { BookOpen, User, Play, Clock, Users, Star, Tag, ArrowLeft, CheckCircle, PlayCircle, AlertCircle, XCircle, RefreshCw, Home, Download, Eye, FileText, FileImage, Music, Archive, Film, File, ChevronDown, ChevronUp } from 'lucide-react';

// 🎯 導入統一的 Navbar 組件
import Navbar from '@/components/Navbar';

// 🕐 時間格式化函數 - 將秒數轉換為 MM:SS 格式顯示
const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds === 0) {
    return '0:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  difficulty_level?: string;
  duration_hours?: number;
  student_count?: number;
  rating?: number;
  review_count?: number;
  instructor_name?: string;
  instructor_title?: string;
  instructor_experience?: string;
  created_at?: string;
  updated_at?: string;
}

// 🎯 修改 CourseLesson 介面，加入檔案附件
interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  lesson_type: string;
  video_duration?: number;
  order_index: number;
  is_preview: boolean;
  is_published: boolean;
  course_id: string;
  attachments?: FileResource[]; // 🎯 新增檔案附件
}

// 🎯 新增檔案資源介面
interface FileResource {
  id: string;
  name: string;
  type: 'pdf' | 'word' | 'excel' | 'image' | 'audio' | 'video' | 'archive' | 'other';
  url: string;
  size?: string;
  description?: string;
  uploaded_at: string;
}

// 🎨 安全檔案卡片組件 - 整合權限控制
const FileCard: React.FC<{
  file: FileResource;
  courseId: string;
  lessonId: string;
  user: any;
}> = ({ file, courseId, lessonId, user }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': 
        return { 
          icon: <FileText className="w-5 h-5" />, 
          color: 'bg-red-50 border-red-200', 
          textColor: 'text-red-700',
          bgColor: 'bg-red-100'
        };
      case 'word': 
        return { 
          icon: <FileText className="w-5 h-5" />, 
          color: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-100'
        };
      case 'excel': 
        return { 
          icon: <FileText className="w-5 h-5" />, 
          color: 'bg-green-50 border-green-200', 
          textColor: 'text-green-700',
          bgColor: 'bg-green-100'
        };
      case 'image': 
        return { 
          icon: <FileImage className="w-5 h-5" />, 
          color: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-100'
        };
      case 'audio': 
        return { 
          icon: <Music className="w-5 h-5" />, 
          color: 'bg-yellow-50 border-yellow-200', 
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        };
      case 'video': 
        return { 
          icon: <Film className="w-5 h-5" />, 
          color: 'bg-indigo-50 border-indigo-200', 
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-100'
        };
      case 'archive': 
        return { 
          icon: <Archive className="w-5 h-5" />, 
          color: 'bg-orange-50 border-orange-200', 
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-100'
        };
      default: 
        return { 
          icon: <File className="w-5 h-5" />, 
          color: 'bg-gray-50 border-gray-200', 
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const handleSecureDownload = async () => {
    // 檢查用戶登入狀態
    if (!user) {
      setError('請先登入才能下載檔案');
      return;
    }

    setIsDownloading(true);
    setError('');

    try {
      // 建立安全下載 URL
      const downloadParams = new URLSearchParams({
        url: file.url,
        courseId: courseId,
        lessonId: lessonId,
        fileName: file.name
      });

      const secureDownloadUrl = `/api/files/download?${downloadParams.toString()}`;
      
      console.log(`🔒 安全下載請求 - 檔案: ${file.name}`);

      // 檢查權限並開啟下載
      const response = await fetch(secureDownloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '下載失敗');
      }

      // 如果是重定向回應，手動開啟新視窗
      if (response.redirected) {
        window.open(response.url, '_blank');
      } else {
        // 直接重定向
        window.open(secureDownloadUrl, '_blank');
      }

      console.log(`✅ 檔案下載成功: ${file.name}`);

    } catch (err) {
      console.error('下載錯誤:', err);
      setError(err.message || '下載失敗，請稍後再試');
    } finally {
      setIsDownloading(false);
    }
  };

  const fileStyle = getFileIcon(file.type);

  return (
    <div className={`${fileStyle.color} border rounded-lg p-3 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center space-x-3">
        <div className={`${fileStyle.bgColor} p-2 rounded-lg flex items-center justify-center`}>
          {fileStyle.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${fileStyle.textColor} truncate text-sm`}>
            {file.name}
          </h4>
          
          {file.description && (
            <p className="text-gray-600 text-xs mt-1 line-clamp-1">
              {file.description}
            </p>
          )}
          
          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <span className={`${fileStyle.bgColor} ${fileStyle.textColor} px-2 py-0.5 rounded-full uppercase font-medium`}>
              {file.type}
            </span>
            {file.size && (
              <>
                <span>•</span>
                <span>{file.size}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {/* 🔒 安全下載按鈕 */}
          <button
            onClick={handleSecureDownload}
            disabled={isDownloading || !user}
            className={`
              flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${!user 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : isDownloading
                ? 'bg-blue-100 text-blue-600 cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }
            `}
            title={!user ? '請先登入' : isDownloading ? '下載中...' : '安全下載'}
          >
            {isDownloading ? (
              <>
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>下載中</span>
              </>
            ) : (
              <>
                {user ? (
                  <>
                    <Download className="w-3 h-3" />
                    <span>下載</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>請登入</span>
                  </>
                )}
              </>
            )}
          </button>

          {/* 錯誤提示 */}
          {error && (
            <div className="text-red-600 text-xs max-w-32 text-right">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🎯 可展開的課程單元組件 - 修正影片時長顯示
const LessonCard: React.FC<{
  lesson: CourseLesson;
  courseId: string;
  user: any;
}> = ({ lesson, courseId, user }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAttachments = lesson.attachments && lesson.attachments.length > 0;

  // 🔧 資料相容性處理：將舊格式 string[] 轉換為新格式 FileResource[]
  const normalizeAttachments = (attachments: any): FileResource[] => {
    if (!attachments) return [];
    
    // 如果是舊格式 (string[])，轉換為新格式
    if (Array.isArray(attachments) && typeof attachments[0] === 'string') {
      return attachments.map((url: string, index: number) => ({
        id: `legacy_${index}_${Date.now()}`,
        name: extractFileName(url),
        type: detectFileType(url, extractFileName(url)),
        url: url,
        uploaded_at: new Date().toISOString()
      }));
    }
    
    // 如果已經是新格式，直接返回
    return attachments as FileResource[];
  };

  const extractFileName = (url: string): string => {
    if (url.includes('drive.google.com')) return '從 Google Drive 分享的檔案';
    if (url.includes('dropbox.com')) {
      const match = url.match(/\/([^\/]+)\?/);
      if (match) return decodeURIComponent(match[1]);
      return '從 Dropbox 分享的檔案';
    }
    try {
      const urlObj = new URL(url);
      const fileName = urlObj.pathname.split('/').pop() || '未知檔案';
      return decodeURIComponent(fileName);
    } catch {
      return '未知檔案';
    }
  };

  const detectFileType = (url: string, fileName: string): 'pdf' | 'word' | 'excel' | 'image' | 'audio' | 'video' | 'archive' | 'other' => {
    const lowerName = fileName.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    if (lowerName.includes('.pdf') || lowerUrl.includes('pdf')) return 'pdf';
    if (lowerName.match(/\.(doc|docx)$/) || lowerUrl.includes('document')) return 'word';
    if (lowerName.match(/\.(xls|xlsx)$/) || lowerUrl.includes('spreadsheet')) return 'excel';
    if (lowerName.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/)) return 'image';
    if (lowerName.match(/\.(mp3|wav|m4a|aac|flac|ogg)$/)) return 'audio';
    if (lowerName.match(/\.(mp4|avi|mkv|mov|wmv|flv|webm)$/)) return 'video';
    if (lowerName.match(/\.(zip|rar|7z|tar|gz)$/)) return 'archive';
    
    return 'other';
  };

  const normalizedAttachments = normalizeAttachments(lesson.attachments);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 課程單元標題區 */}
      <div 
        className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => hasAttachments && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center flex-1">
          {lesson.is_preview ? (
            <PlayCircle className="h-5 w-5 text-green-600 mr-3" />
          ) : (
            <Play className="h-5 w-5 text-gray-400 mr-3" />
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">{lesson.title}</span>
              {lesson.is_preview && (
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  免費試看
                </span>
              )}
              {hasAttachments && (
                <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                  📎 {normalizedAttachments.length} 個檔案
                </span>
              )}
              {/* 🔒 權限指示器 */}
              {!user && hasAttachments && (
                <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                  🔒 需登入
                </span>
              )}
            </div>
            {lesson.description && (
              <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 🔧 修正：直接顯示 video_duration，不除以 60 */}
          <span className="text-sm text-gray-500">
            {lesson.video_duration ? formatDuration(lesson.video_duration) : '內容'}
          </span>
          {hasAttachments && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🎯 展開的檔案區域 - 使用安全下載 */}
      {hasAttachments && isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="mb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              📁 課程檔案 
              {!user && (
                <span className="text-red-600 text-xs ml-2">
                  (請先登入才能下載)
                </span>
              )}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {normalizedAttachments.map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                courseId={courseId}
                lessonId={lesson.id}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 🎨 優化的載入動畫組件
function LoadingSpinner({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
  );
}

// 🎨 骨架屏載入組件
function CourseSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 使用統一的 Navbar 組件 */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左側骨架 */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="w-3/4 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-4/5 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* 右側骨架 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse mb-6"></div>
              <div className="text-center space-y-4">
                <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 優化的錯誤頁面組件
function CourseErrorPage({ error, courseId, onRetry }: { error: string; courseId: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 使用統一的 Navbar 組件 */}
      <Navbar />
      
      <div className="flex items-center justify-center py-16">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* 錯誤圖標 */}
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
            </div>

            {/* 錯誤信息 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">課程暫時無法載入</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              課程 <span className="font-medium text-blue-600">{courseId}</span> 目前無法正常顯示，
              可能是課程正在準備中或系統暫時忙碌。
            </p>

            {/* 操作按鈕 */}
            <div className="space-y-4">
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重新載入課程
              </button>
              
              <div className="flex space-x-3">
                <Link
                  href="/courses"
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 w-4 mr-2" />
                  瀏覽其他課程
                </Link>
                
                <Link
                  href="/"
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  返回首頁
                </Link>
              </div>
            </div>

            {/* 建議課程 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">推薦課程</h3>
              <div className="space-y-2 text-sm">
                <Link href="/courses/course_001" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  React 基礎課程
                </Link>
                <Link href="/courses/course_002" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  JavaScript 進階
                </Link>
                <Link href="/courses/course_003" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  Node.js 後端開發
                </Link>
              </div>
            </div>

            {/* 聯絡支援 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>需要協助？</strong> 請聯絡客服或透過 
                <a href="mailto:support@example.com" className="underline hover:no-underline ml-1">
                  support@example.com
                </a> 回報問題
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  // 🔧 解包 params
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  
  // 主要狀態
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 申請相關狀態
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  // 🔧 開發模式檢查
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 載入用戶認證
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!error && user) {
          setUser(user);
        }
      } catch {
      }
    };

    loadUser();
  }, [isDevelopment]);

  // 🔥 核心功能：從資料庫動態載入課程資料
  const loadCourseData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
      
      if (isDevelopment) console.log('🔍 開始查詢課程:', courseId);

      // 方法1：從 courses 表格載入
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (!courseError && courseData) {
        if (isDevelopment) console.log('✅ 從 courses 表格載入課程:', courseData.title);
        setCourse(courseData);
      } else if (isDevelopment) {
        console.log('⚠️ courses 表格中找不到課程，嘗試從 course_lessons 推斷...');
      }

      // 🎯 方法2：從 course_lessons 載入課程單元（包含附件）
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index');

      if (!lessonsError && lessonsData && lessonsData.length > 0) {
        if (isDevelopment) console.log('✅ 載入到', lessonsData.length, '個課程單元');
        
        // 🎯 記錄檔案資訊
        const totalFiles = lessonsData.reduce((total, lesson) => {
          const attachments = lesson.attachments || [];
          return total + attachments.length;
        }, 0);
        
        if (isDevelopment && totalFiles > 0) {
          console.log('📁 課程包含', totalFiles, '個檔案附件');
        }
        
        setLessons(lessonsData);

        // 如果沒有課程資料，從 lessons 推斷
        if (!courseData) {
          const inferredCourse: Course = {
            id: courseId,
            title: `${courseId.toUpperCase().replace('_', ' ')} 課程`,
            description: `包含 ${lessonsData.length} 個精心設計的學習單元`,
            category: 'programming',
            difficulty_level: 'beginner',
            duration_hours: Math.round(lessonsData.reduce((total, lesson) => total + (lesson.video_duration || 0), 0) / 3600),
            student_count: 0,
            rating: 0,
            review_count: 0,
            instructor_name: '專業講師',
            instructor_title: '資深教育者',
            instructor_experience: '豐富教學經驗'
          };
          
          if (isDevelopment) console.log('🔧 從課程單元推斷課程資訊:', inferredCourse.title);
          setCourse(inferredCourse);
        }
      } else {
        // 🔧 處理邊界情況：有課程但沒有單元
        if (courseData) {
          if (isDevelopment) console.log('✅ 有課程資料但沒有課程單元');
          setLessons([]);
        } else {
          throw new Error('課程資料不存在或正在準備中');
        }
      }

    } catch (error) {
      if (isDevelopment) console.error('❌ 載入課程失敗:', error);
      setError(error.message || '載入課程失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, isDevelopment]);

  // 檢查申請狀態
  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!user || !course) return;
      
      try {
        const response = await fetch(`/api/course-requests?user_id=${user.id}&course_id=${courseId}`);
        const result = await response.json();
        
        if (result.success && result.request) {
          setRequestStatus(result.request.status);
          if (isDevelopment) console.log('📋 申請狀態:', result.request.status);
        }
      } catch (error) {
        // 靜默處理錯誤
      }
    };
    
    checkRequestStatus();
  }, [user, courseId, course, isDevelopment]);

  const handleCourseRequest = async () => {
    if (!user) {
      alert('請先登入');
      window.location.href = '/auth';
      return;
    }

    if (!course) {
      alert('課程載入中，請稍候');
      return;
    }

    setRequestLoading(true);

    try {
      // 取得 access token 用於 API 認證
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('登入狀態已過期，請重新登入');
        window.location.href = '/auth';
        return;
      }

      const requestData = {
        user_id: user.id,
        course_id: courseId,
        course_title: course.title,
        user_info: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '使用者',
          email: user.email
        }
      };

      const response = await fetch('/api/course-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      if (result.success) {
        setRequestStatus('pending');
        alert('申請已提交！我們會儘快審核您的申請。');
      } else {
        throw new Error(result.error || '申請失敗');
      }
    } catch (error) {
      alert(`申請失敗: ${error.message}`);
    } finally {
      setRequestLoading(false);
    }
  };

  const getButtonText = () => {
    switch (requestStatus) {
      case 'pending': return '審核中...';
      case 'approved': return '已核准';
      case 'rejected': return '申請未通過';
      default: return '申請加入課程';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return '初級';
      case 'intermediate': return '中級';
      case 'advanced': return '進階';
      default: return '未分級';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'programming': return '程式設計';
      case 'web-design': return '網頁設計';
      case 'data-science': return '數據科學';
      case 'design': return 'UI/UX設計';
      default: return '其他';
    }
  };

  // 🎯 計算檔案統計
  const totalFiles = lessons.reduce((total, lesson) => {
    const attachments = lesson.attachments || [];
    return total + attachments.length;
  }, 0);

  // 🎨 錯誤狀態 - 優化的錯誤頁面
  if (error) {
    return <CourseErrorPage error={error} courseId={courseId} onRetry={loadCourseData} />;
  }

  // 🎨 載入狀態 - 骨架屏
  if (loading || !course) {
    return <CourseSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🎯 使用統一的 Navbar 組件，並傳遞用戶資訊 */}
      <Navbar user={user} />

      {/* 返回按鈕 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/courses"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回課程列表
        </Link>
      </div>

      {/* 🎨 成功狀態指示器 */}
      {course && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
              <span className="text-green-800 text-sm">
                ✅ 課程載入成功：{course.title} 
                {lessons.length > 0 && ` (${lessons.length} 個學習單元)`}
                {totalFiles > 0 && ` | 📁 ${totalFiles} 個檔案資源`}
                {lessons.length === 0 && ' (課程準備中)'}
                {!user && totalFiles > 0 && ' | 🔒 檔案下載需登入'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左側：課程資訊 */}
          <div className="lg:col-span-2">
            {/* 課程標題區域 */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Tag className="h-4 w-4 mr-1" />
                  {getCategoryLabel(course.category || 'other')}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {getDifficultyLabel(course.difficulty_level || 'beginner')}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  免費課程
                </span>
                {totalFiles > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    📁 {totalFiles} 個檔案
                  </span>
                )}
                {!user && totalFiles > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    🔒 需登入下載
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-xl text-gray-600 mb-6">{course.description}</p>

              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {course.duration_hours || 0} 小時
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {course.student_count?.toLocaleString() || '0'} 學員
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  {course.rating || '5.0'} ({course.review_count || '0'} 評價)
                </div>
              </div>
            </div>

            {/* 課程介紹 */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">課程介紹</h2>
              <p className="text-gray-700 leading-relaxed">
                {course.description || '這是一門精心設計的課程，將幫助您掌握相關技能和知識。課程內容經過專業規劃，適合不同程度的學習者。'}
              </p>
            </div>

            {/* 講師資訊 */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">講師介紹</h2>
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.instructor_name || '專業講師'}</h3>
                  <p className="text-gray-600">{course.instructor_title || '專業教育者'}</p>
                  <p className="text-sm text-gray-500">{course.instructor_experience || '豐富教學經驗'}</p>
                </div>
              </div>
            </div>

            {/* 🎯 課程大綱 - 修正影片時長顯示 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">課程大綱</h2>
              
              {lessons.length > 0 ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        課程內容 ({lessons.length} 個單元)
                        {totalFiles > 0 && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            包含 {totalFiles} 個檔案資源
                          </span>
                        )}
                        {/* 🔒 權限狀態指示 */}
                        {!user && totalFiles > 0 && (
                          <span className="ml-2 text-sm font-normal text-red-600">
                            🔒 檔案下載需要登入
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {lessons.map((lesson) => (
                          <LessonCard 
                            key={lesson.id} 
                            lesson={lesson} 
                            courseId={courseId}
                            user={user}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">課程內容準備中</h3>
                  <p className="text-gray-600 mb-4">我們正在精心準備課程內容，敬請期待！</p>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    預計近期上線
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右側：申請區域 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8 hover:shadow-xl transition-shadow">
              {/* 課程影片預覽 */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mb-6 overflow-hidden">
                <Play className="h-16 w-16 text-white z-10" />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-2 right-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  課程預覽
                </div>
              </div>

              {/* 課程狀態 */}
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  免費課程
                </div>
                <div className="text-sm text-gray-500">
                  申請加入後即可開始學習
                </div>
              </div>

              {/* 申請按鈕 */}
              <div className="space-y-3">
                <button
                  onClick={handleCourseRequest}
                  disabled={requestLoading || requestStatus === 'approved'}
                  className={`w-full py-3 px-6 rounded-lg transition-all font-semibold text-lg flex items-center justify-center ${
                    requestStatus === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                      : requestStatus === 'approved'
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : requestStatus === 'rejected'
                      ? 'bg-red-100 text-red-800 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  }`}
                >
                  {requestLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">處理中...</span>
                    </>
                  ) : (
                    getButtonText()
                  )}
                </button>
                
                {requestStatus === 'approved' && (
                  <button
                    onClick={() => window.location.href = `/courses/${course.id}/learn`}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-all font-semibold hover:shadow-lg"
                  >
                    開始學習
                  </button>
                )}
              </div>

              {/* 申請狀態說明 */}
              {requestStatus && (
                <div className="mt-6 p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2">申請狀態</h3>
                  <div className="text-sm">
                    {requestStatus === 'pending' && (
                      <p className="text-yellow-700">📋 您的申請正在審核中，請耐心等候</p>
                    )}
                    {requestStatus === 'approved' && (
                      <p className="text-green-700">✅ 申請已通過！您現在可以開始學習</p>
                    )}
                    {requestStatus === 'rejected' && (
                      <p className="text-red-700">❌ 申請未通過，如有疑問請聯繫管理員</p>
                    )}
                  </div>
                </div>
              )}

              {/* 🎯 課程包含內容 - 加入檔案統計 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">課程包含</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {course.duration_hours || 0} 小時影片內容
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {lessons.length} 個學習單元
                  </div>
                  {totalFiles > 0 && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {totalFiles} 個課程檔案資源
                      {!user && (
                        <span className="ml-1 text-red-600 text-xs">(需登入)</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    完課證書
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    講師問答支援
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    學習進度追蹤
                  </div>
                </div>
              </div>

              {/* 申請須知 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">申請須知</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• 提交申請後會進入審核程序</li>
                  <li>• 審核時間通常為 1-2 個工作天</li>
                  <li>• 審核結果會以信箱通知</li>
                  <li>• 獲得權限後可無限次觀看</li>
                  {totalFiles > 0 && (
                    <li>• 課程包含可下載的檔案資源（需登入）</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}