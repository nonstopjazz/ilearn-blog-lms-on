'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, differenceInDays, isWithinInterval } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// 甘特圖任務介面
export interface GanttTask {
  id: string;
  title: string;
  description?: string;
  studentId: string;
  studentName: string;
  courseId: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  submissionType?: string;
  estimatedHours?: number;
}

interface GanttChartProps {
  tasks: GanttTask[];
  viewType?: 'week' | 'month';
  selectedStudent?: string;
  onTaskClick?: (task: GanttTask) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
  className?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  viewType = 'week',
  selectedStudent,
  onTaskClick,
  onDateRangeChange,
  className
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 計算日期範圍
  const dateRange = useMemo(() => {
    if (viewType === 'week') {
      const start = startOfWeek(currentDate, { locale: zhTW });
      const end = endOfWeek(currentDate, { locale: zhTW });
      return { start, end };
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    }
  }, [currentDate, viewType]);

  // 生成日期列表
  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end
    });
  }, [dateRange]);

  // 過濾任務
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (selectedStudent) {
      filtered = filtered.filter(task => task.studentId === selectedStudent);
    }

    // 只顯示在當前日期範圍內有重疊的任務
    filtered = filtered.filter(task => {
      const taskStart = parseISO(task.startDate);
      const taskEnd = parseISO(task.dueDate);
      return isWithinInterval(taskStart, dateRange) ||
             isWithinInterval(taskEnd, dateRange) ||
             (taskStart <= dateRange.start && taskEnd >= dateRange.end);
    });

    return filtered.sort((a, b) => {
      // 按學生名稱和開始日期排序
      if (a.studentName !== b.studentName) {
        return a.studentName.localeCompare(b.studentName);
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [tasks, selectedStudent, dateRange]);

  // 按學生分組任務
  const tasksByStudent = useMemo(() => {
    const grouped = new Map<string, GanttTask[]>();
    filteredTasks.forEach(task => {
      const key = `${task.studentId}-${task.studentName}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(task);
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

  // 計算任務在甘特圖中的位置和寬度
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.dueDate);
    const totalDays = dates.length;

    // 計算開始位置
    const startDiff = differenceInDays(taskStart, dateRange.start);
    const startPosition = Math.max(0, (startDiff / totalDays) * 100);

    // 計算寬度
    const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
    const width = Math.min(100 - startPosition, (taskDuration / totalDays) * 100);

    return { left: `${startPosition}%`, width: `${Math.max(width, 1)}%` };
  };

  // 導航函數
  const navigatePrevious = () => {
    const newDate = viewType === 'week'
      ? addDays(currentDate, -7)
      : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = viewType === 'week'
      ? addDays(currentDate, 7)
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  // 通知日期範圍變化
  useEffect(() => {
    onDateRangeChange?.(dateRange.start, dateRange.end);
  }, [dateRange, onDateRangeChange]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>作業甘特圖</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-sm font-medium min-w-[140px] text-center">
              {viewType === 'week'
                ? `${format(dateRange.start, 'MM/dd', { locale: zhTW })} - ${format(dateRange.end, 'MM/dd', { locale: zhTW })}`
                : format(currentDate, 'yyyy年 MM月', { locale: zhTW })
              }
            </div>

            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto" ref={scrollRef}>
          <div className="min-w-[800px]">
            {/* 日期標題行 */}
            <div className="grid grid-cols-[200px_1fr] border-b">
              <div className="p-3 bg-muted/50 font-medium text-sm border-r">
                學生/作業
              </div>
              <div className="grid grid-cols-7 lg:grid-cols-14 gap-0">
                {dates.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 text-xs text-center border-r last:border-r-0",
                      "bg-muted/50 font-medium",
                      isSameDay(date, new Date()) && "bg-primary/10 text-primary"
                    )}
                  >
                    <div>{format(date, 'MM/dd', { locale: zhTW })}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(date, 'EEE', { locale: zhTW })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 任務行 */}
            {Array.from(tasksByStudent.entries()).map(([studentKey, studentTasks]) => {
              const [studentId, studentName] = studentKey.split('-');

              return (
                <div key={studentKey}>
                  {/* 學生標題行 */}
                  <div className="grid grid-cols-[200px_1fr] border-b bg-muted/30">
                    <div className="p-3 border-r flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{studentName}</span>
                      <Badge variant="outline" className="text-xs">
                        {studentTasks.length}
                      </Badge>
                    </div>
                    <div className="relative h-12"></div>
                  </div>

                  {/* 任務行 */}
                  {studentTasks.map((task, taskIndex) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-[200px_1fr] border-b hover:bg-muted/20 transition-colors"
                    >
                      {/* 任務信息 */}
                      <div className={cn(
                        "p-3 border-r flex flex-col justify-center space-y-1",
                        getPriorityColor(task.priority), "border-l-4"
                      )}>
                        <div className="text-sm font-medium truncate" title={task.title}>
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1">
                            {task.category}
                          </Badge>
                          {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {task.status === 'in_progress' && <Clock className="w-3 h-3 text-blue-500" />}
                          {task.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>

                      {/* 甘特圖條 */}
                      <div className="relative p-2 h-16">
                        <div
                          className={cn(
                            "absolute top-1/2 transform -translate-y-1/2 h-6 rounded cursor-pointer",
                            "border shadow-sm transition-all duration-200",
                            getStatusColor(task.status),
                            hoveredTask === task.id && "h-8 shadow-md",
                            task.status === 'completed' && "opacity-80"
                          )}
                          style={getTaskPosition(task)}
                          onClick={() => onTaskClick?.(task)}
                          onMouseEnter={() => setHoveredTask(task.id)}
                          onMouseLeave={() => setHoveredTask(null)}
                          title={`${task.title}\n開始: ${format(parseISO(task.startDate), 'MM/dd', { locale: zhTW })}\n截止: ${format(parseISO(task.dueDate), 'MM/dd', { locale: zhTW })}\n進度: ${task.progress}%`}
                        >
                          {/* 進度條 */}
                          <div
                            className="h-full bg-white/30 rounded-l"
                            style={{ width: `${task.progress}%` }}
                          />

                          {/* 完成日期標記 */}
                          {task.completedDate && (
                            <div
                              className="absolute top-0 w-1 h-full bg-white rounded-r"
                              style={{
                                left: `${(differenceInDays(parseISO(task.completedDate), parseISO(task.startDate)) /
                                       (differenceInDays(parseISO(task.dueDate), parseISO(task.startDate)) + 1)) * 100}%`
                              }}
                            />
                          )}
                        </div>

                        {/* 今天的標記線 */}
                        {dates.some(date => isSameDay(date, new Date())) && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-primary/50 pointer-events-none"
                            style={{
                              left: `${(differenceInDays(new Date(), dateRange.start) / dates.length) * 100}%`
                            }}
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
                <p>此時間範圍內無作業</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;