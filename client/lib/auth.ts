import "server-only";
import { Claims, getSession } from "@auth0/nextjs-auth0";

/**
 * Gets the user profile data from the Auth0 session
 * Use this in server components and API routes to get the current user
 * @returns The user claims from Auth0
 * @throws Error if user is not authenticated
 */
export const getUserProfileData = async (): Promise<Claims> => {
  const session = await getSession();

  if (!session) {
    throw new Error(`Requires authentication`);
  }

  const { user } = session;

  return user;
};

/**
 * Gets the user profile data from the Auth0 session
 * Similar to getUserProfileData but returns null instead of throwing an error if user is not authenticated
 * @returns The user claims from Auth0 or null if not authenticated
 */
export const getUserProfileDataSafe = async (): Promise<Claims | null> => {
  try {
    const session = await getSession();
    return session?.user || null;
  } catch (error) {
    console.error("Error getting user profile data:", error);
    return null;
  }
};
