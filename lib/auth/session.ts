import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

if (!process.env.AUTH_SECRET) {
  console.error('AUTH_SECRET environment variable is not set.');
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionData;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) {
    console.warn('Session cookie not found.');
    return null;
  }
  
  try {
    return await verifyToken(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function setSession(user: NewUser) {
  if (!user.id) throw new Error('User ID is required for session creation');
  
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const session: SessionData = {
    user: { id: user.id },
    expires: expiresInOneDay.toISOString(),
  };

  const encryptedSession = await signToken(session);

  console.log('Setting session cookie:', encryptedSession); // Debugging log

  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true, // Use secure cookies in production
    sameSite: 'lax',
    domain: 'razglas-tiv.vercel.app', // Adjust as needed
  });
}
