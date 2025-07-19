'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, Award, Clock, Calendar, Download, Filter } from 'lucide-react';

interface QuizAnalytics {
  quizPerformance: Array<{
    name: string;
    attempts: number;
    passRate: number;
    averageScore: number;
  }>;
  timeDistribution: Array<{
    timeRange: string;
    count: number;
  }>;
  scoreDistribution: Array<{
    scoreRange: string;
    count: number;
  }>;
  dailyAttempts: Array<{
    date: string;
    attempts: number;
    passed: number;
  }>;
  topPerformers: Array<{
    name: string;
    averageScore: number;
    completedQuizzes: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const QuizAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');

  const quizOptions = [
    { value: 'all', label: '所有測驗' },
    { value: 'quiz_001', label: '第一章測驗' },
    { value: 'quiz_002', label: 'JavaScript 基礎' },
    { value: 'quiz_003', label: 'React 進階' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedQuiz]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // 模擬分析資料
      const mockAnalytics: QuizAnalytics = {
        quizPerformance: [
          { name: '第一章測驗', attempts: 45, passRate: 78, averageScore: 82 },
          { name: 'JavaScript 基礎', attempts: 38, passRate: 65, averageScore: 75 },
          { name: 'React 進階', attempts: 22, passRate: 85, averageScore: 88 },
          { name: 'Node.js 後端', attempts: 15, passRate: 60, averageScore: 71 }
        ],
        timeDistribution: [
          { timeRange: '0-10分', count: 8 },
          { timeRange: '10-20分', count: 25 },
          { timeRange: '20-30分', count: 35 },
          { timeRange: '30-40分', count: 20 },
          { timeRange: '40-50分', count: 8 },
          { timeRange: '50分以上', count: 4 }
        ],
        scoreDistribution: [
          { scoreRange: '0-40', count: 12 },
          { scoreRange: '40-60', count: 18 },
          { scoreRange: '60-80', count: 35 },
          { scoreRange: '80-90', count: 25 },
          { scoreRange: '90-100', count: 10 }
        ],
        dailyAttempts: [
          { date: '01/15', attempts: 12, passed: 9 },
          { date: '01/16', attempts: 15, passed: 11 },
          { date: '01/17', attempts: 8, passed: 6 },
          { date: '01/18', attempts: 20, passed: 16 },
          { date: '01/19', attempts: 18, passed: 13 },
          { date: '01/20', attempts: 22, passed: 18 },
          { date: '01/21', attempts: 16, passed: 14 },
          { date: '01/22', attempts: 25, passed: 19 },
          { date: '01/23', attempts: 19, passed: 15 },
          { date: '01/24', attempts: 14, passed: 12 }
        ],
        topPerformers: [
          { name: '張小美', averageScore: 95, completedQuizzes: 4 },
          { name: '王小明', averageScore: 88, completedQuizzes: 3 },
          { name: '李小華', averageScore: 82, completedQuizzes: 4 },
          { name: '陳小龍', averageScore: 79, completedQuizzes: 2 },
          { name: '林小芳', averageScore: 76, completedQuizzes: 3 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('載入分析資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // 模擬匯出功能
    console.log('匯出統計報告', { selectedPeriod, selectedQuiz, analytics });
    alert('統計報告已匯出（模擬功能）');
  };

  const calculateOverallStats = () => {
    if (!analytics) return { totalAttempts: 0, averagePassRate: 0, totalUsers: 0, averageScore: 0 };
    
    const totalAttempts = analytics.quizPerformance.reduce((sum, quiz) => sum + quiz.attempts, 0);
    const averagePassRate = analytics.quizPerformance.reduce((sum, quiz) => sum + quiz.passRate, 0) / analytics.quizPerformance.length;
    const totalUsers = analytics.topPerformers.length;
    const averageScore = analytics.quizPerformance.reduce((sum, quiz) => sum + quiz.averageScore, 0) / analytics.quizPerformance.length;
    
    return {
      totalAttempts,
      averagePassRate: Math.round(averagePassRate),
      totalUsers,
      averageScore: Math.round(averageScore)
    };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">載入統計資料中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const overallStats = calculateOverallStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="mr-3 h-8 w-8" />
          測驗統計分析
        </h1>
        <p className="text-gray-600 mt-2">深入了解測驗表現和學員學習狀況</p>
      </div>

      {/* 篩選器 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">時間範圍：</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">近一週</option>
              <option value="month">近一個月</option>
              <option value="quarter">近三個月</option>
              <option value="year">近一年</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">測驗：</label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {quizOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={exportReport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>匯出報告</span>
            </button>
          </div>
        </div>
      </div>

      {/* 總覽統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">總測驗次數</p>
              <p className="text-2xl font-bold text-blue-900">{overallStats.totalAttempts}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">平均通過率</p>
              <p className="text-2xl font-bold text-green-900">{overallStats.averagePassRate}%</p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">參與學員</p>
              <p className="text-2xl font-bold text-purple-900">{overallStats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">平均分數</p>
              <p className="text-2xl font-bold text-orange-900">{overallStats.averageScore}分</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 圖表區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測驗表現 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">各測驗表現分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.quizPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attempts" fill="#3B82F6" name="嘗試次數" />
              <Bar dataKey="passRate" fill="#10B981" name="通過率%" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 分數分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">分數分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.scoreDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ scoreRange, count }) => `${scoreRange}: ${count}`}
              >
                {analytics.scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 每日測驗趨勢 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">每日測驗趨勢</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.dailyAttempts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="attempts" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="總嘗試" />
              <Area type="monotone" dataKey="passed" stackId="2" stroke="#10B981" fill="#10B981" name="通過數" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 作答時間分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">作答時間分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.timeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeRange" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" name="人數" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 優秀學員排行 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">優秀學員排行榜</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  學員姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均分數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  完成測驗數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  表現評級
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topPerformers.map((performer, index) => (
                <tr key={performer.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{performer.averageScore}分</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{performer.completedQuizzes} 個</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      performer.averageScore >= 90 ? 'bg-green-100 text-green-800' :
                      performer.averageScore >= 80 ? 'bg-blue-100 text-blue-800' :
                      performer.averageScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {performer.averageScore >= 90 ? '優秀' :
                       performer.averageScore >= 80 ? '良好' :
                       performer.averageScore >= 70 ? '普通' : '需改進'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳細分析洞察 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">分析洞察</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">關鍵發現</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-green-500">●</span>
                <span>React 進階測驗的通過率最高（85%），顯示學員對進階概念掌握良好</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500">●</span>
                <span>大部分學員的作答時間集中在 20-30 分鐘，符合預期時間範圍</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500">●</span>
                <span>60-80 分的分數區間人數最多，整體表現穩定</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">改進建議</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-red-500">●</span>
                <span>JavaScript 基礎測驗通過率較低，建議增加練習題目</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500">●</span>
                <span>考慮為高分學員提供進階挑戰內容</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500">●</span>
                <span>增加互動式學習資源以提升整體參與度</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAnalyticsPage;