import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

let typingTimeoutId = null;

export const useChatStore = create((set, get) => ({
    allContacts: [],
    chats: [],
    messages: [],
    activeTab: "chats",
    selectedUser: null,
    selectedGroup: null,
    groups: [],
    groupMessages: [],
    isGroupsLoading: false,
    isGroupMessagesLoading: false,
    isUsersLoading: false,
    isMessagesLoading: false,
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) !== false,
    chatThemes: {},
    isTyping: false,
    typingUserId: null,
    typingGroupId: null,
    editingMessage: null,
    deleteMenuId: null,

    toggleSound: () => {
        localStorage.setItem("isSoundEnabled", !get().isSoundEnabled)
        set({ isSoundEnabled: !get().isSoundEnabled })
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedUser: (selectedUser) => set({ selectedUser }),
    setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

    setEditingMessage: (message) => set({ editingMessage: message }),
    setDeleteMenuId: (deleteMenuId) => set({ deleteMenuId }),

    getMyGroups: async () => {
        set({ isGroupsLoading: true });

        try {
            const res = await axiosInstance.get("/messages/groups");
            set({ groups: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load groups");
        } finally {
            set({ isGroupsLoading: false });
        }
    },

    createGroup: async (data) => {
        try {
            const res = await axiosInstance.post("/messages/groups", data);
            set({ groups: [res.data, ...get().groups] });
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
            throw error;
        }
    },

    getGroupMessages: async (groupId) => {
        set({ isGroupMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/groups/${groupId}`);
            set({ groupMessages: res.data, editingMessage: null, deleteMenuId: null });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load group messages");
        } finally {
            set({ isGroupMessagesLoading: false });
        }
    },

    sendGroupMessage: async (messageData) => {
        const { selectedGroup } = get();
        const { authUser } = useAuthStore.getState();

        const tempId = `temp-${Date.now()}`

        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            groupId: selectedGroup._id,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        set({ groupMessages: [...get().groupMessages, optimisticMessage] })

        try {
            const res = await axiosInstance.post(`/messages/groups/${selectedGroup._id}/send`, messageData);
            set({ groupMessages: get().groupMessages.map(m => m._id === tempId ? res.data : m) });
        } catch (error) {
            set({ groupMessages: get().groupMessages.filter(m => m._id !== tempId) });
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    subscribeToGroupMessage: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newGroupMessage");
        socket.on("newGroupMessage", (newMessage) => {
            const { selectedGroup, groupMessages, isSoundEnabled } = get();

            const isFromSelectedGroup = selectedGroup && newMessage.groupId === selectedGroup._id;
            const isDuplicate = groupMessages.some((msg) => msg._id === newMessage._id);

            if (isFromSelectedGroup && !isDuplicate) {
                set({ groupMessages: [...groupMessages, newMessage] });
                get().markGroupMessagesAsRead(selectedGroup._id);
            } else if (!isFromSelectedGroup && isSoundEnabled) {
                const notificationSound = new Audio("/sounds/notification.mp3");
                notificationSound.currentTime = 0;
                notificationSound.play().catch((e) => console.log("Audio play failed:", e));
            }
        });
    },

    unsubscribeFromGroupMessage: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("newGroupMessage");
    },

    loadChatThemes: async () => {
        try {
            const res = await axiosInstance.get("/messages/themes");
            set({ chatThemes: res.data || {} });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load chat themes");
        }
    },

    setChatTheme: async (userId, themeId) => {
        set((state) => ({ chatThemes: { ...state.chatThemes, [userId]: themeId } }));

        try {
            await axiosInstance.put(`/messages/theme/${userId}`, { themeId });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save chat theme");
        }
    },

    subscribeToThemeChanges: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("themeChanged");
        socket.on("themeChanged", ({ userId, themeId }) => {
            set((state) => ({ chatThemes: { ...state.chatThemes, [userId]: themeId } }));
        });
    },

    unsubscribeFromThemeChanges: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("themeChanged");
    },

    getAllContacts: async () => {
        set({ isUsersLoading: true });

        try {
            const res = await axiosInstance.get("/messages/contacts");
            set({ allContacts: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        }
        finally {
            set({ isUsersLoading: false });
        }
    },

    markMessagesAsRead: async (userId) => {
        try {
            const res = await axiosInstance.get(`/messages/read/${userId}`);
            const { messageIds, userId: readerId } = res.data;

            if (messageIds?.length) {
                set({
                    messages: get().messages.map((m) =>
                        messageIds.includes(m._id)
                            ? { ...m, readBy: [...new Set([...(m.readBy || []), readerId])] }
                            : m
                    ),
                });
            }
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    },

    markGroupMessagesAsRead: async (groupId) => {
        try {
            const res = await axiosInstance.get(`/messages/groups/${groupId}/read`);
            const { messageIds, userId: readerId } = res.data;

            if (messageIds?.length) {
                set({
                    groupMessages: get().groupMessages.map((m) =>
                        messageIds.includes(m._id)
                            ? { ...m, readBy: [...new Set([...(m.readBy || []), readerId])] }
                            : m
                    ),
                });
            }
        } catch (error) {
            console.error("Failed to mark group messages as read:", error);
        }
    },

    subscribeToReadReceipts: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("messagesRead");
        socket.off("groupMessagesRead");

        socket.on("messagesRead", ({ userId, messageIds }) => {
            set({
                messages: get().messages.map((m) =>
                    messageIds.includes(m._id)
                        ? { ...m, readBy: [...new Set([...(m.readBy || []), userId])] }
                        : m
                ),
            });
        });

        socket.on("groupMessagesRead", ({ groupId, userId, messageIds }) => {
            set({
                groupMessages: get().groupMessages.map((m) =>
                    m.groupId === groupId && messageIds.includes(m._id)
                        ? { ...m, readBy: [...new Set([...(m.readBy || []), userId])] }
                        : m
                ),
            });
        });
    },

    unsubscribeFromReadReceipts: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("messagesRead");
            socket.off("groupMessagesRead");
        }
    },

    subscribeToTyping: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("typing");
        socket.on("typing", ({ userId, groupId, isTyping }) => {
            clearTimeout(typingTimeoutId);

            if (isTyping) {
                typingTimeoutId = setTimeout(() => set({ isTyping: false }), 3000);
            }

            set({
                isTyping: !!isTyping,
                typingUserId: userId,
                typingGroupId: groupId,
            });
        });
    },

    unsubscribeFromTyping: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("typing");
        clearTimeout(typingTimeoutId);
        set({ isTyping: false });
    },

    getMyChatPartners: async () => {
        set({ isUsersLoading: true });

        try {
            const res = await axiosInstance.get("/messages/chats");
            set({ chats: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        }
        finally {
            set({ isUsersLoading: false });
        }
    },

    getMessagesByUserId: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data, editingMessage: null, deleteMenuId: null });
        } catch (error) {
            toast.error(error.response?.data?.message || "Something wrong");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessages: async (messageData) => {
        const { selectedUser } = get();
        const { authUser } = useAuthStore.getState();

        const tempId = `temp-${Date.now()}`

        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        set({ messages: [...get().messages, optimisticMessage] })

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: get().messages.map(m => m._id === tempId ? res.data : m) });
            get().getMyChatPartners();
        } catch (error) {
            set({ messages: get().messages.filter(m => m._id !== tempId) });
            toast.error(error.response?.data?.message || "Something wrong");
        }
    },

    editMessage: async (messageId, text) => {
        try {
            const res = await axiosInstance.put(`/messages/${messageId}`, { text });
            const updated = res.data;

            if (get().selectedGroup) {
                set({ groupMessages: get().groupMessages.map((m) => (m._id === messageId ? updated : m)) });
            } else {
                set({ messages: get().messages.map((m) => (m._id === messageId ? updated : m)) });
            }
            set({ editingMessage: null });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to edit message");
        }
    },

    deleteMessage: async (messageId, deleteForEveryone) => {
        try {
            const res = await axiosInstance.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });

            if (deleteForEveryone) {
                const updated = res.data;
                if (get().selectedGroup) {
                    set({ groupMessages: get().groupMessages.map((m) => (m._id === messageId ? updated : m)) });
                } else {
                    set({ messages: get().messages.map((m) => (m._id === messageId ? updated : m)) });
                }
            } else {
                set({
                    messages: get().messages.filter((m) => m._id !== messageId),
                    groupMessages: get().groupMessages.filter((m) => m._id !== messageId),
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete message");
        }
    },

    subscribeToMessage: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages, isSoundEnabled } = get();
            const currentMessages = messages;

            const isMessageSentFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
            const isDuplicate = currentMessages.some((msg) => msg._id === newMessage._id);

            if (isMessageSentFromSelectedUser && !isDuplicate) {
                set({ messages: [...currentMessages, newMessage] });
                get().markMessagesAsRead(selectedUser._id);
            } else if (!isMessageSentFromSelectedUser && isSoundEnabled) {
                const notificationSound = new Audio("/sounds/notification.mp3")
                notificationSound.currentTime = 0;
                notificationSound.play().catch((e) => console.log("Audio play failed:", e));
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("newMessage");
    },

    subscribeToMessageEdits: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("messageEdited");
        socket.on("messageEdited", (updatedMessage) => {
            const { selectedUser, selectedGroup, messages, groupMessages } = get();

            if (updatedMessage.groupId) {
                if (selectedGroup && updatedMessage.groupId === selectedGroup._id) {
                    set({ groupMessages: groupMessages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)) });
                }
            } else if (selectedUser) {
                const isRelevant =
                    updatedMessage.senderId?.toString() === selectedUser._id?.toString() ||
                    updatedMessage.receiverId?.toString() === selectedUser._id?.toString();
                if (isRelevant) {
                    set({ messages: messages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)) });
                }
            }
        });
    },

    unsubscribeFromMessageEdits: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("messageEdited");
    },

    subscribeToMessageDeletes: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("messageDeleted");
        socket.on("messageDeleted", (updatedMessage) => {
            const { selectedUser, selectedGroup, messages, groupMessages } = get();

            if (updatedMessage.groupId) {
                if (selectedGroup && updatedMessage.groupId === selectedGroup._id) {
                    set({ groupMessages: groupMessages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)) });
                }
            } else if (selectedUser) {
                const isRelevant =
                    updatedMessage.senderId?.toString() === selectedUser._id?.toString() ||
                    updatedMessage.receiverId?.toString() === selectedUser._id?.toString();
                if (isRelevant) {
                    set({ messages: messages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)) });
                }
            }
        });
    },

    unsubscribeFromMessageDeletes: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("messageDeleted");
    },

}));