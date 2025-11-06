'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit,
  Plus,
  Loader2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Essay {
  id: string;
  student_id: string;
  essay_title: string;
  essay_date: string;
  status: 'submitted' | 'grading' | 'graded' | 'revised' | 'draft';
  total_score?: number;
  image_url: string;
  image_thumbnail_url?: string;
  student_notes?: string;
  teacher_comment?: string;
  created_at: string;
}

export default function AdminEssayListPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!authLoading && user) {
      fetchEssays();
    }
  }, [authLoading, user]);

  const fetchEssays = async () => {
    if (!user?.id) {
      toast.error('請先登入');
      return;
    }

    try {
      setLoading(true);
      // Admin fetches all essays
      const response = await fetch(`/api/essays?user_id=${user.id}&limit=100&sort_by=created_at&order=desc`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '獲取作文列表失敗');
      }

      setEssays(result.data || []);
    } catch (error: any) {
      console.error('[Admin Essays] Error:', error);
      toast.error('載入失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Essay['status']) => {
    switch (status) {
      case 'graded':
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            已批改
          </Badge>
        );
      case 'grading':
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            批改中
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            待批改
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <FileText className="w-3 h-3 mr-1" />
            草稿
          </Badge>
        );
      case 'revised':
        return (
          <Badge className="bg-purple-500 text-white hover:bg-purple-600">
            <FileText className="w-3 h-3 mr-1" />
            已修訂
          </Badge>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 篩選
  const filteredEssays = essays.filter((essay) => {
    if (filterStatus === 'all') return true;
    return essay.status === filterStatus;
  });

  // 排序
  const sortedEssays = [...filteredEssays].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.essay_date).getTime() - new Date(a.essay_date).getTime();
      case 'date-asc':
        return new Date(a.essay_date).getTime() - new Date(b.essay_date).getTime();
      case 'score-desc':
        return (b.total_score || 0) - (a.total_score || 0);
      case 'score-asc':
        return (a.total_score || 0) - (b.total_score || 0);
      default:
        return 0;
    }
  });

  // 統計
  const totalCount = essays.length;
  const gradedCount = essays.filter((e) => e.status === 'graded').length;
  const pendingCount = essays.filter((e) => e.status === 'submitted').length;
  const avgScore =
    gradedCount > 0
      ? Math.round(
          essays
            .filter((e) => e.total_score)
            .reduce((acc, e) => acc + (e.total_score || 0), 0) / gradedCount
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">作文管理</h1>
            <p className="text-muted-foreground">
              共 {totalCount} 篇作文 · {gradedCount} 篇已批改 · {pendingCount} 篇待批改
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{totalCount}</div>
            <div className="text-sm text-muted-foreground">總作文數</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{gradedCount}</div>
            <div className="text-sm text-muted-foreground">已批改</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">待批改</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{avgScore}</div>
            <div className="text-sm text-muted-foreground">平均分數</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="submitted">待批改</SelectItem>
                <SelectItem value="grading">批改中</SelectItem>
                <SelectItem value="graded">已批改</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="revised">已修訂</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">日期（新到舊）</SelectItem>
                <SelectItem value="date-asc">日期（舊到新）</SelectItem>
                <SelectItem value="score-desc">分數（高到低）</SelectItem>
                <SelectItem value="score-asc">分數（低到高）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Essay Grid */}
        {sortedEssays.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">尚無作文</h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus === 'all'
                ? '目前沒有任何作文提交'
                : `沒有符合「${filterStatus}」狀態的作文`}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEssays.map((essay) => (
              <Card
                key={essay.id}
                className="group hover:shadow-lg transition-all duration-300 hover:border-primary cursor-pointer overflow-hidden"
                onClick={() => router.push(`/admin/essays/${essay.id}/edit`)}
              >
                {/* 圖片預覽 */}
                {essay.image_thumbnail_url || essay.image_url ? (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img
                      src={essay.image_thumbnail_url || essay.image_url}
                      alt={essay.essay_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : null}

                {/* Card Header with Status */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <img
                          src="/images/essay-icon.png"
                          alt="作文"
                          className="w-6 h-6 mt-0.5 flex-shrink-0"
                        />
                        <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {essay.essay_title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>學生 ID: {essay.student_id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    {getStatusBadge(essay.status)}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(essay.essay_date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {essay.status === 'graded' && essay.total_score !== undefined && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span>總分</span>
                      </div>
                      <div
                        className={`text-3xl font-bold ${getScoreColor(essay.total_score)}`}
                      >
                        {essay.total_score}
                      </div>
                    </div>
                  )}

                  {(essay.status === 'submitted' || essay.status === 'grading') && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>需要批改</span>
                      </div>
                    </div>
                  )}

                  {essay.student_notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        學生備註：{essay.student_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4">
                  <Button
                    variant={essay.status === 'graded' ? 'outline' : 'default'}
                    className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/essays/${essay.id}/edit`);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    {essay.status === 'graded' ? '查看/編輯' : '開始批改'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
