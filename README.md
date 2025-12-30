# PowerWyze

AI Voice Agent Platform for Museums & Events

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- n8n instance (optional)

### Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Fill in your environment variables in `.env.local`

### Installation

```bash
npm install
```

### Database Setup

1. Create a new Supabase project
2. Run the migration:

```bash
# Copy the SQL from supabase/migrations/001_initial_schema.sql
# and run it in your Supabase SQL editor
```

3. Seed the pricing tiers:

```bash
npm run seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Multi-tier Voice Agents**: Tier 1 (Vapi), Tier 2 (OpenAI Realtime), Tier 3 (OpenAI + Functions)
- **Volume Discounts**: 10% per 3 agents, up to 30% max
- **QR Code Generation**: Square and circle shapes
- **Public Visitor Pages**: Shareable voice agent experiences
- **Billing Integration**: Stripe subscriptions
- **n8n Webhooks**: Background job processing

## Project Structure

```
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── billing/        # Billing & subscription
│   ├── exhibits/       # Agent management
│   ├── onboarding/     # First-time setup
│   └── visitor/        # Public visitor pages
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── header.tsx     # App header
├── lib/               # Utilities
│   ├── supabase.ts   # Supabase client
│   ├── stripe.ts     # Stripe utilities
│   ├── n8n.ts        # n8n webhook helpers
│   ├── qr.ts         # QR code generation
│   └── pricing.ts    # Pricing & discount logic
├── scripts/          # Scripts
│   └── seed.ts      # Database seeding
├── supabase/        # Supabase migrations
└── types/           # TypeScript types
```

## Pricing

- **Tier 1**: $20/month ($15 annual)
- **Tier 2**: $30/month ($25 annual)
- **Tier 3**: $50/month ($40 annual)

**Volume Discounts** (org-level):
- 3-5 agents: 10% off
- 6-8 agents: 20% off
- 9+ agents: 30% off (max)

## Smoke Tests

To verify the discount logic:

1. Create a test organization
2. Create a venue
3. Create 7 published agents
4. Expected discount: 20% (6 agents = 2 tiers × 10%)
5. Verify pricing in `/billing`

## License

Proprietary
