'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartData {
  date: string;
  value: number;
  label?: string;
}

interface ProgressChartsProps {
  studentId: string;
  courseId?: string;
}

export function ProgressCharts({ studentId, courseId }: ProgressChartsProps) {
  // 模擬圖表數據 - 實際應用中應從 API 獲取
  const vocabularyData: ChartData[] = [
    { date: '週一', value: 45, label: '45個' },
    { date: '週二', value: 52, label: '52個' },
    { date: '週三', value: 48, label: '48個' },
    { date: '週四', value: 60, label: '60個' },
    { date: '週五', value: 55, label: '55個' },
    { date: '週六', value: 40, label: '40個' },
    { date: '週日', value: 35, label: '35個' }
  ];

  const examScores: ChartData[] = [
    { date: '1月', value: 75 },
    { date: '2月', value: 82 },
    { date: '3月', value: 78 },
    { date: '4月', value: 85 },
    { date: '5月', value: 88 },
    { date: '6月', value: 92 }
  ];

  const studyTime: ChartData[] = [
    { date: '週一', value: 45 },
    { date: '週二', value: 60 },
    { date: '週三', value: 50 },
    { date: '週四', value: 55 },
    { date: '週五', value: 40 },
    { date: '週六', value: 70 },
    { date: '週日', value: 65 }
  ];

  // 計算趨勢
  const calculateTrend = (data: ChartData[]) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
    const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.value, 0) / 3;
    return ((recent - previous) / previous) * 100;
  };

  const vocabularyTrend = calculateTrend(vocabularyData);
  const examTrend = calculateTrend(examScores);
  const studyTimeTrend = calculateTrend(studyTime);

  // 簡單的條形圖組件
  const BarChart = ({ data, maxValue, color = 'bg-primary' }: {
    data: ChartData[];
    maxValue: number;
    color?: string;
  }) => (
    <div className="flex items-end justify-between h-48 gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="w-full relative flex-1 flex items-end">
            <div
              className={`w-full ${color} rounded-t transition-all duration-300 hover:opacity-80`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={item.label || `${item.value}`}
            />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
              {item.value}
            </span>
          </div>
          <span className="text-xs mt-2 text-muted-foreground">{item.date}</span>
        </div>
      ))}
    </div>
  );

  // 簡單的折線圖組件
  const LineChart = ({ data, maxValue }: { data: ChartData[]; maxValue: number }) => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 網格線 */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2"
            />
          ))}
          {/* 折線 */}
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          {/* 數據點 */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="hsl(var(--primary))"
                className="hover:r-4 transition-all"
              >
                <title>{`${item.date}: ${item.value}`}</title>
              </circle>
            );
          })}
        </svg>
        {/* X 軸標籤 */}
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-muted-foreground">
              {item.date}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 5) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{value.toFixed(1)}%</span>
        </div>
      );
    } else if (value < -5) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="h-4 w-4" />
          <span className="text-sm font-medium">持平</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">學習進度分析</h2>
        <Select defaultValue="week">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="選擇時間範圍" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">本週</SelectItem>
            <SelectItem value="month">本月</SelectItem>
            <SelectItem value="quarter">本季</SelectItem>
            <SelectItem value="year">今年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="vocabulary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vocabulary">單字學習</TabsTrigger>
          <TabsTrigger value="exams">考試成績</TabsTrigger>
          <TabsTrigger value="time">學習時間</TabsTrigger>
        </TabsList>

        <TabsContent value="vocabulary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>每日單字學習量</CardTitle>
                  <CardDescription>本週單字學習統計</CardDescription>
                </div>
                <TrendIndicator value={vocabularyTrend} />
              </div>
            </CardHeader>
            <CardContent>
              <BarChart
                data={vocabularyData}
                maxValue={80}
                color="bg-blue-500"
              />
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">週平均</p>
                  <p className="text-2xl font-bold">48個</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最高日</p>
                  <p className="text-2xl font-bold">60個</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">累計</p>
                  <p className="text-2xl font-bold">335個</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>考試成績趨勢</CardTitle>
                  <CardDescription>最近6個月考試表現</CardDescription>
                </div>
                <TrendIndicator value={examTrend} />
              </div>
            </CardHeader>
            <CardContent>
              <LineChart data={examScores} maxValue={100} />
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">平均分</p>
                  <p className="text-2xl font-bold">82.5</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最高分</p>
                  <p className="text-2xl font-bold">92</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">進步幅度</p>
                  <p className="text-2xl font-bold text-green-600">+17</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>每日學習時間</CardTitle>
                  <CardDescription>本週學習時間分布（分鐘）</CardDescription>
                </div>
                <TrendIndicator value={studyTimeTrend} />
              </div>
            </CardHeader>
            <CardContent>
              <BarChart
                data={studyTime}
                maxValue={90}
                color="bg-green-500"
              />
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">總時長</p>
                  <p className="text-2xl font-bold">6.4小時</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">日均</p>
                  <p className="text-2xl font-bold">55分鐘</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最長日</p>
                  <p className="text-2xl font-bold">70分鐘</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}