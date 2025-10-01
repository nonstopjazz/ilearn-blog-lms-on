'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import {
  ClipboardList,
  Target,
  BookOpen,
  TrendingUp,
  Calendar,
  CheckCircle
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Navbar from '@/components/Navbar';

const Dashboard = () => {
  // 模擬數據
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

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">教學管理儀表板</h1>
            <p className="text-muted-foreground mt-1">全面掌握學生學習狀況</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">上次更新</p>
            <p className="text-sm font-medium">{new Date().toLocaleDateString('zh-TW')}</p>
          </div>
        </div>

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
          {/* 成績趨勢圖 */}
          <ChartCard
            title="成績趨勢分析"
            description="小考與段考成績對比"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gradeData}>
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line
                  type="monotone"
                  dataKey="段考"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--secondary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 單字學習統計 */}
          <ChartCard
            title="單字學習統計"
            description="各堂課單字學習數量"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vocabularyData}>
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
                  dataKey="單字數"
                  fill="hsl(var(--warning))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 作業進度追蹤 */}
        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="作業進度追蹤"
            description="各項作業完成情況一覽"
          >
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
                                  assignment.progress === 100 ? 'bg-success' :
                                  assignment.progress >= 70 ? 'bg-primary' :
                                  assignment.progress >= 40 ? 'bg-warning' : 'bg-destructive'
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
        </div>
      </div>
    </>
  );
};

export default Dashboard;