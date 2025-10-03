'use client';

import React, { useEffect, useRef } from 'react';
import { Gantt } from 'frappe-gantt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// CSS 將通過內聯樣式處理

interface FrappeGanttTask {
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
  isPersonalized?: boolean;
  assignedBy?: string;
}

interface FrappeGanttChartProps {
  tasks: FrappeGanttTask[];
  studentName?: string;
  onTaskClick?: (task: FrappeGanttTask) => void;
  className?: string;
  year?: number;
}

const FrappeGanttChart: React.FC<FrappeGanttChartProps> = ({
  tasks,
  studentName = '學生',
  onTaskClick,
  className,
  year = new Date().getFullYear()
}) => {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<Gantt | null>(null);

  // 轉換任務格式為 Frappe Gantt 格式
  const frappeGanttTasks = tasks.map(task => ({
    id: task.id,
    name: task.title,
    start: task.startDate,
    end: task.dueDate,
    progress: task.progress,
    dependencies: '', // Frappe Gantt 支援任務依賴
    custom_class: `priority-${task.priority} ${task.isPersonalized ? 'personalized' : 'common'}`,
  }));

  useEffect(() => {
    if (ganttRef.current && frappeGanttTasks.length > 0) {
      // 清理現有實例
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }

      // 創建新的 Gantt 實例
      ganttInstance.current = new Gantt(ganttRef.current, frappeGanttTasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: 'Week', // 預設顯示週視圖
        date_format: 'YYYY-MM-DD',
        popup_trigger: 'click',
        language: 'zh-TW', // 設定中文
        readonly: true, // 唯讀模式
        on_click: (task: any) => {
          const originalTask = tasks.find(t => t.id === task.id);
          if (originalTask && onTaskClick) {
            onTaskClick(originalTask);
          }
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          console.log('Date changed:', task, start, end);
        },
        on_progress_change: (task: any, progress: number) => {
          console.log('Progress changed:', task, progress);
        },
        on_view_change: (mode: string) => {
          console.log('View mode changed:', mode);
        }
      });
    }

    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, [frappeGanttTasks, tasks, onTaskClick]);

  // 統計資訊
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    notStarted: tasks.filter(t => t.status === 'not_started').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    personalized: tasks.filter(t => t.isPersonalized).length,
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>作業甘特圖 - {studentName}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {year} 年度
          </span>
        </CardTitle>

        {/* 統計資訊 */}
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span>總作業：{stats.total}</span>
          <span>已完成：{stats.completed}</span>
          <span>進行中：{stats.inProgress}</span>
          <span>個人專屬：{stats.personalized}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Frappe Gantt 容器 */}
        <div className="w-full overflow-x-auto">
          <div ref={ganttRef} className="gantt-container"></div>
        </div>

        {/* 空狀態 */}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>此年度無作業資料</p>
          </div>
        )}
      </CardContent>

      {/* 自訂樣式 */}
      <style jsx global>{`
        .gantt-container {
          font-family: inherit;
          width: 100%;
        }

        /* 基本甘特圖樣式 */
        .gantt {
          width: 100%;
          font-family: inherit;
          font-size: 12px;
        }

        .gantt .grid-header {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          font-weight: 600;
        }

        .gantt .grid-row {
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--background));
        }

        .gantt .grid-row:hover {
          background: hsl(var(--muted) / 0.5);
        }

        .gantt .bar {
          border-radius: 4px;
          cursor: pointer;
        }

        .gantt .bar:hover {
          opacity: 0.8;
        }

        .gantt .bar.priority-urgent {
          fill: #ef4444;
        }

        .gantt .bar.priority-high {
          fill: #f97316;
        }

        .gantt .bar.priority-medium {
          fill: #eab308;
        }

        .gantt .bar.priority-low {
          fill: #6b7280;
        }

        .gantt .bar.personalized {
          stroke: #8b5cf6;
          stroke-width: 2px;
        }

        .gantt .today-highlight {
          background: rgba(59, 130, 246, 0.1);
        }

        .gantt .grid-header-row {
          background: hsl(var(--muted));
        }

        .gantt .grid-header-cell {
          border-right: 1px solid hsl(var(--border));
          padding: 8px;
        }

        .gantt .grid-body-cell {
          border-right: 1px solid hsl(var(--border));
          padding: 8px;
        }

        .gantt svg {
          width: 100%;
          height: auto;
        }
      `}</style>
    </Card>
  );
};

export default FrappeGanttChart;