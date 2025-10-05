-- 建立考試類型管理表
CREATE TABLE IF NOT EXISTS exam_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL UNIQUE,           -- 內部識別名稱（英文，唯一）
    display_name VARCHAR(100) NOT NULL,          -- 顯示名稱（中文）
    description TEXT,
    color VARCHAR(50) NOT NULL DEFAULT '#3B82F6', -- 圖表顏色（支援 rgb() 或十六進位）
    icon VARCHAR(50),                             -- 圖示 emoji 或 icon name
    is_active BOOLEAN DEFAULT TRUE,               -- 是否啟用（管理員可切換）
    order_index INTEGER DEFAULT 0,                -- 排序順序
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入預設的考試類型
-- 包含目前使用的類型 + 您要求的類型
INSERT INTO exam_types (name, display_name, description, color, icon, is_active, order_index) VALUES
('quiz', '小考', '週間小型測驗', 'rgb(59, 130, 246)', '📝', true, 1),
('class_test', '隨堂考', '課堂即時測驗', 'rgb(168, 85, 247)', '✏️', true, 2),
('vocabulary_test', '單字測驗', '單字背誦測驗', 'rgb(34, 197, 94)', '📚', true, 3),
('speaking_eval', '口說評量', '口語能力評估', 'rgb(251, 146, 60)', '🗣️', true, 4),
('midterm', '段考', '期中/期末段考', 'rgb(239, 68, 68)', '📋', true, 5),
('mock_exam', '模擬考', '模擬正式考試', 'rgb(124, 58, 237)', '🎓', true, 6),
('makeup', '補考', '補考測驗', 'rgb(107, 114, 128)', '🔄', true, 7),
('listening_test', '聽力測驗', '聽力能力測驗', 'rgb(14, 165, 233)', '🎧', false, 8),
('writing_test', '寫作測驗', '寫作能力測驗', 'rgb(236, 72, 153)', '✍️', false, 9)
ON CONFLICT (name) DO NOTHING;

-- 建立索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_exam_types_active ON exam_types(is_active, order_index);

-- 建立觸發器自動更新 updated_at
CREATE TRIGGER update_exam_types_updated_at BEFORE UPDATE ON exam_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 註解說明：
-- 1. 預設啟用 7 種常用類型（小考、隨堂考、單字測驗、口說評量、段考、模擬考、補考）
-- 2. 聽力測驗和寫作測驗預設關閉，管理員可視需要啟用
-- 3. 未來可擴充更多類型
-- 4. exam_records.exam_type 目前保持字串欄位以維持向後兼容性
