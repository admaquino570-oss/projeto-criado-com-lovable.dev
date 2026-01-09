import { useState } from 'react';
import { Play, Plus, Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToggleFavorite, useFavorites, Content } from '@/hooks/useContents';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  content: Content;
  showProgress?: boolean;
  progressSeconds?: number;
}

export const ContentCard = ({ content, showProgress, progressSeconds }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const isFavorite = favorites.some(f => f.id === content.id);
  const progressPercent = showProgress && content.duration && progressSeconds 
    ? (progressSeconds / (content.duration * 60)) * 100 
    : 0;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleFavorite.mutate({ contentId: content.id, isFavorite });
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/${content.id}`);
  };

  const handleInfo = () => {
    navigate(`/content/${content.id}`);
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-300',
        'w-full aspect-[2/3] rounded-md overflow-hidden',
        isHovered && 'z-10 scale-105 shadow-xl'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleInfo}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0">
        {content.thumbnail_url ? (
          <img
            src={content.thumbnail_url}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Sem imagem</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && progressPercent > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      )}

      {/* Hover Overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        'flex flex-col justify-end p-3'
      )}>
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{content.title}</h3>
        
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-muted-foreground capitalize">{content.type === 'movie' ? 'Filme' : 'Série'}</span>
          {content.release_year && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{content.release_year}</span>
            </>
          )}
          {content.rating && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-primary">★ {content.rating}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={handlePlay}
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full border-foreground/50"
            onClick={handleToggleFavorite}
          >
            {isFavorite ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full border-foreground/50 ml-auto"
            onClick={(e) => { e.stopPropagation(); handleInfo(); }}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
