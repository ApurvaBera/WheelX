import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCqiOVcl-sGWQ_vFSWwaDSnnuu5y8WdnRo",
  authDomain: "wheelx-7e9ec.firebaseapp.com",
  projectId: "wheelx-7e9ec",
  storageBucket: "wheelx-7e9ec.appspot.com",
  messagingSenderId: "394920589066",
  appId: "1:394920589066:web:f6ce1ceb2685ab411fecf3"
};

// 🔥 Prevent Firebase from initializing twice
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
