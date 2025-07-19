import { NextRequest, NextResponse } from 'next/server'
import { blogData } from '@/lib/blog-data'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    // 從共享存儲中查找文章
    const post = blogData.getPostBySlug(slug)
    
    if (!post) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post not found',
          post: null,
          debug: {
            requestedSlug: slug,
            availablePosts: blogData.getAllPosts().map(p => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              status: p.status
            }))
          }
        },
        { status: 404 }
      )
    }

    // 增加瀏覽次數
    const updatedPost = blogData.updatePost(post.id, {
      view_count: post.view_count + 1
    })

    return NextResponse.json({
      success: true,
      post: updatedPost || post
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

// PUT - 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()
    
    // 查找文章
    const existingPost = blogData.getPostBySlug(slug)
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // 更新文章
    const updatedPost = blogData.updatePost(existingPost.id, {
      ...body,
      updated_at: new Date().toISOString()
    })

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

// DELETE - 刪除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    // 查找文章
    const existingPost = blogData.getPostBySlug(slug)
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // 刪除文章
    const deletedPost = blogData.deletePost(existingPost.id)

    return NextResponse.json({
      success: true,
      post: deletedPost,
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