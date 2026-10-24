import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ColorReminder, ProjectPart } from '../types/amigurumi';

// Configure pdfjs worker using local bundled Vite worker to avoid adblocker/Brave blocks
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ExtractedPattern {
  rawText: string;
  detectedTitle: string;
  detectedHook: string;
  detectedYarn: string;
  detectedParts: ProjectPart[];
  warnings: string[];
}

// Clean filename to human readable title (e.g. "polvo_do_humor.pdf" -> "Polvo Do Humor")
export function sanitizePatternTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Receita Amigurumi';
  return cleaned
    .split(' ')
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}

export const PatternParserService = {
  // Extract text from an uploaded PDF file
  async extractTextFromPdf(file: File | Blob): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText;
      }

      return fullText;
    } catch (err) {
      console.error('Erro ao ler PDF:', err);
      throw new Error('Não foi possível ler o texto do arquivo PDF. Verifique se o arquivo não está corrompido ou protegido.');
    }
  },

  // Parse pattern text (from PDF or pasted text) into Title, Parts, Rounds, and Stitches
  parseCrochetText(text: string, defaultFileName?: string): ExtractedPattern {
    const warnings: string[] = [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let detectedTitle = defaultFileName ? sanitizePatternTitle(defaultFileName) : 'Receita Amigurumi';
    let detectedHook = '2.5mm';
    let detectedYarn = '';

    // Search for title in the first 25 non-empty lines
    for (let i = 0; i < Math.min(25, lines.length); i++) {
      const line = lines[i];
      if (line.startsWith('--- PÁGINA')) continue;

      const titleMatch = line.match(/(?:receita|padrão|amigurumi|crochê|pattern)[\s:-]+([a-záàâãéèêíïóôõöúçñ\s0-9]{3,40})/i);
      if (titleMatch && titleMatch[1].trim().length > 3) {
        detectedTitle = titleMatch[1].trim().charAt(0).toUpperCase() + titleMatch[1].trim().slice(1);
        break;
      }
    }

    // Search for hook size: "agulha 2.5mm", "hook 3.0 mm", etc.
    const hookMatch = text.match(/(?:agulha|hook|crochet hook)[\s:]*([0-9.,]+)\s*(?:mm)?/i);
    if (hookMatch) {
      detectedHook = `${hookMatch[1].replace(',', '.')}mm`;
    }

    // Search for yarn: "fio amigurumi", "linha charme", etc.
    const yarnMatch = text.match(/(?:fio|linha|yarn)[\s:]+([A-Za-zÀ-ÿ0-9\s]{3,25})/i);
    if (yarnMatch) {
      detectedYarn = yarnMatch[1].trim();
    }

    const detectedParts: ProjectPart[] = [];
    let currentPart: ProjectPart | null = null;
    let currentPartOrder = 1;

    // Comprehensive list of amigurumi piece keywords
    const partTerms = [
      'cabeça', 'head', 'corpo', 'body', 'braço', 'braços', 'braco', 'bracos', 'arm', 'arms',
      'perna', 'pernas', 'leg', 'legs', 'pata', 'patas', 'paw', 'paws', 'pé', 'pés', 'foot', 'feet',
      'orelha', 'orelhas', 'ear', 'ears', 'focinho', 'muzzle', 'snout', 'nariz', 'nose',
      'rabo', 'rabinho', 'cauda', 'tail', 'asa', 'asas', 'wing', 'wings', 'bico', 'beak',
      'chifre', 'chifres', 'horn', 'horns', 'olho', 'olhos', 'eye', 'eyes', 'bochecha', 'bochechas',
      'mão', 'mãos', 'mao', 'maos', 'hand', 'hands', 'tentáculo', 'tentáculos', 'tentaculo', 'tentaculos',
      'mancha', 'manchas', 'barriga', 'belly', 'casco', 'shell', 'chapéu', 'chapeu', 'hat',
      'gorro', 'laço', 'laco', 'bow', 'gravata', 'saia', 'skirt', 'vestido', 'dress',
      'sapato', 'sapatos', 'sapatinho', 'sapatinhos', 'cabelo', 'hair', 'juba', 'mane',
      'tromba', 'trunk', 'antena', 'antenas', 'barbatana', 'barbatanas', 'capuz', 'gola',
      'cabeça e corpo', 'cabeca e corpo', 'cabeça/corpo', 'detalhe', 'detalhes', 'parte 1', 'parte 2', 'parte 3', 'parte 4'
    ].join('|');

    // Header Regex matching:
    // "CABEÇA:", "1. Cabeça (fazer 1)", "CORPO (fio bege)", "Braços (2x)", "Patas (fazer 4)"
    const partHeaderRegex = new RegExp(
      `^(?:[#*•-]+\\s*)?(?:(?:peça|parte|item)\\s*[0-9]+[:.]\\s*)?(?:[0-9]+[.)]\\s*)?(${partTerms})(?:\\s*\\([^)]*\\)|\\s*\\[[^\\]]*\\])?[:\\-]?\\s*$`,
      'i'
    );

    // Round line regex matching:
    // "1ª carr: ...", "Volta 1: ...", "V1: ...", "Carr 1: ...", "R1: ...", "1. 6 pb...", "1: 6 pb", "1 - 6 pb", "Voltas 5 a 8: ..."
    const roundLineRegex = /^(?:[#*•-]+\s*)?(?:volta[s]?|carr(?:eira)?[s]?|v|r|rnd|round[s]?)?\s*([0-9]+)(?:\s*(?:a|à|-|ao|até)\s*(?:volta[s]?|carr(?:eira)?[s]?|v|r|rnd|round[s]?)?\s*([0-9]+))?[:.)\-\s]\s*(.*)$/i;

    // Stitch count regex matching at line end:
    // (6), [6], (12 pb), [18 pts], = 24, (30 sts), tot: 36
    const stitchCountRegex = /(?:\(|\[|=|tot(?:al)?[:\s]*)\s*([0-9]+)\s*(?:pb|pt[s]?|pontos|st[s]?|sc)?\s*(?:\)|\])?$/i;

    // Color change regex
    const colorChangeRegex = /(?:trocar|mudar|alterar|usar|com|iniciar com|mude para|troca de cor)\s+(?:o|a)?\s*(?:fio|cor|lã)?\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i;

    // Helper to create part
    const createNewPart = (name: string): ProjectPart => {
      const cleanName = name
        .replace(/[:*#]/g, '')
        .trim();
      return {
        id: 'part_' + Math.random().toString(36).substring(2, 9),
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        targetRounds: 1,
        currentRound: 1,
        currentStitch: 0,
        targetStitches: 6,
        isCompleted: false,
        order: currentPartOrder++,
        roundInstructions: {},
        roundStitches: {},
        colorReminders: [],
      };
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore page separators
      if (line.startsWith('--- PÁGINA')) continue;

      // Check for piece header
      const partMatch = line.match(partHeaderRegex);
      if (partMatch) {
        if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
          detectedParts.push(currentPart);
        }
        currentPart = createNewPart(line);
        continue;
      }

      // Check for round instruction
      const roundMatch = line.match(roundLineRegex);
      if (roundMatch) {
        const startRound = parseInt(roundMatch[1], 10);
        if (isNaN(startRound) || startRound <= 0 || startRound > 999) continue;

        if (!currentPart) {
          currentPart = createNewPart('Peça Principal');
        }

        const endRound = roundMatch[2] ? parseInt(roundMatch[2], 10) : startRound;
        const validEndRound = (!isNaN(endRound) && endRound >= startRound && endRound <= 999) ? endRound : startRound;
        const instruction = roundMatch[3] || line;

        // Extract stitch count
        let stitches = 0;
        const stitchMatch = instruction.match(stitchCountRegex);
        if (stitchMatch) {
          stitches = parseInt(stitchMatch[1], 10);
        }

        // Color reminder
        const colorMatch = instruction.match(colorChangeRegex);
        if (colorMatch && currentPart) {
          const rawColor = colorMatch[1].trim().slice(0, 30);
          if (rawColor && !['o', 'a', 'um', 'uma', 'para'].includes(rawColor.toLowerCase())) {
            currentPart.colorReminders.push({
              id: 'cr_' + Math.random().toString(36).substring(2, 6),
              round: startRound,
              colorName: rawColor.charAt(0).toUpperCase() + rawColor.slice(1),
              colorHex: '#C85A32',
              note: `Aviso da receita: "${instruction.slice(0, 80)}"`,
            });
          }
        }

        // Assign round instructions and stitches
        for (let r = startRound; r <= validEndRound; r++) {
          if (currentPart) {
            if (!currentPart.roundInstructions) currentPart.roundInstructions = {};
            if (!currentPart.roundStitches) currentPart.roundStitches = {};

            currentPart.roundInstructions[r] = instruction;
            if (stitches > 0) {
              currentPart.roundStitches[r] = stitches;
            }

            if (r > currentPart.targetRounds) {
              currentPart.targetRounds = r;
            }

            // Set initial targetStitches if on round 1
            if (stitches > 0 && r === 1) {
              currentPart.targetStitches = stitches;
            }
          }
        }
      }
    }

    if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
      detectedParts.push(currentPart);
    }

    // Fallback: If no parts with instructions were found, but text was read
    if (detectedParts.length === 0) {
      // Create at least one usable part so user can begin immediately
      detectedParts.push({
        id: 'part_' + Math.random().toString(36).substring(2, 9),
        name: 'Peça Principal',
        targetRounds: 20,
        currentRound: 1,
        currentStitch: 0,
        targetStitches: 6,
        isCompleted: false,
        order: 1,
        roundInstructions: {
          1: 'Acompanhe a receita visualizando o PDF anexado.',
        },
        roundStitches: { 1: 6 },
        colorReminders: [],
      });
      warnings.push(
        'O PDF foi anexado! Algumas formatações da receita podem requerer ajuste manual das partes e voltas.'
      );
    }

    // Ensure all parts have targetStitches set
    for (const p of detectedParts) {
      if (!p.targetStitches || p.targetStitches === 0) {
        p.targetStitches = p.roundStitches?.[1] || 6;
      }
    }

    return {
      rawText: text,
      detectedTitle,
      detectedHook,
      detectedYarn,
      detectedParts,
      warnings,
    };
  },
};
