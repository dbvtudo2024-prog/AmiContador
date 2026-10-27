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

// Comprehensive amigurumi yarn colors list
const KNOWN_COLORS = [
  'bege', 'branco', 'branca', 'preto', 'preta', 'vermelho', 'vermelha',
  'amarelo', 'amarela', 'verde', 'azul', 'rosa', 'marrom', 'cinza',
  'laranja', 'roxo', 'roxa', 'lilás', 'lilas', 'mostarda', 'caramelo',
  'castanho', 'castanha', 'pele', 'cru', 'crú', 'off white', 'off-white',
  'salmão', 'salmao', 'turquesa', 'vinho', 'bordô', 'bordo', 'dourado',
  'prateado', 'menta', 'hortelã', 'hortela', 'coral', 'chocolate',
  'brigadeiro', 'solar', 'chantily', 'chantilly', 'quartzo', 'terracota',
  'rubi', 'safira', 'esmeralda', 'violeta', 'amêndoa', 'amendoa', 'canela',
  'ferrugem', 'petróleo', 'petroleo', 'jeans', 'lavanda', 'cereja', 'melancia',
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'beige', 'pink',
  'rojo', 'blanco', 'negro', 'amarillo'
];

export function isColorOnlyText(text: string): boolean {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/^[:*#•\-–—]+\s*/, '')
    .replace(/[:*#•\-–—]+$/, '')
    .trim();

  if (!clean || clean.length > 35) return false;

  const withoutPrefix = clean
    .replace(/^(?:fio|linha|cor|lã|trocar para|mudar para|iniciar com|começar com|usar|com|em)\s+(?:de\s+)?(?:fio\s+)?/i, '')
    .trim();

  for (const c of KNOWN_COLORS) {
    if (
      clean === c ||
      withoutPrefix === c ||
      withoutPrefix.startsWith(c + ' ') ||
      withoutPrefix.endsWith(' ' + c)
    ) {
      return true;
    }
  }

  return false;
}

export function getColorHex(colorName: string): string {
  const clean = colorName.toLowerCase();
  if (clean.includes('vermelh') || clean.includes('red') || clean.includes('rubi')) return '#C83232';
  if (clean.includes('amarel') || clean.includes('yellow') || clean.includes('mostarda')) return '#E5A823';
  if (clean.includes('verd') || clean.includes('green') || clean.includes('menta')) return '#3D8C40';
  if (clean.includes('bege') || clean.includes('pele') || clean.includes('cru')) return '#D4B996';
  if (clean.includes('branc') || clean.includes('white') || clean.includes('off')) return '#E2DCD5';
  if (clean.includes('pret') || clean.includes('black')) return '#222222';
  if (clean.includes('azul') || clean.includes('blue') || clean.includes('turquesa')) return '#3278C8';
  if (clean.includes('rosa') || clean.includes('pink') || clean.includes('coral')) return '#E06D95';
  if (clean.includes('laranj') || clean.includes('orange')) return '#D96B27';
  if (clean.includes('marrom') || clean.includes('brown') || clean.includes('chocolate')) return '#784421';
  if (clean.includes('rox') || clean.includes('lil') || clean.includes('violeta')) return '#844FA7';
  return '#C85A32';
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const PatternParserService = {
  // Extract text from an uploaded PDF file with TWO-COLUMN awareness
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
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();
        const pageWidth = viewport.width;

        interface ItemBox {
          str: string;
          x: number;
          y: number; // PDF coordinates: Y=0 is bottom, top is pageHeight
          width: number;
          height: number;
        }

        const items: ItemBox[] = [];
        for (const rawItem of textContent.items) {
          const item = rawItem as any;
          if (!item.str && !item.hasEOL) continue;
          const x = item.transform ? item.transform[4] : 0;
          const y = item.transform ? item.transform[5] : 0;
          const width = item.width || 0;
          const height = item.height || 10;
          if (item.str && item.str.trim()) {
            items.push({ str: item.str, x, y, width, height });
          }
        }

        // Helper: Format a list of items into lines sorted top-to-bottom (descending Y)
        const formatItemsToLines = (list: ItemBox[]): string => {
          if (list.length === 0) return '';
          const sorted = [...list].sort((a, b) => b.y - a.y);
          const linesArr: string[] = [];
          let currentLineItems: ItemBox[] = [];
          let currentLineY: number | null = null;

          for (const it of sorted) {
            if (currentLineY === null || Math.abs(it.y - currentLineY) <= 3.8) {
              currentLineItems.push(it);
              if (currentLineY === null) currentLineY = it.y;
            } else {
              currentLineItems.sort((a, b) => a.x - b.x);
              let lineStr = '';
              let lastX = 0;
              for (const lineIt of currentLineItems) {
                if (lineStr && lineIt.x > lastX + 2.5) {
                  lineStr += ' ';
                }
                lineStr += lineIt.str;
                lastX = lineIt.x + lineIt.width;
              }
              if (lineStr.trim()) linesArr.push(lineStr.trim());

              currentLineItems = [it];
              currentLineY = it.y;
            }
          }

          if (currentLineItems.length > 0) {
            currentLineItems.sort((a, b) => a.x - b.x);
            let lineStr = '';
            let lastX = 0;
            for (const lineIt of currentLineItems) {
              if (lineStr && lineIt.x > lastX + 2.5) {
                lineStr += ' ';
              }
              lineStr += lineIt.str;
              lastX = lineIt.x + lineIt.width;
            }
            if (lineStr.trim()) linesArr.push(lineStr.trim());
          }

          return linesArr.join('\n');
        };

        // Detect if this page contains a 2-column layout
        const midX = pageWidth * 0.5;
        const leftItems = items.filter((it) => it.x < midX - 10);
        const rightItems = items.filter((it) => it.x > midX - 10);

        let pageText = '';

        if (leftItems.length >= 4 && rightItems.length >= 4) {
          const leftMinY = Math.min(...leftItems.map((it) => it.y));
          const leftMaxY = Math.max(...leftItems.map((it) => it.y));
          const rightMinY = Math.min(...rightItems.map((it) => it.y));
          const rightMaxY = Math.max(...rightItems.map((it) => it.y));

          const overlapTop = Math.min(leftMaxY, rightMaxY);
          const overlapBottom = Math.max(leftMinY, rightMinY);
          const overlapHeight = overlapTop - overlapBottom;

          // If vertical overlap is significant, process as two columns!
          if (overlapHeight > 60) {
            // Header items: placed above both columns or spanning wide
            const headerItems = items.filter(
              (it) => it.y > overlapTop + 10 || (it.width > pageWidth * 0.45 && it.x < pageWidth * 0.3)
            );
            const columnZoneItems = items.filter(
              (it) => !headerItems.includes(it) && it.y >= overlapBottom - 10
            );
            const footerItems = items.filter(
              (it) => !headerItems.includes(it) && it.y < overlapBottom - 10
            );

            const col1 = columnZoneItems.filter((it) => it.x < midX);
            const col2 = columnZoneItems.filter((it) => it.x >= midX);

            const headerText = formatItemsToLines(headerItems);
            const col1Text = formatItemsToLines(col1);
            const col2Text = formatItemsToLines(col2);
            const footerText = formatItemsToLines(footerItems);

            pageText = [headerText, col1Text, col2Text, footerText].filter(Boolean).join('\n');
          } else {
            pageText = formatItemsToLines(items);
          }
        } else {
          pageText = formatItemsToLines(items);
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

  // Parse pattern text into Title, Parts, Rounds, and Stitches
  parseCrochetText(text: string, defaultFileName?: string): ExtractedPattern {
    const warnings: string[] = [];

    // Pre-process: split into lines and expand multiple rounds on same line
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const lines: string[] = [];
    for (const rawLine of rawLines) {
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

    // Search for hook size
    const hookMatch = text.match(/(?:agulha|hook|crochet hook)[\s:]*([0-9.,]+)\s*(?:mm)?/i);
    if (hookMatch) {
      detectedHook = `${hookMatch[1].replace(',', '.')}mm`;
    }

    // Search for yarn
    const yarnMatch = text.match(/(?:sugestão de fio|fio|linha|yarn)[\s:]+([A-Za-zÀ-ÿ0-9\s]{3,35})/i);
    if (yarnMatch) {
      detectedYarn = yarnMatch[1].trim();
    }

    // Regex 2: Round line prefix
    // Matches: "1. 6 pb...", "1: 6 pb", "1 - 6 pb", "1ª carr: ...", "V1: ...", "Carr 1: ...", "Volta 1: ...", "5-6. pb ..."
    const roundLineRegex = /^(?:[#*•-]+\s*)?(?:volta[s]?|carr(?:eira)?[s]?|v|r|rnd|round[s]?)?\s*([0-9]{1,3})(?:\s*(?:a|à|-|ao|até)\s*(?:volta[s]?|carr(?:eira)?[s]?|v|r|rnd|round[s]?)?\s*([0-9]{1,3}))?\s*[:.)\-\ª\º\°]\s*(.*)$/i;

    // Stitch count regex: (6), [6], (12 pb), [18 pts], = 24, (30 sts), tot: 36
    const stitchCountRegex = /(?:\(|\[|=|tot(?:al)?[:\s]*|-)\s*([0-9]{1,4})\s*(?:pb|pt[s]?|pontos|st[s]?|sc)?\s*(?:\)|\])?$/i;

    // Color change inside round instruction
    const colorChangeRegex = /(?:trocar|mudar|alterar|usar|com|iniciar com|mude para|troca de cor)\s+(?:o|a)?\s*(?:fio|cor|lã)?\s+([a-záàâãéèêíïóôõöúçñ\s]{3,30})/i;

    // Smart piece header detector
    // Smart piece header detector
    function detectPieceTitle(line: string): { title: string; isPerna1?: boolean; isPerna2?: boolean; isCorpo?: boolean; isSectionHeader?: boolean } | null {
      const clean = line.replace(/^[:*#•\-–—0-9.)]+\s*/, '').replace(/[:*#]/g, '').trim();
      if (!clean || clean.length < 3 || clean.length > 55) return null;
      if (isColorOnlyText(clean)) return null;
      if (roundLineRegex.test(line)) return null;

      // Genuine piece headers are short titles (1-4 words). Anything with 5+ words is an instruction!
      if (clean.split(/\s+/).length > 4) return null;

      const norm = normalizeStr(clean);

      // Exclude stitch instructions, action verbs, and finishing details (NEVER create pieces for these!)
      if (
        /\b(anel magico|pb em toda|aum em toda|dim em toda|corte o fio|arremate|arrematar|prenda o fio|prender o fio|saf em toda|sat em toda|pbh em toda|adicione|adicionar|junte|juntar|una|unir|coloque|colocar|prenda|prender|costure|costurar|borde|bordar|bordado|olhos?|nariz|focinho|boca|trava|seguranca|expressao|sobrancelha|cilios|pegando|pegue|faça|fazer|encha|encher|enchimento|continuando|fechando|fechamento|insira|inserir|repita|repetir|trocar|mudar|linha|volta|carr|pontos|pts|pb|aum|dim)\b/.test(
          norm
        )
      ) {
        return null;
      }

      // Specific piece matchers (must match the header itself, not an instruction mentioning the part)
      if (norm === 'primeira perna' || norm === 'perna 1' || norm === 'pe e perna 1' || norm === '1a perna') {
        return { title: 'Primeira Perna', isPerna1: true };
      }
      if (norm === 'segunda perna' || norm === 'perna 2' || norm === 'pe e perna 2' || norm === '2a perna') {
        return { title: 'Segunda Perna', isPerna2: true };
      }
      if (
        norm === 'corpo' ||
        norm === 'o corpo' ||
        norm === 'body' ||
        norm === 'cuerpo' ||
        norm === 'uniao das pernas' ||
        norm === 'unindo as pernas' ||
        norm === 'juntando as pernas' ||
        norm === 'uniao de pernas'
      ) {
        return { title: 'Corpo', isCorpo: true };
      }
      if (/^(?:os\s+)?(?:bracos?|arms?|brazos?)(?:\s*\(?2x\)?)?$/i.test(norm)) {
        return { title: 'Braços (2x)' };
      }
      if (/^(?:a\s+)?cabeca\s+(?:e|\/)\s+corpo$/i.test(norm)) {
        return { title: 'Cabeça e Corpo' };
      }
      if (/^(?:a\s+)?(?:cabeca|head|cabeza)$/i.test(norm)) {
        return { title: 'Cabeça' };
      }
      if (/^(?:o\s+)?(?:vestido|dress|saia)$/i.test(norm)) {
        return { title: 'Vestido' };
      }
      if (/^(?:o\s+)?(?:avental|apron)$/i.test(norm)) {
        return { title: 'Avental' };
      }
      if (/^(?:o\s+)?(?:cabelo|hair|peruca|franja)$/i.test(norm)) {
        return { title: 'Cabelo' };
      }
      if (/^(?:o\s+)?(?:laco|bow)$/i.test(norm)) {
        return { title: 'Laço' };
      }
      if (/^(?:a\s+)?(?:calcinha|shorts|cueca)$/i.test(norm)) {
        return { title: 'Calcinha' };
      }
      if (/^(?:os\s+)?(?:sapatos?|shoes?|botinhas?|meias?)(?:\s*\(?2x\)?)?$/i.test(norm)) {
        return { title: 'Sapatos (2x)' };
      }
      if (/^(?:as\s+)?(?:orelhas?|ears?|orejas?)(?:\s*\(?2x\)?)?$/i.test(norm)) {
        return { title: 'Orelhas (2x)' };
      }
      if (norm === 'pes e pernas' || norm === 'pe e perna' || norm === 'pernas') {
        return { title: 'Pés e Pernas', isSectionHeader: true };
      }

      return null;
    }

    const detectedParts: ProjectPart[] = [];
    let currentPart: ProjectPart | null = null;
    let currentPartOrder = 1;
    let currentSectionHeading = '';
    let pendingColor: string | null = null;

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

      const isColor = isColorOnlyText(line);

      // 1. Color line handling:
      // CRITICAL: NEVER SPLIT PIECES BY COLOR! Colors are color changes on the piece!
      if (isColor) {
        pendingColor = line.charAt(0).toUpperCase() + line.slice(1).trim();
        continue;
      }

      // 2. Check for explicit piece header
      const pieceMatch = detectPieceTitle(line);
      if (pieceMatch) {
        if (pieceMatch.isSectionHeader) {
          currentSectionHeading = pieceMatch.title;
          continue;
        }

        // PRIMEIRA PERNA header: if currentPart already has rounds 1 to 8, it is Primeira Perna!
        if (pieceMatch.isPerna1) {
          if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
            currentPart.name = 'Primeira Perna';
          } else {
            if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
              detectedParts.push(currentPart);
            }
            currentPart = createNewPart('Primeira Perna');
          }
          currentSectionHeading = 'Pés e Pernas';
          continue;
        }

        // SEGUNDA PERNA header: if currentPart already has rounds 1 to 8 of perna 2, update name!
        if (pieceMatch.isPerna2) {
          if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
            currentPart.name = 'Segunda Perna';
          } else {
            if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
              detectedParts.push(currentPart);
            }
            currentPart = createNewPart('Segunda Perna');
          }
          currentSectionHeading = 'Pés e Pernas';
          continue;
        }

        // CORPO header: finishes current leg and starts body
        if (pieceMatch.isCorpo) {
          if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
            detectedParts.push(currentPart);
          }
          currentSectionHeading = 'Corpo';
          currentPart = createNewPart('Corpo');
          continue;
        }

        // Any other explicit piece (e.g. Braços, Cabeça, Vestido)
        if (currentPart && Object.keys(currentPart.roundInstructions || {}).length > 0) {
          detectedParts.push(currentPart);
        }
        currentSectionHeading = pieceMatch.title;
        currentPart = createNewPart(pieceMatch.title);
        continue;
      }

      // 3. Check for sub-details / ruffles (e.g. "Prenda o fio na alça da volta 11 e faça: 1. saf em toda a volta (13)")
      // ATTACH TO EXISTING ROUND NOTE — NEVER INCREMENT TARGET ROUNDS OF THE PIECE!
      const isRuffleOrDetail = /\b(prenda o fio|na alca da volta|na alça da volta|alca que sobrou|alça que sobrou)\b/i.test(normalizeStr(line));
      if (isRuffleOrDetail && currentPart) {
        const roundNumMatch = line.match(/volta\s*["']?([0-9]{1,3})["']?/i);
        const targetR = roundNumMatch ? parseInt(roundNumMatch[1], 10) : (currentPart.targetRounds || 1);
        if (!currentPart.roundInstructions) currentPart.roundInstructions = {};
        const existingNote = currentPart.roundInstructions[targetR] || '';
        let detailText = `[Detalhe: ${line}`;

        // Lookahead to consume the following "1. saf em toda a volta..." so it is NOT mistaken for Round 1!
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (/^(?:1[.)]\s*)?(?:saf|pb|corr|aum|dim)/i.test(nextLine) && !isColorOnlyText(nextLine)) {
            detailText += ` -> ${nextLine}`;
            i++; // skip next line
          }
        }
        detailText += ']';
        currentPart.roundInstructions[targetR] = existingNote ? `${existingNote}\n${detailText}` : detailText;
        continue;
      }

      // 4. Handle Round instructions
      const roundMatch = line.match(roundLineRegex);
      if (roundMatch) {
        const startRound = parseInt(roundMatch[1], 10);
        if (isNaN(startRound) || startRound <= 0 || startRound > 999) continue;

        // Doll structure check: legs finish at round 17. Round 18+ is the Corpo (torso) joining the legs!
        if (
          startRound >= 18 &&
          currentPart &&
          (currentPart.name.includes('Segunda Perna') || currentPart.name.includes('Perna') || currentSectionHeading.includes('Perna'))
        ) {
          detectedParts.push(currentPart);
          currentSectionHeading = 'Corpo';
          currentPart = createNewPart('Corpo');
        }

        // If startRound is 1 and currentPart already has 4+ rounds (a subsequent piece begins without explicit header)
        if (startRound === 1 && currentPart && Object.keys(currentPart.roundInstructions || {}).length >= 4) {
          detectedParts.push(currentPart);

          let nextName = 'Parte ' + (detectedParts.length + 1);
          if (currentPart.name.includes('Primeira Perna') || currentSectionHeading.includes('Perna')) {
            nextName = 'Segunda Perna';
          } else if (currentSectionHeading) {
            nextName = currentSectionHeading;
          }
          currentPart = createNewPart(nextName);
        }

        if (!currentPart) {
          let initialName = currentSectionHeading || 'Peça Principal';
          if (initialName.includes('Perna')) {
            initialName = 'Primeira Perna';
          }
          currentPart = createNewPart(initialName);
        }

        // Color reminder handling:
        // CRITICAL: NEVER ADD A COLOR CHANGE ALERT ON ROUND 1!
        // Round 1 is the starting color of the piece. Color changes only occur mid-piece (startRound > 1).
        if (pendingColor && currentPart) {
          if (startRound > 1) {
            if (!currentPart.colorReminders.some((cr) => cr.round === startRound)) {
              currentPart.colorReminders.push({
                id: 'cr_' + Math.random().toString(36).substring(2, 6),
                round: startRound,
                colorName: pendingColor,
                colorHex: getColorHex(pendingColor),
                note: `Troca de cor: ${pendingColor}`,
              });
            }
          }
          pendingColor = null;
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
          const altMatch = instruction.match(/\(([0-9]{1,4})\)|\s+=\s*([0-9]{1,4})\s*$/);
          if (altMatch) {
            stitches = parseInt(altMatch[1] || altMatch[2], 10);
          }
        }

        // Color reminder inside instruction text (only for round > 1)
        const colorMatch = instruction.match(colorChangeRegex);
        if (colorMatch && currentPart && startRound > 1) {
          const rawColor = colorMatch[1].trim().slice(0, 30);
          if (rawColor && !['o', 'a', 'um', 'uma', 'para', 'com', 'no'].includes(rawColor.toLowerCase())) {
            currentPart.colorReminders.push({
              id: 'cr_' + Math.random().toString(36).substring(2, 6),
              round: startRound,
              colorName: rawColor.charAt(0).toUpperCase() + rawColor.slice(1),
              colorHex: getColorHex(rawColor),
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

    // Post-processing: deduplication, clean-up, and correction
    const cleanParts: ProjectPart[] = [];
    const nameCounts: Record<string, number> = {};

    for (const part of detectedParts) {
      const roundNumbers = Object.keys(part.roundInstructions || {}).map(Number);
      if (roundNumbers.length === 0) continue;

      const minRound = Math.min(...roundNumbers);
      const maxRound = Math.max(...roundNumbers);

      // 1. Discard any color reminders on round 1
      part.colorReminders = (part.colorReminders || []).filter((cr) => cr.round > 1);

      // 2. If a part has only 1 color overall, it has ZERO color changes!
      const uniqueColors = new Set(part.colorReminders.map((c) => c.colorName.toLowerCase()));
      if (uniqueColors.size === 0) {
        part.colorReminders = [];
      }

      // 3. Rename misnamed "Focinho" or "Nariz" (e.g. 26 rounds) to "Cabeça"
      const normPartName = part.name.toLowerCase();
      if (normPartName.includes('focinho') || normPartName.includes('nariz') || normPartName.includes('olho')) {
        part.name = 'Cabeça';
      }

      // 4. Any piece with rounds >= 18 is the torso/Corpo (joining legs and attaching arms at rounds 32-33)
      if (minRound >= 18) {
        part.name = 'Corpo';
      } else if (part.name.includes('Perna') && minRound === 1 && maxRound > 17) {
        part.targetRounds = 17;
      }

      // 5. MERGE DUPLICATE CORPO: If Corpo already exists, merge rounds directly into the single Corpo!
      const existingCorpoIndex = cleanParts.findIndex((p) => p.name.toLowerCase() === 'corpo');
      if (part.name.toLowerCase() === 'corpo' && existingCorpoIndex !== -1) {
        const existingCorpo = cleanParts[existingCorpoIndex];
        existingCorpo.roundInstructions = {
          ...existingCorpo.roundInstructions,
          ...part.roundInstructions,
        };
        existingCorpo.roundStitches = {
          ...existingCorpo.roundStitches,
          ...part.roundStitches,
        };
        existingCorpo.colorReminders = [
          ...(existingCorpo.colorReminders || []),
          ...(part.colorReminders || []),
        ];
        const allRounds = Object.keys(existingCorpo.roundInstructions).map(Number);
        existingCorpo.targetRounds = Math.max(...allRounds);
        continue; // Merged into the single Corpo! Do not create duplicate!
      }

      // Set targetRounds to the highest round in instructions
      part.targetRounds = maxRound > 0 ? maxRound : part.targetRounds;

      // 6. Deduplicate names for any other pieces
      let finalName = part.name;
      if (nameCounts[finalName]) {
        nameCounts[finalName]++;
        finalName = `${finalName} ${nameCounts[finalName]}`;
      } else {
        nameCounts[finalName] = 1;
      }
      part.name = finalName;

      cleanParts.push(part);
    }

    // Fallback if no pieces found
    if (cleanParts.length === 0) {
      cleanParts.push({
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
    for (const p of cleanParts) {
      if (!p.targetStitches || p.targetStitches === 0) {
        p.targetStitches = p.roundStitches?.[1] || 6;
      }
    }

    return {
      rawText: text,
      detectedTitle,
      detectedHook,
      detectedYarn,
      detectedParts: cleanParts,
      warnings,
    };
  },
};
