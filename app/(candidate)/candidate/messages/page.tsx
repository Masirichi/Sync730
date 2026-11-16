'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageSquareText,
  Send,
  Search,
  BadgeCheck,
  ArrowLeft,
  Plus,
  Clock,
  Check,
  CheckCheck,
  Building2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import {
  MessageThread,
  ChatMessage,
  getLocalMessageThreads,
  sendMessage,
  markThreadAsRead,
  createNewMessageThread,
} from '@/lib/messages/store';
import { getLocalTrackerItems } from '@/lib/tracker';
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

export default function CandidateMessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isMobileViewingThread, setIsMobileViewingThread] = useState(false);

  // New Conversation Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [trackerRoles, setTrackerRoles] = useState<{ id: string; title: string; company: string; contact?: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load threads on mount & subscribe to updates
  useEffect(() => {
    const load = () => {
      const data = getLocalMessageThreads();
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
        markThreadAsRead(data[0].id);
      }
    };

    load();
    window.addEventListener('sync730_messages_updated', load);
    return () => window.removeEventListener('sync730_messages_updated', load);
  }, [activeThreadId]);

  // Load SyncFlow items for easy message initiation
  useEffect(() => {
    try {
      const items = getLocalTrackerItems();
      setTrackerRoles(
        items.map((i) => ({
          id: i.id,
          title: i.title,
          company: i.company,
          contact: i.contact || '',
        }))
      );
    } catch {}
  }, []);

  // Auto-scroll message stream to bottom when active thread or messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadId, threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    markThreadAsRead(threadId);
    setIsMobileViewingThread(true);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const sent = sendMessage(activeThread.id, replyText);
    if (sent) {
      setReplyText('');
      toast.success('Message sent');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecruiter.trim() || !newCompany.trim() || !newInitialMsg.trim()) {
      toast.error('Please enter recipient, company, and message text.');
      return;
    }

    const created = createNewMessageThread({
      recruiterName: newRecruiter,
      recruiterCompany: newCompany,
      roleTitle: newRole || 'Direct Application',
      initialMessage: newInitialMsg,
    });

    setIsNewModalOpen(false);
    setNewRecruiter('');
    setNewCompany('');
    setNewRole('');
    setNewInitialMsg('');
    setActiveThreadId(created.id);
    setIsMobileViewingThread(true);
    toast.success('New conversation started!');
  };

  // Filtered threads list
  const filteredThreads = threads.filter((t) => {
    if (filterUnreadOnly && t.unreadCount === 0) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.recruiterName.toLowerCase().includes(q) ||
      t.recruiterCompany.toLowerCase().includes(q) ||
      t.roleTitle.toLowerCase().includes(q) ||
      t.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const totalUnreadCount = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Messages</span>
              {totalUnreadCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                  {totalUnreadCount} new
                </span>
              )}
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Direct communication channels with verified African & international hiring teams.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewModalOpen(true)}
          className="text-xs min-h-[44px] px-4 font-semibold gap-1.5 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
        >
          <Plus className="h-4 w-4" />
          <span>New Message</span>
        </Button>
      </div>

      {/* Main 2-Column Messaging Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Thread List (Hidden on mobile if viewing an active thread) */}
        <div
          className={`md:col-span-4 lg:col-span-4 flex flex-col rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden ${
            isMobileViewingThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Thread Search & Filter Bar */}
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5 bg-neutral-50/50 dark:bg-neutral-950/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input
                placeholder="Search messages, recruiters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-white dark:bg-neutral-900"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(false)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  !filterUnreadOnly
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60'
                }`}
              >
                All ({threads.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(true)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterUnreadOnly
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60'
                }`}
              >
                Unread ({totalUnreadCount})
              </button>
            </div>
          </div>

          {/* Thread List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No conversations found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThread?.id;
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 text-left ${
                      isActive
                        ? 'bg-neutral-100/80 dark:bg-neutral-800/60'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold">
                        {thread.recruiterInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                            {thread.recruiterName}
                          </span>
                          {thread.isVerifiedEmployer && (
                            <span title="Verified Employer" className="inline-flex items-center shrink-0">
                              <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {formatRelativeTime(thread.updatedAt)}
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-neutral-500 truncate">
                        {thread.recruiterCompany} · {thread.roleTitle}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate flex-1">
                          {lastMsg ? lastMsg.content : 'No messages yet'}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Thread */}
        <div
          className={`md:col-span-8 lg:col-span-8 flex flex-col rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden ${
            !isMobileViewingThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <>
              {/* Active Thread Header */}
              <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-950/40 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileViewingThread(false)}
                    className="md:hidden p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900"
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold">
                      {activeThread.recruiterInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {activeThread.recruiterName}
                      </h2>
                      {activeThread.isVerifiedEmployer && (
                        <BadgeCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1.5">
                      <span>{activeThread.recruiterRole} at {activeThread.recruiterCompany}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hidden sm:inline-flex">
                    Role: {activeThread.roleTitle}
                  </Badge>
                  <Link
                    href="/dashboard/syncflow"
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1"
                    title="View in SyncFlow Pipeline"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">SyncFlow</span>
                  </Link>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/20">
                {activeThread.messages.map((msg) => {
                  const isCandidate = msg.sender === 'candidate';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCandidate ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-neutral-400 mb-1 px-1">
                        {isCandidate ? 'You' : msg.senderName} · {formatMessageTime(msg.timestamp)}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[70%] text-xs leading-relaxed shadow-xs ${
                          isCandidate
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-br-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {isCandidate && (
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5 px-1">
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                          <span>Delivered</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Smart Quick Replies & Composer */}
              <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2 shrink-0">
                {/* Quick Reply Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setReplyText("Thank you! I am free this Thursday at 2:00 PM WAT.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors shrink-0"
                  >
                    Confirm time this Thursday
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText("I have updated my portfolio and recent Next.js architecture code samples.")}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors shrink-0"
                  >
                    Share portfolio link
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText("Looking forward to speaking with the engineering team!")}
                    className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors shrink-0"
                  >
                    Looking forward to speaking
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your reply... (Press Enter to send)"
                      rows={2}
                      className="text-xs resize-none pr-3 py-2 min-h-[44px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="min-h-[44px] px-4 font-semibold gap-1.5 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <MessageSquareText className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-semibold">Select a conversation</p>
              <p className="text-xs text-neutral-500">Or start a new message with a verified employer</p>
            </div>
          )}
        </div>
      </div>

      {/* Start New Conversation Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">New Employer Inquiry</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Direct message to verified recruiters for roles you applied to or saved.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewThread} className="space-y-3.5 py-2">
            {trackerRoles.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Autofill from SyncFlow
                </label>
                <select
                  onChange={(e) => {
                    const found = trackerRoles.find((r) => r.id === e.target.value);
                    if (found) {
                      setNewCompany(found.company);
                      setNewRole(found.title);
                      if (found.contact) {
                        setNewRecruiter(found.contact.split('·')[0].trim());
                      }
                    }
                  }}
                  className="w-full text-xs font-medium min-h-[44px] px-3 rounded-lg border border-border bg-background text-foreground"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select an active role...
                  </option>
                  {trackerRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.company})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Recruiter Name *
              </label>
              <Input
                placeholder="e.g. Tunde Adebayo"
                value={newRecruiter}
                onChange={(e) => setNewRecruiter(e.target.value)}
                className="text-xs min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Company Name *
              </label>
              <Input
                placeholder="e.g. Paystack"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="text-xs min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Role Title
              </label>
              <Input
                placeholder="e.g. Senior Frontend Engineer"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="text-xs min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Initial Message *
              </label>
              <Textarea
                placeholder="Introduce yourself, reference your application, or ask about interview steps..."
                value={newInitialMsg}
                onChange={(e) => setNewInitialMsg(e.target.value)}
                rows={3}
                className="text-xs"
                required
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewModalOpen(false)}
                className="text-xs min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs min-h-[44px] px-5 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
              >
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
