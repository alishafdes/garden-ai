
-- Create garden_sections table
CREATE TABLE public.garden_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🌱',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.garden_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sections" ON public.garden_sections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sections" ON public.garden_sections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sections" ON public.garden_sections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sections" ON public.garden_sections FOR DELETE USING (auth.uid() = user_id);

-- Add section_id to garden_plants
ALTER TABLE public.garden_plants ADD COLUMN section_id UUID REFERENCES public.garden_sections(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_garden_sections_updated_at
BEFORE UPDATE ON public.garden_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
