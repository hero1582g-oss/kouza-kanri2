import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";

const getAuthErrorMessage = (nextError: unknown): string => {
  const code = typeof nextError === "object" && nextError && "code" in nextError ? String(nextError.code) : "";
  if (code === "auth/configuration-not-found") {
    return "Firebase Authentication が未設定です。Firebase Console で Authentication を開始し、Google ログインを有効にしてください。";
  }
  if (code === "auth/unauthorized-domain") {
    return "このドメインでのログインが許可されていません。Firebase Authentication の Authorized domains に 127.0.0.1 を追加してください。";
  }
  if (code === "auth/popup-blocked") {
    return "ログイン用のポップアップがブロックされました。ブラウザでポップアップを許可してから再度お試しください。";
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "ログイン画面が閉じられました。もう一度 Google でログインを押してください。";
  }
  if (nextError instanceof Error) return nextError.message;
  return "ログインに失敗しました";
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    setPersistence(auth, browserLocalPersistence).catch((nextError) => {
      setError(getAuthErrorMessage(nextError));
    });
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const login = async () => {
    if (!auth) return;
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return { user, loading, error, login, logout, isFirebaseConfigured };
};
