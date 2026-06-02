import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

interface ChatMessage {
  id: string;
  attemptId: string;
  senderId: string;
  senderRole: string;
  senderEmail?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatWidgetProps {
  attemptId: string;
  examId?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  attemptId,
  examId,
  position = 'bottom-right',
  minimized: initialMinimized = true,
}) => {
  const { t } = useTranslation();
  const { user, token } = useAuth();

  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Connect to chat socket
  useEffect(() => {
    if (!token || !attemptId) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const baseUrl = import.meta.env.VITE_WS_URL || apiUrl.replace('/api', '');

    socketRef.current = io(`${baseUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      // Join chat room
      socketRef.current?.emit('joinChat', { attemptId }, (response: any) => {
        if (response.success) {
          setMessages(response.messages || []);
        }
      });
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('newMessage', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== user?.id && isMinimized) {
        setUnreadCount((prev) => prev + 1);
        // Play notification sound
        playNotificationSound();
      }
    });

    socketRef.current.on('userTyping', (data: { email: string }) => {
      setIsTyping(data.email);
    });

    socketRef.current.on('userStoppedTyping', () => {
      setIsTyping(null);
    });

    socketRef.current.on('messagesRead', () => {
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isRead: true }))
      );
    });

    return () => {
      socketRef.current?.emit('leaveChat', { attemptId });
      socketRef.current?.disconnect();
    };
  }, [token, attemptId, user?.id]);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (!isMinimized && unreadCount > 0 && socketRef.current) {
      socketRef.current.emit('markRead', { attemptId });
      setUnreadCount(0);
    }
  }, [isMinimized, unreadCount, attemptId]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore errors if user hasn't interacted
    } catch (e) {
      // Ignore audio errors
    }
  };

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      attemptId,
      message: newMessage.trim(),
    });

    setNewMessage('');

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current.emit('typing', { attemptId, isTyping: false });
  }, [newMessage, attemptId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing', { attemptId, isTyping: true });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { attemptId, isTyping: false });
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const positionClasses = position === 'bottom-right'
    ? 'right-4'
    : 'left-4';

  return (
    <div className={`fixed bottom-4 ${positionClasses} z-50`}>
      {/* Minimized Button */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="relative bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {!isMinimized && (
        <div className="bg-white rounded-lg shadow-2xl w-80 flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span className="font-medium">{t('chat.title') || 'Chat'}</span>
              {connected && (
                <span className="w-2 h-2 bg-green-400 rounded-full" />
              )}
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="hover:bg-primary-700 rounded p-1"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 h-64 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                {t('chat.noMessages') || 'No messages yet'}
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs font-medium mb-1 text-gray-500">
                          {message.senderRole}
                        </div>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <div
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-200' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                        {isOwn && (
                          <span className="ml-1">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {isTyping && (
              <div className="text-xs text-gray-500 italic">
                {isTyping} {t('chat.isTyping') || 'is typing...'}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.typeMessage') || 'Type a message...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !connected}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
