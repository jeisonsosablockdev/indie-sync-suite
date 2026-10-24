/**
 * @file typography-compositor.ts
 * @layer Domain
 * @description Pure algorithmic typography compositor calculating layout geometry, bounding boxes,
 *              margins, and hierarchy for 3000×3000 px cover art. Zero DOM/Canvas dependency, zero classes.
 */

export type CompositionStyle = 'MINIMALIST' | 'EDITORIAL' | 'BOLD_IMPACT' | 'VINTAGE_VINYL';

export interface TypographyLayoutInput {
  titleText: string;
  artistText: string;
  canvasWidth?: number;
  canvasHeight?: number;
  style: CompositionStyle;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TextPlacementSpec {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  x: number;
  y: number;
  alignment: 'left' | 'center' | 'right';
  letterSpacing: number;
}

export interface TypographyLayoutSpec {
  canvasWidth: number;
  canvasHeight: number;
  style: CompositionStyle;
  titlePlacement: TextPlacementSpec;
  artistPlacement: TextPlacementSpec;
}

/**
 * Pure layout algorithm determining typography coordinates and metrics.
 *
 * @param input - Typography input specifications
 * @returns Fully computed placement coordinates
 */
export function computeTypographyLayout(input: TypographyLayoutInput): TypographyLayoutSpec {
  // Step 1: Default to standard 3000x3000px square cover canvas
  const canvasWidth = input.canvasWidth ?? 3000;
  const canvasHeight = input.canvasHeight ?? 3000;
  const primaryColor = input.primaryColor ?? '#FFFFFF';
  const secondaryColor = input.secondaryColor ?? '#D4D4D8';

  // Step 2: Compute style-specific layout geometry
  switch (input.style) {
    case 'EDITORIAL':
      return {
        canvasWidth,
        canvasHeight,
        style: input.style,
        titlePlacement: {
          text: input.titleText.toUpperCase(),
          fontFamily: 'Playfair Display, serif',
          fontSize: 160,
          fontWeight: 'bold',
          color: primaryColor,
          x: canvasWidth / 2,
          y: canvasHeight * 0.78,
          alignment: 'center',
          letterSpacing: 4,
        },
        artistPlacement: {
          text: input.artistText.toUpperCase(),
          fontFamily: 'Inter, sans-serif',
          fontSize: 80,
          fontWeight: 'normal',
          color: secondaryColor,
          x: canvasWidth / 2,
          y: canvasHeight * 0.86,
          alignment: 'center',
          letterSpacing: 8,
        },
      };

    case 'BOLD_IMPACT':
      return {
        canvasWidth,
        canvasHeight,
        style: input.style,
        titlePlacement: {
          text: input.titleText.toUpperCase(),
          fontFamily: 'Impact, sans-serif',
          fontSize: 240,
          fontWeight: '900',
          color: primaryColor,
          x: canvasWidth * 0.08,
          y: canvasHeight * 0.25,
          alignment: 'left',
          letterSpacing: 2,
        },
        artistPlacement: {
          text: input.artistText.toUpperCase(),
          fontFamily: 'Inter, sans-serif',
          fontSize: 100,
          fontWeight: '700',
          color: secondaryColor,
          x: canvasWidth * 0.08,
          y: canvasHeight * 0.33,
          alignment: 'left',
          letterSpacing: 6,
        },
      };

    case 'VINTAGE_VINYL':
      return {
        canvasWidth,
        canvasHeight,
        style: input.style,
        titlePlacement: {
          text: input.titleText,
          fontFamily: 'Courier Prime, monospace',
          fontSize: 140,
          fontWeight: 'bold',
          color: primaryColor,
          x: canvasWidth / 2,
          y: canvasHeight * 0.15,
          alignment: 'center',
          letterSpacing: 3,
        },
        artistPlacement: {
          text: input.artistText,
          fontFamily: 'Courier Prime, monospace',
          fontSize: 90,
          fontWeight: 'normal',
          color: secondaryColor,
          x: canvasWidth / 2,
          y: canvasHeight * 0.90,
          alignment: 'center',
          letterSpacing: 4,
        },
      };

    case 'MINIMALIST':
    default:
      return {
        canvasWidth,
        canvasHeight,
        style: 'MINIMALIST',
        titlePlacement: {
          text: input.titleText,
          fontFamily: 'Inter, sans-serif',
          fontSize: 110,
          fontWeight: '600',
          color: primaryColor,
          x: canvasWidth * 0.08,
          y: canvasHeight * 0.88,
          alignment: 'left',
          letterSpacing: 1.5,
        },
        artistPlacement: {
          text: input.artistText,
          fontFamily: 'Inter, sans-serif',
          fontSize: 70,
          fontWeight: '400',
          color: secondaryColor,
          x: canvasWidth * 0.08,
          y: canvasHeight * 0.93,
          alignment: 'left',
          letterSpacing: 2,
        },
      };
  }
}
