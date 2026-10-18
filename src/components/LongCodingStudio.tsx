import React, { useState } from 'react';
import { 
  Copy, Check, Layers, AlertCircle, RefreshCw, 
  HelpCircle, Sparkles, ChevronRight, Binary
} from 'lucide-react';
import { MIB3_BYTE_DEFINITIONS } from '../data/mib3Database';
import { 
  byteToBits, 
  formatHexWithSpaces, 
  hexStringToBytes, 
  normalizeHexString, 
  setBitInCodingString 
} from '../utils/mib3CodingUtils';
import { VehicleProfile } from '../types/mib3';

interface LongCodingStudioProps {
  currentProfile: VehicleProfile;
  codingHex: string;
  stockCodingHex: string;
  onChangeCodingHex: (newHex: string) => void;
  onResetToStock: () => void;
}

export const LongCodingStudio: React.FC<LongCodingStudioProps> = ({
  currentProfile,
  codingHex,
  stockCodingHex,
  onChangeCodingHex,
  onResetToStock
}) => {
  const [selectedByteIndex, setSelectedByteIndex] = useState<number>(15); // Default to Smartphone Interface (Byte 15)
  const [copied, setCopied] = useState<boolean>(false);
  const [customHexInput, setCustomHexInput] = useState<string>('');
  const [isEditingRaw, setIsEditingRaw] = useState<boolean>(false);

  const currentBytes = hexStringToBytes(codingHex, 32);
  const stockBytes = hexStringToBytes(stockCodingHex, 32);

  // Selected Byte data
  const activeByteHex = currentBytes[selectedByteIndex] || '00';
  const stockByteHex = stockBytes[selectedByteIndex] || '00';
  const isByteModified = activeByteHex !== stockByteHex;
  const activeBits = byteToBits(activeByteHex);

  // Known definition if cataloged
  const byteDef = MIB3_BYTE_DEFINITIONS.find(b => b.byteIndex === selectedByteIndex);

  const handleCopyHex = () => {
    navigator.clipboard.writeText(formatHexWithSpaces(codingHex));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBit = (bitIndex: number) => {
    const newBitVal = !activeBits[bitIndex];
    const newHex = setBitInCodingString(codingHex, selectedByteIndex, bitIndex, newBitVal);
    onChangeCodingHex(newHex);
  };

  const handleApplyByteHex = (newByteHex: string) => {
    const cleanByte = normalizeHexString(newByteHex).padStart(2, '0').substring(0, 2);
    const updated = [...currentBytes];
    updated[selectedByteIndex] = cleanByte;
    onChangeCodingHex(updated.join(''));
  };

  const handleApplyRawHexInput = () => {
    const clean = normalizeHexString(customHexInput);
    if (clean.length > 0) {
      onChangeCodingHex(clean.padEnd(64, '0'));
      setIsEditingRaw(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Coding String Inspector */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ECU 5F • DID 0x0600
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                32-Byte Long Coding Stream
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any byte in the matrix below to inspect its individual 8-bit registers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHex}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied!' : 'Copy Hex'}</span>
            </button>

            <button
              onClick={() => {
                setCustomHexInput(codingHex);
                setIsEditingRaw(!isEditingRaw);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              {isEditingRaw ? 'Cancel' : 'Paste / Edit Raw'}
            </button>
          </div>
        </div>

        {/* Raw Hex Editor Input if toggled */}
        {isEditingRaw ? (
          <div className="p-3 rounded-lg bg-slate-950 border border-cyan-800/80 space-y-2">
            <label className="text-xs text-slate-400 block font-mono">Paste 64-char Hex String:</label>
            <input
              type="text"
              value={customHexInput}
              onChange={(e) => setCustomHexInput(e.target.value)}
              placeholder="e.g. 03330024000000005311000100080800..."
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleApplyRawHexInput}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Apply Raw Coding
              </button>
            </div>
          </div>
        ) : (
          /* Formatted Byte Stream Display */
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
            {currentBytes.map((b, idx) => {
              const isSelected = selectedByteIndex === idx;
              const isModified = b !== stockBytes[idx];
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedByteIndex(idx)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400'
                      : isModified
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={`Byte ${idx}: 0x${b} ${isModified ? '(Modified from 0x' + stockBytes[idx] + ')' : ''}`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 32-Byte Grid Matrix */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Byte Matrix (00 to 31)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Selected: <strong className="text-cyan-300">Byte {selectedByteIndex.toString().padStart(2, '0')}</strong>
          </span>
        </div>

        {/* 32-Byte Card Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
          {currentBytes.map((b, idx) => {
            const isSelected = selectedByteIndex === idx;
            const isModified = b !== stockBytes[idx];
            const def = MIB3_BYTE_DEFINITIONS.find(item => item.byteIndex === idx);

            return (
              <button
                key={idx}
                onClick={() => setSelectedByteIndex(idx)}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-cyan-950/90 border-cyan-400 ring-1 ring-cyan-400 text-white shadow-lg shadow-cyan-950/60'
                    : isModified
                    ? 'bg-amber-950/30 border-amber-600/80 text-amber-200 hover:border-amber-500'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono opacity-60">B{idx.toString().padStart(2, '0')}</span>
                <span className={`text-base font-mono font-bold my-0.5 ${
                  isSelected ? 'text-cyan-300' : isModified ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {b}
                </span>
                <span className="text-[9px] truncate max-w-full font-sans text-slate-500">
                  {def ? def.category.substring(0, 6) : 'Unspec'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deep Bit Inspector for Selected Byte */}
      <div className="bg-[#0f131d] border border-cyan-900/60 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                BYTE {selectedByteIndex.toString().padStart(2, '0')}
              </span>
              <h3 className="text-lg font-bold text-white">
                {byteDef ? byteDef.name : `Byte ${selectedByteIndex} (Internal Configuration)`}
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              {byteDef ? byteDef.description : 'Undocumented or reserved register for MIB3 firmware variants.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 shrink-0">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-mono">HEX VALUE</span>
              <span className="text-xl font-bold font-mono text-cyan-400">0x{activeByteHex}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-mono">STOCK</span>
              <span className="text-xl font-bold font-mono text-slate-400">0x{stockByteHex}</span>
            </div>
          </div>
        </div>

        {/* 8-Bit Interactive Switches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1">
            <span className="flex items-center gap-1">
              <Binary className="w-3.5 h-3.5 text-cyan-400" />
              Bit Register Toggles (Bit 0 to Bit 7)
            </span>
            <span className="text-[11px] text-slate-500">
              Binary: {activeBits.map(b => (b ? '1' : '0')).reverse().join(' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((bitIdx) => {
              const isBitActive = activeBits[bitIdx];
              const bitDef = byteDef?.bits.find(b => b.bit === bitIdx);

              return (
                <div
                  key={bitIdx}
                  onClick={() => handleToggleBit(bitIdx)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isBitActive
                      ? 'bg-cyan-950/30 border-cyan-600/70 shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        Bit {bitIdx}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {bitDef ? bitDef.name : `Bit ${bitIdx}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {bitDef ? bitDef.description : 'Generic flag in register mask.'}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                    isBitActive ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      isBitActive ? 'left-6' : 'left-1'
                    }`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Presets / Brand Selectors for common bytes */}
        {selectedByteIndex === 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2 font-mono">
              Quick Brand Presets for Byte 00:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { hex: '01', label: 'Audi (0x01)' },
                { hex: '03', label: 'Volkswagen (0x03)' },
                { hex: '04', label: 'Seat / Cupra (0x04)' },
                { hex: '05', label: 'Skoda (0x05)' },
                { hex: '06', label: 'Porsche (0x06)' },
              ].map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => handleApplyByteHex(preset.hex)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors ${
                    activeByteHex === preset.hex
                      ? 'bg-cyan-900/60 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
