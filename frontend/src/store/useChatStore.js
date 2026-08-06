import {create} from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get)=>({
    allContacts: [],
    chats: [],
    messages: [],
    activeTab: "chats",
    selectedUser:null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

    toggleSound: () => {
        localStorage.setItem("isSoundEnabled", !get().isSoundEnabled)
        set({isSoundEnabled: !get().isSoundEnabled})
    },

    setActiveTab: (tab) => set({activeTab:tab}),
    setSelectedUser: (selectedUser) => set({selectedUser}),

    getAllContacts: async ()=>{
        set({isUsersLoading: true});

        try{
            const res = await axiosInstance.get("/messages/contacts");
            set({allContacts: res.data});
        } catch(error) {
            toast.error(error.response.data.message);
        }
        finally{
            set({isUsersLoading: false});
        }
    },

    getMyChatPartners: async () => {
        set({isUsersLoading: true});

        try{
            const res = await axiosInstance.get("/messages/chats");
            set({chats: res.data});
        } catch(error) {
            toast.error(error.response.data.message);
        }
        finally{
            set({isUsersLoading: false});
        }
    },

    getMessagesByUserId: async (userId) => {
        set({isMessagesLoading: true});
        try{
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({messages: res.data});
        } catch(error){
            toast.error(error.response?.data?.message || "Something wrong");
        } finally{
            set({isMessagesLoading: false});
        }
    },

    sendMessages: async(messageData) =>{
        const {selectedUser} = get(); 
        const {authUser} = useAuthStore.getState();

        const tempId = `temp-${Date.now()}`

        const optimisticMessage = {
            _id:tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        set({messages: [...get().messages, optimisticMessage]})

        try{
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({messages: get().messages.map(m => m._id === tempId ? res.data : m)});
            get().getMyChatPartners();
        } catch(error){
            set({messages: get().messages.filter(m => m._id !== tempId)});
            toast.error(error.response?.data?.message || "Something wrong");
        }
    },


}));