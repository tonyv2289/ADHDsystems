# MOMENTUM: The ADHD Operating System

## The Problem with Every Other System

Traditional productivity systems are designed by and for neurotypical brains. They assume:
- You have working memory
- You can delay gratification
- You experience time linearly
- Discipline is a renewable resource
- Shame motivates behavior change

**For ADHD brains, all of these assumptions are wrong.**

---

## Core Philosophy: The Five Laws

### Law 1: Never Rely on Willpower
Willpower is a finite resource, and ADHD brains start with less and burn it faster.
Every feature must work WITHOUT requiring motivation.

### Law 2: Dopamine is the Currency
The ADHD brain is dopamine-deficient. If an action doesn't provide immediate reward,
it won't happen. We engineer dopamine into everything.

### Law 3: Time is Not Linear
ADHD brains experience two times: NOW and NOT NOW.
The system must make future consequences feel immediate.

### Law 4: Friction is Everything
The difference between doing something and not doing it is often just 3 seconds of friction.
Reduce friction for good behaviors. Add friction for bad ones.

### Law 5: Shame Destroys Progress
Traditional systems punish failure with shame spirals.
This system treats failure as data and makes recovery frictionless.

---

## The Seven Engines

### 1. THE MOMENTUM ENGINE
**Purpose:** Replace habits with "momentum chains"

The problem with habits: they take 66+ days to form, require consistency,
and a single break destroys the chain. ADHD brains can't do this.

**Solution: Momentum Chains**
- Micro-actions (under 2 minutes)
- One action triggers the next automatically
- "Good enough" completion counts as complete
- Chain repair is easier than chain building

**Example:**
```
Wake up → Feet on floor (action 1 complete!)
       → Walk to bathroom (action 2 complete!)
       → Splash face with water (action 3 complete!)
       → You've now "started your morning routine"
```

Each micro-action is a win. Dopamine hits stack.

### 2. THE DOPAMINE DASHBOARD
**Purpose:** Make progress feel incredible

**Components:**
- **XP System:** Everything earns experience points
- **Levels:** Visual progression through ranks
- **Loot Boxes:** Random rewards for completed tasks (variable ratio reinforcement - like slot machines)
- **Streaks with Shields:** Streaks motivate, but "streak shields" forgive bad days
- **Achievement Unlocks:** Surprising rewards for patterns you didn't know you were building
- **Daily Quests:** Fresh challenges each day for novelty-seeking brains
- **Boss Battles:** Weekly challenges with bigger stakes and rewards

**The Variable Reward System:**
Sometimes completing a task gives 10 XP. Sometimes 100. Sometimes a surprise reward.
This unpredictability is addictive (in a good way).

### 3. THE TIME ANCHOR SYSTEM
**Purpose:** Defeat time blindness

ADHD brains don't feel time passing. 5 minutes and 50 minutes feel the same.

**Components:**
- **Always-On Timer:** How long until your next commitment?
- **Transition Time Padding:** Calendar events auto-add travel + preparation time
- **Time Debt Tracker:** Visual representation of "promises to future self"
- **Time Elapsed Alerts:** Notifications like "You've been on Twitter for 47 minutes"
- **Day Visualization:** See your day as a visual timeline, watch the "now" marker move
- **Urgency Injection:** Make distant deadlines feel immediate

**The "NOT NOW" Problem:**
Anything more than 2 hours away feels like "later."
The system artificially compresses time to make consequences feel immediate.

### 4. THE FRICTION MANAGER
**Purpose:** Environment design > willpower

