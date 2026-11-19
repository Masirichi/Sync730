// components/jobs/share-job-button.tsx
'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Linkedin,
  Twitter,
  MessageCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateJobSlug } from '@/lib/jobs/slugs';

export interface ShareJobButtonProps {
  job: {
    id: string;
    slug?: string;
    title: string;
    company?: string;
    company_name?: string;
    location_rule?: string;
    candidate_required_location?: string;
  };
  className?: string;
  variant?: 'icon' | 'pill';
  showLabel?: boolean;
}

export function ShareJobButton({
  job,
  className,
  variant = 'icon',
  showLabel = false,
}: ShareJobButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const companyName = job.company_name || job.company || 'Partner Employer';
  const jobSlug =
    job.slug ||
    generateJobSlug({
      id: job.id,
      title: job.title,
      company_name: companyName,
      candidate_required_location:
        job.location_rule || job.candidate_required_location || 'Worldwide',
    });

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/jobs/${jobSlug}`;
    }
    return `https://sync730.com/jobs/${jobSlug}`;
  };

  const getShareText = () => {
    return `${job.title} at ${companyName} — Verified remote role open to Africa on Sync730`;
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopied(true);
      toast.success('Job link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      toast.error('Unable to copy link to clipboard');
    }
  };

  const handleSharePlatform = (platform: 'linkedin' | 'twitter' | 'whatsapp' | 'telegram') => {
    const url = getShareUrl();
    const text = getShareText();

    let shareLink = '';
    switch (platform) {
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }

    if (shareLink && typeof window !== 'undefined') {
      window.open(shareLink, '_blank', 'noopener,noreferrer,width=650,height=550');
    }
    setIsOpen(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `${job.title} at ${companyName}`,
          text: getShareText(),
          url: getShareUrl(),
        });
        toast.success('Listing shared successfully!');
        setIsOpen(false);
        return;
      } catch (err: any) {
        // User cancelled share or failed
        if (err.name !== 'AbortError') {
          // Open popover fallback
          setIsOpen(true);
        }
        return;
      }
    }
    setIsOpen(true);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // If native share is supported on mobile touch devices, trigger directly
                if (typeof window !== 'undefined' && window.innerWidth < 768 && typeof navigator !== 'undefined' && 'share' in navigator) {
                  handleNativeShare(e);
                } else {
                  setIsOpen((prev) => !prev);
                }
              }}
              aria-label={`Share ${job.title} at ${companyName} on social media`}
              aria-expanded={isOpen}
              className={cn(
                'relative z-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900',
                variant === 'pill'
                  ? 'px-3.5 py-2 rounded-full border border-border/80 bg-white dark:bg-neutral-900 text-xs font-semibold gap-1.5'
                  : 'p-2.5',
                className
              )}
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              {showLabel && <span>Share</span>}
            </button>
          </PopoverTrigger>
          <TooltipContent className="text-xs bg-neutral-900 text-white border-none py-1.5 px-2.5 rounded-lg shadow-md">
            Share this listing
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="w-64 p-3 bg-white dark:bg-neutral-900 border border-border/80 shadow-2xl rounded-2xl z-40 text-xs space-y-2.5 focus:outline-none"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            Share Job Listing
          </p>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Social & Link
          </span>
        </div>

        {/* Copy Link Row */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium text-neutral-900 dark:text-neutral-100"
        >
          <span className="flex items-center gap-2">
            {hasCopied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-neutral-500" />
            )}
            <span>{hasCopied ? 'Link Copied!' : 'Copy Direct Link'}</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">URL</span>
        </button>

        {/* Social Sharing Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {/* LinkedIn */}
          <button
            type="button"
            onClick={() => handleSharePlatform('linkedin')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <Linkedin className="w-4 h-4 text-[#0077b5] flex-shrink-0" />
            <span className="font-medium">LinkedIn</span>
          </button>

          {/* X / Twitter */}
          <button
            type="button"
            onClick={() => handleSharePlatform('twitter')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <Twitter className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0" />
            <span className="font-medium">X (Twitter)</span>
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => handleSharePlatform('whatsapp')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
            <span className="font-medium">WhatsApp</span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={() => handleSharePlatform('telegram')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <Send className="w-4 h-4 text-[#0088cc] flex-shrink-0" />
            <span className="font-medium">Telegram</span>
          </button>
        </div>

        {/* Native Device Share (if supported) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>More sharing options...</span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
