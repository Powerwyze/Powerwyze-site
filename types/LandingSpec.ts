// Landing page specification generated from owner descriptions via AI
export type LandingSpec = {
  version: 1;
  title: string; // e.g., "Champion Banyan Tree"
  subtitle?: string; // short line
  theme?: {
    primary?: string; // hex, default "#111827"
    background?: string; // hex, default "#FFFFFF"
    text?: string; // hex, default "#111827"
  };
  hero?: {
    imageUrl?: string; // optional
    overlay?: boolean; // darken image a bit
  };
  blocks: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'bulletList'; items: string[] }
    | { type: 'cta'; label: string; href?: string } // optional external CTA
  >;
  buttons?: {
    talkLabel?: string; // default "Talk with {AgentName}"
    scanAnotherLabel?: string; // default "Scan another QR"
  };
  languageHints?: string[]; // e.g., ["en","es"]
};
