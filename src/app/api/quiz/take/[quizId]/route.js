// src/app/api/quiz/create/route.js
import { createSupabaseAdminClient } from '@/lib/supabase-server';

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
    const supabase = createSupabaseAdminClient();
    }
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

    // 儲存每個題目
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // 儲存題目基本資料
      const { data: savedQuestion, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_set_id: quizSet.id,
          question_number: i + 1,
          question_type: getQuestionType(question.type),
          question_text: question.question,
          explanation: question.explanation || null,
          points: question.points || 10
        })
        .select()
        .single();

      if (questionError) {
        console.error(`儲存第 ${i + 1} 題失敗:`, questionError);
        // 清理已建立的資料
        await supabase.from('quiz_sets').delete().eq('id', quizSet.id);
        return Response.json({ 
          error: `儲存第 ${i + 1} 題失敗：` + questionError.message 
        }, { status: 500 });
      }

      // 根據題型儲存答案資料
      if (['single', 'multiple'].includes(question.type)) {
        // 儲存選擇題選項
        const validOptions = question.options.filter(opt => opt && opt.trim());
        const correctAnswers = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer];

        for (let j = 0; j < validOptions.length; j++) {
          const optionLabel = String.fromCharCode(65 + j); // A, B, C, D
          
          const { error: optionError } = await supabase
            .from('quiz_options')
            .insert({
              question_id: savedQuestion.id,
              option_label: optionLabel,
              option_text: validOptions[j],
              is_correct: correctAnswers.includes(optionLabel)
            });

          if (optionError) {
            console.error(`儲存第 ${i + 1} 題選項 ${optionLabel} 失敗:`, optionError);
            // 清理已建立的資料
            await supabase.from('quiz_sets').delete().eq('id', quizSet.id);
            return Response.json({ 
              error: `儲存第 ${i + 1} 題選項失敗：` + optionError.message 
            }, { status: 500 });
          }
        }
      } else if (['fill', 'essay'].includes(question.type)) {
        // 儲存填空題/問答題答案
        const { error: answerError } = await supabase
          .from('quiz_fill_answers')
          .insert({
            question_id: savedQuestion.id,
            correct_answer: question.correctAnswer,
            case_sensitive: false,
            exact_match: question.type === 'essay'
          });

        if (answerError) {
          console.error(`儲存第 ${i + 1} 題答案失敗:`, answerError);
          // 清理已建立的資料
          await supabase.from('quiz_sets').delete().eq('id', quizSet.id);
          return Response.json({ 
            error: `儲存第 ${i + 1} 題答案失敗：` + answerError.message 
          }, { status: 500 });
        }
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
    }
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    let query = supabase
      .from('quiz_sets')
      .select(`
        *,
        courses:course_id (
          id,
          title
        )
      `)
      .eq('is_active', true)
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

    // 為每個測驗獲取題目數量
    const quizSetsWithCount = await Promise.all(
      (quizSets || []).map(async (quiz) => {
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
      })
    );

    return Response.json({
      success: true,
      quizSets: quizSetsWithCount
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤：' + error.message 
    }, { status: 500 });
  }
}