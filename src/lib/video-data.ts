// 影片相關的資料結構和管理

export interface VideoSource {
  type: 'bunny' | 'youtube' | 'direct'
  url: string
  quality?: string // '480p' | '720p' | '1080p'
}

export interface BunnyVideoConfig {
  video_id: string
  library_id: string
  pull_zone: string
  storage_zone?: string
  thumbnail_url?: string
  available_qualities: string[]
  video_status: 'processing' | 'ready' | 'error'
  duration?: number // 秒數
}

export interface VideoProgress {
  user_id: string
  lesson_id: string
  current_time: number // 當前播放時間（秒）
  duration: number // 總時長（秒）
  progress_percentage: number // 進度百分比
  completed: boolean // 是否完成（80%以上視為完成）
  last_watched_at: string
}

export interface LessonWithVideo {
  id: string
  course_id: string
  title: string
  description?: string
  content?: string
  lesson_type: 'video' | 'text'
  order_index: number
  is_preview: boolean
  is_published: boolean
  
  // 影片相關
  video_sources: VideoSource[]
  primary_video_type: 'bunny' | 'youtube' | 'direct'
  bunny_config?: BunnyVideoConfig
  youtube_video_id?: string
  video_duration?: number
  
  created_at: string
  updated_at: string
}

// 模擬課程和單元資料
const sampleLessons: LessonWithVideo[] = [
  // course_001 的單元
  {
    id: 'lesson_001',
    course_id: 'course_001',
    title: 'React 基礎介紹',
    description: '學習 React 的基本概念和核心功能',
    content: 'React 是一個用於構建用戶界面的 JavaScript 函式庫...',
    lesson_type: 'video',
    order_index: 1,
    is_preview: true,
    is_published: true,
    video_sources: [
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=dGcsHMXbSOA'
      }
    ],
    primary_video_type: 'youtube',
    youtube_video_id: 'dGcsHMXbSOA',
    video_duration: 1800, // 30分鐘
    created_at: '2025-07-14T10:00:00Z',
    updated_at: '2025-07-14T10:00:00Z'
  },
  {
    id: 'lesson_002',
    course_id: 'course_001',
    title: 'JSX 語法詳解',
    description: '深入了解 JSX 語法和最佳實踐',
    content: 'JSX 是 JavaScript 的語法擴展...',
    lesson_type: 'video',
    order_index: 2,
    is_preview: false,
    is_published: true,
    video_sources: [
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=QFaFIcGhPoM'
      }
    ],
    primary_video_type: 'youtube',
    youtube_video_id: 'QFaFIcGhPoM',
    video_duration: 2100, // 35分鐘
    created_at: '2025-07-14T11:00:00Z',
    updated_at: '2025-07-14T11:00:00Z'
  },
  {
    id: 'lesson_003',
    course_id: 'course_001',
    title: '組件和 Props',
    description: '學習如何創建和使用 React 組件',
    lesson_type: 'text',
    order_index: 3,
    is_preview: false,
    is_published: true,
    video_sources: [],
    primary_video_type: 'youtube',
    content: `# React 組件和 Props

## 什麼是組件？

React 組件是構建用戶界面的基本單位。每個組件都是一個獨立的、可重用的程式碼片段。

## Props 的概念

Props 是傳遞給組件的屬性，讓組件變得動態和可重用。

## 創建第一個組件

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}
\`\`\`

## 使用組件

\`\`\`jsx
function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
    </div>
  );
}
\`\`\`

這樣就可以創建可重用的組件了！`,
    created_at: '2025-07-14T12:00:00Z',
    updated_at: '2025-07-14T12:00:00Z'
  },
  {
    id: 'lesson_004',
    course_id: 'course_001',
    title: 'State 和生命週期',
    description: '學習 React 的狀態管理和組件生命週期',
    lesson_type: 'video',
    order_index: 4,
    is_preview: false,
    is_published: true,
    video_sources: [
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=IYvD9oBCuJI'
      }
    ],
    primary_video_type: 'youtube',
    youtube_video_id: 'IYvD9oBCuJI',
    video_duration: 2400, // 40分鐘
    created_at: '2025-07-14T13:00:00Z',
    updated_at: '2025-07-14T13:00:00Z'
  },
  {
    id: 'lesson_005',
    course_id: 'course_001',
    title: '事件處理',
    description: '學習如何在 React 中處理用戶事件',
    lesson_type: 'text',
    order_index: 5,
    is_preview: false,
    is_published: true,
    video_sources: [],
    primary_video_type: 'youtube',
    content: `# React 事件處理

## 基本事件處理

在 React 中，我們使用 JSX 來處理事件：

\`\`\`jsx
function Button() {
  function handleClick() {
    alert('Button clicked!');
  }

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
\`\`\`

## 傳遞參數

有時我們需要傳遞參數給事件處理函數：

\`\`\`jsx
function ItemList() {
  function handleItemClick(id) {
    console.log('Clicked item:', id);
  }

  return (
    <div>
      <button onClick={() => handleItemClick(1)}>Item 1</button>
      <button onClick={() => handleItemClick(2)}>Item 2</button>
    </div>
  );
}
\`\`\`

## 阻止預設行為

\`\`\`jsx
function Link() {
  function handleClick(e) {
    e.preventDefault();
    console.log('Link was clicked');
  }

  return (
    <a href="#" onClick={handleClick}>
      Click me
    </a>
  );
}
\`\`\``,
    created_at: '2025-07-14T14:00:00Z',
    updated_at: '2025-07-14T14:00:00Z'
  },
  // course_002 的單元 (範例)
  {
    id: 'lesson_201',
    course_id: 'course_002',
    title: 'JavaScript ES6+ 新特性',
    description: '深入了解現代 JavaScript 的新特性',
    lesson_type: 'video',
    order_index: 1,
    is_preview: true,
    is_published: true,
    video_sources: [
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=nZ1DMMsyVyI'
      }
    ],
    primary_video_type: 'youtube',
    youtube_video_id: 'nZ1DMMsyVyI',
    video_duration: 3600, // 60分鐘
    created_at: '2025-07-14T15:00:00Z',
    updated_at: '2025-07-14T15:00:00Z'
  },
  // 保留您原本的 lesson_002 (Bunny.net 範例)
  {
    id: 'lesson_bunny_example',
    course_id: 'course_003',
    title: 'Bunny.net 影片範例',
    description: '這是 Bunny.net 影片播放的範例',
    content: 'Bunny.net 提供高品質的影片串流服務...',
    lesson_type: 'video',
    order_index: 1,
    is_preview: false,
    is_published: true,
    video_sources: [
      {
        type: 'bunny',
        url: 'https://your-pullzone.b-cdn.net/videos/jsx-tutorial/playlist.m3u8',
        quality: '1080p'
      },
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=example2'
      }
    ],
    primary_video_type: 'bunny',
    bunny_config: {
      video_id: 'jsx-tutorial-001',
      library_id: 'your-library-id',
      pull_zone: 'your-pullzone.b-cdn.net',
      thumbnail_url: 'https://your-pullzone.b-cdn.net/videos/jsx-tutorial/thumbnail.jpg',
      available_qualities: ['480p', '720p', '1080p'],
      video_status: 'ready',
      duration: 2100
    },
    video_duration: 2100, // 35分鐘
    created_at: '2025-07-14T11:00:00Z',
    updated_at: '2025-07-14T11:00:00Z'
  }
]

