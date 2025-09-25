'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, Plus, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import type { VocabularySession } from '@/types/learning-management';

interface VocabularyTrackerProps {
  studentId: string;
  courseId: string;
}

export function VocabularyTracker({ studentId, courseId }: VocabularyTrackerProps) {
  const [sessions, setSessions] = useState<VocabularySession[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSession, setNewSession] = useState({
    session_date: new Date().toISOString().split('T')[0],
    start_number: '',
    end_number: '',
    session_duration: '',
    accuracy_rate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 載入單字學習記錄
  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/learning/vocabulary?student_id=${studentId}&course_id=${courseId}`
      );
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      } else {
        setError('無法載入學習記錄');
      }
    } catch (err) {
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 新增學習記錄
  const handleAddSession = async () => {
    setError('');
    setSuccess('');

    // 驗證輸入
    if (!newSession.start_number || !newSession.end_number) {
      setError('請輸入起始和結束編號');
      return;
    }

    const startNum = parseInt(newSession.start_number);
    const endNum = parseInt(newSession.end_number);

    if (startNum > endNum) {
      setError('結束編號必須大於或等於起始編號');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/learning/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId,
          session_date: newSession.session_date,
          start_number: startNum,
          end_number: endNum,
          session_duration: newSession.session_duration ? parseInt(newSession.session_duration) : null,
          accuracy_rate: newSession.accuracy_rate ? parseFloat(newSession.accuracy_rate) : null,
          notes: newSession.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('學習記錄已成功新增');
        setIsAddingSession(false);
        // 重置表單
        setNewSession({
          session_date: new Date().toISOString().split('T')[0],
          start_number: '',
          end_number: '',
          session_duration: '',
          accuracy_rate: '',
          notes: ''
        });
        // 重新載入列表
        await loadSessions();
      } else {
        setError(data.error || '新增失敗');
      }
    } catch (err) {
      setError('新增失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 計算總學習進度
  const calculateProgress = () => {
    if (sessions.length === 0) return { total: 0, today: 0, week: 0, accuracy: 0 };

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const total = sessions.reduce((sum, s) => sum + (s.words_learned || 0), 0);
    const todaySessions = sessions.filter(s => s.session_date === today);
    const todayWords = todaySessions.reduce((sum, s) => sum + (s.words_learned || 0), 0);
    const weekSessions = sessions.filter(s => s.session_date >= weekAgo);
    const weekWords = weekSessions.reduce((sum, s) => sum + (s.words_learned || 0), 0);

    const avgAccuracy = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.accuracy_rate || 0), 0) / sessions.length
      : 0;

    return {
      total,
      today: todayWords,
      week: weekWords,
      accuracy: avgAccuracy
    };
  };

  const stats = calculateProgress();

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">累計學習</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">個單字</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">今日學習</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">個單字</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本週學習</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.week}</div>
            <p className="text-xs text-muted-foreground">個單字</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均正確率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</div>
            <Progress value={stats.accuracy} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 錯誤/成功提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* 主要內容卡片 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>單字學習記錄</CardTitle>
              <CardDescription>追蹤每日單字學習進度</CardDescription>
            </div>
            <Dialog open={isAddingSession} onOpenChange={setIsAddingSession}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新增記錄
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>新增學習記錄</DialogTitle>
                  <DialogDescription>
                    記錄今天的單字學習進度
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      日期
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSession.session_date}
                      onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start" className="text-right">
                      起始編號
                    </Label>
                    <Input
                      id="start"
                      type="number"
                      placeholder="例：1"
                      value={newSession.start_number}
                      onChange={(e) => setNewSession({ ...newSession, start_number: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end" className="text-right">
                      結束編號
                    </Label>
                    <Input
                      id="end"
                      type="number"
                      placeholder="例：50"
                      value={newSession.end_number}
                      onChange={(e) => setNewSession({ ...newSession, end_number: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">
                      學習時長
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="分鐘"
                      value={newSession.session_duration}
                      onChange={(e) => setNewSession({ ...newSession, session_duration: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="accuracy" className="text-right">
                      正確率
                    </Label>
                    <Input
                      id="accuracy"
                      type="number"
                      placeholder="%"
                      min="0"
                      max="100"
                      value={newSession.accuracy_rate}
                      onChange={(e) => setNewSession({ ...newSession, accuracy_rate: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      備註
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="學習心得或需要加強的地方"
                      value={newSession.notes}
                      onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingSession(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddSession} disabled={loading}>
                    {loading ? '新增中...' : '確認新增'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">尚無學習記錄</h3>
              <p className="text-muted-foreground">開始記錄您的單字學習進度吧！</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>單字範圍</TableHead>
                  <TableHead>學習數量</TableHead>
                  <TableHead>學習時長</TableHead>
                  <TableHead>正確率</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>備註</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.session_date}</TableCell>
                    <TableCell>
                      {session.start_number} - {session.end_number}
                    </TableCell>
                    <TableCell>{session.words_learned}</TableCell>
                    <TableCell>
                      {session.session_duration ? `${session.session_duration} 分鐘` : '-'}
                    </TableCell>
                    <TableCell>
                      {session.accuracy_rate ? (
                        <div className="flex items-center gap-2">
                          <span>{session.accuracy_rate}%</span>
                          {session.accuracy_rate >= 80 && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        session.status === 'completed' ? 'default' :
                        session.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {session.status === 'completed' ? '已完成' :
                         session.status === 'in_progress' ? '進行中' : '跳過'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={session.notes}>
                      {session.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}