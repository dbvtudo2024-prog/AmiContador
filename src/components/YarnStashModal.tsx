import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Tag,
  Hash,
} from 'lucide-react';
import { YarnItem } from '../types/amigurumi';
import { StorageService } from '../services/storage';

interface YarnStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const COMMON_YARN_BRANDS = [
  'Amigurumi Círculo',
  'Amigurumi Soft',
  'Amigurumi Glow',
  'Amigurumi Pelúcia',
  'Balloon Amigo',
  'Bella Arte Pingouin',
  'Barroco Maxcolor',
  'Anne Círculo',
  'Duna Círculo',
];

const PRESET_YARN_COLORS = [
  { name: 'Brigadeiro', code: '7569', hex: '#634433' },
  { name: 'Caramelo', code: '7567', hex: '#C68642' },
  { name: 'Branco Neve', code: '8001', hex: '#F8FAFC' },
  { name: 'Preto', code: '8990', hex: '#1C1917' },
  { name: 'Mostarda', code: '7030', hex: '#D97706' },
  { name: 'Solar (Amarelo)', code: '1317', hex: '#FACC15' },
  { name: 'Chantily', code: '7563', hex: '#F5EBE1' },
  { name: 'Verde Menta', code: '5743', hex: '#81B29A' },
  { name: 'Rosa Quartzo', code: '3077', hex: '#F472B6' },
  { name: 'Azul Hortênsia', code: '2137', hex: '#60A5FA' },
  { name: 'Terracota', code: '4094', hex: '#C85A32' },
  { name: 'Alfazema (Lilás)', code: '6614', hex: '#C084FC' },
];

export const YarnStashModal: React.FC<YarnStashModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [yarns, setYarns] = useState<YarnItem[]>(() => StorageService.getYarnStash());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [brand, setBrand] = useState('Amigurumi Círculo');
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [quantityStatus, setQuantityStatus] = useState<'full' | 'half' | 'scraps'>('full');
  const [colorHex, setColorHex] = useState('#C85A32');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const filteredYarns = yarns.filter(
    (y) =>
      y.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      y.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      y.colorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (y.lotNumber && y.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddYarn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim()) return;

    const newItem: YarnItem = {
      id: 'yarn_' + Math.random().toString(36).substring(2, 9),
      brand,
      colorName: colorName.trim(),
      colorCode: colorCode.trim(),
      lotNumber: lotNumber.trim() || undefined,
      quantityStatus,
      colorHex,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveYarnItem(newItem);
    setYarns(StorageService.getYarnStash());
    setShowAddForm(false);
    setColorName('');
    setColorCode('');
    setLotNumber('');
    setNotes('');
    if (onShowToast) onShowToast('Novelo adicionado ao armarinho!');
  };

  const handleDeleteYarn = (id: string) => {
    StorageService.deleteYarnItem(id);
    setYarns(StorageService.getYarnStash());
  };

  const selectColorPreset = (preset: typeof PRESET_YARN_COLORS[0]) => {
    setColorName(preset.name);
    setColorCode(preset.code);
    setColorHex(preset.hex);
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
            <div className="w-8 h-8 rounded-xl bg-[#8C5E47] text-white flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#2D2824] dark:text-stone-100 font-comfortaa leading-none">
                Meu Armarinho de Fios
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Controle seus novelos, códigos de cores e lotes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2.5 py-1.5 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Fio</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#EDE4D6] dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Add Yarn Form */}
          {showAddForm && (
            <form onSubmit={handleAddYarn} className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 space-y-3 shadow-sm animate-slide-up">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
                <span className="font-bold text-xs text-[#2D2824] dark:text-stone-100 font-comfortaa">
                  Cadastrar Novelo no Estoque
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Brand */}
              <div>
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-1">
                  Marca / Linha do Fio:
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] dark:bg-stone-900 text-xs font-bold"
                >
                  {COMMON_YARN_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Outro Fio">Outro Fio</option>
                </select>
              </div>

              {/* Quick Preset Colors */}
              <div>
                <span className="text-[10px] text-stone-500 block mb-1 font-semibold">Cores Populares de Amigurumi:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_YARN_COLORS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => selectColorPreset(c)}
                      className="px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[10px] font-bold flex items-center gap-1 bg-[#FAF5ED] dark:bg-stone-900 hover:border-[#8C5E47] cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Name & Code */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-0.5">
                    Nome da Cor:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Caramelo"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-0.5">
                    Código / Número:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 7569"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Lot Number & Quantity */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-0.5">
                    Número do Lote:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 84920"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-0.5">
                    Quantidade Atual:
                  </label>
                  <select
                    value={quantityStatus}
                    onChange={(e) => setQuantityStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] dark:bg-stone-900 text-xs font-bold"
                  >
                    <option value="full">🟢 Novelo Fechado (100%)</option>
                    <option value="half">🟡 Meio Novelo (~50%)</option>
                    <option value="scraps">🔴 Sobrinhas (&lt;25%)</option>
                  </select>
                </div>
              </div>

              {/* Color Swatch */}
              <div className="flex items-center gap-2 text-xs">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300">Cor visual:</label>
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Salvar no Armarinho
              </button>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por cor, código ou lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Yarn List */}
          {yarns.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs space-y-2">
              <Package className="w-8 h-8 text-stone-400 mx-auto" />
              <p>Seu armarinho de fios ainda está vazio!</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-xl bg-[#8C5E47] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Cadastrar Primeiro Novelo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredYarns.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 flex items-start justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl shadow-xs border border-stone-200 shrink-0 flex items-center justify-center text-xs font-bold text-white drop-shadow"
                      style={{ backgroundColor: item.colorHex }}
                    >
                      🧶
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#2D2824] dark:text-stone-100 truncate">
                        {item.colorName} {item.colorCode && `(${item.colorCode})`}
                      </h4>
                      <p className="text-[10px] text-stone-500 truncate">
                        {item.brand}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.lotNumber && (
                          <span className="text-[9px] font-bold bg-[#EDE4D6] dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded-md">
                            Lote: {item.lotNumber}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            item.quantityStatus === 'full'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.quantityStatus === 'half'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.quantityStatus === 'full'
                            ? '100% Fechado'
                            : item.quantityStatus === 'half'
                            ? '50% Meio'
                            : 'Sobrinhas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteYarn(item.id)}
                    className="p-1 text-stone-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    title="Excluir novelo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
