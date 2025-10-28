'use client';

import { useState, useEffect, useMemo } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GanttChart, { GanttTask } from '@/components/gantt/GanttChart';
import GanttChartYearly from '@/components/gantt/GanttChartYearly';
import DHtmlxGanttChart from '@/components/gantt/DHtmlxGanttChart';
import AssignmentFormDialog from '@/components/assignments/AssignmentFormDialog';
import {
  ClipboardList,
  Target,
  BookOpen,
  TrendingUp,
  Calendar,
  CheckCircle,
  Plus,
  Clock,
  AlertCircle,
  Trophy,
  FileText,
  Download,
  Video,
  PlayCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import Navbar from '@/components/Navbar';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [gradeTimeRange, setGradeTimeRange] = useState('month');
  const [vocabularyTimeRange, setVocabularyTimeRange] = useState('month');
  const [assignmentTimeRange, setAssignmentTimeRange] = useState('month');
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [loadingExamTypes, setLoadingExamTypes] = useState(false);
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);

  // 作業數據狀態（保留，因為沒有對應的詳細頁籤）
  const [assignmentsByWeek, setAssignmentsByWeek] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // 三個頁籤的數據狀態
  const [exams, setExams] = useState<any[]>([]);
  const [vocabularySessions, setVocabularySessions] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingVocabularySessions, setLoadingVocabularySessions] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // 認證狀態
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 課程學習狀態
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // 學生任務狀態
  const [studentTasks, setStudentTasks] = useState<any[]>([]);
  const [loadingStudentTasks, setLoadingStudentTasks] = useState(false);
  const [taskStats, setTaskStats] = useState<any>({});

  // [已棄用] 完整的成績數據（模擬一整年的資料）
  // 現在使用 API 取得真實數據
  const allGradeData_deprecated = [
    // 1月
    { name: "第1週", quiz: 85, class_test: 88, vocabulary_test: 90, speaking_eval: 82, month: 1 },
    { name: "第2週", quiz: 78, class_test: 85, vocabulary_test: 87, speaking_eval: 80, month: 1 },
    { name: "第3週", quiz: 92, class_test: 90, vocabulary_test: 93, speaking_eval: 88, month: 1 },
    { name: "第4週", quiz: 88, class_test: 92, vocabulary_test: 89, speaking_eval: 85, month: 1 },
    // 2月
    { name: "第5週", quiz: 95, class_test: 94, vocabulary_test: 96, speaking_eval: 90, month: 2 },
    { name: "第6週", quiz: 90, class_test: 91, vocabulary_test: 92, speaking_eval: 87, month: 2 },
    { name: "第7週", quiz: 87, class_test: 89, vocabulary_test: 88, speaking_eval: 84, month: 2 },
    { name: "第8週", quiz: 93, class_test: 95, vocabulary_test: 94, speaking_eval: 91, month: 2 },
    // 3月
    { name: "第9週", quiz: 91, class_test: 93, vocabulary_test: 95, speaking_eval: 89, month: 3 },
    { name: "第10週", quiz: 89, class_test: 90, vocabulary_test: 91, speaking_eval: 86, month: 3 },
    { name: "第11週", quiz: 94, class_test: 96, vocabulary_test: 97, speaking_eval: 92, month: 3 },
    { name: "第12週", quiz: 92, class_test: 94, vocabulary_test: 93, speaking_eval: 90, month: 3 },
    // 4月
    { name: "第13週", quiz: 88, class_test: 91, vocabulary_test: 90, speaking_eval: 87, month: 4 },
    { name: "第14週", quiz: 90, class_test: 92, vocabulary_test: 94, speaking_eval: 88, month: 4 },
    { name: "第15週", quiz: 93, class_test: 95, vocabulary_test: 96, speaking_eval: 91, month: 4 },
    { name: "第16週", quiz: 91, class_test: 93, vocabulary_test: 92, speaking_eval: 89, month: 4 },
    // 5月
    { name: "第17週", quiz: 95, class_test: 97, vocabulary_test: 98, speaking_eval: 93, month: 5 },
    { name: "第18週", quiz: 92, class_test: 94, vocabulary_test: 95, speaking_eval: 90, month: 5 },
    { name: "第19週", quiz: 94, class_test: 96, vocabulary_test: 97, speaking_eval: 92, month: 5 },
    { name: "第20週", quiz: 96, class_test: 98, vocabulary_test: 99, speaking_eval: 94, month: 5 },
  ];

  // [已移除] 根據時間範圍篩選資料 - 現在由 API 處理
  // const gradeData = 由 useState 管理，透過 API 載入

  // [已棄用] 完整的單字學習數據（模擬一整年的資料）
  // 現在使用 API 取得真實數據
  const allVocabularyData_deprecated = [
    // 1月 (第1-4週)
    { name: "第1週", 已教單字: 20, 答對單字: 15, 答錯單字: 5, month: 1 },      // 教20個，答對15個 (75%)
    { name: "第2週", 已教單字: 25, 答對單字: 20, 答錯單字: 5, month: 1 },      // 教25個，答對20個 (80%)
    { name: "第3週", 已教單字: 18, 答對單字: 14, 答錯單字: 4, month: 1 },      // 教18個，答對14個 (78%)
    { name: "第4週", 已教單字: 30, 答對單字: 24, 答錯單字: 6, month: 1 },      // 教30個，答對24個 (80%)
    // 2月 (第5-8週)
    { name: "第5週", 已教單字: 22, 答對單字: 18, 答錯單字: 4, month: 2 },      // 教22個，答對18個 (82%)
    { name: "第6週", 已教單字: 28, 答對單字: 22, 答錯單字: 6, month: 2 },      // 教28個，答對22個 (79%)
    { name: "第7週", 已教單字: 24, 答對單字: 20, 答錯單字: 4, month: 2 },      // 教24個，答對20個 (83%)
    { name: "第8週", 已教單字: 26, 答對單字: 21, 答錯單字: 5, month: 2 },      // 教26個，答對21個 (81%)
    // 3月 (第9-12週)
    { name: "第9週", 已教單字: 32, 答對單字: 26, 答錯單字: 6, month: 3 },      // 教32個，答對26個 (81%)
    { name: "第10週", 已教單字: 27, 答對單字: 22, 答錯單字: 5, month: 3 },     // 教27個，答對22個 (81%)
    { name: "第11週", 已教單字: 29, 答對單字: 24, 答錯單字: 5, month: 3 },     // 教29個，答對24個 (83%)
    { name: "第12週", 已教單字: 31, 答對單字: 25, 答錯單字: 6, month: 3 },     // 教31個，答對25個 (81%)
    // 4月 (第13-16週)
    { name: "第13週", 已教單字: 25, 答對單字: 21, 答錯單字: 4, month: 4 },     // 教25個，答對21個 (84%)
    { name: "第14週", 已教單字: 30, 答對單字: 25, 答錯單字: 5, month: 4 },     // 教30個，答對25個 (83%)
    { name: "第15週", 已教單字: 28, 答對單字: 23, 答錯單字: 5, month: 4 },     // 教28個，答對23個 (82%)
    { name: "第16週", 已教單字: 26, 答對單字: 22, 答錯單字: 4, month: 4 },     // 教26個，答對22個 (85%)
    // 5月 (第17-20週)
    { name: "第17週", 已教單字: 33, 答對單字: 28, 答錯單字: 5, month: 5 },     // 教33個，答對28個 (85%)
    { name: "第18週", 已教單字: 29, 答對單字: 25, 答錯單字: 4, month: 5 },     // 教29個，答對25個 (86%)
    { name: "第19週", 已教單字: 31, 答對單字: 27, 答錯單字: 4, month: 5 },     // 教31個，答對27個 (87%)
    { name: "第20週", 已教單字: 28, 答對單字: 25, 答錯單字: 3, month: 5 },     // 教28個，答對25個 (89%)
  ];

  // [已移除] 根據時間範圍篩選單字數據 - 現在由 API 處理
  // const vocabularyData = 由 useState 管理，透過 API 載入

  // [已棄用] 完整的作業數據（模擬多週資料）
  // 現在使用 API 取得真實數據
  const allAssignmentsByWeek_deprecated = [
    {
      week: "第1周",
      dateRange: "2025/1/6-1/12",
      assignments: [
        { name: "每日背誦單字", progress: 75, type: "daily", description: "每天背10個新單字" },
        { name: "英文日記", progress: 90, type: "daily", description: "每天寫50字英文日記" },
        { name: "課文朗讀練習", progress: 60, type: "session", description: "下次上課檢查" },
      ]
    },
    {
      week: "第2周",
      dateRange: "2025/1/13-1/19",
      assignments: [
        { name: "每日背誦單字", progress: 85, type: "daily", description: "每天背10個新單字" },
        { name: "英文日記", progress: 100, type: "daily", description: "每天寫50字英文日記" },
        { name: "課文朗讀練習", progress: 70, type: "session", description: "下次上課檢查" },
      ]
    },
    {
      week: "第3周",
      dateRange: "2025/1/20-1/26",
      assignments: [
        { name: "每日背誦單字", progress: 90, type: "daily", description: "每天背10個新單字" },
        { name: "聽力練習", progress: 60, type: "daily", description: "每天聽15分鐘英文" },
        { name: "作文練習", progress: 45, type: "session", description: "寫一篇150字短文" },
        { name: "文法練習題", progress: 100, type: "session", description: "完成第3章練習" },
      ]
    },
    {
      week: "第4周",
      dateRange: "2025/1/27-2/2",
      assignments: [
        { name: "每日背誦單字", progress: 95, type: "daily", description: "每天背10個新單字" },
        { name: "英文日記", progress: 80, type: "daily", description: "每天寫50字英文日記" },
        { name: "口說練習", progress: 30, type: "session", description: "錄製3分鐘自我介紹" },
      ]
    },
    {
      week: "第5周",
      dateRange: "2025/2/3-2/9",
      assignments: [
        { name: "每日背誦單字", progress: 100, type: "daily", description: "每天背10個新單字" },
        { name: "聽力練習", progress: 70, type: "daily", description: "每天聽15分鐘英文" },
        { name: "課文朗讀練習", progress: 85, type: "session", description: "下次上課檢查" },
      ]
    },
    {
      week: "第6周",
      dateRange: "2025/2/10-2/16",
      assignments: [
        { name: "每日背誦單字", progress: 88, type: "daily", description: "每天背10個新單字" },
        { name: "英文日記", progress: 95, type: "daily", description: "每天寫50字英文日記" },
        { name: "作文練習", progress: 65, type: "session", description: "寫一篇150字短文" },
        { name: "文法練習題", progress: 100, type: "session", description: "完成第4章練習" },
      ]
    }
  ];

  // [已移除] 根據時間範圍篩選作業數據 - 現在由 API 處理
  // const assignmentsByWeek = 由 useState 管理，透過 API 載入

  // 其他頁籤數據（保持 mock 數據用於未登入狀態）
  const mockAssignments = [
    { id: 1, title: "基礎單字 Unit 1-5 (200字)", category: "單字", status: "in-progress", dueDate: "2025/01/20", progress: 75 },
    { id: 2, title: "時態練習 - 現在式", category: "文法", status: "completed", dueDate: "2025/01/15", progress: 100 },
    { id: 3, title: "日常對話練習 Ch.1-3", category: "口說", status: "in-progress", dueDate: "2025/01/25", progress: 50 },
    { id: 4, title: "聽力理解 - 短對話", category: "聽力", status: "not-started", dueDate: "2025/01/30", progress: 0 }
  ];

  // Mock 考試成績數據（用於未登入狀態）
  const mockExams = [
    { id: 1, name: "英語小考 - Unit 1", type: "小考", date: "2025/01/10", score: 88, maxScore: 100, subject: "英語" },
    { id: 2, name: "文法段考 - 時態", type: "段考", date: "2025/01/15", score: 92, maxScore: 100, subject: "英語" },
    { id: 3, name: "聽力測驗", type: "小考", date: "2025/01/18", score: 85, maxScore: 100, subject: "英語" },
    { id: 4, name: "口說評量", type: "評量", date: "2025/01/20", score: 90, maxScore: 100, subject: "英語" }
  ];

  // Mock 單字學習數據（用於未登入狀態）
  const mockVocabularySessions = [
    { id: 1, date: "2025/01/15", wordsLearned: 15, unit: "Unit 1-2", accuracy: 90, duration: 30 },
    { id: 2, date: "2025/01/16", wordsLearned: 20, unit: "Unit 3-4", accuracy: 85, duration: 25 },
    { id: 3, date: "2025/01/17", wordsLearned: 18, unit: "Review", accuracy: 95, duration: 35 },
    { id: 4, date: "2025/01/18", wordsLearned: 25, unit: "Unit 5-6", accuracy: 88, duration: 40 }
  ];

  // Mock 上課進度數據（用於未登入狀態）
  const mockProgressData = [
    { id: 1, date: "2025/01/15", lesson: "Unit 1: 日常問候", topics: ["基本問候語", "自我介紹", "數字1-10"], status: "completed", duration: 60, homework: "背誦對話" },
    { id: 2, date: "2025/01/17", lesson: "Unit 2: 家庭介紹", topics: ["家庭成員", "職業描述", "年齡表達"], status: "completed", duration: 60, homework: "完成練習題" },
    { id: 3, date: "2025/01/19", lesson: "Unit 3: 學校生活", topics: ["課程科目", "時間表達", "校園設施"], status: "in-progress", duration: 45, homework: "準備口說練習" },
    { id: 4, date: "2025/01/22", lesson: "Unit 4: 興趣愛好", topics: ["運動項目", "休閒活動", "頻率副詞"], status: "scheduled", duration: 60, homework: "TBD" }
  ];

  const reports = [
    { id: 1, name: "學習週報 - 第3週", type: "週報", period: "2025/01/13-01/19", status: "ready", size: "2.3 MB" },
    { id: 2, name: "成績分析報告", type: "成績報告", period: "2025/01/01-01/20", status: "ready", size: "1.8 MB" },
    { id: 3, name: "單字學習統計", type: "學習統計", period: "2025/01/01-01/20", status: "generating", size: "1.2 MB" },
    { id: 4, name: "課程進度報告", type: "進度報告", period: "2025/01/01-01/20", status: "ready", size: "3.1 MB" }
  ];

  // 工具函數
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": case "ready": return "default";
      case "in-progress": case "generating": return "secondary";
      case "not-started": case "scheduled": return "outline";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "已完成";
      case "in-progress": return "進行中";
      case "not-started": return "未開始";
      case "scheduled": return "已安排";
      case "ready": return "可下載";
      case "generating": return "生成中";
      default: return "未知";
    }
  };

  const getGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    return 'D';
  };

  // 當前學生資訊（從登入狀態取得）
  const currentStudent = currentUser ? {
    id: currentUser.id,
    name: currentUser.user_metadata?.name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split('@')[0] ||
          '學生',
    courseId: currentUser.user_metadata?.courseId || 'unknown',
    courseName: currentUser.user_metadata?.courseName || '未指定課程',
    grade: currentUser.user_metadata?.grade || '未指定年級'
  } : {
    id: 'guest',
    name: '訪客',
    courseId: 'unknown',
    courseName: '未指定課程',
    grade: '未指定年級'
  };

  // 模擬甘特圖任務數據 - 涵蓋整年度的作業規劃
  const mockGanttTasks: GanttTask[] = [
    // 第一季度 (Q1: 1-3月) - 共同作業
    {
      id: '1',
      title: '寒假作業 - 英語日記',
      description: '每天撰寫100字英語日記',
      courseId: 'course_001',
      startDate: '2025-01-20',
      dueDate: '2025-02-10',
      completedDate: '2025-02-08',
      status: 'completed',
      progress: 100,
      priority: 'high',
      category: '寫作',
      submissionType: 'text',
      estimatedHours: 20,
      isPersonalized: false
    },
    {
      id: '2',
      title: '基礎文法 Unit 1-10',
      description: '完成基礎文法練習',
      courseId: 'course_001',
      startDate: '2025-02-15',
      dueDate: '2025-03-30',
      status: 'in_progress',
      progress: 65,
      priority: 'medium',
      category: '文法',
      submissionType: 'file',
      estimatedHours: 30,
      isPersonalized: false
    },
    {
      id: '3',
      title: '加強口說練習 - 自我介紹',
      description: '針對你的發音問題，特別加強練習',
      courseId: 'course_001',
      startDate: '2025-01-10',
      dueDate: '2025-02-28',
      status: 'in_progress',
      progress: 40,
      priority: 'urgent',
      category: '口說',
      submissionType: 'file',
      estimatedHours: 15,
      isPersonalized: true,
      assignedBy: '陳老師'
    },

    // 第二季度 (Q2: 4-6月)
    {
      id: '4',
      title: '期中專案 - 英語演講',
      description: '準備並錄製10分鐘英語演講',
      courseId: 'course_001',
      startDate: '2025-04-01',
      dueDate: '2025-05-15',
      status: 'not_started',
      progress: 0,
      priority: 'urgent',
      category: '口說',
      submissionType: 'file',
      estimatedHours: 25,
      isPersonalized: false
    },
    {
      id: '5',
      title: '閱讀理解強化 - Harry Potter',
      description: '根據你的興趣，閱讀Harry Potter第一集',
      courseId: 'course_002',
      startDate: '2025-04-10',
      dueDate: '2025-06-30',
      status: 'not_started',
      progress: 0,
      priority: 'medium',
      category: '閱讀',
      submissionType: 'text',
      estimatedHours: 40,
      isPersonalized: true,
      assignedBy: '李老師'
    },
    {
      id: '6',
      title: '單字挑戰 - 1000字',
      description: '背誦並測驗1000個進階單字',
      courseId: 'course_001',
      startDate: '2025-03-15',
      dueDate: '2025-05-30',
      status: 'not_started',
      progress: 0,
      priority: 'high',
      category: '單字',
      submissionType: 'quiz',
      estimatedHours: 50,
      isPersonalized: false
    },

    // 第三季度 (Q3: 7-9月)
    {
      id: '7',
      title: '暑期密集班作業',
      description: '完成暑期密集班所有練習',
      courseId: 'course_002',
      startDate: '2025-07-01',
      dueDate: '2025-08-31',
      status: 'not_started',
      progress: 0,
      priority: 'high',
      category: '綜合',
      submissionType: 'file',
      estimatedHours: 60,
      isPersonalized: false
    },
    {
      id: '8',
      title: '聽力特訓 - BBC Learning English',
      description: '針對你的聽力弱點，特別加強BBC教材',
      courseId: 'course_001',
      startDate: '2025-07-15',
      dueDate: '2025-09-15',
      status: 'not_started',
      progress: 0,
      priority: 'medium',
      category: '聽力',
      submissionType: 'text',
      estimatedHours: 20,
      isPersonalized: true,
      assignedBy: '陳老師'
    },

    // 第四季度 (Q4: 10-12月)
    {
      id: '9',
      title: '年度總複習',
      description: '複習全年學習內容',
      courseId: 'course_001',
      startDate: '2025-10-01',
      dueDate: '2025-11-30',
      status: 'not_started',
      progress: 0,
      priority: 'urgent',
      category: '複習',
      submissionType: 'quiz',
      estimatedHours: 40,
      isPersonalized: false
    },
    {
      id: '10',
      title: '期末專題報告',
      description: '完成年度學習成果報告',
      studentId: '2',
      studentName: '李小華',
      courseId: 'course_001',
      startDate: '2025-11-01',
      dueDate: '2025-12-20',
      status: 'not_started',
      progress: 0,
      priority: 'high',
      category: '專題',
      submissionType: 'file',
      estimatedHours: 35
    },
    {
      id: '11',
      title: '聖誕節特別作業',
      description: '製作英語聖誕賀卡',
      studentId: '3',
      studentName: '張小美',
      courseId: 'course_002',
      startDate: '2025-12-10',
      dueDate: '2025-12-25',
      status: 'not_started',
      progress: 0,
      priority: 'low',
      category: '創作',
      submissionType: 'photo',
      estimatedHours: 10
    },

    // 跨季度的長期作業
    {
      id: '12',
      title: '英語檢定準備 - TOEFL',
      description: '全年度TOEFL考試準備',
      studentId: '4',
      studentName: '陳小傑',
      courseId: 'course_002',
      startDate: '2025-02-01',
      dueDate: '2025-10-31',
      status: 'in_progress',
      progress: 25,
      priority: 'urgent',
      category: '檢定',
      submissionType: 'quiz',
      estimatedHours: 200
    },
    {
      id: '13',
      title: '每週單字測驗',
      description: '每週20個新單字測驗',
      courseId: 'course_001',
      startDate: '2025-01-01',
      dueDate: '2025-12-31',
      status: 'in_progress',
      progress: 10,
      priority: 'medium',
      category: '單字',
      submissionType: 'quiz',
      estimatedHours: 100,
      isPersonalized: false
    },
    // 個人專屬的額外作業
    {
      id: '14',
      title: '文法弱點加強 - 時態混淆',
      description: '針對你常錯的現在完成式和過去完成式',
      courseId: 'course_001',
      startDate: '2025-03-01',
      dueDate: '2025-04-15',
      status: 'not_started',
      progress: 0,
      priority: 'high',
      category: '文法',
      submissionType: 'quiz',
      estimatedHours: 20,
      isPersonalized: true,
      assignedBy: '陳老師'
    },
    {
      id: '15',
      title: '發音矯正計畫',
      description: '特別針對 th 和 r/l 發音問題',
      courseId: 'course_001',
      startDate: '2025-05-01',
      dueDate: '2025-07-31',
      status: 'not_started',
      progress: 0,
      priority: 'medium',
      category: '口說',
      submissionType: 'file',
      estimatedHours: 30,
      isPersonalized: true,
      assignedBy: '李老師'
    }
  ];

  // 檢查認證狀態
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('認證檢查失敗:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // 初始化數據
  useEffect(() => {
    setStudents([currentStudent]); // 只有當前學生
    // 移除模擬資料,改用 API 載入
    // setGanttTasks(mockGanttTasks);
    setAssignments(mockAssignments);
    loadExamTypes();
  }, []);

  // 載入資料（根據認證狀態）
  useEffect(() => {
    if (authLoading) return; // 等待認證檢查完成

    if (isAuthenticated) {
      // 已登入：載入真實 API 數據
      loadAssignments();
      loadStudentTasks();
      loadExamsData();
      loadVocabularySessionsData();
      loadProgressDataAPI();
      loadGanttAssignments(); // 載入甘特圖專案作業
    } else {
      // 未登入：使用 mock 數據
      loadMockData();
    }
  }, [isAuthenticated, authLoading, gradeTimeRange, vocabularyTimeRange, assignmentTimeRange]);

  // 當切換到課程頁籤時載入課程數據
  useEffect(() => {
    if (activeTab === 'courses' && isAuthenticated && currentUser) {
      loadCourses();
    }
  }, [activeTab, isAuthenticated, currentUser]);

  // [已移除] loadGrades 和 loadVocabulary 函數
  // 現在使用 aggregateGradeData 和 aggregateVocabularyData 從詳細數據聚合

  // 載入作業數據（API）- 專案作業用
  const loadAssignments = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingAssignments(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `/api/learning/assignments/progress?student_id=${currentUser.id}&range=${assignmentTimeRange}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        // 轉換 API 數據格式以符合前端需求
        const formattedData = result.data.map((week: any) => ({
          week: week.week_label,
          dateRange: week.date_range,
          assignments: week.assignments.map((assignment: any) => {
            if (assignment.type === 'daily') {
              return {
                name: assignment.name,
                progress: assignment.progress,
                type: 'daily',
                description: assignment.description,
                completedDays: assignment.completed_days,
                totalDays: assignment.total_days,
                streakDays: assignment.streak_days,
                dailyCompletion: assignment.daily_completion
              };
            } else {
              return {
                name: assignment.name,
                progress: assignment.progress,
                type: 'session',
                description: assignment.description,
                status: assignment.status,
                dueDate: assignment.due_date
              };
            }
          })
        }));
        setAssignmentsByWeek(formattedData);
      } else {
        console.error('載入作業數據失敗:', result.error);
        loadMockAssignmentData();
      }
    } catch (error) {
      console.error('載入作業數據時發生錯誤:', error);
      loadMockAssignmentData();
    } finally {
      setLoadingAssignments(false);
    }
  };

  // 載入甘特圖專案作業數據（API）
  const loadGanttAssignments = async () => {
    if (!isAuthenticated || !currentUser) return;

    try {
      console.log('[loadGanttAssignments] 開始載入甘特圖作業資料...');

      // 從新的學生專屬 API 載入專案作業（只包含進行中和已完成）
      const response = await fetch(`/api/assignments/student?student_id=${currentUser.id}&status=in_progress,completed`);
      const result = await response.json();

      if (result.success && result.data) {
        console.log('[loadGanttAssignments] 成功載入專案作業:', result.data.length, '項');

        // 轉換為甘特圖格式
        const ganttData: GanttTask[] = result.data.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          courseId: assignment.courseId || assignment.course_id || 'unknown',
          startDate: assignment.startDate || assignment.created_at || new Date().toISOString(),
          dueDate: assignment.dueDate || assignment.due_date,
          completedDate: assignment.completedDate,
          status: assignment.status || 'not_started',
          progress: assignment.progress || 0,
          priority: assignment.priority || 'medium',
          category: assignment.category || assignment.assignment_type || 'task',
          submissionType: assignment.submissionType || assignment.submission_type || 'text',
          maxScore: assignment.maxScore || assignment.max_score || 100,
          estimatedDuration: assignment.estimatedDuration || assignment.estimated_duration,
          isRequired: assignment.isRequired !== undefined ? assignment.isRequired : assignment.is_required !== undefined ? assignment.is_required : true,
          tags: assignment.tags || [],
          resources: assignment.resources || [],
          instructions: assignment.instructions || ''
        }));

        console.log('[loadGanttAssignments] 轉換後的甘特圖資料:', ganttData);
        setGanttTasks(ganttData);
      } else {
        console.error('[loadGanttAssignments] 載入失敗:', result.error);
      }
    } catch (error) {
      console.error('[loadGanttAssignments] 載入時發生錯誤:', error);
    }
  };

  // 載入學生任務數據（API）- 作業管理用
  const loadStudentTasks = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingStudentTasks(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `/api/learning/tasks?student_id=${currentUser.id}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setStudentTasks(result.data);
        setTaskStats(result.stats);
      } else {
        console.error('載入學生任務失敗:', result.error);
        setStudentTasks([]);
        setTaskStats({});
      }
    } catch (error) {
      console.error('載入學生任務時發生錯誤:', error);
      setStudentTasks([]);
      setTaskStats({});
    } finally {
      setLoadingStudentTasks(false);
    }
  };

  // 載入 Mock 數據（未登入時使用）
  const loadMockData = () => {
    loadMockAssignmentData();
    loadMockExamsData();
    loadMockVocabularySessionsData();
    loadMockProgressData();
  };

  // Mock 數據載入函數
  const loadMockExamsData = () => {
    setExams(mockExams);
  };

  const loadMockVocabularySessionsData = () => {
    setVocabularySessions(mockVocabularySessions);
  };

  const loadMockProgressData = () => {
    setProgressData(mockProgressData);
  };

  // 載入考試成績列表數據（API）
  const loadExamsData = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingExams(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `/api/learning/exams/list?student_id=${currentUser.id}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setExams(result.data || []);
      } else {
        console.error('載入考試成績數據失敗:', result.error);
        loadMockExamsData();
      }
    } catch (error) {
      console.error('載入考試成績數據時發生錯誤:', error);
      loadMockExamsData();
    } finally {
      setLoadingExams(false);
    }
  };

  // 載入單字學習記錄數據（API）
  const loadVocabularySessionsData = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingVocabularySessions(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `/api/learning/vocabulary/sessions?student_id=${currentUser.id}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setVocabularySessions(result.data || []);
      } else {
        console.error('載入單字學習記錄失敗:', result.error);
        loadMockVocabularySessionsData();
      }
    } catch (error) {
      console.error('載入單字學習記錄時發生錯誤:', error);
      loadMockVocabularySessionsData();
    } finally {
      setLoadingVocabularySessions(false);
    }
  };

  // 載入上課進度數據（API）
  const loadProgressDataAPI = async () => {
    if (!isAuthenticated || !currentUser) return;

    setLoadingProgress(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `/api/learning/lessons/progress?user_id=${currentUser.id}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setProgressData(result.data || []);
      } else {
        console.error('載入上課進度數據失敗:', result.error);
        loadMockProgressData();
      }
    } catch (error) {
      console.error('載入上課進度數據時發生錯誤:', error);
      loadMockProgressData();
    } finally {
      setLoadingProgress(false);
    }
  };

  // [已移除] loadMockGradeData 和 loadMockVocabularyData 函數
  // 現在使用聚合函數從 exams 和 vocabularySessions 即時計算

  // 根據時間範圍篩選 Mock 作業數據
  const loadMockAssignmentData = () => {
    let filteredData = [...allAssignmentsByWeek_deprecated];

    switch (assignmentTimeRange) {
      case 'week':
        filteredData = filteredData.slice(-1);
        break;
      case 'month':
        filteredData = filteredData.slice(-4);
        break;
      case 'quarter':
        filteredData = filteredData.slice(-12);
        break;
      case 'all':
        // 顯示全部
        break;
    }

    setAssignmentsByWeek(filteredData);
  };

  // 載入考試類型
  const loadExamTypes = async () => {
    setLoadingExamTypes(true);
    try {
      const response = await fetch('/api/admin/exam-types?active_only=true');
      const data = await response.json();

      if (data.success) {
        const types = data.data || [];
        setExamTypes(types);
        // 初始化時全部選中
        setSelectedExamTypes(types.map((t: any) => t.name));
      } else {
        console.error('載入考試類型失敗:', data.error);
        // 如果API失敗，使用預設類型（向後兼容）
        const defaultTypes = [
          { name: 'quiz', display_name: '小考', color: 'rgb(59, 130, 246)' },
          { name: 'class_test', display_name: '隨堂考', color: 'rgb(168, 85, 247)' },
          { name: 'vocabulary_test', display_name: '單字測驗', color: 'rgb(34, 197, 94)' },
          { name: 'speaking_eval', display_name: '口說評量', color: 'rgb(251, 146, 60)' },
        ];
        setExamTypes(defaultTypes);
        setSelectedExamTypes(defaultTypes.map(t => t.name));
      }
    } catch (error) {
      console.error('載入考試類型時發生錯誤:', error);
      // 使用預設類型（向後兼容）
      const defaultTypes = [
        { name: 'quiz', display_name: '小考', color: 'rgb(59, 130, 246)' },
        { name: 'class_test', display_name: '隨堂考', color: 'rgb(168, 85, 247)' },
        { name: 'vocabulary_test', display_name: '單字測驗', color: 'rgb(34, 197, 94)' },
        { name: 'speaking_eval', display_name: '口說評量', color: 'rgb(251, 146, 60)' },
      ];
      setExamTypes(defaultTypes);
      setSelectedExamTypes(defaultTypes.map(t => t.name));
    } finally {
      setLoadingExamTypes(false);
    }
  };

  // 載入課程學習數據
  const loadCourses = async () => {
    if (!currentUser) return;

    setLoadingCourses(true);
    try {
      const response = await fetch(`/api/learning/courses?user_id=${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setCourses(data.courses || []);
      } else {
        console.error('載入課程失敗:', data.error);
        setCourses([]);
      }
    } catch (error) {
      console.error('載入課程時發生錯誤:', error);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // 載入課程詳細進度
  const loadCourseLessons = async (courseId: string) => {
    if (!currentUser) return;

    setLoadingLessons(true);
    try {
      const response = await fetch(`/api/learning/courses/${courseId}/progress?user_id=${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setCourseLessons(data.lessons || []);
      } else {
        console.error('載入課程單元失敗:', data.error);
        setCourseLessons([]);
      }
    } catch (error) {
      console.error('載入課程單元時發生錯誤:', error);
      setCourseLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  // 處理新增作業
  const handleCreateAssignment = async (formData: any) => {
    setLoading(true);
    try {
      // 這裡應該調用 API
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // 更新甘特圖任務
        const newTask: GanttTask = {
          id: `new_${Date.now()}`,
          title: formData.title,
          description: formData.description,
          courseId: formData.courseId || currentStudent.courseId,
          startDate: new Date().toISOString().split('T')[0],
          dueDate: formData.dueDate.split('T')[0],
          status: 'not_started',
          progress: 0,
          priority: formData.priority,
          category: formData.assignmentType,
          submissionType: formData.submissionType,
          estimatedHours: Math.ceil(formData.estimatedDuration / 60),
          isPersonalized: formData.isPersonalized || false,
          assignedBy: formData.assignedBy || '系統'
        };

        setGanttTasks(prev => [...prev, newTask]);
        console.log('作業創建成功');
      }
    } catch (error) {
      console.error('創建作業失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 計算年度週次的輔助函數
  const getWeekOfYear = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  // 格式化日期範圍
  const formatDateRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const formatDate = (d: Date) => {
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${month}/${day}`;
    };

    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  // 切換考試類型選擇
  const toggleExamType = (examTypeName: string) => {
    setSelectedExamTypes(prev => {
      if (prev.includes(examTypeName)) {
        // 如果已選中，取消選擇
        return prev.filter(t => t !== examTypeName);
      } else {
        // 如果未選中，新增選擇
        return [...prev, examTypeName];
      }
    });
  };

  // 數據聚合函數：從 exams 聚合成績趨勢數據
  const aggregateGradeData = (examsList: any[], timeRange: string) => {
    if (!examsList || examsList.length === 0) return [];

    // 按日期排序
    const sortedExams = [...examsList].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 根據時間範圍篩選
    const now = new Date();
    let filteredExams = sortedExams;

    switch (timeRange) {
      case 'week':
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        filteredExams = sortedExams.filter(e => new Date(e.date) >= twoWeeksAgo);
        break;
      case 'month':
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredExams = sortedExams.filter(e => new Date(e.date) >= oneMonthAgo);
        break;
      case 'quarter':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredExams = sortedExams.filter(e => new Date(e.date) >= threeMonthsAgo);
        break;
      case 'semester':
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        filteredExams = sortedExams.filter(e => new Date(e.date) >= sixMonthsAgo);
        break;
      case 'all':
      default:
        filteredExams = sortedExams;
        break;
    }

    // 按週分組
    const weekMap = new Map<string, any>();
    filteredExams.forEach(exam => {
      const examDate = new Date(exam.date);
      const weekStart = new Date(examDate);
      weekStart.setDate(examDate.getDate() - examDate.getDay()); // 週日為起始
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        const weekNum = getWeekOfYear(weekStart);
        const dateRange = formatDateRange(weekStart);
        weekMap.set(weekKey, {
          name: `第${weekNum}週`,
          dateRange: dateRange,
          date: weekKey,
          examsByType: {}
        });
      }

      const weekData = weekMap.get(weekKey);
      const examType = exam.type || 'other';

      if (!weekData.examsByType[examType]) {
        weekData.examsByType[examType] = [];
      }

      weekData.examsByType[examType].push(exam);
    });

    // 計算每週各類型考試的平均分數
    const result = Array.from(weekMap.values()).map(week => {
      const weekData: any = {
        name: week.name,
        dateRange: week.dateRange // 保留日期範圍信息供 Tooltip 使用
      };

      Object.keys(week.examsByType).forEach(examType => {
        const examsOfType = week.examsByType[examType];
        const avgScore = examsOfType.reduce((sum: number, e: any) =>
          sum + (e.score / e.maxScore * 100), 0
        ) / examsOfType.length;
        weekData[examType] = Math.round(avgScore);
      });

      return weekData;
    });

    return result;
  };

  // 數據聚合函數：從 vocabularySessions 聚合單字統計數據
  const aggregateVocabularyData = (sessions: any[], timeRange: string) => {
    if (!sessions || sessions.length === 0) return [];

    // 按日期排序
    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 根據時間範圍篩選
    const now = new Date();
    let filteredSessions = sortedSessions;

    switch (timeRange) {
      case 'week':
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        filteredSessions = sortedSessions.filter(s => new Date(s.date) >= twoWeeksAgo);
        break;
      case 'month':
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredSessions = sortedSessions.filter(s => new Date(s.date) >= oneMonthAgo);
        break;
      case 'quarter':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredSessions = sortedSessions.filter(s => new Date(s.date) >= threeMonthsAgo);
        break;
      case 'semester':
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        filteredSessions = sortedSessions.filter(s => new Date(s.date) >= sixMonthsAgo);
        break;
      case 'all':
      default:
        filteredSessions = sortedSessions;
        break;
    }

    // 按週分組
    const weekMap = new Map<string, any>();
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        const weekNum = getWeekOfYear(weekStart);
        const dateRange = formatDateRange(weekStart);
        weekMap.set(weekKey, {
          name: `第${weekNum}週`,
          dateRange: dateRange,
          date: weekKey,
          totalWords: 0,
          correctWords: 0,
          sessionCount: 0
        });
      }

      const weekData = weekMap.get(weekKey);
      weekData.totalWords += session.wordsLearned || 0;
      weekData.correctWords += Math.round((session.wordsLearned || 0) * (session.accuracy || 0) / 100);
      weekData.sessionCount += 1;
    });

    // 轉換為圖表數據格式
    const result = Array.from(weekMap.values()).map(week => ({
      name: week.name,
      dateRange: week.dateRange, // 保留日期範圍信息供 Tooltip 使用
      已教單字: week.totalWords,
      答對單字: week.correctWords,
      答錯單字: week.totalWords - week.correctWords
    }));

    return result;
  };

  // 為未登入用戶生成假資料（固定資料，避免每次渲染都變化）
  const getMockGradeData = () => {
    // 固定的假資料，模擬8週的成績
    const mockScores = [
      { quiz: 88, class_test: 85, vocabulary_test: 92, speaking_eval: 87 },
      { quiz: 90, class_test: 88, vocabulary_test: 89, speaking_eval: 85 },
      { quiz: 85, class_test: 91, vocabulary_test: 94, speaking_eval: 90 },
      { quiz: 92, class_test: 89, vocabulary_test: 90, speaking_eval: 88 },
      { quiz: 87, class_test: 93, vocabulary_test: 91, speaking_eval: 92 },
      { quiz: 91, class_test: 90, vocabulary_test: 95, speaking_eval: 89 },
      { quiz: 89, class_test: 92, vocabulary_test: 88, speaking_eval: 91 },
      { quiz: 93, class_test: 91, vocabulary_test: 93, speaking_eval: 90 }
    ];

    return mockScores.map((scores, i) => {
      const weekData: any = {
        name: `第${i + 1}週`,
        dateRange: `${i * 7 + 1}/1 - ${i * 7 + 7}/1`
      };
      Object.keys(scores).forEach(key => {
        weekData[key] = scores[key as keyof typeof scores];
      });
      return weekData;
    });
  };

  const getMockVocabularyData = () => {
    // 固定的假資料，模擬8週的單字學習
    const mockData = [
      { 已教單字: 25, 答對單字: 20 },
      { 已教單字: 28, 答對單字: 24 },
      { 已教單字: 22, 答對單字: 19 },
      { 已教單字: 30, 答對單字: 26 },
      { 已教單字: 26, 答對單字: 22 },
      { 已教單字: 32, 答對單字: 28 },
      { 已教單字: 27, 答對單字: 24 },
      { 已教單字: 29, 答對單字: 26 }
    ];

    return mockData.map((data, i) => ({
      name: `第${i + 1}週`,
      dateRange: `${i * 7 + 1}/1 - ${i * 7 + 7}/1`,
      已教單字: data.已教單字,
      答對單字: data.答對單字,
      答錯單字: data.已教單字 - data.答對單字
    }));
  };

  // 使用 useMemo 優化效能，只在依賴項改變時重新計算
  const aggregatedGradeData = useMemo(() => {
    if (!isAuthenticated || !currentUser) {
      return getMockGradeData();
    }
    return aggregateGradeData(exams, gradeTimeRange);
  }, [exams, gradeTimeRange, isAuthenticated, currentUser]);

  const aggregatedVocabularyData = useMemo(() => {
    if (!isAuthenticated || !currentUser) {
      return getMockVocabularyData();
    }
    return aggregateVocabularyData(vocabularySessions, vocabularyTimeRange);
  }, [vocabularySessions, vocabularyTimeRange, isAuthenticated, currentUser]);

  // 根據時間範圍過濾學生任務
  const filteredStudentTasks = useMemo(() => {
    if (!studentTasks || studentTasks.length === 0) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (assignmentTimeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 14); // 2週
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1); // 1個月
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3); // 3個月
        break;
      case 'semester':
        cutoffDate.setMonth(now.getMonth() - 6); // 6個月
        break;
      case 'all':
        return studentTasks; // 顯示全部
      default:
        cutoffDate.setMonth(now.getMonth() - 1); // 預設1個月
    }

    return studentTasks.filter(task => {
      const taskDate = new Date(task.assigned_date || task.created_at);
      return taskDate >= cutoffDate;
    });
  }, [studentTasks, assignmentTimeRange]);

  // 處理甘特圖任務點擊
  const handleTaskClick = (task: GanttTask) => {
    console.log('點擊任務:', task);
    // 這裡可以打開任務詳情對話框或跳轉到任務頁面
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">學習管理中心</h1>
            <p className="text-muted-foreground mt-1">全面掌握學習進度與成效</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">上次更新</p>
            <p className="text-sm font-medium">{new Date().toLocaleDateString('zh-TW')}</p>
          </div>
        </div>

        {/* 頁籤系統 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-muted p-1 h-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <TrendingUp className="w-4 h-4" />
              <span>總覽</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <CheckCircle className="w-4 h-4" />
              <span>作業管理</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <ClipboardList className="w-4 h-4" />
              <span>專案作業</span>
            </TabsTrigger>
            <TabsTrigger value="grades" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <Target className="w-4 h-4" />
              <span>成績管理</span>
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <BookOpen className="w-4 h-4" />
              <span>單字學習</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <Calendar className="w-4 h-4" />
              <span>上課進度</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <Video className="w-4 h-4" />
              <span>課程學習</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <FileText className="w-4 h-4" />
              <span>報表匯出</span>
            </TabsTrigger>
          </TabsList>

          {/* 總覽頁籤 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard
                title="本週作業"
                value="12"
                change={{ value: 8, label: "比上週" }}
                icon={<ClipboardList className="w-5 h-5" />}
                gradient="primary"
              />
              <StatsCard
                title="作業完成率"
                value="85%"
                change={{ value: 5, label: "本週提升" }}
                icon={<CheckCircle className="w-5 h-5" />}
                gradient="success"
              />
              <StatsCard
                title="平均成績"
                value="89"
                change={{ value: 3, label: "比上月" }}
                icon={<Target className="w-5 h-5" />}
                gradient="secondary"
              />
            </div>

            {/* 圖表區域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>成績趨勢分析</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">各類考試成績趨勢追蹤</p>
                      </div>
                      <Select value={gradeTimeRange} onValueChange={setGradeTimeRange}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">最近2週</SelectItem>
                          <SelectItem value="month">最近1個月</SelectItem>
                          <SelectItem value="quarter">最近3個月</SelectItem>
                          <SelectItem value="semester">最近半年</SelectItem>
                          <SelectItem value="all">全部資料</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground mr-2">考試類型：</span>
                      {examTypes.map(type => (
                        <label
                          key={type.name}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-colors hover:bg-accent"
                          style={{
                            borderColor: selectedExamTypes.includes(type.name) ? type.color : 'hsl(var(--border))',
                            backgroundColor: selectedExamTypes.includes(type.name) ? `${type.color}15` : 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedExamTypes.includes(type.name)}
                            onChange={() => toggleExamType(type.name)}
                            className="w-4 h-4 rounded border-gray-300"
                            style={{ accentColor: type.color }}
                          />
                          <span className="text-sm font-medium" style={{ color: selectedExamTypes.includes(type.name) ? type.color : 'hsl(var(--foreground))' }}>
                            {type.display_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingExams ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={aggregatedGradeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.98)",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            backdropFilter: "blur(8px)"
                          }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                          position={{ y: 0 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{
                                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "12px",
                                  padding: "14px 16px",
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                  backdropFilter: "blur(8px)"
                                }}>
                                  <p style={{ fontWeight: 600, marginBottom: "4px", color: "#1f2937", fontSize: "15px" }}>{data.name}</p>
                                  <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>{data.dateRange}</p>
                                  {payload.map((entry: any, index: number) => (
                                    <p key={index} style={{ fontSize: "14px", color: entry.color, marginBottom: "4px", fontWeight: 500 }}>
                                      {entry.name}：{entry.value} 分
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {examTypes
                          .filter(type => selectedExamTypes.includes(type.name))
                          .map((type, index) => (
                            <Line
                              key={type.name}
                              type="monotone"
                              dataKey={type.name}
                              name={type.display_name}
                              stroke={type.color}
                              strokeWidth={2.5}
                              dot={{ fill: type.color, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>單字學習統計</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">教學單字數 vs 答對單字數</p>
                    </div>
                    <Select value={vocabularyTimeRange} onValueChange={setVocabularyTimeRange}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">最近2週</SelectItem>
                        <SelectItem value="month">最近1個月</SelectItem>
                        <SelectItem value="quarter">最近3個月</SelectItem>
                        <SelectItem value="semester">最近半年</SelectItem>
                        <SelectItem value="all">全部資料</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingVocabularySessions ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={aggregatedVocabularyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          backdropFilter: "blur(8px)"
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        position={{ y: 0 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                backgroundColor: "rgba(255, 255, 255, 0.98)",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "12px",
                                padding: "14px 16px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                backdropFilter: "blur(8px)"
                              }}>
                                <p style={{ fontWeight: 600, marginBottom: "4px", color: "#1f2937", fontSize: "15px" }}>{data.name}</p>
                                <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>{data.dateRange}</p>
                                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>已教單字：{data.已教單字} 個</p>
                                <p style={{ fontSize: "14px", color: "rgb(59, 130, 246)", marginBottom: "4px", fontWeight: 500 }}>答對：{data.答對單字} 個</p>
                                <p style={{ fontSize: "14px", color: "rgb(34, 197, 94)", marginBottom: "4px", fontWeight: 500 }}>答錯：{data.答錯單字} 個</p>
                                <p style={{ fontSize: "14px", color: "rgb(16, 185, 129)", fontWeight: 600 }}>正確率：{Math.round((data.答對單字 / data.已教單字) * 100)}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="答對單字" stackId="a" fill="rgb(59, 130, 246)" radius={[0, 0, 0, 0]} name="答對單字" />
                      <Bar dataKey="答錯單字" stackId="a" fill="rgb(34, 197, 94)" radius={[4, 4, 0, 0]} name="答錯單字" />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 作業進度追蹤 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>作業進度追蹤</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">每堂課交代的作業完成情況</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {taskStats.max_streak > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <Trophy className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">最高連續 {taskStats.max_streak} 天</span>
                      </div>
                    )}
                    <Select value={assignmentTimeRange} onValueChange={setAssignmentTimeRange}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">最近2週</SelectItem>
                        <SelectItem value="month">最近1個月</SelectItem>
                        <SelectItem value="quarter">最近3個月</SelectItem>
                        <SelectItem value="semester">最近半年</SelectItem>
                        <SelectItem value="all">全部資料</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              {loadingStudentTasks ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : filteredStudentTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">目前沒有作業</div>
              ) : (
                <div className="space-y-3">
                  {filteredStudentTasks.map((task, index) => {
                    // 計算進度百分比
                    let progress = 0;
                    if (task.task_type === 'daily' && task.daily_total_days > 0) {
                      progress = Math.round((task.daily_completed_days / task.daily_total_days) * 100);
                    } else if (task.task_type === 'onetime') {
                      progress = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0;
                    }

                    // 解析每日完成記錄
                    const dailyCompletion = task.daily_completion || [];

                    return task.task_type === 'daily' ? (
                      // 每日任務樣式
                      <div key={task.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">📅</span>
                              <h4 className="font-semibold text-foreground">{task.task_description}</h4>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                                每日任務
                              </span>
                              {task.category && (
                                <Badge variant="outline" className="text-xs">{task.category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground ml-7">
                              交代日期: {new Date(task.assigned_date).toLocaleDateString('zh-TW')}
                              {task.daily_total_days > 0 && ` · 目標: ${task.daily_total_days} 天`}
                            </p>
                          </div>
                          {task.daily_streak > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                              <span className="text-lg">🔥</span>
                              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">連續 {task.daily_streak} 天</span>
                            </div>
                          )}
                        </div>

                        {/* 完成進度 */}
                        <div className="ml-7 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">完成進度</span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {task.daily_completed_days || 0}/{task.daily_total_days || 0} 天
                            </span>
                          </div>

                          {/* 完成率進度條 */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-foreground min-w-[3rem] text-right">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 一次性任務樣式
                      <div key={task.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">📝</span>
                              <h4 className="font-semibold text-foreground">{task.task_description}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                task.status === 'completed' ? 'bg-green-500 text-white' :
                                task.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                                task.status === 'overdue' ? 'bg-red-500 text-white' :
                                'bg-purple-500 text-white'
                              }`}>
                                {task.status === 'completed' ? '已完成' :
                                 task.status === 'in_progress' ? '進行中' :
                                 task.status === 'overdue' ? '逾期' : '待處理'}
                              </span>
                              {task.category && (
                                <Badge variant="outline" className="text-xs">{task.category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground ml-7">
                              交代日期: {new Date(task.assigned_date).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {task.due_date ? `截止: ${new Date(task.due_date).toLocaleDateString('zh-TW')}` : '下次上課檢查'}
                            </span>
                          </div>
                        </div>

                        {/* 整體進度 */}
                        <div className="ml-7 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">完成狀態</span>
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {progress}%
                            </span>
                          </div>

                          {/* 進度條 */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                  progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                  progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* 狀態指示 */}
                          <div className="flex items-center gap-2 mt-2">
                            {task.status === 'completed' ? (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">已完成</span>
                                {task.completion_date && (
                                  <span className="text-xs text-muted-foreground">
                                    ({new Date(task.completion_date).toLocaleDateString('zh-TW')})
                                  </span>
                                )}
                              </div>
                            ) : task.status === 'in_progress' ? (
                              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">進行中</span>
                              </div>
                            ) : task.status === 'overdue' ? (
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">逾期</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-medium">待處理</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 作業管理頁籤 (新) - 學生任務 */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">作業管理</h2>
                <p className="text-muted-foreground">每堂課交代的作業任務與完成追蹤</p>
              </div>
              <Select value={assignmentTimeRange} onValueChange={setAssignmentTimeRange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">最近2週</SelectItem>
                  <SelectItem value="month">最近1個月</SelectItem>
                  <SelectItem value="quarter">最近3個月</SelectItem>
                  <SelectItem value="semester">最近半年</SelectItem>
                  <SelectItem value="all">全部資料</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總任務數</p>
                      <p className="text-2xl font-bold">{taskStats.total || 0}</p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">已完成</p>
                      <p className="text-2xl font-bold text-green-600">{taskStats.completed || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">進行中</p>
                      <p className="text-2xl font-bold text-yellow-600">{taskStats.in_progress || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">最高連續</p>
                      <p className="text-2xl font-bold text-orange-600">{taskStats.max_streak || 0} 天</p>
                    </div>
                    <Trophy className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 任務列表 - 與總覽頁籤相同的顯示 */}
            <Card>
              <CardHeader>
                <CardTitle>所有任務</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStudentTasks ? (
                  <div className="text-center py-8 text-muted-foreground">載入中...</div>
                ) : filteredStudentTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">目前沒有作業</div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudentTasks.map((task, index) => {
                      // 計算進度百分比
                      let progress = 0;
                      if (task.task_type === 'daily' && task.daily_total_days > 0) {
                        progress = Math.round((task.daily_completed_days / task.daily_total_days) * 100);
                      } else if (task.task_type === 'onetime') {
                        progress = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0;
                      }

                      return task.task_type === 'daily' ? (
                        // 每日任務樣式
                        <div key={task.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">📅</span>
                                <h4 className="font-semibold text-foreground">{task.task_description}</h4>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                                  每日任務
                                </span>
                                {task.category && (
                                  <Badge variant="outline" className="text-xs">{task.category}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground ml-7">
                                交代日期: {new Date(task.assigned_date).toLocaleDateString('zh-TW')}
                                {task.daily_total_days > 0 && ` · 目標: ${task.daily_total_days} 天`}
                              </p>
                            </div>
                            {task.daily_streak > 0 && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                <span className="text-lg">🔥</span>
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">連續 {task.daily_streak} 天</span>
                              </div>
                            )}
                          </div>

                          {/* 完成進度 */}
                          <div className="ml-7 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">完成進度</span>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {task.daily_completed_days || 0}/{task.daily_total_days || 0} 天
                              </span>
                            </div>

                            {/* 完成率進度條 */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-muted rounded-full h-2.5">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-foreground min-w-[3rem] text-right">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 一次性任務樣式
                        <div key={task.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-l-4 border-purple-500">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">📝</span>
                                <h4 className="font-semibold text-foreground">{task.task_description}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  task.status === 'completed' ? 'bg-green-500 text-white' :
                                  task.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                                  task.status === 'overdue' ? 'bg-red-500 text-white' :
                                  'bg-purple-500 text-white'
                                }`}>
                                  {task.status === 'completed' ? '已完成' :
                                   task.status === 'in_progress' ? '進行中' :
                                   task.status === 'overdue' ? '逾期' : '待處理'}
                                </span>
                                {task.category && (
                                  <Badge variant="outline" className="text-xs">{task.category}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground ml-7">
                                交代日期: {new Date(task.assigned_date).toLocaleDateString('zh-TW')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {task.due_date ? `截止: ${new Date(task.due_date).toLocaleDateString('zh-TW')}` : '下次上課檢查'}
                              </span>
                            </div>
                          </div>

                          {/* 整體進度 */}
                          <div className="ml-7 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">完成狀態</span>
                              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                {progress}%
                              </span>
                            </div>

                            {/* 進度條 */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-muted rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all duration-300 ${
                                    progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                    progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-r from-purple-500 to-pink-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {/* 狀態指示 */}
                            <div className="flex items-center gap-2 mt-2">
                              {task.status === 'completed' ? (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">已完成</span>
                                  {task.completion_date && (
                                    <span className="text-xs text-muted-foreground">
                                      ({new Date(task.completion_date).toLocaleDateString('zh-TW')})
                                    </span>
                                  )}
                                </div>
                              ) : task.status === 'in_progress' ? (
                                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-xs font-medium">進行中</span>
                                </div>
                              ) : task.status === 'overdue' ? (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">逾期</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-xs font-medium">待處理</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 專案作業頁籤 (原作業管理) */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">專案作業</h2>
                <p className="text-muted-foreground">甘特圖形式管理學習作業進度</p>
              </div>
              <Button onClick={() => setShowAssignmentDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新增作業
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總作業數</p>
                      <p className="text-2xl font-bold">{ganttTasks.length}</p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">已完成</p>
                      <p className="text-2xl font-bold text-green-600">
                        {ganttTasks.filter(t => t.status === "completed").length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">進行中</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {ganttTasks.filter(t => t.status === "in_progress").length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">平均完成度</p>
                      <p className="text-2xl font-bold">
                        {ganttTasks.length > 0 ? Math.round(ganttTasks.reduce((acc, t) => acc + t.progress, 0) / ganttTasks.length) : 0}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 專業甘特圖 */}
            <DHtmlxGanttChart
              tasks={ganttTasks}
              studentName={currentStudent.name}
              onTaskClick={handleTaskClick}
              className="min-h-[600px]"
              year={2025}
            />

            {/* 新增作業對話框 */}
            <AssignmentFormDialog
              open={showAssignmentDialog}
              onOpenChange={setShowAssignmentDialog}
              onSubmit={handleCreateAssignment}
              students={students}
              loading={loading}
            />
          </TabsContent>

          {/* 成績管理頁籤 */}
          <TabsContent value="grades" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">成績管理</h2>
                <p className="text-muted-foreground">追蹤考試成績和學習表現</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增成績
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總考試數</p>
                      <p className="text-2xl font-bold">{exams.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">平均分數</p>
                      <p className="text-2xl font-bold">
                        {Math.round(exams.reduce((acc, e) => acc + (e.score / e.maxScore * 100), 0) / exams.length)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">最高分數</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...exams.map(e => Math.round(e.score / e.maxScore * 100)))}
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">平均等第</p>
                      <p className="text-2xl font-bold">
                        {getGrade(Math.round(exams.reduce((acc, e) => acc + (e.score / e.maxScore * 100), 0) / exams.length), 100)}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>考試成績記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{exam.name}</h3>
                          <Badge variant="outline">{exam.type}</Badge>
                          <Badge variant="secondary">{exam.subject}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>考試日期: {exam.date}</span>
                          <span>分數: {exam.score}/{exam.maxScore}</span>
                          <span>百分比: {Math.round(exam.score / exam.maxScore * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {getGrade(exam.score, exam.maxScore)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round(exam.score / exam.maxScore * 100)}分
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">編輯</Button>
                          <Button variant="outline" size="sm">詳情</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 單字學習頁籤 */}
          <TabsContent value="vocabulary" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">單字學習</h2>
                <p className="text-muted-foreground">追蹤單字學習進度和成效</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增記錄
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總學習單字</p>
                      <p className="text-2xl font-bold">
                        {vocabularySessions.reduce((acc, s) => acc + s.wordsLearned, 0)}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">平均正確率</p>
                      <p className="text-2xl font-bold">
                        {Math.round(vocabularySessions.reduce((acc, s) => acc + s.accuracy, 0) / vocabularySessions.length)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">學習天數</p>
                      <p className="text-2xl font-bold">{vocabularySessions.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">日均單字</p>
                      <p className="text-2xl font-bold">
                        {Math.round(vocabularySessions.reduce((acc, s) => acc + s.wordsLearned, 0) / vocabularySessions.length)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>單字學習記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vocabularySessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">學習日期: {session.date}</h3>
                          <Badge variant="outline">{session.unit}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <span>學習單字: {session.wordsLearned} 個</span>
                          <span>正確率: {session.accuracy}%</span>
                          <span>學習時間: {session.duration} 分鐘</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full"
                            style={{ width: `${session.accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{session.wordsLearned}</div>
                          <div className="text-sm text-muted-foreground">單字</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">編輯</Button>
                          <Button variant="outline" size="sm">複習</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 上課進度頁籤 */}
          <TabsContent value="progress" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">上課進度</h2>
                <p className="text-muted-foreground">追蹤課程進度和學習歷程</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增課程
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總課程數</p>
                      <p className="text-2xl font-bold">{progressData.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">已完成課程</p>
                      <p className="text-2xl font-bold">
                        {progressData.filter(p => p.status === "completed").length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總學習時數</p>
                      <p className="text-2xl font-bold">
                        {Math.round(progressData.filter(p => p.status === "completed").reduce((acc, p) => acc + p.duration, 0) / 60)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">完成率</p>
                      <p className="text-2xl font-bold">
                        {Math.round((progressData.filter(p => p.status === "completed").length / progressData.length) * 100)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>課程進度記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressData.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{lesson.lesson}</h3>
                          <Badge variant={getStatusColor(lesson.status) as any}>
                            {getStatusText(lesson.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <span>日期: {lesson.date}</span>
                          <span>時長: {lesson.duration} 分鐘</span>
                          <span>作業: {lesson.homework}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lesson.topics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{lesson.duration}</div>
                          <div className="text-sm text-muted-foreground">分鐘</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">編輯</Button>
                          <Button variant="outline" size="sm">詳情</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 課程學習頁籤 */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">課程學習統計</h2>
                <p className="text-muted-foreground">追蹤您已選修課程的學習進度</p>
              </div>
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">載入課程中...</p>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">尚無選修課程</p>
                  <p className="text-sm text-gray-600 mb-6">請先到課程頁面選擇您想學習的課程</p>
                  <Button asChild>
                    <a href="/courses">瀏覽課程</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course: any) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">{course.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* 進度條 */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">完成進度</span>
                          <span className="font-semibold text-blue-600">{course.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${course.progress_percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* 統計資訊 */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">
                            {course.completed_lessons}/{course.total_lessons} 單元
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">
                            {Math.floor(course.total_watch_time / 60)} 分鐘
                          </span>
                        </div>
                      </div>

                      {/* 最後學習時間 */}
                      {course.last_study_time && (
                        <div className="text-xs text-gray-500">
                          最後學習：{new Date(course.last_study_time).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}

                      {/* 操作按鈕 */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedCourse(course);
                            loadCourseLessons(course.id);
                          }}
                        >
                          查看詳情
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={`/courses/${course.id}/learn`}>
                            <PlayCircle className="w-4 h-4 mr-1" />
                            繼續學習
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 課程詳細進度對話框 */}
            {selectedCourse && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedCourse.title} - 學習進度明細</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedCourse(null);
                        setCourseLessons([]);
                      }}
                    >
                      關閉
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingLessons ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {courseLessons.map((lesson: any, index: number) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {lesson.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <PlayCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {index + 1}. {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                <span>進度 {lesson.progress_percentage}%</span>
                                {lesson.video_duration && (
                                  <>
                                    <span>•</span>
                                    <span>{Math.floor(lesson.current_time / 60)}/{Math.floor(lesson.video_duration / 60)} 分鐘</span>
                                  </>
                                )}
                                {lesson.last_watched_at && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {new Date(lesson.last_watched_at).toLocaleDateString('zh-TW', {
                                        month: '2-digit',
                                        day: '2-digit'
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-24 ml-3">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  lesson.completed ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${lesson.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 報表匯出頁籤 */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">報表匯出</h2>
                <p className="text-muted-foreground">生成和下載學習分析報告</p>
              </div>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                生成新報表
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">週報生成</h3>
                      <p className="text-sm text-muted-foreground">生成本週學習報告</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">成績分析</h3>
                      <p className="text-sm text-muted-foreground">分析考試成績趨勢</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">進度統計</h3>
                      <p className="text-sm text-muted-foreground">課程進度統計報告</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總報表數</p>
                      <p className="text-2xl font-bold">{reports.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">可下載</p>
                      <p className="text-2xl font-bold">
                        {reports.filter(r => r.status === "ready").length}
                      </p>
                    </div>
                    <Download className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">生成中</p>
                      <p className="text-2xl font-bold">
                        {reports.filter(r => r.status === "generating").length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">總檔案大小</p>
                      <p className="text-2xl font-bold">8.4 MB</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>報表列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{report.name}</h3>
                          <Badge variant="outline">{report.type}</Badge>
                          <Badge variant={getStatusColor(report.status) as any}>
                            {getStatusText(report.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>期間: {report.period}</span>
                          <span>大小: {report.size}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {report.status === "ready" ? (
                          <>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              下載
                            </Button>
                            <Button variant="outline" size="sm">預覽</Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            {report.status === "generating" ? "生成中..." : "無法下載"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
};

export default Dashboard;