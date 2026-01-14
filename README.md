# MOMENTUM

## The ADHD Operating System for High Achievers

Built for successful adults with ADHD who manage multiple income streams, properties, and responsibilities. Works *with* your brain instead of against it.

---

## What This Is

A complete productivity system designed around ADHD neuroscience:

- **Never relies on willpower** - Engineers around executive function challenges
- **Dopamine-driven** - XP, levels, achievements, variable rewards
- **Time-aware** - Defeats time blindness with constant awareness
- **Shame-free** - Recovery protocols, not punishment
- **Context-intelligent** - Right task for your energy, location, and time
- **Multi-domain** - Manages your job, clients, properties, and personal life in one place

---

## Your Life, Organized

### Domains Supported
- **Consulting Clients** - Time tracking, invoicing, health scores
- **Rental Properties** - Tenant management, rent tracking, maintenance
- **W2 Job** - Projects, deadlines, work-life boundaries
- **Personal & Family** - Because life isn't just work

### Core Features
- Quick capture (2 seconds to log any thought)
- Momentum chains (one task triggers the next)
- Smart suggestions based on energy, time, and context
- Streak shields (miss a day without losing progress)
- Financial dashboard across all income streams
- Alert system for what needs attention NOW

---

## Running Locally

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup

```bash
# Clone the repo
git clone https://github.com/tonyv2289/ADHDsystems.git
cd ADHDsystems

# Install pnpm if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install

# Build shared package
pnpm build:shared

# Run mobile app (Expo)
pnpm dev:mobile
```

### Project Structure

```
ADHDsystems/
├── packages/
│   └── shared/           # Core engines and types
│       └── src/
│           ├── types/    # TypeScript definitions
│           ├── engines/  # Business logic
│           └── utils/    # Helpers
├── apps/
│   ├── mobile/           # React Native (Expo) app
│   └── web/              # Next.js dashboard (coming soon)
└── SYSTEM_DESIGN.md      # Full philosophy and architecture
```

---

## The Philosophy

### The 5 Laws

1. **Never Rely on Willpower** - If it requires motivation, it won't happen
2. **Dopamine is the Currency** - Immediate rewards or no action
3. **Time is Not Linear** - NOW vs NOT NOW (nothing in between)
4. **Friction is Everything** - 3 seconds of friction = won't happen
5. **Shame Destroys Progress** - Recovery protocols, not punishment

### The 7 Engines

1. **Momentum Engine** - Micro-actions and chain reactions
2. **Dopamine Engine** - XP, levels, loot drops, achievements
3. **Time Anchor Engine** - Defeating time blindness
4. **Recovery Engine** - Shame-free restarts
5. **Context Engine** - Right task, right moment
6. **Stakes Engine** - External accountability
7. **Domain Engine** - Multi-life management (clients, properties, job)

---

## For High Achievers

This system is built for people who:
- Have succeeded *despite* their ADHD
- Manage multiple income streams
- Own property (rentals, primary home)
- Run a business while holding a job
- Have families who depend on them
- Know they're leaving potential on the table

If that's you, this system understands your life.

---

## Tech Stack

- **Mobile**: React Native + Expo
- **State**: Zustand
- **Shared Logic**: TypeScript
- **Styling**: React Native StyleSheet (dark mode first)

---

## Coming Soon

- [ ] Backend API (Supabase)
- [ ] Web dashboard (Next.js)
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Invoicing automation
- [ ] Property expense tracking

---

*Built by someone who gets it. For people who get it.*
