'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  BookOpen,
  Trophy,
  TrendingUp,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';
import { LearningReport } from '@/components/LearningReport';
import { Checkbox } from '@/components/ui/checkbox';
import AssignmentFormDialog from '@/components/assignments/AssignmentFormDialog';
import { ProjectAssignmentManager } from '@/components/admin/ProjectAssignmentManager';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  parent?: {
    name: string;
    email: string;
    phone: string;
    relationship: string;
  };
  report_settings?: {
    schedule_enabled: boolean;
    send_day: string;
    send_time: string;
    recipients: string[];
    timezone: string;
  };
  total_words: number;
  avg_accuracy: number;
  total_exams: number;
  avg_exam_score: number;
  assignments_completed: number;
  assignments_total: number;
  last_activity: string;
  status: 'active' | 'inactive';
}

export default function AdminLearningManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  // 新增記錄表單狀態
  const [newRecordForm, setNewRecordForm] = useState({
    studentId: '',
    recordType: '',
    data: {} as any
  });
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // 編輯學生狀態
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // 報告生成狀態
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportStudent, setReportStudent] = useState<Student | null>(null);

  // 報表預覽狀態
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // 寄送報告狀態
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [sendReportDialogOpen, setSendReportDialogOpen] = useState(false);
  const [sendTo, setSendTo] = useState<string[]>([]);
  const [reportType, setReportType] = useState('all');

  // 考試類型狀態
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [loadingExamTypes, setLoadingExamTypes] = useState(false);

  // 作業列表狀態
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // 專案作業管理狀態
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  // 載入數據
  useEffect(() => {
    loadStudentsData();
    loadExamTypes();
    loadAssignments();
  }, []);

  const loadStudentsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/students');
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);
      } else {
        console.error('載入學生資料失敗:', data.error);
        // 如果 API 失敗，顯示空列表而不是假資料
        setStudents([]);
      }
    } catch (error) {
      console.error('載入學生資料時發生錯誤:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExamTypes = async () => {
    setLoadingExamTypes(true);
    try {
      const response = await fetch('/api/admin/exam-types?active_only=true');
      const data = await response.json();

      if (data.success) {
        setExamTypes(data.data || []);
      } else {
        console.error('載入考試類型失敗:', data.error);
        setExamTypes([]);
      }
    } catch (error) {
      console.error('載入考試類型時發生錯誤:', error);
      setExamTypes([]);
    } finally {
      setLoadingExamTypes(false);
    }
  };

  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const response = await fetch('/api/assignments?is_published=true');
      const data = await response.json();

      if (data.success) {
        setAssignments(data.data || []);
      } else {
        console.error('載入作業列表失敗:', data.error);
        setAssignments([]);
      }
    } catch (error) {
      console.error('載入作業列表時發生錯誤:', error);
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // 篩選學生
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 根據學生ID獲取學生名字
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : studentId;
  };

  // 載入學生的課程
  const loadStudentCourses = async (studentId: string) => {
    if (!studentId) {
      setStudentCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      // 從 course_requests 表中獲取該學生已批准的課程
      const response = await fetch(`/api/course-requests?user_id=${studentId}&status=approved`);
      const data = await response.json();

      if (data.success) {
        // 提取課程資訊，去重
        const coursesMap = new Map();
        data.requests?.forEach((request: any) => {
          if (!coursesMap.has(request.course_id)) {
            coursesMap.set(request.course_id, {
              id: request.course_id,
              title: request.course_title
            });
          }
        });
        setStudentCourses(Array.from(coursesMap.values()));
      } else {
        console.error('載入學生課程失敗:', data.error);
        setStudentCourses([]);
      }
    } catch (error) {
      console.error('載入學生課程時發生錯誤:', error);
      setStudentCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // 處理新增記錄
  const handleAddRecord = async () => {
    if (!newRecordForm.studentId || !newRecordForm.recordType) {
      alert('請選擇學生和記錄類型');
      return;
    }

    setIsSubmittingRecord(true);
    let response;

    try {
      console.log('[DEBUG] 準備發送請求:', {
        student_id: newRecordForm.studentId,
        record_type: newRecordForm.recordType,
        data: newRecordForm.data
      });

      response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: newRecordForm.studentId,
          record_type: newRecordForm.recordType,
          data: newRecordForm.data
        }),
      });

      console.log('[DEBUG] API 回應狀態:', response.status);
      console.log('[DEBUG] API 回應標頭:', response.headers);

      // 檢查回應是否成功
      if (!response.ok) {
        console.error('[DEBUG] HTTP 錯誤:', response.status, response.statusText);

        // 嘗試讀取錯誤回應的原始文字
        const errorText = await response.text();
        console.error('[DEBUG] 錯誤回應內容:', errorText);

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 獲取回應文字並嘗試解析 JSON
      const responseText = await response.text();
      console.log('[DEBUG] 原始回應內容:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('[DEBUG] 解析後的 JSON:', result);
      } catch (jsonError) {
        console.error('[DEBUG] JSON 解析失敗:', jsonError);
        console.error('[DEBUG] 回應內容不是有效的 JSON:', responseText);
        throw new Error('伺服器回應格式錯誤，請檢查伺服器日誌');
      }

      if (result.success) {
        alert('記錄新增成功！');
        setIsAddingRecord(false);
        setNewRecordForm({ studentId: '', recordType: '', data: {} });
        loadStudentsData(); // 重新載入學生數據
      } else {
        console.error('[DEBUG] API 回傳失敗:', result);
        throw new Error(result.error || '新增記錄失敗');
      }
    } catch (error) {
      console.error('[DEBUG] 整體錯誤:', error);

      let errorMessage = error.message;

      // 提供更詳細的錯誤訊息
      if (error.message.includes('Failed to execute \'json\' on \'Response\'')) {
        errorMessage = '伺服器回應格式錯誤，可能是伺服器內部錯誤';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = '伺服器內部錯誤，請檢查伺服器日誌';
      }

      alert('新增記錄失敗: ' + errorMessage);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // 編輯學生
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditingStudent(true);
  };

  // 查看學生報告
  const handleViewReport = async (student: Student) => {
    setLoadingReport(true);
    setIsViewingReport(true);
    setReportStudent(student);

    try {
      const response = await fetch(`/api/admin/students/${student.id}/learning-data?range=${reportType}`);
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
      } else {
        throw new Error(result.error || '無法載入報告資料');
      }
    } catch (error: any) {
      alert('載入報告失敗: ' + error.message);
      setIsViewingReport(false);
    } finally {
      setLoadingReport(false);
    }
  };

  // 寄送報告
  const handleSendReport = async () => {
    if (!reportStudent || !reportData) {
      alert('請先載入報告資料');
      return;
    }

    if (sendTo.length === 0) {
      alert('請選擇至少一個收件人');
      return;
    }

    setIsSendingReport(true);

    try {
      const response = await fetch('/api/admin/send-report-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: reportStudent.id,
          recipients: sendTo,
          report_data: reportData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setSendReportDialogOpen(false);
        setSendTo([]);
      } else {
        throw new Error(result.error || '寄送失敗');
      }
    } catch (error: any) {
      alert('寄送報告失敗: ' + error.message);
    } finally {
      setIsSendingReport(false);
    }
  };

  // 處理新增/編輯專案作業
  const handleSubmitAssignment = async (formData: any) => {
    try {
      console.log('[handleSubmitAssignment] 準備提交的表單資料:', formData);

      const url = editingAssignment
        ? `/api/assignments/${editingAssignment.id}`
        : '/api/assignments';

      const method = editingAssignment ? 'PUT' : 'POST';

      console.log('[handleSubmitAssignment] 請求 URL:', url);
      console.log('[handleSubmitAssignment] 請求方法:', method);
      console.log('[handleSubmitAssignment] 請求 body:', JSON.stringify(formData, null, 2));

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('[handleSubmitAssignment] 回應狀態:', response.status);

      const result = await response.json();
      console.log('[handleSubmitAssignment] 回應內容:', result);

      if (result.success) {
        alert(editingAssignment ? '作業更新成功！' : '作業新增成功！');
        loadAssignments(); // 重新載入作業列表
        setShowAssignmentDialog(false);
        setEditingAssignment(null);
      } else {
        console.error('[handleSubmitAssignment] 操作失敗:', result);
        throw new Error(result.message || result.error || '操作失敗');
      }
    } catch (error: any) {
      console.error('[handleSubmitAssignment] 錯誤:', error);
      alert('操作失敗: ' + error.message);
      throw error;
    }
  };

  // 處理刪除作業
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('確定要刪除這個專案作業嗎？相關的提交記錄也會被刪除。')) {
      return;
    }

    setDeletingAssignmentId(assignmentId);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('作業刪除成功！');
        loadAssignments();
      } else {
        throw new Error(result.error || '刪除失敗');
      }
    } catch (error: any) {
      alert('刪除失敗: ' + error.message);
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  // 統計數據
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const avgCompletionRate = students.length > 0
    ? students.reduce((sum, s) => sum + (s.assignments_completed / s.assignments_total * 100), 0) / students.length
    : 0;
  const avgExamScore = students.length > 0
    ? students.reduce((sum, s) => sum + s.avg_exam_score, 0) / students.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">載入學習數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">學習管理後台</h1>
          <p className="text-muted-foreground mt-1">管理學生學習記錄與進度</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            匯出報告
          </Button>
          <Sheet open={isAddingRecord} onOpenChange={setIsAddingRecord}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新增記錄
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-2xl">
              <SheetHeader>
                <SheetTitle>新增學習記錄</SheetTitle>
                <SheetDescription>
                  為學生新增單字、考試或作業記錄
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <div>
                  <Label htmlFor="student-select">
                    選擇學生 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newRecordForm.studentId}
                    onValueChange={(value) => {
                      setNewRecordForm(prev => ({ ...prev, studentId: value, data: {} }));
                      loadStudentCourses(value);
                    }}
                  >
                    <SelectTrigger>
                      <div className="text-left">
                        {newRecordForm.studentId ? getStudentName(newRecordForm.studentId) : "選擇學生"}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="record-type">
                    記錄類型 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newRecordForm.recordType}
                    onValueChange={(value) => {
                      let defaultData = {};
                      const today = new Date().toISOString().split('T')[0];
                      if (value === 'exam') {
                        defaultData = {
                          exam_type: '小考',
                          max_score: 100,
                          exam_date: today
                        };
                      } else if (value === 'vocabulary') {
                        defaultData = {
                          session_date: today
                        };
                      } else if (value === 'task') {
                        defaultData = {
                          task_type: 'onetime',
                          priority: 'normal'
                        };
                      }
                      setNewRecordForm(prev => ({
                        ...prev,
                        recordType: value,
                        data: defaultData
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇記錄類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vocabulary">單字學習</SelectItem>
                      <SelectItem value="exam">考試成績</SelectItem>
                      <SelectItem value="task">學生任務</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 根據記錄類型顯示不同的輸入欄位 */}
                {newRecordForm.recordType === 'vocabulary' && (
                  <>
                    <div>
                      <Label>
                        選擇課程 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newRecordForm.data.course_id || ''}
                        onValueChange={(value) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, course_id: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCourses ? "載入課程中..." : "選擇課程"} />
                        </SelectTrigger>
                        <SelectContent>
                          {studentCourses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {studentCourses.length === 0 && newRecordForm.studentId && !loadingCourses && (
                        <p className="text-sm text-muted-foreground mt-1">
                          該學生尚未註冊任何課程
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>
                        學習日期 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={newRecordForm.data.session_date || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, session_date: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          起始號碼 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="例如: 1"
                          value={newRecordForm.data.start_number || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, start_number: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>
                          結束號碼 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="例如: 50"
                          value={newRecordForm.data.end_number || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, end_number: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    </div>
                    {newRecordForm.data.start_number && newRecordForm.data.end_number && (
                      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                        學習單字數: <span className="font-semibold">{newRecordForm.data.end_number - newRecordForm.data.start_number + 1}</span> 個
                      </div>
                    )}
                    <div>
                      <Label>正確率 (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="例如: 85.5"
                        value={newRecordForm.data.accuracy_rate || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, accuracy_rate: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>備註</Label>
                      <Textarea
                        placeholder="記錄學習狀況或特別注意事項..."
                        value={newRecordForm.data.notes || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, notes: e.target.value }
                        }))}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {newRecordForm.recordType === 'exam' && (
                  <>
                    <div>
                      <Label>選擇課程</Label>
                      <Select
                        value={newRecordForm.data.course_id || ''}
                        onValueChange={(value) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, course_id: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCourses ? "載入課程中..." : "選擇課程"} />
                        </SelectTrigger>
                        <SelectContent>
                          {studentCourses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {studentCourses.length === 0 && newRecordForm.studentId && !loadingCourses && (
                        <p className="text-sm text-muted-foreground mt-1">
                          該學生尚未註冊任何課程
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>
                        考試類型 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newRecordForm.data.exam_type || ''}
                        onValueChange={(value) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, exam_type: value }
                        }))}
                        disabled={loadingExamTypes}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingExamTypes ? "載入中..." : "選擇考試類型"} />
                        </SelectTrigger>
                        <SelectContent>
                          {examTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.icon && `${type.icon} `}{type.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {examTypes.length === 0 && !loadingExamTypes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          尚未設定考試類型,請先到<a href="/admin/exam-types" className="underline">考試類型管理</a>新增
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>
                        考試名稱 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={newRecordForm.data.exam_name || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, exam_name: e.target.value }
                        }))}
                        placeholder="例如: Unit 1-3 小考"
                      />
                    </div>
                    <div>
                      <Label>
                        考試日期 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={newRecordForm.data.exam_date || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, exam_date: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>科目</Label>
                      <Select
                        value={newRecordForm.data.subject || 'general'}
                        onValueChange={(value) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, subject: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">一般</SelectItem>
                          <SelectItem value="english">英文</SelectItem>
                          <SelectItem value="math">數學</SelectItem>
                          <SelectItem value="science">自然</SelectItem>
                          <SelectItem value="social">社會</SelectItem>
                          <SelectItem value="chinese">國文</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          得分 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="例如: 85"
                          value={newRecordForm.data.total_score || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, total_score: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>滿分</Label>
                        <Input
                          type="number"
                          value={newRecordForm.data.max_score || 100}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, max_score: parseFloat(e.target.value) || 100 }
                          }))}
                        />
                      </div>
                    </div>
                    {newRecordForm.data.total_score && newRecordForm.data.max_score && (
                      <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded-md">
                        百分比: <span className="font-semibold">{((newRecordForm.data.total_score / newRecordForm.data.max_score) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    <div>
                      <Label>老師評語</Label>
                      <Textarea
                        placeholder="記錄學生表現、需要加強的部分等..."
                        value={newRecordForm.data.teacher_feedback || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, teacher_feedback: e.target.value }
                        }))}
                        rows={4}
                      />
                    </div>
                  </>
                )}

                {newRecordForm.recordType === 'task' && (
                  <>
                    <div>
                      <Label>
                        任務類型 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newRecordForm.data.task_type || 'onetime'}
                        onValueChange={(value) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, task_type: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onetime">一次性任務(有截止日期)</SelectItem>
                          <SelectItem value="daily">每日任務(持續追蹤)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>
                        任務內容 <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={newRecordForm.data.task_description || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, task_description: e.target.value }
                        }))}
                        placeholder="例如: 完成 Unit 5 閱讀理解習題 / 每天背10個單字..."
                        rows={3}
                      />
                    </div>
                    {newRecordForm.data.task_type === 'onetime' && (
                      <div>
                        <Label>
                          截止日期 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={newRecordForm.data.due_date || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, due_date: e.target.value }
                          }))}
                        />
                      </div>
                    )}
                    {newRecordForm.data.task_type === 'daily' && (
                      <div>
                        <Label>執行天數</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="例如: 7 (代表連續7天)"
                          value={newRecordForm.data.daily_total_days || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, daily_total_days: parseInt(e.target.value) || 0 }
                          }))}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          設定後會追蹤學生連續完成的天數
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>任務分類</Label>
                        <Select
                          value={newRecordForm.data.category || ''}
                          onValueChange={(value) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, category: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇分類" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reading">閱讀</SelectItem>
                            <SelectItem value="writing">寫作</SelectItem>
                            <SelectItem value="vocabulary">背單字</SelectItem>
                            <SelectItem value="listening">聽力</SelectItem>
                            <SelectItem value="speaking">口說</SelectItem>
                            <SelectItem value="homework">作業</SelectItem>
                            <SelectItem value="other">其他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>優先級</Label>
                        <Select
                          value={newRecordForm.data.priority || 'normal'}
                          onValueChange={(value) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, priority: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="normal">普通</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="urgent">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>預估時間(分鐘)</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="例如: 30"
                        value={newRecordForm.data.estimated_duration || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, estimated_duration: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  </>
                )}
              </div>
              <SheetFooter className="sticky bottom-0 bg-background pt-6 pb-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingRecord(false);
                    setNewRecordForm({ studentId: '', recordType: '', data: {} });
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={handleAddRecord}
                  disabled={isSubmittingRecord || !newRecordForm.studentId || !newRecordForm.recordType}
                >
                  {isSubmittingRecord ? '新增中...' : '確認新增'}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總學生數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              活躍學生: {activeStudents}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">作業完成率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均考試分數</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgExamScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">總平均分數</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總學習單字</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce((sum, s) => sum + s.total_words, 0)}
            </div>
            <p className="text-xs text-muted-foreground">累積單字數</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容區 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">學生總覽</TabsTrigger>
          <TabsTrigger value="records">學習記錄</TabsTrigger>
          <TabsTrigger value="projects">專案作業</TabsTrigger>
          <TabsTrigger value="reports">進度報告</TabsTrigger>
          <TabsTrigger value="settings">系統設定</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 搜尋框 */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋學生姓名或電子郵件"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* 學生列表 */}
          <Card>
            <CardHeader>
              <CardTitle>學生學習概況</CardTitle>
              <CardDescription>查看所有學生的學習進度和表現</CardDescription>
            </CardHeader>
            <CardContent>
{filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm ? '找不到符合條件的學生' : '目前沒有學生資料'}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-muted-foreground mt-1">
                      學生需要先註冊帳號或有學習記錄才會顯示在這裡
                    </p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>學生</TableHead>
                      <TableHead>單字學習</TableHead>
                      <TableHead>作業完成</TableHead>
                      <TableHead>考試表現</TableHead>
                      <TableHead>最後活動</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.total_words} 個</div>
                            <div className="text-sm text-muted-foreground">
                              正確率: {student.avg_accuracy}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student.assignments_completed}/{student.assignments_total}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.assignments_total > 0
                                ? Math.round((student.assignments_completed / student.assignments_total) * 100)
                                : 0}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.avg_exam_score || 0} 分</div>
                            <div className="text-sm text-muted-foreground">
                              {student.total_exams} 次考試
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.last_activity}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? '活躍' : '非活躍'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(student)}
                              title="查看報告"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                              title="編輯學生資料"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReportStudent(student);
                                setSendReportDialogOpen(true);
                              }}
                              title="寄送報告"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          {/* 學習記錄頁籤 - 專案作業管理已移至「專案作業」頁籤 */}
          <Card>
            <CardHeader>
              <CardTitle>學習記錄</CardTitle>
              <CardDescription>查看學生的學習記錄與進度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">學習記錄功能</p>
                <p className="text-muted-foreground mb-4">
                  此區域可用於顯示學生的詳細學習記錄、出席狀況、作業提交歷史等資訊。
                </p>
                <p className="text-sm text-blue-600">
                  💡 提示：專案作業管理功能已移至「專案作業」頁籤
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 專案作業管理頁籤 */}
        <TabsContent value="projects">
          <ProjectAssignmentManager />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>進度報告</CardTitle>
              <CardDescription>生成和管理學生學習報告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">報告功能開發中</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>系統設定</CardTitle>
              <CardDescription>配置學習管理系統設定</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    系統設定功能包括：每日作業類型管理、自動報告設定、通知設定等。
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 學生詳情對話框 */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedStudent.name} 的學習詳情</DialogTitle>
              <DialogDescription>查看詳細的學習數據和進度</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>學習統計</Label>
                  <div className="space-y-1 text-sm">
                    <p>總學習單字：{selectedStudent.total_words} 個</p>
                    <p>平均正確率：{selectedStudent.avg_accuracy}%</p>
                    <p>考試平均分：{selectedStudent.avg_exam_score} 分</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>作業進度</Label>
                  <div className="space-y-1 text-sm">
                    <p>已完成：{selectedStudent.assignments_completed} 項</p>
                    <p>總計：{selectedStudent.assignments_total} 項</p>
                    <p>完成率：{Math.round((selectedStudent.assignments_completed / selectedStudent.assignments_total) * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                關閉
              </Button>
              <Button>生成報告</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 編輯學生對話框 */}
      {editingStudent && (
        <Dialog open={isEditingStudent} onOpenChange={setIsEditingStudent}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>編輯學生資訊</DialogTitle>
              <DialogDescription>編輯 {editingStudent.name} 的基本資訊及家長聯絡資料</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* 學生基本資訊 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">學生基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>學生姓名</Label>
                    <Input
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent(prev => prev ? {...prev, name: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <Label>學生狀態</Label>
                    <Select
                      value={editingStudent.status}
                      onValueChange={(value: 'active' | 'inactive') =>
                        setEditingStudent(prev => prev ? {...prev, status: value} : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">活躍</SelectItem>
                        <SelectItem value="inactive">非活躍</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>學生 Email</Label>
                  <Input
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent(prev => prev ? {...prev, email: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label>學生電話（選填）</Label>
                  <Input
                    type="tel"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent(prev => prev ? {...prev, phone: e.target.value} : null)}
                    placeholder="例如：0912345678"
                  />
                </div>
              </div>

              {/* 家長聯絡資訊 */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700">家長聯絡資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>家長姓名</Label>
                    <Input
                      value={editingStudent.parent?.name || ''}
                      onChange={(e) => setEditingStudent(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          parent: {
                            name: e.target.value,
                            email: prev.parent?.email || '',
                            phone: prev.parent?.phone || '',
                            relationship: prev.parent?.relationship || '父親'
                          }
                        };
                      })}
                      placeholder="例如：許爸爸"
                    />
                  </div>
                  <div>
                    <Label>關係</Label>
                    <Select
                      value={editingStudent.parent?.relationship || '父親'}
                      onValueChange={(value) => setEditingStudent(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          parent: {
                            name: prev.parent?.name || '',
                            email: prev.parent?.email || '',
                            phone: prev.parent?.phone || '',
                            relationship: value
                          }
                        };
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="父親">父親</SelectItem>
                        <SelectItem value="母親">母親</SelectItem>
                        <SelectItem value="監護人">監護人</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>家長 Email</Label>
                  <Input
                    type="email"
                    value={editingStudent.parent?.email || ''}
                    onChange={(e) => setEditingStudent(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        parent: {
                          name: prev.parent?.name || '',
                          email: e.target.value,
                          phone: prev.parent?.phone || '',
                          relationship: prev.parent?.relationship || '父親'
                        }
                      };
                    })}
                    placeholder="例如：parent@example.com"
                  />
                </div>
                <div>
                  <Label>家長電話</Label>
                  <Input
                    type="tel"
                    value={editingStudent.parent?.phone || ''}
                    onChange={(e) => setEditingStudent(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        parent: {
                          name: prev.parent?.name || '',
                          email: prev.parent?.email || '',
                          phone: e.target.value,
                          relationship: prev.parent?.relationship || '父親'
                        }
                      };
                    })}
                    placeholder="例如：0987654321"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingStudent(false);
                  setEditingStudent(null);
                }}
              >
                取消
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // 呼叫 API 更新學生資訊
                    const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: editingStudent.name,
                        email: editingStudent.email,
                        phone: editingStudent.phone,
                        parent: editingStudent.parent,
                        status: editingStudent.status
                      }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      alert(`學生 ${editingStudent.name} 的資訊已保存`);
                      setIsEditingStudent(false);
                      setEditingStudent(null);
                      loadStudentsData(); // 重新載入資料
                    } else {
                      throw new Error(result.error || '更新失敗');
                    }
                  } catch (error: any) {
                    alert('保存失敗: ' + error.message);
                  }
                }}
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 報表預覽對話框 */}
      <Dialog open={isViewingReport} onOpenChange={setIsViewingReport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>學習報告 - {reportStudent?.name}</DialogTitle>
            <DialogDescription>
              可在此預覽報告內容，或點擊寄送按鈕發送給家長
            </DialogDescription>
          </DialogHeader>

          {/* 時間範圍選擇器 */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">時間範圍：</Label>
            <Select
              value={reportType}
              onValueChange={async (value) => {
                setReportType(value);
                // 重新載入報告資料
                if (reportStudent) {
                  setLoadingReport(true);
                  try {
                    const response = await fetch(`/api/admin/students/${reportStudent.id}/learning-data?range=${value}`);
                    const result = await response.json();
                    if (result.success) {
                      setReportData(result.data);
                    }
                  } catch (error: any) {
                    alert('載入報告失敗: ' + error.message);
                  } finally {
                    setLoadingReport(false);
                  }
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">本週報告</SelectItem>
                <SelectItem value="monthly">本月報告</SelectItem>
                <SelectItem value="quarterly">本季報告</SelectItem>
                <SelectItem value="yearly">本年報告</SelectItem>
                <SelectItem value="all">全部資料</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingReport ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">載入報告中...</span>
            </div>
          ) : reportData ? (
            <LearningReport data={reportData} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              無法載入報告資料
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewingReport(false);
                setReportData(null);
              }}
            >
              關閉
            </Button>
            <Button
              onClick={() => {
                setIsViewingReport(false);
                setSendReportDialogOpen(true);
              }}
              disabled={!reportData}
            >
              <Mail className="h-4 w-4 mr-2" />
              寄送報告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 寄送報告對話框 */}
      <Dialog open={sendReportDialogOpen} onOpenChange={setSendReportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>寄送學習報告</DialogTitle>
            <DialogDescription>
              選擇收件人並寄送 {reportStudent?.name} 的學習報告
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 報告類型選擇 */}
            <div>
              <Label>報告類型</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">本週報告</SelectItem>
                  <SelectItem value="monthly">本月報告</SelectItem>
                  <SelectItem value="quarterly">本季報告</SelectItem>
                  <SelectItem value="yearly">本年報告</SelectItem>
                  <SelectItem value="all">全部資料</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 收件人選擇 */}
            <div>
              <Label>收件人</Label>
              <div className="space-y-2 mt-2">
                {reportStudent?.parent?.email && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-to-parent"
                      checked={sendTo.includes('parent')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSendTo([...sendTo, 'parent']);
                        } else {
                          setSendTo(sendTo.filter(r => r !== 'parent'));
                        }
                      }}
                    />
                    <label htmlFor="send-to-parent" className="text-sm cursor-pointer">
                      寄給家長 ({reportStudent.parent.email})
                    </label>
                  </div>
                )}

                {reportStudent?.email && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-to-student"
                      checked={sendTo.includes('student')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSendTo([...sendTo, 'student']);
                        } else {
                          setSendTo(sendTo.filter(r => r !== 'student'));
                        }
                      }}
                    />
                    <label htmlFor="send-to-student" className="text-sm cursor-pointer">
                      寄給學生 ({reportStudent.email})
                    </label>
                  </div>
                )}

                {(!reportStudent?.parent?.email && !reportStudent?.email) && (
                  <p className="text-sm text-muted-foreground">
                    尚未設定家長或學生的 Email
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSendReportDialogOpen(false);
                setSendTo([]);
              }}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                // 先載入報告資料（如果還沒載入）
                if (!reportData && reportStudent) {
                  setLoadingReport(true);
                  try {
                    const response = await fetch(`/api/admin/students/${reportStudent.id}/learning-data?range=${reportType}`);
                    const result = await response.json();
                    if (result.success) {
                      setReportData(result.data);
                      await handleSendReport();
                    } else {
                      throw new Error(result.error);
                    }
                  } catch (error: any) {
                    alert('載入報告失敗: ' + error.message);
                  } finally {
                    setLoadingReport(false);
                  }
                } else {
                  await handleSendReport();
                }
              }}
              disabled={isSendingReport || sendTo.length === 0}
            >
              {isSendingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  寄送中...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  立即寄送
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 專案作業表單對話框 */}
      <AssignmentFormDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        onSubmit={handleSubmitAssignment}
        students={students.map(s => ({
          id: s.id,
          name: s.name,
          courseId: '', // TODO: 從學生資料中取得課程ID
          courseName: '' // TODO: 從學生資料中取得課程名稱
        }))}
        editData={editingAssignment ? {
          title: editingAssignment.title,
          description: editingAssignment.description,
          instructions: editingAssignment.instructions,
          courseId: editingAssignment.courseId,
          studentIds: editingAssignment.studentIds || [],
          dueDate: editingAssignment.dueDate,
          assignmentType: editingAssignment.category,
          priority: editingAssignment.priority,
          submissionType: editingAssignment.submissionType,
          maxScore: editingAssignment.maxScore,
          estimatedDuration: editingAssignment.estimatedDuration,
          isRequired: editingAssignment.isRequired,
          tags: editingAssignment.tags || [],
          resources: editingAssignment.resources || []
        } : undefined}
        loading={false}
      />
    </div>
  );
}