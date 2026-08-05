import React from 'react'
import { useAuthStore } from '../store/useAuthStore'
import BorderAnimatedContainer from '../components/BorderAnimatedContainer';
import { useChatStore } from '../store/useChatStore'
import ProfileHeader from '../components/ProfileHeader'
import ActiveTabSwitch from '../components/ActiveTabSwitch'
import ChatContainer from '../components/ChatContainer'
import ChatList from '../components/ChatList'
import ContactList from '../components/ContactList'
import NoConversationPlaceHolder from '../components/NoConversationPlaceHolder'

function ChatPage() {
  const {logout} = useAuthStore();
  const {activeTab, selectedUser} = useChatStore();

  return (
    <div className='relative w-full max-w-7xl h-[min(90vh,880px)]'>
      <BorderAnimatedContainer>
        {/* Left side */}
        <div className='w-80 shrink-0 flex flex-col bg-white/[0.03] backdrop-blur-xl'>
          <ProfileHeader/>
          <ActiveTabSwitch/>
          
          <div className='flex-1 overflow-y-auto p-3 space-y-1.5'>
            {activeTab === "chats" ? <ChatList/> : <ContactList/>}
          </div>
        </div>

        {/* Right side */}
        <div className='flex-1 flex flex-col bg-white/[0.02] backdrop-blur-xl border-l border-white/10'>
          {selectedUser ? <ChatContainer/> : <NoConversationPlaceHolder/>}
        </div>
      </BorderAnimatedContainer>
    </div>
  )
}

export default ChatPage