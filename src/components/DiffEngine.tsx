import React, { useState } from 'react';
import { AdaptationChannel, VehicleProfile } from '../types/mib3';
import { 
  byteToBits, 
  formatHexWithSpaces, 
  hexStringToBytes 
} from '../utils/mib3CodingUtils';
import { MIB3_BYTE_DEFINITIONS } from '../data/mib3Database';
import { 
  GitCompare, ArrowRight, RotateCcw, Check, 
  Copy, Layers, Car, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface DiffEngineProps {
  currentProfile: VehicleProfile;
  codingHex: string;
  stockCodingHex: string;
  channels: AdaptationChannel[];
  onRollbackToStock: () => void;
  onClose: () => void;
}

export const DiffEngine: React.FC<DiffEngineProps> = ({
  currentProfile,
  codingHex,
  stockCodingHex,
  channels,
  onRollbackToStock,
  onClose
}) => {
  const [copiedRollback, setCopiedRollback] = useState<boolean>(false);

  const currentBytes = hexStringToBytes(codingHex, 32);
  const stockBytes = hexStringToBytes(stockCodingHex, 32);

  // Find all modified bytes
  const modifiedByteIndices: number[] = [];
  currentBytes.forEach((b, idx) => {
    if (b !== stockBytes[idx]) {
      modifiedByteIndices.push(idx);
    }
  });

  // Find all modified adaptation channels
  const modifiedChannels = channels.filter(c => c.currentValue !== c.defaultValue);

  const totalModifications = modifiedByteIndices.length + modifiedChannels.length;

  const handleCopyRollback = () => {
    const script = `; ==============================================================================
; MIB3 EMERGENCY ROLLBACK SCRIPT (OEM RESTORE)
; Target: ${currentProfile.name} | ECU 5F
; Generated: ${new Date().toLocaleString()}
; ==============================================================================

[RESTORE LONG CODING]
Original Factory Coding:
${formatHexWithSpaces(stockCodingHex)}

[RESTORE ADAPTATIONS]
${modifiedChannels.map(ch => `Channel: ${ch.channelName} -> ${ch.subName || ''}
Restore to OEM Value: ${ch.defaultValue}`).join('\n\n')}

[REBOOT INFOTAINMENT]
Hold power button for 15s to restart MIB3.`;

    navigator.clipboard.writeText(script);
    setCopiedRollback(true);
    setTimeout(() => setCopiedRollback(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                AUDIT & ROLLBACK ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">Differential Inspector</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              State Diff: Original Factory vs Staged Modifications
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Inspect all pending changes across Long Coding registers and Adaptation channels before executing flash.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRollback}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copiedRollback ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{copiedRollback ? 'Rollback Copied!' : 'Copy Rollback Script'}</span>
            </button>

            <button
              onClick={onRollbackToStock}
              className="px-3.5 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Revert All to Factory</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
          <span className="text-slate-400">Total Pending Diffs:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
            {totalModifications} Modified Elements
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-300">{modifiedByteIndices.length} Coding Bytes</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-300">{modifiedChannels.length} Adaptations</span>
        </div>
      </div>

      {totalModifications === 0 ? (
        <div className="p-12 text-center bg-[#0f131d] border border-slate-800 rounded-xl space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">System Matches Factory OEM State</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No modifications or staged recipes are currently pending. Apply a 1-Click Recipe or toggle bits in Long Coding to view diffs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* Long Coding Diffs */}
          {modifiedByteIndices.length > 0 && (
            <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4 text-cyan-400" />
                Long Coding Byte Diffs ({modifiedByteIndices.length})
              </h3>

              <div className="space-y-3">
                {modifiedByteIndices.map((byteIdx) => {
                  const stockHex = stockBytes[byteIdx];
                  const currentHex = currentBytes[byteIdx];
                  const def = MIB3_BYTE_DEFINITIONS.find(b => b.byteIndex === byteIdx);

                  const stockBits = byteToBits(stockHex);
                  const currentBits = byteToBits(currentHex);

                  return (
                    <div key={byteIdx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              BYTE {byteIdx.toString().padStart(2, '0')}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {def ? def.name : `Byte ${byteIdx}`}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {def ? def.category : 'General Register'}
                          </span>
                        </div>

                        {/* Hex transition pill */}
                        <div className="flex items-center gap-2 font-mono text-xs font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-slate-400">0x{stockHex}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-amber-400">0x{currentHex}</span>
                        </div>
                      </div>

                      {/* Changed Bits List */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                        <span className="text-[11px] font-mono text-slate-500 uppercase">Bit Level Alterations:</span>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((bitIdx) => {
                          const oldB = stockBits[bitIdx];
                          const newB = currentBits[bitIdx];
                          if (oldB === newB) return null;

                          const bitDef = def?.bits.find(b => b.bit === bitIdx);

                          return (
                            <div key={bitIdx} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-xs">
                              <div>
                                <span className="text-cyan-400 font-semibold">Bit {bitIdx}</span>
                                <span className="text-slate-300 ml-2 font-sans">{bitDef ? bitDef.name : `Bit ${bitIdx}`}</span>
                              </div>
                              <div className="flex items-center gap-2 font-bold">
                                <span className={oldB ? 'text-emerald-400' : 'text-slate-500'}>{oldB ? '1' : '0'}</span>
                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                <span className={newB ? 'text-emerald-400' : 'text-slate-500'}>{newB ? '1' : '0'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adaptation Channels Diffs */}
          {modifiedChannels.length > 0 && (
            <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Car className="w-4 h-4 text-amber-400" />
                Adaptation Channel Diffs ({modifiedChannels.length})
              </h3>

              <div className="space-y-2">
                {modifiedChannels.map((ch) => (
                  <div key={ch.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-cyan-300">
                        {ch.channelName} <span className="text-slate-500">›</span> {ch.subName}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{ch.description}</p>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                      <span className="text-slate-400">{ch.defaultValue}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300">{ch.currentValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
