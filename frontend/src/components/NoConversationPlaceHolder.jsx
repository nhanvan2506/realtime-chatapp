import React from 'react'
import { MessagesSquareIcon } from 'lucide-react'

function NoConversationPlaceHolder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <div className="size-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/10 border border-white/10 flex items-center justify-center shadow-lg shadow-cyan-500/5">
        <MessagesSquareIcon className="size-9 text-cyan-300/80" />
      </div>
      <div className="text-center">
        <h2 className="text-slate-200 font-semibold text-lg">No conversation selected</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-xs">
          Choose a chat from the list to start messaging
        </p>
      </div>
    </div>
  )
}

export default NoConversationPlaceHolder
