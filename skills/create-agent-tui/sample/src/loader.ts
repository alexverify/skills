/**
 * Loader animations for the agent TUI.
 * Three styles: spinner (braille dots), gradient (scrolling shimmer), minimal (trailing dots).
 */

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const BLUE = '\x1b[34m';

// Braille spinner frames
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Gradient colors for shimmer effect
const GRADIENT_COLORS = [
  '\x1b[38;5;39m',  // Cyan
  '\x1b[38;5;45m',  // Light cyan
  '\x1b[38;5;51m',  // Sky blue
  '\x1b[38;5;87m',  // Pale cyan
  '\x1b[38;5;123m', // Light blue
  '\x1b[38;5;159m', // Very light blue
  '\x1b[38;5;195m', // Almost white
  '\x1b[38;5;159m',
  '\x1b[38;5;123m',
  '\x1b[38;5;87m',
  '\x1b[38;5;51m',
  '\x1b[38;5;45m',
];

export type LoaderStyle = 'spinner' | 'gradient' | 'minimal';

export interface LoaderConfig {
  style: LoaderStyle;
  text: string;
}

export class Loader {
  private config: LoaderConfig;
  private frame = 0;
  private interval: NodeJS.Timeout | null = null;
  private running = false;

  constructor(config: LoaderConfig = { style: 'spinner', text: 'Thinking' }) {
    this.config = config;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.frame = 0;

    const render = () => {
      if (!this.running) return;
      process.stdout.write('\r\x1b[K'); // Clear line
      process.stdout.write(this.renderFrame());
    };

    render();
    const fps = this.config.style === 'gradient' ? 50 : 80;
    this.interval = setInterval(render, fps);
  }

  stop(): void {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r\x1b[K'); // Clear line
  }

  private renderFrame(): string {
    this.frame++;
    switch (this.config.style) {
      case 'spinner':
        return this.renderSpinner();
      case 'gradient':
        return this.renderGradient();
      case 'minimal':
        return this.renderMinimal();
      default:
        return this.renderSpinner();
    }
  }

  private renderSpinner(): string {
    const spinnerChar = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length];
    return `${CYAN}${spinnerChar}${RESET} ${DIM}${this.config.text}${RESET}`;
  }

  private renderGradient(): string {
    const text = this.config.text;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const colorIndex = (this.frame + i) % GRADIENT_COLORS.length;
      result += GRADIENT_COLORS[colorIndex] + text[i];
    }
    return result + RESET;
  }

  private renderMinimal(): string {
    const dots = '.'.repeat((this.frame % 4));
    return `${DIM}${this.config.text}${dots.padEnd(3)}${RESET}`;
  }
}

/**
 * Create and start a loader with the given config.
 * Returns a stop function.
 */
export function createLoader(config?: Partial<LoaderConfig>): { stop: () => void } {
  const loader = new Loader({
    style: config?.style || 'spinner',
    text: config?.text || 'Thinking',
  });
  loader.start();
  return { stop: () => loader.stop() };
}
