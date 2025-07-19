export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  actionUrl,
  actionText,
  metadata
}: {
  userId: string;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        action_text: actionText,
        metadata
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('創建通知失敗:', error);
    return { success: false, error: error.message };
  }
}