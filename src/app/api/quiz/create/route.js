// src/app/api/quiz/create/route.js
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api-auth';
import { isAdmin } from '@/lib/security-config';

// 題型轉換
const getQuestionType = (type) => {
  const typeMap = {
    'single': 'single',
    'multiple': 'multiple',
    'fill': 'fill',
    'essay': 'essay'
  };
  return typeMap[type] || 'single';
};

export async function POST(request) {
  try {
    // 管理員認證檢查
    const { user: authUser } = await authenticateRequest(request);
    if (!authUser || !isAdmin(authUser)) {
      return Response.json({ error: '需要管理員權限' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();

    const { title, description, courseId, questions } = await request.json();
    
    // 驗證必要欄位
    if (!title || !courseId || !questions || questions.length === 0) {
      return Response.json({ 
        error: '缺少必要欄位：標題、課程ID或題目' 
      }, { status: 400 });
    }

    // 驗證每個題目
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question || !question.type) {
        return Response.json({ 
          error: `第 ${i + 1} 題缺少題目內容或題型` 
        }, { status: 400 });
      }

      // 驗證選擇題
      if (['single', 'multiple'].includes(question.type)) {
        const validOptions = question.options?.filter(opt => opt && opt.trim()) || [];
        if (validOptions.length < 2) {
          return Response.json({ 
            error: `第 ${i + 1} 題選擇題至少需要2個選項` 
          }, { status: 400 });
        }

        if (!question.correctAnswer || 
            (Array.isArray(question.correctAnswer) && question.correctAnswer.length === 0)) {
          return Response.json({ 
            error: `第 ${i + 1} 題未設定正確答案` 
          }, { status: 400 });
        }
      }

      // 驗證填空題和問答題
      if (['fill', 'essay'].includes(question.type) && !question.correctAnswer) {
        return Response.json({ 
          error: `第 ${i + 1} 題未設定答案` 
        }, { status: 400 });
      }
    }

    // 開始事務處理
    const { data: quizSet, error: quizError } = await supabase
      .from('quiz_sets')
      .insert({
        course_id: courseId,
        title: title,
        description: description || null,
        created_by: null // 暫時設為 null，後續需要從認證中獲取
      })
      .select()
      .single();

    if (quizError) {
      console.error('建立測驗集合失敗:', quizError);
      return Response.json({ 
        error: '建立測驗失敗：' + quizError.message 
      }, { status: 500 });
    }

    // 批次儲存所有題目
    const { data: savedQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questions.map((q, i) => ({
        quiz_set_id: quizSet.id,
        question_number: i + 1,
        question_type: getQuestionType(q.type),
        question_text: q.question,
        explanation: q.explanation || null,
        points: q.points || 10
      })))
      .select();

    if (questionsError) {
      await supabase.from('quiz_sets').delete().eq('id', quizSet.id);
      return Response.json({
        error: '儲存題目失敗：' + questionsError.message
      }, { status: 500 });
    }

    // 批次儲存所有選擇題選項
    const allOptions = [];
    questions.forEach((question, i) => {
      if (['single', 'multiple'].includes(question.type)) {
        const validOptions = question.options.filter(opt => opt && opt.trim());
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];

        validOptions.forEach((opt, j) => {
          const optionLabel = String.fromCharCode(65 + j);
          allOptions.push({
            question_id: savedQuestions[i].id,
            option_label: optionLabel,
            option_text: opt,
            is_correct: correctAnswers.includes(optionLabel)
          });
        });
      }
    });

    if (allOptions.length > 0) {
      const { error: optionsError } = await supabase
        .from('quiz_options')
        .insert(allOptions);

      if (optionsError) {
        await supabase.from('quiz_sets').delete().eq('id', quizSet.id);
        return Response.json({
          error: '儲存選項失敗：' + optionsError.message
        }, { status: 500 });
      }
    }

    // 批次儲存所有填空/問答題答案
    const allAnswers = questions
      .map((question, i) => {
        if (['fill', 'essay'].includes(question.type)) {
          return {
            question_id: savedQuestions[i].id,
            correct_answer: question.correctAnswer,
            case_sensitive: false,
            exact_match: question.type === 'essay'
          };
        }
        return null;
      })
      .filter(Boolean);

    if (allAnswers.length > 0) {
      const { error: answersError } = await supabase
        .from('quiz_fill_answers')
        .insert(allAnswers);

      if (answersError) {
        await supabase.from('quiz_sets').delete().eq('id', quizSet.id);
        return Response.json({
          error: '儲存答案失敗：' + answersError.message
        }, { status: 500 });
      }
    }

    return Response.json({
      success: true,
      quizSet: quizSet,
      message: `測驗建立成功，共新增 ${questions.length} 道題目`
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = createSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId'); // 從前端傳來的用戶 ID

    let query = supabase
      .from('quiz_sets')
      .select(`
        *,
        courses:course_id (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: quizSets, error } = await query;

    if (error) {
      console.error('查詢測驗失敗:', error);
      return Response.json({ 
        error: '查詢測驗失敗：' + error.message 
      }, { status: 500 });
    }

    // 批次查詢使用者的嘗試次數（避免 N+1 查詢）
    let quizSetsWithAttempts = quizSets || [];
    if (userId && quizSets?.length > 0) {
      const quizIds = quizSets.map(q => q.id);
      const { data: allAttempts } = await supabase
        .from('quiz_attempts')
        .select('id, quiz_set_id, status, completed_at')
        .in('quiz_set_id', quizIds)
        .eq('user_id', userId)
        .eq('status', 'completed');

      const attemptsMap = new Map();
      allAttempts?.forEach(a => {
        attemptsMap.set(a.quiz_set_id, (attemptsMap.get(a.quiz_set_id) || 0) + 1);
      });

      quizSetsWithAttempts = quizSets.map(quiz => {
        const userAttemptCount = attemptsMap.get(quiz.id) || 0;
        return {
          ...quiz,
          user_attempt_count: userAttemptCount,
          remaining_attempts: quiz.max_attempts - userAttemptCount,
          can_take_quiz: userAttemptCount < quiz.max_attempts
        };
      });
    } else {
      quizSetsWithAttempts = (quizSets || []).map(quiz => ({
        ...quiz,
        user_attempt_count: 0,
        remaining_attempts: quiz.max_attempts,
        can_take_quiz: true
      }));
    }

    return Response.json({
      success: true,
      quizSets: quizSetsWithAttempts
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}