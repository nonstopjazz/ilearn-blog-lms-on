import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendReminderEmail } from '@/lib/emailService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 檢查管理員權限
async function checkAdminPermission(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { error: '缺少認證資訊', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: '認證失敗', status: 401 };
    }

    const isAdmin = user.user_metadata?.role === 'admin' || 
                   user.email?.includes('admin') || 
                   user.id === '36258aeb-f26d-406e-a8ed-25595a736614';

    if (!isAdmin) {
      return { error: '權限不足', status: 403 };
    }

    return { user, isAdmin: true };
  } catch (error) {
    return { error: '權限檢查失敗', status: 500 };
  }
}

// 處理提醒訊息模板變數
function processMessageTemplate(template, variables) {
  let message = template;
  
  // 替換變數
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, value);
  });
  
  return message;
}

// 提醒類型對應 Email 模板
const reminderTypeMapping = {
  'progress': 'PROGRESS_REMINDER',
  'assignment': 'ASSIGNMENT_REMINDER',
  'deadline': 'DEADLINE_REMINDER',
  'inactivity': 'INACTIVITY_REMINDER',
  'new_content': 'NEW_CONTENT_REMINDER'
};

// 檢查學習進度提醒條件
async function checkProgressReminders() {
  const results = [];
  
  try {
    // 查詢啟用的進度提醒設定
    const { data: progressReminders } = await supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (id, title)
      `)
      .eq('reminder_type', 'progress')
      .eq('is_enabled', true);

    if (!progressReminders) return results;

    for (const reminder of progressReminders) {
      const daysInactive = reminder.trigger_condition?.days_inactive || 3;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      // 查詢需要提醒的用戶
      const { data: usersToRemind } = await supabase
        .from('user_course_access')
        .select(`
          user_id,
          course_id,
          users (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('course_id', reminder.course_id)
        .eq('status', 'active');

      if (usersToRemind) {
        for (const userAccess of usersToRemind) {
          // 檢查用戶偏好設定
          const { data: userPref } = await supabase
            .from('user_reminder_preferences')
            .select('is_enabled')
            .eq('user_id', userAccess.user_id)
            .eq('course_id', reminder.course_id)
            .eq('reminder_type', 'progress')
            .single();

          // 如果用戶關閉了這個提醒，跳過
          if (userPref && !userPref.is_enabled) continue;

          // 檢查最近的學習活動
          const { data: recentActivity } = await supabase
            .from('user_lesson_progress')
            .select('updated_at')
            .eq('user_id', userAccess.user_id)
            .eq('course_id', reminder.course_id)
            .gte('updated_at', cutoffDate.toISOString())
            .limit(1);

          // 如果沒有最近活動，加入提醒列表
          if (!recentActivity || recentActivity.length === 0) {
            results.push({
              user: userAccess.users,
              reminder: reminder,
              reason: `${daysInactive}天無學習活動`
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('檢查進度提醒失敗:', error);
  }

  return results;
}

// 檢查學習中斷提醒
async function checkInactivityReminders() {
  const results = [];
  
  try {
    // 查詢啟用的學習中斷提醒設定
    const { data: inactivityReminders } = await supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (id, title)
      `)
      .eq('reminder_type', 'inactivity')
      .eq('is_enabled', true);

    if (!inactivityReminders) return results;

    for (const reminder of inactivityReminders) {
      const daysInactive = reminder.trigger_condition?.days_inactive || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      // 查詢需要提醒的用戶
      const { data: usersToRemind } = await supabase
        .from('user_course_access')
        .select(`
          user_id,
          course_id,
          users (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('course_id', reminder.course_id)
        .eq('status', 'active');

      if (usersToRemind) {
        for (const userAccess of usersToRemind) {
          // 檢查用戶偏好設定
          const { data: userPref } = await supabase
            .from('user_reminder_preferences')
            .select('is_enabled')
            .eq('user_id', userAccess.user_id)
            .eq('course_id', reminder.course_id)
            .eq('reminder_type', 'inactivity')
            .single();

          if (userPref && !userPref.is_enabled) continue;

          // 檢查最近的學習活動
          const { data: recentActivity } = await supabase
            .from('user_lesson_progress')
            .select('updated_at')
            .eq('user_id', userAccess.user_id)
            .eq('course_id', reminder.course_id)
            .gte('updated_at', cutoffDate.toISOString())
            .limit(1);

          // 如果沒有最近活動，加入提醒列表
          if (!recentActivity || recentActivity.length === 0) {
            results.push({
              user: userAccess.users,
              reminder: reminder,
              reason: `${daysInactive}天無學習活動`
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('檢查學習中斷提醒失敗:', error);
  }

  return results;
}

// 檢查作業截止提醒
async function checkDeadlineReminders() {
  const results = [];
  
  try {
    // 查詢啟用的截止日期提醒設定
    const { data: deadlineReminders } = await supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (id, title)
      `)
      .eq('reminder_type', 'deadline')
      .eq('is_enabled', true);

    if (!deadlineReminders) return results;

    for (const reminder of deadlineReminders) {
      const daysBefore = reminder.trigger_condition?.days_before_deadline || 2;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // 查詢即將截止的作業 (這裡需要根據你的實際作業系統調整)
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', reminder.course_id)
        .lte('deadline', targetDate.toISOString())
        .gte('deadline', new Date().toISOString());

      if (assignments) {
        // 查詢課程的所有學員
        const { data: courseUsers } = await supabase
          .from('user_course_access')
          .select(`
            user_id,
            users (
              id,
              email,
              raw_user_meta_data
            )
          `)
          .eq('course_id', reminder.course_id)
          .eq('status', 'active');

        if (courseUsers) {
          for (const userAccess of courseUsers) {
            // 檢查用戶偏好設定
            const { data: userPref } = await supabase
              .from('user_reminder_preferences')
              .select('is_enabled')
              .eq('user_id', userAccess.user_id)
              .eq('course_id', reminder.course_id)
              .eq('reminder_type', 'deadline')
              .single();

            if (userPref && !userPref.is_enabled) continue;

            for (const assignment of assignments) {
              results.push({
                user: userAccess.users,
                reminder: reminder,
                assignment: assignment,
                reason: `作業將在 ${daysBefore} 天後截止`
              });
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('檢查截止提醒失敗:', error);
  }

  return results;
}

// 檢查作業提醒
async function checkAssignmentReminders() {
  const results = [];
  
  try {
    // 查詢啟用的作業提醒設定
    const { data: assignmentReminders } = await supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (id, title)
      `)
      .eq('reminder_type', 'assignment')
      .eq('is_enabled', true);

    if (!assignmentReminders) return results;

    for (const reminder of assignmentReminders) {
      // 查詢課程的所有學員
      const { data: courseUsers } = await supabase
        .from('user_course_access')
        .select(`
          user_id,
          users (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('course_id', reminder.course_id)
        .eq('status', 'active');

      if (courseUsers) {
        for (const userAccess of courseUsers) {
          // 檢查用戶偏好設定
          const { data: userPref } = await supabase
            .from('user_reminder_preferences')
            .select('is_enabled')
            .eq('user_id', userAccess.user_id)
            .eq('course_id', reminder.course_id)
            .eq('reminder_type', 'assignment')
            .single();

          if (userPref && !userPref.is_enabled) continue;

          // 查詢未完成的作業
          const { data: assignments } = await supabase
            .from('assignments')
            .select('*')
            .eq('course_id', reminder.course_id)
            .gte('deadline', new Date().toISOString());

          if (assignments) {
            for (const assignment of assignments) {
              results.push({
                user: userAccess.users,
                reminder: reminder,
                assignment: assignment,
                reason: '有未完成的作業'
              });
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('檢查作業提醒失敗:', error);
  }

  return results;
}

// 檢查新內容提醒
async function checkNewContentReminders() {
  const results = [];
  
  try {
    // 查詢啟用的新內容提醒設定
    const { data: newContentReminders } = await supabase
      .from('admin_course_reminders')
      .select(`
        *,
        courses (id, title)
      `)
      .eq('reminder_type', 'new_content')
      .eq('is_enabled', true);

    if (!newContentReminders) return results;

    for (const reminder of newContentReminders) {
      const hoursAgo = reminder.trigger_condition?.hours_after_new_content || 24;
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);

      // 查詢最近新增的課程內容
      const { data: newLessons } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', reminder.course_id)
        .gte('created_at', cutoffDate.toISOString());

      if (newLessons && newLessons.length > 0) {
        // 查詢課程的所有學員
        const { data: courseUsers } = await supabase
          .from('user_course_access')
          .select(`
            user_id,
            users (
              id,
              email,
              raw_user_meta_data
            )
          `)
          .eq('course_id', reminder.course_id)
          .eq('status', 'active');

        if (courseUsers) {
          for (const userAccess of courseUsers) {
            // 檢查用戶偏好設定
            const { data: userPref } = await supabase
              .from('user_reminder_preferences')
              .select('is_enabled')
              .eq('user_id', userAccess.user_id)
              .eq('course_id', reminder.course_id)
              .eq('reminder_type', 'new_content')
              .single();

            if (userPref && !userPref.is_enabled) continue;

            results.push({
              user: userAccess.users,
              reminder: reminder,
              newContent: newLessons,
              reason: `新增了 ${newLessons.length} 個課程內容`
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('檢查新內容提醒失敗:', error);
  }

  return results;
}

// 發送站內通知
async function sendInAppNotification(userId, title, message, actionUrl) {
  try {
    await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'info',
        title: title,
        message: message,
        action_url: actionUrl,
        created_at: new Date().toISOString()
      }]);
    return true;
  } catch (error) {
    console.error('發送站內通知失敗:', error);
    return false;
  }
}

// 記錄提醒發送
async function logReminderSent(userId, courseId, reminderType, deliveryMethod, subject, message, triggerData, success = true, error = null) {
  try {
    await supabase
      .from('reminder_logs')
      .insert([{
        user_id: userId,
        course_id: courseId,
        reminder_type: reminderType,
        delivery_method: deliveryMethod,
        status: success ? 'sent' : 'failed',
        subject: subject,
        message: message,
        trigger_data: triggerData,
        error_message: error,
        sent_at: success ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      }]);
  } catch (error) {
    console.error('記錄提醒失敗:', error);
  }
}

// 發送 Email 提醒
async function sendEmailReminder(user, reminder, variables, triggerData) {
  try {
    const emailType = reminderTypeMapping[reminder.reminder_type];
    if (!emailType) {
      throw new Error(`不支援的提醒類型: ${reminder.reminder_type}`);
    }

    // 準備 Email 變數
    const emailVariables = {
      ...variables,
      course_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/${reminder.course_id}`,
      preferences_url: `${process.env.NEXT_PUBLIC_SITE_URL}/user/reminder-preferences`
    };

    // 發送 Email
    const result = await sendReminderEmail({
      to: user.email,
      reminderType: emailType,
      variables: emailVariables,
      fromEmail: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      fromName: process.env.FROM_NAME || 'iLearn 線上課程平台'
    });

    if (result.success) {
      await logReminderSent(
        user.id,
        reminder.course_id,
        reminder.reminder_type,
        'email',
        `${reminder.courses?.title} - ${reminder.reminder_type}提醒`,
        variables.custom_message,
        triggerData,
        true
      );
      return true;
    } else {
      await logReminderSent(
        user.id,
        reminder.course_id,
        reminder.reminder_type,
        'email',
        `${reminder.courses?.title} - ${reminder.reminder_type}提醒`,
        variables.custom_message,
        triggerData,
        false,
        result.error
      );
      return false;
    }

  } catch (error) {
    console.error('發送 Email 提醒失敗:', error);
    await logReminderSent(
      user.id,
      reminder.course_id,
      reminder.reminder_type,
      'email',
      `${reminder.courses?.title} - ${reminder.reminder_type}提醒`,
      variables.custom_message,
      triggerData,
      false,
      error.message
    );
    return false;
  }
}

// POST - 手動發送提醒 (供管理員測試)
export async function POST(request) {
  try {
    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { reminderType, courseId, userId, testMode = false } = body;

    const results = {
      sent: [],
      failed: [],
      total: 0,
      emailSent: 0,
      inAppSent: 0
    };

    let remindersToSend = [];

    // 根據提醒類型獲取需要發送的提醒
    switch (reminderType) {
      case 'progress':
        remindersToSend = await checkProgressReminders();
        break;
      case 'deadline':
        remindersToSend = await checkDeadlineReminders();
        break;
      case 'assignment':
        remindersToSend = await checkAssignmentReminders();
        break;
      case 'inactivity':
        remindersToSend = await checkInactivityReminders();
        break;
      case 'new_content':
        remindersToSend = await checkNewContentReminders();
        break;
      default:
        return NextResponse.json({ error: '不支援的提醒類型' }, { status: 400 });
    }

    // 如果指定了特定課程或用戶，進行過濾
    if (courseId) {
      remindersToSend = remindersToSend.filter(item => item.reminder.course_id === courseId);
    }
    if (userId) {
      remindersToSend = remindersToSend.filter(item => item.user.id === userId);
    }

    results.total = remindersToSend.length;

    // 發送提醒
    for (const item of remindersToSend) {
      try {
        const { user, reminder, reason, assignment, newContent } = item;
        
        const variables = {
          course_title: reminder.courses?.title || reminder.course_id,
          user_name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || '同學',
          custom_message: processMessageTemplate(reminder.message_template, {
            course_title: reminder.courses?.title || reminder.course_id,
            user_name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || '同學',
            reason: reason,
            assignment_title: assignment?.title || '',
            new_content_count: newContent?.length || 0
          })
        };

        const title = `${reminder.courses?.title} - ${reminderType}提醒`;
        const triggerData = { 
          reason, 
          assignment_id: assignment?.id,
          new_content_count: newContent?.length || 0
        };

        let inAppSent = false;
        let emailSent = false;

        // 發送站內通知
        if (reminder.in_app_enabled) {
          const actionUrl = `/courses/${reminder.course_id}`;
          if (!testMode) {
            inAppSent = await sendInAppNotification(user.id, title, variables.custom_message, actionUrl);
            if (inAppSent) {
              await logReminderSent(
                user.id, 
                reminder.course_id, 
                reminderType, 
                'in_app', 
                title, 
                variables.custom_message, 
                triggerData
              );
              results.inAppSent++;
            }
          } else {
            inAppSent = true; // 測試模式假設成功
            results.inAppSent++;
          }
        }

        // 發送 Email 通知
        if (reminder.email_enabled && !testMode) {
          emailSent = await sendEmailReminder(user, reminder, variables, triggerData);
          if (emailSent) {
            results.emailSent++;
          }
        } else if (reminder.email_enabled && testMode) {
          emailSent = true; // 測試模式假設成功
          results.emailSent++;
        }

        if (inAppSent || emailSent) {
          results.sent.push({
            userId: user.id,
            email: user.email,
            courseId: reminder.course_id,
            reminderType: reminderType,
            reason: reason,
            inAppSent: inAppSent,
            emailSent: emailSent
          });
        } else {
          results.failed.push({
            userId: user.id,
            email: user.email,
            error: '所有發送方式都失敗'
          });
        }

      } catch (error) {
        console.error('發送個別提醒失敗:', error);
        results.failed.push({
          userId: item.user.id,
          email: item.user.email,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `已處理 ${results.total} 個提醒，成功發送 ${results.sent.length} 個 (站內: ${results.inAppSent}, Email: ${results.emailSent})`,
      data: results,
      testMode: testMode
    });

  } catch (error) {
    console.error('POST /api/admin/send-reminders 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// GET - 預覽需要發送的提醒
export async function GET(request) {
  try {
    const authResult = await checkAdminPermission(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('reminderType') || 'all';

    const preview = {
      progress: [],
      deadline: [],
      assignment: [],
      inactivity: [],
      new_content: [],
      total: 0
    };

    if (reminderType === 'all' || reminderType === 'progress') {
      preview.progress = await checkProgressReminders();
    }

    if (reminderType === 'all' || reminderType === 'deadline') {
      preview.deadline = await checkDeadlineReminders();
    }

    if (reminderType === 'all' || reminderType === 'assignment') {
      preview.assignment = await checkAssignmentReminders();
    }

    if (reminderType === 'all' || reminderType === 'inactivity') {
      preview.inactivity = await checkInactivityReminders();
    }

    if (reminderType === 'all' || reminderType === 'new_content') {
      preview.new_content = await checkNewContentReminders();
    }

    preview.total = preview.progress.length + preview.deadline.length + 
                   preview.assignment.length + preview.inactivity.length + 
                   preview.new_content.length;

    return NextResponse.json({
      success: true,
      data: preview
    });

  } catch (error) {
    console.error('GET /api/admin/send-reminders 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}