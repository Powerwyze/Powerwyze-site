-- Add ElevenLabs voice fields to agents table
-- These fields store ElevenLabs voice configuration

-- Add voice_name column (human-readable voice name)
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS voice_name TEXT;

-- Add voice_settings column (JSON object with voice parameters)
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{
  "stability": 0.55,
  "similarity_boost": 0.65,
  "style": 0.25,
  "use_speaker_boost": true
}'::jsonb;

-- Add comments
COMMENT ON COLUMN agents.voice_name IS 'Human-readable name of the ElevenLabs voice';
COMMENT ON COLUMN agents.voice_settings IS 'ElevenLabs voice settings (stability, similarity_boost, style, use_speaker_boost)';

-- Rename voice_id to voice (if it exists)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns
            WHERE table_name='agents' AND column_name='voice_id') THEN
    ALTER TABLE agents RENAME COLUMN voice_id TO voice;
  END IF;
END $$;

-- Update comment for voice column
COMMENT ON COLUMN agents.voice IS 'ElevenLabs voice ID';
