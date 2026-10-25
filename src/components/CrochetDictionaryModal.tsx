import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Languages,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface CrochetDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

interface TermItem {
  us: string;
  uk?: string;
  es: string;
  pt: string;
  ptFullName: string;
  description: string;
}

const CROCHET_TERMS: TermItem[] = [
  {
    us: 'sc (single crochet)',
    uk: 'dc (double crochet)',
    es: 'pb (punto bajo / medio punto)',
    pt: 'pb',
    ptFullName: 'Ponto Baixo',
    description: 'O ponto fundamental e mais comum do amigurumi. Cria uma trama firme e fechada.',
  },
  {
    us: 'inc (increase)',
    es: 'aum (aumento)',
    pt: 'aum',
    ptFullName: 'Aumento',
    description: 'Fazer 2 pontos no mesmo ponto de base da carreira anterior para expandir a peça.',
  },
  {
    us: 'dec / inv dec (decrease)',
    es: 'dis / dism (disminución)',
    pt: 'dim / dim invisível',
    ptFullName: 'Diminuição',
    description: 'Fechar 2 pontos juntos (pegando apenas as alças da frente para ficar invisível).',
  },
  {
    us: 'ch (chain)',
    es: 'cad (cadeneta)',
    pt: 'corr',
    ptFullName: 'Correntinha',
    description: 'Ponto inicial para cordões, base de peças ovais ou início de roupas e membros.',
  },
  {
    us: 'sl st (slip stitch)',
    es: 'pe / pd (punto enano / deslizado)',
    pt: 'pbx',
    ptFullName: 'Ponto Baixíssimo',
    description: 'Usado para fechar carreiras, arrematar ou caminhar sobre a peça sem dar altura.',
  },
  {
    us: 'mr / mc (magic ring)',
    es: 'am (anillo mágico)',
    pt: 'am',
    ptFullName: 'Anel Mágico',
    description: 'Laço ajustável onde se tecem os primeiros pontos para fechar o miolo sem deixar buraquinho.',
  },
  {
    us: 'hdc (half double crochet)',
    uk: 'htr (half treble)',
    es: 'mpa (medio punto alto)',
    pt: 'mpa',
    ptFullName: 'Meio Ponto Alto',
    description: 'Ponto intermediário entre o ponto baixo e o ponto alto. Dá curvatura suave.',
  },
  {
    us: 'dc (double crochet)',
    uk: 'tr (treble crochet)',
    es: 'pa (punto alto / vareta)',
    pt: 'pa',
    ptFullName: 'Ponto Alto',
    description: 'Ponto com mais altura, ótimo para roupinhas, babados, asas e orelhas.',
  },
  {
    us: 'tr (treble crochet)',
    es: 'pad (punto alto doble)',
    pt: 'pad',
    ptFullName: 'Ponto Alto Duplo',
    description: 'Ponto alto com 2 laçadas na agulha para detalhes longos.',
  },
  {
    us: 'blo (back loop only)',
    es: 'blo / hbt (hebra trasera)',
    pt: 'blo',
    ptFullName: 'Apenas Alça de Trás',
    description: 'Pegar apenas na alça traseira do ponto, deixando uma linhazinha aparente na frente.',
  },
  {
    us: 'flo (front loop only)',
    es: 'flo / hbd (hebra delantera)',
    pt: 'flo',
    ptFullName: 'Apenas Alça da Frente',
    description: 'Pegar apenas na alça da frente, muito usado para iniciar vestidos e saias.',
  },
  {
    us: 'fo (fasten off)',
    es: 'rematar / cortar',
    pt: 'arrematar',
    ptFullName: 'Arrematar o fio',
    description: 'Cortar e puxar o fio finalizando a peça.',
  },
  {
    us: 'rnd / r (round)',
    es: 'vta / v (vuelta / hilera)',
    pt: 'v / volta',
    ptFullName: 'Volta ou Carreira',
    description: 'Uma volta completa no trabalho circular em espiral.',
  },
];

