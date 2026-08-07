import React, { useEffect, useRef, useState } from 'react'
import useKeyboardSound from '../hooks/useKeyboardSound'
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { ImageIcon } from 'lucide-react';
import { XIcon, SendIcon, CheckIcon, PencilLine } from 'lucide-react';

const TYPING_EMIT_INTERVAL = 2000;
const TYPING_STOP_DELAY = 2500;

function MessageInput() {

  const {playRandomKeyStrokeSound} = useKeyboardSound();
  const {sendMessages, sendGroupMessage, selectedGroup, selectedUser, isSoundEnabled, editingMessage, setEditingMessage, editMessage, replyTo, setReplyTo} = useChatStore();
  const { socket, authUser } = useAuthStore();

  // MessageInput is remounted with a key when editingMessage changes, so the
  // initial text always reflects the message being edited.
  const [text, setText] = useState(editingMessage?.text || "");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const typingTargetRef = useRef(null);

  const emitTyping = (isTyping) => {
    if (!socket || editingMessage) return;

    if (selectedGroup) {
      typingTargetRef.current = { groupId: selectedGroup._id };
      socket.emit("typing", { groupId: selectedGroup._id, isTyping });
    } else if (selectedUser) {
      typingTargetRef.current = { receiverId: selectedUser._id };
      socket.emit("typing", { receiverId: selectedUser._id, isTyping });
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      const liveSocket = useAuthStore.getState().socket;
      if (liveSocket && typingTargetRef.current) {
        liveSocket.emit("typing", { ...typingTargetRef.current, isTyping: false });
      }
    };
  }, []);

  const handleTypingChange = () => {
    const now = Date.now();
    if (now - lastTypingEmitRef.current >= TYPING_EMIT_INTERVAL) {
      lastTypingEmitRef.current = now;
      emitTyping(true);
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTyping(false);
      lastTypingEmitRef.current = 0;
    }, TYPING_STOP_DELAY);
  };

  const stopTyping = () => {
    clearTimeout(typingTimerRef.current);
    emitTyping(false);
    lastTypingEmitRef.current = 0;
  };

  const handleSendMessage = (e) =>{
    e.preventDefault();

    if (editingMessage) {
      if (!text.trim()) return;
      editMessage(editingMessage._id, text.trim());
      stopTyping();
      setText("");
      return;
    }

    if(!text.trim() && !imagePreview){
      return;
    }
    if(isSoundEnabled){
      playRandomKeyStrokeSound()
    }

    if (selectedGroup) {
      sendGroupMessage({
        text: text.trim(),
        image: imagePreview
      })
    } else {
      sendMessages({
        text: text.trim(),
        image: imagePreview
      })
    }

    stopTyping();
    setText("")
    setImagePreview("")
    if(fileInputRef.current){
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const replyToName = (() => {
    if (!replyTo) return "";
    const senderId = replyTo.senderId?._id ?? replyTo.senderId;
    if (senderId?.toString() === authUser?._id) return "You";
    if (replyTo.senderId?.fullName) return replyTo.senderId.fullName;
    if (!selectedGroup && senderId?.toString() === selectedUser?._id) return selectedUser?.fullName || "Someone";
    return "Someone";
  })();

  return (
    <div className='p-4 border-t border-slate-700/50'>
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!editingMessage && replyTo && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center gap-2 bg-slate-700/40 border border-slate-600/50 rounded-lg px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-cyan-400 truncate">
              Replying to {replyToName}
            </p>
            <p className="text-sm text-slate-300 truncate">
              {replyTo.deletedForEveryone
                ? "This message was deleted"
                : (replyTo.text || "[Image]")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Cancel reply"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2">
          <PencilLine className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-sm text-cyan-300 flex-1 truncate">
            Editing message
          </span>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setText("");
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Cancel editing"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className='max-w-3xl mx-auto flex space-x-4'>
        <input 
          type='text' 
          value={text} 
          onChange={(e)=>{ 
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
            handleTypingChange();
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
          placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {!editingMessage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${
              imagePreview ? "text-cyan-500" : ""
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        )}
        <button
          type="submit"
          disabled={editingMessage ? !text.trim() : !text.trim() && !imagePreview}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={editingMessage ? "Save changes" : "Send message"}
        >
          {editingMessage ? <CheckIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
        </button>
      </form>
    </div>
  )
}

export default MessageInput