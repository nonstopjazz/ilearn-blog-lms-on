// src/app/api/quiz/results/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 獲取所有測驗成績
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const status = searchParams.get('status'); // 'passed', 'failed', 'all'
    const search = searchParams.get('search');

    let query = supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz_sets:quiz_set_id (
          id,
          title,
          passing_score
        )
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    // 篩選特定測驗
    if (quizId && quizId !== 'all') {
      query = query.eq('quiz_set_id', quizId);
    }

    // 篩選通過狀態
    if (status && status !== 'all') {
      const isPassed = status === 'passed';
      query = query.eq('is_passed', isPassed);
    }

    const { data: attempts, error } = await query;

    if (error) {
      console.error('查詢測驗成績失敗:', error);
      return Response.json({ 
        error: '查詢測驗成績失敗：' + error.message 
      }, { status: 500 });
    }

    // 如果有搜尋條件，需要額外處理（因為 Supabase 可能不支援跨表搜尋）
    let filteredAttempts = attempts || [];

    // 計算統計資料
    const stats = calculateStats(filteredAttempts);

    return Response.json({
      success: true,
      attempts: filteredAttempts,
      stats
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 計算統計資料
function calculateStats(attempts) {
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(att => att.is_passed).length;
  const averageScore = totalAttempts > 0 
    ? attempts.reduce((sum, att) => sum + att.percentage_score, 0) / totalAttempts 
    : 0;
  const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

  return {
    totalAttempts,
    passedAttempts,
    averageScore: Math.round(averageScore * 10) / 10,
    passRate: Math.round(passRate * 10) / 10
  };
}

// 獲取特定測驗嘗試的詳細結果
export async function POST(request) {
  try {
    const { attemptId } = await request.json();

    if (!attemptId) {
      return Response.json({ error: '缺少測驗嘗試 ID' }, { status: 400 });
    }

    // 獲取測驗嘗試基本資訊
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz_sets:quiz_set_id (
          id,
          title,
          passing_score,
          show_correct_answers
        )
      `)
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return Response.json({ error: '測驗嘗試不存在' }, { status: 404 });
    }

    // 獲取詳細答題記錄
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select(`
        *,
        quiz_questions:question_id (
          id,
          question_number,
          question_type,
          question_text,
          explanation,
          points,
          quiz_options (*),
          quiz_fill_answers (*)
        )
      `)
      .eq('attempt_id', attemptId)
      .order('quiz_questions.question_number');

    if (answersError) {
      console.error('查詢答題記錄失敗:', answersError);
      return Response.json({ 
        error: '查詢答題記錄失敗：' + answersError.message 
      }, { status: 500 });
    }

    // 處理答題詳情
    const detailedAnswers = answers?.map(answer => {
      const question = answer.quiz_questions;
      let correctAnswer = null;
      let userAnswer = null;

      if (['single', 'multiple'].includes(question.question_type)) {
        // 選擇題的正確答案
        correctAnswer = question.quiz_options
          ?.filter(opt => opt.is_correct)
          .map(opt => opt.option_label) || [];
        
        // 使用者的答案
        userAnswer = answer.selected_options || [];
      } else {
        // 填空題/問答題的正確答案
        correctAnswer = question.quiz_fill_answers?.[0]?.correct_answer || '';
        userAnswer = answer.text_answer || '';
      }

      return {
        questionId: question.id,
        questionNumber: question.question_number,
        questionType: question.question_type,
        questionText: question.question_text,
        explanation: question.explanation,
        maxPoints: question.points,
        userAnswer,
        correctAnswer,
        isCorrect: answer.is_correct,
        pointsEarned: answer.points_earned,
        options: question.quiz_options || []
      };
    }) || [];

    return Response.json({
      success: true,
      attempt,
      detailedAnswers
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}