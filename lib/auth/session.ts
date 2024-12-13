import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
console.log(`AUTH_SECRET length: ${process.env.AUTH_SECRET?.length || 'undefined'}`);
const SALT_ROUNDS = 10;

type SessionData = {
  user: { id: number };
  expires: string;
};

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password.
 */
export async function comparePasswords(plainTextPassword: string, hashedPassword: string) {
  return compare(plainTextPassword, hashedPassword);
}

/**
 * Sign a JSON Web Token for the session.
 */
export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now') // Adjust expiration as needed
    .sign(key);
}

/**
 * Verify a JSON Web Token and return its payload.
 */
export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

/**
 * Retrieve the current session from cookies.
 */
export async function getSession() {
  try {
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie) {
      console.debug('No session cookie found');
      return null;
    }

    console.debug('Session Cookie:', sessionCookie.value);
    return await verifyToken(sessionCookie.value);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to retrieve session:', error.message);
    } else {
      console.error('Unknown error occurred while retrieving session:', error);
    }
    return null;
  }
}
/**
 * Set a session cookie for the user.
 */
export async function setSession(user: NewUser) {
  if (!user.id) throw new Error('User ID is required for session creation');

  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day expiration
  const session: SessionData = {
    user: { id: user.id },
    expires: expiresInOneDay.toISOString(),
  };

  const encryptedSession = await signToken(session);

  // Dynamically determine domain for cookies
  const domain =
    process.env.NODE_ENV === 'production' ? 'razglas-tiv.vercel.app' : undefined;

  // Set the session cookie
  try {
    (await cookies()).set('session', encryptedSession, {
      expires: expiresInOneDay,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // Adjust as needed (e.g., 'strict' for higher security)
      domain,
    });
    console.debug('Session cookie set successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to set session cookie:', error.message);
    } else {
      console.error('Unknown error occurred while setting session cookie:', error);
    }
    throw new Error('Unable to set session cookie');
  }
}
