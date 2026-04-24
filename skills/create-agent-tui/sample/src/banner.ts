/**
 * ASCII banner generator for the agent TUI.
 * Generates block-letter ASCII art for project names.
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

// Simple 5-line block letter font
const LETTERS: Record<string, string[]> = {
  A: ['█████', '█   █', '█████', '█   █', '█   █'],
  B: ['████ ', '█   █', '████ ', '█   █', '████ '],
  C: ['█████', '█    ', '█    ', '█    ', '█████'],
  D: ['████ ', '█   █', '█   █', '█   █', '████ '],
  E: ['█████', '█    ', '████ ', '█    ', '█████'],
  F: ['█████', '█    ', '████ ', '█    ', '█    '],
  G: ['█████', '█    ', '█  ██', '█   █', '█████'],
  H: ['█   █', '█   █', '█████', '█   █', '█   █'],
  I: ['█████', '  █  ', '  █  ', '  █  ', '█████'],
  J: ['█████', '   █ ', '   █ ', '█  █ ', '████ '],
  K: ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
  L: ['█    ', '█    ', '█    ', '█    ', '█████'],
  M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  O: ['█████', '█   █', '█   █', '█   █', '█████'],
  P: ['█████', '█   █', '█████', '█    ', '█    '],
  Q: ['█████', '█   █', '█ █ █', '█  █ ', '████ '],
  R: ['█████', '█   █', '█████', '█  █ ', '█   █'],
  S: ['█████', '█    ', '█████', '    █', '█████'],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  U: ['█   █', '█   █', '█   █', '█   █', '█████'],
  V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  Z: ['█████', '   █ ', '  █  ', ' █   ', '█████'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '0': ['█████', '█   █', '█   █', '█   █', '█████'],
  '1': [' █   ', '██   ', ' █   ', ' █   ', '█████'],
  '2': ['█████', '    █', '█████', '█    ', '█████'],
  '3': ['█████', '    █', '█████', '    █', '█████'],
  '4': ['█   █', '█   █', '█████', '    █', '    █'],
  '5': ['█████', '█    ', '█████', '    █', '█████'],
  '6': ['█████', '█    ', '█████', '█   █', '█████'],
  '7': ['█████', '    █', '   █ ', '  █  ', '  █  '],
  '8': ['█████', '█   █', '█████', '█   █', '█████'],
  '9': ['█████', '█   █', '█████', '    █', '█████'],
};

/**
 * Generate ASCII art for a text string.
 */
export function generateAsciiArt(text: string, maxWidth = 60): string[] {
  const chars = text.toUpperCase().split('');
  const lines: string[][] = [[], [], [], [], []];
  
  let currentWidth = 0;
  
  for (const char of chars) {
    const letter = LETTERS[char] || LETTERS[' '];
    const letterWidth = letter[0].length + 1; // +1 for spacing
    
    if (currentWidth + letterWidth > maxWidth) {
      break; // Don't exceed max width
    }
    
    for (let i = 0; i < 5; i++) {
      lines[i].push(letter[i]);
    }
    currentWidth += letterWidth;
  }
  
  return lines.map(line => line.join(' '));
}

/**
 * Print a styled banner with ASCII art.
 */
export function printBanner(projectName: string, model: string, version = '1.0.0'): void {
  const art = generateAsciiArt(projectName);
  
  console.log('');
  for (const line of art) {
    console.log(`  ${MAGENTA}${BOLD}${line}${RESET}`);
  }
  console.log('');
  console.log(`  ${DIM}model${RESET}  ${CYAN}${model}${RESET}`);
  console.log(`  ${DIM}version${RESET}  ${version}`);
  console.log('');
}

/**
 * Print a simple text banner (fallback when ASCII art is disabled).
 */
export function printTextBanner(projectName: string, model: string, version = '1.0.0'): void {
  const width = Math.min(process.stdout.columns || 60, 60);
  const line = '─'.repeat(width);
  
  console.log(`\n${DIM}${line}${RESET}`);
  console.log(`  ${BOLD}${projectName}${RESET}  ${DIM}v${version}${RESET}`);
  console.log(`  ${DIM}model${RESET}  ${CYAN}${model}${RESET}`);
  console.log(`${DIM}${line}${RESET}\n`);
}

// Venice ASCII art logo
const VENICE_LOGO = `
  ██╗   ██╗███████╗███╗   ██╗██╗ ██████╗███████╗
  ██║   ██║██╔════╝████╗  ██║██║██╔════╝██╔════╝
  ██║   ██║█████╗  ██╔██╗ ██║██║██║     █████╗  
  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║██║██║     ██╔══╝  
   ╚████╔╝ ███████╗██║ ╚████║██║╚██████╗███████╗
    ╚═══╝  ╚══════╝╚═╝  ╚═══╝╚═╝ ╚═════╝╚══════╝`;

/**
 * Print the Venice logo banner.
 */
export function printVeniceBanner(model: string): void {
  console.log(`${CYAN}${BOLD}${VENICE_LOGO}${RESET}`);
  console.log(`\n  ${DIM}model${RESET}  ${MAGENTA}${model}${RESET}`);
  console.log(`  ${DIM}Privacy-first AI inference${RESET}\n`);
}
