-- Schema Cơ sở dữ liệu Supabase cho Khảo Thí Số (KhaoThiSo)
-- Hỗ trợ cấu trúc đề thi BGD 2025 & Phòng game trực tiếp

-- 1. Bảng Đề thi (Exams)
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 45,
    total_questions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    subject TEXT DEFAULT 'Toán',
    grade TEXT DEFAULT '12',
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Lớp học (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT DEFAULT '12',
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Bài nộp học sinh (Submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_id TEXT,
    class_name TEXT,
    answers JSONB DEFAULT '{}'::jsonb,
    score NUMERIC(5, 2) DEFAULT 0,
    total_score NUMERIC(5, 2) DEFAULT 10,
    details JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ
);

-- 4. Bảng Phòng Game Trực Tiếp (Game Rooms)
CREATE TABLE IF NOT EXISTS public.game_rooms (
    pin TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'arena',
    exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
    state TEXT NOT NULL DEFAULT 'lobby',
    current_question_index INTEGER DEFAULT 0,
    questions JSONB DEFAULT '[]'::jsonb,
    players JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật tính năng Realtime cho bảng game_rooms để đồng bộ trực tiếp máy chiếu & học sinh
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;

-- Tạo Indexes tăng tốc truy vấn phổ điểm & tìm kiếm
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON public.submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON public.exams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_rooms_state ON public.game_rooms(state);
