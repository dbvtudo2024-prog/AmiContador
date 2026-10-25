// Hands-Free Speech Recognition Service for crocheters
type SpeechCommand = 'stitch_inc' | 'stitch_dec' | 'round_inc';

interface SpeechRecognitionOptions {
  onCommand: (command: SpeechCommand, transcript: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (isListening: boolean) => void;
}

export class HandsFreeSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: SpeechRecognitionOptions | null = null;
  private shouldRestart: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'pt-BR';

        this.recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript.trim().toLowerCase();
          this.parseCommand(text);
        };

        this.recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && this.options?.onError) {
            this.options.onError(event.error);
          }
        };

        this.recognition.onend = () => {
          if (this.shouldRestart && this.isListening) {
            try {
              this.recognition.start();
            } catch {}
          } else {
            this.isListening = false;
            if (this.options?.onStatusChange) {
              this.options.onStatusChange(false);
            }
          }
        };
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(options: SpeechRecognitionOptions) {
    if (!this.recognition) return;
    this.options = options;
    this.shouldRestart = true;
    try {
      this.recognition.start();
      this.isListening = true;
      if (this.options.onStatusChange) {
        this.options.onStatusChange(true);
      }
    } catch {
      // Already running
    }
  }

  public stop() {
    if (!this.recognition) return;
    this.shouldRestart = false;
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch {}
    if (this.options?.onStatusChange) {
      this.options.onStatusChange(false);
    }
  }

  public toggle(options: SpeechRecognitionOptions): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      this.start(options);
      return true;
    }
  }

  private parseCommand(text: string) {
    if (!this.options) return;

    // Stitch increment keywords
    if (
      text.includes('ponto') ||
      text.includes('mais um') ||
      text.includes('outro') ||
      text.includes('conta') ||
      text.includes('próximo')
    ) {
      this.options.onCommand('stitch_inc', text);
      return;
    }

    // Stitch decrement keywords
    if (
      text.includes('menos') ||
      text.includes('desmancha') ||
      text.includes('desmanchar') ||
      text.includes('volta um') ||
      text.includes('tira')
    ) {
      this.options.onCommand('stitch_dec', text);
      return;
    }

    // Round increment keywords
    if (
      text.includes('volta') ||
      text.includes('carreira') ||
      text.includes('próxima carreira') ||
      text.includes('sobe') ||
      text.includes('fechei')
    ) {
      this.options.onCommand('round_inc', text);
      return;
    }
  }
}

export const speechService = new HandsFreeSpeechService();
