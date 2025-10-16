-- 查看所有課程申請記錄
SELECT id, user_id, course_id, course_title, status, requested_at 
FROM course_requests 
ORDER BY requested_at DESC;
