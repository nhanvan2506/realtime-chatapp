import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";
import { XIcon, UsersIcon } from "lucide-react";

function CreateGroupModal({ onClose }) {
  const { allContacts, getAllContacts, createGroup } = useChatStore();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (allContacts.length === 0) {
      getAllContacts();
    }
  }, [allContacts, getAllContacts]);

  const toggleMember = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selected.length < 2) {
      toast.error("Select at least 2 members (3 total with you)");
      return;
    }

    setIsCreating(true);
    try {
      await createGroup({ name: name.trim(), memberIds: selected });
      onClose();
    } catch {
      // error toast already shown in store
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-slate-100 font-semibold flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-cyan-400" />
            Create group
          </h3>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Hangout"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Members ({selected.length} selected — at least 2)
            </label>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {allContacts.map((contact) => (
                <label
                  key={contact._id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selected.includes(contact._id) ? "bg-cyan-500/15" : "bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(contact._id)}
                    onChange={() => toggleMember(contact._id)}
                    className="accent-cyan-500 size-4"
                  />
                  <div className="avatar">
                    <div className="size-8 rounded-full">
                      <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
                    </div>
                  </div>
                  <span className="text-sm text-slate-200 truncate">{contact.fullName}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg py-2.5 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create group"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
