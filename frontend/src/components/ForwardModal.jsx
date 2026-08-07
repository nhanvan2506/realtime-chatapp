import { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore'
import { XIcon, UsersIcon } from 'lucide-react'

function ForwardModal() {
  const { forwardMessage, setForwardMessage, allContacts, groups, getAllContacts, getMyGroups, forwardMessageTo: doForward } = useChatStore();

  useEffect(() => {
    if (!forwardMessage) return;
    if (allContacts.length === 0) getAllContacts();
    if (groups.length === 0) getMyGroups();
  }, [forwardMessage, allContacts.length, groups.length, getAllContacts, getMyGroups]);

  if (!forwardMessage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setForwardMessage(null)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-600/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-slate-600/50">
          <div className="min-w-0">
            <h3 className="text-slate-200 font-medium">Forward message</h3>
            <p className="text-xs text-slate-400 truncate">
              {forwardMessage.text || "[Image]"}
            </p>
          </div>
          <button
            onClick={() => setForwardMessage(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors shrink-0"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          <p className="text-xs text-slate-400 px-3 pb-1 pt-2">Chats</p>
          {allContacts.length === 0 && groups.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Loading...</p>
          ) : (
            <>
              {allContacts.map((c) => (
                <button
                  key={c._id}
                  onClick={() => doForward(forwardMessage, { type: "dm", _id: c._id })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="size-9 rounded-full overflow-hidden shrink-0">
                    <img src={c.profilePic || "/avatar.png"} alt="" className="size-full object-cover" />
                  </div>
                  <span className="text-sm text-slate-200 truncate">{c.fullName}</span>
                </button>
              ))}
              <p className="text-xs text-slate-400 px-3 pb-1 pt-3">Groups</p>
              {groups.map((g) => (
                <button
                  key={g._id}
                  onClick={() => doForward(forwardMessage, { type: "group", _id: g._id })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="size-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-200 truncate">{g.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForwardModal;
