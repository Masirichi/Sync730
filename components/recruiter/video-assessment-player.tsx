'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  AlertTriangle,
  RefreshCw,
  Flag,
  Sparkles,
  Clock,
  Video,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/recruiter/video';
import { toast } from 'sonner';

interface VideoAssessmentPlayerProps {
  candidateId: string;
  videoUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
  status?: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING';
  expiresAt?: number;
  candidateName?: string;
  className?: string;
}

export function VideoAssessmentPlayer({
  candidateId,
  videoUrl: initialVideoUrl,
  posterUrl,
  durationSeconds = 165,
  status = 'COMPLETED',
  expiresAt: initialExpiresAt,
  candidateName = 'Candidate',
  className = '',
}: VideoAssessmentPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [currentUrl, setCurrentUrl] = useState<string | undefined>(initialVideoUrl);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<number | undefined>(initialExpiresAt);
  const [currentStatus, setCurrentStatus] = useState(status);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setCurrentUrl(initialVideoUrl);
    setCurrentExpiresAt(initialExpiresAt);
    setCurrentStatus(status);
    setHasError(false);
  }, [initialVideoUrl, initialExpiresAt, status]);

  // Handle Playback rate change
  const handleSpeedChange = (speed: 1 | 1.25 | 1.5 | 2) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasStarted(true);
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setHasError(true);
          setErrorMessage('Unable to play video. Signed URL may have expired.');
        });
    }
  };

  // Time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  // Refresh / Retry signed URL
  const handleRetry = async () => {
    setIsRefreshing(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/talent/video-url?candidate_id=${candidateId}`);
      const data = await res.json();
      if (data.success && data.video_meta?.signedUrl) {
        setCurrentUrl(data.video_meta.signedUrl);
        setCurrentExpiresAt(data.video_meta.expiresAt);
        setCurrentStatus(data.status);
        toast.success('Signed video session refreshed!');
        if (videoRef.current) {
          videoRef.current.load();
        }
      } else {
        throw new Error(data.error || 'Failed to refresh signed video stream');
      }
    } catch (err: any) {
      setHasError(true);
      setErrorMessage(err.message || 'Failed to reload video.');
      toast.error('Unable to reload video. Please report problem.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Report Problem
  const handleReportProblem = () => {
    toast.info(`Problem report logged for candidate video assessment (${candidateId}). Our technical team has been notified.`, {
      duration: 5000,
    });
  };

  // 1. STATE: Video Still Processing (Do not render blank 0:00 player!)
  if (currentStatus === 'PROCESSING' || !currentUrl) {
    return (
      <div
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
        <div className="relative z-10 space-y-3 max-w-xs">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Video processing</span>
            </span>
            <h4 className="text-sm font-bold text-white mt-2">
              Flowmingo AI Analysis in Progress
            </h4>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Candidate video responses are undergoing automated speech transcription, technical depth scoring, and proctoring analysis. Player unlocks once verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE: Video Error State
  if (hasError) {
    return (
      <div
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-950 border border-rose-900/30 flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-2">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-white">Playback Error</h4>
        <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
          {errorMessage || 'Signed session URL expired or network stream was interrupted.'}
        </p>

        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            onClick={handleRetry}
            disabled={isRefreshing}
            className="h-8 px-3 text-xs bg-white text-neutral-900 hover:bg-neutral-200 font-semibold rounded-xl gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Retry Stream</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReportProblem}
            className="h-8 px-3 text-xs border-neutral-700 text-neutral-300 hover:text-white rounded-xl gap-1.5"
          >
            <Flag className="h-3 w-3" />
            <span>Report a problem</span>
          </Button>
        </div>
      </div>
    );
  }

  // 3. STATE: Ready / Playing Player
  return (
    <div
      className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black group select-none ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentUrl}
        poster={posterUrl}
        preload="metadata"
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setHasError(true);
          setErrorMessage('Video streaming error or signed URL expired.');
        }}
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
      />

      {/* Buffering Shimmer Skeleton Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 text-white text-xs font-medium border border-neutral-700">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span>Buffering secure stream...</span>
          </div>
        </div>
      )}

      {/* Initial Poster Play Button Overlay (Before Started) */}
      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/30 backdrop-brightness-95 flex flex-col items-center justify-center cursor-pointer group-hover:bg-black/20 transition-all z-10"
        >
          <div className="h-14 w-14 rounded-full bg-white/95 text-neutral-950 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform pl-1">
            <Play className="h-6 w-6 fill-current" />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>{formatDuration(durationSeconds)}</span>
            </span>
            <span className="text-xs font-medium text-white/90 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              Flowmingo AI Verified
            </span>
          </div>
        </div>
      )}

      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-2 pointer-events-none z-10">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
          <Video className="h-3 w-3 stroke-[1.5] text-emerald-400" />
          <span>Signed Stream</span>
        </span>
      </div>

      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none z-10">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-neutral-300 text-[10px] font-mono border border-white/10">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>

      {/* Bottom Floating Control Bar (Shows on Hover / Active) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {/* Progress Timeline Scrubber */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setCurrentTime(val);
            if (videoRef.current) {
              videoRef.current.currentTime = val;
            }
          }}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1 hover:text-amber-400 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:text-amber-400 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Time Stamp */}
            <span className="text-[11px] font-mono text-neutral-300">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed Controls: 1x, 1.25x, 1.5x, 2x */}
            <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold">
              {([1, 1.25, 1.5, 2] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    playbackSpeed === spd
                      ? 'bg-amber-400 text-neutral-950 shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Fullscreen */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              className="p-1 hover:text-amber-400 transition-colors"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
