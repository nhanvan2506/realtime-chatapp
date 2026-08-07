import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import { SearchIcon, XIcon, MessageSquareText } from 'lucide-react'

function SearchModal() {
  const { searchOpen, setSearchOpen, searchMessages, searchResults, isSearching, openChatFromSearch } = useChatStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const close = () => {
    setQuery("");
    setSearchOpen(false);
  };

  const handleChange = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMessages(value), 300);
  };

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20"
      onClick={close}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-600/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-slate-600/50">
          <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") close(); }}
            placeholder="Search messages across all chats..."
            className="flex-1 bg-transparent outline-none text-slate-200 placeholder-slate-400"
          />
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isSearching ? (
            <p className="text-center text-slate-400 text-sm py-8">Searching...</p>
          ) : query.trim() && searchResults.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No messages found</p>
          ) : searchResults.length > 0 ? (
            searchResults.map((r) => (
              <button
                key={r._id}
                onClick={() => openChatFromSearch(r)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
                  {r.type === "dm" && r.otherProfilePic ? (
                    <img src={r.otherProfilePic} alt="" className="size-full object-cover" />
                  ) : (
                    <MessageSquareText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 font-medium truncate">
                    {r.type === "group" ? r.groupName : r.otherFullName}
                    {r.type === "group" && (
                      <span className="text-slate-500 font-normal ml-2">Group</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-400 truncate">
                    <span className="text-cyan-400">{r.senderName}:</span>{" "}
                    {r.text || "[Image]"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-slate-500 text-sm py-8">Type to search your messages</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
