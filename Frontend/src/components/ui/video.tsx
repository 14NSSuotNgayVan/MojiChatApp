import { cn } from '@/lib/utils.ts';
import { Pause, Play, Volume2, VolumeOff } from 'lucide-react';
import { useRef, useState } from 'react';

export interface ChatVideoProps {
  src: string; // video url (Cloudinary)
  poster?: string; // poster url
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ChatVideo({
  src,
  poster,
  autoPlay = false,
  muted = false,
  className,
  onClick,
}: ChatVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.play();
    setIsPlaying(true);
  };

  const handlePause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
  };
  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;

    setIsMuted((prev) => !prev);
  };

  return (
    <div className={cn('relative group', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        controls={false}
        muted={muted}
        autoPlay={autoPlay}
        onEnded={handleEnded}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onClick={onClick && onClick}
      />

      {!isPlaying ? (
        <button
          onClick={handlePlay}
          className="absolute flex top-1/2 left-1/2 -translate-1/2 p-2 rounded-full border-0 cursor-pointer hover bg-accent/30"
        >
          <Play />
        </button>
      ) : (
        <button
          onClick={handlePause}
          className="absolute top-1/2 left-1/2 -translate-1/2 p-2 rounded-full border-0 cursor-pointer hidden group-hover:block  bg-accent/30"
        >
          <Pause />
        </button>
      )}
      <div className="absolute bottom-0 right-0 left-0 flex justify-between items-center px-4 pb-2 text-xs tracking-wider font-semibold">
        {formatTime(currentTime)} / {formatTime(duration)}
        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded-full border-0 cursor-pointer hover bg-accent/30"
        >
          {!isMuted ? <Volume2 className="size-5" /> : <VolumeOff className="size-5" />}
        </button>
      </div>
    </div>
  );
}
