// src/app/api/quiz/upload/route.js
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import * as XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 解析 Excel 檔案
const parseExcelFile = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 轉換為 JSON，第一行作為表頭
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      throw new Error('Excel 檔案必須包含表頭和至少一筆資料');
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // 驗證必要欄位
    const requiredHeaders = ['題號', '題型', '題目', '正確答案'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`缺少必要欄位: ${missingHeaders.join(', ')}`);
    }
    
    // 解析每一行資料
    const questions = [];
    const errors = [];
    
    rows.forEach((row, index) => {
      try {
        const question = parseQuestionRow(headers, row, index + 2);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        errors.push(`第 ${index + 2} 行: ${error.message}`);
      }
    });
    
    return { questions, errors };
  } catch (error) {
    throw new Error(`Excel 解析失敗: ${error.message}`);
  }
};

// 解析 CSV 檔案
const parseCSVFile = (buffer) => {
  try {
    const csvContent = buffer.toString('utf-8');
    console.log('CSV內容長度:', csvContent.length);
    console.log('CSV前100字符:', csvContent.substring(0, 100));
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('CSV行數:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('CSV 檔案內容不足');
    }
    
    // 使用更簡單的CSV解析，因為我們的CSV是基本格式
    const headers = parseCSVLine(lines[0]);
    console.log('解析到的標題:', headers);
    
    const rows = lines.slice(1);
    const questions = [];
    const errors = [];
    
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // 行號從 1 開始，加上標題行
      
      try {
        const values = parseCSVLine(row);
        console.log(`第${rowNumber}行解析結果:`, values);
        
        const question = parseQuestionRow(headers, values, rowNumber);
        questions.push(question);
      } catch (error) {
        console.error(`第${rowNumber}行解析錯誤:`, error);
        errors.push(`第 ${rowNumber} 行: ${error.message}`);
      }
    });
    
    return { questions, errors };
  } catch (error) {
    console.error('CSV解析失敗:', error);
    throw new Error(`CSV 解析失敗: ${error.message}`);
  }
};

// 簡單的CSV行解析函數
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

// 解析單一題目行
const parseQuestionRow = (headers, row, rowNumber) => {
  const question = {};
  
  headers.forEach((header, index) => {
    const value = row[index];
    question[header] = value !== undefined ? String(value).trim() : '';
  });
  
  // 驗證必要欄位
  if (!question['題號']) {
    throw new Error('題號不能為空');
  }
  
  if (!question['題型']) {
    throw new Error('題型不能為空');
  }
  
  if (!question['題目']) {
    throw new Error('題目不能為空');
  }
  
  if (!question['正確答案']) {
    throw new Error('正確答案不能為空');
  }
  
  // 驗證題型
  const validTypes = ['單選題', '複選題', '填空題', '問答題'];
  if (!validTypes.includes(question['題型'])) {
    throw new Error(`無效的題型: ${question['題型']}。支援的題型: ${validTypes.join(', ')}`);
  }
  
  // 驗證選擇題選項
  if (['單選題', '複選題'].includes(question['題型'])) {
    const options = ['選項A', '選項B', '選項C', '選項D'];
    const hasOptions = options.some(opt => question[opt]);
    
    if (!hasOptions) {
      throw new Error('選擇題必須至少有一個選項');
    }
    
    // 驗證正確答案格式
    const correctAnswer = question['正確答案'].toUpperCase();
    if (question['題型'] === '單選題') {
      if (!/^[A-D]$/.test(correctAnswer)) {
        throw new Error('單選題正確答案必須是 A、B、C 或 D');
      }
    } else if (question['題型'] === '複選題') {
      const answers = correctAnswer.split(',');
      const invalidAnswers = answers.filter(ans => !/^[A-D]$/.test(ans.trim()));
      if (invalidAnswers.length > 0) {
        throw new Error('複選題正確答案必須是 A、B、C、D 的組合，用逗號分隔');
      }
    }
  }
  
  return question;
};

