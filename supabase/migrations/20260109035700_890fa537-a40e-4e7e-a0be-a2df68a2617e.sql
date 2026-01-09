-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content type enum
CREATE TYPE public.content_type AS ENUM ('movie', 'series');

-- Create contents table for movies and series
CREATE TABLE public.contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type content_type NOT NULL DEFAULT 'movie',
    thumbnail_url TEXT,
    video_url TEXT,
    duration INTEGER, -- in minutes
    release_year INTEGER,
    rating DECIMAL(2,1),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, content_id)
);

-- Create watch_progress table
CREATE TABLE public.watch_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
    progress_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, content_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'admin'
    )
$$;

-- Security definer function to check if admin exists
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE role = 'admin'
    )
$$;

-- Function to automatically create profile and assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assigned_role app_role;
BEGIN
    -- Check if an admin already exists
    IF NOT public.admin_exists() THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := 'user';
    END IF;

    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);

    RETURN NEW;
END;
$$;

-- Trigger to run on new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contents_updated_at
    BEFORE UPDATE ON public.contents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update categories"
    ON public.categories FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete categories"
    ON public.categories FOR DELETE
    USING (public.is_admin(auth.uid()));

-- RLS Policies for contents (public read, admin write)
CREATE POLICY "Anyone can view contents"
    ON public.contents FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert contents"
    ON public.contents FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update contents"
    ON public.contents FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete contents"
    ON public.contents FOR DELETE
    USING (public.is_admin(auth.uid()));

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites"
    ON public.favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their favorites"
    ON public.favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their favorites"
    ON public.favorites FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for watch_progress
CREATE POLICY "Users can view their own progress"
    ON public.watch_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their progress"
    ON public.watch_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
    ON public.watch_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'videos');

CREATE POLICY "Only admins can upload videos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update videos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete videos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'videos' AND public.is_admin(auth.uid()));