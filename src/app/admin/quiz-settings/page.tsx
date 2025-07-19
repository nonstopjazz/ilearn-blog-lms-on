'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Clock, Users, Eye, EyeOff, Calendar, Save, Edit, Trash2, Plus } from 'lucide-react';

interface QuizSettings {
  id: string;
  title: string;
  description?: string;
  time_limit?: number;
  max_attempts: number;
  passing_score: number;
  randomize_questions: boolean;
  show_results: boolean;
  show_correct_answers: boolean;
  available_from?: string;
  available_until?: string;
  is_active: boolean;
  created_at: string;
  course_id: string;
  courses?: {
    id: string;
    title: string;
  };
}

const QuizSettingsPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSettings[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // 🔧 修改：從 API 獲取真實資料
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/quiz/create');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入失敗');
      }

      // 轉換資料格式以符合原本的介面
      const transformedQuizzes = result.quizSets.map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit,
        max_attempts: quiz.max_attempts,
        passing_score: quiz.passing_score,
        randomize_questions: quiz.randomize_questions || false,
        show_results: quiz.show_results || false,
        show_correct_answers: quiz.show_correct_answers || false,
        available_from: quiz.available_from,
        available_until: quiz.available_until,
        is_active: quiz.is_active || false,
        created_at: quiz.created_at,
        course_id: quiz.course_id,
        courses: quiz.courses
      }));

      setQuizzes(transformedQuizzes);
      if (transformedQuizzes.length > 0) {
        setSelectedQuiz(transformedQuizzes[0]);
      }
    } catch (error) {
      console.error('載入測驗設定失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 修改：實際儲存到資料庫
  const handleSaveSettings = async () => {
    if (!selectedQuiz) return;

    try {
      setSaving(true);
      
      // 這裡需要建立一個更新測驗設定的 API 端點
      const response = await fetch(`/api/quiz/update/${selectedQuiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedQuiz.title,
          description: selectedQuiz.description,
          time_limit: selectedQuiz.time_limit,
          max_attempts: selectedQuiz.max_attempts,
          passing_score: selectedQuiz.passing_score,
          randomize_questions: selectedQuiz.randomize_questions,
          show_results: selectedQuiz.show_results,
          show_correct_answers: selectedQuiz.show_correct_answers,
          available_from: selectedQuiz.available_from,
          available_until: selectedQuiz.available_until,
          is_active: selectedQuiz.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('儲存失敗');
      }

      // 更新本地狀態
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === selectedQuiz.id ? selectedQuiz : quiz
      ));
      
      setIsEditing(false);
      alert('設定已儲存！');
    } catch (error) {
      console.error('儲存設定失敗:', error);
      alert('儲存失敗，請重試');
    } finally {
      setSaving(false);
    }
  };

  // 🔧 修改：實際更新資料庫
  const handleToggleActive = async (quizId: string) => {
    try {
      const targetQuiz = quizzes.find(q => q.id === quizId);
      if (!targetQuiz) return;

      const response = await fetch(`/api/quiz/update/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !targetQuiz.is_active
        }),
      });

      if (!response.ok) {
        throw new Error('更新失敗');
      }

      const updatedQuizzes = quizzes.map(quiz => 
        quiz.id === quizId ? { ...quiz, is_active: !quiz.is_active } : quiz
      );
      setQuizzes(updatedQuizzes);
      
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      }
    } catch (error) {
      console.error('切換狀態失敗:', error);
      alert('更新失敗，請重試');
    }
  };

  const updateSelectedQuiz = (updates: Partial<QuizSettings>) => {
    if (selectedQuiz) {
      setSelectedQuiz({ ...selectedQuiz, ...updates });
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">載入測驗設定中...</p>
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
          <Settings className="mr-3 h-8 w-8" />
          測驗設定管理
        </h1>
        <p className="text-gray-600 mt-2">管理測驗的時間限制、嘗試次數和其他設定</p>
      </div>

      {/* 🔧 新增：如果沒有測驗資料的提示 */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有測驗資料</h3>
          <p className="text-gray-600 mb-4">目前沒有任何測驗，請先建立測驗</p>
          <button
            onClick={() => window.location.href = '/admin/quiz-create'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            建立測驗
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 測驗列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">測驗列表</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setIsEditing(false);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedQuiz?.id === quiz.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{quiz.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            quiz.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {quiz.is_active ? '啟用' : '停用'}
                          </span>
                          {quiz.time_limit && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {quiz.time_limit}分鐘
                            </span>
                          )}
                          {quiz.courses && (
                            <span className="text-xs text-blue-600">
                              {quiz.courses.title}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(quiz.id);
                        }}
                        className={`p-1 rounded ${
                          quiz.is_active ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {quiz.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 設定詳情 - 保持原本的邏輯，只是資料來源改為真實資料 */}
          <div className="lg:col-span-2">
            {selectedQuiz ? (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedQuiz.title} - 設定
                    </h2>
                    <div className="space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                          >
                            {saving ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            <span>{saving ? '儲存中...' : '儲存'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>編輯設定</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* 基本設定 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">基本設定</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          測驗標題
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={selectedQuiz.title}
                            onChange={(e) => updateSelectedQuiz({ title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{selectedQuiz.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          狀態
                        </label>
                        {isEditing ? (
                          <select
                            value={selectedQuiz.is_active ? 'active' : 'inactive'}
                            onChange={(e) => updateSelectedQuiz({ is_active: e.target.value === 'active' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="active">啟用</option>
                            <option value="inactive">停用</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedQuiz.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedQuiz.is_active ? '啟用' : '停用'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        測驗說明
                      </label>
                      {isEditing ? (
                        <textarea
                          value={selectedQuiz.description || ''}
                          onChange={(e) => updateSelectedQuiz({ description: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedQuiz.description || '無說明'}</p>
                      )}
                    </div>
                  </div>

                  {/* 時間和嘗試設定 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">時間和嘗試設定</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          時間限制（分鐘）
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={selectedQuiz.time_limit || ''}
                            onChange={(e) => updateSelectedQuiz({ 
                              time_limit: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="無限制"
                            min="1"
                            max="480"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{selectedQuiz.time_limit || '無限制'} 分鐘</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大嘗試次數
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={selectedQuiz.max_attempts}
                            onChange={(e) => updateSelectedQuiz({ 
                              max_attempts: parseInt(e.target.value) || 1 
                            })}
                            min="1"
                            max="10"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{selectedQuiz.max_attempts} 次</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          及格分數（%）
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={selectedQuiz.passing_score}
                            onChange={(e) => updateSelectedQuiz({ 
                              passing_score: parseInt(e.target.value) || 60 
                            })}
                            min="0"
                            max="100"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{selectedQuiz.passing_score}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 顯示設定 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">顯示設定</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">隨機題目順序</h4>
                          <p className="text-sm text-gray-500">每次測驗時題目順序都不同</p>
                        </div>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={selectedQuiz.randomize_questions}
                            onChange={(e) => updateSelectedQuiz({ randomize_questions: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded text-sm ${
                            selectedQuiz.randomize_questions 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedQuiz.randomize_questions ? '啟用' : '停用'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">顯示測驗結果</h4>
                          <p className="text-sm text-gray-500">完成後顯示分數和通過狀態</p>
                        </div>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={selectedQuiz.show_results}
                            onChange={(e) => updateSelectedQuiz({ show_results: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded text-sm ${
                            selectedQuiz.show_results 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedQuiz.show_results ? '顯示' : '隱藏'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">顯示正確答案</h4>
                          <p className="text-sm text-gray-500">完成後顯示題目的正確答案</p>
                        </div>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={selectedQuiz.show_correct_answers}
                            onChange={(e) => updateSelectedQuiz({ show_correct_answers: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded text-sm ${
                            selectedQuiz.show_correct_answers 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedQuiz.show_correct_answers ? '顯示' : '隱藏'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 可用時間設定 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">可用時間設定</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          開始時間
                        </label>
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={formatDateTime(selectedQuiz.available_from)}
                            onChange={(e) => updateSelectedQuiz({ 
                              available_from: e.target.value ? new Date(e.target.value).toISOString() : null 
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{formatDisplayDate(selectedQuiz.available_from)}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          結束時間
                        </label>
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={formatDateTime(selectedQuiz.available_until)}
                            onChange={(e) => updateSelectedQuiz({ 
                              available_until: e.target.value ? new Date(e.target.value).toISOString() : null 
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{formatDisplayDate(selectedQuiz.available_until)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🔧 新增：課程資訊顯示 */}
                  {selectedQuiz.courses && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">課程資訊</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">所屬課程</p>
                        <p className="text-lg font-medium text-gray-900">{selectedQuiz.courses.title}</p>
                        <p className="text-sm text-gray-500">課程 ID: {selectedQuiz.course_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">選擇測驗</h3>
                <p className="text-gray-600">從左側列表選擇要設定的測驗</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSettingsPage;