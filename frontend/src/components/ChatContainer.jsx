import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore';
import ChatHeader from './ChatHeader';
import NoChatHistoryPlaceholder from './NoChatHistoryPlaceholder';
import MessagesLoadingSkeleton from './MessagesLoadingSkeleton';
import MessageInput from './MessageInput';
import { getTheme } from '../lib/chatThemes';

function ChatContainer() {

  const { selectedUser, selectedGroup, getMessagesByUserId, getGroupMessages, messages, groupMessages, isMessagesLoading, isGroupMessagesLoading, subscribeToMessage, unsubscribeFromMessages, chatThemes } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null)

  const isGroupChat = !!selectedGroup;
  const theme = getTheme(isGroupChat ? undefined : chatThemes[selectedUser?._id]);

  useEffect(() => {
    if (isGroupChat) {
      getGroupMessages(selectedGroup._id);
    } else {
      getMessagesByUserId(selectedUser._id);
      subscribeToMessage();
    }

    //clean up
    return () => unsubscribeFromMessages()
  }, [isGroupChat, selectedGroup, selectedUser, getGroupMessages, getMessagesByUserId, subscribeToMessage, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, groupMessages]);

  const activeMessages = isGroupChat ? groupMessages : messages;
  const isLoading = isGroupChat ? isGroupMessagesLoading : isMessagesLoading;

  const floatEmojis = theme.floats.length
    ? Array.from({ length: 12 }, (_, i) => theme.floats[i % theme.floats.length])
    : [];

  const isOwnMessage = (msg) => {
    const senderId = msg.senderId?._id ?? msg.senderId;
    return senderId === authUser._id;
  };

  return (
    <>
      <ChatHeader />
      <div className="relative flex-1 overflow-hidden">
        {floatEmojis.length > 0 && !isGroupChat && (
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

        <div className={`h-full px-6 overflow-y-auto py-8 ${!isGroupChat ? theme.background : ""}`}>
        {activeMessages.length > 0 && !isLoading ? (
          <div className='max-w-3xl mx-auto space-y-6'>
            {activeMessages.map(msg => {
              const isOwn = isOwnMessage(msg);
              return (
                <div key={msg._id} className={`chat ${isOwn ? "chat-end" : "chat-start"}`}>
                  <div className={`chat-bubble relative ${isOwn
                      ? theme.sender
                      : theme.receiver
                    }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                    )}
                    {isGroupChat && !isOwn && (
                      <p className="text-[10px] font-semibold opacity-80 mb-1">
                        {msg.senderId?.fullName || "Unknown"}
                      </p>
                    )}
                    {msg.text && <p className="mt-2">{msg.text}</p>}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isLoading ? <MessagesLoadingSkeleton /> : (
          <NoChatHistoryPlaceholder name={isGroupChat ? selectedGroup.name : selectedUser.fullName} />
        )}
        </div>
      </div>

      <MessageInput />
    </>
  )
}

export default ChatContainer
