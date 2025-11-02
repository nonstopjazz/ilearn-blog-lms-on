'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// DHTMLX Gantt 任務介面
interface DHtmlxGanttTask {
  id: string;
  text: string;
  start_date: Date;
  end_date: Date;
  duration: number;
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  category: string;
  isPersonalized?: boolean;
  assignedBy?: string;
  parent?: string;
}

// 原始任務介面（來自 GanttTask）
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
  isPersonalized?: boolean;
  assignedBy?: string;
}

interface DHtmlxGanttChartProps {
  tasks: GanttTask[];
  studentName?: string;
  onTaskClick?: (task: GanttTask) => void;
  className?: string;
  year?: number;
}

const DHtmlxGanttChart: React.FC<DHtmlxGanttChartProps> = ({
  tasks,
  studentName = '學生',
  onTaskClick,
  className,
  year = new Date().getFullYear()
}) => {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const originalTasks = useRef<GanttTask[]>([]);
  const isInitialized = useRef(false);

  // 轉換任務格式
  // 過濾掉 not_started 狀態的作業（不顯示條狀物，但仍在列表中）
  const convertTasks = useCallback((originalTasks: GanttTask[]): DHtmlxGanttTask[] => {
    return originalTasks
      .filter(task => task.status !== 'not_started') // 過濾掉未開始的作業
      .map(task => ({
        id: task.id,
        text: task.title,
        start_date: new Date(task.startDate),
        end_date: new Date(task.dueDate),
        duration: Math.ceil((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        progress: task.progress / 100,
        priority: task.priority,
        status: task.status,
        category: task.category,
        isPersonalized: task.isPersonalized,
        assignedBy: task.assignedBy
      }));
  }, []);

  // 設定 DHTMLX Gantt 配置
  const setupGanttConfig = useCallback(() => {
    // 設定中文本地化
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.xml_date = '%Y-%m-%d';

    // 設定中文月份和週數格式
    gantt.locale.labels.months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    gantt.locale.labels.months_short = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    // 設定時間軸 - 使用雙層結構：月份 + 週次
    gantt.config.scales = [
      {
        unit: 'month',
        step: 1,
        format: function(date: Date) {
          return gantt.date.date_to_str('%Y年%M')(date);
        }
      },
      {
        unit: 'week',
        step: 1,
        format: function(date: Date) {
          const weekNum = gantt.date.date_to_str('%W')(date);
          return `第${weekNum}週`;
        }
      }
    ];

    // 設定年度視圖範圍
    gantt.config.start_date = new Date(year, 0, 1);
    gantt.config.end_date = new Date(year + 1, 0, 1);

    // 設定欄位
    gantt.config.columns = [
      { name: 'text', label: '作業名稱', tree: true, width: 200 },
      { name: 'category', label: '類別', width: 80 },
      { name: 'start_date', label: '開始日期', width: 100 },
      { name: 'duration', label: '天數', width: 60, align: 'center' },
      { name: 'progress', label: '進度', width: 80, template: (task: any) => `${Math.round(task.progress * 100)}%` }
    ];

    // 設定樣式
    gantt.config.grid_width = 530;
    gantt.config.row_height = 30;
    gantt.config.bar_height = 20;

    // 設定只讀模式
    gantt.config.readonly = true;

    // 設定任務顏色 - 根據狀態而非優先級
    gantt.templates.task_class = function(start: Date, end: Date, task: any) {
      let classes = [];

      // 根據狀態設定顏色
      switch (task.status) {
        case 'in_progress':
          classes.push('task-in-progress'); // 進行中 - 亮橘色
          break;
        case 'completed':
          classes.push('task-completed'); // 已完成 - 亮綠色
          break;
        case 'overdue':
          classes.push('task-overdue'); // 逾期 - 紅色
          break;
        default:
          // not_started 不應該出現在這裡（已被過濾）
          classes.push('task-not-started');
      }

      // 個人專屬作業標記
      if (task.isPersonalized) {
        classes.push('task-personalized');
      }

      return classes.join(' ');
    };

    // 設定任務文字顯示
    gantt.templates.task_text = function(start: Date, end: Date, task: any) {
      return `<span class="task-text">${task.text}</span>`;
    };

    // 設定週數顯示
    gantt.templates.scale_cell_class = function(date: Date) {
      const week = gantt.date.date_to_str('%W')(date);
      return 'week-' + week;
    };

  }, [year]);

  // 初始化甘特圖（只初始化一次）
  useEffect(() => {
    if (ganttContainer.current && !isInitialized.current) {
      // 設定配置
      setupGanttConfig();

      // 初始化甘特圖
      gantt.init(ganttContainer.current);

      isInitialized.current = true;

      // 設定任務點擊事件
      gantt.attachEvent('onTaskClick', function(id: string) {
        const originalTask = originalTasks.current.find(task => task.id === id);
        if (originalTask && onTaskClick) {
          onTaskClick(originalTask);
        }
        return true;
      });
    }

    return () => {
      if (isInitialized.current) {
        // 清除數據和事件
        gantt.clearAll();
        gantt.detachAllEvents();
        isInitialized.current = false;
      }
    };
  }, [setupGanttConfig, onTaskClick]);

  // 更新任務數據（當 tasks 變化時）
  useEffect(() => {
    if (isInitialized.current) {
      // 儲存原始任務
      originalTasks.current = tasks;

      // 清除舊數據
      gantt.clearAll();

      // 轉換並載入新任務
      const dhtmlxTasks = convertTasks(tasks);
      gantt.parse({ data: dhtmlxTasks });
    }
  }, [tasks, convertTasks]);

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
          <span>專案作業</span>
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
        {/* DHTMLX Gantt 容器 */}
        <div
          ref={ganttContainer}
          className="gantt-container h-[600px] w-full"
        />

        {/* 空狀態 */}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>此年度無作業資料</p>
          </div>
        )}
      </CardContent>

      {/* 自訂樣式 */}
      <style jsx global>{`
        /* DHTMLX Gantt 基礎樣式 */
        .gantt_container {
          font-family: inherit;
        }

        /* 任務狀態顏色 */
        .gantt_task_line.task-in-progress {
          background: transparent; /* 完全透明 - 進行中 */
          border: 1px solid transparent;
        }

        .gantt_task_line.task-completed {
          background: #4ade80; /* 亮綠色 - 已完成 */
          border: 1px solid #22c55e;
        }

        .gantt_task_line.task-overdue {
          background: #ef4444; /* 紅色 - 逾期 */
          border: 1px solid #dc2626;
        }

        .gantt_task_line.task-not-started {
          background: #9ca3af; /* 灰色 - 未開始（不應出現）*/
          border: 1px solid #6b7280;
        }

        /* 個人專屬作業樣式 */
        .gantt_task_line.task-personalized {
          border: 2px solid #8b5cf6;
          box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
        }

        /* 任務文字樣式 */
        .task-text {
          color: white;
          font-weight: 500;
          font-size: 12px;
        }

        /* 週數標記樣式 */
        .gantt_scale_cell {
          border-right: 1px solid hsl(var(--border));
        }

        /* 今天標記 */
        .gantt_today {
          background: rgba(59, 130, 246, 0.1) !important;
        }

        /* 網格樣式 */
        .gantt_grid_scale {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
        }

        .gantt_grid_head_cell {
          background: hsl(var(--muted));
          border-right: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .gantt_row {
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--background));
        }

        .gantt_row:hover {
          background: hsl(var(--muted) / 0.5);
        }

        /* 時間軸樣式 */
        .gantt_scale_line {
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted));
        }

        .gantt_scale_cell {
          color: hsl(var(--foreground));
          font-size: 12px;
        }

        /* 任務進度條 */
        .gantt_task_progress {
          background: rgba(255, 255, 255, 0.3);
        }

        /* 響應式調整 */
        @media (max-width: 768px) {
          .gantt_container {
            font-size: 11px;
          }

          .gantt_grid_scale .gantt_grid_head_cell {
            padding: 4px;
          }
        }
      `}</style>
    </Card>
  );
};

export default DHtmlxGanttChart;