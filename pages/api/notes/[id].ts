import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  payload: any
) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Note ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetNote(req, res, id, payload);
      case 'PUT':
        return handleUpdateNote(req, res, id, payload);
      case 'DELETE':
        return handleDeleteNote(req, res, id, payload);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Note API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const handleGetNote = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  payload: any
) => {
  const note = await prisma.note.findFirst({
    where: {
      id,
      tenantId: payload.tenantId, // Ensure tenant isolation
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

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  res.status(200).json(note);
};

const handleUpdateNote = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  payload: any
) => {
  const { title, content } = req.body;

  if (!title && !content) {
    return res.status(400).json({ error: 'Title or content is required' });
  }

  // First check if note exists and belongs to tenant
  const existingNote = await prisma.note.findFirst({
    where: {
      id,
      tenantId: payload.tenantId,
    },
  });

  if (!existingNote) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const updateData: any = {};
  if (title) updateData.title = title;
  if (content) updateData.content = content;

  const note = await prisma.note.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json(note);
};

const handleDeleteNote = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  payload: any
) => {
  // First check if note exists and belongs to tenant
  const existingNote = await prisma.note.findFirst({
    where: {
      id,
      tenantId: payload.tenantId,
    },
  });

  if (!existingNote) {
    return res.status(404).json({ error: 'Note not found' });
  }

  await prisma.note.delete({
    where: { id },
  });

  res.status(204).end();
};

export default withAuth(handler);