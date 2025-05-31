import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET: List all polls
export async function GET() {
  const polls = await prisma.poll.findMany({
    include: { options: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(polls);
}

// POST: Create a new poll
export async function POST(req: NextRequest) {
  const { question, options, endsAt, countdownMinutes } = await req.json();
  if (!question || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const poll = await prisma.poll.create({
    data: {
      question,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      countdownMinutes: countdownMinutes ? Number(countdownMinutes) : undefined,
      options: {
        create: options.map((text: string) => ({ text })),
      },
    },
    include: { options: true },
  });
  return NextResponse.json(poll);
} 