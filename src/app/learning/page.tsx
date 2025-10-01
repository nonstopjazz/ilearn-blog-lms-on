'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import {
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Brain
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
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
import type { LearningSummary } from '@/types/learning-management';
import Navbar from '@/components/Navbar';

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [learningSummary, setLearningSummary] = useState<LearningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 學生ID從認證用戶獲取
  const studentId = user?.id || 'demo-student';

  // 模擬圖表數據
  const studyTimeData = [
    { name: '週一', 時間: 45 },
    { name: '週二', 時間: 30 },
    { name: '週三', 時間: 60 },
    { name: '週四', 時間: 25 },
    { name: '週五', 時間: 50 },
    { name: '週六', 時間: 40 },
    { name: '週日', 時間: 35 },
  ];

  const examScoreData = [
    { name: '第1週', 小考: 85, 段考: 88 },
    { name: '第2週', 小考: 78, 段考: 85 },
    { name: '第3週', 小考: 92, 段考: 90 },
    { name: '第4週', 小考: 88, 段考: 92 },
  ];

  // 檢查用戶認證狀態
  useEffect(() => {
    checkUser();
  }, []);

  // 當用戶狀態改變時，重新載入數據
  useEffect(() => {
    if (user) {
      fetchLearningSummary();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        // 如果未登入，仍顯示 demo 數據
        setUser({ id: 'demo-student', email: 'demo@example.com' });
      }
    } catch (error) {
      console.error('檢查用戶認證失敗:', error);
      // 使用 demo 用戶
      setUser({ id: 'demo-student', email: 'demo@example.com' });
    }
  };

  const fetchLearningSummary = async () => {
    try {
      const response = await fetch(`/api/learning/progress?student_id=${studentId}&summary=true`);
      const data = await response.json();
      if (data.success) {
        setLearningSummary(data.data);
      } else {
        console.error('API Error:', data.error);
        // 使用模擬數據以便展示
        setLearningSummary({
          student_id: studentId,
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          },
          assignments: {
            completed: 12,
            total: 15,
            on_time: 10,
            late: 2
          },
          vocabulary: {
            total_words: 450,
            avg_accuracy: 85.5,
            sessions_count: 20
          },
          exams: {
            count: 3,
            avg_score: 82.5,
            highest_score: 92,
            lowest_score: 75
          },
          projects: {
            active: 2,
            completed: 1,
            total: 3
          },
          study_time: {
            total_minutes: 1200,
            daily_average: 40
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch learning summary:', error);
      // 使用模擬數據以便展示
      setLearningSummary({
        student_id: studentId,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        assignments: {
          completed: 12,
          total: 15,
          on_time: 10,
          late: 2
        },
        vocabulary: {
          total_words: 450,
          avg_accuracy: 85.5,
          sessions_count: 20
        },
        exams: {
          count: 3,
          avg_score: 82.5,
          highest_score: 92,
          lowest_score: 75
        },
        projects: {
          active: 2,
          completed: 1,
          total: 3
        },
        study_time: {
          total_minutes: 1200,
          daily_average: 40
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">載入學習資料中...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">學習管理中心</h1>
          <p className="text-muted-foreground mt-1">
            {user?.email ? `歡迎，${user.email}！追蹤您的學習進度與成就` : '追蹤您的學習進度與成就'}
          </p>
        </div>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          產生週報告
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="本月學習時間"
          value={`${Math.floor((learningSummary?.study_time.total_minutes || 0) / 60)}小時`}
          change={{
            value: 12,
            label: `日均 ${learningSummary?.study_time.daily_average || 0} 分鐘`
          }}
          icon={<Clock className="w-5 h-5" />}
          gradient="primary"
        />

        <StatsCard
          title="作業完成率"
          value={`${learningSummary?.assignments.total
            ? Math.round((learningSummary.assignments.completed / learningSummary.assignments.total) * 100)
            : 0}%`}
          change={{
            value: 5,
            label: "本週提升"
          }}
          icon={<CheckCircle2 className="w-5 h-5" />}
          gradient="success"
        />

        <StatsCard
          title="單字學習"
          value={`${learningSummary?.vocabulary.total_words || 0} 個`}
          change={{
            value: 8,
            label: `正確率 ${learningSummary?.vocabulary.avg_accuracy?.toFixed(1) || 0}%`
          }}
          icon={<BookOpen className="w-5 h-5" />}
          gradient="warning"
        />

        <StatsCard
          title="考試平均分"
          value={learningSummary?.exams.avg_score?.toFixed(1) || 'N/A'}
          change={{
            value: 3,
            label: `共 ${learningSummary?.exams.count || 0} 次考試`
          }}
          icon={<Trophy className="w-5 h-5" />}
          gradient="secondary"
        />
      </div>

      {/* 主要內容區 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="assignments">作業</TabsTrigger>
          <TabsTrigger value="vocabulary">單字</TabsTrigger>
          <TabsTrigger value="exams">考試</TabsTrigger>
          <TabsTrigger value="projects">專案</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 學習日曆 */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>學習日曆</CardTitle>
                <CardDescription>查看每日學習記錄</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* 本週任務 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>本週重點任務</CardTitle>
                <CardDescription>需要完成的重要事項</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    <div>
                      <p className="font-medium">每日單字 50-100</p>
                      <p className="text-sm text-muted-foreground">今日尚未完成</p>
                    </div>
                  </div>
                  <Badge variant="outline">待完成</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="font-medium">週測驗</p>
                      <p className="text-sm text-muted-foreground">已完成，得分 85/100</p>
                    </div>
                  </div>
                  <Badge variant="default">已完成</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    <div>
                      <p className="font-medium">作文練習</p>
                      <p className="text-sm text-muted-foreground">截止日期：明天</p>
                    </div>
                  </div>
                  <Badge variant="destructive">緊急</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 學習趨勢圖表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="每週學習時間"
              description="過去7天的學習時間分布"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studyTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar
                    dataKey="時間"
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="考試成績趨勢"
              description="小考與段考成績對比"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={examScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="小考"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="段考"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>作業管理</CardTitle>
              <CardDescription>查看和提交作業</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">作業列表將在此顯示</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vocabulary">
          <Card>
            <CardHeader>
              <CardTitle>單字學習</CardTitle>
              <CardDescription>追蹤單字學習進度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">單字學習記錄將在此顯示</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>考試成績</CardTitle>
              <CardDescription>查看歷次考試表現</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">考試記錄將在此顯示</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>特殊專案</CardTitle>
              <CardDescription>管理進行中的專案</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">專案列表將在此顯示</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}