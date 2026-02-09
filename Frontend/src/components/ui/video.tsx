import { Slider } from '@/components/ui/slider.tsx';
import { cn } from '@/lib/utils.ts';
import { Pause, Play, Volume2, VolumeOff } from 'lucide-react';
import { useRef, useState } from 'react';

export interface ChatVideoProps {
  src: string; // video url (Cloudinary)
  poster?: string; // poster url
  autoPlay?: boolean;
  muted?: boolean;
  showProgress?: boolean;
  className?: string;
  videoClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ChatVideo({
  src,
  poster,
  autoPlay = false,
  muted = false,
  className,
  onClick,
  videoClassName,
  showProgress = false,
}: ChatVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);

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

  const handleTimeUpdate = () => {
    if (!videoRef.current || seeking) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleSeek = ([value]: number[]) => {
    setSeeking(true);
    setCurrentTime(value);
  };

  // Khi thả slider
  const handleSeekCommit = ([value]: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setSeeking(false);
  };

  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;

    setIsMuted((prev) => !prev);
  };

  return (
    <div className={cn('relative group/video', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={cn('w-full h-full', videoClassName)}
        controls={false}
        muted={muted}
        autoPlay={autoPlay}
        onEnded={handleEnded}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
        }}
        onTimeUpdate={handleTimeUpdate}
        onClick={onClick && onClick}
      />

      {!isPlaying ? (
        <button
          onClick={handlePlay}
          className={cn(
            'absolute',
            !onClick
              ? 'flex justify-center items-center inset-0'
              : 'top-1/2 left-1/2 -translate-1/2 p-2 rounded-full border-0 cursor-pointer hover bg-accent/30'
          )}
        >
          <Play
            className={cn(
              'text-white',
              !onClick && 'size-10 p-2 rounded-full border-0 cursor-pointer bg-accent/30'
            )}
          />
        </button>
      ) : (
        <button
          onClick={handlePause}
          className={cn(
            'absolute',
            !onClick
              ? '/video flex justify-center items-center inset-0'
              : 'top-1/2 left-1/2 -translate-1/2 p-2 rounded-full border-0 cursor-pointer hidden group-hover/video:block bg-accent/30'
          )}
        >
          <Pause
            className={cn(
              'text-white',
              !onClick &&
                'size-10 p-2 rounded-full border-0 cursor-pointer opacity-0 bg-accent/30 group-hover/video:opacity-100'
            )}
          />
        </button>
      )}
      <div
        className={cn(
          'absolute bottom-0 right-0 left-0 justify-between items-center px-4 py-2 text-xs tracking-wider font-semibold gap-1 hidden group-hover/video:flex',
          !onClick && 'bg-linear-to-t from-black/40 via-black/25 to-black/10'
        )}
      >
        <div className="shrink-0 text-white">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        {showProgress && (
          <Slider
            min={0}
            max={duration || 1}
            step={0.1}
            value={[currentTime]}
            onValueChange={handleSeek}
            onValueCommit={handleSeekCommit}
            className="cursor-pointer"
          />
        )}
        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded-full border-0 cursor-pointer hover bg-accent/30"
        >
          {!isMuted ? (
            <Volume2 className="size-5 text-white" />
          ) : (
            <VolumeOff className="size-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
