/**
 * @file social-copy-generator.ts
 * @layer Domain
 * @description Deterministic copywriting engine producing campaign social copy and video scripts
 *              tailored to launch phases (T-14, T-7, T-0, T+7) with platform character limits. Zero network I/O, zero classes.
 */

export type CampaignPhase = 'T_MINUS_14' | 'T_MINUS_7' | 'T_ZERO' | 'T_PLUS_7';
export type SocialPlatform = 'INSTAGRAM' | 'TWITTER_X' | 'TIKTOK' | 'NEWSLETTER';

export interface CampaignCopyInput {
  releaseTitle: string;
  artistName: string;
  genre: string;
  narrative: string;
  phase: CampaignPhase;
  platform: SocialPlatform;
  streamingLink?: string;
}

export interface CampaignCopyResult {
  headline: string;
  body: string;
  callToAction: string;
  hashtags: string[];
  fullFormattedText: string;
  characterCount: number;
  maxCharacters: number;
  isWithinLimits: boolean;
}

export const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  INSTAGRAM: 2200,
  TWITTER_X: 280,
  TIKTOK: 300,
  NEWSLETTER: 5000,
};

/**
 * Validates character length against target platform limits.
 */
export function validateCharacterLimit(text: string, platform: SocialPlatform) {
  const max = PLATFORM_LIMITS[platform];
  const count = text.length;
  return {
    valid: count <= max,
    characterCount: count,
    maxAllowed: max,
    remaining: max - count,
  };
}

/**
 * Pure generator crafting campaign copy based on release context and launch milestone.
 *
 * @param input - Release details, phase, and target platform
 * @returns Fully formatted copy with length metrics
 */
export function generateCampaignCopy(input: CampaignCopyInput): CampaignCopyResult {
  // Step 1: Resolve narrative angle by campaign phase
  let headline = '';
  let body = '';
  let callToAction = '';

  switch (input.phase) {
    case 'T_MINUS_14':
      headline = `✨ Próximamente: "${input.releaseTitle}" por ${input.artistName}`;
      body = `Estamos a dos semanas de compartir este viaje sonoro. ${input.narrative}`;
      callToAction = 'Haz Pre-Save en el link de la bio para ser el primero en escucharlo.';
      break;

    case 'T_MINUS_7':
      headline = `⏳ 7 días para el estreno de "${input.releaseTitle}"`;
      body = `Un adelanto íntimo de lo que viene en 7 días. Conéctate con las frecuencias de ${input.genre}.`;
      callToAction = 'Asegura tu pre-save y acompáñanos en la cuenta regresiva.';
      break;

    case 'T_ZERO':
      headline = `🔥 ¡YA DISPONIBLE! "${input.releaseTitle}" - ${input.artistName}`;
      body = `Hoy ve la luz este proyecto tras meses de creación independiente. Escúchalo ahora con tus mejores audífonos.`;
      callToAction = input.streamingLink
        ? `Disponible en todas las plataformas: ${input.streamingLink}`
        : 'Disponible en Spotify, Apple Music y todas las plataformas en el link de la bio.';
      break;

    case 'T_PLUS_7':
      headline = `🤍 1 semana con "${input.releaseTitle}" en el mundo`;
      body = `Gracias por cada escucha, cada mensaje y por abrazar esta música. Seguimos descubriendo los detalles de esta historia.`;
      callToAction = 'Cuéntanos en los comentarios cuál es tu línea favorita.';
      break;
  }

  // Step 2: Assemble genre-relevant hashtags
  const safeGenreTag = input.genre.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const safeArtistTag = input.artistName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const hashtags = [
    `#${safeArtistTag}`,
    `#${safeGenreTag}`,
    '#IndieMusic',
    '#NewRelease',
    '#MusicDiscovery',
  ];

  // Step 3: Format total text according to platform
  let fullFormattedText = '';
  if (input.platform === 'TWITTER_X') {
    fullFormattedText = `${headline}\n\n${callToAction}\n\n${hashtags.slice(0, 3).join(' ')}`;
  } else {
    fullFormattedText = `${headline}\n\n${body}\n\n${callToAction}\n\n${hashtags.join(' ')}`;
  }

  // Step 4: Validate character bounds
  const check = validateCharacterLimit(fullFormattedText, input.platform);

  return {
    headline,
    body,
    callToAction,
    hashtags,
    fullFormattedText,
    characterCount: check.characterCount,
    maxCharacters: check.maxAllowed,
    isWithinLimits: check.valid,
  };
}
