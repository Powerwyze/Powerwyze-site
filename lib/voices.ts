export type Voice = {
  id: string
  name: string
  languages: string[]
  gender?: 'male' | 'female' | 'neutral'
}

// Tier 1: 20 voices, EN/ES only
export const TIER1_VOICES: Voice[] = [
  { id: 'en-us-male-1', name: 'James (US Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-us-male-2', name: 'David (US Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-us-male-3', name: 'Michael (US Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-us-male-4', name: 'Robert (US Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-us-male-5', name: 'William (US Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-us-female-1', name: 'Sarah (US Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'en-us-female-2', name: 'Emma (US Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'en-us-female-3', name: 'Olivia (US Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'en-us-female-4', name: 'Sophia (US Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'en-us-female-5', name: 'Isabella (US Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'en-gb-male-1', name: 'Oliver (UK Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-gb-male-2', name: 'George (UK Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-gb-male-3', name: 'Harry (UK Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'en-gb-female-1', name: 'Amelia (UK Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'en-gb-female-2', name: 'Charlotte (UK Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'es-es-male-1', name: 'Carlos (Spanish Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'es-es-male-2', name: 'Diego (Spanish Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'es-es-female-1', name: 'Maria (Spanish Female)', languages: ['en', 'es'], gender: 'female' },
  { id: 'es-mx-male-1', name: 'Miguel (Mexican Male)', languages: ['en', 'es'], gender: 'male' },
  { id: 'es-mx-female-1', name: 'Ana (Mexican Female)', languages: ['en', 'es'], gender: 'female' },
]

// Tier 2: 40 voices, multilingual
export const TIER2_VOICES: Voice[] = [
  // English
  { id: 't2-en-us-male-1', name: 'Alex (US Male)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'male' },
  { id: 't2-en-us-male-2', name: 'Brian (US Male)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'male' },
  { id: 't2-en-us-male-3', name: 'Chris (US Male)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'male' },
  { id: 't2-en-us-male-4', name: 'Daniel (US Male)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'male' },
  { id: 't2-en-us-female-1', name: 'Emily (US Female)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'female' },
  { id: 't2-en-us-female-2', name: 'Grace (US Female)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'female' },
  { id: 't2-en-us-female-3', name: 'Hannah (US Female)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'female' },
  { id: 't2-en-us-female-4', name: 'Jessica (US Female)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'female' },
  { id: 't2-en-gb-male-1', name: 'Benjamin (UK Male)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'male' },
  { id: 't2-en-gb-male-2', name: 'Edward (UK Male)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'male' },
  { id: 't2-en-gb-female-1', name: 'Eleanor (UK Female)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'female' },
  { id: 't2-en-gb-female-2', name: 'Lucy (UK Female)', languages: ['en', 'es', 'fr', 'de', 'it'], gender: 'female' },
  { id: 't2-en-au-male-1', name: 'Jack (Australian Male)', languages: ['en', 'es', 'fr', 'de'], gender: 'male' },
  { id: 't2-en-au-female-1', name: 'Sophie (Australian Female)', languages: ['en', 'es', 'fr', 'de'], gender: 'female' },

  // Spanish
  { id: 't2-es-es-male-1', name: 'Antonio (Spanish Male)', languages: ['es', 'en', 'fr', 'pt'], gender: 'male' },
  { id: 't2-es-es-male-2', name: 'Fernando (Spanish Male)', languages: ['es', 'en', 'fr', 'pt'], gender: 'male' },
  { id: 't2-es-es-female-1', name: 'Carmen (Spanish Female)', languages: ['es', 'en', 'fr', 'pt'], gender: 'female' },
  { id: 't2-es-es-female-2', name: 'Isabel (Spanish Female)', languages: ['es', 'en', 'fr', 'pt'], gender: 'female' },
  { id: 't2-es-mx-male-1', name: 'Alejandro (Mexican Male)', languages: ['es', 'en'], gender: 'male' },
  { id: 't2-es-mx-female-1', name: 'Camila (Mexican Female)', languages: ['es', 'en'], gender: 'female' },
  { id: 't2-es-ar-male-1', name: 'Mateo (Argentine Male)', languages: ['es', 'en'], gender: 'male' },
  { id: 't2-es-ar-female-1', name: 'Valentina (Argentine Female)', languages: ['es', 'en'], gender: 'female' },

  // French
  { id: 't2-fr-fr-male-1', name: 'Pierre (French Male)', languages: ['fr', 'en', 'es', 'de'], gender: 'male' },
  { id: 't2-fr-fr-male-2', name: 'Louis (French Male)', languages: ['fr', 'en', 'es', 'de'], gender: 'male' },
  { id: 't2-fr-fr-female-1', name: 'Sophie (French Female)', languages: ['fr', 'en', 'es', 'de'], gender: 'female' },
  { id: 't2-fr-fr-female-2', name: 'Camille (French Female)', languages: ['fr', 'en', 'es', 'de'], gender: 'female' },

  // German
  { id: 't2-de-de-male-1', name: 'Hans (German Male)', languages: ['de', 'en', 'fr'], gender: 'male' },
  { id: 't2-de-de-male-2', name: 'Klaus (German Male)', languages: ['de', 'en', 'fr'], gender: 'male' },
  { id: 't2-de-de-female-1', name: 'Anna (German Female)', languages: ['de', 'en', 'fr'], gender: 'female' },
  { id: 't2-de-de-female-2', name: 'Greta (German Female)', languages: ['de', 'en', 'fr'], gender: 'female' },

  // Italian
  { id: 't2-it-it-male-1', name: 'Marco (Italian Male)', languages: ['it', 'en', 'fr', 'es'], gender: 'male' },
  { id: 't2-it-it-male-2', name: 'Giovanni (Italian Male)', languages: ['it', 'en', 'fr', 'es'], gender: 'male' },
  { id: 't2-it-it-female-1', name: 'Francesca (Italian Female)', languages: ['it', 'en', 'fr', 'es'], gender: 'female' },
  { id: 't2-it-it-female-2', name: 'Giulia (Italian Female)', languages: ['it', 'en', 'fr', 'es'], gender: 'female' },

  // Portuguese
  { id: 't2-pt-br-male-1', name: 'João (Brazilian Male)', languages: ['pt', 'es', 'en'], gender: 'male' },
  { id: 't2-pt-br-female-1', name: 'Julia (Brazilian Female)', languages: ['pt', 'es', 'en'], gender: 'female' },

  // Japanese
  { id: 't2-ja-jp-male-1', name: 'Hiroshi (Japanese Male)', languages: ['ja', 'en'], gender: 'male' },
  { id: 't2-ja-jp-female-1', name: 'Yuki (Japanese Female)', languages: ['ja', 'en'], gender: 'female' },

  // Mandarin
  { id: 't2-zh-cn-male-1', name: 'Wei (Chinese Male)', languages: ['zh', 'en'], gender: 'male' },
  { id: 't2-zh-cn-female-1', name: 'Li (Chinese Female)', languages: ['zh', 'en'], gender: 'female' },
]

export const getVoicesForTier = (tier: 1 | 2 | 3): Voice[] => {
  if (tier === 1) return TIER1_VOICES
  if (tier === 2 || tier === 3) return TIER2_VOICES
  return []
}

export const getLanguageLabel = (code: string): string => {
  const labels: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    zh: 'Mandarin',
  }
  return labels[code] || code.toUpperCase()
}
