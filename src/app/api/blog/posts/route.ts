import { NextRequest, NextResponse } from 'next/server'
import { blogData, BlogPost } from '@/lib/blog-data'

// GET - 獲取文章列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 獲取查詢參數
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // 獲取所有文章
    let posts = blogData.getAllPosts()
    
    // 按狀態篩選
    if (status) {
      posts = posts.filter(post => post.status === status)
    }
    
    // 按精選狀態篩選
    if (featured === 'true') {
      posts = posts.filter(post => post.is_featured)
    }
    
    // 按分類篩選
    if (category) {
      posts = posts.filter(post => 
        post.blog_categories?.id === category
      )
    }
    
    // 按發布時間排序（最新的在前）
    posts.sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at)
      const dateB = new Date(b.published_at || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })
    
    // 限制數量
    posts = posts.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      posts: posts,
      total: posts.length
    })
    
  } catch (error) {
    console.error('Blog posts API GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch posts',
        posts: []
      },
      { status: 500 }
    )
  }
}

// POST - 創建新文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      content, 
      excerpt, 
      category_id,
      tags = [],
      status = 'draft',
      is_featured = false 
    } = body

    // 驗證必填欄位
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // 生成 slug
    const slug = blogData.generateSlug(title)
    
    // 檢查 slug 是否已存在
    const existingPost = blogData.getPostBySlug(slug)
    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'A post with this title already exists' },
        { status: 409 }
      )
    }

    // 獲取分類資訊
    let categoryInfo = null
    if (category_id) {
      categoryInfo = blogData.getCategoryById(category_id)
    }

    // 創建新文章
    const newPost: BlogPost = {
      id: blogData.generateId(),
      title: title.trim(),
      slug: slug,
      content: content,
      excerpt: excerpt || content.replace(/[#*`]/g, '').substring(0, 200) + '...',
      featured_image_url: null,
      view_count: 0,
      reading_time: Math.max(1, Math.ceil(content.length / 1000)), // 估算閱讀時間
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_featured: Boolean(is_featured),
      status: status as 'draft' | 'published',
      tags: Array.isArray(tags) ? tags : [],
      blog_categories: categoryInfo ? {
        id: categoryInfo.id,
        name: categoryInfo.name,
        slug: categoryInfo.slug,
        color: categoryInfo.color
      } : undefined,
      users: {
        name: 'Admin User' // TODO: 從認證系統獲取實際用戶
      }
    }

    // 添加到資料存儲
    const createdPost = blogData.addPost(newPost)

    return NextResponse.json({
      success: true,
      post: createdPost,
      message: 'Post created successfully'
    })

  } catch (error) {
    console.error('Blog posts API POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create post'
      },
      { status: 500 }
    )
  }
}