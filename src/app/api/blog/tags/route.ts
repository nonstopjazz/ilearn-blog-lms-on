import { NextRequest, NextResponse } from 'next/server'
import { blogData, BlogTag } from '@/lib/blog-data'

// GET - 獲取所有標籤
export async function GET() {
  try {
    const tags = blogData.getAllTags()
    
    return NextResponse.json({
      success: true,
      tags: tags
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

    // 檢查是否已存在同名標籤
    const existingTags = blogData.getAllTags()
    const existingTag = existingTags.find(tag => 
      tag.name.toLowerCase().trim() === name.toLowerCase().trim()
    )

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag already exists' },
        { status: 409 }
      )
    }

    // 創建新標籤
    const newTag: BlogTag = {
      id: blogData.generateId(),
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      color: color || '#6B7280'
    }

    // 添加到資料存儲
    const createdTag = blogData.addTag(newTag)

    return NextResponse.json({
      success: true,
      tag: createdTag,
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