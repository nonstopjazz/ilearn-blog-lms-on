'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface Annotation {
  id: string;
  text: string;
  start?: number;
  end?: number;
  feedback: string;
}

interface Essay {
  id: string;
  student_id: string;
  essay_title: string;
  essay_date: string;
  essay_topic?: string;
  essay_topic_detail?: string;
  status: string;
  image_url: string;
  student_notes?: string;
  teacher_comment?: string;
  overall_comment?: string;
  score_content?: number;
  score_grammar?: number;
  score_structure?: number;
  score_vocabulary?: number;
  score_creativity?: number;
  total_score?: number;
  annotations?: Annotation[];
}

export default function TeacherGradingPage() {
  const router = useRouter();
  const params = useParams();
  const essayId = params.id as string;

  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [essayTopic, setEssayTopic] = useState('');
  const [essayTopicDetail, setEssayTopicDetail] = useState('');
  const [teacherComment, setTeacherComment] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [scores, setScores] = useState({
    content: 0,
    grammar: 0,
    structure: 0,
    vocabulary: 0,
    creativity: 0,
  });

  useEffect(() => {
    if (essayId) {
      fetchEssay();
    }
  }, [essayId]);

  const fetchEssay = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/essays/${essayId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '獲取作文失敗');
      }

      const data = result.data;
      setEssay(data);

      // 初始化表單
      setEssayTopic(data.essay_topic || '');
      setEssayTopicDetail(data.essay_topic_detail || '');
      setTeacherComment(data.teacher_comment || '');
      setOverallComment(data.overall_comment || '');
      setAnnotations(data.annotations || []);
      setScores({
        content: data.score_content || 0,
        grammar: data.score_grammar || 0,
        structure: data.score_structure || 0,
        vocabulary: data.score_vocabulary || 0,
        creativity: data.score_creativity || 0,
      });
    } catch (error: any) {
      console.error('[Teacher Grading] Error:', error);
      toast.error('載入失敗: ' + error.message);
      router.push('/admin/essays');
    } finally {
      setLoading(false);
    }
  };

  const addAnnotation = () => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      text: '',
      feedback: '',
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  const updateAnnotation = (
    id: string,
    field: keyof Annotation,
    value: string | number
  ) => {
    setAnnotations(
      annotations.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSaveQuestion = async () => {
    if (!essay) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/essays/${essay.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essay_topic: essayTopic,
          essay_topic_detail: essayTopicDetail,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '儲存失敗');
      }

      toast.success('題目已儲存');
      setEssay({ ...essay, essay_topic: essayTopic, essay_topic_detail: essayTopicDetail });
    } catch (error: any) {
      console.error('[Save Question] Error:', error);
      toast.error('儲存失敗: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!essay) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/essays/${essay.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_comment: teacherComment,
          annotations: annotations,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '儲存失敗');
      }

      toast.success('分析已儲存');
      setEssay({
        ...essay,
        teacher_comment: teacherComment,
        annotations: annotations,
      });
    } catch (error: any) {
      console.error('[Save Analysis] Error:', error);
      toast.error('儲存失敗: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveScores = async () => {
    if (!essay) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/essays/${essay.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score_content: scores.content,
          score_grammar: scores.grammar,
          score_structure: scores.structure,
          score_vocabulary: scores.vocabulary,
          score_creativity: scores.creativity,
          overall_comment: overallComment,
          status: 'graded', // 標記為已批改
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '儲存失敗');
      }

      toast.success('評分已儲存');

      // 更新essay state
      setEssay({
        ...essay,
        score_content: scores.content,
        score_grammar: scores.grammar,
        score_structure: scores.structure,
        score_vocabulary: scores.vocabulary,
        score_creativity: scores.creativity,
        overall_comment: overallComment,
        status: 'graded',
      });
    } catch (error: any) {
      console.error('[Save Scores] Error:', error);
      toast.error('儲存失敗: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAverage = () => {
    const total =
      scores.content +
      scores.grammar +
      scores.structure +
      scores.vocabulary +
      scores.creativity;
    return Math.round(total / 5);
  };

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

  if (!essay) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">找不到作文</h3>
          <Button onClick={() => router.push('/admin/essays')}>返回列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/essays')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">批改作文</h1>
          <p className="text-muted-foreground">{essay.essay_title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Essay Image */}
          <Card className="p-6 h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">作文圖片</h2>
            </div>
            <div className="rounded-lg overflow-hidden border bg-muted">
              <img
                src={essay.image_url}
                alt={essay.essay_title}
                className="w-full h-auto"
              />
            </div>
            {essay.student_notes && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-sm text-blue-900 mb-2">
                  學生備註
                </h3>
                <p className="text-sm text-blue-700">{essay.student_notes}</p>
              </div>
            )}
          </Card>

          {/* Right Side - Grading Tabs */}
          <div>
            <Tabs defaultValue="question" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="question">編輯題目</TabsTrigger>
                <TabsTrigger value="analysis">編輯分析</TabsTrigger>
                <TabsTrigger value="scores">編輯評分</TabsTrigger>
              </TabsList>

              {/* Question Tab */}
              <TabsContent value="question">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="question-title" className="text-lg">
                        題目標題
                      </Label>
                      <Input
                        id="question-title"
                        value={essayTopic}
                        onChange={(e) => setEssayTopic(e.target.value)}
                        className="mt-2 text-lg font-medium"
                        placeholder="例如：我的暑假生活"
                      />
                    </div>

                    <div>
                      <Label htmlFor="question-detail" className="text-lg">
                        題目說明
                      </Label>
                      <Textarea
                        id="question-detail"
                        value={essayTopicDetail}
                        onChange={(e) => setEssayTopicDetail(e.target.value)}
                        className="mt-2 min-h-[150px]"
                        placeholder="輸入題目的詳細說明和要求..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveQuestion}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            儲存中...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            儲存題目
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis">
                <div className="space-y-4">
                  {/* Teacher Comment */}
                  <Card className="p-6">
                    <Label className="text-lg mb-2 block">老師評語</Label>
                    <Textarea
                      value={teacherComment}
                      onChange={(e) => setTeacherComment(e.target.value)}
                      className="min-h-[150px]"
                      placeholder="寫下對這篇作文的整體評價和建議..."
                    />
                  </Card>

                  {/* Annotations */}
                  <div className="text-sm font-medium mb-2">詳細標註</div>
                  {annotations.map((annotation, idx) => (
                    <Card key={annotation.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <Badge variant="outline" className="mt-1">
                          {idx + 1}
                        </Badge>
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label className="text-sm">標記文字</Label>
                            <Input
                              value={annotation.text}
                              onChange={(e) =>
                                updateAnnotation(annotation.id, 'text', e.target.value)
                              }
                              placeholder="輸入要標記的文字片段"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">批改建議</Label>
                            <Textarea
                              value={annotation.feedback}
                              onChange={(e) =>
                                updateAnnotation(
                                  annotation.id,
                                  'feedback',
                                  e.target.value
                                )
                              }
                              placeholder="輸入批改建議與說明"
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAnnotation(annotation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  <Button
                    onClick={addAnnotation}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    新增標記
                  </Button>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveAnalysis}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          儲存分析
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Scores Tab */}
              <TabsContent value="scores">
                <Card className="p-6">
                  <div className="space-y-8">
                    {/* Score Sliders */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>內容完整性</Label>
                        <span className="text-2xl font-bold text-primary">
                          {scores.content}
                        </span>
                      </div>
                      <Slider
                        value={[scores.content]}
                        onValueChange={([value]) =>
                          setScores({ ...scores, content: value })
                        }
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        論點是否完整、內容是否充實
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>文法正確性</Label>
                        <span className="text-2xl font-bold text-primary">
                          {scores.grammar}
                        </span>
                      </div>
                      <Slider
                        value={[scores.grammar]}
                        onValueChange={([value]) =>
                          setScores({ ...scores, grammar: value })
                        }
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        語句結構、標點符號的正確性
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>結構組織</Label>
                        <span className="text-2xl font-bold text-primary">
                          {scores.structure}
                        </span>
                      </div>
                      <Slider
                        value={[scores.structure]}
                        onValueChange={([value]) =>
                          setScores({ ...scores, structure: value })
                        }
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        段落安排、邏輯連貫性
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>用詞精確度</Label>
                        <span className="text-2xl font-bold text-primary">
                          {scores.vocabulary}
                        </span>
                      </div>
                      <Slider
                        value={[scores.vocabulary]}
                        onValueChange={([value]) =>
                          setScores({ ...scores, vocabulary: value })
                        }
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        詞彙選用、表達精準度
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>創意表達</Label>
                        <span className="text-2xl font-bold text-primary">
                          {scores.creativity}
                        </span>
                      </div>
                      <Slider
                        value={[scores.creativity]}
                        onValueChange={([value]) =>
                          setScores({ ...scores, creativity: value })
                        }
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        想法創新、表達方式的獨特性
                      </p>
                    </div>

                    {/* Average Score Display */}
                    <div className="pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">預估總分（平均）</span>
                        <span className="text-4xl font-bold text-primary">
                          {calculateAverage()}
                        </span>
                      </div>
                    </div>

                    {/* Overall Comment */}
                    <div className="pt-6 border-t">
                      <Label className="text-lg mb-2 block">總體評語</Label>
                      <Textarea
                        value={overallComment}
                        onChange={(e) => setOverallComment(e.target.value)}
                        className="min-h-[150px]"
                        placeholder="輸入總體評語..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveScores}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            儲存中...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            儲存評分
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
