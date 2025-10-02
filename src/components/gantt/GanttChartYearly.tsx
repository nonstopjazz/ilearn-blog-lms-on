'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  format,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  getWeek,
  getYear,
  parseISO,
  isWithinInterval,
  differenceInWeeks,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isSameWeek
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 甘特圖任務介面
export interface GanttTask {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  submissionType?: string;
  estimatedHours?: number;
  isPersonalized?: boolean; // 是否為個人專屬作業
  assignedBy?: string; // 分配者（老師名稱）
}

interface GanttChartYearlyProps {
  tasks: GanttTask[];
  studentName?: string; // 學生姓名
  onTaskClick?: (task: GanttTask) => void;
  className?: string;
  year?: number;
}

const GanttChartYearly: React.FC<GanttChartYearlyProps> = ({
  tasks,
  studentName = '學生',
  onTaskClick,
  className,
  year: propYear
}) => {
  const currentYear = propYear || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'quarter' | 'half' | 'full'>('full');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 計算顯示的週數範圍
  const weekRange = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

    if (zoomLevel === 'quarter') {
      // 顯示當前季度 (約13週)
      const currentWeek = getWeek(new Date(), { locale: zhTW });
      const quarterStart = Math.max(1, currentWeek - 6);
      const quarterEnd = Math.min(52, currentWeek + 6);
      return { start: quarterStart, end: quarterEnd, total: quarterEnd - quarterStart + 1 };
    } else if (zoomLevel === 'half') {
      // 顯示半年 (26週)
      const currentWeek = getWeek(new Date(), { locale: zhTW });
      const halfStart = currentWeek <= 26 ? 1 : 27;
      const halfEnd = currentWeek <= 26 ? 26 : 52;
      return { start: halfStart, end: halfEnd, total: 26 };
    } else {
      // 顯示全年 (52週)
      return { start: 1, end: 52, total: 52 };
    }
  }, [selectedYear, zoomLevel]);

  // 生成週列表
  const weeks = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

    const allWeeks = eachWeekOfInterval({
      start: yearStart,
      end: yearEnd
    }, { locale: zhTW });

    // 根據縮放級別過濾週數
    return allWeeks.slice(weekRange.start - 1, weekRange.end);
  }, [selectedYear, weekRange]);

  // 過濾任務
  const filteredTasks = useMemo(() => {
    // 只顯示在當前年度有重疊的任務
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

    const filtered = tasks.filter(task => {
      const taskStart = parseISO(task.startDate);
      const taskEnd = parseISO(task.dueDate);
      return isWithinInterval(taskStart, { start: yearStart, end: yearEnd }) ||
             isWithinInterval(taskEnd, { start: yearStart, end: yearEnd }) ||
             (taskStart <= yearStart && taskEnd >= yearEnd);
    });

    // 按開始日期排序
    return filtered.sort((a, b) => {
      const dateCompare = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      // 如果開始日期相同，個人專屬作業優先顯示
      if (a.isPersonalized !== b.isPersonalized) {
        return a.isPersonalized ? -1 : 1;
      }
      return 0;
    });
  }, [tasks, selectedYear]);

  // 按類別分組任務（用於更好的視覺呈現）
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<string, GanttTask[]>();

    // 先添加個人專屬作業類別
    const personalizedTasks = filteredTasks.filter(t => t.isPersonalized);
    if (personalizedTasks.length > 0) {
      grouped.set('個人專屬作業', personalizedTasks);
    }

    // 再按原有類別分組共同作業
    const commonTasks = filteredTasks.filter(t => !t.isPersonalized);
    commonTasks.forEach(task => {
      const category = task.category || '其他';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(task);
    });

    return grouped;
  }, [filteredTasks]);

  // 狀態顏色映射
  const getStatusColor = (status: GanttTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // 優先度顏色映射
  const getPriorityColor = (priority: GanttTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-600';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-gray-400';
    }
  };

  // 計算任務在甘特圖中的位置和寬度（基於週）
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.dueDate);
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));

    // 計算開始週和結束週
    const startWeekNum = getWeek(taskStart, { locale: zhTW });
    const endWeekNum = getWeek(taskEnd, { locale: zhTW });

    // 計算相對於顯示範圍的位置
    const relativeStart = startWeekNum - weekRange.start;
    const startPosition = Math.max(0, (relativeStart / weekRange.total) * 100);

    // 計算寬度（週數）
    const taskDurationWeeks = endWeekNum - startWeekNum + 1;
    const width = Math.min(100 - startPosition, (taskDurationWeeks / weekRange.total) * 100);

    return {
      left: `${startPosition}%`,
      width: `${Math.max(width, 100 / weekRange.total)}%` // 至少顯示一週的寬度
    };
  };

  // 年份選擇列表（前後5年）
  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = -5; i <= 5; i++) {
      years.push(currentYear + i);
    }
    return years;
  }, [currentYear]);

  // 獲取月份標記
  const getMonthMarkers = useMemo(() => {
    const markers = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(selectedYear, month, 1);
      const weekNum = getWeek(monthStart, { locale: zhTW });
      const position = ((weekNum - weekRange.start) / weekRange.total) * 100;

      if (position >= 0 && position <= 100) {
        markers.push({
          month: format(monthStart, 'MMM', { locale: zhTW }),
          position
        });
      }
    }
    return markers;
  }, [selectedYear, weekRange]);

  // 獲取當前週的位置
  const currentWeekPosition = useMemo(() => {
    const now = new Date();
    if (getYear(now) === selectedYear) {
      const currentWeek = getWeek(now, { locale: zhTW });
      const position = ((currentWeek - weekRange.start) / weekRange.total) * 100;
      return position >= 0 && position <= 100 ? position : null;
    }
    return null;
  }, [selectedYear, weekRange]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>年度作業甘特圖</span>
          </CardTitle>

          <div className="flex items-center space-x-4">
            {/* 縮放控制 */}
            <div className="flex items-center space-x-1 border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('quarter')}
                className={cn("px-2", zoomLevel === 'quarter' && "bg-muted")}
                title="顯示季度"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('half')}
                className={cn("px-2", zoomLevel === 'half' && "bg-muted")}
                title="顯示半年"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel('full')}
                className={cn("px-2", zoomLevel === 'full' && "bg-muted")}
                title="顯示全年"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>

            {/* 年份選擇 */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year} 年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
          <span>顯示範圍：第 {weekRange.start} - {weekRange.end} 週</span>
          <span>共 {weekRange.total} 週</span>
          <span>任務數：{filteredTasks.length}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto" ref={scrollRef}>
          <div className="min-w-[1200px]">
            {/* 月份標記 */}
            <div className="grid grid-cols-[200px_1fr] border-b">
              <div className="p-2 bg-muted/50 font-medium text-xs border-r">
                月份標記
              </div>
              <div className="relative h-6 bg-muted/30">
                {getMonthMarkers.map((marker, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 border-l border-primary/30 flex items-center"
                    style={{ left: `${marker.position}%` }}
                  >
                    <span className="text-xs font-medium text-primary ml-1">
                      {marker.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 週標題行 */}
            <div className="grid grid-cols-[200px_1fr] border-b">
              <div className="p-3 bg-muted/50 font-medium text-sm border-r">
                學生/作業
              </div>
              <div className="relative">
                <div className="flex">
                  {weeks.map((week, index) => {
                    const weekNum = getWeek(week, { locale: zhTW });
                    const isCurrentWeek = currentWeekPosition !== null &&
                      Math.abs((((weekNum - weekRange.start) / weekRange.total) * 100) - currentWeekPosition) < 2;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex-1 p-1 text-xs text-center border-r last:border-r-0",
                          "bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer",
                          isCurrentWeek && "bg-primary/10 text-primary font-semibold",
                          hoveredWeek === weekNum && "bg-muted"
                        )}
                        onMouseEnter={() => setHoveredWeek(weekNum)}
                        onMouseLeave={() => setHoveredWeek(null)}
                        title={`第 ${weekNum} 週\n${format(startOfWeek(week, { locale: zhTW }), 'MM/dd', { locale: zhTW })} - ${format(endOfWeek(week, { locale: zhTW }), 'MM/dd', { locale: zhTW })}`}
                      >
                        <div className="font-medium">W{weekNum}</div>
                        {index % 4 === 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            {format(week, 'MM/dd', { locale: zhTW })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 當前週標記線 */}
                {currentWeekPosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-50 pointer-events-none z-10"
                    style={{ left: `${currentWeekPosition}%` }}
                  />
                )}
              </div>
            </div>

            {/* 任務行 - 按類別分組 */}
            {Array.from(tasksByCategory.entries()).map(([category, categoryTasks]) => {
              const isPersonalized = category === '個人專屬作業';

              return (
                <div key={category}>
                  {/* 類別標題行 */}
                  <div className="grid grid-cols-[200px_1fr] border-b bg-muted/30">
                    <div className="p-3 border-r flex items-center space-x-2">
                      {isPersonalized ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "font-medium text-sm",
                        isPersonalized && "text-primary"
                      )}>
                        {category}
                      </span>
                      <Badge
                        variant={isPersonalized ? "default" : "outline"}
                        className="text-xs"
                      >
                        {categoryTasks.length}
                      </Badge>
                    </div>
                    <div className="relative h-12"></div>
                  </div>

                  {/* 任務行 */}
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-[200px_1fr] border-b hover:bg-muted/20 transition-colors"
                    >
                      {/* 任務信息 */}
                      <div className={cn(
                        "p-3 border-r flex flex-col justify-center space-y-1",
                        getPriorityColor(task.priority), "border-l-4"
                      )}>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium truncate flex-1" title={task.title}>
                            {task.title}
                          </div>
                          {task.isPersonalized && (
                            <Badge variant="default" className="text-[9px] px-1 py-0">
                              專屬
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {task.assignedBy && (
                            <span className="text-[10px]">by {task.assignedBy}</span>
                          )}
                          {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {task.status === 'in_progress' && <Clock className="w-3 h-3 text-blue-500" />}
                          {task.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          <span className="text-[10px]">
                            {format(parseISO(task.startDate), 'MM/dd')} - {format(parseISO(task.dueDate), 'MM/dd')}
                          </span>
                        </div>
                      </div>

                      {/* 甘特圖條 */}
                      <div className="relative p-2 h-16">
                        <div
                          className={cn(
                            "absolute top-1/2 transform -translate-y-1/2 h-6 rounded cursor-pointer",
                            "border shadow-sm transition-all duration-200",
                            getStatusColor(task.status),
                            hoveredTask === task.id && "h-8 shadow-md z-20",
                            task.status === 'completed' && "opacity-80"
                          )}
                          style={getTaskPosition(task)}
                          onClick={() => onTaskClick?.(task)}
                          onMouseEnter={() => setHoveredTask(task.id)}
                          onMouseLeave={() => setHoveredTask(null)}
                        >
                          {/* 進度條 */}
                          <div
                            className="h-full bg-white/30 rounded-l"
                            style={{ width: `${task.progress}%` }}
                          />

                          {/* 任務標題（如果有空間顯示） */}
                          {hoveredTask === task.id && (
                            <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                              <span className="text-xs text-white font-medium truncate">
                                {task.title} ({task.progress}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 當前週標記線 */}
                        {currentWeekPosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-30 pointer-events-none"
                            style={{ left: `${currentWeekPosition}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* 空狀態 */}
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>此年度無作業資料</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChartYearly;