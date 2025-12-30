import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!')
  console.error('Please ensure .env.local has:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Seeding database...')

  // Seed pricing plans
  console.log('Adding pricing tiers...')
  const pricingData: Database['public']['Tables']['pricing_plans']['Insert'][] = [
    {
      tier: 1,
      monthly_cents: 200000, // $2000
      annual_cents: 150000,  // $1500
    },
    {
      tier: 2,
      monthly_cents: 300000, // $3000
      annual_cents: 250000,  // $2500
    },
    {
      tier: 3,
      monthly_cents: 500000, // $5000
      annual_cents: 400000,  // $4000
    },
  ]

  const { error: pricingError } = await supabase
    .from('pricing_plans')
    .upsert(pricingData as any, { onConflict: 'tier' })

  if (pricingError) {
    console.error('❌ Error seeding pricing plans:', pricingError)
  } else {
    console.log('✅ Pricing tiers seeded successfully')
  }

  console.log('✨ Seeding complete!')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
