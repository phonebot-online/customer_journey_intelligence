---
name: Cross-device Claude usage
description: User runs Claude across multiple machines on this Phonebot dashboard project — git is the cross-machine handoff mechanism, always commit + push before session end
type: user
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
User works on this dashboard from multiple machines (multiple iMacs, sometimes a different PC). Each machine has its own Claude Code session with its own memory directory under `~/.claude/projects/`. Memory does NOT automatically sync between machines.

**Git remote:** `https://github.com/phonebot-online/customer_journey_intelligence.git` (origin)

**End-of-session protocol:** When the user signals they're logging off, especially with mention of resuming on a different machine — always:
1. Update memory entries to reflect what was just done
2. `git add` all relevant new/modified files
3. `git commit` with a descriptive message
4. `git push origin main`
5. Stop any running dev servers (`pkill -f "concurrently npm run dev"` or similar)

**Why:** Without push, the new machine's git pull will miss the work and it'll look like nothing changed. Memory entries on the old machine stay isolated, so the README content + commit messages are the cross-machine context handoff.

**How to apply:** When the user says "I'm logging off" / "from another PC tomorrow" / similar, treat that as authorization to commit + push without asking again. Don't push without it being implied or explicit. If unsure, default to committing locally and asking about push.
