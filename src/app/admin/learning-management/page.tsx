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

  // 模擬數據載入
  useEffect(() => {
    loadStudentsData();
  }, []);

  const loadStudentsData = async () => {
    setLoading(true);
    // 模擬 API 調用
    setTimeout(() => {
      setStudents([
        {
          id: '1',
          name: '王小明',
          email: 'xiaoming@example.com',
          total_words: 450,
          avg_accuracy: 85.5,
          total_exams: 5,
          avg_exam_score: 82.5,
          assignments_completed: 12,
          assignments_total: 15,
          last_activity: '2024-01-20',
          status: 'active'
        },
        {
          id: '2',
          name: '李小華',
          email: 'xiaohua@example.com',
          total_words: 320,
          avg_accuracy: 78.2,
          total_exams: 4,
          avg_exam_score: 75.8,
          assignments_completed: 10,
          assignments_total: 15,
          last_activity: '2024-01-19',
          status: 'active'
        },
        {
          id: '3',
          name: '張小美',
          email: 'xiaomei@example.com',
          total_words: 580,
          avg_accuracy: 92.1,
          total_exams: 6,
          avg_exam_score: 89.3,
          assignments_completed: 15,
          assignments_total: 15,
          last_activity: '2024-01-20',
          status: 'active'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  // 篩選學生
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <Select>
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇記錄類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vocabulary">單字學習</SelectItem>
                      <SelectItem value="exam">考試成績</SelectItem>
                      <SelectItem value="assignment">作業提交</SelectItem>
                      <SelectItem value="project">特殊專案</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                  取消
                </Button>
                <Button>確認新增</Button>
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
                            {Math.round((student.assignments_completed / student.assignments_total) * 100)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.avg_exam_score} 分</div>
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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