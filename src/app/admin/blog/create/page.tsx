'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus, 
  Hash,
  FileText,
  Image,
  Settings,
  Calendar,
  Tag
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const BlogAdminCreate: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 表單資料
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    category_id: '',
    status: 'draft',
    is_featured: false,
    seo_title: '',
    seo_description: '',
    tags: [] as string[],
    published_at: ''
  });

  // 選項資料
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');

  // 錯誤處理
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 認證檢查
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth');
          return;
        }
        
        setUser(user);
        
        // 載入分類和標籤
        await Promise.all([
          loadCategories(),
          loadTags()
        ]);
        
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth');
      } finally {
        setUserLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const result = await response.json();
      if (response.ok) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('載入分類失敗:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/blog/tags');
      const result = await response.json();
      if (response.ok) {
        setAvailableTags(result.tags);
      }
    } catch (error) {
      console.error('載入標籤失敗:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 自動生成 slug
    if (field === 'title' && value) {
      const slug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }

    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const response = await fetch('/api/blog/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim()
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        const newTag = result.tag;
        setAvailableTags(prev => [...prev, newTag]);
        setSelectedTags(prev => [...prev, newTag]);
        setNewTagName('');
      }
    } catch (error) {
      console.error('新增標籤失敗:', error);
    }
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.find(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '標題不能為空';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'URL 別名不能為空';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '內容不能為空';
    }

    if (!formData.category_id) {
      newErrors.category_id = '請選擇分類';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveBlogPost = async (status: 'draft' | 'published') => {
    if (!validateForm()) return;

    setSaving(true);
    
    try {
      const postData = {
        ...formData,
        status,
        author_id: user?.id,
        tags: selectedTags.map(tag => tag.id),
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/admin/blog`);
      } else {
        setErrors({ submit: result.error || '儲存失敗' });
      }
    } catch (error) {
      console.error('儲存文章失敗:', error);
      setErrors({ submit: '儲存失敗，請稍後再試' });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-3 h-8 w-8" />
              創建新文章
            </h1>
            <p className="text-gray-600 mt-2">撰寫並發布新的 Blog 文章</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => saveBlogPost('draft')}
              disabled={saving}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              儲存草稿
            </button>
            
            <button
              onClick={() => saveBlogPost('published')}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              發布文章
            </button>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主要內容區域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 標題 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章標題 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="輸入文章標題"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* URL 別名 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL 別名 *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="url-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                文章 URL: /blog/{formData.slug || 'url-slug'}
              </p>
            </div>

            {/* 內容編輯器 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章內容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.content ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={20}
                placeholder="撰寫文章內容（支援 Markdown）"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* 摘要 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章摘要
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="簡短描述文章內容（留空將自動生成）"
              />
            </div>
          </div>

          {/* 側邊欄設定 */}
          <div className="space-y-6">
            {/* 發布設定 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                發布設定
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">精選文章</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    發布時間
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => handleInputChange('published_at', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 分類 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                分類 *
              </h3>
              
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.category_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">選擇分類</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
              )}
            </div>

            {/* 標籤 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                標籤
              </h3>
              
              {/* 已選標籤 */}
              {selectedTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTag(tag.id)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 新增標籤 */}
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="新增標籤"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* 可用標籤 */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">可用標籤：</p>
                <div className="max-h-40 overflow-y-auto">
                  {availableTags.map(tag => {
                    const isSelected = selectedTags.find(t => t.id === tag.id);
                    return (
                      <label key={tag.id} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleTag(tag)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 精選圖片 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Image className="h-5 w-5 mr-2" />
                精選圖片
              </h3>
              
              <input
                type="url"
                value={formData.featured_image_url}
                onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                placeholder="圖片 URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              {formData.featured_image_url && (
                <div className="mt-3">
                  <img
                    src={formData.featured_image_url}
                    alt="預覽"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* SEO 設定 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                SEO 設定
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO 標題
                  </label>
                  <input
                    type="text"
                    value={formData.seo_title}
                    onChange={(e) => handleInputChange('seo_title', e.target.value)}
                    placeholder="留空將使用文章標題"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO 描述
                  </label>
                  <textarea
                    value={formData.seo_description}
                    onChange={(e) => handleInputChange('seo_description', e.target.value)}
                    placeholder="留空將使用文章摘要"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogAdminCreate;