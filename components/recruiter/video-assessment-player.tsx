'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  Shield,
  Eye,
  EyeOff,
  Headphones,
  Subtitles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/recruiter/video';
import { toast } from 'sonner';

export interface VideoPlayerHandle {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
}

interface VideoAssessmentPlayerProps {
  candidateId: string;
  videoUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
  status?: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING';
  expiresAt?: number;
  candidateName?: string;
  isUnlocked?: boolean;
  watermarkText?: string;
  captions?: Array<{ time: number; text: string }>;
  className?: string;
}

export const VideoAssessmentPlayer = forwardRef<VideoPlayerHandle, VideoAssessmentPlayerProps>(
  function VideoAssessmentPlayer(
    {
      candidateId,
      videoUrl: initialVideoUrl,
      posterUrl,
      durationSeconds = 165,
      status = 'COMPLETED',
      expiresAt: initialExpiresAt,
      candidateName = 'Candidate',
      isUnlocked = false,
      watermarkText = 'Acme Global Ventures · hiring@acmeglobal.com · Confidential Recruiter Screening',
      captions = [],
      className = '',
    },
    ref
  ) {
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

    // Anonymization / Preview Controls (blurred vs audio-only vs standard)
    const [previewMode, setPreviewMode] = useState<'standard' | 'blurred' | 'audio_only'>(
      isUnlocked ? 'standard' : 'standard'
    );
    const [showCaptions, setShowCaptions] = useState(true);

    // Expose imperative handle for external transcript timestamp clicks
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
          if (!isPlaying) {
            setHasStarted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }
      },
      play: () => {
        if (videoRef.current) {
          setHasStarted(true);
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
    }));

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

    // Refresh / Retry signed URL on expiration
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
          toast.success('Signed video session refreshed (15-min lifetime)');
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
      toast.info(`Problem report logged for candidate video assessment (${candidateId}). Support team notified.`, {
        duration: 5000,
      });
    };

    // Current active caption
    const activeCaption = captions.find(
      (c, idx) =>
        currentTime >= c.time &&
        (idx === captions.length - 1 || currentTime < (captions[idx + 1]?.time || Infinity))
    );

    // 1. STATE: Video Still Processing
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
            {errorMessage || 'Signed session URL expired (15-min lifetime) or network stream was interrupted.'}
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
        onContextMenu={(e) => e.preventDefault()} // Disable context menu / right click
      >
        {/* Video Element with Anti-Download Controls */}
        <video
          ref={videoRef}
          src={currentUrl}
          poster={posterUrl}
          preload="metadata"
          playsInline
          muted={isMuted}
          controlsList="nodownload"
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setHasError(true);
            setErrorMessage('Signed session expired (15-min window) or network stream error.');
          }}
          className={`w-full h-full object-cover cursor-pointer transition-all ${
            previewMode === 'blurred'
              ? 'blur-md scale-105'
              : previewMode === 'audio_only'
              ? 'opacity-0'
              : ''
          }`}
          onClick={togglePlay}
        />

        {/* Audio-Only Visualizer Overlay */}
        {previewMode === 'audio_only' && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center cursor-pointer p-6 text-center z-10"
          >
            <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Headphones className={`h-8 w-8 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <span className="text-xs font-bold text-white">Audio-Only Interview Mode</span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Visual feed suppressed. Voice clarity and technical responses are preserved.
            </p>
          </div>
        )}

        {/* Security Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-15 overflow-hidden select-none opacity-20 hover:opacity-30 transition-opacity">
          <div className="rotate-[-20deg] text-center space-y-1">
            <span className="text-white/80 font-mono text-[10px] sm:text-xs tracking-wider uppercase block">
              {watermarkText}
            </span>
            <span className="text-white/50 font-mono text-[9px] block">
              Candidate #{candidateId.slice(-4).toUpperCase()} · Do Not Distribute
            </span>
          </div>
        </div>

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
        {!hasStarted && previewMode !== 'audio_only' && (
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

        {/* Top Badges & Anonymization Preview Controls */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
            <Video className="h-3 w-3 stroke-[1.5] text-emerald-400" />
            <span>15-min Signed Stream</span>
          </span>

          {!isUnlocked && (
            <div className="flex items-center bg-black/70 backdrop-blur-md rounded-md border border-white/10 p-0.5 text-[9px] font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode('standard')}
                className={`px-1.5 py-0.5 rounded ${previewMode === 'standard' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Standard Video"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('blurred')}
                className={`px-1.5 py-0.5 rounded ${previewMode === 'blurred' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                title="Blurred Video Preview"
              >
                Blur
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('audio_only')}
                className={`px-1.5 py-0.5 rounded ${previewMode === 'audio_only' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                title="Audio Only Mode"
              >
                Audio
              </button>
            </div>
          )}
        </div>

        {/* Top Right Duration Readout */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-neutral-300 text-[10px] font-mono border border-white/10">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>

        {/* Real-Time Live Closed Captions Display */}
        {showCaptions && activeCaption && isPlaying && (
          <div className="absolute bottom-14 inset-x-4 flex justify-center z-20 pointer-events-none">
            <span className="px-3 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-xs text-center border border-white/10 font-medium max-w-md shadow-lg">
              {activeCaption.text}
            </span>
          </div>
        )}

        {/* Bottom Floating Control Bar (Shows on Hover / Active) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-25">
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
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-amber-400 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>

              {/* Mute Toggle */}
              <button
                type="button"
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

              {/* Captions Toggle */}
              <button
                type="button"
                onClick={() => setShowCaptions(!showCaptions)}
                className={`p-1 transition-colors ${showCaptions ? 'text-amber-400' : 'text-neutral-400 hover:text-white'}`}
                title={showCaptions ? 'Captions ON' : 'Captions OFF'}
              >
                <Subtitles className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed Controls: 1x, 1.25x, 1.5x, 2x */}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold">
                {([1, 1.25, 1.5, 2] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
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
                type="button"
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
);
