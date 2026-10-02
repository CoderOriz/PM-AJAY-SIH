# ASSUMPTIONS.md

Seeded from `SPEC.md` section 20 (production-plan assumptions). Record new assumptions here with an ID, decision, reason, and who should confirm. The demo build follows the plan's intent; production-specific values are defaults until the pilot stack exists.

| ID | Assumption | Default | Confirm with |
|---|---|---|---|
| A-1 | Education band mapping in 6.2 | as table | programme lead |
| A-2 | Interest/occupation DTMF menus use top 4 pilot sectors | from `content/nlu/*_menu.yaml` | nodal officer |
| A-3 | Call 2 call-back at next day 09:00 local | 09:00 | programme lead |
| A-4 | Calling hours 08:00-20:00 IST for outbound calls | as stated | partners |
| A-12 | ASR circuit cool-down 60 s | 60 s | tech lead |
| A-13 | Human call-back due within 4 working hours | 4 h | counsellor lead |
| A-14 | Missed-call call-back within 60 s | 60 s | vendor capabilities |
| A-15 | Centre search radius 60 km | 60 km | nodal officer |
| A-16 | Weight adjustment +/-0.10 absolute then renormalise | as stated | ML lead |
| A-17 | Bias audit fail threshold: entropy ratio < 0.80 | 0.80 | ML lead |
| A-18 | Voice summary <= 90 s | 90 s | usability test |
| A-19 | PWA initial JS <= 150 KB gzipped | 150 KB | frontend lead |
| A-20 | SMS delivered-rate alert < 90% over 30 min | 90% | ops |
| A-21 | `MIN_CELL_SIZE` = 10 (pilot) | 10 | DPO |
| A-22 | RAG thresholds 90/60 | as stated | ministry |
| A-23 | Retry ladder `0,120,900,7200` s | as stated | ops |
| A-24 | Transcript retention 30 days in events | 30 d | DPIA reviewer |
| A-25 | Gender is not collected; bias audit uses persona metadata only. Production fairness monitoring by gender would require a policy decision to collect it | not collected | DPO + ministry |
| A-26 | Hazardous traditional occupations excluded from default pathways | excluded | community partners |
| A-27 | Skill-gap thresholds: major if education delta >= 3 grades | 3 | programme lead |
