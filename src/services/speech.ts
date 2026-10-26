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
  private restartTimeout: any = null;
  private lastCommandTime: number = 0;
  private isProcessingCommand: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        // Setting continuous to false is essential for mobile stability (avoids infinite audio device flip-flops)
        this.recognition.continuous = false;
        // interimResults enables immediate trigger as soon as user says "ponto" or "volta"
        this.recognition.interimResults = true;
        this.recognition.lang = 'pt-BR';
        this.recognition.maxAlternatives = 3;

        this.recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
          }
          const text = transcript.trim().toLowerCase();
          this.parseCommand(text);
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.stop();
            if (this.options?.onError) {
              this.options.onError('Permissão de microfone negada. Permita o microfone nas configurações.');
            }
          }
        };

        this.recognition.onend = () => {
          // Graceful restart with delay to prevent mobile audio glitching
          if (this.shouldRestart && this.isListening) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
              if (this.shouldRestart && this.isListening) {
                try {
                  this.recognition.start();
                } catch (e) {
                  // Ignore if already starting
                }
              }
            }, 800);
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
    this.isListening = true;
    clearTimeout(this.restartTimeout);

    try {
      this.recognition.start();
    } catch {
      // Already running
    }

    if (this.options?.onStatusChange) {
      this.options.onStatusChange(true);
    }
  }

  public stop() {
    this.shouldRestart = false;
    this.isListening = false;
    clearTimeout(this.restartTimeout);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

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
    if (!this.options || this.isProcessingCommand) return;

    const now = Date.now();
    // 1-second debounce between commands
    if (now - this.lastCommandTime < 1000) return;

    // Stitch increment keywords ("ponto", "mais um", "outro", "conta", "próximo")
    if (
      text.includes('ponto') ||
      text.includes('mais um') ||
      text.includes('outro') ||
      text.includes('conta') ||
      text.includes('próximo')
    ) {
      this.lastCommandTime = now;
      this.isProcessingCommand = true;
      this.options.onCommand('stitch_inc', text);
      setTimeout(() => {
        this.isProcessingCommand = false;
      }, 800);
      return;
    }

    // Stitch decrement keywords ("menos", "desmancha", "volta um", "tira")
    if (
      text.includes('menos') ||
      text.includes('desmancha') ||
      text.includes('desmanchar') ||
      text.includes('volta um') ||
      text.includes('tira')
    ) {
      this.lastCommandTime = now;
      this.isProcessingCommand = true;
      this.options.onCommand('stitch_dec', text);
      setTimeout(() => {
        this.isProcessingCommand = false;
      }, 800);
      return;
    }

    // Round increment keywords ("volta", "carreira", "sobe", "fechei")
    if (
      text.includes('volta') ||
      text.includes('carreira') ||
      text.includes('sobe') ||
      text.includes('fechei')
    ) {
      this.lastCommandTime = now;
      this.isProcessingCommand = true;
      this.options.onCommand('round_inc', text);
      setTimeout(() => {
        this.isProcessingCommand = false;
      }, 800);
      return;
    }
  }
}

export const speechService = new HandsFreeSpeechService();
