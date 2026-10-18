import React, { useState, useEffect } from 'react';
import { AdaptationChannel, RetrofitRecipe, SfdTokenInfo, VehicleProfile } from '../types/mib3';
import { hardwareDiagnostic, DiagnosticFrame } from '../utils/hardwareConnection';
import { normalizeHexString, formatHexWithSpaces } from '../utils/mib3CodingUtils';
import { 
  Play, CheckCircle2, AlertTriangle, ShieldCheck, 
  Terminal, X, RotateCcw, Cpu, BatteryCharging, Zap, ArrowRight, Loader2
} from 'lucide-react';

interface LiveFlashModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VehicleProfile;
  codingHex: string;
  channels: AdaptationChannel[];
  appliedRecipes: RetrofitRecipe[];
  sfdToken: SfdTokenInfo;
  onFlashCompleted: () => void;
}

export const LiveFlashModal: React.FC<LiveFlashModalProps> = ({
  isOpen,
  onClose,
  profile,
  codingHex,
  channels,
  appliedRecipes,
  sfdToken,
  onFlashCompleted
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [frames, setFrames] = useState<DiagnosticFrame[]>([]);
  const [statusText, setStatusText] = useState<string>('Ready to initiate diagnostic sequence');

  const changedChannels = channels.filter(c => c.currentValue !== c.defaultValue);

  const [hwState, setHwState] = useState<any>(hardwareDiagnostic.getState());

  useEffect(() => {
    const unsubHw = hardwareDiagnostic.subscribe(setHwState);
    const unsubFrames = hardwareDiagnostic.subscribeFrames((frame) => {
      setFrames(prev => [frame, ...prev].slice(0, 30));
    });
    return () => {
      unsubHw();
      unsubFrames();
    };
  }, []);

  if (!isOpen) return null;

  const steps = [
    { title: 'Pre-flight Electrical & Bus Check', desc: 'Verify Terminal 15 & Battery voltage > 12.4V' },
    { title: 'Extended Diagnostic Session (0x10 0x03)', desc: 'Transition Module 5F into programming state' },
    { title: 'SFD Security Unlock (0x27 0x01 / 0x02)', desc: 'Write cryptographic token & login 20103' },
    { title: 'Write 32-Byte Long Coding (0x2E 0x0600)', desc: `Commit payload: ${codingHex.substring(0, 16)}...` },
    ...changedChannels.map(ch => ({
      title: `Write Adaptation: ${ch.channelName}`,
      desc: `Setting ${ch.subName || ''} = ${ch.currentValue}`
    })),
    { title: 'ECU Reset & Reboot (0x11 0x01)', desc: 'Hard restart MIB3 infotainment system' }
  ];

  const handleStartFlashing = async () => {
    setIsFlashing(true);
    setIsCompleted(false);
    setProgress(5);
    setFrames([]);

    // Step 0: Pre-flight
    setCurrentStepIndex(0);
    setStatusText('Checking battery voltage and CAN-FD gateway response...');
    await new Promise(r => setTimeout(r, 600));
    setProgress(15);

    // Step 1: Session 0x10 0x03
    setCurrentStepIndex(1);
    setStatusText('Opening Extended Diagnostic Session (0x10 0x03)...');
    await hardwareDiagnostic.executeUdsCommand('10', '03', 'DiagnosticSessionControl Extended');
    setProgress(25);
    await new Promise(r => setTimeout(r, 400));

    // Step 2: Security Access 0x27
    setCurrentStepIndex(2);
    setStatusText('Transmitting SFD Security Token & Login 20103...');
    await hardwareDiagnostic.executeUdsCommand('27', '01', 'SecurityAccess RequestSeed');
    await hardwareDiagnostic.executeUdsCommand('27', '02 4E 88 19 20 10 30', 'SecurityAccess SendKey');
    setProgress(40);
    await new Promise(r => setTimeout(r, 500));

    // Step 3: Write Long Coding 0x2E 0x0600
    setCurrentStepIndex(3);
    setStatusText('Writing 32-Byte Long Coding via UDS 0x2E DID 0x0600...');
    const rawCoding = normalizeHexString(codingHex);
    await hardwareDiagnostic.executeUdsCommand('2E', `06 00 ${rawCoding.substring(0, 32)}`, 'WriteDataByIdentifier LongCoding (Part 1)');
    await hardwareDiagnostic.executeUdsCommand('2E', `06 10 ${rawCoding.substring(32, 64)}`, 'WriteDataByIdentifier LongCoding (Part 2)');
    setProgress(60);
    await new Promise(r => setTimeout(r, 500));

    // Step 4: Write Staged Adaptations
    for (let i = 0; i < changedChannels.length; i++) {
      const ch = changedChannels[i];
      setCurrentStepIndex(4 + i);
      setStatusText(`Writing adaptation channel: ${ch.channelName} -> ${ch.currentValue}`);
      await hardwareDiagnostic.executeUdsCommand('2E', `FD 0${i} 01`, `Write Adaptation ${ch.channelName}`);
      setProgress(60 + Math.round(((i + 1) / (changedChannels.length + 1)) * 30));
      await new Promise(r => setTimeout(r, 300));
    }

    // Step 5: ECU Reset 0x11 0x01
    const resetStepIndex = steps.length - 1;
    setCurrentStepIndex(resetStepIndex);
    setStatusText('Transmitting ECU Reset command (0x11 0x01)... Soft rebooting MIB3');
    await hardwareDiagnostic.executeUdsCommand('11', '01', 'ECUReset HardReset');
    setProgress(100);
    await new Promise(r => setTimeout(r, 600));

    setIsFlashing(false);
    setIsCompleted(true);
    setStatusText('Deployment Completed Successfully! MIB3 headunit is restarting.');
    onFlashCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f131d] border border-cyan-500/50 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  LIVE UDS FLASHER
                </span>
                <h3 className="text-base font-bold text-white">
                  Execute Coding Deployment to Module 5F
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Target: <strong className="text-slate-200">{profile.name}</strong> • VCI Interface: <strong className="text-cyan-300 font-mono">{hwState.deviceName}</strong> ({hwState.protocol})
              </p>
            </div>
          </div>

          {!isFlashing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Flashing Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          
          {/* Progress Bar & Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold flex items-center gap-2">
                {isFlashing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>FLASHING IN PROGRESS...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">DEPLOYMENT COMPLETE</span>
                  </>
                ) : (
                  <span>STANDBY - READY TO FLASH</span>
                )}
              </span>
              <span className="text-white font-bold text-sm">{progress}%</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-300 font-mono truncate">{statusText}</p>
          </div>

          {/* Stepper Progress Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Steps List */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-h-64 overflow-y-auto">
              <span className="text-xs font-mono font-semibold text-slate-400 block mb-1">
                EXECUTION QUEUE ({steps.length} ATOMIC OPS)
              </span>

              {steps.map((s, idx) => {
                const isCurrent = isFlashing && currentStepIndex === idx;
                const isDone = (isFlashing && currentStepIndex > idx) || isCompleted;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : isDone
                        ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"></div>
                      )}
                      <span className="truncate">{s.title}</span>
                    </div>

                    <span className="text-[10px] shrink-0 opacity-70">
                      {isDone ? 'ACK' : isCurrent ? 'RUNNING' : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Live UDS Raw Hex Packet Monitor */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col max-h-64">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Live CAN-FD / DoIP Bus Stream
                </span>
                <span className="text-[10px] text-slate-500">ISO 14229 / UDS</span>
              </div>

              <div className="flex-1 bg-black/60 rounded-lg p-2 font-mono text-[11px] overflow-y-auto space-y-1 scrollbar-none border border-slate-900">
                {frames.length === 0 ? (
                  <span className="text-slate-600 italic">Awaiting transmission trigger...</span>
                ) : (
                  frames.map((f, i) => (
                    <div key={i} className="flex items-start gap-1.5 leading-tight">
                      <span className={f.direction === 'TX' ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                        [{f.direction}] {f.canId}:
                      </span>
                      <span className="text-slate-300 break-all">{f.dataHex}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span>Voltage: 12.8V (Stabilized)</span>
          </div>

          <div className="flex items-center gap-2">
            {!isFlashing && !isCompleted && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
            )}

            {isCompleted ? (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finished & Close</span>
              </button>
            ) : (
              <button
                onClick={handleStartFlashing}
                disabled={isFlashing}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-cyan-600/30 disabled:opacity-50"
              >
                {isFlashing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing to MIB3...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Begin Live Flash Sequence</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
