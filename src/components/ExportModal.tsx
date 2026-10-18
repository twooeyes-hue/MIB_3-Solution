import React, { useState } from 'react';
import { AdaptationChannel, ExportTool, RetrofitRecipe, VehicleProfile } from '../types/mib3';
import { generateToolExport } from '../utils/mib3CodingUtils';
import { 
  X, Copy, Check, Download, Terminal, 
  Code, FileText, CheckCircle2, Cpu 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VehicleProfile;
  codingHex: string;
  stockCodingHex: string;
  channels: AdaptationChannel[];
  appliedRecipes: RetrofitRecipe[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  profile,
  codingHex,
  stockCodingHex,
  channels,
  appliedRecipes
}) => {
  const [selectedTool, setSelectedTool] = useState<ExportTool>('vcds');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const changedChannels = channels.filter(c => c.currentValue !== c.defaultValue);
  const exportContent = generateToolExport(
    selectedTool,
    profile,
    codingHex,
    stockCodingHex,
    changedChannels,
    appliedRecipes
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = selectedTool === 'odis' ? 'xml' : selectedTool === 'doip_raw' ? 'sh' : 'txt';
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MIB3_5F_${profile.id}_${selectedTool}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tools: { id: ExportTool; label: string; icon: any; ext: string }[] = [
    { id: 'vcds', label: 'Ross-Tech VCDS', icon: FileText, ext: '.txt' },
    { id: 'obdeleven', label: 'OBDeleven PRO', icon: FileText, ext: '.txt' },
    { id: 'autel_jvci', label: 'Autel JVCI (IM608)', icon: Cpu, ext: '.txt' },
    { id: 'odis', label: 'ODIS-Engineering', icon: Code, ext: '.xml' },
    { id: 'vcp', label: 'Vag Can Pro (VCP)', icon: Code, ext: '.zdc' },
    { id: 'doip_raw', label: 'UDS / DoIP Shell', icon: Terminal, ext: '.sh' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                MULTI-DIAGNOSTIC EXPORT
              </span>
              <h3 className="text-base font-bold text-white">
                Export Deployment Scripts & Instructions
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target: <strong className="text-slate-300">{profile.name}</strong> • Firmware: <strong className="text-cyan-300 font-mono">{profile.firmwareVersion}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool Selectors */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/80'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tool.label}</span>
                <span className="text-[10px] opacity-60 font-mono">{tool.ext}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-cyan-900 selection:text-white">
              {exportContent}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            {changedChannels.length} adaptation channels • {appliedRecipes.length} recipes applied
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-600/30"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
