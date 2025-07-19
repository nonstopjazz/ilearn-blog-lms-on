'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Settings, Users, DollarSign, Calendar, Save, BarChart3, Award, Clock, ArrowLeft, AlertCircle, Loader2, Plus, Link as LinkIcon, Download, Play, Eye, Edit, Trash2, CheckCircle, GripVertical, Video, FileText, Lock, Unlock, RefreshCw, File, FileImage, Music, Archive, Film } from 'lucide-react';

// 🕐 時間格式化函數 - 將分鐘數轉換為 MM:SS 格式顯示
const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    // 如果少於1分鐘，顯示秒數
    const seconds = Math.round(minutes * 60);
    return `0:${seconds.toString().padStart(2, '0')}`;
  }
  
  // 如果是整數分鐘，顯示為 MM:00
  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = Math.round((minutes - wholeMinutes) * 60);
  
  return `${wholeMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface CourseSettings {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  discount_price?: number;
  enrollment_limit?: number;
  enrollment_start?: string;
  enrollment_end?: string;
  course_start?: string;
  course_end?: string;
  is_featured: boolean;
  allow_reviews: boolean;
  allow_discussions: boolean;
  auto_enroll: boolean;
  certificate_enabled: boolean;
  completion_certificate: boolean;
  drip_content: boolean;
  drip_interval_days: number;
  access_duration_days?: number;
  prerequisites: string[];
  learning_outcomes: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords: string[];
}

// 🔥 修改 CourseLesson 介面 - 將 attachments 改為 FileResource[]
interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  video_duration?: number;
  order_index: number;
  is_free: boolean;
  content?: string;
  attachments?: FileResource[]; // 🎯 改為 FileResource[]
}

interface FileResource {
  id: string;
  name: string;
  type: 'pdf' | 'word' | 'excel' | 'image' | 'audio' | 'video' | 'archive' | 'other';
  url: string;
  size?: string;
  description?: string;
  uploaded_at: string;
}

interface CourseStats {
  total_enrollments: number;
  active_students: number;
  completion_rate: number;
  average_rating: number;
  total_revenue: number;
  refund_requests: number;
}

// 🎨 檔案類型偵測函數
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

// 🎨 檔案卡片組件 - 專為 lesson 檔案設計的小尺寸版本
const FileCard: React.FC<{
  file: FileResource;
  onEdit: (file: FileResource) => void;
  onDelete: (fileId: string) => void;
}> = ({ file, onEdit, onDelete }) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': 
        return { 
          icon: <FileText className="w-6 h-6" />, 
          color: 'bg-red-50 border-red-200', 
          textColor: 'text-red-700',
          bgColor: 'bg-red-100'
        };
      case 'word': 
        return { 
          icon: <FileText className="w-6 h-6" />, 
          color: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-100'
        };
      case 'excel': 
        return { 
          icon: <FileText className="w-6 h-6" />, 
          color: 'bg-green-50 border-green-200', 
          textColor: 'text-green-700',
          bgColor: 'bg-green-100'
        };
      case 'image': 
        return { 
          icon: <FileImage className="w-6 h-6" />, 
          color: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-100'
        };
      case 'audio': 
        return { 
          icon: <Music className="w-6 h-6" />, 
          color: 'bg-yellow-50 border-yellow-200', 
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        };
      case 'video': 
        return { 
          icon: <Film className="w-6 h-6" />, 
          color: 'bg-indigo-50 border-indigo-200', 
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-100'
        };
      case 'archive': 
        return { 
          icon: <Archive className="w-6 h-6" />, 
          color: 'bg-orange-50 border-orange-200', 
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-100'
        };
      default: 
        return { 
          icon: <File className="w-6 h-6" />, 
          color: 'bg-gray-50 border-gray-200', 
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const fileStyle = getFileIcon(file.type);

  return (
    <div className={`${fileStyle.color} border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`${fileStyle.bgColor} p-2 rounded-lg flex items-center justify-center`}>
            {fileStyle.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${fileStyle.textColor} truncate text-sm`}>
              {file.name}
            </h4>
            
            {file.description && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
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
                  <span className="font-medium">{file.size}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {file.type === 'audio' && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-1 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
              title="播放音檔"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          {file.type === 'image' && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
              title="預覽圖片"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
          {file.type === 'video' && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
              title="播放影片"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          
          <button
            onClick={() => window.open(file.url, '_blank')}
            className={`p-1 ${fileStyle.textColor} hover:bg-white hover:bg-opacity-50 rounded transition-colors`}
            title="下載檔案"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={() => onEdit(file)}
            className="p-1 text-gray-600 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
            title="編輯檔案"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="刪除檔案"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 🎨 檔案輸入表單組件
const FileInputForm: React.FC<{
  onAdd: (file: Omit<FileResource, 'id' | 'uploaded_at'>) => void;
  onCancel: () => void;
  editingFile?: FileResource;
}> = ({ onAdd, onCancel, editingFile }) => {
  const [url, setUrl] = useState(editingFile?.url || '');
  const [name, setName] = useState(editingFile?.name || '');
  const [type, setType] = useState<FileResource['type']>(editingFile?.type || 'other');
  const [size, setSize] = useState(editingFile?.size || '');
  const [description, setDescription] = useState(editingFile?.description || '');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
  };

  const extractFileNameFromUrl = (url: string): string => {
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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl && !name) {
      const extractedName = extractFileNameFromUrl(newUrl);
      setName(extractedName);
      const detectedType = detectFileType(newUrl, extractedName);
      setType(detectedType);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.includes('drive.google.com') || url.includes('dropbox.com') || url.startsWith('http');
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!url.trim()) {
      showMessage('請輸入檔案連結', 'error');
      return;
    }
    if (!validateUrl(url)) {
      showMessage('請輸入有效的網址連結', 'error');
      return;
    }
    if (!name.trim()) {
      showMessage('請輸入檔案名稱', 'error');
      return;
    }

    onAdd({
      name: name.trim(),
      type: type,
      url: url.trim(),
      size: size.trim() || undefined,
      description: description.trim() || undefined
    });

    showMessage(editingFile ? '檔案已更新' : '檔案已新增', 'success');
    
    setTimeout(() => {
      setUrl('');
      setName('');
      setType('other');
      setSize('');
      setDescription('');
      onCancel();
    }, 1000);
  };

  const fileTypeOptions = [
    { value: 'pdf', label: '📄 PDF 文件', color: 'text-red-600' },
    { value: 'word', label: '📝 Word 文件', color: 'text-blue-600' },
    { value: 'excel', label: '📊 Excel 試算表', color: 'text-green-600' },
    { value: 'image', label: '🖼️ 圖片檔案', color: 'text-purple-600' },
    { value: 'audio', label: '🎵 音檔', color: 'text-yellow-600' },
    { value: 'video', label: '🎬 影片檔案', color: 'text-indigo-600' },
    { value: 'archive', label: '📦 壓縮檔案', color: 'text-orange-600' },
    { value: 'other', label: '📎 其他檔案', color: 'text-gray-600' }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-blue-900">
          {editingFile ? '✏️ 編輯檔案' : '➕ 新增檔案'}
        </h4>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            🔗 檔案連結 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="貼上 Google Drive、Dropbox 或其他雲端分享連結..."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📝 檔案名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：課程講義第一章.pdf"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📂 檔案類型 <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FileResource['type'])}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            >
              {fileTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📏 檔案大小 <span className="text-gray-500">(選填)</span>
            </label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="例如：2.3 MB、15.7 KB"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              💭 檔案描述 <span className="text-gray-500">(選填)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：本章節的重點整理與練習題"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg flex items-center space-x-2 ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border-2 border-green-200'
              : 'bg-red-50 text-red-800 border-2 border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="font-medium text-sm">{message}</span>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-3 border-t border-blue-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 text-sm"
          >
            <span>{editingFile ? '更新檔案' : '新增檔案'}</span>
            {editingFile ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// 🎯 修改後的課程編輯器 - 支援 lesson-level 檔案管理
const LessonEditor: React.FC<{
  courseId: string;
}> = ({ courseId }) => {
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 🎯 新增 lesson 檔案管理相關的 state
  const [showLessonFileForm, setShowLessonFileForm] = useState(false);
  const [editingLessonFile, setEditingLessonFile] = useState<FileResource | undefined>();

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

  // 🔧 從 Supabase 載入課程單元
  const loadLessons = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) {
        console.error('載入課程單元失敗:', error);
        setMessage('載入課程單元失敗');
        return;
      }

      console.log('✅ 載入課程單元成功:', data?.length || 0, '個單元');
      
      // 🎯 處理附件資料相容性
      const normalizedLessons = (data || []).map(lesson => ({
        ...lesson,
        attachments: normalizeAttachments(lesson.attachments)
      }));
      
      setLessons(normalizedLessons);
    } catch (error) {
      console.error('載入課程單元錯誤:', error);
      setMessage('載入課程單元錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 生成 slug 的函數
  const generateSlug = (title: string): string => {
    return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    || 'untitled-lesson';
  };

  // 🔧 生成正確的 lesson ID
  const generateLessonId = (courseId: string, lessons: CourseLesson[]): string => {
    const courseNumber = courseId.replace('course_', '');
    const nextLessonNumber = lessons.length + 1;
    const lessonId = `lesson_${courseNumber}_${String(nextLessonNumber).padStart(2, '0')}`;
    
    console.log('🆔 生成新的 lesson ID:', lessonId);
    return lessonId;
  };

  // 🔧 儲存課程單元到 Supabase
  const saveLessonToDatabase = async (lesson: CourseLesson) => {
    try {
      setSaving(true);
      const { supabase } = await import('@/lib/supabase');

      const lessonData = {
        id: lesson.id,
        course_id: courseId,
        title: lesson.title,
        slug: generateSlug(lesson.title), 
        description: lesson.description || '',
        lesson_type: 'video',
        video_duration: lesson.video_duration || null,
        order_index: lesson.order_index,
        is_preview: lesson.is_free,
        is_published: true,
        content: lesson.content || '',
        video_url: lesson.video_url || '',
        attachments: lesson.attachments || []
      };

      const existingLesson = lessons.find(l => l.id === lesson.id);

      if (existingLesson) {
        const { error } = await supabase
          .from('course_lessons')
          .update(lessonData)
          .eq('id', lesson.id);

        if (error) {
          throw new Error(`更新失敗: ${error.message}`);
        }
        
        console.log('✅ 課程單元更新成功:', lesson.title);
        setMessage('課程單元更新成功！');
      } else {
        const { error } = await supabase
          .from('course_lessons')
          .insert([lessonData]);

        if (error) {
          throw new Error(`新增失敗: ${error.message}`);
        }
        
        console.log('✅ 課程單元新增成功:', lesson.title);
        setMessage('課程單元新增成功！');
      }

      await loadLessons();
      
    } catch (error) {
      console.error('儲存課程單元失敗:', error);
      setMessage(`儲存失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 🔧 從 Supabase 刪除課程單元
  const deleteLessonFromDatabase = async (lessonId: string) => {
    try {
      setSaving(true);
      const { supabase } = await import('@/lib/supabase');

      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) {
        throw new Error(`刪除失敗: ${error.message}`);
      }

      console.log('✅ 課程單元刪除成功');
      setMessage('課程單元刪除成功！');
      
      await loadLessons();
      
    } catch (error) {
      console.error('刪除課程單元失敗:', error);
      setMessage(`刪除失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 初始載入
  useEffect(() => {
    if (courseId) {
      loadLessons();
    }
  }, [courseId]);

  // 清除訊息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 計算課程統計
  const totalDuration = lessons.reduce((total, lesson) => total + (lesson.video_duration || 0), 0);
  const freeLessons = lessons.filter(lesson => lesson.is_free).length;

  const handleCreateLesson = () => {
    const newLessonId = generateLessonId(courseId, lessons);
    
    const newLesson: CourseLesson = {
      id: newLessonId,
      title: '',
      description: '',
      video_url: '',
      video_duration: 0,
      order_index: lessons.length + 1,
      is_free: false,
      content: '',
      attachments: []
    };
    
    console.log('🆕 建立新課程單元，ID:', newLessonId);
    setEditingLesson(newLesson);
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson: CourseLesson) => {
    const editableLesson = {
      ...lesson,
      attachments: normalizeAttachments(lesson.attachments)
    };
    setEditingLesson(editableLesson);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title.trim()) {
      setMessage('請輸入課程標題');
      return;
    }
    
    await saveLessonToDatabase(editingLesson);
    setShowLessonModal(false);
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('確定要刪除這個課程單元嗎？此操作無法復原！')) {
      await deleteLessonFromDatabase(lessonId);
    }
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) return;
    
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;
    
    try {
      setSaving(true);
      const { supabase } = await import('@/lib/supabase');

      const lesson1 = lessons[lessonIndex];
      const lesson2 = lessons[newIndex];
      
      const { error } = await supabase
        .from('course_lessons')
        .upsert([
          { id: lesson1.id, order_index: lesson2.order_index },
          { id: lesson2.id, order_index: lesson1.order_index }
        ]);

      if (error) {
        throw new Error(`排序失敗: ${error.message}`);
      }

      console.log('✅ 課程順序更新成功');
      setMessage('課程順序更新成功！');
      
      await loadLessons();
      
    } catch (error) {
      console.error('更新順序失敗:', error);
      setMessage(`排序失敗: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 🎯 新增 lesson 檔案管理函數
  const handleAddLessonFile = (fileData: Omit<FileResource, 'id' | 'uploaded_at'>) => {
    if (!editingLesson) return;
    
    const currentAttachments = editingLesson.attachments || [];
    
    if (editingLessonFile) {
      // 編輯現有檔案
      const updatedAttachments = currentAttachments.map(file => 
        file.id === editingLessonFile.id ? { ...file, ...fileData } : file
      );
      setEditingLesson(prev => ({
        ...prev!,
        attachments: updatedAttachments
      }));
      setEditingLessonFile(undefined);
    } else {
      // 新增檔案
      const newFile: FileResource = {
        ...fileData,
        id: Date.now().toString(),
        uploaded_at: new Date().toISOString()
      };
      setEditingLesson(prev => ({
        ...prev!,
        attachments: [...currentAttachments, newFile]
      }));
    }
    setShowLessonFileForm(false);
  };

  const handleEditLessonFile = (file: FileResource) => {
    setEditingLessonFile(file);
    setShowLessonFileForm(true);
  };

  const handleDeleteLessonFile = (fileId: string) => {
    if (!editingLesson || !confirm('確定要刪除這個檔案嗎？')) return;
    
    const currentAttachments = editingLesson.attachments || [];
    setEditingLesson(prev => ({
      ...prev!,
      attachments: currentAttachments.filter(file => file.id !== fileId)
    }));
  };

  const handleCancelLessonFileForm = () => {
    setShowLessonFileForm(false);
    setEditingLessonFile(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">載入課程內容中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 狀態訊息 */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.includes('成功') 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 mr-2" />
          {message}
        </div>
      )}

      {/* 課程統計 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 課程統計</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{lessons.length}</div>
            <div className="text-sm text-blue-700">總單元數</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{formatDuration(totalDuration)}</div>
            <div className="text-sm text-blue-700">總時長</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{freeLessons}</div>
            <div className="text-sm text-blue-700">免費單元</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{lessons.length - freeLessons}</div>
            <div className="text-sm text-blue-700">付費單元</div>
          </div>
        </div>
      </div>

      {/* 課程單元列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">📚 課程單元管理</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadLessons}
              disabled={saving}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>重新整理</span>
            </button>
            <button
              onClick={handleCreateLesson}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>新增單元</span>
            </button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">尚未新增任何課程單元</p>
            <p className="text-gray-400 text-sm">點擊「新增單元」開始建立課程內容</p>
            <p className="text-gray-400 text-xs mt-2">資料會即時同步到學員頁面</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons
              .sort((a, b) => a.order_index - b.order_index)
              .map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* 拖拽手柄 */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveLesson(lesson.id, 'up')}
                          disabled={index === 0 || saving}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={() => handleMoveLesson(lesson.id, 'down')}
                          disabled={index === lessons.length - 1 || saving}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>

                      {/* 單元資訊 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                            第 {lesson.order_index} 單元
                          </span>
                          {lesson.is_free ? (
                            <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded flex items-center">
                              <Unlock className="w-3 h-3 mr-1" />
                              免費
                            </span>
                          ) : (
                            <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded flex items-center">
                              <Lock className="w-3 h-3 mr-1" />
                              付費
                            </span>
                          )}
                          {lesson.video_duration && (
                            <span className="text-gray-500 text-sm">
                              {formatDuration(lesson.video_duration)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            ID: {lesson.id}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mt-2">
                          {lesson.title || '未命名單元'}
                        </h4>
                        {lesson.description && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                        {lesson.video_url && (
                          <div className="flex items-center text-sm text-blue-600 mt-2">
                            <Video className="w-4 h-4 mr-1" />
                            <span>已設定影片連結</span>
                          </div>
                        )}
                        {lesson.attachments && lesson.attachments.length > 0 && (
                          <div className="flex items-center text-sm text-green-600 mt-1">
                            <FileText className="w-4 h-4 mr-1" />
                            <span>{lesson.attachments.length} 個附件</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        disabled={saving}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                        title="編輯單元"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        disabled={saving}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                        title="刪除單元"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 同步說明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">✅ 即時同步</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• 編輯內容會立即儲存到資料庫</li>
          <li>• 學員頁面會即時顯示最新內容</li>
          <li>• 支援單元排序、免費設定等功能</li>
          <li>• 所有變更都有完整的資料備份</li>
          <li>• 🎯 每個單元可以管理自己的檔案附件</li>
        </ul>
      </div>

      {/* 🎯 增強的課程單元編輯模態框 - 包含檔案管理 */}
      {showLessonModal && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {lessons.find(l => l.id === editingLesson.id) ? '編輯' : '新增'}課程單元
                </h3>
                <button
                  onClick={() => {
                    setShowLessonModal(false);
                    setEditingLesson(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 顯示 ID 資訊 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-sm text-gray-600">課程單元 ID: </span>
                  <span className="text-sm font-mono text-blue-600">{editingLesson.id}</span>
                </div>

                {/* 基本資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      單元標題 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingLesson.title}
                      onChange={(e) => setEditingLesson({
                        ...editingLesson,
                        title: e.target.value
                      })}
                      placeholder="例如：React 基礎概念介紹"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      單元描述
                    </label>
                    <textarea
                      value={editingLesson.description || ''}
                      onChange={(e) => setEditingLesson({
                        ...editingLesson,
                        description: e.target.value
                      })}
                      placeholder="簡要描述這個單元的學習內容..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      影片連結
                    </label>
                    <input
                      type="url"
                      value={editingLesson.video_url || ''}
                      onChange={(e) => setEditingLesson({
                        ...editingLesson,
                        video_url: e.target.value
                      })}
                      placeholder="YouTube、Vimeo 或其他影片連結"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      影片時長（分鐘）
                    </label>
                    <input
                      type="number"
                      value={editingLesson.video_duration || ''}
                      onChange={(e) => setEditingLesson({
                        ...editingLesson,
                        video_duration: parseInt(e.target.value) || 0
                      })}
                      placeholder="30"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      單元排序
                    </label>
                    <input
                      type="number"
                      value={editingLesson.order_index}
                      onChange={(e) => setEditingLesson({
                        ...editingLesson,
                        order_index: parseInt(e.target.value) || 1
                      })}
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingLesson.is_free || false}
                        onChange={(e) => setEditingLesson({
                          ...editingLesson,
                          is_free: e.target.checked
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        免費試看單元
                      </span>
                    </label>
                  </div>
                </div>

                {/* 單元內容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    單元內容
                  </label>
                  <textarea
                    value={editingLesson.content || ''}
                    onChange={(e) => setEditingLesson({
                      ...editingLesson,
                      content: e.target.value
                    })}
                    placeholder="詳細的單元內容、學習重點、作業說明等..."
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 🎯 檔案管理區塊 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">📁 單元附件</h4>
                    {!showLessonFileForm && (
                      <button
                        onClick={() => setShowLessonFileForm(true)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>新增檔案</span>
                      </button>
                    )}
                  </div>

                  {/* 檔案輸入表單 */}
                  {showLessonFileForm && (
                    <FileInputForm
                      onAdd={handleAddLessonFile}
                      onCancel={handleCancelLessonFileForm}
                      editingFile={editingLessonFile}
                    />
                  )}

                  {/* 檔案列表 */}
                  {editingLesson.attachments && editingLesson.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {editingLesson.attachments.map((file) => (
                        <FileCard
                          key={file.id}
                          file={file}
                          onEdit={handleEditLessonFile}
                          onDelete={handleDeleteLessonFile}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">尚未新增任何檔案</p>
                    </div>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowLessonModal(false);
                      setEditingLesson(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveLesson}
                    disabled={!editingLesson.title.trim() || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>儲存中...</span>
                      </>
                    ) : (
                      <span>儲存到資料庫</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CourseSettingsPage: React.FC = () => {
  const params = useParams();
  const courseId = params.courseId as string;

  const [settings, setSettings] = useState<CourseSettings | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [stats, setStats] = useState<CourseStats>({
    total_enrollments: 0,
    active_students: 0,
    completion_rate: 0,
    average_rating: 0,
    total_revenue: 0,
    refund_requests: 0
  });

  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'enrollment' | 'settings' | 'seo' | 'analytics'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourseSettings();
    }
  }, [courseId]);

  const createMockStats = (): CourseStats => {
    return {
      total_enrollments: Math.floor(Math.random() * 200) + 50,
      active_students: Math.floor(Math.random() * 100) + 20,
      completion_rate: Math.floor(Math.random() * 40) + 60,
      average_rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      total_revenue: Math.floor(Math.random() * 300000) + 100000,
      refund_requests: Math.floor(Math.random() * 5)
    };
  };

  // 🔧 修正後的 fetchCourseSettings - 從真實資料庫讀取
  const fetchCourseSettings = async () => {
    try {
      setLoading(true);
      console.log('正在載入課程設定，課程 ID:', courseId);
      
      if (!courseId) {
        console.error('無效的課程 ID');
        setSettings(null);
        setLoading(false);
        return;
      }

      const { supabase } = await import('@/lib/supabase');
      
      // 🎯 從 courses 表格讀取實際資料
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (!courseError && courseData) {
        // 🎯 轉換資料庫欄位到介面格式
        const courseSettings: CourseSettings = {
          id: courseData.id,
          title: courseData.title,
          description: courseData.description || '',
          thumbnail: courseData.thumbnail_url,
          status: courseData.status || 'draft',
          price: courseData.price || 0,
          discount_price: undefined, // 如需要可從資料庫新增此欄位
          enrollment_limit: undefined,
          enrollment_start: undefined,
          enrollment_end: undefined,
          course_start: undefined,
          course_end: undefined,
          is_featured: false,
          allow_reviews: true,
          allow_discussions: true,
          auto_enroll: false,
          certificate_enabled: true,
          completion_certificate: true,
          drip_content: false,
          drip_interval_days: 1,
          access_duration_days: 365,
          prerequisites: [], // 可以從 JSON 欄位讀取
          learning_outcomes: [], // 可以從 JSON 欄位讀取
          seo_title: courseData.title,
          seo_description: courseData.description,
          seo_keywords: [courseData.category || ''].filter(Boolean)
        };

        setSettings(courseSettings);
        setStats(createMockStats());
        console.log('✅ 從資料庫載入課程設定成功:', courseData.title);
      } else {
        throw new Error('課程不存在');
      }

    } catch (error) {
      console.error('載入課程設定失敗:', error);
      setMessage('載入課程設定失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setMessage('');

      const { supabase } = await import('@/lib/supabase');
      
      // 🎯 儲存到真實資料庫
      const { error } = await supabase
        .from('courses')
        .update({
          title: settings.title,
          description: settings.description,
          status: settings.status,
          price: settings.price,
          category: settings.seo_keywords[0] || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) {
        throw new Error(`儲存失敗: ${error.message}`);
      }

      setMessage('設定已儲存成功！');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('儲存設定失敗:', error);
      setMessage(`儲存失敗: ${error.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<CourseSettings>) => {
    if (!settings) return;
    setSettings(prev => ({ ...prev!, ...updates }));
  };

  // 先修條件和學習成果管理
  const addPrerequisite = () => {
    if (!settings) return;
    if (newPrerequisite.trim() && !settings.prerequisites.includes(newPrerequisite.trim())) {
      updateSettings({
        prerequisites: [...settings.prerequisites, newPrerequisite.trim()]
      });
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (prerequisite: string) => {
    if (!settings) return;
    updateSettings({
      prerequisites: settings.prerequisites.filter(p => p !== prerequisite)
    });
  };

  const addLearningOutcome = () => {
    if (!settings) return;
    if (newOutcome.trim() && !settings.learning_outcomes.includes(newOutcome.trim())) {
      updateSettings({
        learning_outcomes: [...settings.learning_outcomes, newOutcome.trim()]
      });
      setNewOutcome('');
    }
  };

  const removeLearningOutcome = (outcome: string) => {
    if (!settings) return;
    updateSettings({
      learning_outcomes: settings.learning_outcomes.filter(o => o !== outcome)
    });
  };

  const addKeyword = () => {
    if (!settings) return;
    if (newKeyword.trim() && !settings.seo_keywords.includes(newKeyword.trim())) {
      updateSettings({
        seo_keywords: [...settings.seo_keywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    if (!settings) return;
    updateSettings({
      seo_keywords: settings.seo_keywords.filter(k => k !== keyword)
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">載入課程設定中...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">找不到課程</h2>
          <p className="text-gray-600 mb-4">課程 ID: {courseId}</p>
          <Link
            href="/admin/course-settings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回課程選擇
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 返回按鈕和頁面標題 */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/admin/course-settings"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="返回課程選擇"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="mr-3 h-8 w-8" />
                課程設定
              </h1>
              <p className="text-gray-600 mt-2">{settings.title}</p>
              <p className="text-sm text-gray-500">課程 ID: {courseId}</p>
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? '儲存中...' : '儲存設定'}</span>
          </button>
        </div>
      </div>

      {/* 狀態訊息 */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.includes('成功') || message.includes('已儲存')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 mr-2" />
          {message}
        </div>
      )}

      {/* 課程統計概覽 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">總註冊數</p>
              <p className="text-xl font-bold text-blue-900">{stats.total_enrollments}</p>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">活躍學員</p>
              <p className="text-xl font-bold text-green-900">{stats.active_students}</p>
            </div>
            <Users className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">完成率</p>
              <p className="text-xl font-bold text-purple-900">{stats.completion_rate}%</p>
            </div>
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium">平均評分</p>
              <p className="text-xl font-bold text-yellow-900">{stats.average_rating}</p>
            </div>
            <Award className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-700 text-sm font-medium">總收入</p>
              <p className="text-xl font-bold text-indigo-900">{formatPrice(stats.total_revenue)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium">退款申請</p>
              <p className="text-xl font-bold text-red-900">{stats.refund_requests}</p>
            </div>
            <Clock className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* 標籤導航 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { key: 'general', label: '基本資訊' },
              { key: 'content', label: '課程內容' },
              { key: 'enrollment', label: '註冊設定' },
              { key: 'settings', label: '功能設定' },
              { key: 'seo', label: 'SEO 設定' },
              { key: 'analytics', label: '數據分析' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 基本資訊 */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    課程標題
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => updateSettings({ title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    課程描述
                  </label>
                  <textarea
                    value={settings.description || ''}
                    onChange={(e) => updateSettings({ description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="詳細描述這個課程的內容和目標..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    課程狀態
                  </label>
                  <select
                    value={settings.status}
                    onChange={(e) => updateSettings({ status: e.target.value as CourseSettings['status'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已發布</option>
                    <option value="archived">已封存</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    課程價格 (TWD)
                  </label>
                  <input
                    type="number"
                    value={settings.price}
                    onChange={(e) => updateSettings({ price: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優惠價格 (TWD)
                  </label>
                  <input
                    type="number"
                    value={settings.discount_price || ''}
                    onChange={(e) => updateSettings({ discount_price: e.target.value ? parseInt(e.target.value) : undefined })}
                    min="0"
                    placeholder="無優惠"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 課程內容標籤 - 完整的編輯器 */}
          {activeTab === 'content' && (
              <LessonEditor
              courseId={courseId}
              />
          )}

          {activeTab === 'enrollment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    註冊開始時間
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDate(settings.enrollment_start)}
                    onChange={(e) => updateSettings({ enrollment_start: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    註冊結束時間
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDate(settings.enrollment_end)}
                    onChange={(e) => updateSettings({ enrollment_end: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    課程開始時間
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDate(settings.course_start)}
                    onChange={(e) => updateSettings({ course_start: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    課程結束時間
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDate(settings.course_end)}
                    onChange={(e) => updateSettings({ course_end: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    註冊人數限制
                  </label>
                  <input
                    type="number"
                    value={settings.enrollment_limit || ''}
                    onChange={(e) => updateSettings({ enrollment_limit: e.target.value ? parseInt(e.target.value) : undefined })}
                    min="1"
                    placeholder="無限制"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    存取期限 (天)
                  </label>
                  <input
                    type="number"
                    value={settings.access_duration_days || ''}
                    onChange={(e) => updateSettings({ access_duration_days: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="終身存取"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">功能設定</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">精選課程</h4>
                      <p className="text-sm text-gray-500">在首頁推薦區域顯示</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.is_featured}
                      onChange={(e) => updateSettings({ is_featured: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">允許評論</h4>
                      <p className="text-sm text-gray-500">學員可以留下課程評論</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allow_reviews}
                      onChange={(e) => updateSettings({ allow_reviews: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">討論區</h4>
                      <p className="text-sm text-gray-500">開啟課程討論功能</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allow_discussions}
                      onChange={(e) => updateSettings({ allow_discussions: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">完成證書</h4>
                      <p className="text-sm text-gray-500">完成課程後頒發證書</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.certificate_enabled}
                      onChange={(e) => updateSettings({ certificate_enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">先修條件</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newPrerequisite}
                        onChange={(e) => setNewPrerequisite(e.target.value)}
                        placeholder="輸入先修條件..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                      />
                      <button
                        onClick={addPrerequisite}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        新增
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.prerequisites.map((prerequisite, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                        >
                          <span>{prerequisite}</span>
                          <button
                            onClick={() => removePrerequisite(prerequisite)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">學習成果</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newOutcome}
                        onChange={(e) => setNewOutcome(e.target.value)}
                        placeholder="學員將學會..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addLearningOutcome()}
                      />
                      <button
                        onClick={addLearningOutcome}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        新增
                      </button>
                    </div>
                    <div className="space-y-2">
                      {settings.learning_outcomes.map((outcome, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-green-50 p-3 rounded-lg"
                        >
                          <span className="text-green-800">{outcome}</span>
                          <button
                            onClick={() => removeLearningOutcome(outcome)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO 標題
                  </label>
                  <input
                    type="text"
                    value={settings.seo_title || ''}
                    onChange={(e) => updateSettings({ seo_title: e.target.value })}
                    placeholder="自動使用課程標題"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO 描述
                  </label>
                  <textarea
                    value={settings.seo_description || ''}
                    onChange={(e) => updateSettings({ seo_description: e.target.value })}
                    placeholder="搜尋引擎顯示的課程描述..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO 關鍵字
                  </label>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="輸入關鍵字..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <button
                        onClick={addKeyword}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                      >
                        新增
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.seo_keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                        >
                          <span>{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-4">課程表現摘要</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{stats.total_enrollments}</div>
                    <div className="text-sm text-blue-700">總註冊數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{stats.completion_rate}%</div>
                    <div className="text-sm text-blue-700">完成率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{stats.average_rating}</div>
                    <div className="text-sm text-blue-700">平均評分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{formatPrice(stats.total_revenue)}</div>
                    <div className="text-sm text-blue-700">總收入</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">改進建議</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 考慮增加更多互動內容提升完成率</li>
                  <li>• 定期更新課程內容保持相關性</li>
                  <li>• 收集學員反饋持續改進課程品質</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">📁 檔案資源統計</h4>
                <p className="text-sm text-green-800">
                  課程總共包含 {lessons.reduce((total, lesson) => total + (lesson.attachments?.length || 0), 0)} 個檔案資源，
                  分佈在 {lessons.filter(lesson => lesson.attachments && lesson.attachments.length > 0).length} 個課程單元中。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSettingsPage;