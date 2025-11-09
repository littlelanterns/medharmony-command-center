'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  created_at: string;
  tier_info?: {
    tier_number: number;
    total_notified: number;
    expires_at: string;
  };
}

interface NotificationBellProps {
  userId: string;
  userRole: 'provider' | 'patient' | 'caregiver';
}

export default function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    loadNotifications();
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    loadNotifications();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-500';
      case 'high':
        return 'bg-orange-100 border-orange-500';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-blue-100 border-blue-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📢';
      default:
        return 'ℹ️';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cancellation_alert':
        return '🎯';
      case 'appointment_confirmed':
        return '✅';
      case 'appointment_cancelled':
        return '❌';
      case 'time_block_notification':
        return '🚫';
      case 'appointment_booked':
        return '📅';
      case 'order_requires_confirmation':
        return '⚠️';
      default:
        return '📬';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const speakNotification = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click handler
    setSpeaking(notification.id);

    try {
      // Enhanced message for TTS
      let spokenMessage = notification.message;

      // Add tier urgency if present
      if (notification.tier_info) {
        const { tier_number, total_notified, expires_at } = notification.tier_info;
        const expiresIn = Math.round((new Date(expires_at).getTime() - Date.now()) / (1000 * 60));

        spokenMessage = `Attention! ${notification.title}. ${spokenMessage}. ` +
          `This is a tier ${tier_number} priority notification. ` +
          `You are one of ${total_notified} high-karma patients being offered this opportunity. ` +
          `This offer expires in ${expiresIn} minutes. ` +
          `Log into your patient portal to claim this appointment now.`;
      } else {
        spokenMessage = `${notification.title}. ${spokenMessage}`;
      }

      // Try server-side TTS first
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenMessage })
      });

      if (!response.ok) {
        throw new Error('TTS API failed');
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        // Browser TTS fallback
        const result = await response.json();

        if (result.useBrowserTTS && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(spokenMessage);
          utterance.rate = 0.9; // Slightly slower
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          // Prefer female voice if available
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v =>
            v.name.includes('Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Google US English')
          );
          if (femaleVoice) utterance.voice = femaleVoice;

          utterance.onend = () => setSpeaking(null);
          utterance.onerror = () => setSpeaking(null);

          window.speechSynthesis.cancel(); // Cancel any ongoing speech
          window.speechSynthesis.speak(utterance);
        } else {
          throw new Error('Browser TTS not available');
        }
      } else {
        // Play audio from server
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setSpeaking(null);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setSpeaking(null);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      alert('Text-to-speech is not available. Please read the notification instead.');
      setSpeaking(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-pulse">Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    border-l-4 p-4 hover:bg-gray-50 transition
                    ${!notification.is_read ? 'bg-blue-50' : 'bg-white'}
                    ${getPriorityColor(notification.priority)}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getTypeIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold text-gray-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h4>
                        <span className="text-lg flex-shrink-0">
                          {getPriorityIcon(notification.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>

                      {/* Tier Info - URGENCY MESSAGING */}
                      {notification.tier_info && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-yellow-800">
                              ⚡ Priority Tier {notification.tier_info.tier_number}
                            </span>
                            <span className="text-yellow-700">
                              - Offered to {notification.tier_info.total_notified} high-karma patients
                            </span>
                          </div>
                          <div className="text-yellow-700 mt-1 font-medium">
                            Expires in {Math.max(0, Math.round((new Date(notification.tier_info.expires_at).getTime() - Date.now()) / (1000 * 60)))} minutes
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        {/* Speaker Button - TTS */}
                        <button
                          onClick={(e) => speakNotification(notification, e)}
                          disabled={speaking === notification.id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                            speaking === notification.id
                              ? 'bg-blue-100 text-blue-700 cursor-wait'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Listen to notification"
                        >
                          {speaking === notification.id ? (
                            <>
                              <span className="animate-pulse">🔊</span>
                              <span>Playing...</span>
                            </>
                          ) : (
                            <>
                              <span>🔊</span>
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {/* View Details Button */}
                        {notification.action_url && (
                          <button
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                              if (notification.action_url) {
                                window.location.href = notification.action_url;
                              }
                            }}
                            className="px-3 py-1.5 bg-[#008080] text-white rounded-md text-xs font-medium hover:bg-[#006666] transition"
                          >
                            View Details
                          </button>
                        )}

                        {/* Mark as Read */}
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">NEW</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                Showing {Math.min(notifications.length, 20)} of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