// 處理圖片檔案
const processImages = (zip, questions) => {
  const images = {};
  const imageErrors = [];
  
  // 尋找所有圖片檔案（在任何位置）
  const imageEntries = zip.getEntries().filter(entry => 
    !entry.isDirectory &&
    /\.(jpg|jpeg|png|gif)$/i.test(entry.entryName)
  );
  
  console.log('找到的圖片檔案:', imageEntries.map(e => e.entryName));
  
  imageEntries.forEach(entry => {
    const fileName = entry.entryName.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // 檢查檔案大小 (2MB)
    if (entry.header.size > 2 * 1024 * 1024) {
      imageErrors.push(`圖片 ${fileName} 超過 2MB 大小限制`);
      return;
    }
    
    // 檢查格式
    if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      imageErrors.push(`圖片 ${fileName} 格式不支援`);
      return;
    }
    
    images[fileName] = {
      data: entry.getData(),
      size: entry.header.size,
      type: fileExtension === 'jpg' ? 'image/jpeg' : `image/${fileExtension}`
    };
  });
  
  // 檢查是否有題目引用了不存在的圖片
  console.log('已處理的圖片:', Object.keys(images));
  
  questions.forEach(question => {
    if (question['圖片檔名']) {
      console.log(`題目 ${question['題號']} 引用圖片: ${question['圖片檔名']}`);
      if (!images[question['圖片檔名']]) {
        console.log(`找不到圖片: ${question['圖片檔名']}`);
        console.log('可用的圖片:', Object.keys(images));
        imageErrors.push(`題目 ${question['題號']} 引用的圖片 ${question['圖片檔名']} 不存在`);
      }
    }
  });
  
  return { images, imageErrors };
};

