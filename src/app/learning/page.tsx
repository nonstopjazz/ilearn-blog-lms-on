'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GanttChart, { GanttTask } from '@/components/gantt/GanttChart';
import GanttChartYearly from '@/components/gantt/GanttChartYearly';
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
  Download
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

  // 共用數據
  const gradeData = [
    { name: "第1週", 小考: 85, 段考: 88 },
    { name: "第2週", 小考: 78, 段考: 85 },
    { name: "第3週", 小考: 92, 段考: 90 },
    { name: "第4週", 小考: 88, 段考: 92 },
    { name: "第5週", 小考: 95, 段考: 94 },
  ];

  const vocabularyData = [
    { name: "第1堂課", 單字數: 15 },
    { name: "第2堂課", 單字數: 20 },
    { name: "第3堂課", 單字數: 18 },
    { name: "第4堂課", 單字數: 25 },
    { name: "第5堂課", 單字數: 22 },
  ];

  const assignmentsByWeek = [
    {
      week: "第1周",
      dateRange: "2025/1/13-1/19",
      assignments: [
        { name: "每日背誦單字", progress: 85, type: "daily", description: "每天背10個新單字" },
        { name: "英文日記", progress: 100, type: "daily", description: "每天寫50字英文日記" },
        { name: "課文朗讀練習", progress: 70, type: "session", description: "下次上課檢查" },
      ]
    },
    {
      week: "第2周",
      dateRange: "2025/1/20-1/26",
      assignments: [
        { name: "每日背誦單字", progress: 90, type: "daily", description: "每天背10個新單字" },
        { name: "聽力練習", progress: 60, type: "daily", description: "每天聽15分鐘英文" },
        { name: "作文練習", progress: 45, type: "session", description: "寫一篇150字短文" },
        { name: "文法練習題", progress: 100, type: "session", description: "完成第3章練習" },
      ]
    },
    {
      week: "第3周",
      dateRange: "2025/1/27-2/2",
      assignments: [
        { name: "每日背誦單字", progress: 95, type: "daily", description: "每天背10個新單字" },
        { name: "英文日記", progress: 80, type: "daily", description: "每天寫50字英文日記" },
        { name: "口說練習", progress: 30, type: "session", description: "錄製3分鐘自我介紹" },
      ]
    }
  ];

  // 其他頁籤數據
  const mockAssignments = [
    { id: 1, title: "基礎單字 Unit 1-5 (200字)", category: "單字", status: "in-progress", dueDate: "2025/01/20", progress: 75 },
    { id: 2, title: "時態練習 - 現在式", category: "文法", status: "completed", dueDate: "2025/01/15", progress: 100 },
    { id: 3, title: "日常對話練習 Ch.1-3", category: "口說", status: "in-progress", dueDate: "2025/01/25", progress: 50 },
    { id: 4, title: "聽力理解 - 短對話", category: "聽力", status: "not-started", dueDate: "2025/01/30", progress: 0 }
  ];

  const exams = [
    { id: 1, name: "英語小考 - Unit 1", type: "小考", date: "2025/01/10", score: 88, maxScore: 100, subject: "英語" },
    { id: 2, name: "文法段考 - 時態", type: "段考", date: "2025/01/15", score: 92, maxScore: 100, subject: "英語" },
    { id: 3, name: "聽力測驗", type: "小考", date: "2025/01/18", score: 85, maxScore: 100, subject: "英語" },
    { id: 4, name: "口說評量", type: "評量", date: "2025/01/20", score: 90, maxScore: 100, subject: "英語" }
  ];

  const vocabularySessions = [
    { id: 1, date: "2025/01/15", wordsLearned: 15, unit: "Unit 1-2", accuracy: 90, duration: 30 },
    { id: 2, date: "2025/01/16", wordsLearned: 20, unit: "Unit 3-4", accuracy: 85, duration: 25 },
    { id: 3, date: "2025/01/17", wordsLearned: 18, unit: "Review", accuracy: 95, duration: 35 },
    { id: 4, date: "2025/01/18", wordsLearned: 25, unit: "Unit 5-6", accuracy: 88, duration: 40 }
  ];

  const progressData = [
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

  // 當前學生資訊（實際應該從登入狀態取得）
  const currentStudent = {
    id: 'student_001',
    name: '王小明',
    courseId: 'course_001',
    courseName: '基礎英語',
    grade: '國中二年級'
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

  // 初始化數據
  useEffect(() => {
    setStudents([currentStudent]); // 只有當前學生
    setGanttTasks(mockGanttTasks);
    setAssignments(mockAssignments);
  }, []);

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
          <TabsList className="grid w-full grid-cols-6 bg-muted p-1 h-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <TrendingUp className="w-4 h-4" />
              <span>總覽</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <ClipboardList className="w-4 h-4" />
              <span>作業管理</span>
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
            <TabsTrigger value="reports" className="flex items-center space-x-2 data-[state=active]:bg-white py-3">
              <FileText className="w-4 h-4" />
              <span>報表匯出</span>
            </TabsTrigger>
          </TabsList>

          {/* 總覽頁籤 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <StatsCard
                title="學習單字"
                value="156"
                change={{ value: 12, label: "本週新增" }}
                icon={<BookOpen className="w-5 h-5" />}
                gradient="warning"
              />
              <StatsCard
                title="上課天數"
                value="20"
                change={{ value: 0, label: "本月" }}
                icon={<Calendar className="w-5 h-5" />}
                gradient="primary"
              />
              <StatsCard
                title="學習進度"
                value="78%"
                change={{ value: 2, label: "本週進展" }}
                icon={<TrendingUp className="w-5 h-5" />}
                gradient="success"
              />
            </div>

            {/* 圖表區域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="成績趨勢分析" description="小考與段考成績對比">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="小考" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))" }} />
                    <Line type="monotone" dataKey="段考" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ fill: "hsl(var(--secondary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="單字學習統計" description="各堂課單字學習數量">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vocabularyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="單字數" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* 作業進度追蹤 */}
            <ChartCard title="作業進度追蹤" description="各項作業完成情況一覽">
              <div className="space-y-6">
                {assignmentsByWeek.map((weekData, weekIndex) => (
                  <div key={weekIndex} className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">{weekData.week}</h3>
                      <span className="text-sm text-muted-foreground">({weekData.dateRange})</span>
                    </div>
                    <div className="space-y-3">
                      {weekData.assignments.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-card/30 rounded-md border border-border/30">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-foreground">{assignment.name}</h4>
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  assignment.type === 'daily' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                }`}>
                                  {assignment.type === 'daily' ? '每日任務' : '上課檢查'}
                                </span>
                                <span className="text-sm font-medium text-foreground min-w-[3rem]">
                                  {assignment.progress}%
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    assignment.progress === 100 ? 'bg-green-500' :
                                    assignment.progress >= 70 ? 'bg-blue-500' :
                                    assignment.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${assignment.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </TabsContent>

          {/* 作業管理頁籤 */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">作業管理</h2>
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

            {/* 年度甘特圖 */}
            <GanttChartYearly
              tasks={ganttTasks}
              studentName={currentStudent.name}
              onTaskClick={handleTaskClick}
              className="min-h-[500px]"
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