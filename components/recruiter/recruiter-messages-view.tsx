'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  User,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Clock,
  ShieldCheck,
  Briefcase,
  Users,
} from 'lucide-react';
import {
  MessageThread,
  ChatMessage,
  getLocalMessageThreads,
  sendMessage,
  markThreadAsRead,
  getOrCreateTalentThread,
} from '@/lib/messages/store';
import { getLocalWorkspace } from '@/lib/recruiter/store';
import { toast } from 'sonner';

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function formatMessageTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function RecruiterMessagesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const talentParam = searchParams.get('talent');
  const threadParam = searchParams.get('thread');

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isMobileViewingThread, setIsMobileViewingThread] = useState(false);
  const [workspace, setWorkspace] = useState(getLocalWorkspace());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load threads
  const loadThreads = () => {
    const data = getLocalMessageThreads();
    setThreads(data);

    // If query specifies thread or talent
    if (threadParam) {
      const found = data.find((t) => t.id === threadParam);
      if (found) {
        setActiveThreadId(found.id);
        markThreadAsRead(found.id);
        return;
      }
    }

    if (talentParam) {
      const found = data.find(
        (t) => t.candidateId === talentParam || t.candidateName?.toLowerCase().includes(talentParam.toLowerCase())
      );
      if (found) {
        setActiveThreadId(found.id);
        markThreadAsRead(found.id);
        return;
      }
    }

    // Default to first thread if none active
    if (data.length > 0 && !activeThreadId) {
      setActiveThreadId(data[0].id);
      markThreadAsRead(data[0].id);
    }
  };

  useEffect(() => {
    setWorkspace(getLocalWorkspace());
    loadThreads();

    const handleUpdate = () => {
      const updated = getLocalMessageThreads();
      setThreads(updated);
    };

    window.addEventListener('sync730_messages_updated', handleUpdate);
    return () => window.removeEventListener('sync730_messages_updated', handleUpdate);
  }, [talentParam, threadParam]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threads, activeThreadId]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Send message from recruiter
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeThreadId) return;

    const senderName = workspace.company_name || 'Recruiter';
    const updated = sendMessage(activeThreadId, replyText, 'recruiter', senderName);
    if (updated) {
      setReplyText('');
      loadThreads();
    }
  };

  // Quick reply prompt handler
  const handleQuickPrompt = (prompt: string) => {
    setReplyText(prompt);
  };

  // Filter threads by search query
  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (t.candidateName || t.recruiterName || '').toLowerCase().includes(q);
    const roleMatch = (t.candidateRole || t.roleTitle || '').toLowerCase().includes(q);
    const companyMatch = (t.recruiterCompany || '').toLowerCase().includes(q);
    return nameMatch || roleMatch || companyMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Talent Messages & Chat
            </h1>
            <Badge variant="outline" className="text-xs px-2 py-0.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold">
              Live Candidate Inbound
            </Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Communicate directly with verified talents, arrange technical evaluations, and align on hiring timelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/console/talent">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-neutral-300 dark:border-neutral-700"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Browse Vetted Talent</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[750px]">
          {/* LEFT COLUMN: Conversation Threads List */}
          <div
            className={`md:col-span-4 lg:col-span-4 border-r border-neutral-200 dark:border-neutral-800 flex flex-col ${
              isMobileViewingThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Box */}
            <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search candidates or roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <MessageSquare className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    No conversations found
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Reach out to candidates from the Vetted Talent dashboard to start chatting.
                  </p>
                  <Link href="/console/talent" className="inline-block pt-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg">
                      Explore Talent
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  const displayName = thread.candidateName || thread.recruiterName || 'Talent';
                  const displayRole = thread.candidateRole || thread.roleTitle || 'Candidate';
                  const initials = thread.candidateInitials || thread.recruiterInitials || 'TL';

                  return (
                    <div
                      key={thread.id}
                      onClick={() => {
                        setActiveThreadId(thread.id);
                        markThreadAsRead(thread.id);
                        setIsMobileViewingThread(true);
                      }}
                      className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 text-left ${
                        isActive
                          ? 'bg-neutral-100/90 dark:bg-neutral-800/80 border-l-4 border-l-neutral-900 dark:border-l-white'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0 border border-neutral-200 dark:border-neutral-700">
                        {thread.candidateAvatar && <AvatarImage src={thread.candidateAvatar} alt={displayName} />}
                        <AvatarFallback className="text-xs font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {displayName}
                          </span>
                          <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                            {formatRelativeTime(thread.updatedAt)}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium text-neutral-500 truncate mt-0.5">
                          {displayRole}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate flex-1">
                            {lastMsg ? (
                              <>
                                {lastMsg.sender === 'recruiter' && (
                                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">You: </span>
                                )}
                                {lastMsg.content}
                              </>
                            ) : (
                              'Started conversation'
                            )}
                          </p>

                          {thread.unreadCount > 0 && (
                            <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Messages Thread */}
          <div
            className={`md:col-span-8 lg:col-span-8 flex flex-col bg-neutral-50/30 dark:bg-neutral-900/20 ${
              !isMobileViewingThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeThread ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 sm:px-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setIsMobileViewingThread(false)}
                      className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <Avatar className="h-9 w-9 border border-neutral-200 dark:border-neutral-700">
                      {activeThread.candidateAvatar && (
                        <AvatarImage src={activeThread.candidateAvatar} alt={activeThread.candidateName || 'Talent'} />
                      )}
                      <AvatarFallback className="text-xs font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        {activeThread.candidateInitials || 'TL'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {activeThread.candidateName || activeThread.recruiterName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 gap-1 px-1.5 py-0"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Verified Talent</span>
                        </Badge>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {activeThread.candidateRole || activeThread.roleTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/console/talent`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold h-8 rounded-xl gap-1 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="hidden sm:inline">View Dossier</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                  {/* Informational Notice */}
                  <div className="text-center my-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Direct talent chat secured by Sync730 corporate privacy protocols
                    </span>
                  </div>

                  {activeThread.messages.map((msg) => {
                    const isRecruiter = msg.sender === 'recruiter';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isRecruiter ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                          {!isRecruiter && (
                            <Avatar className="h-6 w-6 shrink-0 mb-1 border border-neutral-200 dark:border-neutral-700">
                              <AvatarFallback className="text-[9px] font-bold bg-neutral-200 dark:bg-neutral-800">
                                {activeThread.candidateInitials || 'TL'}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isRecruiter
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-br-xs'
                                : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/80 dark:border-neutral-700 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-1 px-1">
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {isRecruiter && (
                            <span>
                              {msg.status === 'read' ? (
                                <CheckCheck className="h-3 w-3 text-emerald-500 inline" />
                              ) : (
                                <Check className="h-3 w-3 text-neutral-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Bar */}
                <div className="px-4 py-2 bg-neutral-50/80 dark:bg-neutral-900/80 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                  <span className="text-[10px] font-semibold text-neutral-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Starters:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        `Hi ${activeThread.candidateName || 'there'}, our engineering leadership was impressed by your assessment score and we would love to schedule a 30-minute technical intro. What times work best for you this week?`
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[11px] whitespace-nowrap font-medium transition-colors"
                  >
                    Schedule Technical Intro
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        `Hello ${activeThread.candidateName || 'there'}, we'd love to share the full scope and compensation package ($95K - $125K USD) for this opening. Are you actively open to discussions?`
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[11px] whitespace-nowrap font-medium transition-colors"
                  >
                    Discuss Comp & Package
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        `Hi ${activeThread.candidateName || 'there'}, could you tell us more about your experience with high-concurrency systems and database performance optimization?`
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[11px] whitespace-nowrap font-medium transition-colors"
                  >
                    Architecture Question
                  </button>
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-end gap-2.5"
                >
                  <Textarea
                    placeholder={`Message ${activeThread.candidateName || 'talent'}... (Press Enter to send)`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    className="min-h-[52px] max-h-32 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="h-10 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs shrink-0 gap-1.5"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Select a candidate conversation
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Choose an active conversation from the list or start a new chat directly with talents from the Vetted Talent dashboard.
                </p>
                <Link href="/console/talent">
                  <Button size="sm" className="text-xs rounded-xl mt-2 font-semibold">
                    Browse Vetted Talent
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
