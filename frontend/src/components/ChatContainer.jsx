import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore';
import ChatHeader from './ChatHeader';
import NoChatHistoryPlaceholder from './NoChatHistoryPlaceholder';
import MessagesLoadingSkeleton from './MessagesLoadingSkeleton';
import MessageInput from './MessageInput';
import { getTheme } from '../lib/chatThemes';

function ChatContainer() {

  const { selectedUser, getMessagesByUserId, messages, isMessagesLoading, subscribeToMessage, unsubscribeFromMessages, chatThemes } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null)
  const theme = getTheme(chatThemes[selectedUser._id]);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessage()

    //clean up
    return () => unsubscribeFromMessages()
  }, [selectedUser, getMessagesByUserId, subscribeToMessage, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const floatEmojis = theme.floats.length
    ? Array.from({ length: 12 }, (_, i) => theme.floats[i % theme.floats.length])
    : [];

  return (
    <>
      <ChatHeader />
      <div className="relative flex-1 overflow-hidden">
        {floatEmojis.length > 0 && (
          <div className="absolute inset-0" aria-hidden="true">
            {floatEmojis.map((emoji, i) => (
              <span
                key={i}
                className="chat-float"
                style={{
                  top: `${(i * 23) % 85}%`,
                  left: `${(i * 31 + 7) % 90}%`,
                  fontSize: `${1.2 + (i % 3) * 0.6}rem`,
                  "--float-duration": `${7 + (i % 4) * 2}s`,
                  "--float-delay": `${(i % 5) * 1.6}s`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}

        <div className={`h-full px-6 overflow-y-auto py-8 ${theme.background}`}>
        {messages.length > 0 && !isMessagesLoading ? (
          <div className='max-w-3xl mx-auto space-y-6'>
            {messages.map(msg => (<div key={msg._id} className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start  "}`}>
              <div className={`chat-bubble relative ${msg.senderId === authUser._id
                  ? theme.sender
                  : theme.receiver
                }`}>
                {msg.image && (
                  <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                )}
                {msg.text && <p className="mt-2">{msg.text}</p>}
                <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>))}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? <MessagesLoadingSkeleton /> : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
        </div>
      </div>

      <MessageInput />
    </>
  )
}

export default ChatContainer