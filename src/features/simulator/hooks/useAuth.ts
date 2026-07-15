import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      toast.error('Firebase has not been configured. Please add your credentials to the .env file.');
      return null;
    }
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      toast.success(`Signed in as ${result.user.displayName}`);
      return result.user;
    } catch (error: any) {
      console.error('Google Auth Sign In error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      setLoading(true);
      await signOut(auth);
      toast.success('Successfully signed out');
    } catch (error: any) {
      console.error('Sign Out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    loginWithGoogle,
    logout,
    isConfigured: !!auth,
  };
}
