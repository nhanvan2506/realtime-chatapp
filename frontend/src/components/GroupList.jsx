import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { UsersIcon, PlusIcon } from "lucide-react";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import CreateGroupModal from "./CreateGroupModal";

function GroupList() {
  const { groups, isGroupsLoading, getMyGroups, setSelectedGroup } = useChatStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getMyGroups();
  }, [getMyGroups]);

  if (isGroupsLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Create group</span>
      </button>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-full flex items-center justify-center">
            <UsersIcon className="w-7 h-7 text-cyan-400" />
          </div>
          <p className="text-slate-400 text-sm">No groups yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {groups.map((group) => (
            <div
              key={group._id}
              className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex items-center gap-3">
                <div className="avatar avatar-online">
                  <div className="size-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                    <span>{group.name.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-slate-200 font-medium truncate">{group.name}</h4>
                  <p className="text-slate-400 text-xs truncate">
                    {group.members.length} members
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}

export default GroupList;
