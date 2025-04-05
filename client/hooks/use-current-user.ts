'use client';

import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { getUserByEmail } from '@/app/actions/user';

/**
 * Custom hook that combines Auth0 user data with database user data
 * @returns Object containing Auth0 user, database user, loading state, and error
 */
export function useCurrentUser() {
  const { user: auth0User, error: auth0Error, isLoading: auth0Loading } = useAuth0User();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDbUser() {
      if (!auth0User?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getUserByEmail(auth0User.email);
        setDbUser(userData);
      } catch (err) {
        console.error('Error fetching user from database:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    if (!auth0Loading) {
      fetchDbUser();
    }
  }, [auth0User, auth0Loading]);

  return {
    auth0User,
    dbUser,
    isLoading: auth0Loading || isLoading,
    error: auth0Error || error,
    // Helper properties
    isAuthenticated: !!auth0User,
    email: auth0User?.email,
    name: auth0User?.name || dbUser?.name,
    picture: auth0User?.picture,
    // Combined user with Auth0 data taking precedence
    user: auth0User && dbUser ? {
      ...dbUser,
      name: auth0User.name || dbUser.name,
      picture: auth0User.picture,
      email: auth0User.email
    } : null
  };
}
