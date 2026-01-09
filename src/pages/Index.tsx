import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { useFeaturedContent } from '@/hooks/useContents';

const Index = () => {
  const { data: featured } = useFeaturedContent();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroBanner content={featured} />
    </div>
  );
};

export default Index;
