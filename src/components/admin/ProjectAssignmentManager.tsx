'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { authFetch } from '@/lib/auth-fetch';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Plus,
  Download,
  Trash2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectAssignment {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  dueDate: string;
  maxScore: number;
  priority: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionId: string;
  submissionStatus: string;
  submissionDate: string | null;
  score: number | null;
  progress: number;
  feedback: string | null;
}

export function ProjectAssignmentManager() {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 批次選擇和刪除
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  // 編輯狀態
  const [editingAssignment, setEditingAssignment] = useState<ProjectAssignment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editScore, setEditScore] = useState<number | null>(null);
  const [editFeedback, setEditFeedback] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editProgress, setEditProgress] = useState<number>(0);

  // 派發模板狀態
  const [distributeDialogOpen, setDistributeDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');

  // 批次上傳狀態
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchData, setBatchData] = useState('');
  const [showImmediately, setShowImmediately] = useState(true); // 是否立即顯示給學生

  useEffect(() => {
    loadAssignments();
    loadTemplates();
    loadStudents();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/project-assignments');
      const result = await response.json();

      if (result.success) {
        setAssignments(result.data);
      }
    } catch (error) {
      console.error('載入專案作業失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await authFetch('/api/admin/project-templates');
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('載入模板失敗:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await authFetch('/api/admin/students');
      const result = await response.json();

      if (result.success) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('載入學生列表失敗:', error);
    }
  };

  const handleEditAssignment = (assignment: ProjectAssignment) => {
    setEditingAssignment(assignment);
    setEditStatus(assignment.submissionStatus);
    setEditScore(assignment.score);
    setEditFeedback(assignment.feedback || '');
    // 新增：初始化日期和進度
    setEditStartDate(assignment.assignmentTitle ? new Date().toISOString().split('T')[0] : ''); // 暫時用今天
    setEditDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '');
    setEditProgress(assignment.progress || 0);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAssignment) return;

    setLoading(true);
    try {
      const response = await authFetch('/api/admin/project-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: editingAssignment.submissionId,
          assignmentId: editingAssignment.assignmentId,
          status: editStatus,
          score: editScore,
          feedback: editFeedback,
          progress: editProgress,
          startDate: editStartDate,
          dueDate: editDueDate
        })
      });

      const result = await response.json();

      if (result.success) {
        await loadAssignments();
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('更新失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeTemplate = async () => {
    if (!selectedTemplate || selectedStudents.length === 0) {
      alert('請選擇模板和至少一位學生');
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch('/api/admin/project-templates/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          studentIds: selectedStudents,
          startDate: startDate || new Date().toISOString()
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`成功為 ${result.data.length} 位學生派發專案作業`);
        await loadAssignments();
        setDistributeDialogOpen(false);
        setSelectedTemplate('');
        setSelectedStudents([]);
        setStartDate('');
      }
    } catch (error) {
      console.error('派發失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (!batchData.trim()) {
      alert('請輸入批次資料');
      return;
    }

    setLoading(true);
    try {
      let assignments = JSON.parse(batchData);

      // 如果選擇立即顯示，自動設定 initialStatus 為 in_progress
      if (showImmediately) {
        assignments = assignments.map((a: any) => ({
          ...a,
          initialStatus: 'in_progress',
          isPublished: true
        }));
      }

      console.log('[批次上傳] 準備上傳:', assignments);

      const response = await authFetch('/api/admin/project-assignments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      const result = await response.json();
      console.log('[批次上傳] API 回應:', result);

      if (result.success || result.data) {
        const successCount = result.data?.successCount || 0;
        const errorCount = result.data?.errorCount || 0;
        const errors = result.data?.errors || [];

        let message = `批次處理完成！\n\n✅ 成功：${successCount} 項\n❌ 失敗：${errorCount} 項`;

        if (errors.length > 0) {
          message += '\n\n失敗原因：\n';
          errors.forEach((err: any, idx: number) => {
            message += `\n${idx + 1}. ${err.assignment?.title || '未知作業'}: ${err.error}`;
          });
        }

        if (successCount > 0) {
          if (showImmediately) {
            message += '\n\n✅ 作業已設定為「進行中」，學生可以立即在前台看到！';
          } else {
            message += '\n\n⚠️ 重要提醒：\n批次上傳的作業狀態為「未開始」。\n請在下方列表中找到作業，將狀態改為「進行中」，學生才能看到！';
          }
        }

        alert(message);

        if (successCount > 0) {
          await loadAssignments();
        }

        if (errorCount === 0) {
          setBatchDialogOpen(false);
          setBatchData('');
        }
      } else {
        alert(`批次上傳失敗：${result.message || result.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('批次上傳失敗:', error);
      if (error instanceof SyntaxError) {
        alert('JSON 格式錯誤，請檢查格式是否正確！\n\n常見錯誤：\n- 缺少逗號\n- 使用單引號而非雙引號\n- 少了方括號 [ ]');
      } else {
        alert(`批次上傳失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 處理單筆刪除
  const handleDeleteSingle = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setDeleteDialogOpen(true);
  };

  // 處理批次刪除
  const handleDeleteBatch = () => {
    if (selectedAssignments.size === 0) {
      alert('請先選擇要刪除的作業');
      return;
    }
    setAssignmentToDelete(null);
    setDeleteDialogOpen(true);
  };

  // 確認刪除
  const confirmDelete = async () => {
    setLoading(true);
    try {
      // 獲取要刪除的作業 ID 列表（去重）
      let assignmentIds: string[];

      if (assignmentToDelete) {
        // 單筆刪除
        assignmentIds = [assignmentToDelete];
      } else {
        // 批次刪除 - 從選中的項目中提取唯一的 assignmentId
        assignmentIds = Array.from(
          new Set(
            Array.from(selectedAssignments).map(key => {
              const assignment = assignments.find(a => `${a.assignmentId}-${a.studentId}` === key);
              return assignment?.assignmentId;
            }).filter(Boolean) as string[]
          )
        );
      }

      console.log('[刪除] 準備刪除作業 IDs:', assignmentIds);

      const response = await authFetch('/api/admin/project-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentIds })
      });

      const result = await response.json();

      if (result.success) {
        alert(`成功刪除 ${result.data.deletedCount} 筆作業`);
        await loadAssignments();
        setSelectedAssignments(new Set());
        setDeleteDialogOpen(false);
        setAssignmentToDelete(null);
      } else {
        alert(`刪除失敗：${result.message || result.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('刪除作業失敗:', error);
      alert(`刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  // 切換單個選擇
  const toggleSelectAssignment = (key: string) => {
    const newSelected = new Set(selectedAssignments);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedAssignments(newSelected);
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedAssignments.size === filteredAssignments.length) {
      setSelectedAssignments(new Set());
    } else {
      setSelectedAssignments(
        new Set(filteredAssignments.map(a => `${a.assignmentId}-${a.studentId}`))
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; icon: any }> = {
      'not_started': { variant: 'secondary', label: '未開始', icon: AlertCircle },
      'in_progress': { variant: 'default', label: '進行中', icon: Clock },
      'completed': { variant: 'default', label: '已完成', icon: CheckCircle2 },
      'graded': { variant: 'default', label: '已評分', icon: CheckCircle2 }
    };

    const config = statusMap[status] || statusMap['not_started'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch =
      a.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.submissionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    inProgress: assignments.filter(a => a.submissionStatus === 'in_progress').length,
    completed: assignments.filter(a => a.submissionStatus === 'completed' || a.submissionStatus === 'graded').length,
    notStarted: assignments.filter(a => a.submissionStatus === 'not_started').length
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">總專案數</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">進行中</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">未開始</p>
                <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
          <Button onClick={() => setDistributeDialogOpen(true)}>
            <Users className="w-4 h-4 mr-2" />
            派發模板
          </Button>
          <Button variant="outline" onClick={() => setBatchDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            批次上傳
          </Button>
          <Button variant="outline" onClick={loadAssignments}>
            <Download className="w-4 h-4 mr-2" />
            重新載入
          </Button>
        </div>
        {selectedAssignments.size > 0 && (
          <Button
            variant="destructive"
            onClick={handleDeleteBatch}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            批次刪除 ({selectedAssignments.size})
          </Button>
        )}
      </div>

      {/* 搜尋和篩選 */}
      <div className="flex gap-4">
        <Input
          placeholder="搜尋作業或學生..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="篩選狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="not_started">未開始</SelectItem>
            <SelectItem value="in_progress">進行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="graded">已評分</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 作業列表 */}
      <Card>
        <CardHeader>
          <CardTitle>專案作業列表</CardTitle>
          <CardDescription>管理所有學生的專案作業進度</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={filteredAssignments.length > 0 && selectedAssignments.size === filteredAssignments.length}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead>作業名稱</TableHead>
                <TableHead>學生</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>進度</TableHead>
                <TableHead>分數</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">載入中...</TableCell>
                </TableRow>
              ) : filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">暫無資料</TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => {
                  const rowKey = `${assignment.assignmentId}-${assignment.studentId}`;
                  return (
                    <TableRow key={rowKey}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedAssignments.has(rowKey)}
                          onChange={() => toggleSelectAssignment(rowKey)}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{assignment.assignmentTitle}</TableCell>
                      <TableCell>{assignment.studentName}</TableCell>
                      <TableCell>{getStatusBadge(assignment.submissionStatus)}</TableCell>
                      <TableCell>{assignment.progress}%</TableCell>
                      <TableCell>
                        {assignment.score !== null ? `${assignment.score}/${assignment.maxScore}` : '-'}
                      </TableCell>
                      <TableCell>{new Date(assignment.dueDate).toLocaleDateString('zh-TW')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSingle(assignment.assignmentId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯專案作業狀態</DialogTitle>
            <DialogDescription>
              {editingAssignment?.assignmentTitle} - {editingAssignment?.studentName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>狀態</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">未開始（不顯示條狀物）</SelectItem>
                  <SelectItem value="in_progress">進行中（橘色）</SelectItem>
                  <SelectItem value="completed">已完成（綠色）</SelectItem>
                  <SelectItem value="graded">已評分（綠色）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>開始日期</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>截止日期</Label>
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>完成進度：{editProgress}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={editProgress}
                onChange={(e) => setEditProgress(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <Label>分數</Label>
              <Input
                type="number"
                value={editScore || ''}
                onChange={(e) => setEditScore(e.target.value ? Number(e.target.value) : null)}
                placeholder="輸入分數"
              />
            </div>

            <div>
              <Label>回饋</Label>
              <Textarea
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
                placeholder="輸入回饋..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 派發模板對話框 */}
      <Dialog open={distributeDialogOpen} onOpenChange={setDistributeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>派發專案作業模板</DialogTitle>
            <DialogDescription>
              選擇模板和學生，系統將自動建立專案作業
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>選擇模板</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇模板" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name} ({template.target_audience})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>開始日期（可選）</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>選擇學生</Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                {students.map(student => (
                  <label key={student.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <span>{student.name} ({student.email})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDistributeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDistributeTemplate} disabled={loading}>
              派發
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批次上傳對話框 */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批次上傳專案作業</DialogTitle>
            <DialogDescription>
              支援使用<strong>學生姓名</strong>、Email 或 UUID 來指定學生
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 立即顯示選項 */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showImmediately"
                  checked={showImmediately}
                  onChange={(e) => setShowImmediately(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="showImmediately" className="font-semibold text-green-900 cursor-pointer">
                    ✅ 上傳後立即顯示給學生（推薦）
                  </label>
                  <p className="text-sm text-green-700 mt-1">
                    勾選後，學生可以立即在前台看到作業。<br/>
                    取消勾選則需要手動編輯狀態才能顯示。
                  </p>
                </div>
              </div>
            </div>

            {/* 使用說明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2 text-sm">
              <h4 className="font-semibold text-blue-900">📝 三種指定學生的方式：</h4>
              <div className="space-y-1 text-blue-800">
                <p><strong>方式 1 - 使用姓名（推薦）：</strong> <code className="bg-blue-100 px-1 rounded">"studentNames": ["王小明", "李小華"]</code></p>
                <p><strong>方式 2 - 使用 Email：</strong> <code className="bg-blue-100 px-1 rounded">"studentEmails": ["a@example.com"]</code></p>
                <p><strong>方式 3 - 使用 UUID：</strong> <code className="bg-blue-100 px-1 rounded">"studentIds": ["uuid-1"]</code></p>
              </div>
              <p className="text-blue-700 text-xs mt-2">💡 詳細範例請參考：docs/BATCH_UPLOAD_EXAMPLES.md</p>
            </div>

            {/* JSON 輸入框 */}
            <div>
              <Label>JSON 資料</Label>
              <Textarea
                value={batchData}
                onChange={(e) => setBatchData(e.target.value)}
                placeholder={`[\n  {\n    "title": "第一週英文閱讀",\n    "description": "閱讀 Chapter 1 並完成練習題",\n    "studentNames": ["王小明", "李小華", "張小美"],\n    "dueDate": "2025-12-31",\n    "isPublished": false,\n    "maxScore": 100,\n    "priority": "normal"\n  },\n  {\n    "title": "第二週英文閱讀",\n    "description": "閱讀 Chapter 2 並完成練習題",\n    "studentNames": ["王小明", "李小華"],\n    "dueDate": "2026-01-07",\n    "isPublished": false,\n    "maxScore": 100\n  }\n]`}
                rows={18}
                className="font-mono text-sm"
              />
            </div>

            {/* 快速範例 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBatchData(`[\n  {\n    "title": "測試作業 - 閱讀練習",\n    "description": "這是一個測試作業",\n    "studentNames": ["王小明"],\n    "dueDate": "2025-12-31",\n    "isPublished": false,\n    "maxScore": 100,\n    "priority": "normal"\n  }\n]`)}
              >
                載入範例
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBatchData('')}
              >
                清空
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchUpload} disabled={loading}>
              {loading ? '上傳中...' : '開始上傳'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              {assignmentToDelete
                ? '確定要刪除此作業嗎？此操作將同時刪除所有學生的相關提交記錄。'
                : `確定要刪除選中的 ${selectedAssignments.size} 個項目嗎？這將刪除相關的作業及所有學生的提交記錄。`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 警告：</strong>此操作無法復原！
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              {assignmentToDelete
                ? '刪除後，該作業及所有學生的提交記錄將永久移除。'
                : `刪除後，${Array.from(new Set(Array.from(selectedAssignments).map(key => {
                    const assignment = assignments.find(a => `${a.assignmentId}-${a.studentId}` === key);
                    return assignment?.assignmentId;
                  }).filter(Boolean))).length} 個作業及相關的所有提交記錄將永久移除。`
              }
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAssignmentToDelete(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
