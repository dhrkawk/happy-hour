## 🎯 Project Purpose (for Cursor Rules)

- Build a location-based real-time discount connection platform where:
  - Business owners register discounted menus by timeslot
  - Consumers explore nearby discounts, issue coupons, and use them
- Focus on collecting **actual user engagement data** over feature completeness in MVP stage

---

## 📊 Data Collection & Tracking Requirements (for Cursor)

- Track and record:
  - Discount search & click events
  - Coupon issuance events
  - Coupon usage events
  - Business owner re-registration activities
  - Consumer revisit & repeated coupon issuance

- Design all APIs with built-in tracking triggers via `/track` endpoint (event types: click, open_coupon, redeem)
- Ensure every flow (registration, exploration, coupon usage) connects to tracking records
- Visualize data post-MVP via Supabase Dashboard or Google Data Studio

---

## 🛠 Technology Stack (MVP Focus)

| Area | Stack | Reason |
|------|-------|--------|
| Frontend | Next.js + React Query + Tailwind CSS | Fast dev, SSR, PWA support |
| Map | Simple Map SDK | For location-based discovery |
| Backend | FastAPI | Lightweight async API |
| Auth | Supabase Auth | Easy JWT-based login |
| Database | Supabase Postgres | Managed DB with integrated Auth |
| Tracking | FastAPI + Supabase Table | Event-driven tracking system |
| Deployment | Vercel (FE), Fly.io (BE) | Rapid deployment |
| CI/CD | GitHub Actions | Automated test & deploy |

---

## 📈 MVP Data Metrics to Track

- Business owner discount registrations (target: 10+)
- Consumer discount searches/clicks (target: 100+)
- Coupon issues (target: 200+)
- Coupon usage (target: ≥20% of issued coupons)
- Re-registrations & repeat uses (target: ≥30% of business owners)

---

## 🗂️ Technical Principles for MVP

- Prioritize fast, lightweight MVP delivery
- Tracking-first design to validate hypotheses
- Scalable architecture for future extension