import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createSupabaseClient()

    // Query post by slug with relations
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
          name,
          avatar_url,
          role
        )
      `)
      .eq('slug', slug)
      .single()

    if (error || !post) {
      console.error('Post not found:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Post not found',
          post: null
        },
        { status: 404 }
      )
    }

    // Get tags for this post
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

    // Format author info
    if (post.author) {
      post.users = {
        name: post.author.name || post.author.email?.split('@')[0] || 'Unknown',
        email: post.author.email,
        avatar_url: post.author.avatar_url
      }
    }
    delete post.author
    delete post.author_id

    // Update view count
    const adminClient = createSupabaseAdminClient()
    await adminClient
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id)

    return NextResponse.json({
      success: true,
      post
    })

  } catch (error) {
    console.error('Blog post detail API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch post',
        post: null
      },
      { status: 500 }
    )
  }
}

// PUT - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const supabase = createSupabaseAdminClient()

    // Find post by slug
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const { tags, ...postData } = body

    // Update post
    const { data: updatedPost, error } = await supabase
      .from('blog_posts')
      .update({
        ...postData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPost.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update post:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      )
    }

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tags
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', existingPost.id)

      // Insert new tags
      if (tags.length > 0) {
        const tagRelations = tags.map((tagId: string) => ({
          post_id: existingPost.id,
          tag_id: tagId
        }))

        await supabase
          .from('blog_post_tags')
          .insert(tagRelations)
      }
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post updated successfully'
    })

  } catch (error) {
    console.error('Blog post detail API PUT error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update post'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createSupabaseAdminClient()

    // Find post by slug
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete post (cascade will delete related tags)
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', existingPost.id)

    if (error) {
      console.error('Failed to delete post:', error)
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
    console.error('Blog post detail API DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete post'
      },
      { status: 500 }
    )
  }
}
