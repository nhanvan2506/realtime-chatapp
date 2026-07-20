import {create} from 'zustand';

export const useAuthStore = create((set)=>({
    authUser:{name:"van",_id:123,age:22},
    isLoggedIn: false,
    isLoading:false,
    login: ()=>{
        console.log("We just logged in");
        set({isLoggedIn:true, isLoading:true});
    },
}));