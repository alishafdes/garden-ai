
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  zip_code TEXT,
  experience_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Plants catalog (public reference data)
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  plant_type TEXT,
  sunlight TEXT,
  watering_frequency TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plants are publicly readable" ON public.plants FOR SELECT USING (true);

-- User's garden inventory
CREATE TABLE public.garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plant_id UUID REFERENCES public.plants(id),
  nickname TEXT,
  location TEXT,
  health_score INTEGER DEFAULT 80 CHECK (health_score >= 0 AND health_score <= 100),
  notes TEXT,
  planted_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own garden plants" ON public.garden_plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own garden plants" ON public.garden_plants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own garden plants" ON public.garden_plants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own garden plants" ON public.garden_plants FOR DELETE USING (auth.uid() = user_id);

-- Maintenance tasks
CREATE TABLE public.garden_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  garden_plant_id UUID REFERENCES public.garden_plants(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garden_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.garden_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.garden_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.garden_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.garden_tasks FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_garden_plants_updated_at BEFORE UPDATE ON public.garden_plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some common plants
INSERT INTO public.plants (common_name, scientific_name, plant_type, sunlight, watering_frequency, description) VALUES
('Tomato', 'Solanum lycopersicum', 'Vegetable', 'Full Sun', 'Daily', 'A warm-season crop perfect for beginners. Thrives in well-drained soil.'),
('Basil', 'Ocimum basilicum', 'Herb', 'Full Sun', 'Every 2 days', 'Aromatic herb that pairs perfectly with tomatoes. Pinch flowers to encourage leaf growth.'),
('Hydrangea', 'Hydrangea macrophylla', 'Shrub', 'Partial Shade', 'Every 3 days', 'Showy flowering shrub. Soil pH affects bloom color—acidic for blue, alkaline for pink.'),
('Lavender', 'Lavandula angustifolia', 'Perennial', 'Full Sun', 'Weekly', 'Drought-tolerant once established. Excellent for pollinators and fragrance.'),
('Lettuce', 'Lactuca sativa', 'Vegetable', 'Partial Shade', 'Daily', 'Cool-season crop ideal for succession planting. Bolts in heat—plant in spring or fall.'),
('Rosemary', 'Salvia rosmarinus', 'Herb', 'Full Sun', 'Weekly', 'Hardy Mediterranean herb. Prefers dry, well-drained soil. Great for cooking.'),
('Zucchini', 'Cucurbita pepo', 'Vegetable', 'Full Sun', 'Every 2 days', 'Prolific producer. One plant can feed a family. Watch for squash vine borers.'),
('Marigold', 'Tagetes', 'Annual', 'Full Sun', 'Every 3 days', 'Natural pest deterrent. Plant near vegetables to repel aphids and whiteflies.');