// 模擬用戶觀看進度
const videoProgresses: VideoProgress[] = [
  {
    user_id: '36258aeb-f26d-406e-a8ed-25595a736614',
    lesson_id: 'lesson_001',
    current_time: 900, // 15分鐘
    duration: 1800,
    progress_percentage: 50,
    completed: false,
    last_watched_at: '2025-07-14T15:30:00Z'
  }
]

// 資料操作函數
export const videoData = {
  // 課程單元
  getAllLessons: () => [...sampleLessons],
  getLessonById: (id: string) => sampleLessons.find(lesson => lesson.id === id),
  getLessonsByCourse: (courseId: string) => 
    sampleLessons.filter(lesson => lesson.course_id === courseId),
  
  addLesson: (lesson: LessonWithVideo) => {
    sampleLessons.push(lesson)
    return lesson
  },
  
  updateLesson: (id: string, updates: Partial<LessonWithVideo>) => {
    const index = sampleLessons.findIndex(lesson => lesson.id === id)
    if (index !== -1) {
      sampleLessons[index] = { 
        ...sampleLessons[index], 
        ...updates, 
        updated_at: new Date().toISOString() 
      }
      return sampleLessons[index]
    }
    return null
  },

  // 觀看進度
  getUserProgress: (userId: string, lessonId: string) => 
    videoProgresses.find(p => p.user_id === userId && p.lesson_id === lessonId),
  
  updateProgress: (userId: string, lessonId: string, progressData: Partial<VideoProgress>) => {
    const existingIndex = videoProgresses.findIndex(
      p => p.user_id === userId && p.lesson_id === lessonId
    )
    
    const lesson = sampleLessons.find(l => l.id === lessonId)
    const duration = lesson?.video_duration || 0
    
    const progress: VideoProgress = {
      user_id: userId,
      lesson_id: lessonId,
      current_time: progressData.current_time || 0,
      duration: duration,
      progress_percentage: duration > 0 ? Math.round((progressData.current_time || 0) / duration * 100) : 0,
      completed: duration > 0 ? (progressData.current_time || 0) / duration >= 0.8 : false,
      last_watched_at: new Date().toISOString(),
      ...progressData
    }
    
    if (existingIndex >= 0) {
      videoProgresses[existingIndex] = progress
    } else {
      videoProgresses.push(progress)
    }
    
    return progress
  },

  getAllUserProgress: (userId: string) => 
    videoProgresses.filter(p => p.user_id === userId),

  // Bunny.net 相關
  generateBunnyUrl: (config: BunnyVideoConfig, quality: string = '720p') => {
    return `https://${config.pull_zone}/videos/${config.video_id}/${quality}.mp4`
  },

  generateBunnyHLSUrl: (config: BunnyVideoConfig) => {
    return `https://${config.pull_zone}/videos/${config.video_id}/playlist.m3u8`
  },

  // YouTube 相關
  extractYouTubeId: (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  },

  generateYouTubeEmbedUrl: (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`
  },

  // 工具函數
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  },

  generateId: () => (Date.now() + Math.random()).toString()
}