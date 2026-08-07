import React, { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import { XIcon, PaletteIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { CHAT_THEMES, getTheme } from '../lib/chatThemes';

function ChatHeader() {
    const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, chatThemes, setChatTheme, isTyping, typingUserId, typingGroupId } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const [themeOpen, setThemeOpen] = useState(false);
    const themeMenuRef = useRef(null);

    const isGroupChat = !!selectedGroup;

    const name = isGroupChat ? selectedGroup.name : selectedUser.fullName;
    const avatar = isGroupChat
        ? null
        : (selectedUser.profilePic || "/avatar.png");
    const isOnline = !isGroupChat && onlineUsers.includes(selectedUser._id);
    const isTypingUser = isTyping && (
        isGroupChat ? typingGroupId === selectedGroup._id : typingUserId === selectedUser._id
    );
    const subtitle = isGroupChat
        ? `${selectedGroup.members.length} members`
        : (isTypingUser ? "Typing..." : (isOnline ? "Online" : "Offline"));

    const currentTheme = getTheme(chatThemes[selectedUser?._id]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape") {
                setSelectedUser(null);
                setSelectedGroup(null);
            }
        };

        window.addEventListener("keydown", handleEscKey)

        return () => window.removeEventListener("keydown", handleEscKey)
    }, [setSelectedUser, setSelectedGroup]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
                setThemeOpen(false);
            }
        };

        if (themeOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [themeOpen]);

    const handleSelectTheme = (themeId) => {
        setChatTheme(selectedUser._id, themeId);
        setThemeOpen(false);
    };

    const handleClose = () => {
        setSelectedUser(null);
        setSelectedGroup(null);
    };

    return (
        <div className='p-4 bg-slate-800/50 border-b border-slate-700/50'>
            <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-3 min-w-0'>
                    {isGroupChat ? (
                        <div className='size-11 rounded-full bg-slate-700 flex items-center justify-center text-xl text-slate-200 shrink-0'>
                            <span>{selectedGroup.name.charAt(0).toUpperCase()}</span>
                        </div>
                    ) : (
                        <div className={`avatar ${isOnline ? "avatar-online" : "avatar-offline"}`}>
                            <div className='w-11 rounded-full overflow-hidden'>
                                <img src={avatar} alt={name} className='size-full object-cover' />
                            </div>
                        </div>
                    )}

                    <div className='min-w-0'>
                        <h3 className='text-slate-200 font-medium truncate'>{name}</h3>
                        <p className={`text-sm ${isTypingUser ? 'text-cyan-400' : 'text-slate-400'}`}>{subtitle}</p>
                    </div>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                    {!isGroupChat && (
                        <div className="relative" ref={themeMenuRef}>
                            <button
                                className={`p-2 rounded-lg transition-colors ${currentTheme.id !== "default" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"}`}
                                onClick={() => setThemeOpen((prev) => !prev)}
                                title="Chat theme"
                            >
                                <PaletteIcon className='w-5 h-5' />
                            </button>

                            {themeOpen && (
                                <div className='absolute right-0 top-full mt-2 p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-20 w-44'>
                                    <p className='text-[11px] text-slate-400 px-2 pb-2'>Chat theme</p>
                                    <div className='grid grid-cols-3 gap-1.5'>
                                        {CHAT_THEMES.map((theme) => (
                                            <button
                                                key={theme.id}
                                                title={theme.label}
                                                onClick={() => handleSelectTheme(theme.id)}
                                                className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 bg-white/5 hover:bg-white/10 transition-colors ${currentTheme.id === theme.id ? "ring-2 ring-cyan-400" : ""}`}
                                            >
                                                <span className="text-lg">{theme.icon}</span>
                                                <span className="text-[10px] text-slate-300">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button className='p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors' onClick={handleClose}>
                        <XIcon className='w-5 h-5' />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatHeader
