# Product Requirements Document (PRD)

## 1. Overview
A location-based mobile/web platform that monetizes small business owners’ no-shows and idle times through real-time discount slots, and provides consumers with instant, pre-paid discount opportunities. Core value: Simultaneously realizing “FOMO (Fear Of Missing Out)” and “Strategic Time Sale”.

## 2. Problem Definition
- Small Business Owners: Losses due to no-shows and same-day cancellations, sales gaps during off-peak/unpopular hours, concerns about brand damage from indiscriminate discounts.
- Consumers: Difficulty finding cost-effective services for spontaneous visits, scattered information, uncertainty with same-day reservations.
- Market: Burden of reservation/payment/refund CS, lack of initial supply and demand density.

## 3. Goals & Key Metrics
- Primary Goal: Monetize idle times in real time (reduce monthly loss per store by 20%).
- Secondary Goal: Provide consumers with instant discount reservation experience (conversion rate from payment to visit: 70%).
- Success Metrics  
  • 100,000 MAU / 40% repeat visit rate  
  • 1,000 stores registering empty slots / 60% slot sales rate  
  • No-show rate below 5%  
  • NPS 50 or higher  

## 4. Target Users
### 1) Consumers
- People in their 20s to 40s, spontaneous consumption based on location, value for money, familiar with mobile payments.
### 2) Business Owners
- All small business stores, mainly general restaurants/cafes

## 5. User Stories
- Consumer: “I want to instantly pay for and use a discounted empty slot at a nearby nail salon.”
- Business Owner: “I want to expose today’s 3pm idle slot as a discount to reduce loss.”
- Consumer: “I want to receive notifications when empty slots matching my preferences and schedule appear.”
- Business Owner: “I want to receive optimal discount suggestions within the range that maintains my brand value.”

## 6. Functional Requirements
### Core Features
1. Business Owner Idle Time Registration  
   • Easily create a slot by entering which service/product (subs), discount rate (10~70%), and applicable time (from what time to what time)  
   • Set exposure range (all/regulars) and slot quantity  
   • Immediately exposed to the market after approval  
   Acceptance Criteria: Slot time, price, and discount rate are saved and reflected within 3 seconds

2. Real-Time Discount Search (Consumer)  
   • Map UI (Next.js Map SDK) + distance, category, price filters  
   • Slot card: service, discount rate, remaining time, FOMO timer  
   • Reservation only without payment (reservation number issued upon success)  
   Acceptance Criteria: Render within 1 second for a 5km map radius, 99% reservation success rate

3. Brand Protection  
   • Limit of 2 “Happy Hour” slots per store per day  
   • “Special Time Deal” badge, adjustable display of discount rate (%) compared to regular price  

### Support Features
- Admin dashboard (sales, slot statistics, AI discount recommendations)

## 4. Non-Functional Requirements
- Performance: Server response under 200ms, 100,000 concurrent users
- Security: HTTPS, JWT authentication, PCI-DSS payment standards
- Usability: Complete payment within 3 taps on mobile app, web accessibility KWCAG AA
- Scalability: K8s auto-scaling, multi-tenancy structure
- Compatibility: iOS 14+, Android 8+, latest Chrome/Safari

## 5. Technical Considerations
- Architecture: Next.js SSR + Supabase (Postgres) + Python AI microservices
- Real-time Data: Supabase Realtime
- Integration: External reservation APIs (Google, Kakao), payment PG, push (Firebase)
- Data: User location, transaction logs, reservation calendar, security encryption (at rest & in transit)

## 6. Success Metrics & KPIs
- User: DAU/MAU 30%, slot click→payment conversion 15%+
- Business: Additional monthly sales per store 15%+, churn rate ↓5%
- Technical: API error rate <0.1%, notification delivery rate 95%+

## 7. Timeline & Milestones
- 0. Preliminary Research (2 weeks): Market, competition, legal review
- 1. MVP Design & Development (6 weeks)  
  • Core features 1~4, iOS/web beta  
- 2. Closed Beta (4 weeks)  
  • 50 stores in Seoul, 2,000 users  
- 3. Public Launch (3 months)  
  • Add Android, expand payment, AI recommendation v1  
- 4. Advancement (6 months)  
  • Multi-region, rewards, AI discount optimization v2

## 8. Risks & Countermeasures
- Lack of supply density → Premium store onboarding incentives
- No-show/refund disputes → Explicit terms + smart CS chatbot
- Brand damage → “Strategic discount” content, badge/limit application
- Technical scale → K8s auto-scaling, CDN cache

## 9. Behavioral Economics & Nudge Application
- Emphasize scarcity with limited quantity and countdown timer
- Social proof: “3 people purchasing near your location”

## 10. UX Flow Summary
1. Consumer app launch → Login (Kakao, Google social login) → Map loading → Slot card selection → Details → Reservation number provided → Store check-in (scan)  
2. Business owner web/app → Register discounted items and rates → Sales dashboard

## 11. Data Flow
Consumer location event → Supabase Realtime → Recommendation API call → Candidate slot ranking → Push/map exposure → Payment PG → Transaction log → Store POS integration