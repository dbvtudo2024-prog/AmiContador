import React, { useState } from 'react';
import {
  X,
  Calculator,
  Clock,
  DollarSign,
  Package,
  Sparkles,
  Copy,
  Check,
  History,
  Trash2,
  Share2,
} from 'lucide-react';
import { PricingCalculation } from '../types/amigurumi';
import { StorageService } from '../services/storage';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTimeSeconds?: number;
  defaultPieceName?: string;
  onShowToast?: (msg: string) => void;
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultTimeSeconds = 0,
  defaultPieceName = '',
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'history'>('calc');
  const [pieceName, setPieceName] = useState(defaultPieceName || 'Meu Amigurumi');

  // Time & Labor
  const initialHours = (defaultTimeSeconds / 3600).toFixed(1);
  const [workedHours, setWorkedHours] = useState<string>(
    defaultTimeSeconds > 0 ? initialHours : '3.5'
  );
  const [hourlyRate, setHourlyRate] = useState<string>('18.00'); // R$ 18/h default

  // Materials Costs (R$)
  const [yarnCost, setYarnCost] = useState<string>('12.50');
  const [fillingCost, setFillingCost] = useState<string>('3.00');
  const [eyesCost, setEyesCost] = useState<string>('2.50');
  const [accessoriesCost, setAccessoriesCost] = useState<string>('2.00');
  const [packagingCost, setPackagingCost] = useState<string>('3.00');

  // Profit Margin (%)
  const [profitMargin, setProfitMargin] = useState<string>('30'); // 30% default

  // History list
  const [history, setHistory] = useState<PricingCalculation[]>(() =>
    StorageService.getPricingHistory()
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Numeric values
  const hoursNum = parseFloat(workedHours) || 0;
  const hourlyRateNum = parseFloat(hourlyRate) || 0;
  const yarnNum = parseFloat(yarnCost) || 0;
  const fillingNum = parseFloat(fillingCost) || 0;
  const eyesNum = parseFloat(eyesCost) || 0;
  const accNum = parseFloat(accessoriesCost) || 0;
  const packNum = parseFloat(packagingCost) || 0;
  const marginNum = parseFloat(profitMargin) || 0;

  // Calculations
  const totalLabor = hoursNum * hourlyRateNum;
  const totalMaterials = yarnNum + fillingNum + eyesNum + accNum + packNum;
  const baseCost = totalLabor + totalMaterials;
  const profitValue = baseCost * (marginNum / 100);
  const suggestedPrice = baseCost + profitValue;

  const handleSaveCalculation = () => {
    const newCalc: PricingCalculation = {
      id: 'calc_' + Math.random().toString(36).substring(2, 9),
      pieceName: pieceName.trim() || 'Amigurumi',
      timeSeconds: Math.round(hoursNum * 3600),
      hourlyRate: hourlyRateNum,
      yarnCost: yarnNum,
      fillingCost: fillingNum,
      eyesCost: eyesNum,
      accessoriesCost: accNum,
      packagingCost: packNum,
      profitMarginPercent: marginNum,
      totalLaborCost: totalLabor,
      totalMaterialsCost: totalMaterials,
      suggestedPrice: suggestedPrice,
      createdAt: new Date().toISOString(),
    };

    StorageService.savePricingCalculation(newCalc);
    setHistory(StorageService.getPricingHistory());
    if (onShowToast) onShowToast('Orçamento salvo com sucesso!');
  };

  const handleDeleteHistory = (id: string) => {
    StorageService.deletePricingCalculation(id);
    setHistory(StorageService.getPricingHistory());
  };

  const handleCopyWhatsApp = () => {
    const text = `🧶 *Orçamento de Amigurumi: ${pieceName}*
✨ Peça 100% artesanal tecida à mão com muito carinho!

⏱️ *Tempo de confecção:* ~${hoursNum}h
🧵 *Materiais:* Fio 100% algodão macio, enchimento antialérgico e olhinhos com trava de segurança.

💰 *Valor:* R$ ${suggestedPrice.toFixed(2).replace('.', ',')}
💳 Aceitamos Pix e Cartão.

_Dúvidas sobre cores e prazos? Me chama aqui para combinarmos todos os detalhes!_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onShowToast) onShowToast('Texto copiado para o WhatsApp!');
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
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#2D2824] dark:text-stone-100 font-comfortaa leading-none">
                Calculadora de Precificação
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Saiba exatamente quanto cobrar pelo seu amigurumi
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
            onClick={() => setActiveTab('calc')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'calc'
                ? 'border-[#8C5E47] text-[#8C5E47] dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Calcular Preço
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#8C5E47] text-[#8C5E47] dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Histórico Salvo</span>
            {history.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#8C5E47] text-white text-[10px] flex items-center justify-center font-mono">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'calc' ? (
            <>
              {/* Piece Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nome da Peça / Encomenda:
                </label>
                <input
                  type="text"
                  value={pieceName}
                  onChange={(e) => setPieceName(e.target.value)}
                  placeholder="Ex: Ursinho Teddy, Chaveiro Polvo..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-semibold focus:outline-none focus:border-[#8C5E47]"
                />
              </div>

              {/* 1. Mão de Obra (Horas x Valor da Hora) */}
              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-[#D6C8B8] dark:border-stone-700 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#2D2824] dark:text-stone-200 flex items-center gap-1.5 font-comfortaa">
                    <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                    1. Mão de Obra
                  </span>
                  {defaultTimeSeconds > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      Do cronômetro: {(defaultTimeSeconds / 3600).toFixed(1)}h
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-500 mb-1">Horas trabalhadas:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={workedHours}
                        onChange={(e) => setWorkedHours(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] dark:bg-stone-900 font-mono font-bold text-center"
                      />
                      <span className="text-stone-400 font-semibold">h</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-500 mb-1">Valor da sua hora:</label>
                    <div className="flex items-center gap-1">
                      <span className="text-stone-400 font-semibold">R$</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] dark:bg-stone-900 font-mono font-bold text-center"
                      />
                      <span className="text-stone-400 font-semibold">/h</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between text-xs">
                  <span className="text-stone-500">Subtotal Mão de Obra:</span>
                  <strong className="text-[#8C5E47] dark:text-amber-400 font-mono">
                    R$ {totalLabor.toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              </div>

              {/* 2. Materiais */}
              <div className="bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-[#D6C8B8] dark:border-stone-700 space-y-2.5 shadow-2xs">
                <span className="text-xs font-extrabold text-[#2D2824] dark:text-stone-200 flex items-center gap-1.5 font-comfortaa">
                  <Package className="w-3.5 h-3.5 text-[#C85A32]" />
                  2. Materiais e Insumos Gastos
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-0.5">Fios / Linhas:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={yarnCost}
                      onChange={(e) => setYarnCost(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-[#D6C8B8] dark:border-stone-700 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-0.5">Fibra Siliconada:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={fillingCost}
                      onChange={(e) => setFillingCost(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-[#D6C8B8] dark:border-stone-700 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-0.5">Olhos / Focinho:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={eyesCost}
                      onChange={(e) => setEyesCost(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-[#D6C8B8] dark:border-stone-700 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-0.5">Embalagem / Mimo:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-[#D6C8B8] dark:border-stone-700 font-mono text-center"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between text-xs">
                  <span className="text-stone-500">Subtotal Materiais:</span>
                  <strong className="text-[#8C5E47] dark:text-amber-400 font-mono">
                    R$ {totalMaterials.toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              </div>

              {/* 3. Margem de Lucro */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 text-xs shadow-2xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300">
                    3. Margem de Lucro (%):
                  </label>
                  <span className="text-[10px] text-stone-400">Para reinvestir e crescer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[20, 30, 40, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setProfitMargin(String(num))}
                      className={`px-2 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                        profitMargin === String(num)
                          ? 'bg-[#8C5E47] text-white shadow-2xs'
                          : 'bg-[#EDE4D6] dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {num}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultado Destacado */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-[#8C5E47] to-[#C85A32] text-white shadow-lg space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-white/80 block">
                      Preço Sugerido de Venda
                    </span>
                    <span className="text-3xl font-black font-mono">
                      R$ {suggestedPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block text-white/80">Lucro livre:</span>
                    <strong className="font-mono text-emerald-200 text-sm">
                      + R$ {profitValue.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="py-2.5 px-3 rounded-xl bg-white text-[#8C5E47] hover:bg-[#FAF5ED] font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Orçamento WhatsApp'}</span>
                  </button>

                  <button
                    onClick={handleSaveCalculation}
                    className="py-2.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Salvar Orçamento</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Histórico Salvo Tab */
            <div className="space-y-2.5">
              {history.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  Nenhum orçamento salvo ainda. Calcule um preço e clique em "Salvar Orçamento"!
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#2D2824] dark:text-stone-100 truncate">
                        {item.pieceName}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {Math.round(item.timeSeconds / 3600)}h de trabalho • Materiais: R$ {item.totalMaterialsCost.toFixed(2).replace('.', ',')}
                      </p>
                      <span className="text-[10px] text-stone-400">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-base font-mono text-[#8C5E47] dark:text-amber-400">
                        R$ {item.suggestedPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
