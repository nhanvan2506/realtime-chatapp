import React, { useEffect, useRef } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore';
import ChatHeader from './ChatHeader';
import NoChatHistoryPlaceholder from './NoChatHistoryPlaceholder';
import MessagesLoadingSkeleton from './MessagesLoadingSkeleton';
import MessageInput from './MessageInput';
import { getTheme } from '../lib/chatThemes';
import { Check, Pencil, Trash2, Reply, Forward, SmilePlus } from 'lucide-react';

function ChatContainer() {

  const { selectedUser, selectedGroup, getMessagesByUserId, getGroupMessages, messages, groupMessages, isMessagesLoading, isGroupMessagesLoading, subscribeToMessage, unsubscribeFromMessages, chatThemes, markMessagesAsRead, markGroupMessagesAsRead, isTyping, typingUserId, typingGroupId, editingMessage, replyTo, setEditingMessage, deleteMessage, deleteMenuId, setDeleteMenuId, setReplyTo, setForwardMessage, reactToMessage, pendingMessageId, highlightedMessageId, setPendingMessageId, setHighlightedMessageId, reactionPickerId, setReactionPickerId } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null)

  const isGroupChat = !!selectedGroup;
  const theme = getTheme(isGroupChat ? undefined : chatThemes[selectedUser?._id]);

  const activeMessages = isGroupChat ? groupMessages : messages;
  const visibleMessages = activeMessages.filter(
    (m) => !(m.deletedBy || []).includes(authUser._id)
  );
  const isLoading = isGroupChat ? isGroupMessagesLoading : isMessagesLoading;

  useEffect(() => {
    if (isGroupChat) {
      getGroupMessages(selectedGroup._id);
      markGroupMessagesAsRead(selectedGroup._id);
    } else {
      getMessagesByUserId(selectedUser._id);
      subscribeToMessage();
      markMessagesAsRead(selectedUser._id);
    }

    //clean up
    return () => unsubscribeFromMessages()
  }, [isGroupChat, selectedGroup, selectedUser, getGroupMessages, getMessagesByUserId, subscribeToMessage, unsubscribeFromMessages, markMessagesAsRead, markGroupMessagesAsRead]);

  // join the group socket room so typing indicators can be relayed to members viewing this group
  useEffect(() => {
    if (!socket || !isGroupChat) return;

    socket.emit("joinGroup", selectedGroup._id);
    return () => socket.emit("leaveGroup", selectedGroup._id);
  }, [socket, isGroupChat, selectedGroup]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, groupMessages, isTyping]);

  // scroll to + highlight a message when arriving via global search
  useEffect(() => {
    if (!pendingMessageId) return;
    if (!activeMessages.some((m) => m._id === pendingMessageId)) return;

    const el = document.getElementById(`message-${pendingMessageId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(pendingMessageId);
    setPendingMessageId(null);
    setTimeout(() => setHighlightedMessageId(null), 2500);
  }, [pendingMessageId, messages, groupMessages, isGroupChat, activeMessages, setHighlightedMessageId, setPendingMessageId]);

  const showTyping = isTyping && (
    isGroupChat ? typingGroupId === selectedGroup._id : typingUserId === selectedUser._id
  );

  const typingMember = isGroupChat && showTyping
    ? selectedGroup.members?.find((m) => (m._id ?? m).toString() === typingUserId?.toString())
    : null;
  const typingName = typingMember?.fullName || (isGroupChat ? "Someone" : selectedUser?.fullName);

  const floatEmojis = theme.floats.length
    ? Array.from({ length: 12 }, (_, i) => theme.floats[i % theme.floats.length])
    : [];

  const isOwnMessage = (msg) => {
    const senderId = msg.senderId?._id ?? msg.senderId;
    return senderId === authUser._id;
  };

  const getReplyName = (msg) => {
    const reply = msg.replyTo;
    if (!reply) return "";
    const senderId = reply.senderId?._id ?? reply.senderId;
    if (senderId?.toString() === authUser._id) return "You";
    return reply.senderId?.fullName || "Someone";
  };

  const getReplyText = (msg) => {
    const reply = msg.replyTo;
    if (!reply) return "";
    if (reply.deletedForEveryone) return "This message was deleted";
    return reply.text || "[Image]";
  };

  const reactionPickerMessage = visibleMessages.find((m) => m._id === reactionPickerId);

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
        {visibleMessages.length > 0 && !isLoading ? (
          <div className='max-w-3xl mx-auto space-y-6'>
            {visibleMessages.map(msg => {
              const isOwn = isOwnMessage(msg);
              const isRead = !isGroupChat && msg.readBy?.includes(selectedUser._id);
              const isDeleted = msg.deletedForEveryone;
              const isHighlighted = highlightedMessageId === msg._id;

              const reactionGroups = (msg.reactions || []).reduce((acc, r) => {
                const emoji = r.emoji;
                if (!acc[emoji]) acc[emoji] = { count: 0, reacted: false };
                acc[emoji].count += 1;
                if ((r.userId?._id ?? r.userId)?.toString() === authUser._id) acc[emoji].reacted = true;
                return acc;
              }, {});

              return (
                <div key={msg._id} id={`message-${msg._id}`} className={`chat group ${isOwn ? "chat-end" : "chat-start"}`}>
                  <div className={`chat-bubble relative transition-shadow ${isOwn
                      ? theme.sender
                      : theme.receiver
                    } ${isHighlighted ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20" : ""}`}>
                    {msg.image && !isDeleted && (
                      <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                    )}
                    {isGroupChat && !isOwn && (
                      <p className="text-[10px] font-semibold opacity-80 mb-1">
                        {msg.senderId?.fullName || "Unknown"}
                      </p>
                    )}
                    {!isDeleted && msg.forwarded && (
                      <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wider mb-1">
                        Forwarded
                      </p>
                    )}
                    {!isDeleted && msg.replyTo && (
                      <div className="border-l-2 border-current/40 pl-2 mb-1.5 rounded-sm bg-white/5 py-1 px-1.5">
                        <p className="text-[10px] font-semibold opacity-80 truncate">
                          {getReplyName(msg)}
                        </p>
                        <p className="text-xs opacity-70 truncate">{getReplyText(msg)}</p>
                      </div>
                    )}
                    {isDeleted ? (
                      <p className="mt-2 italic opacity-70">
                        {isOwn ? "You deleted this message" : "This message was deleted"}
                      </p>
                    ) : (
                      msg.text && <p className="mt-2">{msg.text}</p>
                    )}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                      {msg.edited && !isDeleted && (
                        <span className="italic text-[10px]">edited</span>
                      )}
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isOwn && !isGroupChat && (
                        <span className="inline-flex items-center ml-1">
                          {isRead ? (
                            <img
                              src={selectedUser.profilePic || "/avatar.png"}
                              alt="Seen"
                              title={`Seen by ${selectedUser.fullName}`}
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30"
                            />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </span>
                      )}
                      {isOwn && isGroupChat && msg.readBy?.length > 0 && (
                        <span className="text-[10px] opacity-80 ml-1">
                          {msg.readBy.length === 1 ? "Read by 1" : `Read by ${msg.readBy.length}`}
                        </span>
                      )}
                    </p>

                    {!isDeleted && Object.keys(reactionGroups).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {Object.entries(reactionGroups).map(([emoji, g]) => (
                          <button
                            key={emoji}
                            type="button"
                            title={g.reacted ? "Remove reaction" : "React"}
                            onClick={() => reactToMessage(msg._id, emoji)}
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm border transition-colors ${
                              g.reacted
                                ? "bg-cyan-500/30 border-cyan-400/60"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[11px] text-slate-300">{g.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {!isDeleted && (
                      <div className="absolute -top-3 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Reply"
                          onClick={() => {
                            setDeleteMenuId(null);
                            setReplyTo(msg);
                          }}
                          className="w-7 h-7 rounded-full bg-slate-800/95 border border-slate-600/50 flex items-center justify-center text-slate-200 hover:bg-cyan-600 transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Forward"
                          onClick={() => {
                            setDeleteMenuId(null);
                            setForwardMessage(msg);
                          }}
                          className="w-7 h-7 rounded-full bg-slate-800/95 border border-slate-600/50 flex items-center justify-center text-slate-200 hover:bg-cyan-600 transition-colors"
                        >
                          <Forward className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="React"
                          onClick={() => setReactionPickerId(reactionPickerId === msg._id ? null : msg._id)}
                          className="w-7 h-7 rounded-full bg-slate-800/95 border border-slate-600/50 flex items-center justify-center text-slate-200 hover:bg-cyan-600 transition-colors"
                        >
                          <SmilePlus className="w-3.5 h-3.5" />
                        </button>
                        {isOwn && (
                          <>
                            <button
                              type="button"
                              title="Edit message"
                              onClick={() => {
                                setDeleteMenuId(null);
                                setEditingMessage(msg);
                              }}
                              className="w-7 h-7 rounded-full bg-slate-800/95 border border-slate-600/50 flex items-center justify-center text-slate-200 hover:bg-cyan-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete message"
                              onClick={() => setDeleteMenuId(deleteMenuId === msg._id ? null : msg._id)}
                              className="w-7 h-7 rounded-full bg-slate-800/95 border border-slate-600/50 flex items-center justify-center text-slate-200 hover:bg-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {deleteMenuId === msg._id && (
                          <div className="absolute top-full right-0 mt-1 w-44 rounded-lg bg-slate-800 border border-slate-600/50 shadow-xl p-1 z-20">
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteMenuId(null);
                                deleteMessage(msg._id, false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                            >
                              Delete for me
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteMenuId(null);
                                deleteMessage(msg._id, true);
                              }}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-rose-400 hover:bg-slate-700 transition-colors"
                            >
                              Delete for everyone
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {showTyping && (
              <div className="chat chat-start">
                <div className={`chat-bubble ${theme.receiver}`}>
                  <p className="text-sm flex items-center gap-1.5">
                    {isGroupChat && (
                      <span className="text-[10px] font-semibold opacity-80">
                        {typingName}
                      </span>
                    )}
                    <span className="typing-dots">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>
        ) : isLoading ? <MessagesLoadingSkeleton /> : (
          <NoChatHistoryPlaceholder name={isGroupChat ? selectedGroup.name : selectedUser.fullName} />
        )}
        </div>
      </div>

      <MessageInput key={`${editingMessage?._id || "composer"}-${replyTo?._id || "noreply"}`} />

      {reactionPickerMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setReactionPickerId(null)}
        >
          <div className="rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              theme="dark"
              width={320}
              height={380}
              onEmojiClick={(emojiData) => {
                reactToMessage(reactionPickerMessage._id, emojiData.emoji);
                setReactionPickerId(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ChatContainer
