/**
 * @file platform-prompt-formatter.ts
 * @layer Domain
 * @description Pure functional formatter adapting master prompts into platform-specific syntax
 *              (Midjourney v6, Flux/SD, Runway/Kling, Raw Text). Zero network I/O, zero classes.
 */

import { AspectRatio } from './creative-schemas';
import { FormattedPromptOutput, PlatformPreset } from './prompt-schemas';

function getMidjourneyAspectFlag(ratio: AspectRatio): string {
  switch (ratio) {
    case 'PORTRAIT_9_16':
      return '--ar 9:16';
    case 'LANDSCAPE_16_9':
      return '--ar 16:9';
    case 'SQUARE_1_1':
    case 'NA':
    default:
      return '--ar 1:1';
  }
}

/**
 * Formats a canonical prompt string for a specific platform's native syntax.
 *
 * @param promptText - Canonical prompt string
 * @param preset - Target platform engine
 * @param aspectRatio - Geometric target ratio
 * @param negativePrompt - Optional negative exclusions
 * @returns Fully formatted prompt output with platform flags
 */
export function formatPromptForPlatform(
  promptText: string,
  preset: PlatformPreset,
  aspectRatio: AspectRatio = 'SQUARE_1_1',
  negativePrompt?: string | null
): FormattedPromptOutput {
  // Step 1: Resolve ratio flag per platform
  const arFlag = getMidjourneyAspectFlag(aspectRatio);

  // Step 2: Apply platform-specific syntactic decorations
  let compiledText = promptText.trim();

  switch (preset) {
    case 'MIDJOURNEY_V6': {
      const parts = [compiledText, arFlag, '--v 6.0 --style raw'];
      if (negativePrompt && negativePrompt.trim().length > 0) {
        parts.push(`--no ${negativePrompt.trim()}`);
      }
      compiledText = parts.join(' ');
      break;
    }

    case 'FLUX_SD': {
      // Flux handles negative prompts via separate conditioning or standard comma formatting
      if (negativePrompt && negativePrompt.trim().length > 0) {
        compiledText = `${compiledText} | Negative: ${negativePrompt.trim()}`;
      }
      break;
    }

    case 'RUNWAY_KLING': {
      // Runway/Kling motion directive prepend
      compiledText = `Cinematic slow motion, high definition video capture: ${compiledText}`;
      break;
    }

    case 'RAW_TEXT':
    default:
      // Preserved as-is
      break;
  }

  // Step 3: Compute rough token estimation (~4 chars per token)
  const estimatedTokens = Math.ceil(compiledText.length / 4);

  return {
    platformPreset: preset,
    compiledText,
    aspectRatioFlag: arFlag,
    negativePrompt: negativePrompt ?? undefined,
    estimatedTokens,
  };
}
