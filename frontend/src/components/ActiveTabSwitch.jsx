import React from 'react'
import { useChatStore } from '../store/useChatStore'

function ActiveTabSwitch() {

  const {activeTab, setActiveTab} = useChatStore()
  return (
    <div className='flex gap-1 p-1.5 mx-3 my-3 rounded-xl bg-white/[0.04] border border-white/10'>
      <button
        onClick={()=>setActiveTab("chats")}
        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeTab === "chats"
            ? "bg-cyan-500/20 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
      >
        Chats
      </button>
      <button
        onClick={()=>setActiveTab("contacts")}
        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeTab === "contacts"
            ? "bg-cyan-500/20 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
      >
        Contacts
      </button>
    </div>
  )
}

export default ActiveTabSwitch