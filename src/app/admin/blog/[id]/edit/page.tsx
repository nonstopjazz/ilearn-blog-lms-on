'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Tag,
  ArrowLeft
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

const BlogAdminEdit: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loading, setLoading] = useState(true);
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
    read_time: 5
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // 檢查認證狀態
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setUserLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登出處理
  const handleSignOut = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 載入文章資料
  useEffect(() => {
    if (user && blogId) {
      loadBlogPost();
      loadCategories();
      loadTags();
    }
  }, [user, blogId]);

  const loadBlogPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/posts/id/${blogId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        const post = result.data;
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          featured_image_url: post.featured_image_url || '',
          category_id: post.category_id || '',
          status: post.status || 'draft',
          is_featured: post.is_featured || false,
          seo_title: post.seo_title || '',
          seo_description: post.seo_description || '',
          read_time: post.read_time || 5
        });
        
        // 載入選中的標籤 - 處理字符串數組格式
        if (post.tags && Array.isArray(post.tags)) {
          // 如果是字符串數組，轉換為標籤對象
          const tagObjects = post.tags.map((tagName: string, index: number) => ({
            id: `temp_${index}`,
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          }));
          setSelectedTags(tagObjects);
        }
      } else {
        setErrors({ submit: result.error || '載入文章失敗' });
      }
    } catch (error) {
      console.error('載入文章失敗:', error);
      setErrors({ submit: '載入文章失敗，請稍後再試' });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.categories || []);
      }
    } catch (error) {
      console.error('載入分類失敗:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/blog/tags');
      const result = await response.json();
      if (result.success) {
        setTags(result.tags || []);
      }
    } catch (error) {
      console.error('載入標籤失敗:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 清除對應的錯誤
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // 自動生成 slug
    if (name === 'title' && value) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
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
          name: newTagName.trim(),
          slug: newTagName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const newTag = result.data;
        setTags(prev => [...prev, newTag]);
        setSelectedTags(prev => [...prev, newTag]);
        setNewTagName('');
        setShowTagInput(false);
      } else {
        console.error('新增標籤失敗:', result.error);
      }
    } catch (error) {
      console.error('新增標籤失敗:', error);
    }
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id);
      if (exists) {
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
        tags: selectedTags.map(tag => tag.id),
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      const response = await fetch(`/api/blog/posts/id/${blogId}`, {
        method: 'PUT',
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

  if (userLoading || loading) {
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
            <div className="flex items-center mb-2">
              <button
                onClick={() => router.back()}
                className="mr-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="mr-3 h-8 w-8" />
                編輯文章
              </h1>
            </div>
            <p className="text-gray-600 ml-14">修改文章內容和設定</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => saveBlogPost('draft')}
              disabled={saving}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              儲存草稿
            </button>
            <button
              onClick={() => saveBlogPost('published')}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Eye className="mr-2 h-4 w-4" />
              發布文章
            </button>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主要內容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本資訊 */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    標題 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="輸入文章標題..."
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL 別名 *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.slug ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="url-alias"
                  />
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    摘要
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="簡短描述文章內容..."
                  />
                </div>
              </div>
            </div>

            {/* 文章內容 */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">文章內容</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  內容 *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={20}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="撰寫文章內容..."
                />
                {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
              </div>
            </div>

            {/* SEO 設定 */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                SEO 設定
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO 標題
                  </label>
                  <input
                    type="text"
                    name="seo_title"
                    value={formData.seo_title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="搜尋引擎顯示的標題..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO 描述
                  </label>
                  <textarea
                    name="seo_description"
                    value={formData.seo_description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="搜尋引擎顯示的描述..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 側邊欄 */}
          <div className="space-y-6">
            {/* 發布設定 */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                發布設定
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分類 *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                  {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    閱讀時間 (分鐘)
                  </label>
                  <input
                    type="number"
                    name="read_time"
                    value={formData.read_time}
                    onChange={handleInputChange}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    設為精選文章
                  </label>
                </div>
              </div>
            </div>

            {/* 特色圖片 */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Image className="mr-2 h-5 w-5" />
                特色圖片
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  圖片 URL
                </label>
                <input
                  type="url"
                  name="featured_image_url"
                  value={formData.featured_image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
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
            </div>

            {/* 標籤 */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="mr-2 h-5 w-5" />
                標籤
              </h3>
              
              {/* 已選標籤 */}
              {selectedTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTag(tag.id)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 可用標籤 */}
              {tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">選擇標籤：</p>
                  <div className="flex flex-wrap gap-2">
                    {tags
                      .filter(tag => !selectedTags.find(st => st.id === tag.id))
                      .map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                        >
                          {tag.name}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* 新增標籤 */}
              {showTagInput ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="標籤名稱"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowTagInput(false);
                      setNewTagName('');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="flex items-center w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增標籤
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogAdminEdit;