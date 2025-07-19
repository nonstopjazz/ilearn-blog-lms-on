import { NextRequest, NextResponse } from 'next/server'
import { blogData } from '@/lib/blog-data'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 從共享存儲中查找文章
    const post = blogData.getPostById(id)
    
    if (!post) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post not found',
          post: null,
          debug: {
            requestedId: id,
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
        post: null 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // 檢查文章是否存在
    const existingPost = blogData.getPostById(id)
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // 更新文章
    const updatedPost = blogData.updatePost(id, {
      ...body,
      updated_at: new Date().toISOString()
    })

    if (!updatedPost) {
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      )
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 檢查文章是否存在
    const existingPost = blogData.getPostById(id)
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // 刪除文章
    const success = blogData.deletePost(id)

    if (!success) {
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