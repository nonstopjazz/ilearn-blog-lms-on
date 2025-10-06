import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - 獲取文章列表
export async function GET(request: NextRequest) {
  try {
    console.log('Posts GET: Starting request')
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || null
    const category = searchParams.get('category') || null
    const tag = searchParams.get('tag') || null
    const search = searchParams.get('search') || null
    const featured = searchParams.get('featured') || null

    console.log('Posts GET: Query params:', { page, limit, status, category, tag, search, featured })

    const supabase = createSupabaseClient()
    console.log('Posts GET: Supabase server client initialized')
    
    // 計算分頁
    const offset = (page - 1) * limit
    
    // 建立查詢
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          id,
          name,
          slug,
          color
        ),
        author:author_id (
          id,
          email,
          name,
          avatar_url,
          role
        )
      `, { count: 'exact' })
    
    // 篩選條件
    if (status) {
      query = query.eq('status', status)
    }
    
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }
    
    if (category) {
      query = query.eq('category_id', category)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }
    
    // 排序和分頁
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: posts, error, count } = await query
    
    if (error) {
      console.error('Posts GET: Database error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${error.message}`,
          posts: []
        },
        { status: 500 }
      )
    }
    
    console.log('Posts GET: Fetched posts count:', posts?.length || 0)
    
    // 如果有標籤篩選，需要額外查詢
    let filteredPosts = posts || []
    if (tag && posts) {
      const postIds = posts.map(p => p.id)
      const { data: taggedPosts } = await supabase
        .from('blog_post_tags')
        .select('post_id')
        .eq('tag_id', tag)
        .in('post_id', postIds)
      
      const taggedPostIds = taggedPosts?.map(tp => tp.post_id) || []
      filteredPosts = posts.filter(p => taggedPostIds.includes(p.id))
    }
    
    // 獲取每篇文章的標籤
    for (const post of filteredPosts) {
      const { data: postTags } = await supabase
        .from('blog_post_tags')
        .select(`
          blog_tags (
            id,
            name,
            slug,
            color
          )
        `)
        .eq('post_id', post.id)
      
      post.tags = postTags?.map(pt => pt.blog_tags).filter(Boolean) || []
      
      // 格式化作者資訊
      if (post.author) {
        post.users = {
          name: post.author.name || post.author.email?.split('@')[0] || 'Unknown',
          email: post.author.email,
          avatar_url: post.author.avatar_url
        }
      }
      delete post.author
      delete post.author_id
    }
    
    return NextResponse.json({
      success: true,
      posts: filteredPosts,
      total: count || 0,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Posts API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        posts: []
      },
      { status: 500 }
    )
  }
}

// POST - 創建新文章
export async function POST(request: NextRequest) {
  try {
    console.log('Posts POST: Starting request')
    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image_url,
      category_id,
      author_id, // 從前端傳入
      status = 'draft',
      is_featured = false,
      seo_title,
      seo_description,
      tags = []
    } = body

    const supabase = createSupabaseAdminClient()
    
    // 驗證必填欄位
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }
    
    // 生成 slug（如果沒有提供）
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    // 創建文章
    const { data: newPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        id: crypto.randomUUID(),
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || content.replace(/[#*`]/g, '').substring(0, 200) + '...',
        featured_image_url,
        category_id,
        author_id: author_id || null,
        status,
        is_featured,
        seo_title,
        seo_description,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()
    
    if (postError) {
      if (postError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A post with this slug already exists' },
          { status: 409 }
        )
      }
      console.error('Failed to create post:', postError)
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
        { status: 500 }
      )
    }
    
    // 關聯標籤
    if (tags.length > 0 && newPost) {
      const tagRelations = tags.map((tagId: string) => ({
        post_id: newPost.id,
        tag_id: tagId
      }))
      
      const { error: tagError } = await supabase
        .from('blog_post_tags')
        .insert(tagRelations)
      
      if (tagError) {
        console.error('Failed to associate tags:', tagError)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: newPost,
      message: 'Post created successfully'
    })
    
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}