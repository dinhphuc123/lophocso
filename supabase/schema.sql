-- Schema Cơ sở dữ liệu Supabase cho Khảo Thí Số (KhaoThiSo)
-- Hỗ trợ cấu trúc đề thi BGD 2025, phòng game trực tiếp & hồ sơ giáo viên

-- 1. Bảng Đề thi (Exams)
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 45,
    duration_minutes INTEGER DEFAULT 45,
    target_class TEXT DEFAULT 'Toàn trường',
    deadline TEXT,
    total_questions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    subject TEXT DEFAULT 'Toán',
    grade TEXT DEFAULT '12',
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS target_class TEXT DEFAULT 'Toàn trường';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 45;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS deadline TEXT;

-- 2. Bảng Lớp học (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT DEFAULT '12',
    students JSONB DEFAULT '[]'::jsonb,
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS students JSONB DEFAULT '[]'::jsonb;

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

-- 5. Bảng Hồ sơ & Bảo mật Giáo viên (Teacher Profile)
CREATE TABLE IF NOT EXISTS public.teacher_profile (
    id TEXT PRIMARY KEY DEFAULT 'default_teacher',
    name TEXT DEFAULT 'Thầy/Cô Giáo',
    school TEXT DEFAULT 'Trường THPT',
    subject TEXT DEFAULT 'Toán học',
    email TEXT DEFAULT 'giaovien@khaothiso.vn',
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tắt RLS an toàn (Kiểm tra từng bảng trước khi tắt, không bao giờ báo lỗi bảng chưa tồn tại)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
    ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.exams TO anon, authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN
    ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'submissions') THEN
    ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.submissions TO anon, authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_rooms') THEN
    ALTER TABLE public.game_rooms DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.game_rooms TO anon, authenticated, service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_profile') THEN
    ALTER TABLE public.teacher_profile DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.teacher_profile TO anon, authenticated, service_role;
  END IF;
END $$;
