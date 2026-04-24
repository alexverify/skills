/**
 * Terminal background detection using OSC 11 escape sequence.
 * Detects the terminal's background color and returns an appropriate
 * input box background color that adapts to light/dark themes.
 */

import { stdin, stdout } from 'process';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Query the terminal for its background color using OSC 11.
 * Returns null if detection fails or times out.
 */
export async function queryTerminalBg(timeoutMs = 100): Promise<RGBColor | null> {
  return new Promise((resolve) => {
    // Set timeout to avoid blocking if terminal doesn't respond
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    let response = '';

    const onData = (data: Buffer) => {
      response += data.toString();
      // Look for the OSC 11 response: \x1b]11;rgb:RRRR/GGGG/BBBB\x07 or \x1b\\
      const match = response.match(/\x1b\]11;rgb:([0-9a-f]+)\/([0-9a-f]+)\/([0-9a-f]+)/i);
      if (match) {
        cleanup();
        // Convert 16-bit hex values to 8-bit
        resolve({
          r: parseInt(match[1].slice(0, 2), 16),
          g: parseInt(match[2].slice(0, 2), 16),
          b: parseInt(match[3].slice(0, 2), 16),
        });
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      stdin.removeListener('data', onData);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
    };

    // Only attempt if we're in a TTY
    if (!stdin.isTTY) {
      resolve(null);
      return;
    }

    try {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on('data', onData);
      // Send OSC 11 query
      stdout.write('\x1b]11;?\x07');
    } catch {
      resolve(null);
    }
  });
}

/**
 * Calculate luminance of a color (0-1 scale).
 */
function luminance(color: RGBColor): number {
  const { r, g, b } = color;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Blend two colors with a given alpha.
 */
function blend(fg: RGBColor, bg: RGBColor, alpha: number): RGBColor {
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  };
}

/**
 * Convert RGB to ANSI 256-color code.
 */
function rgbToAnsi256(color: RGBColor): number {
  const { r, g, b } = color;
  // Use grayscale ramp for near-gray colors
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  // Otherwise use 6x6x6 color cube
  return 16 +
    36 * Math.round(r / 255 * 5) +
    6 * Math.round(g / 255 * 5) +
    Math.round(b / 255 * 5);
}

/**
 * Detect terminal background and return an appropriate input box background.
 * Returns an ANSI escape sequence for the background color.
 */
export async function detectBg(): Promise<string> {
  const bg = await queryTerminalBg();
  
  if (!bg) {
    // Fallback: assume dark terminal, use subtle gray
    return '\x1b[48;5;236m'; // Dark gray
  }

  const lum = luminance(bg);
  
  // For dark terminals: lighten slightly
  // For light terminals: darken slightly
  const overlay = lum < 0.5
    ? { r: 255, g: 255, b: 255 } // White overlay for dark bg
    : { r: 0, g: 0, b: 0 };     // Black overlay for light bg
  
  const blended = blend(overlay, bg, 0.08);
  const ansiCode = rgbToAnsi256(blended);
  
  return `\x1b[48;5;${ansiCode}m`;
}

/**
 * Get a default input background for when detection isn't available.
 */
export function getDefaultInputBg(isDark = true): string {
  return isDark ? '\x1b[48;5;236m' : '\x1b[48;5;254m';
}
