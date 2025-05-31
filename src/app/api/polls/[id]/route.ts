import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// PUT: Edit a poll (only if not active and has no votes)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const pollId = Number(params.id);
  const { question, options, endsAt, countdownMinutes } = await req.json();
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: { include: { votes: true } } },
  });
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  if (poll.isActive || poll.options.some(opt => opt.votes.length > 0)) {
    return NextResponse.json({ error: 'Cannot edit active poll or poll with votes' }, { status: 400 });
  }
  // Delete old options
  await prisma.option.deleteMany({ where: { pollId } });
  // Update poll and add new options
  const updatedPoll = await prisma.poll.update({
    where: { id: pollId },
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
  return NextResponse.json(updatedPoll);
}

// PATCH: Activate/Deactivate a poll
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const pollId = Number(params.id);
  const { isActive } = await req.json();
  let endsAtUpdate = undefined;
  if (isActive) {
    // Deactivate all other polls
    await prisma.poll.updateMany({ data: { isActive: false } });
    // Clear all votes for all polls
    await prisma.vote.deleteMany({});
    // Reset endsAt if countdownMinutes is set
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (poll && poll.countdownMinutes) {
      endsAtUpdate = new Date(Date.now() + poll.countdownMinutes * 60000);
    } else {
      endsAtUpdate = null;
    }
  }
  const updatedPoll = await prisma.poll.update({
    where: { id: pollId },
    data: { isActive: !!isActive, endsAt: endsAtUpdate },
    include: { options: true },
  });
  return NextResponse.json(updatedPoll);
}

// DELETE: Delete a poll and its options and votes
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const pollId = Number(params.id);
  // Delete votes for all options of this poll
  await prisma.vote.deleteMany({ where: { option: { pollId } } });
  // Delete options for this poll
  await prisma.option.deleteMany({ where: { pollId } });
  // Delete the poll
  await prisma.poll.delete({ where: { id: pollId } });
  return NextResponse.json({ success: true });
} 