export const CrochetDictionaryModal: React.FC<CrochetDictionaryModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'dict' | 'translator'>('dict');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputPatternText, setInputPatternText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredTerms = CROCHET_TERMS.filter(
    (item) =>
      item.us.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ptFullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Automatic recipe translator function
  const handleTranslatePattern = () => {
    if (!inputPatternText.trim()) return;

    let res = inputPatternText;

    // Translation dictionary regex replacements
    const rules: [RegExp, string][] = [
      [/\b(magic ring|magic loop|mr|mc)\b/gi, 'anel mágico'],
      [/\b(single crochet|sc)\b/gi, 'pb'],
      [/\b(increase|inc|increases|incs)\b/gi, 'aum'],
      [/\b(invisible decrease|inv dec|decrease|dec|decreases|decs)\b/gi, 'dim'],
      [/\b(half double crochet|hdc)\b/gi, 'mpa'],
      [/\b(double crochet|dc)\b/gi, 'pa'],
      [/\b(treble crochet|tr)\b/gi, 'pad'],
      [/\b(slip stitch|sl st|slst)\b/gi, 'pbx'],
      [/\b(chain|ch|chains)\b/gi, 'corr'],
      [/\b(back loop only|blo)\b/gi, 'blo (alça de trás)'],
      [/\b(front loop only|flo)\b/gi, 'flo (alça da frente)'],
      [/\b(fasten off|f\/o|fo)\b/gi, 'arrematar'],
      [/\b(round|rnd|r)\s*(\d+)/gi, 'Volta $2'],
      [/\b(vuelta|vta|v)\s*(\d+)/gi, 'Volta $2'],
      [/\bpunto bajo\b/gi, 'pb'],
      [/\baumento\b/gi, 'aum'],
      [/\bdisminuci[oó]n\b/gi, 'dim'],
      [/\banillo m[aá]gico\b/gi, 'anel mágico'],
      [/\bcadeneta\b/gi, 'corr'],
      [/\b(repeat|rep)\b/gi, 'repetir'],
      [/\btimes\b/gi, 'vezes'],
    ];

    rules.forEach(([regex, replacement]) => {
      res = res.replace(regex, replacement);
    });

    setTranslatedText(res);
  };

  const handleCopyTranslated = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onShowToast) onShowToast('Tradução copiada!');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-700 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EAE0D2] dark:border-stone-800 bg-[#FAF5ED] dark:bg-stone-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C85A32] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#2D2824] dark:text-stone-100 font-comfortaa leading-none">
                Dicionário & Tradutor de Crochê
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Abreviações em inglês, espanhol e português
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#EDE4D6] dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#EAE0D2] dark:border-stone-800 px-4 pt-2 gap-2 shrink-0 bg-[#F4EFE6] dark:bg-stone-900/60">
          <button
            onClick={() => setActiveTab('dict')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'dict'
                ? 'border-[#C85A32] text-[#C85A32] dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Glossário de Pontos
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'translator'
                ? 'border-[#C85A32] text-[#C85A32] dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Tradutor de Receita</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeTab === 'dict' ? (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Pesquisar ponto (ex: sc, aum, dec, blo...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              {/* Terms Cards */}
              <div className="space-y-2">
                {filteredTerms.map((term, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-[#C85A32]/10 text-[#C85A32] font-black text-xs flex items-center justify-center font-mono">
                          {term.pt}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#2D2824] dark:text-stone-100">
                          {term.ptFullName}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">
                        {term.us}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                      {term.description}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-500 border-t border-stone-100 dark:border-stone-700">
                      <span>🇺🇸 US: <strong>{term.us}</strong></span>
                      <span>🇪🇸 ES: <strong>{term.es}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Pattern Translator Tab */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Cole as linhas da receita em Inglês ou Espanhol:
                </label>
                <textarea
                  rows={4}
                  value={inputPatternText}
                  onChange={(e) => setInputPatternText(e.target.value)}
                  placeholder={`Exemplo:\nR1: 6 sc in mr [6]\nR2: 6 inc [12]\nR3: (1 sc, 1 inc) * 6 [18]`}
                  className="w-full p-2.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <button
                type="button"
                onClick={handleTranslatePattern}
                disabled={!inputPatternText.trim()}
                className="w-full py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B24822] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Traduzir para Português</span>
              </button>

              {translatedText && (
                <div className="p-3.5 rounded-2xl bg-[#FFF6EE] dark:bg-stone-800/80 border border-[#F4A261] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider font-comfortaa">
                      Receita Traduzida:
                    </span>
                    <button
                      onClick={handleCopyTranslated}
                      className="text-xs font-bold text-[#8C5E47] dark:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-[#2D2824] dark:text-stone-100 whitespace-pre-wrap">
                    {translatedText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
