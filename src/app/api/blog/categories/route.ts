import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - 獲取所有分類
export async function GET() {
  try {
    console.log('Categories GET: Starting request')
    console.log('Categories GET: Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    // 直接使用 createClient，避免 cookies() 問題
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    console.log('Categories GET: Supabase client initialized')
    
    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Categories GET: Database error:', error)
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
          categories: []
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      categories: categories || []
    })
  } catch (error) {
    console.error('Categories API GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        categories: []
      },
      { status: 500 }
    )
  }
}

// POST - 創建新分類
export async function POST(request: NextRequest) {
  try {
    console.log('Categories POST: Starting request')
    const body = await request.json()
    const { name, description, color } = body
    console.log('Categories POST: Request body:', { name, description, color })

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    console.log('Categories POST: Supabase client initialized')
    
    // 生成 slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 創建新分類
    const { data: newCategory, error } = await supabase
      .from('blog_categories')
      .insert({
        id: crypto.randomUUID(), // 手動生成 UUID
        name: name.trim(),
        slug: slug,
        description: description || null,
        color: color || '#6B7280'
      })
      .select()
      .single()

    if (error) {
      // 處理唯一性約束錯誤
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
      
      console.error('Failed to create category:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create category'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    })

  } catch (error) {
    console.error('Categories API POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category'
      },
      { status: 500 }
    )
  }
}

// PUT - 更新分類
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, color } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 生成新的 slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 更新分類
    const { data: updatedCategory, error } = await supabase
      .from('blog_categories')
      .update({
        name: name.trim(),
        slug: slug,
        description: description || null,
        color: color || '#6B7280'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
      
      console.error('Failed to update category:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update category'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    })

  } catch (error) {
    console.error('Categories API PUT error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category'
      },
      { status: 500 }
    )
  }
}

// DELETE - 刪除分類
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 檢查是否有文章使用此分類
    const { data: posts, error: checkError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (checkError) {
      console.error('Failed to check category usage:', checkError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to check category usage'
        },
        { status: 500 }
      )
    }

    if (posts && posts.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete category that has posts' 
        },
        { status: 400 }
      )
    }

    // 刪除分類
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete category:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete category'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Categories API DELETE error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category'
      },
      { status: 500 }
    )
  }
}