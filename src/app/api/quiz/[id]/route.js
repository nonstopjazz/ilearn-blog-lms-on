// src/app/api/quiz/[id]/route.js
import { getSupabaseClient } from '@/lib/supabase-server';

// 獲取測驗詳細資料
export async function GET(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = params;
    
    if (!id) {
      return Response.json({ 
        error: '缺少測驗 ID' 
      }, { status: 400 });
    }

    // 獲取測驗基本資訊
    const { data: quizSet, error: quizError } = await supabase
      .from('quiz_sets')
      .select(`
        *,
        courses:course_id (
          id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (quizError) {
      console.error('獲取測驗失敗:', quizError);
      return Response.json({ 
        error: '測驗不存在' 
      }, { status: 404 });
    }

    // 獲取當前用戶的嘗試次數
    let attemptCount = 0;
    let canTakeQuiz = true;
    let remainingAttempts = quizSet.max_attempts;
    
    // 暫時使用 null 作為 user_id，實際應該從認證中獲取
    const userId = null; // TODO: 從 auth 獲取實際用戶 ID
    
    if (userId) {
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_set_id', id)
        .eq('user_id', userId)
        .eq('status', 'completed');
      
      if (!attemptsError && attempts) {
        attemptCount = attempts.length;
        remainingAttempts = quizSet.max_attempts - attemptCount;
        canTakeQuiz = attemptCount < quizSet.max_attempts;
      }
    }

    // 獲取測驗題目
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        quiz_options (*),
        quiz_fill_answers (*)
      `)
      .eq('quiz_set_id', id)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('獲取題目失敗:', questionsError);
      return Response.json({ 
        error: '獲取題目失敗：' + questionsError.message 
      }, { status: 500 });
    }

    // 格式化題目資料
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      question_number: question.question_number,
      question_type: question.question_type,
      question_text: question.question_text,
      image_url: question.image_url,
      explanation: question.explanation,
      points: question.points,
      options: question.quiz_options || [],
      fill_answers: question.quiz_fill_answers || []
    }));

    const quiz = {
      ...quizSet,
      questions: formattedQuestions,
      // 加入嘗試次數相關資訊
      user_attempt_count: attemptCount,
      remaining_attempts: remainingAttempts,
      can_take_quiz: canTakeQuiz
    };

    return Response.json({
      success: true,
      quiz: quiz
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 更新測驗設定
export async function PUT(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = params;
    
    if (!id) {
      return Response.json({ 
        error: '缺少測驗 ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    
    // 準備更新資料
    const updateData = {};
    
    // 只更新有提供的欄位
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.time_limit !== undefined) updateData.time_limit = body.time_limit;
    if (body.max_attempts !== undefined) updateData.max_attempts = body.max_attempts;
    if (body.passing_score !== undefined) updateData.passing_score = body.passing_score;
    if (body.randomize_questions !== undefined) updateData.randomize_questions = body.randomize_questions;
    if (body.show_results !== undefined) updateData.show_results = body.show_results;
    if (body.show_correct_answers !== undefined) updateData.show_correct_answers = body.show_correct_answers;
    if (body.available_from !== undefined) updateData.available_from = body.available_from;
    if (body.available_until !== undefined) updateData.available_until = body.available_until;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    // 加入更新時間
    updateData.updated_at = new Date().toISOString();

    // 執行更新
    const { data, error } = await supabase
      .from('quiz_sets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新測驗設定失敗:', error);
      return Response.json({ 
        error: '更新測驗設定失敗：' + error.message 
      }, { status: 500 });
    }

    if (!data) {
      return Response.json({ 
        error: '找不到指定的測驗' 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      quiz: data,
      message: '測驗設定更新成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

// 刪除測驗
export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = params;
    
    if (!id) {
      return Response.json({ 
        error: '缺少測驗 ID' 
      }, { status: 400 });
    }

    // 先刪除相關的題目和選項（cascade delete）
    const { error: deleteError } = await supabase
      .from('quiz_sets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('刪除測驗失敗:', deleteError);
      return Response.json({ 
        error: '刪除測驗失敗：' + deleteError.message 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '測驗刪除成功'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}