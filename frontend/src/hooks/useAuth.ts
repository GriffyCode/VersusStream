import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string; // The session ID or user DB ID
  login: string;
  display_name: string;
  profile_image_url: string;
  twitchId?: string;
  accessToken?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return { user, loading, logout };
};
