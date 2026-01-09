import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentCard } from './ContentCard';
import { Content } from '@/hooks/useContents';
import { cn } from '@/lib/utils';

interface ContentRowProps {
  title: string;
  contents: Content[];
  showProgress?: boolean;
}

export const ContentRow = ({ title, contents, showProgress }: ContentRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (contents.length === 0) return null;

  return (
    <div className="relative group/row">
      <h2 className="font-display text-2xl mb-4 px-4 md:px-12">{title}</h2>
      
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'h-full w-12 rounded-none bg-background/50 hover:bg-background/80',
            'opacity-0 group-hover/row:opacity-100 transition-opacity',
            !showLeftArrow && 'hidden'
          )}
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        {/* Content Scroll Container */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4"
        >
          {contents.map((content) => (
            <div key={content.id} className="flex-shrink-0 w-[140px] md:w-[180px]">
              <ContentCard 
                content={content} 
                showProgress={showProgress}
                progressSeconds={showProgress ? (content as any).progress_seconds : undefined}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'h-full w-12 rounded-none bg-background/50 hover:bg-background/80',
            'opacity-0 group-hover/row:opacity-100 transition-opacity',
            !showRightArrow && 'hidden'
          )}
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};
