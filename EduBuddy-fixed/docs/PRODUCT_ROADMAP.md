# EduBuddy Product Roadmap

This roadmap translates the current codebase into a clear path toward a strong Study Buddy platform.

## 1) Current baseline in this project

- Existing auth, profile, matching, quiz, and session APIs.
- Existing React UX for dashboard, profile, matching, and sessions.
- Existing Google Meet link handoff flow for planned sessions.

## 2) Phase 1 — MVP hardening (1–2 weeks)

### Goal
Make the current product stable and coherent for first real users.

### Deliverables
- Normalize profile data requirements (must-have fields for matching).
- Improve API error consistency (`success`, `message`, `data`).
- Add loading and empty states across key screens.
- Add basic input validation on profile and session plan forms.

### Acceptance checks
- New user can register → complete profile → see matches.
- User can send/accept buddy request.
- User can plan and join a session.

## 3) Phase 2 — Better matching quality (2–3 weeks)

### Goal
Produce more relevant matches with transparent score reasons.

### Deliverables
- Compatibility formula with explicit weighted factors:
  - subject overlap,
  - quiz/personality similarity,
  - preferred study technique,
  - availability overlap.
- Return “why you matched” explanations in matching API.
- Add filter/sort controls in match UI.

### Acceptance checks
- Every match row includes a score and at least 2 reason tags.
- Users can filter by subject and online time overlap.

## 4) Phase 3 — Scheduling + accountability (2 weeks)

### Goal
Help users actually study together consistently.

### Deliverables
- Weekly availability editor with timezone support.
- Session reminders (email or in-app).
- Session outcome prompt after meeting:
  - attended?
  - productive?
  - continue with this buddy?

### Acceptance checks
- Reminder is delivered before session start.
- Outcome feedback updates future match ranking.

## 5) Phase 4 — Safety and trust (1–2 weeks)

### Goal
Increase user confidence and reduce abuse.

### Deliverables
- Block/report endpoints and UI.
- Optional profile visibility controls.
- Basic moderation queue for reports.

### Acceptance checks
- Blocked users can no longer appear in matches or send requests.
- Report submissions are persisted and reviewable.

## 6) Suggested data model additions

- `user_availability` (day_of_week, start_time, end_time, timezone).
- `study_preferences` (technique, solo_vs_group, session_length).
- `session_feedback` (session_id, rating, attended, notes).
- `user_blocks` and `user_reports`.

## 7) KPI dashboard (minimum)

Track weekly:
- Match acceptance rate.
- Planned-to-attended session conversion.
- Median time from signup to first session.
- 7-day retention.

## 8) Build order recommendation

1. Phase 1 hardening
2. Phase 2 matching quality
3. Phase 3 accountability
4. Phase 4 safety

This order maximizes early user value while reducing risk.

