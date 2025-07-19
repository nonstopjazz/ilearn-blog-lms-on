import { NextRequest, NextResponse } from 'next/server'
import { blogData, BlogCategory } from '@/lib/blog-data'

// GET - 獲取所有分類
export async function GET() {
  try {
    const categories = blogData.getAllCategories()
    
    // 更新每個分類的文章數量
    const posts = blogData.getAllPosts()
    const categoriesWithCount = categories.map(category => ({
      ...category,
      post_count: posts.filter(post => 
        post.blog_categories?.id === category.id && post.status === 'published'
      ).length
    }))
    
    return NextResponse.json({
      success: true,
      categories: categoriesWithCount
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
    const body = await request.json()
    const { name, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    // 檢查是否已存在同名分類
    const existingCategories = blogData.getAllCategories()
    const existingCategory = existingCategories.find(category => 
      category.name.toLowerCase().trim() === name.toLowerCase().trim()
    )

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 409 }
      )
    }

    // 創建新分類
    const newCategory: BlogCategory = {
      id: blogData.generateId(),
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      color: color || '#6B7280',
      post_count: 0
    }

    // 添加到資料存儲
    const createdCategory = blogData.addCategory(newCategory)

    return NextResponse.json({
      success: true,
      category: createdCategory,
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