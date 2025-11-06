'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Loader2,
  Save,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Essay {
  id: string;
  student_id: string;
  essay_title: string;
  essay_date: string;
  essay_topic?: string;
  essay_topic_detail?: string;
  status: 'submitted' | 'grading' | 'graded' | 'revised' | 'draft';
  submission_type: 'image' | 'text';
  image_url?: string;
  image_thumbnail_url?: string;
  essay_content?: string;
  student_notes?: string;
  teacher_comment?: string;
  overall_comment?: string;
  score_content?: number;
  score_grammar?: number;
  score_structure?: number;
  score_vocabulary?: number;
  score_creativity?: number;
  total_score?: number;
  annotations?: any[];
  created_at: string;
}

export default function EssayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const essayId = params.id as string;
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');

  useEffect(() => {
    if (!authLoading && user && essayId) {
      fetchEssay();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, user, isAuthenticated, essayId]);

  const fetchEssay = async () => {
    if (!user?.id) {
      toast.error('請先登入');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/essays/${essayId}?user_id=${user.id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '獲取作文失敗');
      }

      setEssay(result.data);
      setStudentNotes(result.data.student_notes || '');
    } catch (error: any) {
      console.error('[Essay Detail] Error:', error);
      toast.error('載入失敗: ' + error.message);
      router.push('/learning/essays');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!essay || !user?.id) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/essays/${essay.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          student_notes: studentNotes,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '儲存失敗');
      }

      toast.success('備註已儲存');
      setEssay({ ...essay, student_notes: studentNotes });
    } catch (error: any) {
      console.error('[Save Notes] Error:', error);
      toast.error('儲存失敗: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 顯示 loading：認證檢查中或資料載入中
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {authLoading ? '認證檢查中...' : '載入中...'}
          </p>
        </div>
      </div>
    );
  }

  if (!essay) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">找不到作文</h3>
          <Button onClick={() => router.push('/learning/essays')}>返回列表</Button>
        </Card>
      </div>
    );
  }

  const scores = [
    {
      name: '內容完整性',
      score: essay.score_content,
      description: '論點是否完整、內容是否充實',
    },
    {
      name: '文法正確性',
      score: essay.score_grammar,
      description: '語句結構、標點符號的正確性',
    },
    {
      name: '結構組織',
      score: essay.score_structure,
      description: '段落安排、邏輯連貫性',
    },
    {
      name: '用詞精確度',
      score: essay.score_vocabulary,
      description: '詞彙選用、表達精準度',
    },
    {
      name: '創意表達',
      score: essay.score_creativity,
      description: '想法創新、表達方式的獨特性',
    },
  ];

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/learning/essays')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作文列表
          </Button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {essay.essay_title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className={`text-2xl font-bold ${getScoreColor(essay.total_score)}`}>
                      總分 {essay.total_score}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Essay Content */}
          <Card className="p-6 h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {essay.submission_type === 'image' ? '作文圖片' : '作文內容'}
              </h2>
            </div>

            {essay.submission_type === 'image' && essay.image_url ? (
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img
                  src={essay.image_url}
                  alt={essay.essay_title}
                  className="w-full h-auto"
                />
              </div>
            ) : essay.submission_type === 'text' && essay.essay_content ? (
              <div className="rounded-lg border bg-muted p-6">
                <div className="prose prose-slate max-w-none">
                  <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground">
                    {essay.essay_content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted p-6 text-center text-muted-foreground">
                無作文內容
              </div>
            )}

            {/* Student Notes */}
            <div className="mt-6">
              <Label htmlFor="student-notes" className="text-base mb-2 block">
                我的備註
              </Label>
              <Textarea
                id="student-notes"
                placeholder="記錄你對這篇作文的想法..."
                className="min-h-[100px]"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
              />
              {studentNotes !== (essay.student_notes || '') && (
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="mt-2 gap-2"
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      儲存備註
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Right Side - Tabs */}
          <div>
            <Tabs defaultValue="question" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="question">題目</TabsTrigger>
                <TabsTrigger value="feedback">評語</TabsTrigger>
                <TabsTrigger value="scores">評分</TabsTrigger>
              </TabsList>

              {/* Question Tab */}
              <TabsContent value="question">
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">作文題目</h3>
                  {essay.essay_topic ? (
                    <div className="bg-secondary p-4 rounded-lg">
                      <p className="text-lg font-medium mb-2">{essay.essay_topic}</p>
                      {essay.essay_topic_detail && (
                        <p className="text-muted-foreground text-sm">
                          {essay.essay_topic_detail}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-muted-foreground">老師尚未填寫題目說明</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback">
                <div className="space-y-4">
                  {/* Teacher Comment */}
                  {essay.teacher_comment && (
                    <Card className="p-6">
                      <h4 className="font-semibold mb-3 text-primary text-lg">
                        老師評語
                      </h4>
                      <p className="text-foreground whitespace-pre-line leading-relaxed">
                        {essay.teacher_comment}
                      </p>
                    </Card>
                  )}

                  {/* Overall Comment */}
                  {essay.overall_comment && (
                    <Card className="p-6">
                      <h4 className="font-semibold mb-3 text-primary text-lg">
                        總體評語
                      </h4>
                      <p className="text-foreground whitespace-pre-line leading-relaxed">
                        {essay.overall_comment}
                      </p>
                    </Card>
                  )}

                  {/* Annotations */}
                  {essay.annotations && essay.annotations.length > 0 && (
                    <Card className="p-6">
                      <h4 className="font-semibold mb-4 text-primary text-lg">
                        詳細標註
                      </h4>
                      <div className="space-y-4">
                        {essay.annotations.map((annotation: any, idx: number) => (
                          <div
                            key={annotation.id || idx}
                            className="border-l-4 border-primary pl-4"
                          >
                            {annotation.text && (
                              <div className="bg-highlight/20 px-3 py-2 rounded mb-2 inline-block">
                                <span className="font-medium">{annotation.text}</span>
                              </div>
                            )}
                            {annotation.feedback && (
                              <p className="text-muted-foreground">{annotation.feedback}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {!essay.teacher_comment &&
                    !essay.overall_comment &&
                    (!essay.annotations || essay.annotations.length === 0) && (
                      <Card className="p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">老師尚未批改此作文</p>
                      </Card>
                    )}
                </div>
              </TabsContent>

              {/* Scores Tab */}
              <TabsContent value="scores">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-2xl font-bold text-foreground">評分詳情</h3>
                  </div>

                  {essay.status === 'graded' &&
                  (essay.score_content ||
                    essay.score_grammar ||
                    essay.score_structure ||
                    essay.score_vocabulary ||
                    essay.score_creativity) ? (
                    <div className="space-y-6">
                      {scores.map((scoreItem) => (
                        <div key={scoreItem.name}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium text-foreground">
                                {scoreItem.name}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {scoreItem.description}
                              </p>
                            </div>
                            <span
                              className={`text-2xl font-bold ${getScoreColor(
                                scoreItem.score
                              )}`}
                            >
                              {scoreItem.score || '-'}
                            </span>
                          </div>
                          {scoreItem.score && (
                            <>
                              <Progress value={scoreItem.score} className="h-3" />
                              <p className="text-sm text-muted-foreground mt-2">
                                {scoreItem.score >= 85 ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    表現優異，繼續保持！
                                  </span>
                                ) : scoreItem.score >= 75 ? (
                                  '表現良好，仍有進步空間。'
                                ) : (
                                  '需要加強，建議多加練習。'
                                )}
                              </p>
                            </>
                          )}
                        </div>
                      ))}

                      {essay.total_score !== undefined && (
                        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground text-lg">
                              總分
                            </h4>
                            <span
                              className={`text-4xl font-bold ${getScoreColor(
                                essay.total_score
                              )}`}
                            >
                              {essay.total_score}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">老師尚未評分</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
