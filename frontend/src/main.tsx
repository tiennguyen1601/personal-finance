import React from 'react';
import ReactDOM from 'react-dom/client';
import { onAuthStateChanged } from 'firebase/auth';
import App from './App';
import { auth } from './services/firebase';
import { useAuthStore } from './store/authStore';
import './index.css';

// Khôi phục phiên đăng nhập từ Firebase (giữ đăng nhập sau khi F5).
onAuthStateChanged(auth, (user) => {
  const store = useAuthStore.getState();
  if (user) {
    store.login(user.uid, user.displayName ?? '', user.email ?? '');
  } else {
    useAuthStore.setState({ token: null, fullName: '', email: '' });
  }
  store.setReady();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
