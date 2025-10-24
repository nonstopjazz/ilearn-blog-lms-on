'use client';
import { User as SupabaseUser } from '@supabase/supabase-js';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Tag,
  User,
  FileText
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  created_at: string;
  published_at?: string;
  blog_categories?: {
    name: string;
    color: string;
  };
  users?: {
    name: string;
  };
}

const BlogAdminList: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
        loadPosts();
        
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

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      let url = '/api/blog/posts?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setPosts(result.posts || []);
      }
    } catch (error) {
      console.error('載入文章失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [statusFilter, categoryFilter, user?.id]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deletePost = async (postId: string) => {
    if (!confirm('確定要刪除此文章嗎？此操作無法復原。')) return;

    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('刪除文章失敗:', error);
      alert('刪除失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      draft: '草稿',
      published: '已發布',
      archived: '已封存'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || badges.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      
      <div className="max-w-7xl mx-auto p-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-3 h-8 w-8" />
              Blog 文章管理
            </h1>
            <p className="text-gray-600 mt-2">管理所有 Blog 文章</p>
          </div>
          
          <Link
            href="/admin/blog/create"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增文章
          </Link>
        </div>

        {/* 搜尋和篩選 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜尋文章標題或 URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有狀態</option>
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
                <option value="archived">已封存</option>
              </select>
              
              <button
                onClick={loadPosts}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                重新載入
              </button>
            </div>
          </div>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到文章</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? '沒有符合搜尋條件的文章' : '還沒有任何文章'}
                </p>
                <Link
                  href="/admin/blog/create"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  建立第一篇文章
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        文章
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        分類
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        作者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        瀏覽數
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        建立日期
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {post.title}
                                {post.is_featured && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    精選
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">/{post.slug}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(post.status)}
                        </td>
                        <td className="px-6 py-4">
                          {post.blog_categories && (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: post.blog_categories.color }}
                            >
                              {post.blog_categories.name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {post.users?.name || '未知'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {post.view_count || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(post.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {post.status === 'published' && (
                              <Link
                                href={`/blog/${post.slug}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="檢視文章"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            )}
                            
                            <Link
                              href={`/admin/blog/${post.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="編輯文章"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            
                            <button
                              onClick={() => deletePost(post.id)}
                              className="text-red-600 hover:text-red-900"
                              title="刪除文章"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 統計資訊 */}
        {!loading && filteredPosts.length > 0 && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                顯示 {filteredPosts.length} 篇文章
                {searchTerm && ` (搜尋: "${searchTerm}")`}
              </div>
              <div className="flex items-center space-x-4">
                <span>總觀看數: {filteredPosts.reduce((sum, post) => sum + (post.view_count || 0), 0)}</span>
                <span>已發布: {filteredPosts.filter(p => p.status === 'published').length}</span>
                <span>草稿: {filteredPosts.filter(p => p.status === 'draft').length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogAdminList;