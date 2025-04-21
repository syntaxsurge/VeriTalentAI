# Viskify

**Viskify** is a trust-layer for hiring that merges blockchain-signed credentials with AI-graded skill proofs.
Candidates create a **single verifiable profile for free**, recruiters instantly filter talent by proof instead of promises, and issuers sign credentials in minutes rather than weeks.

---

## ✨ Key Features

| Domain                     | Highlights                                                     |
| -------------------------- | -------------------------------------------------------------- |
| **Verifiable Credentials** | cheqd-issued VCs for diplomas, certificates & references       |
| **AI Skill-Pass**          | GPT-4o grades open-text quizzes → instant SkillPass VC         |
| **Talent Search**          | Recruiters query by skills, verified creds & scores            |
| **Recruiter Pipelines**    | Kanban workflow with custom stages                             |
| **Issuer Dashboard**       | Organisations review & sign credential requests                |
| **Freemium Pricing**       | Unlimited personal usage — pay only for advanced team features |
| **Activity Logs**          | Every critical action is auditable                             |
| **Stripe Billing**         | Subscription & metered verification charges                    |

---

## 🗺️ High-Level Workflow

1. **Account & Team Setup** – email sign-up, auto-team creation, optional invites.
2. **Profile & Credential Vault** – candidates upload credentials (default **Unverified**).
3. **Verification Request** – select issuer from directory → issuer notified.
4. **Issuer Review** – approve → VC signed on cheqd, reject → status updated.
5. **AI Skill-Check** – pass quiz ≥ threshold → SkillPass VC minted.
6. **Talent Discovery** – recruiters filter/search, add to pipelines, invite.

---

## 🏗️ Architecture

| Layer        | Tech / Responsibility                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| **Frontend** | Next.js 14 • React Server / Client Components • TailwindCSS + shadcn/ui • lucide-react |
| **Backend**  | Next.js Server Actions, Route Handlers                                                 |
| **Database** | PostgreSQL via **drizzle-orm**; typed schema generation                                |
| **Auth**     | Signed HttpOnly cookie sessions; bcrypt hashes                                         |
| **VC Layer** | cheqd Studio API for DID & VC issuance / verification                                  |
| **Payments** | Stripe SDK & Webhooks                                                                  |
| **CI / CD**  | (omitted – DevOps out-of-scope for this doc)                                           |

> **Stateless server actions** + **typed drizzle queries** keep business logic close to the data while preserving React’s streaming benefits.

## 🚀 Getting Started

# 1. Install deps

```bash
pnpm install
```

# 2. Copy & fill env vars

```bash
cp .env.example .env
```

# 3. Run DB migrations & seed data

```bash
pnpm db:push     # drizzle-kit push
pnpm db:seed     # seeds users, quizzes, stripe products
```

# 4. Dev server

```bash
pnpm dev
```

Navigate to http://localhost:3000 – sign up and explore for free.

⸻

🛠️ Engineering Notes

- Type Safety – End-to-end zod validation on every mutation, plus drizzle-orm type inference.
- UI Guidelines – All components use Tailwind, shadcn/ui, 2xl rounded corners, XL headings, soft shadows.
- Accessibility – Focus rings, semantic HTML tags, aria-hidden handled where necessary.
- Caching – revalidate directives keep the landing static while dynamic sections (pricing) are server rendered every hour.
- Security – VC issuance keys & Stripe secrets never leak to the client; server actions enforce role-based guards.

⸻

📜 License

MIT © 2025 Viskify
