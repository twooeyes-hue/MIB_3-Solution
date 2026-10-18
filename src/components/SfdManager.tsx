import React, { useState, useEffect } from 'react';
import { SfdTokenInfo, VehicleProfile } from '../types/mib3';
import { 
  ShieldCheck, ShieldAlert, Key, Clock, RefreshCw, 
  CheckCircle2, Terminal, AlertTriangle, Lock, Unlock, FileText
} from 'lucide-react';

interface SfdManagerProps {
  currentProfile: VehicleProfile;
  sfdToken: SfdTokenInfo;
  onUpdateToken: (token: SfdTokenInfo) => void;
}

export const SfdManager: React.FC<SfdManagerProps> = ({
  currentProfile,
  sfdToken,
  onUpdateToken
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5400); // 90 minutes
  const [rawChallengeString, setRawChallengeString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (sfdToken.status === 'UNLOCKED') {
      timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            onUpdateToken({ ...sfdToken, status: 'EXPIRED' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sfdToken.status]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleSimulateChallengeRequest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Realistic SFD Challenge structure (UDS Service 0x27 0x01 response)
      const fakeChallenge = `27 01 02 48 38 41 55 5A 5A 5A ${currentProfile.vinSample.substring(0, 8)} 00 5F 88 19 E3 A9 40 12 B8 CD`;
      setRawChallengeString(fakeChallenge);
      setIsGenerating(false);
    }, 600);
  };

  const handleUnlockSession = () => {
    onUpdateToken({
      ...sfdToken,
      status: 'UNLOCKED',
      requestTime: new Date().toLocaleTimeString(),
      expirationTime: new Date(Date.now() + 90 * 60 * 1000).toLocaleTimeString()
    });
    setSecondsRemaining(5400);
  };

  const handleLockSession = () => {
    onUpdateToken({
      ...sfdToken,
      status: 'LOCKED'
    });
    setSecondsRemaining(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Status */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                SCHUTZ FAHRZEUGDIAGNOSE (SFD)
              </span>
              <span className="text-xs text-slate-400 font-mono">VAG Security Spec 1.0 / 2.0</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Module 5F Diagnostic Protection & Token Session
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl font-sans">
              SFD locks adaptation channels and long coding on MIB3 headunits. Without an active unlock token, 
              UDS WriteDataByIdentifier (0x2E) requests return error code <code className="text-amber-400 font-mono">0x33 (Security Access Denied)</code>.
            </p>
          </div>

          {/* Session Timer Card */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 shrink-0 ${
            sfdToken.status === 'UNLOCKED'
              ? 'bg-emerald-950/40 border-emerald-700/60'
              : 'bg-amber-950/40 border-amber-700/60'
          }`}>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              {sfdToken.status === 'UNLOCKED' ? (
                <Unlock className="w-6 h-6 text-emerald-400" />
              ) : (
                <Lock className="w-6 h-6 text-amber-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-slate-400">SESSION STATE:</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  sfdToken.status === 'UNLOCKED' 
                    ? 'bg-emerald-900/60 text-emerald-300' 
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {sfdToken.status}
                </span>
              </div>

              {sfdToken.status === 'UNLOCKED' ? (
                <div className="flex items-center gap-1.5 mt-1 text-emerald-300 font-mono text-sm font-bold">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{formatCountdown(secondsRemaining)} remaining</span>
                </div>
              ) : (
                <span className="text-xs text-amber-400 font-medium block mt-1">
                  0x5F Write Locked
                </span>
              )}
            </div>

            <div className="ml-2">
              {sfdToken.status === 'UNLOCKED' ? (
                <button
                  onClick={handleLockSession}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                >
                  Lock
                </button>
              ) : (
                <button
                  onClick={handleUnlockSession}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors shadow-md shadow-emerald-600/30"
                >
                  Unlock 90m
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Detail: Token Flow & Cryptographic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Token Inspector */}
        <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
            <Key className="w-4 h-4 text-cyan-400" />
            Active Session Security Parameters
          </h3>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Target ECU:</span>
              <span className="text-cyan-300 font-semibold">{sfdToken.targetEcu}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Vehicle VIN:</span>
              <span className="text-white font-semibold">{currentProfile.vinSample}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Tester ID / Login:</span>
              <span className="text-slate-300">{sfdToken.testerId}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Granted Rights Mask:</span>
              <span className="text-emerald-300 text-[11px] truncate max-w-xs">{sfdToken.rightsMask}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Session Expiration:</span>
              <span className="text-amber-300">{sfdToken.expirationTime}</span>
            </div>
          </div>

          {/* Interactive Challenge-Response Generator */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Generate UDS 0x27 Seed Request:
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSimulateChallengeRequest}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Request Challenge from 5F</span>
              </button>

              <button
                onClick={handleUnlockSession}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors"
              >
                Inject Activation Token
              </button>
            </div>

            {rawChallengeString && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 break-all mt-2">
                <span className="text-slate-500 block mb-0.5">// Challenge String:</span>
                {rawChallengeString}
              </div>
            )}
          </div>
        </div>

        {/* Step-by-Step Diagnostic Instructions */}
        <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
            <FileText className="w-4 h-4 text-amber-400" />
            SFD Handling in Common Tools
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-cyan-300 font-semibold block">ODIS-Engineering / ODIS-Service:</strong>
              <p className="text-slate-400 font-sans">
                Requires active GeKo online account or offline token calculation certificate. Navigate to Special Functions &rarr; "Unlock SFD", select Module 005F, and authenticate.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-amber-300 font-semibold block">OBDeleven PRO:</strong>
              <p className="text-slate-400 font-sans">
                OBDeleven holds an official VAG SFD backend license. Enter Control Units &rarr; 5F &rarr; SFD &rarr; Swipe "Unlock SFD automatically" (consumes 0 credits on Ultimate, automatic cloud token generation).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-emerald-300 font-semibold block">Bench / Retrofit Test Benches:</strong>
              <p className="text-slate-400 font-sans">
                When retrofitting an MIB3 unit on a test bench without Gateway 19 online, use a CAN/DoIP Gateway Simulator box or run custom firmware with SFD enforcement disabled.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
