import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const InputSchema = z.object({
  ownerPrompt: z.string().min(10),
  agentName: z.string().min(1).max(80),
  defaults: z
    .object({
      title: z.string().optional(),
      primary: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ownerPrompt, agentName, defaults } = InputSchema.parse(body)

    const system = `You convert natural descriptions into a minimal LandingSpec JSON for a museum AI exhibit.

Output ONLY valid JSON matching this EXACT structure:

{
  "version": 1,
  "title": "Agent Name",
  "subtitle": "optional short subtitle",
  "theme": {
    "primary": "#111827",
    "background": "#FFFFFF",
    "text": "#111827"
  },
  "blocks": []
}

Rules:
- Use ONLY hex colors (#RRGGBB format)
- Keep it EXTREMELY minimal - just title and optional subtitle
- blocks array should be EMPTY - no paragraphs, no bullets, no CTAs
- Mobile-first, high-contrast, bold colors for Art Deco aesthetic
- No extra fields beyond the schema shown
- Choose rich, luxurious colors that work well with Art Deco design (gold, navy, emerald, burgundy, teal)`

    const user = [
      `Agent Name: ${agentName}`,
      defaults?.title ? `Default Title: ${defaults.title}` : '',
      defaults?.primary ? `Default Primary: ${defaults.primary}` : '',
      defaults?.background ? `Default Background: ${defaults.background}` : '',
      defaults?.text ? `Default Text: ${defaults.text}` : '',
      'Owner Description:',
      ownerPrompt,
    ]
      .filter(Boolean)
      .join('\n')

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    // Extract and harden
    const raw = response.choices[0]?.message?.content ?? '{}'
    let spec: any
    try {
      spec = JSON.parse(raw)
    } catch {
      spec = {}
    }
    // Clamp to minimal safe defaults
    spec.version ??= 1
    spec.title ??= agentName
    spec.theme ??= {}
    spec.theme.primary = safeHex(spec.theme?.primary, '#111827')
    spec.theme.background = safeHex(spec.theme?.background, '#FFFFFF')
    spec.theme.text = safeHex(spec.theme?.text, '#111827')
    if (!Array.isArray(spec.blocks))
      spec.blocks = [{ type: 'paragraph', text: `Welcome to ${agentName}.` }]

    // Generate background image with DALL-E 3
    console.log('Generating background image with DALL-E...')
    try {
      // Create a prompt for the background image based on the agent and description
      const imagePrompt = `Art Deco style illustration for ${agentName}. ${ownerPrompt}. Bold geometric forms, rich colors, symmetrical patterns, streamlined shapes, luxurious aesthetic. NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY. NO people, NO characters, NO figures - only Art Deco geometric patterns, shapes, and colors. Style: 1920s-1930s Art Deco with bold colors, metallic tones, stepped forms. Use colorful backgrounds (avoid white, use bold colors like gold, navy, emerald, burgundy, teal). IMPORTANT: Absolutely no text or words anywhere in the image.`

      const imageResponse = await client.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1792x1024', // Wide format perfect for hero banners
        quality: 'standard',
      })

      const imageUrl = imageResponse.data[0]?.url

      if (imageUrl) {
        spec.hero = {
          imageUrl: imageUrl,
          overlay: true, // Add overlay to ensure text readability
        }
        console.log('Generated image URL:', imageUrl)
      }
    } catch (imageError: any) {
      console.error('Error generating image:', imageError)
      // Continue without image if generation fails
    }

    return NextResponse.json({ spec }, { status: 200 })
  } catch (error: any) {
    console.error('Error generating landing spec:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate landing spec' },
      { status: 500 }
    )
  }
}

function safeHex(x?: string, fallback = '#111827') {
  return /^#[0-9A-Fa-f]{6}$/.test(x ?? '') ? x! : fallback
}
