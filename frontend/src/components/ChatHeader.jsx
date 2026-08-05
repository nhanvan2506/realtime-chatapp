import React, { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore'
import { XIcon } from 'lucide-react';

function ChatHeader() {
    const {selectedUser, setSelectedUser} = useChatStore();

    useEffect(()=>{
        const handleEscKey = (event) => {
            if(event.key === "Escape") {
                setSelectedUser(null);
            }
        };

        window.addEventListener("keydown", handleEscKey)

        return () => window.removeEventListener("keydown",handleEscKey)
    },[setSelectedUser]);
  return (
    <div className='p-4 bg-slate-800/50 border-b border-slate-700/50'>
        <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-3 min-w-0'>
                <div className='avatar online shrink-0'>
                    <div className='w-11 rounded-full overflow-hidden'>
                        <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className='size-full object-cover' />
                    </div>
                </div>

                <div className='min-w-0'>
                    <h3 className='text-slate-200 font-medium truncate'>{selectedUser.fullName}</h3>
                    <p className='text-slate-400 text-sm'>Online</p>
                </div>
            </div>

            <button className='p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors shrink-0' onClick={() => setSelectedUser(null)}>
                <XIcon className='w-5 h-5'/>
            </button>
        </div>
    </div>
  )
}

export default ChatHeader