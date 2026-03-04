'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Plus, Trash2, ArrowLeft, AlertCircle, Loader2, Link as LinkIcon, Download, Play, Eye, Edit, CheckCircle, GripVertical, Video, FileText, Lock, Unlock, RefreshCw, FileImage, Music, Archive, Film, File, Clock } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  video_duration?: number;
  order_index: number;
  is_preview: boolean;
  content?: string;
  attachments?: FileResource[];
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

interface CourseFormData {
  title: string;
  description: string;
  short_description: string;
  thumbnail_url?: string;
  instructor_name: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  lessons: Lesson[];
  // 🔥 移除 course-level resources
  // resources: FileResource[];
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

// 🎨 改善的檔案卡片組件
const FileCard: React.FC<{
  file: FileResource;
  onEdit: (file: FileResource) => void;
  onDelete: (fileId: string) => void;
}> = ({ file, onEdit, onDelete }) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': 
        return { 
          icon: <FileText className="w-8 h-8" />, 
          color: 'bg-red-50 border-red-200', 
          textColor: 'text-red-700',
          bgColor: 'bg-red-100'
        };
      case 'word': 
        return { 
          icon: <FileText className="w-8 h-8" />, 
          color: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-100'
        };
      case 'excel': 
        return { 
          icon: <FileText className="w-8 h-8" />, 
          color: 'bg-green-50 border-green-200', 
          textColor: 'text-green-700',
          bgColor: 'bg-green-100'
        };
      case 'image': 
        return { 
          icon: <FileImage className="w-8 h-8" />, 
          color: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-100'
        };
      case 'audio': 
        return { 
          icon: <Music className="w-8 h-8" />, 
          color: 'bg-yellow-50 border-yellow-200', 
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        };
      case 'video': 
        return { 
          icon: <Film className="w-8 h-8" />, 
          color: 'bg-indigo-50 border-indigo-200', 
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-100'
        };
      case 'archive': 
        return { 
          icon: <Archive className="w-8 h-8" />, 
          color: 'bg-orange-50 border-orange-200', 
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-100'
        };
      default: 
        return { 
          icon: <File className="w-8 h-8" />, 
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
            <div className="w-6 h-6">{fileStyle.icon}</div>
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

const CourseCreateEditPage: React.FC = () => {
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: '',
    description: '',
    short_description: '',
    instructor_name: '',
    price: 0,
    level: 'beginner',
    category: '',
    tags: [],
    status: 'draft',
    lessons: []
    // 🔥 移除 course-level resources
    // resources: []
  });

  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    id: '',
    title: '',
    description: '',
    video_duration: 0,
    order_index: 0,
    is_preview: false,
    content: '',
    attachments: []
  });

  // 🔥 移除 resources 相關的 state，只保留 basic 和 lessons
  const [activeTab, setActiveTab] = useState<'basic' | 'lessons'>('basic');
  const [saving, setSaving] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  
  // 🎯 新增 lesson 檔案管理相關的 state
  const [showLessonFileForm, setShowLessonFileForm] = useState(false);
  const [editingLessonFile, setEditingLessonFile] = useState<FileResource | undefined>();
  
  const [message, setMessage] = useState('');

  const categories = [
    '程式設計',
    '網頁開發',
    '行動開發',
    '資料科學',
    '設計',
    '商業',
    '語言學習',
    '其他'
  ];

  const handleSaveCourse = async () => {
    if (!courseData.title || !courseData.description || !courseData.instructor_name) {
      alert('請填寫所有必要欄位');
      return;
    }

    try {
      setSaving(true);
      
      const totalDuration = courseData.lessons.reduce((sum, lesson) => sum + (lesson.video_duration || 0), 0);
      
      const coursePayload = {
        ...courseData,
        duration_minutes: totalDuration,
        lessons_count: courseData.lessons.length
      };

      console.log('準備儲存課程資料:', coursePayload);
      
      // 🔥 實際呼叫 API 而不是模擬
      const response = await authFetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursePayload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('✅ 課程建立成功！正在跳轉到課程列表...');
        setTimeout(() => {
          window.location.href = '/admin/courses';
        }, 2000);
      } else {
        console.error('API 錯誤:', result);
        setMessage(`❌ 儲存失敗：${result.error || '未知錯誤'}`);
        setTimeout(() => setMessage(''), 5000);
      }
      
    } catch (error) {
      console.error('儲存課程失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '網路錯誤';
      setMessage(`❌ 儲存失敗：${errorMessage}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const addLesson = () => {
    if (!currentLesson.title || !currentLesson.description) {
      alert('請填寫課程標題和描述');
      return;
    }

    const newLesson: Lesson = {
      ...currentLesson,
      id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order_index: courseData.lessons.length + 1
    };

    setCourseData(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }));

    setCurrentLesson({
      id: '',
      title: '',
      description: '',
      video_duration: 0,
      order_index: 0,
      is_preview: false,
      content: '',
      attachments: []
    });

    setShowLessonModal(false);
    setMessage('課程單元已新增！');
    setTimeout(() => setMessage(''), 3000);
  };

  const removeLesson = (lessonId: string) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => lesson.id !== lessonId)
    }));
  };

  const moveLessonUp = (index: number) => {
    if (index === 0) return;
    
    setCourseData(prev => {
      const newLessons = [...prev.lessons];
      [newLessons[index], newLessons[index - 1]] = [newLessons[index - 1], newLessons[index]];
      return { ...prev, lessons: newLessons };
    });
  };

  const moveLessonDown = (index: number) => {
    if (index === courseData.lessons.length - 1) return;
    
    setCourseData(prev => {
      const newLessons = [...prev.lessons];
      [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
      return { ...prev, lessons: newLessons };
    });
  };

  const addTag = (tag: string) => {
    if (tag && !courseData.tags.includes(tag)) {
      setCourseData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 🎯 新增 lesson 檔案管理函數
  const handleAddLessonFile = (fileData: Omit<FileResource, 'id' | 'uploaded_at'>) => {
    const currentAttachments = currentLesson.attachments || [];
    
    if (editingLessonFile) {
      // 編輯現有檔案
      const updatedAttachments = currentAttachments.map(file => 
        file.id === editingLessonFile.id ? { ...file, ...fileData } : file
      );
      setCurrentLesson(prev => ({
        ...prev,
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
      setCurrentLesson(prev => ({
        ...prev,
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
    if (confirm('確定要刪除這個檔案嗎？')) {
      const currentAttachments = currentLesson.attachments || [];
      setCurrentLesson(prev => ({
        ...prev,
        attachments: currentAttachments.filter(file => file.id !== fileId)
      }));
    }
  };

  const handleCancelLessonFileForm = () => {
    setShowLessonFileForm(false);
    setEditingLessonFile(undefined);
  };

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds === 0) return '0:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/admin/courses"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="返回課程列表"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">建立新課程</h1>
              <p className="text-gray-600 mt-2">建立一個全新的線上課程</p>
            </div>
          </div>
          <button
            onClick={handleSaveCourse}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? '建立中...' : '建立課程'}</span>
          </button>
        </div>
      </div>

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

      {/* 🔥 修改後的標籤導航 - 移除檔案資源標籤 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 text-sm font-medium border-b-2 ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              基本資訊
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`py-4 text-sm font-medium border-b-2 ${
                activeTab === 'lessons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              課程內容
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 基本資訊標籤 */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側 - 基本資訊 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      課程標題 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={courseData.title}
                      onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="例如：React 完整開發指南"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      簡短描述
                    </label>
                    <input
                      type="text"
                      value={courseData.short_description}
                      onChange={(e) => setCourseData(prev => ({ ...prev, short_description: e.target.value }))}
                      placeholder="用一句話描述您的課程..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      詳細描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={courseData.description}
                      onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="詳細介紹您的課程內容、學習目標等..."
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        講師姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={courseData.instructor_name}
                        onChange={(e) => setCourseData(prev => ({ ...prev, instructor_name: e.target.value }))}
                        placeholder="講師姓名"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        課程價格 (TWD)
                      </label>
                      <input
                        type="number"
                        value={courseData.price}
                        onChange={(e) => setCourseData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        難度等級
                      </label>
                      <select
                        value={courseData.level}
                        onChange={(e) => setCourseData(prev => ({ ...prev, level: e.target.value as CourseFormData['level'] }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="beginner">初級</option>
                        <option value="intermediate">中級</option>
                        <option value="advanced">高級</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        課程分類
                      </label>
                      <select
                        value={courseData.category}
                        onChange={(e) => setCourseData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">選擇分類</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 右側 - 課程標籤 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      課程標籤
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="輸入標籤後按 Enter"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              addTag(value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        {courseData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => removeTag(tag)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      課程狀態
                    </label>
                    <select
                      value={courseData.status}
                      onChange={(e) => setCourseData(prev => ({ ...prev, status: e.target.value as CourseFormData['status'] }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">草稿</option>
                      <option value="published">已發布</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 課程內容標籤 */}
          {activeTab === 'lessons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">課程單元</h3>
                  <p className="text-sm text-gray-600">建立和管理課程的學習單元</p>
                </div>
                <button
                  onClick={() => setShowLessonModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增單元</span>
                </button>
              </div>

              {/* 課程單元列表 */}
              {courseData.lessons.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">尚未新增任何課程單元</p>
                  <p className="text-gray-400 text-sm">點擊「新增單元」開始建立課程內容</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courseData.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => moveLessonUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              ▲
                            </button>
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <button
                              onClick={() => moveLessonDown(index)}
                              disabled={index === courseData.lessons.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              ▼
                            </button>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                                第 {lesson.order_index} 單元
                              </span>
                              {lesson.is_preview ? (
                                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded flex items-center">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  免費預覽
                                </span>
                              ) : (
                                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded flex items-center">
                                  <Lock className="w-3 h-3 mr-1" />
                                  付費內容
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mt-2">
                              {lesson.title || '未命名單元'}
                            </h4>
                            {lesson.description && (
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {lesson.description}
                              </p>
                            )}
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                              {lesson.video_url && (
                                <span className="flex items-center mr-4">
                                  <Video className="w-4 h-4 mr-1" />
                                  影片課程
                                </span>
                              )}
                              {lesson.video_duration && (
                                <span className="flex items-center mr-4">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatDuration(lesson.video_duration)}
                                </span>
                              )}
                              {lesson.attachments && lesson.attachments.length > 0 && (
                                <span className="flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  {lesson.attachments.length} 個附件
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeLesson(lesson.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
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

              {/* 課程統計 */}
              {courseData.lessons.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📊 課程統計</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">總單元數：</span>
                      <span className="font-medium text-blue-900">{courseData.lessons.length} 個</span>
                    </div>
                    <div>
                      <span className="text-blue-700">總時長：</span>
                      <span className="font-medium text-blue-900">
                        {formatDuration(courseData.lessons.reduce((sum, lesson) => sum + (lesson.video_duration || 0), 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">免費預覽：</span>
                      <span className="font-medium text-blue-900">
                        {courseData.lessons.filter(lesson => lesson.is_preview).length} 個
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🔥 移除檔案資源標籤的所有內容 */}
        </div>
      </div>

      {/* 🎯 增強的課程單元編輯模態框 - 加入檔案管理功能 */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">新增課程單元</h3>
                <button
                  onClick={() => setShowLessonModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      單元標題 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentLesson.title}
                      onChange={(e) => setCurrentLesson({
                        ...currentLesson,
                        title: e.target.value
                      })}
                      placeholder="例如：React 基礎概念介紹"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      單元描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={currentLesson.description}
                      onChange={(e) => setCurrentLesson({
                        ...currentLesson,
                        description: e.target.value
                      })}
                      placeholder="簡要描述這個單元的學習內容..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      影片連結 (YouTube/Bunny.net)
                    </label>
                    <input
                      type="url"
                      value={currentLesson.video_url || ''}
                      onChange={(e) => setCurrentLesson({
                        ...currentLesson,
                        video_url: e.target.value
                      })}
                      placeholder="例如：https://www.youtube.com/watch?v=... 或 https://vz-a6d0df2a-1de.b-cdn.net/..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      影片時長（分鐘）
                    </label>
                    <input
                      type="number"
                      value={currentLesson.video_duration || ''}
                      onChange={(e) => setCurrentLesson({
                        ...currentLesson,
                        video_duration: parseInt(e.target.value) || 0
                      })}
                      placeholder="30"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentLesson.is_preview}
                        onChange={(e) => setCurrentLesson({
                          ...currentLesson,
                          is_preview: e.target.checked
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        免費預覽單元
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    單元內容
                  </label>
                  <textarea
                    value={currentLesson.content || ''}
                    onChange={(e) => setCurrentLesson({
                      ...currentLesson,
                      content: e.target.value
                    })}
                    placeholder="詳細的單元內容、學習重點、作業說明等..."
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 🎯 新增檔案管理區塊 */}
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
                  {currentLesson.attachments && currentLesson.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentLesson.attachments.map((file) => (
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

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={() => setShowLessonModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={addLesson}
                    disabled={!currentLesson.title.trim() || !currentLesson.description.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    新增單元
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

export default CourseCreateEditPage;