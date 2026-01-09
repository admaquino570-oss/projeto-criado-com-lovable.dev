import { Play, Info, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Content, useFavorites, useToggleFavorite } from '@/hooks/useContents';
import { useAuth } from '@/contexts/AuthContext';
import heroBackground from '@/assets/hero-background.jpg';

interface HeroBannerProps {
  content?: Content | null;
}

export const HeroBanner = ({ content }: HeroBannerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const isFavorite = content ? favorites.some(f => f.id === content.id) : false;

  const handlePlay = () => {
    if (content) {
      navigate(`/watch/${content.id}`);
    }
  };

  const handleInfo = () => {
    if (content) {
      navigate(`/content/${content.id}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (content) {
      toggleFavorite.mutate({ contentId: content.id, isFavorite });
    }
  };

  return (
    <div className="relative h-[80vh] min-h-[500px] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={content?.thumbnail_url || heroBackground}
          alt={content?.title || 'Hero'}
          className="w-full h-full object-cover"
        />
        {/* Gradients */}
        <div className="absolute inset-0 netflix-featured-gradient" />
        <div className="absolute bottom-0 left-0 right-0 h-40 netflix-gradient" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 md:px-12 pt-20">
          <div className="max-w-xl animate-fade-in-up">
            {content ? (
              <>
                <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded mb-4">
                  {content.is_featured ? 'EM DESTAQUE' : content.type === 'movie' ? 'FILME' : 'SÉRIE'}
                </span>
                <h1 className="font-display text-5xl md:text-7xl text-shadow mb-4">
                  {content.title}
                </h1>
                <p className="text-lg text-foreground/90 line-clamp-3 mb-6 text-shadow">
                  {content.description || 'Assista agora no Streamflix'}
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    size="lg" 
                    onClick={handlePlay}
                    className="gap-2 font-semibold"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    Assistir
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={handleInfo}
                    className="gap-2"
                  >
                    <Info className="h-5 w-5" />
                    Mais Informações
                  </Button>

                  {user && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={handleToggleFavorite}
                      className="gap-2"
                    >
                      {isFavorite ? (
                        <>
                          <Check className="h-5 w-5" />
                          Na Lista
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          Minha Lista
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
                  {content.release_year && <span>{content.release_year}</span>}
                  {content.duration && <span>{content.duration} min</span>}
                  {content.rating && (
                    <span className="flex items-center gap-1 text-primary">
                      <span>★</span> {content.rating}
                    </span>
                  )}
                  {content.category && (
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {content.category.name}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display text-5xl md:text-7xl text-shadow mb-4">
                  BEM-VINDO AO STREAMFLIX
                </h1>
                <p className="text-lg text-foreground/90 mb-6 text-shadow">
                  Descubra filmes e séries incríveis. Faça login para começar a assistir.
                </p>
                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/signup')}
                    className="gap-2 font-semibold"
                  >
                    Começar Agora
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={() => navigate('/login')}
                    className="gap-2"
                  >
                    Já tenho conta
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
