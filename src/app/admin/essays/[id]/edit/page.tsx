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
  FileText,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Annotation {
  id: string;
  text: string;
  start?: number;
  end?: number;
  feedback: string;
}

interface ImageUrl {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  order: number;
  annotation?: string;
}

interface Essay {
  id: string;
  student_id: string;
  essay_title: string;
  essay_date: string;
  essay_topic?: string;
  essay_topic_detail?: string;
  status: string;
  submission_type: 'image' | 'text';
  image_url?: string;
  image_urls?: ImageUrl[];
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
  annotations?: Annotation[];
}

export default function TeacherGradingPage() {
  const router = useRouter();
  const params = useParams();
  const essayId = params.id as string;
  const { user, loading: authLoading } = useAuth();

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

  // AI grading states
  const [isAIGrading, setIsAIGrading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    scores: typeof scores;
    teacher_comment: string;
    overall_comment: string;
    suggestions: string[];
  } | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  useEffect(() => {
    if (!authLoading && user && essayId) {
      fetchEssay();
    }
  }, [authLoading, user, essayId]);

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

  const handleAIGrading = async () => {
    if (!essay) return;

    // 檢查作文內容
    if (essay.submission_type === 'text' && (!essay.essay_content || essay.essay_content.trim().length === 0)) {
      toast.error('文字作文沒有內容');
      return;
    }

    if (essay.submission_type === 'image' && (!essay.image_urls || essay.image_urls.length === 0) && !essay.image_url) {
      toast.error('圖片作文沒有上傳圖片');
      return;
    }

    try {
      setIsAIGrading(true);

      if (essay.submission_type === 'image') {
        toast.info('正在辨識圖片文字並分析作文...（需要較長時間）');
      } else {
        toast.info('AI 正在分析作文...');
      }

      const response = await fetch('/api/essays/ai-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essay_id: essay.id
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'AI 批改失敗');
      }

      // 儲存 AI 建議
      setAiSuggestions(result.data);
      setShowAISuggestions(true);

      if (essay.submission_type === 'image') {
        toast.success('OCR 辨識 + AI 批改完成！請查看建議');
      } else {
        toast.success('AI 批改完成！請查看建議');
      }

    } catch (error: any) {
      console.error('[AI Grading] Error:', error);
      toast.error('AI 批改失敗: ' + error.message);
    } finally {
      setIsAIGrading(false);
    }
  };

  const handleAcceptAISuggestions = () => {
    if (!aiSuggestions) return;

    // 採用 AI 建議的分數和評語
    setScores(aiSuggestions.scores);
    setTeacherComment(aiSuggestions.teacher_comment);
    setOverallComment(aiSuggestions.overall_comment);

    toast.success('已採用 AI 建議');
    setShowAISuggestions(false);
  };

  const handleRejectAISuggestions = () => {
    setShowAISuggestions(false);
    toast.info('已關閉 AI 建議');
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
          {/* Left Side - Essay Content */}
          <Card className="p-6 h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {essay.submission_type === 'image' ? '作文圖片' : '作文內容'}
              </h2>
            </div>

            {essay.submission_type === 'image' ? (
              <div className="space-y-4">
                {/* 多張圖片顯示 */}
                {essay.image_urls && essay.image_urls.length > 0 ? (
                  essay.image_urls
                    .sort((a, b) => a.order - b.order)
                    .map((imgData, index) => (
                      <div key={index} className="space-y-2">
                        <div className="rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={imgData.url}
                            alt={`${essay.essay_title} - 圖片 ${index + 1}`}
                            className="w-full h-auto"
                          />
                        </div>
                        {imgData.annotation && (
                          <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 rounded border-l-4 border-primary">
                            <ImageIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">圖片 {index + 1}：</span>
                              {imgData.annotation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                ) : essay.image_url ? (
                  /* 單張圖片（向後兼容）*/
                  <div className="rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={essay.image_url}
                      alt={essay.essay_title}
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted p-6 text-center text-muted-foreground">
                    無作文圖片
                  </div>
                )}
              </div>
            ) : essay.submission_type === 'text' && essay.essay_content ? (
              <div className="rounded-lg border bg-muted p-6 max-h-[600px] overflow-y-auto">
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
                    {/* AI Grading Button */}
                    <div className="pb-6 border-b">
                      <Button
                        onClick={handleAIGrading}
                        disabled={isAIGrading}
                        variant="outline"
                        className="w-full gap-2 border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                      >
                        {isAIGrading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {essay.submission_type === 'image' ? 'OCR 辨識 + AI 分析中...' : 'AI 分析中...'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            AI 輔助批改{essay.submission_type === 'image' && ' (含 OCR 辨識)'}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {essay.submission_type === 'image'
                          ? '使用 Google Cloud Vision OCR 辨識手寫文字，再由 DeepSeek AI 批改'
                          : '使用 DeepSeek AI 自動分析作文並提供評分建議'
                        }
                      </p>
                    </div>

                    {/* AI Suggestions Display */}
                    {showAISuggestions && aiSuggestions && (
                      <Card className="p-6 bg-purple-50 border-purple-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-purple-900">
                              AI 批改建議
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRejectAISuggestions}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* AI Suggested Scores */}
                        <div className="space-y-3 mb-4">
                          <h4 className="font-medium text-sm text-purple-800">建議分數：</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">內容完整性：</span>
                              <span className="font-bold text-purple-700">{aiSuggestions.scores.content}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">文法正確性：</span>
                              <span className="font-bold text-purple-700">{aiSuggestions.scores.grammar}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">結構組織：</span>
                              <span className="font-bold text-purple-700">{aiSuggestions.scores.structure}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">用詞精確度：</span>
                              <span className="font-bold text-purple-700">{aiSuggestions.scores.vocabulary}</span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-muted-foreground">創意表達：</span>
                              <span className="font-bold text-purple-700">{aiSuggestions.scores.creativity}</span>
                            </div>
                          </div>
                        </div>

                        {/* OCR Text Display (for image essays) */}
                        {aiSuggestions.ocr_text && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm text-purple-800 mb-2">OCR 辨識文字：</h4>
                            <div className="bg-white p-3 rounded border border-purple-200 text-sm max-h-40 overflow-y-auto">
                              <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                                {aiSuggestions.ocr_text}
                              </pre>
                            </div>
                            <p className="text-xs text-purple-600 mt-1">
                              ℹ️ 以上為 Google Cloud Vision 辨識結果，可能有誤差
                            </p>
                          </div>
                        )}

                        {/* AI Comments */}
                        {aiSuggestions.teacher_comment && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm text-purple-800 mb-2">詳細分析：</h4>
                            <div className="bg-white p-3 rounded border border-purple-200 text-sm">
                              {aiSuggestions.teacher_comment}
                            </div>
                          </div>
                        )}

                        {/* AI Suggestions List */}
                        {aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm text-purple-800 mb-2">改進建議：</h4>
                            <ul className="bg-white p-3 rounded border border-purple-200 text-sm space-y-1">
                              {aiSuggestions.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-600 mt-1">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={handleAcceptAISuggestions}
                            className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
                          >
                            <Check className="w-4 h-4" />
                            採用 AI 建議
                          </Button>
                          <Button
                            onClick={handleRejectAISuggestions}
                            variant="outline"
                            className="flex-1"
                          >
                            手動調整
                          </Button>
                        </div>
                      </Card>
                    )}

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
