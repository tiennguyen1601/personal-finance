import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { auth, db } from './firebase';
import { seedDefaults } from './seed';
import type { AuthResponse } from '../types';

/** Chuyển mã lỗi Firebase Auth sang thông báo tiếng Việt thân thiện. */
function friendlyError(err: unknown): Error {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/email-already-in-use':
        return new Error('Email này đã được đăng ký.');
      case 'auth/invalid-email':
        return new Error('Email không hợp lệ.');
      case 'auth/weak-password':
        return new Error('Mật khẩu quá yếu (tối thiểu 6 ký tự).');
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return new Error('Email hoặc mật khẩu không đúng.');
      case 'auth/too-many-requests':
        return new Error('Bạn thử quá nhiều lần. Vui lòng thử lại sau.');
      case 'auth/network-request-failed':
        return new Error('Lỗi mạng. Kiểm tra kết nối internet.');
      default:
        return new Error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  }
  return err instanceof Error ? err : new Error('Có lỗi xảy ra.');
}

export const authService = {
  register: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName,
        email,
        createdAt: new Date().toISOString(),
      });
      await seedDefaults(cred.user.uid);
      return { token: cred.user.uid, fullName, email };
    } catch (err) {
      throw friendlyError(err);
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return {
        token: cred.user.uid,
        fullName: cred.user.displayName ?? '',
        email: cred.user.email ?? '',
      };
    } catch (err) {
      throw friendlyError(err);
    }
  },
};
