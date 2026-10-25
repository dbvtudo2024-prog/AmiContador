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

// Clean filename to human readable title (e.g. "PDF EMÍLIA.pdf" -> "Emília")
export function sanitizePatternTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt
    .replace(/^pdf[\s_-]*/i, '') // Remove "PDF " prefix if present
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
  // Extract text from an uploaded PDF file preserving line breaks (\n) via Y-coordinates and hasEOL
  async extractTextFromPdf(file: File | Blob): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        let pageText = '';
        let lastY: number | null = null;
        let lastX: number | null = null;

        for (const rawItem of textContent.items) {
          const item = rawItem as any;
          if (!item.str && !item.hasEOL) continue;

          const currentY = item.transform ? item.transform[5] : null;
          const currentX = item.transform ? item.transform[4] : null;

          // If vertical position shifted by more than 3px, it's a new line!
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 3) {
            pageText += '\n';
          } else if (item.hasEOL) {
            pageText += '\n';
          } else if (
            lastX !== null &&
            currentX !== null &&
            currentX > lastX + 3 &&
            !pageText.endsWith(' ') &&
            !pageText.endsWith('\n')
          ) {
            pageText += ' ';
          }

          pageText += item.str || '';

          if (item.hasEOL && !pageText.endsWith('\n')) {
            pageText += '\n';
          }

          lastY = currentY;
          lastX = currentX !== null ? currentX + (item.width || 0) : null;
        }

        fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText + '\n';
      }

      return fullText;
    } catch (err) {
      console.error('Erro ao ler PDF:', err);
      throw new Error(
        'Não foi possível ler o texto do arquivo PDF. Verifique se o arquivo não está corrompido ou protegido.'
      );
    }
  },

  // Parse pattern text (from PDF or pasted text) into Title, Parts, Rounds, and Stitches
  parseCrochetText(text: string, defaultFileName?: string): ExtractedPattern {
    const warnings: string[] = [];

    // Pre-process: split into lines and also expand lines where multiple rounds were concatenated
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const lines: string[] = [];
    for (const rawLine of rawLines) {
      // If a line contains multiple rounds (e.g. "1. 6 pb [6] 2. 6 aum [12]")
      // Split on round prefixes
      const multiRoundSplit = rawLine.split(/(?<=[)\]\d])\s+(?=(?:(?:volta|carr|v|r)\s*)?[0-9]{1,3}\s*[:.)\-\ª\º\°]\s*)/i);
      if (multiRoundSplit.length > 1) {
        for (const sub of multiRoundSplit) {
          if (sub.trim()) lines.push(sub.trim());
        }
      } else {
        lines.push(rawLine);
      }
    }

    let detectedTitle = defaultFileName ? sanitizePatternTitle(defaultFileName) : 'Receita Amigurumi';
    let detectedHook = '2.5mm';
    let detectedYarn = '';

    // Search for title in the first 30 non-empty lines
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      if (line.startsWith('--- PÁGINA')) continue;

      const titleMatch = line.match(
        /(?:receita|padrão|amigurumi|crochê|pattern)[\s:-]+([a-záàâãéèêíïóôõöúçñ\s0-9]{3,40})/i
      );
      if (titleMatch && titleMatch[1].trim().length > 3) {
        detectedTitle = titleMatch[1].trim().charAt(0).toUpperCase() + titleMatch[1].trim().slice(1);
        break;
      }
    }

    // Search for hook size: "agulha 2.75mm", "hook 2.5 mm", etc.
    const hookMatch = text.match(/(?:agulha|hook|crochet hook)[\s:]*([0-9.,]+)\s*(?:mm)?/i);
    if (hookMatch) {
      detectedHook = `${hookMatch[1].replace(',', '.')}mm`;
    }

    // Search for yarn: "sugestão de fio: fio balloon amigo", "linha amigurumi", etc.
    const yarnMatch = text.match(/(?:sugestão de fio|fio|linha|yarn)[\s:]+([A-Za-zÀ-ÿ0-9\s]{3,35})/i);
    if (yarnMatch) {
      detectedYarn = yarnMatch[1].trim();
    }

    const detectedParts: ProjectPart[] = [];
    let currentPart: ProjectPart | null = null;
    let currentPartOrder = 1;

    // Comprehensive list of amigurumi piece keywords in PT, EN, ES
    const pieceKeywords = [
      'cabeça', 'cabeca', 'head', 'cabeza',
      'corpo', 'body', 'cuerpo',
      'braço', 'braços', 'braco', 'bracos', 'arm', 'arms', 'brazo', 'brazos',
      'mão', 'mãos', 'mao', 'maos', 'hand', 'hands', 'mano', 'manos',
      'perna', 'pernas', 'leg', 'legs', 'pierna', 'piernas',
      'pé', 'pés', 'pe', 'pes', 'foot', 'feet', 'pie', 'pies',
      'pata', 'patas', 'paw', 'paws',
      'sapato', 'sapatos', 'sapatinho', 'sapatinhos', 'botinha', 'botinhas', 'shoe', 'shoes', 'zapato', 'zapatos',
      'meia', 'meias', 'sock', 'socks',
      'vestido', 'dress',
      'avental', 'apron', 'delantal',
      'saia', 'skirt', 'falda',
      'calcinha', 'calcinhas', 'shorts', 'short', 'cueca', 'panties', 'underwear',
      'blusa', 'casaco', 'jacket', 'shirt',
      'manga', 'mangas', 'sleeve', 'sleeves',
      'gola', 'collar',
      'laço', 'laco', 'laçarote', 'bow', 'fita', 'ribbon',
      'cabelo', 'cabelos', 'hair', 'pelo', 'cabello', 'peruca', 'wig', 'franja', 'mecha', 'mechas', 'coque',
      'orelha', 'orelhas', 'ear', 'ears', 'oreja', 'orejas',
      'focinho', 'muzzle', 'snout', 'hocico',
      'nariz', 'narizinho', 'nose',
      'olho', 'olhos', 'eye', 'eyes', 'ojo', 'ojos',
      'bochecha', 'bochechas', 'cheek', 'cheeks',
      'sobrancelha', 'sobrancelhas', 'eyebrow', 'eyebrows',
      'boca', 'mouth', 'lábio', 'labio', 'lips',
      'chifre', 'chifres', 'horn', 'horns',
      'asa', 'asas', 'wing', 'wings', 'ala', 'alas',
      'bico', 'beak', 'pico',
      'cauda', 'rabo', 'rabinho', 'tail', 'cola',
      'antena', 'antenas',
      'juba', 'mane',
      'tromba', 'trunk',
      'barriga', 'belly',
      'mancha', 'manchas', 'spot', 'spots',
      'casco', 'shell',
      'chapéu', 'chapeu', 'hat', 'gorro', 'boina', 'tiara', 'faixa',
      'detalhe', 'detalhes', 'acessório', 'acessórios', 'acessorio', 'acessorios',
      'babado', 'babados', 'ruffle',
      'cabeça e corpo', 'cabeca e corpo', 'cabeça/corpo',
      'peça', 'peca', 'parte', 'part', 'item'
    ];

    const partTermsPattern = pieceKeywords.join('|');

    // Regex 1: Explicit piece headers (e.g. "CABEÇA:", "1. Cabeça (fazer 1)", "Pernas (2x)", "Vestido da Emília", "Cabelo:")
    const explicitPartRegex = new RegExp(
      `^(?:[#*•-]+\\s*)?(?:(?:peça|parte|item)\\s*[0-9]+[:.]\\s*)?(?:[0-9]{1,2}[.)\\-]\\s*)?(${partTermsPattern})(?:[\\s\\-_]+[a-záàâãéèêíïóôõöúçñ0-9]+)*(?:\\s*\\([^)]*\\)|\\s*\\[[^\\]]*\\])?[:\\-]?\\s*$`,
      'i'
    );

    // Regex 2: Round line prefix
    // Matches: "1. 6 pb...", "1: 6 pb", "1 - 6 pb", "1ª carr: ...", "1ª volta: ...", "V1: ...", "Carr 1: ...", "Volta 1: ...", "Voltas 5 a 8: ..."
    const roundLineRegex = /^(?:[#*•-]+\s*)?(?:volta[s]?|carr(?:eira)?[s]?|v|r|rnd|round[s]?)?\s*([0-9]{1,3})(?:\s*(?:a|à|-|ao|até)\s*(?:volta[s]?|carr(?:eira)?[s]?|v|r|rnd|round[s]?)?\s*([0-9]{1,3}))?\s*[:.)\-\ª\º\°]\s*(.*)$/i;

    // Stitch count regex:
    // (6), [6], (12 pb), [18 pts], = 24, (30 sts), tot: 36, - 24 pb
    const stitchCountRegex = /(?:\(|\[|=|tot(?:al)?[:\s]*|-)\s*([0-9]{1,4})\s*(?:pb|pt[s]?|pontos|st[s]?|sc)?\s*(?:\)|\])?$/i;

    // Color change regex
    const colorChangeRegex = /(?:trocar|mudar|alterar|usar|com|iniciar com|mude para|troca de cor)\s+(?:o|a)?\s*(?:fio|cor|lã)?\s+([a-záàâãéèêíïóôõöúçñ\s]{3,30})/i;

    // Helper to create part
    const createNewPart = (name: string): ProjectPart => {
      let cleanName = name
        .replace(/^[#*•\-_0-9.:)]+\s*/, '')
        .replace(/[:*#]/g, '')
        .trim();

      if (!cleanName) cleanName = 'Parte ' + currentPartOrder;
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      return {
        id: 'part_' + Math.random().toString(36).substring(2, 9),
        name: cleanName,
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

      // Ignore page indicators and separators
      if (line.startsWith('--- PÁGINA') || line.startsWith('===') || line.startsWith('***')) continue;

      // Check for piece header match (explicit keyword match)
      const isExplicitPart = explicitPartRegex.test(line);

      // Check for uppercase section header that is followed by round 1
      let isFollowedByRound1 = false;
      if (!isExplicitPart && line.length >= 3 && line.length <= 40 && !line.match(/\b(pb|aum|dim|corr|mpa|pa|pt|anel|mágico)\b/i)) {
        // Look ahead 1-3 lines to see if round 1 begins
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const next = lines[j];
          if (next.startsWith('--- PÁGINA')) continue;
          if (roundLineRegex.test(next)) {
            const m = next.match(roundLineRegex);
            if (m && parseInt(m[1], 10) === 1) {
              isFollowedByRound1 = true;
              break;
            }
          }
        }
      }

      if (isExplicitPart || isFollowedByRound1) {
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
        const validEndRound =
          !isNaN(endRound) && endRound >= startRound && endRound <= 999 ? endRound : startRound;
        const instruction = roundMatch[3] || line;

        // Extract stitch count
        let stitches = 0;
        const stitchMatch = instruction.match(stitchCountRegex);
        if (stitchMatch) {
          stitches = parseInt(stitchMatch[1], 10);
        } else {
          // Alternative check: find any (X) or [X] at the end
          const altMatch = instruction.match(/\(([0-9]{1,4})\)|\s+=\s*([0-9]{1,4})\s*$/);
          if (altMatch) {
            stitches = parseInt(altMatch[1] || altMatch[2], 10);
          }
        }

        // Color reminder
        const colorMatch = instruction.match(colorChangeRegex);
        if (colorMatch && currentPart) {
          const rawColor = colorMatch[1].trim().slice(0, 30);
          if (rawColor && !['o', 'a', 'um', 'uma', 'para', 'com', 'no'].includes(rawColor.toLowerCase())) {
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
        'O PDF foi anexado! Você pode acompanhar o passo a passo completo diretamente na visualização do PDF.'
      );
    }

    // Ensure all parts have targetStitches and reasonable defaults
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
