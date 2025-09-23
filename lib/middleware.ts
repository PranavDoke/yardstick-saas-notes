import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthToken, getCurrentUser } from './auth';

export const withAuth = (
  handler: (req: NextApiRequest, res: NextApiResponse, user: any, payload: any) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = getAuthToken(req);
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const { user, payload } = await getCurrentUser(token);
      return handler(req, res, user, payload);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

export const withRole = (allowedRoles: string[]) => {
  return (
    handler: (req: NextApiRequest, res: NextApiResponse, user: any, payload: any) => Promise<void>
  ) => {
    return withAuth(async (req, res, user, payload) => {
      if (allowedRoles.indexOf(payload.role) === -1) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handler(req, res, user, payload);
    });
  };
};

export const withTenant = (
  handler: (req: NextApiRequest, res: NextApiResponse, user: any, payload: any) => Promise<void>
) => {
  return withAuth(async (req, res, user, payload) => {
    // Ensure tenant isolation by checking if the request involves tenant-specific data
    const tenantSlug = req.query.slug as string;
    if (tenantSlug && tenantSlug !== payload.tenantSlug) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }
    return handler(req, res, user, payload);
  });
};