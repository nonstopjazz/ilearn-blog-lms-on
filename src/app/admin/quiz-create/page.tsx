'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Save, BookOpen, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'fill' | 'essay';
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

interface QuizData {
  title: string;
  description: string;
  courseId: string;
  questions: Question[];
}

const SimpleQuizCreator: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    description: '',
    courseId: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    type: 'single',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 10
  });

  // 模擬課程資料
  const courses = [
    { id: 'course_001', title: 'React 基礎課程' },
    { id: 'course_002', title: 'JavaScript 進階' },
    { id: 'course_003', title: 'Node.js 後端開發' }
  ];

  const questionTypes = [
    { value: 'single', label: '單選題' },
    { value: 'multiple', label: '複選題' },
    { value: 'fill', label: '填空題' },
    { value: 'essay', label: '問答題' }
  ];

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('請填寫題目內容');
      return;
    }

    // 驗證選擇題選項
    if (['single', 'multiple'].includes(currentQuestion.type)) {
      const validOptions = currentQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('選擇題至少需要2個選項');
        return;
      }
      if (!currentQuestion.correctAnswer) {
        alert('請選擇正確答案');
        return;
      }
    }

    // 驗證填空題和問答題
    if (['fill', 'essay'].includes(currentQuestion.type) && !currentQuestion.correctAnswer) {
      alert('請填寫正確答案或參考答案');
      return;
    }

    const newQuestion: Question = {
      ...currentQuestion,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // 重置當前題目
    setCurrentQuestion({
      id: '',
      type: 'single',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 10
    });

    alert('題目已新增！');
  };

  const removeQuestion = (questionId: string) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleCorrectAnswerChange = (value: string, isMultiple: boolean = false) => {
    if (isMultiple) {
      const currentAnswers = Array.isArray(currentQuestion.correctAnswer) 
        ? currentQuestion.correctAnswer 
        : [];
      
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter(ans => ans !== value)
        : [...currentAnswers, value];
      
      setCurrentQuestion(prev => ({
        ...prev,
        correctAnswer: newAnswers
      }));
    } else {
      setCurrentQuestion(prev => ({
        ...prev,
        correctAnswer: value
      }));
    }
  };

  const saveQuiz = async () => {
    if (!quizData.title.trim() || !quizData.courseId || quizData.questions.length === 0) {
      alert('請填寫測驗標題、選擇課程並至少新增一道題目');
      return;
    }

    console.log('準備儲存測驗:', quizData); 

    try {
      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      console.log('API 回應狀態:', response.status);
      
      const result = await response.json();
      console.log('API 回應內容:', result);

      if (!response.ok) {
        throw new Error(result.error || '儲存失敗');
      }

      alert(result.message || '測驗儲存成功！');
      
      // 重置表單
      setQuizData({
        title: '',
        description: '',
        courseId: '',
        questions: []
      });
    } catch (error) {
      console.error('儲存錯誤:', error);
      alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 標題 */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="mr-3 h-6 w-6" />
          建立測驗
        </h1>
        <p className="text-gray-600 mt-1">手動建立測驗題目</p>
      </div>

      {/* 測驗基本資訊 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">測驗基本資訊</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇課程 *
            </label>
            <select
              value={quizData.courseId}
              onChange={(e) => setQuizData(prev => ({ ...prev, courseId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">請選擇課程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              測驗標題 *
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例：第一章測驗"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            測驗說明
          </label>
          <textarea
            value={quizData.description}
            onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="測驗說明和注意事項..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 新增題目區域 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <HelpCircle className="mr-2 h-5 w-5" />
          新增題目
        </h2>
        
        <div className="space-y-4">
          {/* 題型和分數 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">題型</label>
              <select
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion(prev => ({ 
                  ...prev, 
                  type: e.target.value as Question['type'],
                  correctAnswer: e.target.value === 'multiple' ? [] : ''
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分數</label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                min="1"
                max="100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 題目內容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">題目內容 *</label>
            <textarea
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
              placeholder="輸入題目內容..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 選擇題選項 */}
          {['single', 'multiple'].includes(currentQuestion.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">選項</label>
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`選項 ${String.fromCharCode(65 + index)}`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {currentQuestion.type === 'single' ? (
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswer === String.fromCharCode(65 + index)}
                        onChange={() => handleCorrectAnswerChange(String.fromCharCode(65 + index))}
                        className="w-4 h-4 text-blue-600"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={Array.isArray(currentQuestion.correctAnswer) && 
                               currentQuestion.correctAnswer.includes(String.fromCharCode(65 + index))}
                        onChange={() => handleCorrectAnswerChange(String.fromCharCode(65 + index), true)}
                        className="w-4 h-4 text-blue-600"
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentQuestion.type === 'single' ? '選擇正確答案' : '可選擇多個正確答案'}
              </p>
            </div>
          )}

          {/* 填空題和問答題答案 */}
          {['fill', 'essay'].includes(currentQuestion.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentQuestion.type === 'fill' ? '正確答案' : '參考答案'}
              </label>
              <textarea
                value={currentQuestion.correctAnswer as string}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder={currentQuestion.type === 'fill' ? '輸入正確答案...' : '輸入參考答案或評分標準...'}
                rows={currentQuestion.type === 'essay' ? 4 : 2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* 解析 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">答案解析（選填）</label>
            <textarea
              value={currentQuestion.explanation}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="解釋為什麼這是正確答案..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 新增按鈕 */}
          <div className="text-right">
            <button
              onClick={addQuestion}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>新增題目</span>
            </button>
          </div>
        </div>
      </div>

      {/* 已新增的題目列表 */}
      {quizData.questions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            已新增題目 ({quizData.questions.length} 題)
          </h2>
          
          <div className="space-y-4">
            {quizData.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">第 {index + 1} 題</span>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {questionTypes.find(t => t.value === question.type)?.label}
                      </span>
                      <span className="text-sm text-gray-500">{question.points} 分</span>
                    </div>
                    <p className="text-gray-900 mb-2">{question.question}</p>
                    
                    {/* 顯示選項 */}
                    {['single', 'multiple'].includes(question.type) && (
                      <div className="text-sm space-y-1">
                        {question.options.filter(opt => opt.trim()).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span>{option}</span>
                            {(Array.isArray(question.correctAnswer) 
                              ? question.correctAnswer.includes(String.fromCharCode(65 + optIndex))
                              : question.correctAnswer === String.fromCharCode(65 + optIndex)
                            ) && (
                              <span className="text-green-600 text-xs">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 顯示填空題/問答題答案 */}
                    {['fill', 'essay'].includes(question.type) && (
                      <div className="text-sm text-green-600">
                        答案: {question.correctAnswer}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 儲存按鈕 */}
      <div className="text-center">
        <button
          onClick={saveQuiz}
          disabled={quizData.questions.length === 0}
          className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed mx-auto"
        >
          <Save className="h-5 w-5" />
          <span>儲存測驗</span>
        </button>
      </div>
    </div>
  );
};

export default SimpleQuizCreator;