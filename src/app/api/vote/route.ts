import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET: Get the active poll with options and vote counts
export async function GET() {
  const poll = await prisma.poll.findFirst({
    where: { isActive: true },
    include: {
      options: {
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });
  if (!poll) return NextResponse.json({ error: 'No active poll' }, { status: 404 });
  return NextResponse.json(poll);
}

// POST: Submit a vote for an option
export async function POST(req: NextRequest) {
  const { optionId } = await req.json();
  if (!optionId) return NextResponse.json({ error: 'Missing optionId' }, { status: 400 });
  const option = await prisma.option.findUnique({ where: { id: optionId } });
  if (!option) return NextResponse.json({ error: 'Option not found' }, { status: 404 });
  await prisma.vote.create({ data: { optionId } });
  return NextResponse.json({ success: true });
} 