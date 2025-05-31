# VibePoll

A simple real-time poll web application built with Next.js, Prisma, and SQLite.

## Features
- **Admin Panel**
  - Create, edit, delete polls (with options)
  - Set one poll as active at a time
  - Optional countdown timer for polls (3, 5, 10, 30 minutes)
  - Activate/deactivate polls
  - See all polls in a table
- **User Voting**
  - Vote on the currently active poll
  - One vote per poll per user (per browser)
  - See which answer you voted for
  - Voting disabled when countdown ends
- **Results**
  - Real-time results page (auto-refreshes every 2 seconds)
  - Live countdown timer if poll has a countdown
  - Progress bars and vote counts for each option

## Tech Stack
- [Next.js (App Router, TypeScript)](https://nextjs.org/)
- [Prisma ORM](https://www.prisma.io/)
- [SQLite](https://www.sqlite.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up the database
```bash
npx prisma migrate dev --name init
```

### 3. Run the development server
```bash
npm run dev
```

Visit:
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Vote: [http://localhost:3000/vote](http://localhost:3000/vote)
- Results: [http://localhost:3000/results](http://localhost:3000/results)

## Development Notes
- Polls can only be edited if not active and have no votes.
- Only one poll can be active at a time. Activating a poll resets its countdown and clears all previous votes.
- Countdown is optional. If set, voting is disabled when the timer ends.
- User voting is tracked per browser using localStorage (not secure for public voting).
- To reset the database, delete `prisma/dev.db` and run migrations again.

## License
MIT
