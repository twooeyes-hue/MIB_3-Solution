import React, { useState } from 'react';
import { FecCode, VehicleProfile } from '../types/mib3';
import { MIB3_FEC_CODES } from '../data/mib3Database';
import { 
  Radio, CheckCircle2, AlertTriangle, ShieldCheck, 
  Download, Terminal, FileCode, Plus, Check 
} from 'lucide-react';

interface FecSwapManagerProps {
  currentProfile: VehicleProfile;
}

export const FecSwapManager: React.FC<FecSwapManagerProps> = ({ currentProfile }) => {
  const [fecList, setFecList] = useState<FecCode[]>(MIB3_FEC_CODES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);

  const categories = ['All', 'Connectivity', 'Navigation', 'Audio/Voice', 'Sport/UI'];

  const filteredFecs = fecList.filter(
    f => selectedCategory === 'All' || f.category === selectedCategory
  );

  const toggleStatus = (code: string) => {
    setFecList(prev => prev.map(f => {
      if (f.code === code) {
        const nextStatus = f.defaultStatus === 'Valid' ? 'Not Installed' : 'Valid';
        return { ...f, defaultStatus: nextStatus };
      }
      return f;
    }));
  };

  const handleCopyExceptionScript = () => {
    const validCodes = fecList.filter(f => f.defaultStatus === 'Valid').map(f => f.code);
    const script = `#!/bin/sh
# MIB3 Exception List Patch Generator
# Vehicle: ${currentProfile.name}
# Target: /persistence/fec_container.fec

echo "[*] Mounting /persistence as read-write..."
mount -uw /persistence

echo "[*] Injecting Exception List FEC entries..."
${validCodes.map(c => `echo "${c}" >> /persistence/exception_list.txt`).join('\n')}

echo "[*] Setting permissions 0644..."
chmod 644 /persistence/exception_list.txt
sync
echo "[+] All ${validCodes.length} FEC codes successfully registered. Rebooting MIB3..."
slay -9 mmx-diag-daemon`;

    navigator.clipboard.writeText(script);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                SWaP & FEC LICENSING
              </span>
              <span className="text-xs text-slate-400 font-mono">SoftWare as Product</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Feature Enablement Codes (FEC) License Manager
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              Even with correct Long Coding, functions like Wireless CarPlay, Navigation, and Sport HMI require valid 
              cryptographic FEC keys authorized for VIN <code className="text-cyan-300 font-mono">{currentProfile.vinSample}</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyExceptionScript}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/20"
            >
              {copiedPatch ? <Check className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
              <span>{copiedPatch ? 'Copied Shell Patch!' : 'Generate Exception Patch'}</span>
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FEC Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFecs.map((fec) => {
          const isValid = fec.defaultStatus === 'Valid' || fec.defaultStatus === 'Installed';

          return (
            <div
              key={fec.code}
              className={`p-4 rounded-xl border transition-all ${
                isValid
                  ? 'bg-slate-900/80 border-purple-800/60 shadow-md shadow-purple-950/20'
                  : 'bg-[#0f131d] border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-cyan-300 tracking-wider">
                      {fec.code}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                      {fec.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white font-sans">
                    {fec.description}
                  </h4>
                </div>

                <button
                  onClick={() => toggleStatus(fec.code)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors shrink-0 ${
                    isValid
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {isValid ? 'VALID / ACTIVE' : 'NOT INSTALLED'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
