import jwt from 'jsonwebtoken';

export function signToken(userId: string, secret: string): string {
  return jwt.sign({}, secret, { subject: userId, algorithm: 'HS256' });
}

export function verifyToken(token: string, secret: string): string | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return typeof payload === 'object' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
