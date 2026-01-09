import { Navbar } from '@/components/Navbar';
import { ContentRow } from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useContents';

export default function MyList() {
  const { data: favorites = [], isLoading } = useFavorites();

  return (
    <div className="min-h-screen bg-background pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl mb-8">MINHA LISTA</h1>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : favorites.length === 0 ? (
          <p className="text-muted-foreground">Você ainda não adicionou nada à sua lista.</p>
        ) : (
          <ContentRow title="" contents={favorites} />
        )}
      </div>
    </div>
  );
}
