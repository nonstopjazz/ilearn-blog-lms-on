import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - 獲取所有標籤
export async function GET() {
  try {
    console.log('Tags GET: Starting request')
    const supabase = createSupabaseClient()
    console.log('Tags GET: Supabase client initialized')
    
    const { data: tags, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Tags GET: Database error:', error)
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
          tags: []
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tags: tags || []
    })
  } catch (error) {
    console.error('Tags API GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tags',
        tags: []
      },
      { status: 500 }
    )
  }
}

// POST - 創建新標籤
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()
    
    // 生成 slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 創建新標籤
    const { data: newTag, error } = await supabase
      .from('blog_tags')
      .insert({
        name: name.trim(),
        slug: slug,
        color: color || '#6B7280'
      })
      .select()
      .single()

    if (error) {
      // 處理唯一性約束錯誤
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Tag with this name already exists' },
          { status: 409 }
        )
      }
      
      console.error('Failed to create tag:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create tag'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newTag,
      message: 'Tag created successfully'
    })

  } catch (error) {
    console.error('Tags API POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create tag'
      },
      { status: 500 }
    )
  }
}

// PUT - 更新標籤
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, color } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()
    
    // 生成新的 slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 更新標籤
    const { data: updatedTag, error } = await supabase
      .from('blog_tags')
      .update({
        name: name.trim(),
        slug: slug,
        color: color || '#6B7280'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Tag with this name already exists' },
          { status: 409 }
        )
      }
      
      console.error('Failed to update tag:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update tag'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    })

  } catch (error) {
    console.error('Tags API PUT error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update tag'
      },
      { status: 500 }
    )
  }
}

// DELETE - 刪除標籤
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()
    
    // 先刪除所有文章與此標籤的關聯（已由 CASCADE 自動處理）
    
    // 刪除標籤
    const { error } = await supabase
      .from('blog_tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete tag:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete tag'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    })

  } catch (error) {
    console.error('Tags API DELETE error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete tag'
      },
      { status: 500 }
    )
  }
}