**Reduce Friction for Good Behaviors:**
- One-tap task start
- Voice capture for ideas (speak, don't type)
- Smart defaults (predict what you probably want to do)
- Pre-made routines that run with a single button
- Location-aware triggers ("You're at the gym → Log workout?")

**Add Friction for Bad Behaviors:**
- App blocking with increasing unlock difficulty
- "Mindful pause" before opening distracting apps
- Public commitment broadcasting
- Financial consequences (optional Beeminder-style)

### 5. THE RECOVERY PROTOCOL
**Purpose:** Make getting back on track effortless

Traditional systems: Miss a day → shame → miss another → spiral → give up

MOMENTUM: Miss a day → "Welcome back. Let's start small." → easy win → momentum restored

**Components:**
- **No Streaks Longer Than 7 Days:** Psychologically, losing a 100-day streak is devastating. Max visible streak is 7. Behind the scenes, we track more.
- **Minimum Viable Day (MVD):** The ONE thing that counts as "not zero." Even your worst day can be a green checkmark.
- **The Restart Button:** Explicitly wipes slate clean. No shame. New beginning.
- **Energy-Aware Scheduling:** Bad day? System shows only high-impact, low-effort tasks.
- **Win Archaeology:** "Look at what you accomplished last Tuesday when you felt like this."

### 6. THE STAKES ENGINE
**Purpose:** Create external accountability when internal motivation fails

**Components:**
- **Money on the Line:** Optional Beeminder-style financial commitment. Miss your target, money goes to charity (or anti-charity for extra motivation).
- **Accountability Partners:** Friends can see your progress (opt-in). Social pressure without surveillance.
- **Public Commitments:** Tweet your intentions automatically. Now your reputation is on the line.
- **Body Doubling:** Virtual co-working rooms. Others can see you're "working" even if alone.
- **Coach Mode:** Designate someone who gets alerts when you're derailing.

### 7. THE CONTEXT ENGINE
**Purpose:** Right task, right time, right place, right energy

ADHD brains can't just "do the next task." Context matters enormously.

**Components:**
- **Location Awareness:** At home? Show home tasks. At office? Show work tasks.
- **Energy Matching:** Rate your energy. See only tasks that match.
- **Time Fitting:** Have 5 minutes? See only 5-minute tasks.
- **Mood Matching:** Feeling creative? Here's creative work. Feeling robotic? Here's administrative tasks.
- **Smart Surfacing:** AI learns when you actually do things and suggests accordingly.

---

## The Daily Loop

### Morning Startup (2 minutes)
1. Rate your energy (1-5)
2. See your "Big 3" for today (auto-selected based on priorities)
3. Optional: Quick body scan, set intention
4. System shows first micro-action

### Throughout the Day
- Persistent time awareness
- Just-in-time reminders based on context
- Friction reduction active
- Dopamine rewards accumulating

### Evening Shutdown (2 minutes)
1. Quick wins review (dopamine from seeing accomplishments)
2. Brain dump (capture anything lingering)
3. Tomorrow preview (reduce morning anxiety)
4. Gratitude micro-prompt (optional)

### Weekly Review (15 minutes)
1. Wins celebration
2. Pattern recognition ("You're most productive on Tuesdays at 2pm")
3. Obstacle identification
4. Adjustment recommendations

---

## The Tech Stack

### Mobile (Primary Interface)
- React Native + Expo
- Always-accessible, always-present
- Widgets for persistent awareness
- Notifications that respect attention

### Web Dashboard
- React + Next.js
- Deep analytics
- Weekly review interface
- Settings and configuration

### Shared Backend
- Supabase for realtime sync
- Edge functions for smart processing
- AI for pattern recognition

### Desktop (Companion)
- Electron wrapper
- App blocking capabilities
- Time tracking
- Distraction defense

---

## What Makes This Different

| Traditional Systems | MOMENTUM |
|---------------------|----------|
| Requires discipline | Engineers around discipline |
| Punishes failure | Expects and absorbs failure |
| Static rewards | Variable, surprising rewards |
| Time-blind | Time-aware by default |
| Relies on memory | External brain |
| Shame-driven | Progress-driven |
| One-size-fits-all | Context-aware |
| Annual goals | Daily momentum |

---

## The Name: MOMENTUM

Not "productivity." Not "habits."

**MOMENTUM.**

Because an object in motion stays in motion.
Because the goal isn't perfection—it's maintaining forward movement.
Because even a tiny push counts when you're building momentum.

---

## Success Metrics

### For the User
- Reduced shame and anxiety around productivity
- More consistent "good enough" days
- Fewer zero days
- Better relationship with time
- Sustainable progress on meaningful goals

### For the System
- Daily active use
- Task completion rate
- Streak maintenance (7-day cycles)
- Recovery speed after breaks
- User-reported satisfaction

---

## The Promise

This system will not:
- Cure your ADHD
- Make you neurotypical
- Eliminate bad days

This system WILL:
- Work with your brain, not against it
- Make good days easier
- Make bad days survivable
- Help you capture more of your potential
- Reduce the gap between who you are and who you could be

---

*Built by someone who gets it. For people who get it.*
