-- 建立專案作業模板表
CREATE TABLE IF NOT EXISTS project_assignment_templates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,
    assignments JSONB NOT NULL, -- [{title, description, estimatedDuration, resources, requirements}]
    tags TEXT[],
    target_audience TEXT, -- 目標學生群（如：進階班、基礎班）
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立專案作業派發記錄表
CREATE TABLE IF NOT EXISTS project_assignment_distributions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    template_id VARCHAR,
    student_id UUID NOT NULL,
    distributed_at TIMESTAMPTZ DEFAULT NOW(),
    distributed_by UUID,
    assignment_ids TEXT[], -- 生成的作業 ID 列表
    notes TEXT,
    FOREIGN KEY (template_id) REFERENCES project_assignment_templates(id) ON DELETE SET NULL
);

-- 為 assignments 表新增標記專案作業的欄位
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS is_project_assignment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS template_id VARCHAR;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_assignments_is_project ON assignments(is_project_assignment, is_published);
CREATE INDEX IF NOT EXISTS idx_project_distributions_student ON project_assignment_distributions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_status ON assignment_submissions(student_id, status);

-- 建立觸發器自動更新 updated_at
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_assignment_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 插入範例專案作業模板
INSERT INTO project_assignment_templates (template_name, description, assignments, tags, target_audience) VALUES
(
    '英文專題研究計畫',
    '適合進階學生的深度英文專題研究',
    '[
        {
            "title": "選題與文獻回顧",
            "description": "確定研究主題並完成至少5篇相關文獻的閱讀與摘要",
            "estimatedDuration": 240,
            "requirements": ["研究題目", "文獻清單", "摘要報告"]
        },
        {
            "title": "研究架構規劃",
            "description": "建立研究架構、研究問題與預期成果",
            "estimatedDuration": 180,
            "requirements": ["研究架構圖", "研究問題清單", "預期成果說明"]
        },
        {
            "title": "資料收集與分析",
            "description": "進行資料收集並完成初步分析",
            "estimatedDuration": 360,
            "requirements": ["資料收集記錄", "分析報告"]
        },
        {
            "title": "專題報告撰寫",
            "description": "完成完整的英文專題報告",
            "estimatedDuration": 480,
            "requirements": ["完整報告", "參考文獻"]
        },
        {
            "title": "口頭簡報準備",
            "description": "準備專題簡報並進行口頭報告",
            "estimatedDuration": 180,
            "requirements": ["簡報檔", "報告影片"]
        }
    ]'::jsonb,
    ARRAY['專案作業', '進階', '研究'],
    '進階班學生'
),
(
    '基礎英文閱讀計畫',
    '適合基礎班學生的閱讀訓練專案',
    '[
        {
            "title": "繪本閱讀週",
            "description": "每週閱讀指定繪本並完成讀後心得",
            "estimatedDuration": 120,
            "requirements": ["閱讀記錄", "心得報告"]
        },
        {
            "title": "短篇故事理解",
            "description": "閱讀短篇英文故事並回答理解問題",
            "estimatedDuration": 90,
            "requirements": ["閱讀筆記", "問題解答"]
        },
        {
            "title": "角色扮演練習",
            "description": "選擇故事角色進行角色扮演錄音",
            "estimatedDuration": 120,
            "requirements": ["角色分析", "錄音檔案"]
        },
        {
            "title": "閱讀成果分享",
            "description": "製作閱讀成果海報或簡報",
            "estimatedDuration": 150,
            "requirements": ["成果海報", "分享影片"]
        }
    ]'::jsonb,
    ARRAY['專案作業', '基礎', '閱讀'],
    '基礎班學生'
);
