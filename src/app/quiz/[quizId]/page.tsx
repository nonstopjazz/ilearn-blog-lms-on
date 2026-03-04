'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';

interface Question {
  id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  image_url?: string;
  explanation?: string;
  points: number;
  options?: Array<{
    id: string;
    option_label: string;
    option_text: string;
    is_correct: boolean;
  }>;
  fill_answers?: Array<{
    id: string;
    correct_answer: string;
  }>;
}

interface QuizSet {
  id: string;
  title: string;
  description?: string;
  time_limit?: number;
  max_attempts: number;
  passing_score: number;
  show_results: boolean;
  show_correct_answers: boolean;
  questions: Question[];
  // 新增使用者嘗試相關欄位
  user_attempt_count?: number;
  remaining_attempts?: number;
  can_take_quiz?: boolean;
}

interface Answer {
  questionId: string;
  selectedOptions?: string[];
  textAnswer?: string;
}

const StudentQuizPage: React.FC = () => {
  const params = useParams();
  const quizId = params.quizId as string;
  
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: Answer }>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<'loading' | 'ready' | 'in-progress' | 'completed' | 'error'>('loading');
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // 🔧 從 API 獲取真實測驗資料
  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setQuizStatus('loading');
      
      const response = await fetch(`/api/quiz/${quizId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入測驗失敗');
      }

      console.log('載入的測驗資料:', result.quiz);
      console.log('題目資料:', result.quiz.questions);
      result.quiz.questions.forEach((q, i) => {
        console.log(`題目 ${i + 1} 圖片 URL:`, q.image_url);
      });
      
      setQuizSet(result.quiz);
      setTimeRemaining(result.quiz.time_limit ? result.quiz.time_limit * 60 : null);
      setQuizStatus('ready');
    } catch (error) {
      console.error('載入測驗失敗:', error);
      setQuizStatus('error');
    }
  };

  // 計時器
  useEffect(() => {
    if (quizStatus === 'in-progress' && timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStatus, timeRemaining]);

  const startQuiz = async () => {
    try {
      // 🔧 建立測驗嘗試記錄
      const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('獲取用戶失敗:', userError);
        throw new Error('請重新登入');
      }
      
      if (!user) {
        throw new Error('請先登入後再開始測驗');
      }
      
      const response = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_set_id: quizId,
          user_id: user.id,
          started_at: new Date().toISOString()
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '開始測驗失敗');
      }

      setAttemptId(result.attempt_id);
      setQuizStatus('in-progress');
    } catch (error) {
      console.error('開始測驗失敗:', error);
      alert('開始測驗失敗：' + error.message);
    }
  };

  const handleAnswerChange = (questionId: string, answer: Answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSingleChoice = (questionId: string, optionLabel: string) => {
    handleAnswerChange(questionId, {
      questionId,
      selectedOptions: [optionLabel]
    });
  };

  const handleMultipleChoice = (questionId: string, optionLabel: string) => {
    const currentAnswer = answers[questionId];
    const currentSelections = currentAnswer?.selectedOptions || [];
    
    const newSelections = currentSelections.includes(optionLabel)
      ? currentSelections.filter(opt => opt !== optionLabel)
      : [...currentSelections, optionLabel];

    handleAnswerChange(questionId, {
      questionId,
      selectedOptions: newSelections
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    handleAnswerChange(questionId, {
      questionId,
      textAnswer: text
    });
  };

  const nextQuestion = () => {
    if (quizSet && currentQuestionIndex < quizSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // 🔧 實現正確的成績計算邏輯
  const calculateScore = () => {
    if (!quizSet) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    console.log('開始計算分數...');
    
    quizSet.questions.forEach(question => {
      totalPoints += question.points;
      console.log(`題目 ${question.question_number}: ${question.points} 分`);
      
      const userAnswer = answers[question.id];
      if (!userAnswer) {
        console.log(`題目 ${question.question_number}: 未作答`);
        return;
      }

      let isCorrect = false;

      if (question.question_type === 'single') {
        const correctOption = question.options?.find(opt => opt.is_correct);
        isCorrect = userAnswer.selectedOptions?.[0] === correctOption?.option_label;
        console.log(`題目 ${question.question_number} (單選題): 正確答案=${correctOption?.option_label}, 用戶答案=${userAnswer.selectedOptions?.[0]}, 正確=${isCorrect}`);
      } else if (question.question_type === 'multiple') {
        const correctOptions = question.options?.filter(opt => opt.is_correct).map(opt => opt.option_label) || [];
        const userSelections = userAnswer.selectedOptions || [];
        
        isCorrect = correctOptions.length === userSelections.length &&
                   correctOptions.every(opt => userSelections.includes(opt));
        console.log(`題目 ${question.question_number} (複選題): 正確答案=${correctOptions}, 用戶答案=${userSelections}, 正確=${isCorrect}`);
      } else if (question.question_type === 'fill') {
        const correctAnswer = question.fill_answers?.[0]?.correct_answer?.toLowerCase().trim();
        const userText = userAnswer.textAnswer?.toLowerCase().trim();
        isCorrect = correctAnswer === userText;
        console.log(`題目 ${question.question_number} (填空題): 正確答案=${correctAnswer}, 用戶答案=${userText}, 正確=${isCorrect}`);
      }

      if (isCorrect) {
        earnedPoints += question.points;
        console.log(`題目 ${question.question_number}: 獲得 ${question.points} 分`);
      }
    });

    console.log(`總分: ${totalPoints}, 獲得分數: ${earnedPoints}`);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    console.log(`百分比: ${percentage}%`);
    
    return percentage;
  };

  // 🔧 提交測驗到資料庫
  const handleSubmitQuiz = async () => {
    if (!quizSet || !attemptId) return;

    try {
      const calculatedScore = calculateScore();
      
      const response = await authFetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          quiz_set_id: quizId,
          answers: answers,
          score: calculatedScore,
          completed_at: new Date().toISOString()
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '提交測驗失敗');
      }

      setScore(calculatedScore);
      setQuizStatus('completed');
      setShowResults(quizSet.show_results);
    } catch (error) {
      console.error('提交測驗失敗:', error);
      setQuizStatus('error');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (quizStatus === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">載入測驗中...</p>
        </div>
      </div>
    );
  }

  if (quizStatus === 'error') {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">無法載入測驗，請重新整理頁面再試。</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (!quizSet) return null;

  // 測驗開始前的介紹頁面
  if (quizStatus === 'ready') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{quizSet.title}</h1>
          {quizSet.description && (
            <p className="text-gray-600 mb-8 text-lg">{quizSet.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{quizSet.questions.length}</div>
              <div className="text-sm text-blue-700">題目數量</div>
            </div>
            
            {quizSet.time_limit && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{quizSet.time_limit}</div>
                <div className="text-sm text-green-700">分鐘限制</div>
              </div>
            )}
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{quizSet.passing_score}%</div>
              <div className="text-sm text-purple-700">及格分數</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {quizSet.user_attempt_count || 0}/{quizSet.max_attempts}
              </div>
              <div className="text-sm text-orange-700">已使用次數</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-yellow-900 mb-2">注意事項</h3>
            <ul className="text-sm text-yellow-800 space-y-1 text-left">
              <li>• 測驗開始後無法暫停</li>
              <li>• 請確保網路連線穩定</li>
              <li>• 可以返回修改之前的答案</li>
              {quizSet.time_limit && <li>• 時間到會自動提交</li>}
              <li>• 每題請仔細閱讀後再作答</li>
            </ul>
          </div>

          {quizSet.can_take_quiz !== false ? (
            <button
              onClick={startQuiz}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              開始測驗
            </button>
          ) : (
            <div className="text-center">
              <button
                disabled
                className="bg-gray-400 text-gray-600 px-8 py-4 rounded-lg cursor-not-allowed font-medium text-lg mb-4"
              >
                已達嘗試次數上限
              </button>
              <p className="text-red-600 text-sm">
                您已使用完所有嘗試次數 ({quizSet.max_attempts} 次)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 測驗結果頁面
  if (quizStatus === 'completed' && showResults) {
    const passed = score ? score >= quizSet.passing_score : false;
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          {passed ? (
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          ) : (
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">測驗完成</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{score}%</div>
              <div className="text-sm text-blue-700">您的分數</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  let correctCount = 0;
                  let totalPossiblePoints = 0;
                  let earnedPoints = 0;
                  
                  quizSet.questions.forEach(question => {
                    totalPossiblePoints += question.points;
                    const userAnswer = answers[question.id];
                    if (!userAnswer) return;
                    
                    let isCorrect = false;
                    if (question.question_type === 'single') {
                      const correctOption = question.options?.find(opt => opt.is_correct);
                      isCorrect = userAnswer.selectedOptions?.[0] === correctOption?.option_label;
                    } else if (question.question_type === 'multiple') {
                      const correctOptions = question.options?.filter(opt => opt.is_correct).map(opt => opt.option_label) || [];
                      const userSelections = userAnswer.selectedOptions || [];
                      isCorrect = correctOptions.length === userSelections.length &&
                                 correctOptions.every(opt => userSelections.includes(opt));
                    } else if (question.question_type === 'fill') {
                      const correctAnswer = question.fill_answers?.[0]?.correct_answer?.toLowerCase().trim();
                      const userText = userAnswer.textAnswer?.toLowerCase().trim();
                      isCorrect = correctAnswer === userText;
                    }
                    
                    if (isCorrect) {
                      correctCount++;
                      earnedPoints += question.points;
                    }
                  });
                  
                  return `${earnedPoints}/${totalPossiblePoints}`;
                })()}
              </div>
              <div className="text-sm text-purple-700">得分/總分</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{getAnsweredCount()}/{quizSet.questions.length}</div>
              <div className="text-sm text-gray-700">完成題數</div>
            </div>
            
            <div className={`p-4 rounded-lg ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? '通過' : '未通過'}
              </div>
              <div className={`text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
                及格標準 {quizSet.passing_score}%
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-4 mb-8 ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`font-medium ${passed ? 'text-green-900' : 'text-red-900'}`}>
              {passed 
                ? '恭喜您通過測驗！您已經掌握了本章節的重點內容。'
                : `很遺憾未能通過測驗。建議您複習相關內容後再次嘗試。`
              }
            </p>
          </div>

          {/* 🔧 顯示正確答案（如果設定允許） */}
          {quizSet.show_correct_answers && (
            <div className="text-left mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">答案解析</h3>
              {quizSet.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                let isCorrect = false;
                let userAnswerText = '';
                
                // 判斷答案是否正確並獲取用戶答案文字
                if (question.question_type === 'single') {
                  const correctOption = question.options?.find(opt => opt.is_correct);
                  const userOption = question.options?.find(opt => opt.option_label === userAnswer?.selectedOptions?.[0]);
                  userAnswerText = userOption ? `${userOption.option_label} - ${userOption.option_text}` : '未作答';
                  isCorrect = userAnswer?.selectedOptions?.[0] === correctOption?.option_label;
                } else if (question.question_type === 'multiple') {
                  const correctOptions = question.options?.filter(opt => opt.is_correct).map(opt => opt.option_label) || [];
                  const userSelections = userAnswer?.selectedOptions || [];
                  const userOptions = question.options?.filter(opt => userSelections.includes(opt.option_label));
                  userAnswerText = userOptions && userOptions.length > 0 
                    ? userOptions.map(opt => `${opt.option_label} - ${opt.option_text}`).join(', ')
                    : '未作答';
                  isCorrect = correctOptions.length === userSelections.length &&
                             correctOptions.every(opt => userSelections.includes(opt));
                } else if (question.question_type === 'fill') {
                  userAnswerText = userAnswer?.textAnswer || '未作答';
                  const correctAnswer = question.fill_answers?.[0]?.correct_answer?.toLowerCase().trim();
                  const userText = userAnswer?.textAnswer?.toLowerCase().trim();
                  isCorrect = correctAnswer === userText;
                }
                
                return (
                  <div key={question.id} className={`mb-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900 flex-1">
                        第 {index + 1} 題：{question.question_text}
                      </p>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-gray-600">
                          {isCorrect ? `+${question.points}` : '0'} / {question.points} 分
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isCorrect ? '正確' : '錯誤'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 顯示用戶答案 */}
                    <div className="mb-2">
                      <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        <span className="font-medium">您的答案：</span>{userAnswerText}
                      </p>
                    </div>
                    
                    {/* 顯示正確答案 */}
                    {!isCorrect && (
                      <div>
                        {question.question_type === 'single' && (
                          <p className="text-sm text-green-700">
                            <span className="font-medium">正確答案：</span>
                            {question.options?.find(opt => opt.is_correct)?.option_label} - {question.options?.find(opt => opt.is_correct)?.option_text}
                          </p>
                        )}
                        {question.question_type === 'multiple' && (
                          <p className="text-sm text-green-700">
                            <span className="font-medium">正確答案：</span>
                            {question.options?.filter(opt => opt.is_correct).map(opt => `${opt.option_label} - ${opt.option_text}`).join(', ')}
                          </p>
                        )}
                        {question.question_type === 'fill' && (
                          <p className="text-sm text-green-700">
                            <span className="font-medium">正確答案：</span>
                            {question.fill_answers?.[0]?.correct_answer}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* 顯示解釋（如果有） */}
                    {question.explanation && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">解釋：</span>{question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-x-4">
            <button
              onClick={() => {
                // 清除快取並回到測驗列表
                window.location.href = '/quiz?refresh=' + Date.now();
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              回到測驗列表
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回課程
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 測驗進行中
  const currentQuestion = quizSet.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 頂部資訊欄 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{quizSet.title}</h1>
            <p className="text-sm text-gray-600">
              第 {currentQuestionIndex + 1} 題，共 {quizSet.questions.length} 題
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              已答 {getAnsweredCount()}/{quizSet.questions.length}
            </div>
          </div>
        </div>

        {/* 進度條 */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quizSet.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 題目內容 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-600">
                第 {currentQuestion.question_number} 題
              </span>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {currentQuestion.question_type === 'single' && '單選題'}
                {currentQuestion.question_type === 'multiple' && '複選題'}
                {currentQuestion.question_type === 'fill' && '填空題'}
                {currentQuestion.question_type === 'essay' && '問答題'}
              </span>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.question_text}
            </h2>
          </div>
          <span className="text-sm text-gray-500">{currentQuestion.points} 分</span>
        </div>

        {/* 圖片 */}
        {currentQuestion.image_url && (
          <div className="mb-6">
            <img 
              src={currentQuestion.image_url} 
              alt="題目圖片"
              className="max-w-full h-auto rounded-lg border border-gray-200"
              onLoad={() => console.log('圖片載入成功:', currentQuestion.image_url)}
              onError={() => console.error('圖片載入失敗:', currentQuestion.image_url)}
            />
          </div>
        )}

        {/* 選擇題選項 */}
        {['single', 'multiple'].includes(currentQuestion.question_type) && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type={currentQuestion.question_type === 'single' ? 'radio' : 'checkbox'}
                  name={`question_${currentQuestion.id}`}
                  checked={
                    currentQuestion.question_type === 'single'
                      ? currentAnswer?.selectedOptions?.[0] === option.option_label
                      : currentAnswer?.selectedOptions?.includes(option.option_label) || false
                  }
                  onChange={() => {
                    if (currentQuestion.question_type === 'single') {
                      handleSingleChoice(currentQuestion.id, option.option_label);
                    } else {
                      handleMultipleChoice(currentQuestion.id, option.option_label);
                    }
                  }}
                  className="mr-3"
                />
                <span className="font-medium text-gray-700 mr-3">{option.option_label}.</span>
                <span className="text-gray-900">{option.option_text}</span>
              </label>
            ))}
          </div>
        )}

        {/* 填空題和問答題 */}
        {['fill', 'essay'].includes(currentQuestion.question_type) && (
          <div>
            <textarea
              value={currentAnswer?.textAnswer || ''}
              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
              placeholder={
                currentQuestion.question_type === 'fill' 
                  ? '請輸入答案...' 
                  : '請輸入您的回答...'
              }
              rows={currentQuestion.question_type === 'essay' ? 6 : 3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* 導航按鈕 */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>上一題</span>
        </button>

        <div className="flex space-x-4">
          {currentQuestionIndex === quizSet.questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              提交測驗
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>下一題</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQuizPage;