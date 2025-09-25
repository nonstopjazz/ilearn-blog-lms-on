// 學習管理系統類型定義

// 擴展的作業類型
export interface Assignment {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignment_type?: string;
  priority?: string;
  due_date?: string;
  estimated_duration?: number;
  is_required?: boolean;
  is_published?: boolean;
  tags?: string[];
  resources?: string[];
  // 新增欄位
  week_number?: number;
  daily_type?: string;
  submission_type?: string;
  max_score?: number;
  is_daily?: boolean;
  repeat_schedule?: RepeatSchedule;
  parent_notification_sent?: boolean;
  requirements?: Requirements;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// 重複排程
export interface RepeatSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: number[]; // 0-6 for Sunday-Saturday
  end_date?: string;
}

// 作業要求
export interface Requirements {
  min_words?: number;
  min_duration?: number;
  required_files?: string[];
  additional?: string;
}

// 每日作業類型
export interface DailyAssignmentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  submission_type?: string;
  default_points?: number;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

// 單字學習記錄
export interface VocabularySession {
  id: string;
  student_id: string;
  course_id: string;
  session_date: string;
  start_number: number;
  end_number: number;
  words_learned?: number;
  session_duration?: number;
  accuracy_rate?: number;
  review_count?: number;
  notes?: string;
  status?: 'completed' | 'in_progress' | 'skipped';
  parent_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 考試記錄
export interface ExamRecord {
  id: string;
  student_id: string;
  course_id: string;
  exam_type: 'quiz' | 'midterm' | 'final' | 'placement';
  exam_name: string;
  exam_date: string;
  subject?: string;
  total_score?: number;
  max_score?: number;
  percentage_score?: number;
  grade?: string;
  class_rank?: number;
  class_size?: number;
  topics?: ExamTopic[];
  mistakes?: ExamMistake[];
  teacher_feedback?: string;
  improvement_areas?: string[];
  is_retake?: boolean;
  original_exam_id?: string;
  attachment_url?: string;
  created_at?: string;
  updated_at?: string;
}

// 考試主題
export interface ExamTopic {
  name: string;
  weight?: number;
  score?: number;
}

// 考試錯誤
export interface ExamMistake {
  question: string;
  correct_answer: string;
  student_answer: string;
  topic?: string;
  points_lost?: number;
}

// 特殊專案
export interface SpecialProject {
  id: string;
  student_id: string;
  course_id?: string;
  project_type: 'english_cert' | 'competition' | 'research' | 'presentation';
  project_name: string;
  description?: string;
  start_date: string;
  target_date?: string;
  completion_date?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  milestones?: ProjectMilestone[];
  resources?: ProjectResource[];
  progress_percentage?: number;
  outcomes?: string;
  reflection?: string;
  mentor_notes?: string;
  attachments?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// 專案里程碑
export interface ProjectMilestone {
  title: string;
  target_date: string;
  completed: boolean;
  completed_date?: string;
  notes?: string;
}

// 專案資源
export interface ProjectResource {
  type: string;
  name: string;
  url?: string;
  description?: string;
}

// 作業提交
export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date?: string;
  submission_type?: string;
  content?: string;
  file_url?: string;
  score?: number;
  max_score?: number;
  feedback?: string;
  status?: 'submitted' | 'graded' | 'returned' | 'resubmit';
  graded_by?: string;
  graded_at?: string;
  is_late?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 學習進度統計
export interface LearningProgressStats {
  id: string;
  student_id: string;
  course_id: string;
  week_number: number;
  year: number;
  assignments_completed?: number;
  assignments_total?: number;
  vocabulary_words_learned?: number;
  vocabulary_accuracy?: number;
  quiz_average?: number;
  attendance_rate?: number;
  study_time_minutes?: number;
  parent_feedback?: string;
  teacher_notes?: string;
  generated_at?: string;
}

// 家長通知
export interface ParentNotification {
  id: string;
  student_id: string;
  notification_type: 'weekly_report' | 'assignment_reminder' | 'exam_result' | 'achievement';
  subject: string;
  content: string;
  data?: any;
  is_read?: boolean;
  read_at?: string;
  sent_via?: ('email' | 'sms' | 'in_app')[];
  scheduled_for?: string;
  sent_at?: string;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  created_at?: string;
}

// 學習摘要（用於圖表展示）
export interface LearningSummary {
  student_id: string;
  period: {
    start: string;
    end: string;
  };
  assignments: {
    completed: number;
    total: number;
    on_time: number;
    late: number;
  };
  vocabulary: {
    total_words: number;
    avg_accuracy: number;
    sessions_count: number;
  };
  exams: {
    count: number;
    avg_score: number;
    highest_score: number;
    lowest_score: number;
  };
  projects: {
    active: number;
    completed: number;
    total: number;
  };
  study_time: {
    total_minutes: number;
    daily_average: number;
  };
}

// API 回應類型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁參數
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

// 篩選參數
export interface FilterParams {
  student_id?: string;
  course_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  type?: string;
}