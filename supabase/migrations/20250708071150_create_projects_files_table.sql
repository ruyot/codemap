-- Migration to create "projects" and "files" tables

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'directory')),
    path TEXT NOT NULL,
    content TEXT,
    project_id UUID REFERENCES public.projects (id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.files (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Trigger to update "updated_at" on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_files_timestamp
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
