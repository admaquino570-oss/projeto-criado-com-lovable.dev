import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { useFeaturedContent, useContentsByCategory, useWatchProgress } from '@/hooks/useContents';
import { useAuth } from '@/contexts/AuthContext';

export default function Browse() {
  const { user } = useAuth();
  const { data: featured } = useFeaturedContent();
  const { data: categories = [] } = useContentsByCategory();
  const { data: continueWatching = [] } = useWatchProgress();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroBanner content={featured} />
      <div className="relative -mt-32 z-10 space-y-8 pb-16">
        {user && continueWatching.length > 0 && (
          <ContentRow title="CONTINUAR ASSISTINDO" contents={continueWatching} showProgress />
        )}
        {categories.map((category) => (
          <ContentRow key={category.id} title={category.name.toUpperCase()} contents={category.contents || []} />
        ))}
      </div>
    </div>
  );
}
