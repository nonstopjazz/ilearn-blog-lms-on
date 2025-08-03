'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Hash,
  Loader2,
  Check,
  X
} from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export default function BlogTagsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
        loadTags();
        
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

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog/tags');
      const result = await response.json();
      
      if (result.success) {
        setTags(result.tags || []);
      }
    } catch (error) {
      console.error('載入標籤失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      name: '',
      color: '#6B7280'
    });
    setErrors({});
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setShowAddForm(false);
    setFormData({
      name: tag.name,
      color: tag.color || '#6B7280'
    });
    setErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      color: '#6B7280'
    });
    setErrors({});
  };

  const handleSave = async () => {
    // 驗證
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '標籤名稱不能為空';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    
    try {
      const url = '/api/blog/tags';
      const method = editingId ? 'PUT' : 'POST';
      
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        await loadTags();
        handleCancel();
      } else {
        setErrors({ submit: result.error || '操作失敗' });
      }
    } catch (error) {
      console.error('儲存失敗:', error);
      setErrors({ submit: '儲存失敗，請稍後再試' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此標籤嗎？相關文章的標籤關聯也會被移除。')) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/tags?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        await loadTags();
      } else {
        alert(result.error || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  const predefinedColors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6B7280', // gray
    '#059669', // green
    '#DC2626', // red-600
    '#7C3AED', // violet-600
  ];

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
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Hash className="mr-3 h-8 w-8" />
              標籤管理
            </h1>
            <p className="text-gray-600 mt-2">管理 Blog 文章標籤</p>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增標籤
          </button>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* 新增表單 */}
        {showAddForm && (
          <div className="mb-6 bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">新增標籤</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  標籤名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如：JavaScript"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  顏色
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <div className="flex flex-wrap gap-1">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    儲存
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 標籤列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm">
            {tags.length === 0 ? (
              <div className="text-center py-12">
                <Hash className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有標籤</h3>
                <p className="text-gray-600">點擊上方按鈕新增第一個標籤</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <div key={tag.id} className="relative group">
                      {editingId === tag.id ? (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-8 h-8"
                          />
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white cursor-default"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          >
                            #{tag.name}
                          </span>
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <button
                              onClick={() => handleEdit(tag)}
                              className="p-1 bg-white rounded-full shadow-md text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(tag.id)}
                              className="p-1 bg-white rounded-full shadow-md text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}