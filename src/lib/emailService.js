import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email 模板
const emailTemplates = {
  PROGRESS_REMINDER: {
    subject: '學習進度提醒 - {{course_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 學習進度提醒</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">嗨 {{user_name}}！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
            您在課程「<strong>{{course_title}}</strong>」的學習進度需要關注：
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0; color: #666;">{{custom_message}}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{course_url}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              繼續學習 →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>這是來自 iLearn 線上課程平台的自動提醒</p>
          <p>如不想收到此類提醒，請到 <a href="{{preferences_url}}" style="color: #667eea;">提醒偏好設定</a> 關閉</p>
        </div>
      </div>
    `
  },
  
  ASSIGNMENT_REMINDER: {
    subject: '作業提醒 - {{course_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📝 作業提醒</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">嗨 {{user_name}}！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
            您在課程「<strong>{{course_title}}</strong>」有作業需要完成：
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
            <p style="margin: 0; color: #666;">{{custom_message}}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{course_url}}" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              查看作業 →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>這是來自 iLearn 線上課程平台的自動提醒</p>
          <p>如不想收到此類提醒，請到 <a href="{{preferences_url}}" style="color: #f5576c;">提醒偏好設定</a> 關閉</p>
        </div>
      </div>
    `
  },
  
  DEADLINE_REMINDER: {
    subject: '截止日期提醒 - {{course_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⏰ 截止日期提醒</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">嗨 {{user_name}}！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
            課程「<strong>{{course_title}}</strong>」有重要截止日期即將到來：
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9a9e; margin: 20px 0;">
            <p style="margin: 0; color: #666;">{{custom_message}}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{course_url}}" style="background: #ff9a9e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              立即查看 →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>這是來自 iLearn 線上課程平台的自動提醒</p>
          <p>如不想收到此類提醒，請到 <a href="{{preferences_url}}" style="color: #ff9a9e;">提醒偏好設定</a> 關閉</p>
        </div>
      </div>
    `
  },
  
  INACTIVITY_REMINDER: {
    subject: '學習中斷提醒 - {{course_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">💤 學習中斷提醒</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">嗨 {{user_name}}！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
            您已經有一段時間沒有學習「<strong>{{course_title}}</strong>」了：
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #fcb69f; margin: 20px 0;">
            <p style="margin: 0; color: #666;">{{custom_message}}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{course_url}}" style="background: #fcb69f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              重新開始學習 →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>這是來自 iLearn 線上課程平台的自動提醒</p>
          <p>如不想收到此類提醒，請到 <a href="{{preferences_url}}" style="color: #fcb69f;">提醒偏好設定</a> 關閉</p>
        </div>
      </div>
    `
  },
  
  NEW_CONTENT_REMINDER: {
    subject: '新內容通知 - {{course_title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 新內容通知</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">嗨 {{user_name}}！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
            課程「<strong>{{course_title}}</strong>」有新內容上線了：
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #a8edea; margin: 20px 0;">
            <p style="margin: 0; color: #666;">{{custom_message}}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{course_url}}" style="background: #a8edea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              查看新內容 →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>這是來自 iLearn 線上課程平台的自動提醒</p>
          <p>如不想收到此類提醒，請到 <a href="{{preferences_url}}" style="color: #a8edea;">提醒偏好設定</a> 關閉</p>
        </div>
      </div>
    `
  }
};

// 替換變數函數
function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

// 發送 Email 函數
export async function sendReminderEmail({
  to,
  reminderType,
  variables,
  fromEmail = 'noreply@yourdomain.com', // 請替換為您的域名
  fromName = 'iLearn 線上課程平台'
}) {
  try {
    // 檢查是否有對應的模板
    const template = emailTemplates[reminderType];
    if (!template) {
      throw new Error(`未找到提醒類型 ${reminderType} 的模板`);
    }

    // 替換變數
    const subject = replaceVariables(template.subject, variables);
    const html = replaceVariables(template.html, variables);

    // 發送 Email
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend 發送失敗:', error);
      return { success: false, error: error.message };
    }

    console.log('Email 發送成功:', data);
    return { success: true, data };

  } catch (error) {
    console.error('Email 服務錯誤:', error);
    return { success: false, error: error.message };
  }
}

// 批量發送 Email 函數
export async function sendBatchReminderEmails(emailList) {
  const results = [];
  
  for (const emailData of emailList) {
    const result = await sendReminderEmail(emailData);
    results.push({
      email: emailData.to,
      success: result.success,
      error: result.error || null
    });
    
    // 避免 API 限制，每封信之間延遲 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// 測試 Email 函數
export async function sendTestEmail(to) {
  return await sendReminderEmail({
    to,
    reminderType: 'PROGRESS_REMINDER',
    variables: {
      user_name: '測試用戶',
      course_title: '測試課程',
      custom_message: '這是一封測試郵件，用於驗證 Email 發送功能是否正常運作。',
      course_url: 'https://yourdomain.com/courses/test',
      preferences_url: 'https://yourdomain.com/user/reminder-preferences'
    }
  });
}