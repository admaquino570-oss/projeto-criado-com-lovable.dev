import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Trash2, Edit } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useContents';
import { toast } from 'sonner';

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [contentForm, setContentForm] = useState<{
    title: string; description: string; type: 'movie' | 'series'; category_id: string;
    release_year: string; duration: string; rating: string; is_featured: boolean;
  }>({
    title: '', description: '', type: 'movie', category_id: '', 
    release_year: '', duration: '', rating: '', is_featured: false
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: contents = [] } = useQuery({
    queryKey: ['admin-contents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contents').select('*, category:categories(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('categories').insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada!');
      setNewCategory('');
      setIsCategoryOpen(false);
    },
    onError: (e: any) => toast.error(e.message)
  });

  const createContent = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let videoUrl = '';
      if (videoFile) {
        const fileName = `${Date.now()}-${videoFile.name}`;
        const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, videoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
        videoUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from('contents').insert({
        ...contentForm,
        video_url: videoUrl || null,
        release_year: contentForm.release_year ? parseInt(contentForm.release_year) : null,
        duration: contentForm.duration ? parseInt(contentForm.duration) : null,
        rating: contentForm.rating ? parseFloat(contentForm.rating) : null,
        category_id: contentForm.category_id || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast.success('Conteúdo criado!');
      setIsContentOpen(false);
      setContentForm({ title: '', description: '', type: 'movie', category_id: '', release_year: '', duration: '', rating: '', is_featured: false });
      setVideoFile(null);
      setUploading(false);
    },
    onError: (e: any) => { toast.error(e.message); setUploading(false); }
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast.success('Conteúdo excluído!');
    }
  });

  return (
    <div className="min-h-screen bg-background pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl mb-8">PAINEL ADMINISTRATIVO</h1>
        
        <div className="flex gap-4 mb-8">
          <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Nova Categoria</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nome da categoria" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                <Button onClick={() => createCategory.mutate(newCategory)} disabled={!newCategory}>Criar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isContentOpen} onOpenChange={setIsContentOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo Conteúdo</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Novo Conteúdo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Título</Label><Input value={contentForm.title} onChange={(e) => setContentForm({...contentForm, title: e.target.value})} /></div>
                <div><Label>Descrição</Label><Textarea value={contentForm.description} onChange={(e) => setContentForm({...contentForm, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo</Label>
                    <Select value={contentForm.type} onValueChange={(v: 'movie' | 'series') => setContentForm({...contentForm, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="movie">Filme</SelectItem><SelectItem value="series">Série</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Categoria</Label>
                    <Select value={contentForm.category_id} onValueChange={(v) => setContentForm({...contentForm, category_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Ano</Label><Input type="number" value={contentForm.release_year} onChange={(e) => setContentForm({...contentForm, release_year: e.target.value})} /></div>
                  <div><Label>Duração (min)</Label><Input type="number" value={contentForm.duration} onChange={(e) => setContentForm({...contentForm, duration: e.target.value})} /></div>
                  <div><Label>Nota</Label><Input type="number" step="0.1" max="10" value={contentForm.rating} onChange={(e) => setContentForm({...contentForm, rating: e.target.value})} /></div>
                </div>
                <div><Label>Vídeo MP4</Label><Input type="file" accept="video/mp4" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featured" checked={contentForm.is_featured} onChange={(e) => setContentForm({...contentForm, is_featured: e.target.checked})} />
                  <Label htmlFor="featured">Destaque</Label>
                </div>
                <Button onClick={() => createContent.mutate()} disabled={!contentForm.title || uploading} className="w-full">
                  {uploading ? 'Enviando...' : 'Criar Conteúdo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary"><tr><th className="p-4 text-left">Título</th><th className="p-4 text-left">Tipo</th><th className="p-4 text-left">Categoria</th><th className="p-4 text-left">Ações</th></tr></thead>
            <tbody>
              {contents.map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-4">{c.title}</td>
                  <td className="p-4 capitalize">{c.type === 'movie' ? 'Filme' : 'Série'}</td>
                  <td className="p-4">{c.category?.name || '-'}</td>
                  <td className="p-4"><Button variant="ghost" size="icon" onClick={() => deleteContent.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
