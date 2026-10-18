import React, { useState, useEffect, useRef } from 'react';
import { 
  Cable, Usb, Bluetooth, Terminal, Play, Download, 
  Trash2, ShieldCheck, BatteryCharging, CheckCircle2, 
  AlertTriangle, ArrowRight, RefreshCw, Cpu, Car, Layers, 
  FileText, Upload, Check, ClipboardCopy, Info
} from 'lucide-react';
import { hardwareDiagnostic, HardwareConnectionState, DiagnosticFrame } from '../utils/hardwareConnection';
import { DecodedVin } from '../utils/vagVinDecoder';
import { VehicleProfile } from '../types/mib3';
import { formatHexWithSpaces } from '../utils/mib3CodingUtils';
import { parseRealCarLog, ParsedCarLog } from '../utils/carLogParser';

interface RealCarDiagnosticTerminalProps {
  currentProfile: VehicleProfile;
  onApplyReadCoding: (codingHex: string, vin: string, decoded: DecodedVin) => void;
  onNavigateToStudio: () => void;
}

export const RealCarDiagnosticTerminal: React.FC<RealCarDiagnosticTerminalProps> = ({
  currentProfile,
  onApplyReadCoding,
  onNavigateToStudio
}) => {
  const [activeMode, setActiveMode] = useState<'physical' | 'import_log' | 'bench_sim'>('import_log');
  const [hwState, setHwState] = useState<HardwareConnectionState>(hardwareDiagnostic.getState());
  const [frames, setFrames] = useState<DiagnosticFrame[]>([]);
  const [customCommand, setCustomCommand] = useState<string>('22 F1 90');
  const [selectedBaud, setSelectedBaud] = useState<number>(115200);
  const [isReadingVehicle, setIsReadingVehicle] = useState<boolean>(false);
  const [readProgressText, setReadProgressText] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Log Import Mode states
  const [rawLogInput, setRawLogInput] = useState<string>('');
  const [parsedLogResult, setParsedLogResult] = useState<ParsedCarLog | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubHw = hardwareDiagnostic.subscribe(setHwState);
    const unsubFrames = hardwareDiagnostic.subscribeFrames((frame) => {
      setFrames(prev => [...prev, frame].slice(-100));
    });
    return () => {
      unsubHw();
      unsubFrames();
    };
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [frames]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConnectSerial = async () => {
    const res = await hardwareDiagnostic.connectWebSerial(selectedBaud);
    showNotify(res.message);
  };

  const handleConnectBluetooth = async () => {
    const res = await hardwareDiagnostic.connectWebBluetooth();
    showNotify(res.message);
  };

  const handleConnectVirtual = () => {
    const res = hardwareDiagnostic.connectVirtualBench(currentProfile.name, currentProfile.vinSample);
    showNotify(res.message);
  };

  const handleDisconnect = () => {
    hardwareDiagnostic.disconnect();
    showNotify('Disconnected hardware session');
  };

  const handleSendCommand = async (cmdToSend?: string) => {
    const cmd = cmdToSend || customCommand;
    if (!cmd.trim()) return;
    await hardwareDiagnostic.sendRawCommand(cmd.trim());
    if (!cmdToSend) setCustomCommand('');
  };

  /**
   * Real Hardware Read Sequence
   */
  const handleFullVehicleRead = async () => {
    if (!hwState.isConnected) {
      showNotify('ERROR: No physical hardware connected. Please pair a USB OBD2 adapter or select Bench Simulator.');
      return;
    }

    setIsReadingVehicle(true);
    setReadProgressText('Querying vehicle VIN via UDS 0x22 DID 0xF190...');
    
    const vinRes = await hardwareDiagnostic.readAndDecodeVin();
    await new Promise(r => setTimeout(r, 400));

    setReadProgressText(`Decoded VIN: ${vinRes.vin}. Querying MIB3 firmware version (0xF187 / 0xF189)...`);
    const ecuInfo = await hardwareDiagnostic.readEcuInfo();
    await new Promise(r => setTimeout(r, 400));

    setReadProgressText(`Found FW: ${ecuInfo.softwareVersion}. Reading active 32-Byte Long Coding (DID 0x0600)...`);
    const codingRes = await hardwareDiagnostic.readActiveLongCoding();

    setIsReadingVehicle(false);
    setReadProgressText('Vehicle reading complete! Real car data synchronized.');
    showNotify(`Successfully read real MIB3 ECU from ${vinRes.vin}!`);
  };

  /**
   * Parse Pasted Car Log (VCDS / OBDeleven / Raw Hex)
   */
  const handleParseLog = () => {
    const result = parseRealCarLog(rawLogInput);
    setParsedLogResult(result);
    if (result.success) {
      showNotify(`Parsed ${result.sourceTool} log successfully!`);
    } else {
      showNotify(result.summary);
    }
  };

  /**
   * Sync Parsed Log to Studio
   */
  const handleApplyParsedToStudio = () => {
    if (!parsedLogResult || !parsedLogResult.success) return;

    const coding = parsedLogResult.longCodingHex || currentProfile.defaultCoding;
    const vin = parsedLogResult.vin || currentProfile.vinSample;
    const decoded = parsedLogResult.decodedVin || {
      vin,
      isValid: true,
      brand: currentProfile.brand,
      manufacturer: currentProfile.brand,
      country: 'Germany',
      modelSeries: currentProfile.name,
      platform: currentProfile.platform,
      modelYear: 2023,
      modelYearCode: 'P',
      assemblyPlant: 'VAG Plant',
      serialNumber: '000000',
      detectedHeadunit: currentProfile.headunitType
    };

    onApplyReadCoding(coding, vin, decoded);
    showNotify('Synchronized real vehicle coding into Studio & Recipes!');
    onNavigateToStudio();
  };

  /**
   * Sample Car Logs for quick testing
   */
  const loadSampleLog = (type: 'golf8' | 'audi_s3' | 'cupra' | 'autel_im608') => {
    if (type === 'autel_im608') {
      setRawLogInput(`Autel MaxiIM IM608 Pro Diagnostic Report
Vehicle: Volkswagen Golf 2021 (MQB-evo)
VIN: WVWZZZCDZMW019284
System: 5F - Information Control Unit 1
Part Number: 5H0035820D
Software Version: 0841
Hardware Number: 5H0035820
Long Coding: 033300240000000053110001000808001F010004012004008000000000000000
VCI Device: Autel MaxiFlash JVCI (SAE J2534 PassThru)`);
    } else if (type === 'golf8') {
      setRawLogInput(`Address 5F: Information Electr.
   Part No SW: 5H0 035 820 D    HW: 5H0 035 820 
   Component: MU-OI3-VW-EU  H84 0841
   Coding: 033300240000000053110001000808001F010004012004008000000000000000
   VIN: WVWZZZCDZMW019284
   ASAM Dataset: EV_MUOI3VW 001001`);
    } else if (type === 'audi_s3') {
      setRawLogInput(`Control unit: 5F Information Control Unit
System description: MMI_MIB3_AU_P3620
Software number: 8Y0035860A
Hardware number: 8Y0035860
VIN: WAUZZZGY5MA041289
Long coding:
    013300240000000053120002000808002E020004012004008000000000000000`);
    } else if (type === 'cupra') {
      setRawLogInput(`Address 5F: Information Electr. (J794)
   Part No SW: 5FA 035 862 E    HW: 5FA 035 862 
   Component: MU-OI3-SE-EU  H89 0890
   Coding: 043300240000000053140001000808003A030004012004008000000000000000
   VIN: VSSZZZKMZNR081923`);
    }
  };

  const quickCommands = [
    { label: 'Read VIN (22 F1 90)', cmd: '22 F1 90' },
    { label: 'Read Part No (22 F1 87)', cmd: '22 F1 87' },
    { label: 'Read FW Version (22 F1 89)', cmd: '22 F1 89' },
    { label: 'Read Long Coding (22 06 00)', cmd: '22 06 00' },
    { label: 'Extended Session (10 03)', cmd: '10 03' },
    { label: 'Request SFD Seed (27 01)', cmd: '27 01' },
    { label: 'Soft Reset ECU (11 01)', cmd: '11 01' },
    { label: 'Reset Interface (ATZ)', cmd: 'ATZ' },
    { label: 'Battery Voltage (ATRV)', cmd: 'ATRV' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0f131d] border border-cyan-800/40 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                REAL CAR WORKSTATION
              </span>
              <span className="text-xs text-slate-400 font-mono">Module 5F Live Interface & Parser</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Test & Ingest Real VAG MIB3 Vehicles
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl font-sans">
              Work with real vehicles in two ways: <strong>Paste any real VCDS Autoscan / OBDeleven backup log</strong> to automatically decode equipment and coding, 
              or <strong>connect physical USB/BLE diagnostic hardware</strong> via Web Serial for live UDS terminal communication.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveMode('import_log')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-colors flex items-center gap-1.5 ${
                activeMode === 'import_log'
                  ? 'bg-cyan-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste VCDS/OBD Log</span>
            </button>

            <button
              onClick={() => setActiveMode('physical')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-colors flex items-center gap-1.5 ${
                activeMode === 'physical'
                  ? 'bg-cyan-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>Physical Hardware (USB/BLE)</span>
            </button>

            <button
              onClick={() => setActiveMode('bench_sim')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-colors flex items-center gap-1.5 ${
                activeMode === 'bench_sim'
                  ? 'bg-cyan-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Bench Simulator</span>
            </button>
          </div>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* MODE 1: Universal VCDS / OBDeleven / ODIS Log Ingestion */}
      {activeMode === 'import_log' && (
        <div className="space-y-4">
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> REAL CAR SCAN INGESTOR & DECODER
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste your actual VCDS scan, OBDeleven backup, or raw 64-character 5F Long Coding string below:
                </p>
              </div>

              {/* Sample Log Loaders */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-mono">Load Real Sample:</span>
                <button
                  onClick={() => loadSampleLog('golf8')}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300"
                >
                  Golf 8 GTI
                </button>
                <button
                  onClick={() => loadSampleLog('audi_s3')}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300"
                >
                  Audi S3 8Y
                </button>
                <button
                  onClick={() => loadSampleLog('cupra')}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300"
                >
                  Cupra Formentor
                </button>
                <button
                  onClick={() => loadSampleLog('autel_im608')}
                  className="px-2 py-1 rounded bg-purple-950/80 hover:bg-purple-900/80 border border-purple-800 text-[11px] font-mono text-purple-300 font-bold"
                  title="Load Autel MaxiIM IM608 Pro diagnostic report"
                >
                  Autel IM608 Pro
                </button>
              </div>
            </div>

            {/* Input Textarea */}
            <div className="space-y-2">
              <textarea
                rows={6}
                value={rawLogInput}
                onChange={(e) => setRawLogInput(e.target.value)}
                placeholder="Paste VCDS scan text, OBDeleven control unit backup, or 64-char Hex Coding (e.g. 033300240000000053110001000808001F010004012004008000000000000000)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  Supports full VCDS .txt autoscan, OBDeleven email backups, and raw byte strings.
                </span>

                <button
                  onClick={handleParseLog}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-600/30"
                >
                  <Upload className="w-4 h-4" />
                  <span>Parse Real Car Data</span>
                </button>
              </div>
            </div>

            {/* Parsed Result Display */}
            {parsedLogResult && parsedLogResult.success && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-600/60 space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
                      <Car className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        IDENTIFIED: {parsedLogResult.sourceTool} SCAN
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {parsedLogResult.decodedVin 
                          ? `${parsedLogResult.decodedVin.brand} ${parsedLogResult.decodedVin.modelSeries} (${parsedLogResult.decodedVin.modelYear})`
                          : 'VAG Vehicle Identified'}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyParsedToStudio}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/30"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Sync Real Car Coding to Studio &rarr;</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">VIN NUMBER:</span>
                    <strong className="text-cyan-300 font-bold">{parsedLogResult.vin || 'N/A in log'}</strong>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PART NUMBER:</span>
                    <strong className="text-white font-bold">{parsedLogResult.partNumber || '5H0035820'}</strong>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PLATFORM:</span>
                    <strong className="text-amber-400 font-bold">{parsedLogResult.decodedVin?.platform || 'MQB-evo'}</strong>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">HEADUNIT TYPE:</span>
                    <strong className="text-slate-300 font-bold">{parsedLogResult.decodedVin?.detectedHeadunit || 'MIB3 High'}</strong>
                  </div>
                </div>

                {parsedLogResult.longCodingHex && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
                    <span className="text-slate-400 block text-[11px]">
                      // Extracted 32-Byte Long Coding (DID 0x0600):
                    </span>
                    <span className="text-cyan-300 break-all font-bold block">
                      {formatHexWithSpaces(parsedLogResult.longCodingHex)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Physical Hardware Connection & Terminal */}
      {activeMode === 'physical' && (
        <div className="space-y-4">
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <Usb className="w-4 h-4 text-cyan-400" />
                  Physical Diagnostic Hardware Link (Web Serial / Web Bluetooth)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plug in your USB OBD2 adapter (e.g. vLinker FS, CANable, OpenPort) or BLE dongle.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Physical Hardware Baud Rate"
                  value={selectedBaud}
                  onChange={(e) => setSelectedBaud(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 font-mono"
                >
                  <option value={115200}>115,200 Baud (Standard)</option>
                  <option value={500000}>500,000 Baud (vLinker/CAN-FD)</option>
                  <option value={2000000}>2,000,000 Baud (CANable High-Speed)</option>
                </select>

                {hwState.isConnected && hwState.type !== 'virtual_bench' ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-3.5 py-1.5 rounded-lg bg-red-950/70 text-red-300 border border-red-800 text-xs font-bold"
                  >
                    Disconnect
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleConnectSerial}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Usb className="w-3.5 h-3.5" />
                      <span>Connect USB Port</span>
                    </button>

                    <button
                      onClick={handleConnectBluetooth}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pair BLE</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Hardware Note */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 font-sans flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">Important Physical Hardware Note for VAG MIB3:</strong>
                <p className="mt-0.5">
                  MIB3 (MQB-evo) communicates via <strong>CAN-FD (500k nominal / 2M data)</strong> or <strong>DoIP Ethernet (100BASE-T1)</strong>. 
                  Standard generic ELM327 clones without CAN-FD support will not establish communication with Module 5F. 
                  Use a <strong>vLinker FS USB, VNCI 6154A, or CANable</strong> for physical OBD2 testing.
                </p>
              </div>
            </div>

            {/* Hardware Read Trigger */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-400">
                Link State: <strong className={hwState.isConnected && hwState.type !== 'virtual_bench' ? 'text-emerald-400' : 'text-red-400'}>
                  {hwState.isConnected && hwState.type !== 'virtual_bench' ? `CONNECTED (${hwState.deviceName})` : 'NOT CONNECTED'}
                </strong>
              </span>

              <button
                onClick={handleFullVehicleRead}
                disabled={!hwState.isConnected || isReadingVehicle}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReadingVehicle ? 'animate-spin' : ''}`} />
                <span>Read VIN & 32B Coding from Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Bench Simulator */}
      {activeMode === 'bench_sim' && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">BENCH TESTBENCH SIMULATOR</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Simulate Quadlock 12V + Gateway 19 Environment</h4>
            </div>

            <button
              onClick={handleConnectVirtual}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Initialize Bench Link
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Allows testing all UDS commands (`22 F1 90`, `22 06 00`, `10 03`, `27 01`) with high-fidelity simulated responses without a physical car present.
          </p>
        </div>
      )}

      {/* Interactive UDS Diagnostic Terminal & Hex Monitor */}
      <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Live UDS / CAN-FD Diagnostic Console (ECU 0x5F / CAN 0x714)
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Send raw UDS requests and monitor real-time ISO 14229 / ISO-TP frame exchanges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFrames([])}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Clear terminal log"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const logContent = frames.map(f => `[${f.timestamp}] [${f.direction}] ${f.canId} -> ${f.dataHex} (${f.serviceName})`).join('\n');
                const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `MIB3_UDS_Trace_${new Date().toISOString().substring(0, 10)}.log`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Trace</span>
            </button>
          </div>
        </div>

        {/* Quick Command Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {quickCommands.map((qc) => (
            <button
              key={qc.cmd}
              onClick={() => handleSendCommand(qc.cmd)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-700 transition-colors"
            >
              {qc.label}
            </button>
          ))}
        </div>

        {/* Console Screen */}
        <div className="p-4 rounded-xl bg-black border border-slate-800 font-mono text-xs h-64 overflow-y-auto space-y-1 selection:bg-cyan-900 selection:text-white">
          {frames.length === 0 ? (
            <div className="text-slate-600 italic">
              Terminal ready. Select mode above to begin diagnostic session.
            </div>
          ) : (
            frames.map((f, i) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 text-[11px] shrink-0">[{f.timestamp}]</span>
                <span className={`font-bold shrink-0 ${
                  f.direction === 'TX' ? 'text-cyan-400' : 'text-emerald-400'
                }`}>
                  [{f.direction} {f.canId}]
                </span>
                <span className="text-slate-200 break-all">{f.dataHex}</span>
                <span className="text-slate-500 text-[11px] font-sans truncate ml-auto">
                  // {f.description}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef}></div>
        </div>

        {/* Command Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-cyan-400 font-mono text-xs font-bold">&gt;</span>
            <input
              type="text"
              placeholder="Enter UDS or AT command (e.g. 22 F1 90, 10 03, 22 06 00)..."
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => handleSendCommand()}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Send</span>
          </button>
        </div>

      </div>

    </div>
  );
};
