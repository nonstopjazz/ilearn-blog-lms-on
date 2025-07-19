'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  };
  blog_post_tags?: Array<{
    blog_tags: {
      id: string;
      name: string;
      slug: string;
    }
  }>;
  author_name?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

function BlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 從 URL 參數獲取篩選條件
  const categorySlug = searchParams.get('category');
  const tagSlug = searchParams.get('tag');

  useEffect(() => {
    loadData();
  }, [categorySlug, tagSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 載入文章
      let postsUrl = '/api/blog/posts?status=published';
      if (categorySlug) postsUrl += `&category=${categorySlug}`;
      if (tagSlug) postsUrl += `&tag=${tagSlug}`;
      
      const [postsRes, categoriesRes] = await Promise.all([
        fetch(postsUrl),
        fetch('/api/blog/categories')
      ]);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
      
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜尋過濾
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">部落格</h1>
          <p className="text-xl opacity-90">分享知識，啟發思考</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 側邊欄 */}
          <div className="lg:col-span-1">
            {/* 搜尋框 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">搜尋文章</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜尋..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* 分類 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">文章分類</h3>
              <div className="space-y-2">
                <Link
                  href="/blog"
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    !categorySlug ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  全部文章
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog?category=${category.slug}`}
                    className={`block px-3 py-2 rounded-lg transition-colors ${
                      categorySlug === category.slug
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 文章列表 */}
          <div className="lg:col-span-3">
            {/* 篩選標題 */}
            {(categorySlug || tagSlug) && (
              <div className="mb-6 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-gray-500" />
                <span className="text-gray-600">
                  篩選條件：
                  {categorySlug && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      分類: {categories.find(c => c.slug === categorySlug)?.name}
                    </span>
                  )}
                  {tagSlug && (
                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      標籤: {tagSlug}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* 文章網格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">目前沒有相關文章</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                    {/* 特色圖片 */}
                    {post.featured_image_url && (
                      <Link href={`/blog/${post.slug}`}>
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                        />
                      </Link>
                    )}
                    
                    <div className="p-6">
                      {/* 分類標籤 */}
                      {post.blog_categories && (
                        <Link
                          href={`/blog?category=${post.blog_categories.slug}`}
                          className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3 hover:bg-blue-200 transition-colors"
                        >
                          {post.blog_categories.name}
                        </Link>
                      )}
                      
                      {/* 標題 */}
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                          {post.title}
                        </Link>
                      </h2>
                      
                      {/* 摘要 */}
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      
                      {/* 元資訊 */}
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(post.published_at)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {post.reading_time} 分鐘
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.view_count}
                        </div>
                      </div>
                      
                      {/* 標籤 */}
                      {post.blog_post_tags && post.blog_post_tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.blog_post_tags.map((tagRelation) => (
                            <Link
                              key={tagRelation.blog_tags.id}
                              href={`/blog?tag=${tagRelation.blog_tags.slug}`}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tagRelation.blog_tags.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {/* 閱讀更多 */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        閱讀更多
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogContent />
    </Suspense>
  );
}