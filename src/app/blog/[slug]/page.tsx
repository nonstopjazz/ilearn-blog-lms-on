'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  Eye,
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  view_count: number;
  reading_time: number;
  published_at: string;
  seo_title?: string;
  seo_description?: string;
  blog_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  users?: {
    name: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  // 認證檢查（非必需）
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

  // 載入文章
  useEffect(() => {
    if (resolvedParams.slug) {
      loadPost();
    }
  }, [resolvedParams.slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/blog/posts/${resolvedParams.slug}`);
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || '文章不存在');
        return;
      }
      
      setPost(result.post);
      
      // 載入相關文章
      if (result.post.blog_categories?.id) {
        loadRelatedPosts(result.post.blog_categories.id, result.post.id);
      }
      
    } catch (error) {
      console.error('載入文章失敗:', error);
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPosts = async (categoryId: string, currentPostId: string) => {
    try {
      const response = await fetch(`/api/blog/posts?status=published&category=${categoryId}&limit=3`);
      const result = await response.json();
      
      if (response.ok) {
        // 排除當前文章
        const filtered = (result.posts || []).filter((p: BlogPost) => p.id !== currentPostId);
        setRelatedPosts(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error('載入相關文章失敗:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content: string) => {
    // 簡單的 Markdown 轉換（生產環境建議使用專業的 Markdown 解析器）
    return content
      .replace(/### (.*)/g, '<h3 class="text-xl font-semibold text-gray-900 mt-8 mb-4">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-6">$1</h2>')
      .replace(/# (.*)/g, '<h1 class="text-3xl font-bold text-gray-900 mt-12 mb-8">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$1</code></pre>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  const sharePost = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      // 備用方案：複製連結
      navigator.clipboard.writeText(window.location.href);
      alert('連結已複製到剪貼簿');
    }
  };

  // 設定 SEO meta（僅在瀏覽器環境）
  useEffect(() => {
    if (post && typeof window !== 'undefined') {
      document.title = post.seo_title || post.title;
      
      // 更新 meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.seo_description || post.excerpt);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', post.seo_description || post.excerpt);
        document.head.appendChild(metaDescription);
      }
    }
  }, [post]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-white border-b"></div>
          <div className="max-w-4xl mx-auto p-6">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onSignOut={handleSignOut} />
        
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="h-16 w-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">文章不存在</h1>
            <p className="text-gray-600 mb-6">
              {error || '您要查看的文章不存在或已被移除'}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回 Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      
      <article className="max-w-4xl mx-auto p-6">
        {/* 返回連結 */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回 Blog
          </Link>
        </div>

        {/* 文章頭部 */}
        <header className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {/* 分類標籤 */}
          {post.blog_categories && (
            <div className="mb-4">
              <Link
                href={`/blog?category=${post.blog_categories.id}`}
                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                style={{ backgroundColor: post.blog_categories.color }}
              >
                {post.blog_categories.name}
              </Link>
            </div>
          )}

          {/* 文章標題 */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* 文章摘要 */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* 文章資訊 */}
          <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {post.users?.name || '未知作者'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(post.published_at)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {post.reading_time || 1} 分鐘閱讀
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                {post.view_count || 0} 次瀏覽
              </div>
            </div>
            
            <button
              onClick={sharePost}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mt-4 md:mt-0"
            >
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </button>
          </div>
        </header>

        {/* 精選圖片 */}
        {post.featured_image_url && (
          <div className="mb-8">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* 文章內容 */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div 
            className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-4">${formatContent(post.content)}</p>` 
            }}
          />
        </div>

        {/* 標籤 */}
        {post.tags && post.tags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              標籤
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?search=${tag.name}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 相關文章 */}
        {relatedPosts.length > 0 && (
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">相關文章</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(relatedPost.published_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default BlogDetailPage;