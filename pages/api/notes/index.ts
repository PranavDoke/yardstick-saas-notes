import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  payload: any
) => {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetNotes(req, res, payload);
      case 'POST':
        return handleCreateNote(req, res, user, payload);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notes API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const handleGetNotes = async (
  req: NextApiRequest,
  res: NextApiResponse,
  payload: any
) => {
  const notes = await prisma.note.findMany({
    where: {
      tenantId: payload.tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.status(200).json(notes);
};

const handleCreateNote = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  payload: any
) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // Check subscription limits
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
  });
  
  if (tenant?.subscriptionPlan === 'FREE') {
    const noteCount = await prisma.note.count({
      where: {
        tenantId: payload.tenantId,
      },
    });

    if (noteCount >= 3) {
      return res.status(403).json({ 
        error: 'Free plan allows maximum 3 notes. Upgrade to Pro for unlimited notes.',
        code: 'NOTE_LIMIT_EXCEEDED'
      });
    }
  }

  const note = await prisma.note.create({
    data: {
      title,
      content,
      userId: payload.userId,
      tenantId: payload.tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  res.status(201).json(note);
};

export default withAuth(handler);