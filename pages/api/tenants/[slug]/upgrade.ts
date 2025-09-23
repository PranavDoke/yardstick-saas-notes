import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/middleware';

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  payload: any
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  // Verify the tenant belongs to the authenticated user
  if (slug !== payload.tenantSlug) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }

  try {
    // Update tenant subscription to PRO
    const updatedTenant = await prisma.tenant.update({
      where: { slug },
      data: {
        subscriptionPlan: 'PRO',
      },
    });

    res.status(200).json({
      message: 'Subscription upgraded successfully',
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        subscriptionPlan: updatedTenant.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Only ADMIN users can upgrade subscriptions
export default withRole(['ADMIN'])(handler);