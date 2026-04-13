---
"client-student": minor
---

apps/client-student — ApplyPage

- Replaced the bed picker (BedStep) with a drilldown UI (BedStep kept same name/props). Users now navigate through location levels (campus → building → floor → room)  
  using clickable cards before seeing beds. Includes a breadcrumb for jumping back to any level and a back button. Navigation cards show a level-appropriate icon and bed  
  count. Bed cards are unchanged in style.
- Fixed a dark mode bug in both the semester selector and the bed selector: selected items used var(--mantine-color-blue-0) (a fixed light shade) as the highlight  
  background, which renders white text on a near-white background in dark mode. Replaced with var(--mantine-color-blue-light) — a semi-transparent blue (rgba(blue, 0.1))  
  that works on both light and dark backgrounds.
