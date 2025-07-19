// src/app/api/quiz/submit/route.js
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const supabase = getSupabaseClient();
    const { attempt_id, quiz_set_id, answers, score, completed_at } = await request.json();
    
    if (!attempt_id || !quiz_set_id || !answers || score === undefined || !completed_at) {
      return Response.json({ 
        error: '缺少必要欄位' 
      }, { status: 400 });
    }

    // 獲取測驗資料以計算正確答案
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_sets')
      .select(`
        *,
        quiz_questions (
          *,
          quiz_options (*),
          quiz_fill_answers (*)
        )
      `)
      .eq('id', quiz_set_id)
      .single();

    if (quizError) {
      console.error('獲取測驗資料失敗:', quizError);
      return Response.json({ 
        error: '獲取測驗資料失敗：' + quizError.message 
      }, { status: 500 });
    }

    // 更新測驗嘗試記錄
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        total_score: score,
        percentage_score: score,
        is_passed: score >= (quizData.passing_score || 60),
        completed_at: completed_at,
        status: 'completed'
      })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('更新測驗嘗試記錄失敗:', updateError);
      return Response.json({ 
        error: '更新測驗嘗試記錄失敗：' + updateError.message 
      }, { status: 500 });
    }

    // 準備答案記錄，包含正確性判斷
    const answerRecords = [];
    
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = quizData.quiz_questions.find(q => q.id === questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsEarned = 0;

      // 判斷答案正確性
      if (question.question_type === 'single') {
        const correctOption = question.quiz_options.find(opt => opt.is_correct);
        if (correctOption && answer.selectedOptions?.[0] === correctOption.option_label) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.question_type === 'multiple') {
        const correctOptions = question.quiz_options.filter(opt => opt.is_correct).map(opt => opt.option_label);
        const userSelections = answer.selectedOptions || [];
        
        if (correctOptions.length === userSelections.length &&
            correctOptions.every(opt => userSelections.includes(opt))) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.question_type === 'fill') {
        const correctAnswers = question.quiz_fill_answers.map(ans => ans.correct_answer.toLowerCase().trim());
        const userAnswer = answer.textAnswer?.toLowerCase().trim();
        
        if (userAnswer && correctAnswers.includes(userAnswer)) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      }

      answerRecords.push({
        attempt_id: attempt_id,
        question_id: questionId,
        selected_options: answer.selectedOptions || null,
        text_answer: answer.textAnswer || null,
        is_correct: isCorrect,
        points_earned: pointsEarned
      });
    }

    // 儲存答案記錄
    if (answerRecords.length > 0) {
      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answerRecords);

      if (answersError) {
        console.error('儲存答案失敗:', answersError);
        return Response.json({ 
          error: '儲存答案失敗：' + answersError.message 
        }, { status: 500 });
      }
    }

    return Response.json({
      success: true,
      score: score,
      is_passed: score >= (quizData.passing_score || 60),
      message: '測驗提交成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}