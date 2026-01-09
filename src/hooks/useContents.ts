import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Content {
  id: string;
  title: string;
  description: string | null;
  type: 'movie' | 'series';
  thumbnail_url: string | null;
  video_url: string | null;
  duration: number | null;
  release_year: number | null;
  rating: number | null;
  category_id: string | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export const useContents = () => {
  return useQuery({
    queryKey: ['contents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('*, category:categories(id, name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Content[];
    }
  });
};

export const useFeaturedContent = () => {
  return useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('*, category:categories(id, name)')
        .eq('is_featured', true)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Content | null;
    }
  });
};

export const useContentsByCategory = () => {
  return useQuery({
    queryKey: ['contents-by-category'],
    queryFn: async () => {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*');
      
      if (catError) throw catError;
      
      const { data: contents, error: contError } = await supabase
        .from('contents')
        .select('*, category:categories(id, name)');
      
      if (contError) throw contError;
      
      return categories.map(category => ({
        ...category,
        contents: contents.filter(c => c.category_id === category.id)
      }));
    }
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    }
  });
};

export const useFavorites = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*, content:contents(*, category:categories(id, name))')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(f => f.content) as Content[];
    },
    enabled: !!user
  });
};

export const useWatchProgress = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['watch-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('watch_progress')
        .select('*, content:contents(*, category:categories(id, name))')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('last_watched_at', { ascending: false });
      
      if (error) throw error;
      return data.map(p => ({
        ...p.content,
        progress_seconds: p.progress_seconds
      })) as (Content & { progress_seconds: number })[];
    },
    enabled: !!user
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ contentId, isFavorite }: { contentId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, content_id: contentId });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });
};

export const useUpdateWatchProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ contentId, progressSeconds, completed = false }: { 
      contentId: string; 
      progressSeconds: number;
      completed?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('watch_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          progress_seconds: progressSeconds,
          completed,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,content_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress'] });
    }
  });
};

export const useContentById = (id: string) => {
  return useQuery({
    queryKey: ['content', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('*, category:categories(id, name)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Content;
    },
    enabled: !!id
  });
};
