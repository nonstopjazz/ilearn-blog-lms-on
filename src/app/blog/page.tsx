'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  Eye,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url?: string;
  view_count: number;
  reading_time: number;
  published_at: string;
  is_featured: boolean;
  blog_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  users?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  post_count: number;
}

const BlogListPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // 從 URL 參數讀取篩選條件
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    setSelectedCategory(category);
    setSearchTerm(search);
  }, [searchParams]);

  // 認證檢查（非必需，但可以顯示個人化內容）
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
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

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 載入文章和分類
  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 載入一般文章
      let postsUrl = '/api/blog/posts?status=published&limit=20';
      if (selectedCategory) {
        postsUrl += `&category=${selectedCategory}`;
      }
      
      // 載入精選文章
      const featuredUrl = '/api/blog/posts?status=published&featured=true&limit=3';
      
      // 載入分類
      const categoriesUrl = '/api/blog/categories';

      const [postsRes, featuredRes, categoriesRes] = await Promise.all([
        fetch(postsUrl),
        fetch(featuredUrl),
        fetch(categoriesUrl)
      ]);

      const [postsData, featuredData, categoriesData] = await Promise.all([
        postsRes.json(),
        featuredRes.json(),
        categoriesRes.json()
      ]);

      if (postsRes.ok) setPosts(postsData.posts || []);
      if (featuredRes.ok) setFeaturedPosts(featuredData.posts || []);
      if (categoriesRes.ok) setCategories(categoriesData.categories || []);

    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 篩選文章
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 更新 URL 參數
  const updateUrlParams = (category: string, search: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    
    const newUrl = params.toString() ? `/blog?${params.toString()}` : '/blog';
    router.push(newUrl, { scroll: false });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateUrlParams(category, searchTerm);
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    updateUrlParams(selectedCategory, search);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-white border-b"></div>
          <div className="max-w-7xl mx-auto p-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Joe老師的 Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            分享最新的學測、雅思動態、教學心得，以及英文學習相關資源
          </p>
        </div>

        {/* 精選文章區塊 */}
        {featuredPosts.length > 0 && !selectedCategory && !searchTerm && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">精選文章</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    {post.featured_image_url ? (
                      <div className="h-48 relative">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.className = 'h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative flex items-center justify-center';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-white text-lg font-medium">📝</div>';
                          }}
                        />
                        <div className="absolute top-4 right-4">
                          <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                            精選
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative flex items-center justify-center">
                        <div className="text-white text-2xl">📝</div>
                        <div className="absolute top-4 right-4">
                          <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                            精選
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        {post.blog_categories && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: post.blog_categories.color }}
                          >
                            {post.blog_categories.name}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(post.published_at)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {post.reading_time || 1} 分鐘
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.view_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 搜尋和篩選 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜尋文章..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有分類</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              {(selectedCategory || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchTerm('');
                    router.push('/blog');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  清除篩選
                </button>
              )}
            </div>
          </div>

          {/* 分類快速選擇 */}
          {categories.length > 0 && !selectedCategory && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">熱門分類：</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className="px-3 py-1 rounded-full text-sm text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 當前篩選狀態 */}
        {(selectedCategory || searchTerm) && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>篩選結果：</span>
              {selectedCategory && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  搜尋：{searchTerm}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 文章列表 */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到文章</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory ? '請嘗試調整搜尋條件' : '目前還沒有發布的文章'}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchTerm('');
                  router.push('/blog');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                查看所有文章
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  {/* 分類標籤 */}
                  {post.blog_categories && (
                    <div className="mb-3">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: post.blog_categories.color }}
                      >
                        {post.blog_categories.name}
                      </span>
                    </div>
                  )}
                  
                  {/* 文章標題 */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  {/* 文章摘要 */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  {/* 文章資訊 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {post.users?.name || '未知作者'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(post.published_at)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.reading_time || 1} 分鐘
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {post.view_count || 0}
                      </div>
                    </div>
                  </div>
                  
                  {/* 閱讀更多 */}
                  <div className="flex items-center text-blue-600 text-sm font-medium group">
                    閱讀更多
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* 結果統計 */}
        {filteredPosts.length > 0 && (
          <div className="mt-12 text-center">
            <div className="text-sm text-gray-600">
              顯示 {filteredPosts.length} 篇文章
              {posts.length !== filteredPosts.length && ` (共 ${posts.length} 篇)`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;