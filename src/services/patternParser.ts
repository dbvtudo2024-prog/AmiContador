import * as pdfjsLib from 'pdfjs-dist';
import { ColorReminder, ProjectPart } from '../types/amigurumi';

// Configure pdfjs worker using CDN for reliability across environments
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPattern {
  rawText: string;
  detectedParts: ProjectPart[];
  warnings: string[];
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
      throw new Error('Não foi possível ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha.');
    }
  },

  // Parse pattern text (from PDF or pasted text) into Parts, Rounds, and Color Changes
  parseCrochetText(text: string): ExtractedPattern {
    const warnings: string[] = [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const detectedParts: ProjectPart[] = [];
    let currentPart: ProjectPart | null = null;
    let currentPartOrder = 1;

    // Regex to detect common amigurumi piece headers
    // Examples: "CABEÇA:", "1. Cabeça", "Corpo (fio bege)", "Braços (fazer 2)", "Focinho:", "Orelhas (2x)"
    const partHeaderRegex = /^(?:[#*•-]+\s*)?(?:[0-9]+[.)]\s*)?(cabeça|corpo|braço[s]?|perna[s]?|orelha[s]?|focinho|rabinho|rabo|cauda|asa[s]?|chapéu|gorro|laço|tromba|chifre[s]?|olho[s]?|bochecha[s]?|pé[s]?|mão[s]?|tentáculo[s]?|parte\s*[0-9]+|head|body|arm[s]?|leg[s]?|ear[s]?|snout|tail)(?:\s*\(.*?\))?[:\-]?\s*$/i;

    // Regex to detect round/row lines
    // Examples: "1ª carr: ...", "Volta 1: ...", "1. 6 pb...", "V1: ...", "Carr 1-4: ...", "R1: ..."
    const roundLineRegex = /^(?:[#*•-]+\s*)?(?:volta|carr(?:eira)?|v|r|rnd|round)?\s*([0-9]+)(?:\s*(?:a|à|-|ao|até)\s*([0-9]+))?[:.)\s]\s*(.*)$/i;

    // Regex to detect stitch count at the end: (36), [42], = 18 pts
    const stitchCountRegex = /(?:\(|\[|=|tot(?:al)?[:\s]*)\s*([0-9]+)\s*(?:pb|pt[s]?|pontos|st[s]?)?\s*(?:\)|\])?$/i;

    // Regex for color changes: "trocar para cor...", "mudar para...", "fio azul"
    const colorChangeRegex = /(?:trocar|mudar|alterar|usar|com|iniciar com)\s+(?:o|a)?\s*(?:fio|cor|lã)?\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i;

    // Helper to create a new part
    const createNewPart = (name: string): ProjectPart => ({
      id: 'part_' + Math.random().toString(36).substring(2, 8),
      name: name.trim().charAt(0).toUpperCase() + name.trim().slice(1),
      targetRounds: 1,
      currentRound: 1,
      currentStitch: 0,
      targetStitches: 6,
      isCompleted: false,
      order: currentPartOrder++,
      roundInstructions: {},
      colorReminders: [],
    });

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
        currentPart = createNewPart(line.replace(/[:*#]/g, '').trim());
        continue;
      }

      // Check for round instruction
      const roundMatch = line.match(roundLineRegex);
      if (roundMatch) {
        if (!currentPart) {
          currentPart = createNewPart('Peça Principal (Receita)');
        }

        const startRound = parseInt(roundMatch[1]);
        const endRound = roundMatch[2] ? parseInt(roundMatch[2]) : startRound;
        const instruction = roundMatch[3] || line;

        // Extract target stitch count if noted
        let stitches = 0;
        const stitchMatch = instruction.match(stitchCountRegex);
        if (stitchMatch) {
          stitches = parseInt(stitchMatch[1]);
        }

        // Check for color change hint in this round
        const colorMatch = instruction.match(colorChangeRegex);
        if (colorMatch && currentPart) {
          const rawColor = colorMatch[1].trim().slice(0, 30);
          if (rawColor && !['o', 'a', 'um', 'uma'].includes(rawColor.toLowerCase())) {
            currentPart.colorReminders.push({
              id: 'cr_' + Math.random().toString(36).substring(2, 6),
              round: startRound,
              colorName: rawColor.charAt(0).toUpperCase() + rawColor.slice(1),
              colorHex: '#F59E0B',
              note: `Aviso detectado no PDF: "${instruction}"`,
            });
          }
        }

        // Apply round(s)
        for (let r = startRound; r <= endRound; r++) {
          if (currentPart) {
            if (!currentPart.roundInstructions) currentPart.roundInstructions = {};
            currentPart.roundInstructions[r] = instruction;
            if (r > currentPart.targetRounds) {
              currentPart.targetRounds = r;
            }
            if (stitches > 0 && r === currentPart.currentRound) {
              currentPart.targetStitches = stitches;
            }
          }
        }
      }
    }

    if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
      detectedParts.push(currentPart);
    }

    if (detectedParts.length === 0) {
      warnings.push(
        'Não foi possível extrair peças automaticamente com os padrões conhecidos. Você ainda pode visualizar o PDF normalmente enquanto usa o contador manual!'
      );
    }

    return {
      rawText: text,
      detectedParts,
      warnings,
    };
  },
};
