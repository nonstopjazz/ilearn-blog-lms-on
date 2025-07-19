'use client';

import React, { useState, useEffect } from 'react';
import { Award, Calendar, Clock, BookOpen, BarChart3, TrendingUp, CheckCircle, XCircle, Eye } from 'lucide-react';

interface QuizAttempt {
  id: string;
  quiz_set_id: string;
  attempt_number: number;
  completed_at: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  is_passed: boolean;
  time_spent: number;
  quiz_sets?: {
    id: string;
    title: string;
    passing_score: number;
  };
}

interface StudentStats {
  totalQuizzes: number;
  passedQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  passRate: number;
}

const StudentResultsPage: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalQuizzes: 0,
    passedQuizzes: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    passRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    fetchStudentResults();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [attempts, selectedPeriod]);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      
      // 模擬學員的測驗記錄
      const mockAttempts: QuizAttempt[] = [
        {
          id: 'att_001',
          quiz_set_id: 'quiz_001',
          attempt_number: 1,
          completed_at: '2024-01-15T10:30:00Z',
          total_score: 85,
          max_possible_score: 100,
          percentage_score: 85,
          is_passed: true,
          time_spent: 1200,
          quiz_sets: {
            id: 'quiz_001',
            title: '第一章測驗',
            passing_score: 60
          }
        },
        {
          id: 'att_002',
          quiz_set_id: 'quiz_002',
          attempt_number: 1,
          completed_at: '2024-01-20T14:15:00Z',
          total_score: 45,
          max_possible_score: 100,
          percentage_score: 45,
          is_passed: false,
          time_spent: 900,
          quiz_sets: {
            id: 'quiz_002',
            title: 'JavaScript 基礎',
            passing_score: 60
          }
        },
        {
          id: 'att_003',
          quiz_set_id: 'quiz_002',
          attempt_number: 2,
          completed_at: '2024-01-22T16:45:00Z',
          total_score: 72,
          max_possible_score: 100,
          percentage_score: 72,
          is_passed: true,
          time_spent: 1050,
          quiz_sets: {
            id: 'quiz_002',
            title: 'JavaScript 基礎',
            passing_score: 60
          }
        },
        {
          id: 'att_004',
          quiz_set_id: 'quiz_003',
          attempt_number: 1,
          completed_at: '2024-01-25T09:20:00Z',
          total_score: 92,
          max_possible_score: 100,
          percentage_score: 92,
          is_passed: true,
          time_spent: 1400,
          quiz_sets: {
            id: 'quiz_003',
            title: 'React 進階',
            passing_score: 70
          }
        }
      ];

      setAttempts(mockAttempts);
    } catch (error) {
      console.error('載入成績失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let filteredAttempts = attempts;

    // 根據時間篩選
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filteredAttempts = attempts.filter(attempt => 
        new Date(attempt.completed_at) >= filterDate
      );
    }

    // 只計算每個測驗的最好成績
    const bestAttempts = new Map();
    filteredAttempts.forEach(attempt => {
      const existing = bestAttempts.get(attempt.quiz_set_id);
      if (!existing || attempt.percentage_score > existing.percentage_score) {
        bestAttempts.set(attempt.quiz_set_id, attempt);
      }
    });

    const bestResults = Array.from(bestAttempts.values());
    
    const totalQuizzes = bestResults.length;
    const passedQuizzes = bestResults.filter(att => att.is_passed).length;
    const averageScore = totalQuizzes > 0 
      ? bestResults.reduce((sum, att) => sum + att.percentage_score, 0) / totalQuizzes 
      : 0;
    const totalTimeSpent = filteredAttempts.reduce((sum, att) => sum + att.time_spent, 0);
    const passRate = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 0;

    setStats({
      totalQuizzes,
      passedQuizzes,
      averageScore: Math.round(averageScore * 10) / 10,
      totalTimeSpent,
      passRate: Math.round(passRate * 10) / 10
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      if (score >= 90) return 'text-green-600';
      if (score >= 80) return 'text-blue-600';
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getScoreBadge = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      if (score >= 90) return { label: '優秀', class: 'bg-green-100 text-green-800' };
      if (score >= 80) return { label: '良好', class: 'bg-blue-100 text-blue-800' };
      return { label: '及格', class: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: '不及格', class: 'bg-red-100 text-red-800' };
  };

  // 取得每個測驗的最佳成績
  const getBestAttempts = () => {
    const bestAttempts = new Map();
    attempts.forEach(attempt => {
      const existing = bestAttempts.get(attempt.quiz_set_id);
      if (!existing || attempt.percentage_score > existing.percentage_score) {
        bestAttempts.set(attempt.quiz_set_id, attempt);
      }
    });
    return Array.from(bestAttempts.values()).sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">載入您的成績中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Award className="mr-3 h-8 w-8" />
          我的測驗成績
        </h1>
        <p className="text-gray-600 mt-2">查看您的學習成果和進度</p>
      </div>

      {/* 時間篩選 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">時間範圍：</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部時間</option>
            <option value="week">近一週</option>
            <option value="month">近一個月</option>
            <option value="quarter">近三個月</option>
          </select>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">完成測驗</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalQuizzes}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">通過測驗</p>
              <p className="text-2xl font-bold text-green-900">{stats.passedQuizzes}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">平均分數</p>
              <p className="text-2xl font-bold text-purple-900">{stats.averageScore}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">通過率</p>
              <p className="text-2xl font-bold text-orange-900">{stats.passRate}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 學習時間統計 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          學習時間統計
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalTimeSpent)}</p>
            <p className="text-sm text-gray-600">總學習時間</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalQuizzes > 0 ? formatDuration(Math.round(stats.totalTimeSpent / stats.totalQuizzes)) : '0m'}
            </p>
            <p className="text-sm text-gray-600">平均每次時間</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
            <p className="text-sm text-gray-600">總測驗次數</p>
          </div>
        </div>
      </div>

      {/* 測驗成績列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">測驗成績記錄</h2>
          <p className="text-sm text-gray-600 mt-1">顯示每個測驗的最佳成績</p>
        </div>

        {getBestAttempts().length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">尚未完成任何測驗</h3>
            <p className="text-gray-600">開始學習並完成測驗來查看您的成績</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getBestAttempts().map((attempt) => {
              const badge = getScoreBadge(attempt.percentage_score, attempt.quiz_sets?.passing_score || 60);
              
              return (
                <div key={`${attempt.quiz_set_id}-best`} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {attempt.quiz_sets?.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                          {badge.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">分數</p>
                          <p className={`font-medium ${getScoreColor(attempt.percentage_score, attempt.quiz_sets?.passing_score || 60)}`}>
                            {attempt.percentage_score}% ({attempt.total_score}/{attempt.max_possible_score})
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">完成時間</p>
                          <p className="text-gray-900">{formatDate(attempt.completed_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">花費時間</p>
                          <p className="text-gray-900">{formatDuration(attempt.time_spent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">狀態</p>
                          <div className="flex items-center space-x-1">
                            {attempt.is_passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={attempt.is_passed ? 'text-green-600' : 'text-red-600'}>
                              {attempt.is_passed ? '通過' : '未通過'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => window.location.href = `/quiz/${attempt.quiz_set_id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>重新測驗</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 所有測驗記錄 */}
      {attempts.length > getBestAttempts().length && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">完整測驗歷史</h2>
            <p className="text-sm text-gray-600 mt-1">包含所有測驗嘗試記錄</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {attempt.quiz_sets?.title}
                      </h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        嘗試 #{attempt.attempt_number}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>{attempt.percentage_score}%</div>
                      <div>{formatDate(attempt.completed_at)}</div>
                      <div>{formatDuration(attempt.time_spent)}</div>
                      <div className="flex items-center space-x-1">
                        {attempt.is_passed ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className={attempt.is_passed ? 'text-green-600' : 'text-red-600'}>
                          {attempt.is_passed ? '通過' : '未通過'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;