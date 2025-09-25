'use client';

import { useState, useEffect } from 'react';
import AuthMiddleware from '@/lib/auth-middleware';
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
  FileText
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
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

  // 模擬數據載入
  useEffect(() => {
    loadStudentsData();
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

  // 篩選學生
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理新增記錄
  const handleAddRecord = async () => {
    if (!newRecordForm.studentId || !newRecordForm.recordType) {
      alert('請選擇學生和記錄類型');
      return;
    }

    setIsSubmittingRecord(true);
    try {
      const response = await fetch('/api/admin/students', {
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

      const result = await response.json();

      if (result.success) {
        alert('記錄新增成功！');
        setIsAddingRecord(false);
        setNewRecordForm({ studentId: '', recordType: '', data: {} });
        loadStudentsData(); // 重新載入學生數據
      } else {
        throw new Error(result.error || '新增記錄失敗');
      }
    } catch (error) {
      console.error('新增記錄失敗:', error);
      alert('新增記錄失敗: ' + error.message);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // 編輯學生
  const handleEditStudent = (student: Student) => {
    // 這裡可以開啟編輯對話框，暫時先顯示提醒
    alert(`編輯學生 ${student.name} 的功能開發中`);
  };

  // 生成學生報告
  const handleGenerateReport = (student: Student) => {
    // 這裡可以生成報告，暫時先顯示提醒
    alert(`正在為 ${student.name} 生成學習報告...`);
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
    <AuthMiddleware requireAdmin={true}>
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
          <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新增記錄
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增學習記錄</DialogTitle>
                <DialogDescription>
                  為學生新增單字、考試或作業記錄
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student-select">選擇學生</Label>
                  <Select
                    value={newRecordForm.studentId}
                    onValueChange={(value) => setNewRecordForm(prev => ({ ...prev, studentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇學生" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="record-type">記錄類型</Label>
                  <Select
                    value={newRecordForm.recordType}
                    onValueChange={(value) => setNewRecordForm(prev => ({ ...prev, recordType: value, data: {} }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇記錄類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vocabulary">單字學習</SelectItem>
                      <SelectItem value="exam">考試成績</SelectItem>
                      <SelectItem value="assignment">作業提交</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 根據記錄類型顯示不同的輸入欄位 */}
                {newRecordForm.recordType === 'vocabulary' && (
                  <>
                    <div>
                      <Label>課程 ID</Label>
                      <Input
                        value={newRecordForm.data.course_id || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, course_id: e.target.value }
                        }))}
                        placeholder="輸入課程 ID"
                      />
                    </div>
                    <div>
                      <Label>學習日期</Label>
                      <Input
                        type="date"
                        value={newRecordForm.data.session_date || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, session_date: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>起始號碼</Label>
                        <Input
                          type="number"
                          value={newRecordForm.data.start_number || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, start_number: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>結束號碼</Label>
                        <Input
                          type="number"
                          value={newRecordForm.data.end_number || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, end_number: parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>正確率 (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newRecordForm.data.accuracy_rate || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, accuracy_rate: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  </>
                )}

                {newRecordForm.recordType === 'exam' && (
                  <>
                    <div>
                      <Label>課程 ID</Label>
                      <Input
                        value={newRecordForm.data.course_id || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, course_id: e.target.value }
                        }))}
                        placeholder="輸入課程 ID"
                      />
                    </div>
                    <div>
                      <Label>考試名稱</Label>
                      <Input
                        value={newRecordForm.data.exam_name || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, exam_name: e.target.value }
                        }))}
                        placeholder="輸入考試名稱"
                      />
                    </div>
                    <div>
                      <Label>考試日期</Label>
                      <Input
                        type="date"
                        value={newRecordForm.data.exam_date || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, exam_date: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>得分</Label>
                        <Input
                          type="number"
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
                  </>
                )}

                {newRecordForm.recordType === 'assignment' && (
                  <>
                    <div>
                      <Label>作業 ID</Label>
                      <Input
                        value={newRecordForm.data.assignment_id || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, assignment_id: e.target.value }
                        }))}
                        placeholder="輸入作業 ID"
                      />
                    </div>
                    <div>
                      <Label>提交內容</Label>
                      <Input
                        value={newRecordForm.data.content || ''}
                        onChange={(e) => setNewRecordForm(prev => ({
                          ...prev,
                          data: { ...prev.data, content: e.target.value }
                        }))}
                        placeholder="輸入提交內容"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>得分</Label>
                        <Input
                          type="number"
                          value={newRecordForm.data.score || ''}
                          onChange={(e) => setNewRecordForm(prev => ({
                            ...prev,
                            data: { ...prev.data, score: parseFloat(e.target.value) || 0 }
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
                  </>
                )}
              </div>
              <DialogFooter>
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
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">學生總覽</TabsTrigger>
          <TabsTrigger value="records">學習記錄</TabsTrigger>
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
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateReport(student)}
                            >
                              <FileText className="h-4 w-4" />
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

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>學習記錄管理</CardTitle>
              <CardDescription>新增、編輯和查看學生的詳細學習記錄</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">學習記錄管理功能開發中</p>
              </div>
            </CardContent>
          </Card>
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
    </div>
    </AuthMiddleware>
  );
}