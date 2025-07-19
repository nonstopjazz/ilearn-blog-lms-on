// 共享的 Blog 資料存儲
// 這個檔案將被所有 Blog API 使用，確保資料一致性

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url?: string
  view_count: number
  reading_time: number
  published_at: string | null
  created_at: string
  updated_at: string
  is_featured: boolean
  status: 'draft' | 'published'
  tags: string[]
  blog_categories?: {
    id: string
    name: string
    slug: string
    color: string
  }
  users?: {
    name: string
    avatar_url?: string
  }
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  color: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  color: string
  post_count: number
}

// 初始文章資料
const initialPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Next.js 14 完整指南',
    slug: 'nextjs-14-guide',
    content: `# Next.js 14 完整指南

Next.js 14 帶來了許多令人興奮的新功能和改進，讓 React 開發變得更加高效。

## 主要新功能

### 1. Server Actions (穩定版)
Server Actions 現在已經穩定，可以在生產環境中使用。

\`\`\`jsx
// app/actions.js
'use server'

export async function createPost(formData) {
  const title = formData.get('title')
  // 處理表單資料
}
\`\`\`

### 2. Partial Prerendering (實驗性)
這是一個革命性的功能，結合了靜態和動態渲染。

### 3. 改進的 Metadata API
更靈活的 SEO 和社交媒體優化。

## 性能改進

- **更快的本地開發**：啟動時間減少 53%
- **更小的包大小**：減少不必要的程式碼
- **改進的 Tree Shaking**

## 如何升級

\`\`\`bash
npm install next@latest react@latest react-dom@latest
\`\`\`

記得檢查您的程式碼是否相容新版本。

## 結論

Next.js 14 是一個重要的更新，建議所有專案都升級到這個版本。`,
    excerpt: '探索 Next.js 14 的最新功能，包括 App Router、Server Components 和效能優化...',
    featured_image_url: null,
    view_count: 234,
    reading_time: 8,
    published_at: '2025-07-14T10:00:00Z',
    created_at: '2025-07-14T10:00:00Z',
    updated_at: '2025-07-14T10:00:00Z',
    is_featured: true,
    status: 'published',
    tags: ['Next.js', 'React', 'Web開發', 'JavaScript'],
    blog_categories: {
      id: '1',
      name: 'Web開發',
      slug: 'web-dev',
      color: '#3B82F6'
    },
    users: {
      name: 'Tech Team',
      avatar_url: null
    }
  },
  {
    id: '2',
    title: 'React 狀態管理最佳實踐',
    slug: 'react-state-management',
    content: `# React 狀態管理最佳實踐

狀態管理是 React 應用程式中最重要的概念之一。

## 基本狀態管理

### useState Hook
最基本的狀態管理方式：

\`\`\`jsx
const [count, setCount] = useState(0)
\`\`\`

### useReducer Hook
對於複雜狀態邏輯：

\`\`\`jsx
const [state, dispatch] = useReducer(reducer, initialState)
\`\`\`

## 全域狀態管理

### Context API
React 內建的解決方案：

\`\`\`jsx
const ThemeContext = createContext()
\`\`\`

### 第三方解決方案
- Redux Toolkit
- Zustand
- Jotai

## 最佳實踐

1. **保持狀態扁平**
2. **避免不必要的重新渲染**
3. **合理使用 memo 和 callback**

## 結論

選擇合適的狀態管理方案對專案成功至關重要。`,
    excerpt: '深入了解 React 狀態管理的各種方法，從 useState 到 Redux Toolkit...',
    featured_image_url: null,
    view_count: 156,
    reading_time: 6,
    published_at: '2025-07-13T15:30:00Z',
    created_at: '2025-07-13T15:30:00Z',
    updated_at: '2025-07-13T15:30:00Z',
    is_featured: false,
    status: 'published',
    tags: ['React', 'JavaScript', '狀態管理'],
    blog_categories: {
      id: '2',
      name: 'React',
      slug: 'react',
      color: '#10B981'
    },
    users: {
      name: 'Developer',
      avatar_url: null
    }
  },
  {
    id: '3',
    title: 'TypeScript 進階技巧',
    slug: 'typescript-advanced',
    content: `# TypeScript 進階技巧

TypeScript 的進階功能可以大大提升開發效率和程式碼品質。

## 進階類型

### 聯合類型
\`\`\`typescript
type Status = 'loading' | 'success' | 'error'
\`\`\`

### 泛型約束
\`\`\`typescript
interface Lengthwise {
  length: number
}

function longest<T extends Lengthwise>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}
\`\`\`

### 條件類型
\`\`\`typescript
type ApiResponse<T> = T extends string ? string : number
\`\`\`

## 實用技巧

### 類型保護
\`\`\`typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}
\`\`\`

### 映射類型
\`\`\`typescript
type Partial<T> = {
  [P in keyof T]?: T[P]
}
\`\`\`

## 結論

掌握這些進階技巧能讓您寫出更安全、更易維護的程式碼。`,
    excerpt: 'TypeScript 的進階功能和設計模式，提升你的開發效率...',
    featured_image_url: null,
    view_count: 189,
    reading_time: 10,
    published_at: '2025-07-12T09:15:00Z',
    created_at: '2025-07-12T09:15:00Z',
    updated_at: '2025-07-12T09:15:00Z',
    is_featured: true,
    status: 'published',
    tags: ['TypeScript', 'JavaScript', '進階技巧'],
    blog_categories: {
      id: '3',
      name: 'TypeScript',
      slug: 'typescript',
      color: '#8B5CF6'
    },
    users: {
      name: 'Code Expert',
      avatar_url: null
    }
  }
]

