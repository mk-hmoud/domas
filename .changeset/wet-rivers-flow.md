---
"client": minor
---

Add live notification counters to admin navbar.

Introduces `useNavStats` hook that polls `GET /stats/dashboard` every 60 seconds and surfaces pending counts as badge indicators on five nav items: Check In (check-ins today), Check Out (check-outs today), Accounting (pending accounting approvals), Damages (pending damage reports), and Room Changes (pending room change requests). Badges are permission-gated automatically — the stats endpoint only returns values the user is authorised to see.