// 上傳圖片到 Supabase Storage
const uploadImages = async (images, quizId) => {
  const uploadedImages = {};
  
  for (const [fileName, imageData] of Object.entries(images)) {
    try {
      const filePath = `quiz-images/${quizId}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('course-content')
        .upload(filePath, imageData.data, {
          contentType: imageData.type,
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      // 獲取公開 URL
      const { data: urlData } = supabase.storage
        .from('course-content')
        .getPublicUrl(filePath);
      
      uploadedImages[fileName] = urlData.publicUrl;
      console.log(`圖片上傳成功: ${fileName} -> ${urlData.publicUrl}`);
    } catch (error) {
      console.error(`上傳圖片 ${fileName} 失敗:`, error);
    }
  }
  
  return uploadedImages;
};

// 儲存測驗資料到資料庫
const saveQuizToDatabase = async (quizData, questions, imageUrls) => {
  try {
    // 1. 建立測驗集合
    const { data: quizSet, error: quizError } = await supabase
      .from('quiz_sets')
      .insert({
        course_id: quizData.courseId,
        title: quizData.title,
        description: quizData.description,
        created_by: quizData.userId
      })
      .select()
      .single();
    
    if (quizError) throw quizError;
    
    // 2. 建立題目
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // 儲存題目基本資料
      const { data: savedQuestion, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_set_id: quizSet.id,
          question_number: i + 1,
          question_type: getQuestionType(question['題型']),
          question_text: question['題目'],
          image_url: question['圖片檔名'] ? imageUrls[question['圖片檔名']] : null,
          explanation: question['解析'] || null,
          points: parseInt(question['分數']) || 10
        })
        .select()
        .single();
      
      if (questionError) throw questionError;
      
      // 3. 根據題型儲存答案資料
      if (['單選題', '複選題'].includes(question['題型'])) {
        // 儲存選擇題選項
        const options = ['選項A', '選項B', '選項C', '選項D'];
        const correctAnswers = question['正確答案'].toUpperCase().split(',').map(a => a.trim());
        
        for (let j = 0; j < options.length; j++) {
          const optionText = question[options[j]];
          if (optionText) {
            const optionLabel = String.fromCharCode(65 + j); // A, B, C, D
            
            await supabase
              .from('quiz_options')
              .insert({
                question_id: savedQuestion.id,
                option_label: optionLabel,
                option_text: optionText,
                is_correct: correctAnswers.includes(optionLabel)
              });
          }
        }
      } else if (['填空題', '問答題'].includes(question['題型'])) {
        // 儲存填空題/問答題答案
        await supabase
          .from('quiz_fill_answers')
          .insert({
            question_id: savedQuestion.id,
            correct_answer: question['正確答案'],
            case_sensitive: false,
            exact_match: question['題型'] === '問答題'
          });
      }
    }
    
    return quizSet;
  } catch (error) {
    throw new Error(`儲存資料庫失敗: ${error.message}`);
  }
};

// 題型轉換
const getQuestionType = (chineseType) => {
  const typeMap = {
    '單選題': 'single',
    '複選題': 'multiple',
    '填空題': 'fill',
    '問答題': 'essay'
  };
  return typeMap[chineseType] || 'single';
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const courseId = formData.get('courseId');
    const title = formData.get('title');
    const description = formData.get('description');
    const zipFile = formData.get('zipFile');
    const isPreview = formData.get('preview') === 'true';
    
    if (!courseId || !title || !zipFile) {
      return Response.json({ error: '缺少必要參數' }, { status: 400 });
    }
    
    // 檢查檔案格式
    if (!zipFile.name?.endsWith('.zip')) {
      return Response.json({ error: '請上傳 ZIP 格式檔案' }, { status: 400 });
    }
    
    // 讀取檔案內容
    const arrayBuffer = await zipFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 解壓縮 ZIP 檔案
    const zip = new AdmZip(buffer);
    
    // 列出ZIP檔案中的所有內容（用於調試）
    const entries = zip.getEntries();
    const fileList = entries.map(entry => entry.entryName);
    console.log('ZIP檔案內容:', fileList);
    
    // 尋找 Excel 或 CSV 檔案（可能在根目錄或子資料夾）
    let dataEntry = null;
    let isCSV = false;
    
    // 嘗試多種可能的路徑
    const possiblePaths = [
      'questions.xlsx',
      'questions.csv',
      'questions/questions.xlsx',
      'questions/questions.csv'
    ];
    
    for (const path of possiblePaths) {
      dataEntry = zip.getEntry(path);
      if (dataEntry) {
        isCSV = path.endsWith('.csv');
        console.log(`找到題目檔案: ${path}`);
        break;
      }
    }
    
    // 如果還是找不到，嘗試在所有檔案中搜尋
    if (!dataEntry) {
      const allEntries = zip.getEntries();
      for (const entry of allEntries) {
        if (entry.entryName.endsWith('questions.xlsx') || entry.entryName.endsWith('questions.csv')) {
          dataEntry = entry;
          isCSV = entry.entryName.endsWith('.csv');
          console.log(`在 ${entry.entryName} 找到題目檔案`);
          break;
        }
      }
    }
    
    if (!dataEntry) {
      return Response.json({ 
        error: 'ZIP 檔案中找不到 questions.xlsx 或 questions.csv',
        details: `請確保ZIP檔案包含名為 questions.xlsx 或 questions.csv 的檔案。找到的檔案: ${fileList.join(', ')}`,
        foundFiles: fileList,
        hint: '提示：檔案可以放在ZIP根目錄或任何子資料夾中'
      }, { status: 400 });
    }
    
    // 解析檔案
    let questions, parseErrors;
    try {
      const parseResult = isCSV 
        ? parseCSVFile(dataEntry.getData()) 
        : parseExcelFile(dataEntry.getData());
      questions = parseResult.questions;
      parseErrors = parseResult.errors;
    } catch (error) {
      console.error('檔案解析失敗:', error);
      return Response.json({ 
        error: '檔案解析失敗',
        details: error.message,
        fileType: isCSV ? 'CSV' : 'Excel'
      }, { status: 400 });
    }
    
    // 處理圖片
    const { images, imageErrors } = processImages(zip, questions);
    
    // 合併所有錯誤
    const allErrors = [...parseErrors, ...imageErrors];
    
    // 如果是預覽模式且有嚴重錯誤，提供詳細錯誤信息
    if (isPreview && questions.length === 0 && parseErrors.length > 0) {
      return Response.json({ 
        error: '檔案解析失敗',
        details: '無法解析任何有效題目',
        parseErrors: parseErrors.slice(0, 20), // 限制錯誤數量
        totalErrors: parseErrors.length
      }, { status: 400 });
    }
    
    if (isPreview) {
      // 預覽模式，只返回解析結果
      const questionTypes = {};
      questions.forEach(q => {
        const type = q['題型'];
        questionTypes[type] = (questionTypes[type] || 0) + 1;
      });
      
      return Response.json({
        success: true,
        preview: {
          totalQuestions: questions.length,
          questionTypes,
          questions: questions.slice(0, 3), // 只返回前3題預覽
          imagesFound: Object.keys(images).length,
          errors: allErrors
        }
      });
    }
    
    // 正式導入模式
    if (allErrors.length > 0) {
      return Response.json({ 
        error: '檔案解析失敗',
        details: allErrors
      }, { status: 400 });
    }
    
    // 生成測驗 ID 用於圖片路徑
    const quizId = `quiz_${Date.now()}`;
    
    // 上傳圖片
    const imageUrls = await uploadImages(images, quizId);
    
    // 儲存到資料庫
    const quizSet = await saveQuizToDatabase({
      courseId,
      title,
      description,
      userId: null // 暫時設為 null，後續需要從認證中獲取
    }, questions, imageUrls);
    
    // 記錄上傳歷史
    await supabase
      .from('quiz_uploads')
      .insert({
        file_name: zipFile.name,
        original_filename: zipFile.name,
        file_size: zipFile.size,
        upload_status: 'completed',
        questions_imported: questions.length,
        uploaded_by: null // 暫時設為 null
      });
    
    return Response.json({
      success: true,
      quizSet,
      questionsImported: questions.length,
      imagesUploaded: Object.keys(imageUrls).length
    });
    
  } catch (error) {
    console.error('上傳處理錯誤:', error);
    return Response.json({ 
      error: '服務器錯誤',
      message: error.message
    }, { status: 500 });
  }
}