// 全域資料存儲
let blogPosts: BlogPost[] = [...initialPosts]

let blogTags: BlogTag[] = [
  { id: '1', name: 'Next.js', slug: 'nextjs', color: '#000000' },
  { id: '2', name: 'React', slug: 'react', color: '#61DAFB' },
  { id: '3', name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
  { id: '4', name: 'JavaScript', slug: 'javascript', color: '#F7DF1E' },
  { id: '5', name: 'Web開發', slug: 'web-dev', color: '#FF6B6B' },
  { id: '6', name: '後端開發', slug: 'backend', color: '#4ECDC4' },
  { id: '7', name: 'API', slug: 'api', color: '#45B7D1' },
  { id: '8', name: '資料庫', slug: 'database', color: '#96CEB4' }
]

let blogCategories: BlogCategory[] = [
  { id: '1', name: 'Web開發', slug: 'web-dev', color: '#3B82F6', post_count: 5 },
  { id: '2', name: 'React', slug: 'react', color: '#10B981', post_count: 3 },
  { id: '3', name: 'TypeScript', slug: 'typescript', color: '#8B5CF6', post_count: 4 },
  { id: '4', name: 'Node.js', slug: 'nodejs', color: '#F59E0B', post_count: 2 },
  { id: '5', name: 'UI/UX', slug: 'ui-ux', color: '#EF4444', post_count: 1 }
]

// 導出函數來操作資料
export const blogData = {
  // Posts
  getAllPosts: () => [...blogPosts],
  getPostBySlug: (slug: string) => blogPosts.find(post => post.slug === slug),
  getPostById: (id: string) => blogPosts.find(post => post.id === id),
  addPost: (post: BlogPost) => {
    blogPosts.push(post)
    return post
  },
  updatePost: (id: string, updates: Partial<BlogPost>) => {
    const index = blogPosts.findIndex(post => post.id === id)
    if (index !== -1) {
      blogPosts[index] = { ...blogPosts[index], ...updates, updated_at: new Date().toISOString() }
      return blogPosts[index]
    }
    return null
  },
  deletePost: (id: string) => {
    const index = blogPosts.findIndex(post => post.id === id)
    if (index !== -1) {
      const deleted = blogPosts.splice(index, 1)
      return deleted[0]
    }
    return null
  },

  // Tags
  getAllTags: () => [...blogTags],
  getTagById: (id: string) => blogTags.find(tag => tag.id === id),
  addTag: (tag: BlogTag) => {
    blogTags.push(tag)
    return tag
  },

  // Categories
  getAllCategories: () => [...blogCategories],
  getCategoryById: (id: string) => blogCategories.find(cat => cat.id === id),
  addCategory: (category: BlogCategory) => {
    blogCategories.push(category)
    return category
  },

  // 生成新的 ID
  generateId: () => (Date.now() + Math.random()).toString(),

  // 生成 slug
  generateSlug: (title: string) => 
    title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50)
}