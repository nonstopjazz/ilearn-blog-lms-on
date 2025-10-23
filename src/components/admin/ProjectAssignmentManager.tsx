'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Download
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

  // 編輯狀態
  const [editingAssignment, setEditingAssignment] = useState<ProjectAssignment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editScore, setEditScore] = useState<number | null>(null);
  const [editFeedback, setEditFeedback] = useState('');

  // 派發模板狀態
  const [distributeDialogOpen, setDistributeDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');

  // 批次上傳狀態
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchData, setBatchData] = useState('');

  useEffect(() => {
    loadAssignments();
    loadTemplates();
    loadStudents();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/project-assignments');
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
      const response = await fetch('/api/admin/project-templates');
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
      const response = await fetch('/api/admin/students');
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
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAssignment) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/project-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: editingAssignment.submissionId,
          status: editStatus,
          score: editScore,
          feedback: editFeedback
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
      const response = await fetch('/api/admin/project-templates/distribute', {
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
      const assignments = JSON.parse(batchData);

      const response = await fetch('/api/admin/project-assignments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      const result = await response.json();

      if (result.success) {
        alert(`批次處理完成：成功 ${result.data.successCount} 項，失敗 ${result.data.errorCount} 項`);
        await loadAssignments();
        setBatchDialogOpen(false);
        setBatchData('');
      }
    } catch (error) {
      console.error('批次上傳失敗:', error);
      alert('批次上傳失敗，請檢查資料格式');
    } finally {
      setLoading(false);
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
                  <TableCell colSpan={7} className="text-center">載入中...</TableCell>
                </TableRow>
              ) : filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">暫無資料</TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => (
                  <TableRow key={`${assignment.assignmentId}-${assignment.studentId}`}>
                    <TableCell className="font-medium">{assignment.assignmentTitle}</TableCell>
                    <TableCell>{assignment.studentName}</TableCell>
                    <TableCell>{getStatusBadge(assignment.submissionStatus)}</TableCell>
                    <TableCell>{assignment.progress}%</TableCell>
                    <TableCell>
                      {assignment.score !== null ? `${assignment.score}/${assignment.maxScore}` : '-'}
                    </TableCell>
                    <TableCell>{new Date(assignment.dueDate).toLocaleDateString('zh-TW')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
                  <SelectItem value="not_started">未開始</SelectItem>
                  <SelectItem value="in_progress">進行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="graded">已評分</SelectItem>
                </SelectContent>
              </Select>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>批次上傳專案作業</DialogTitle>
            <DialogDescription>
              請輸入 JSON 格式的作業資料
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={batchData}
              onChange={(e) => setBatchData(e.target.value)}
              placeholder={`[\n  {\n    "title": "作業名稱",\n    "description": "作業描述",\n    "studentIds": ["學生UUID"],\n    "dueDate": "2025-12-31",\n    "isPublished": false\n  }\n]`}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchUpload} disabled={loading}>
              上傳
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
