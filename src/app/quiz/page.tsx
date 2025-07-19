'use client';

import React, { useState, useEffect } from 'react';
import { Clock, FileText, Users, Award, ChevronRight, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar'; // 🔧 添加統一導航組件

interface Course {
  id: string;
  title: string;
}

interface QuizSet {
  id: string;
  title: string;
  description?: string;
  time_limit?: number;
  max_attempts: number;
  passing_score: number;
  created_at: string;
  courses?: Course;
  _count?: {
    questions: number;
  };
  // 新增使用者嘗試相關欄位
  user_attempt_count?: number;
  remaining_attempts?: number;
  can_take_quiz?: boolean;
}

const QuizListPage: React.FC = () => {
  // 🔧 修復：使用 Supabase Auth 用戶狀態管理
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  // 模擬課程資料
  const courses = [
    { id: 'course_001', title: 'React 基礎課程' },
    { id: 'course_002', title: 'JavaScript 進階' },
    { id: 'course_003', title: 'Node.js 後端開發' }
  ];

  // 🔧 修復：Supabase Auth 認證檢查
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        
        // 檢查當前用戶
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // 監聽認證狀態變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setUserLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    fetchQuizSets();
  }, [selectedCourse]);

  // 🔧 修復：Supabase Auth 登出處理
  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const fetchQuizSets = async () => {
    try {
      setLoading(true);
      
      let url = '/api/quiz/create';
      const params = new URLSearchParams();
      
      if (selectedCourse) {
        params.append('courseId', selectedCourse);
      }
      
      if (user?.id) {
        params.append('userId', user.id);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入失敗');
      }

      // 獲取每個測驗的真實題目數量
      const quizSetsWithCount = await Promise.all(
        result.quizSets.map(async (quiz: QuizSet) => {
          try {
            const { supabase } = await import('@/lib/supabase');
            const { count } = await supabase
              .from('quiz_questions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_set_id', quiz.id);
            
            return {
              ...quiz,
              _count: {
                questions: count || 0
              }
            };
          } catch (error) {
            console.error(`獲取測驗 ${quiz.id} 題目數量失敗:`, error);
            return {
              ...quiz,
              _count: {
                questions: 0
              }
            };
          }
        })
      );

      setQuizSets(quizSetsWithCount);
    } catch (error) {
      console.error('載入測驗列表失敗:', error);
      setError(error instanceof Error ? error.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return '無限制';
    if (minutes < 60) return `${minutes} 分鐘`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} 小時 ${remainingMinutes} 分鐘` : `${hours} 小時`;
  };

  // 🔧 修復：處理開始測驗的點擊事件
  const handleStartQuiz = (quizId: string) => {
    if (!user) {
      // 如果未登入，重定向到登入頁面，並在登入後回到此測驗
      window.location.href = `/auth?redirect=/quiz/${quizId}`;
    } else {
      // 如果已登入，直接前往測驗
      window.location.href = `/quiz/${quizId}`;
    }
  };

  // 🔧 移除強制重定向：允許訪客瀏覽測驗列表
  // 移除了原本的強制重定向邏輯，改為訪客友善設計

  // 如果還在檢查認證狀態，顯示載入
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">檢查登入狀態中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 🔧 統一導航列 */}
        <Navbar user={user} onSignOut={handleSignOut} />
        
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">載入測驗列表中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 🔧 統一導航列 */}
        <Navbar user={user} onSignOut={handleSignOut} />
        
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">載入失敗</div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchQuizSets}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔧 統一導航列 */}
      <Navbar user={user} onSignOut={handleSignOut} />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* 頁面標題 */}
        <div className="border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 h-8 w-8" />
            可用測驗
          </h1>
          <p className="text-gray-600 mt-2">
            選擇測驗開始學習評估
            {!user && (
              <span className="ml-2 text-blue-600 font-medium">
                (需要登入才能開始測驗)
              </span>
            )}
          </p>
        </div>

        {/* 篩選器 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">篩選課程：</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有課程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            
            <div className="ml-auto text-sm text-gray-600">
              找到 {quizSets.length} 個測驗
            </div>
          </div>
        </div>

        {/* 測驗列表 */}
        {quizSets.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到測驗</h3>
            <p className="text-gray-600">
              {selectedCourse ? '此課程暫無可用測驗' : '暫無可用測驗'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quizSets.map((quiz) => (
              <div key={quiz.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                {/* 測驗標題和課程 */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {quiz.courses?.title || '未知課程'}
                    </span>
                  </div>
                  
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                  )}

                  <div className="text-xs text-gray-500">
                    建立於 {formatDate(quiz.created_at)}
                  </div>
                </div>

                {/* 測驗統計 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">題目數量</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-900">
                      {quiz._count?.questions || 0} 題
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">時間限制</span>
                    </div>
                    <div className="text-lg font-semibold text-green-900">
                      {formatTimeLimit(quiz.time_limit)}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700">及格分數</span>
                    </div>
                    <div className="text-lg font-semibold text-purple-900">
                      {quiz.passing_score}%
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-700">嘗試次數</span>
                    </div>
                    <div className="text-lg font-semibold text-orange-900">
                      {user && quiz.user_attempt_count !== undefined 
                        ? `${quiz.user_attempt_count} / ${quiz.max_attempts}`
                        : quiz.max_attempts === 1 ? '1 次' : `${quiz.max_attempts} 次`}
                    </div>
                    {user && quiz.remaining_attempts !== undefined && quiz.remaining_attempts > 0 && (
                      <div className="text-xs text-orange-700 mt-1">
                        剩餘 {quiz.remaining_attempts} 次
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔧 修復：開始測驗按鈕 - 根據登入狀態顯示不同文字 */}
                <button
                  onClick={() => handleStartQuiz(quiz.id)}
                  disabled={user && quiz.can_take_quiz === false}
                  className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 group transition-colors ${
                    user && quiz.can_take_quiz === false
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : user 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <span>
                    {user && quiz.can_take_quiz === false 
                      ? '已達嘗試次數上限' 
                      : user 
                      ? '開始測驗' 
                      : '登入後開始測驗'}
                  </span>
                  {(!user || quiz.can_take_quiz !== false) && (
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                {/* 測驗 ID（用於調試） */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400 font-mono">
                    測驗 ID: {quiz.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🔧 修復：管理員快捷連結 - 只在用戶登入且為管理員時顯示 */}
        {user && user.role === 'admin' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">管理員功能</p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.href = '/admin/quiz-create'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  建立新測驗
                </button>
                <button
                  onClick={() => window.location.href = '/admin/quiz-upload'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  批量上傳測驗
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizListPage;