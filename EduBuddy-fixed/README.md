# EduBuddy — Study Buddy Matching Platform

EduBuddy is a full-stack web app that helps students find compatible study partners, connect based on learning style, and plan online sessions together.

## What exists in this repo today

### Frontend (React + Vite)
- Authentication flow: home, register, login, logout.
- Logged-in experience with sidebar navigation.
- Dashboard with:
  - top matches,
  - incoming buddy requests,
  - upcoming sessions,
  - Google Meet link save/join workflow.
- Profile management screen.
- Personality quiz UI and utilities.
- Match browsing and interaction cards.

### Backend (PHP API)
- Session-aware auth endpoints.
- Profile, hobbies, subjects, quiz, and matching endpoints.
- Session planning and update endpoints.
- Database connection layer.

## Product direction: “Study Buddy” for online learners

To reach your vision (students meeting others with similar study styles and goals), focus on these capabilities:

1. **Matching quality**
   - Weighted compatibility score from:
     - personality quiz,
     - subject overlap,
     - study schedule overlap,
     - preferred study method (e.g., Pomodoro, active recall).
2. **Trust and safety**
   - Report/block users.
   - Session-only meeting links and profile visibility controls.
3. **Scheduling and accountability**
   - Availability windows + timezone handling.
   - Recurring sessions and reminders.
4. **Engagement loops**
   - Post-session feedback (“Was this a good match?”).
   - Re-match suggestions and streaks.

A practical implementation roadmap is included in `docs/PRODUCT_ROADMAP.md`.

## Suggested MVP scope

Build and validate this first:
- Signup/login.
- Complete profile (subjects, goals, study style, availability).
- Ranked match list with compatibility reasons.
- Buddy request + accept flow.
- Plan one session with topic + date/time + meet link.

Success metrics for MVP:
- Match acceptance rate.
- Session completion rate.
- 7-day returning users.

## Local development

### Frontend
```bash
npm install
npm run dev
```

### Production frontend build
```bash
npm run build
```

> Note: The PHP API under `api/` must be served by a PHP-capable web server and connected to a configured database.

## Repository structure

- `src/` — React frontend.
- `api/` — PHP backend endpoints.
- `docs/PRODUCT_ROADMAP.md` — implementation roadmap for the Study Buddy vision.

