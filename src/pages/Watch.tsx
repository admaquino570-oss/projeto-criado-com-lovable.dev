import { useParams } from 'react-router-dom';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useContentById, useUpdateWatchProgress } from '@/hooks/useContents';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const { data: content, isLoading } = useContentById(id || '');
  const updateProgress = useUpdateWatchProgress();

  const handleProgress = (seconds: number) => {
    if (id) {
      updateProgress.mutate({ contentId: id, progressSeconds: seconds });
    }
  };

  if (isLoading || !content) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="h-screen bg-background">
      <VideoPlayer 
        videoUrl={content.video_url || ''} 
        title={content.title} 
        onProgress={handleProgress}
      />
    </div>
  );
}
