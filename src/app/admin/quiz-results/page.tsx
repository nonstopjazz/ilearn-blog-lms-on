'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Award, Calendar, Eye, Download, Filter, Search, CheckCircle, XCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface QuizSet {
  id: string;
  title: string;
  passing_score: number;
}

interface QuizAttempt {
  id: string;
  quiz_set_id: string;
  user_id: string;
  attempt_number: number;
  completed_at: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  is_passed: boolean;
  time_spent: number;
  status: string;
  quiz_sets?: QuizSet;
  students?: Student;
}

interface QuizStats {
  totalAttempts: number;
  passedAttempts: number;
  averageScore: number;
  passRate: number;
}

const QuizResultsManagement: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalAttempts: 0,
    passedAttempts: 0,
    averageScore: 0,
    passRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterQuiz, setFilterQuiz] = useState<string>('all');
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 模擬測驗列表
  const quizSets = [
    { id: 'quiz_001', title: '第一章測驗' },
    { id: 'quiz_002', title: 'JavaScript 基礎' },
    { id: 'quiz_003', title: 'React 進階' }
  ];

  useEffect(() => {
    fetchAttempts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attempts, searchTerm, filterStatus, filterQuiz]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      
      // 模擬 API 資料
      const mockAttempts: QuizAttempt[] = [
        {
          id: 'att_001',
          quiz_set_id: 'quiz_001',
          user_id: 'user_001',
          attempt_number: 1,
          completed_at: '2024-01-15T10:30:00Z',
          total_score: 85,
          max_possible_score: 100,
          percentage_score: 85,
          is_passed: true,
          time_spent: 1200,
          status: 'completed',
          quiz_sets: { id: 'quiz_001', title: '第一章測驗', passing_score: 60 },
          students: { id: 'user_001', name: '王小明', email: 'wang@example.com' }
        },
        {
          id: 'att_002',
          quiz_set_id: 'quiz_002',
          user_id: 'user_002',
          attempt_number: 1,
          completed_at: '2024-01-15T14:15:00Z',
          total_score: 45,
          max_possible_score: 100,
          percentage_score: 45,
          is_passed: false,
          time_spent: 900,
          status: 'completed',
          quiz_sets: { id: 'quiz_002', title: 'JavaScript 基礎', passing_score: 60 },
          students: { id: 'user_002', name: '李小華', email: 'li@example.com' }
        },
        {
          id: 'att_003',
          quiz_set_id: 'quiz_001',
          user_id: 'user_003',
          attempt_number: 1,
          completed_at: '2024-01-16T09:45:00Z',
          total_score: 92,
          max_possible_score: 100,
          percentage_score: 92,
          is_passed: true,
          time_spent: 1050,
          status: 'completed',
          quiz_sets: { id: 'quiz_001', title: '第一章測驗', passing_score: 60 },
          students: { id: 'user_003', name: '張小美', email: 'zhang@example.com' }
        },
        {
          id: 'att_004',
          quiz_set_id: 'quiz_003',
          user_id: 'user_001',
          attempt_number: 2,
          completed_at: '2024-01-16T16:20:00Z',
          total_score: 78,
          max_possible_score: 100,
          percentage_score: 78,
          is_passed: true,
          time_spent: 1400,
          status: 'completed',
          quiz_sets: { id: 'quiz_003', title: 'React 進階', passing_score: 70 },
          students: { id: 'user_001', name: '王小明', email: 'wang@example.com' }
        }
      ];

      setAttempts(mockAttempts);
      calculateStats(mockAttempts);
      
    } catch (error) {
      console.error('載入成績失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attemptData: QuizAttempt[]) => {
    const totalAttempts = attemptData.length;
    const passedAttempts = attemptData.filter(att => att.is_passed).length;
    const averageScore = totalAttempts > 0 
      ? attemptData.reduce((sum, att) => sum + att.percentage_score, 0) / totalAttempts 
      : 0;
    const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

    setStats({
      totalAttempts,
      passedAttempts,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10
    });
  };

  const applyFilters = () => {
    let filtered = attempts;

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(attempt => 
        attempt.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.students?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.quiz_sets?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 狀態篩選
    if (filterStatus !== 'all') {
      filtered = filtered.filter(attempt => 
        filterStatus === 'passed' ? attempt.is_passed : !attempt.is_passed
      );
    }

    // 測驗篩選
    if (filterQuiz !== 'all') {
      filtered = filtered.filter(attempt => attempt.quiz_set_id === filterQuiz);
    }

    setFilteredAttempts(filtered);
    calculateStats(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const exportResults = () => {
    // 模擬匯出功能
    const csvContent = filteredAttempts.map(attempt => ({
      學員姓名: attempt.students?.name,
      信箱: attempt.students?.email,
      測驗名稱: attempt.quiz_sets?.title,
      完成時間: formatDate(attempt.completed_at),
      分數: attempt.percentage_score,
      是否通過: attempt.is_passed ? '通過' : '未通過',
      花費時間: formatDuration(attempt.time_spent)
    }));

    console.log('匯出資料:', csvContent);
    alert('成績資料已匯出（模擬功能）');
  };

  const viewDetailedResults = (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">載入成績資料中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="mr-3 h-8 w-8" />
          測驗成績管理
        </h1>
        <p className="text-gray-600 mt-2">查看和管理所有測驗成績</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">總測驗次數</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalAttempts}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">通過次數</p>
              <p className="text-2xl font-bold text-green-900">{stats.passedAttempts}</p>
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
            <Award className="h-8 w-8 text-purple-600" />
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

      {/* 篩選和搜尋 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋學員姓名或測驗..."
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">狀態</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部</option>
              <option value="passed">通過</option>
              <option value="failed">未通過</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">測驗</label>
            <select
              value={filterQuiz}
              onChange={(e) => setFilterQuiz(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部測驗</option>
              {quizSets.map(quiz => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportResults}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>匯出結果</span>
            </button>
          </div>
        </div>
      </div>

      {/* 成績列表 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            測驗成績列表 ({filteredAttempts.length} 筆記錄)
          </h2>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到成績記錄</h3>
            <p className="text-gray-600">請調整篩選條件或確認是否有學員完成測驗</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    學員資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    測驗名稱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    完成時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分數
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    花費時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.students?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attempt.students?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{attempt.quiz_sets?.title}</div>
                      <div className="text-sm text-gray-500">嘗試 #{attempt.attempt_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(attempt.completed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.percentage_score}% ({attempt.total_score}/{attempt.max_possible_score})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attempt.is_passed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          通過
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          未通過
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(attempt.time_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewDetailedResults(attempt)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>查看詳情</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 詳細結果彈窗 */}
      {showDetailModal && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">測驗詳細結果</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">學員姓名</label>
                    <p className="text-lg text-gray-900">{selectedAttempt.students?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">測驗名稱</label>
                    <p className="text-lg text-gray-900">{selectedAttempt.quiz_sets?.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">完成時間</label>
                    <p className="text-lg text-gray-900">{formatDate(selectedAttempt.completed_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">花費時間</label>
                    <p className="text-lg text-gray-900">{formatDuration(selectedAttempt.time_spent)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">成績摘要</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{selectedAttempt.percentage_score}%</p>
                      <p className="text-sm text-gray-600">總分</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">
                        {selectedAttempt.total_score}/{selectedAttempt.max_possible_score}
                      </p>
                      <p className="text-sm text-gray-600">得分</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${selectedAttempt.is_passed ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedAttempt.is_passed ? '通過' : '未通過'}
                      </p>
                      <p className="text-sm text-gray-600">
                        及格線: {selectedAttempt.quiz_sets?.passing_score}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 詳細答題記錄需要連接真實的資料庫資料才能顯示
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultsManagement;