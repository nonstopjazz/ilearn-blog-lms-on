import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createSupabaseClient()
    
    // 查詢文章詳情
    const { data: post, error } = await supabase
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
          user_metadata
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !post) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post not found',
          data: null
        },
        { status: 404 }
      )
    }
    
    // 獲取文章標籤
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
        name: post.author.user_metadata?.name || post.author.email?.split('@')[0] || 'Unknown',
        email: post.author.email,
        avatar_url: post.author.user_metadata?.avatar_url
      }
    }
    delete post.author
    delete post.author_id

    return NextResponse.json({
      success: true,
      data: post
    })

  } catch (error) {
    console.error('獲取文章詳情失敗:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        data: null 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createSupabaseServerClient()
    
    // 檢查用戶權限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image_url,
      category_id,
      status,
      is_featured,
      seo_title,
      seo_description,
      read_time,
      tags = []
    } = body
    
    // 更新文章基本資訊
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url
    if (category_id !== undefined) updateData.category_id = category_id
    if (status !== undefined) updateData.status = status
    if (is_featured !== undefined) updateData.is_featured = is_featured
    if (seo_title !== undefined) updateData.seo_title = seo_title
    if (seo_description !== undefined) updateData.seo_description = seo_description
    if (read_time !== undefined) updateData.read_time = read_time
    
    // 如果狀態變更為已發布，更新發布時間
    if (status === 'published') {
      const { data: currentPost } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single()
      
      if (!currentPost?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }
    
    // 更新文章
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('更新文章失敗:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      )
    }
    
    // 更新標籤關聯
    if (tags !== undefined) {
      // 先刪除現有的標籤關聯
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', id)
      
      // 新增新的標籤關聯
      if (tags.length > 0) {
        const tagRelations = tags.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId
        }))
        
        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagRelations)
        
        if (tagError) {
          console.error('Failed to update tags:', tagError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
    })

  } catch (error) {
    console.error('更新文章失敗:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createSupabaseServerClient()
    
    // 檢查用戶權限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // 刪除文章（標籤關聯會由 CASCADE 自動刪除）
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('刪除文章失敗:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    console.error('刪除文章失敗:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}