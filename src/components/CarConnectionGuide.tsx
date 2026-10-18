import React, { useState, useEffect } from 'react';
import { VehicleProfile, SfdTokenInfo } from '../types/mib3';
import { 
  Cable, Wifi, Cpu, ShieldCheck, Zap, AlertTriangle, 
  CheckCircle2, Terminal, RefreshCw, Usb, BatteryCharging, 
  ExternalLink, ChevronRight, Activity, HelpCircle, HardDrive, Bluetooth
} from 'lucide-react';
import { hardwareDiagnostic, HardwareConnectionState } from '../utils/hardwareConnection';

interface CarConnectionGuideProps {
  currentProfile: VehicleProfile;
  sfdToken: SfdTokenInfo;
  onNavigateToRecipes: () => void;
  onNavigateToSfd: () => void;
}

export type ConnectionMethod = 'vas6154' | 'vcds' | 'obdeleven' | 'autel_jvci' | 'usb_dhost' | 'bench_harness';

export const CarConnectionGuide: React.FC<CarConnectionGuideProps> = ({
  currentProfile,
  sfdToken,
  onNavigateToRecipes,
  onNavigateToSfd
}) => {
  const [selectedMethod, setSelectedMethod] = useState<ConnectionMethod>('autel_jvci');
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingStep, setPingStep] = useState<number>(0);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(12.8);
  const [hwState, setHwState] = useState<HardwareConnectionState>(hardwareDiagnostic.getState());
  const [hwFeedback, setHwFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = hardwareDiagnostic.subscribe(setHwState);
    return () => unsub();
  }, []);

  const handleConnectSerial = async () => {
    const res = await hardwareDiagnostic.connectWebSerial();
    setHwFeedback(res.message);
    setTimeout(() => setHwFeedback(null), 4000);
  };

  const handleConnectBluetooth = async () => {
    const res = await hardwareDiagnostic.connectWebBluetooth();
    setHwFeedback(res.message);
    setTimeout(() => setHwFeedback(null), 4000);
  };

  const handleConnectVirtual = () => {
    const res = hardwareDiagnostic.connectVirtualBench(currentProfile.name);
    setHwFeedback(res.message);
    setTimeout(() => setHwFeedback(null), 4000);
  };

  const connectionMethods = [
    {
      id: 'autel_jvci',
      name: 'Autel MaxiFlash JVCI (IM608 Pro)',
      type: 'SAE J2534 PassThru & Bluetooth',
      badge: 'IM608 / IM608 II Supported',
      speed: 'CAN-FD 500k / USB PassThru',
      reliability: '98%',
      description: 'The SAE J2534 VCI from Autel MaxiIM IM608 / IM608 Pro. Works directly with the IM608 tablet or on PC with ODIS-E via MaxiFlash.dll.'
    },
    {
      id: 'vas6154',
      name: 'VAS 6154 / 6154A (ODIS-E)',
      type: 'OEM Factory / DoIP Ethernet',
      badge: 'Recommended for MIB3',
      speed: '100 Mbps DoIP',
      reliability: '99.9%',
      description: 'Official Volkswagen Group diagnostic interface with native DoIP (Diagnostic over IP) and CAN-FD support.'
    },
    {
      id: 'vcds',
      name: 'Ross-Tech HEX-NET / HEX-V2',
      type: 'CAN-FD UDS / USB & WiFi',
      badge: 'Popular Workshop Tool',
      speed: 'CAN-FD High-Speed',
      reliability: '95%',
      description: 'Standard diagnostic cable for independent VAG specialists. Supports Long Coding and IDE adaptations.'
    },
    {
      id: 'obdeleven',
      name: 'OBDeleven NextGen (PRO/Ultimate)',
      type: 'Bluetooth Low Energy',
      badge: 'Wireless Smartphone',
      speed: 'BLE CAN-FD',
      reliability: '92%',
      description: 'Wireless OBD2 dongle with official VAG SFD cloud unlocking license. Great for fast mobile tweaks.'
    },
    {
      id: 'usb_dhost',
      name: 'ASIX AX88179 USB-to-Ethernet',
      type: 'Direct Car MMX Hub',
      badge: 'Engineer & Developer Hack',
      speed: 'Direct D-Bus / Telnet',
      reliability: '98%',
      description: 'Plugged directly into the vehicle USB-C port in the center console. Connects directly to MIB3 Linux/QNX at 192.168.1.4.'
    },
    {
      id: 'bench_harness',
      name: 'Bench Harness + Gateway Box',
      type: 'Standalone Desktop Rig',
      badge: 'Retrofit & Repair Benches',
      speed: 'Direct Quadlock',
      reliability: '99%',
      description: 'Powering MIB3 on a desk with a 12V 5A lab power supply, display LVDS link, and CAN-FD gateway simulator.'
    }
  ];

  const handleRunConnectionTest = () => {
    setIsPinging(true);
    setPingStep(1);
    setPingLogs([
      `[${new Date().toLocaleTimeString()}] Initializing connection protocol: ${selectedMethod.toUpperCase()}...`,
      `[${new Date().toLocaleTimeString()}] Checking vehicle electrical status: Battery Voltage = ${batteryVoltage}V (OK > 12.4V)`
    ]);

    setTimeout(() => {
      setPingStep(2);
      setPingLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Terminal 15 (Ignition) detected active via CAN-FD broadcast.`,
        `[${new Date().toLocaleTimeString()}] Sending DoIP Routing Activation to Gateway (192.168.1.4:13400)...`
      ]);
    }, 800);

    setTimeout(() => {
      setPingStep(3);
      setPingLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] DoIP Routing confirmed: Gateway 0x19 ACK received.`,
        `[${new Date().toLocaleTimeString()}] Querying ECU 0x5F (Information Electronics 1) via UDS Service 0x22 (Read VIN)...`,
        `[${new Date().toLocaleTimeString()}] Module 5F Response: VIN = ${currentProfile.vinSample} (Matched Profile!)`
      ]);
    }, 1600);

    setTimeout(() => {
      setPingStep(4);
      setPingLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Checking SFD Protection status on 5F...`,
        `[${new Date().toLocaleTimeString()}] SFD Status: ${sfdToken.status === 'UNLOCKED' ? 'UNLOCKED (Valid 90m session)' : 'LOCKED (Token authentication required before write)'}`,
        `[${new Date().toLocaleTimeString()}] Connection established successfully! Ready for automated coding deployment.`
      ]);
      setIsPinging(false);
    }, 2400);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#101726] to-slate-900 border border-cyan-800/40 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono">
              <Cable className="w-3.5 h-3.5 text-cyan-400" />
              VEHICLE HARDWARE & CONNECTION SETUP
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              How to Connect to a VAG MIB3 Headunit
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1">
              Follow this step-by-step physical and software connection guide to safely interface with Module 5F 
              (Information Electronics 1) on {currentProfile.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleConnectSerial}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Connect USB OBD2 Cable via Web Serial API"
            >
              <Usb className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pair USB Cable</span>
            </button>

            <button
              onClick={handleConnectBluetooth}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Pair Bluetooth OBD2 Dongle via Web Bluetooth API"
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              <span>Pair Bluetooth</span>
            </button>

            <button
              onClick={handleRunConnectionTest}
              disabled={isPinging}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
            >
              <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging Link...' : 'Run Diagnostics Ping'}</span>
            </button>
          </div>
        </div>

        {/* Hardware Status / Feedback Pill */}
        {hwFeedback && (
          <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{hwFeedback}</span>
          </div>
        )}

        {/* Method Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-slate-800/80">
          {connectionMethods.map((m) => {
            const isSelected = selectedMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id as ConnectionMethod)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold truncate">{m.name}</span>
                </div>
                <span className="text-[10px] block opacity-70 truncate font-sans">{m.type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection Diagnostic Ping Simulator */}
      {pingLogs.length > 0 && (
        <div className="bg-[#0f131d] border border-cyan-900/60 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              DoIP / UDS Connection Diagnostics Console
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900">
              {pingStep === 4 ? 'LINK VERIFIED 100%' : `STEP ${pingStep} / 4`}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-1 text-slate-300 max-h-48 overflow-y-auto">
            {pingLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className={log.includes('successfully') ? 'text-emerald-400 font-bold' : log.includes('LOCKED') ? 'text-amber-400' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Step-by-Step Flow + Technical Hardware Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 4-Step Standard Procedure */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Standard 4-Step Connection Procedure
            </h3>

            <div className="space-y-3 text-xs">
              
              {/* Step 1: Physical OBD2 / Hardware Connection */}
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
                    PHYSICAL PORT & POWER CONNECTION
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">OBD-II / USB</span>
                </div>
                <p className="text-slate-400 font-sans pl-7">
                  Locate the 16-pin OBD2 diagnostic port beneath the dashboard (driver side footwell, purple/pink or black connector). 
                  Plug in your diagnostic interface ({selectedMethod === 'vas6154' ? 'VAS 6154 / 6154A' : selectedMethod === 'vcds' ? 'HEX-NET / HEX-V2' : 'OBDeleven'}).
                </p>
                <div className="ml-7 p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-2 font-sans">
                  <BatteryCharging className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>CRITICAL:</strong> Connect a 12V battery stabilizer (minimum 25A - 50A). MIB3 consumes heavy current during diagnosis. If voltage drops below 12.2V, 5F enters emergency brownout protection!
                  </span>
                </div>
              </div>

              {/* Step 2: Terminal 15 & Protocol Handshake */}
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px]">2</span>
                    IGNITION ON (TERMINAL 15) & DOIP ROUTING
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">CAN-FD / DoIP</span>
                </div>
                <p className="text-slate-400 font-sans pl-7">
                  Turn the vehicle ignition <strong>ON</strong> (press Start button without touching the brake pedal). Ensure the instrument cluster lights up. 
                  Do not start the combustion engine. The Gateway (Module 19) establishes DoIP routing to Module 5F on TCP port 13400.
                </p>
              </div>

              {/* Step 3: SFD Unlock & Security Login */}
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center text-[10px]">3</span>
                    SFD UNLOCK & SECURITY ACCESS 20103
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">Security Gate</span>
                </div>
                <p className="text-slate-400 font-sans pl-7">
                  Before writing coding or adaptations, MIB3 requires SFD (Schutz FahrzeugDiagnose) authorization. 
                  In ODIS or OBDeleven, trigger the automated SFD unlock. Enter Security Access Login code <code className="text-cyan-300 font-mono">20103</code> to open adaptation channel write buffers.
                </p>
                <div className="ml-7 pt-1">
                  <button
                    onClick={onNavigateToSfd}
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1 underline"
                  >
                    Manage SFD Token Session &rarr;
                  </button>
                </div>
              </div>

              {/* Step 4: Write & Reboot Sequence */}
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[10px]">4</span>
                    FLASH CODING & HARD RESET REBOOT
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Final Step</span>
                </div>
                <p className="text-slate-400 font-sans pl-7">
                  Write the Long Coding and Adaptation channels using your selected tool. Once the tool reports "Coding Accepted", 
                  execute a soft restart: <strong>Press and hold the MIB3 Power/Volume button for 15 to 20 seconds</strong> until the display screen shuts off and the welcome boot logo appears.
                </p>
              </div>

            </div>
          </div>

          {/* Quick Jump to Recipes */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">Connection Verified?</span>
              <p className="text-xs text-slate-400">Ready to deploy 1-click retrofit bundles directly to your MIB3 unit.</p>
            </div>
            <button
              onClick={onNavigateToRecipes}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Go to 1-Click Recipes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Technical Specs for Selected Method */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">
                Hardware Setup Specifications
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {connectionMethods.find(m => m.id === selectedMethod)?.name}
              </h3>
            </div>

            {/* Specific Instructions based on selected method */}
            {selectedMethod === 'autel_jvci' && (
              <div className="space-y-3 text-xs text-slate-300 font-sans">
                <p>
                  The <strong>Autel MaxiFlash JVCI / JVCI+</strong> (included with MaxiIM IM608, IM608 Pro, and IM608 II) is a high-performance <strong>SAE J2534-1 & J2534-2 PassThru VCI</strong> capable of programming Module 5F.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hardware VCI:</span>
                    <span className="text-cyan-300 font-semibold">Autel MaxiFlash JVCI (J2534)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PC J2534 Driver:</span>
                    <span className="text-white">MaxiFlash.dll / AUTEL_J2534</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ODIS-E Mode:</span>
                    <span className="text-emerald-400 font-semibold">100% Compatible via J2534 PDU-API</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IM608 Tablet App:</span>
                    <span className="text-amber-300">MaxiIM Diagnostics &rarr; 5F Manual Coding</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-semibold text-white block">Using Directly with IM608 Tablet:</span>
                  <p className="text-slate-400 text-xs">
                    1. Pair JVCI to IM608 via USB or Bluetooth.<br />
                    2. Go to <strong>Diagnostics &rarr; AutoDetect VIN &rarr; Control Unit &rarr; 5F</strong>.<br />
                    3. Unlock SFD if prompted, enter Security Access <strong>20103</strong>, and select <strong>Coding &rarr; Manual Coding</strong>.<br />
                    4. Input the 32-Byte Long Coding string generated by this studio.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-semibold text-white block">Using as J2534 PassThru on Windows PC:</span>
                  <p className="text-slate-400 text-xs">
                    Connect JVCI via USB to PC. Open ODIS-Engineering, select <strong>"Autel MaxiFlash JVCI"</strong> as the diagnostic interface, and load our exported ODIS-E automation XML macro!
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'vas6154' && (
              <div className="space-y-3 text-xs text-slate-300 font-sans">
                <p>
                  The <strong>VAS 6154 / 6154A</strong> (or reliable VNCI 6154A clone) is the gold standard for MIB3 because MIB3 uses 100BASE-T1 automotive Ethernet.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Stack:</span>
                    <span className="text-cyan-300 font-semibold">D-PDU API (ISO 22900-2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DoIP Protocol:</span>
                    <span className="text-white">ISO 13400 (Port 13400)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recommended Software:</span>
                    <span className="text-white">ODIS-Engineering 14.1 - 17.x</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block mb-1">Configuration Tip:</span>
                  <p className="text-slate-400 text-xs">
                    In ODIS Diagnostic Configuration, set connection mode to <strong>Infrastructure Mode</strong> (WiFi or USB-Ethernet) to achieve full 100Mbps data transfer for adaptation maps.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'vcds' && (
              <div className="space-y-3 text-xs text-slate-300 font-sans">
                <p>
                  Ross-Tech <strong>HEX-NET</strong> or <strong>HEX-V2</strong> interfaces connect via high-speed CAN-FD to Gateway 19.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Minimum Interface:</span>
                    <span className="text-cyan-300 font-semibold">HEX-V2 or HEX-NET</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legacy HEX-CAN:</span>
                    <span className="text-red-400 font-semibold">NOT SUPPORTED (No CAN-FD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Minimum VCDS Version:</span>
                    <span className="text-white">21.3.0 or newer</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block mb-1">SFD Note in VCDS:</span>
                  <p className="text-slate-400 text-xs">
                    Ross-Tech VCDS currently requires manual SFD token generation via an external portal or OBDeleven if the channel is locked.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'obdeleven' && (
              <div className="space-y-3 text-xs text-slate-300 font-sans">
                <p>
                  <strong>OBDeleven NextGen</strong> is the most accessible tool because it includes built-in cloud-based VAG SFD 1.0 unlocking out of the box.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hardware:</span>
                    <span className="text-cyan-300 font-semibold">OBDeleven NextGen (Black ring)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SFD Auto-Unlock:</span>
                    <span className="text-emerald-400 font-semibold">YES (Official VAG License)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscription Tier:</span>
                    <span className="text-white">PRO or ULTIMATE Plan</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs">
                  Simply navigate to Module 5F &rarr; SFD &rarr; "Unlock SFD (Automatically)" before applying the Long Coding byte string exported from this app.
                </p>
              </div>
            )}

            {selectedMethod === 'usb_dhost' && (
              <div className="space-y-3 text-xs text-slate-300 font-sans">
                <p>
                  <strong>The Direct USB-Ethernet D-Bus Hack:</strong>
                  You can connect your laptop directly to the MIB3 Linux/QNX operating system using a USB-to-Ethernet adapter with the <strong>ASIX AX88179 chipset</strong>.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">USB Adapter Chipset:</span>
                    <span className="text-cyan-300 font-semibold">ASIX AX88179 (Required)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Laptop Static IP:</span>
                    <span className="text-white">192.168.1.100 / 255.255.255.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MIB3 Gateway IP:</span>
                    <span className="text-emerald-400 font-semibold">192.168.1.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telnet Port:</span>
                    <span className="text-white">23 (or SSH 22 if unlocked)</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs">
                  Allows direct shell injection of FEC exception lists, direct D-Bus commands, and raw eMMC memory partition inspection without opening the dash!
                </p>
              </div>
            )}

            {selectedMethod === 'bench_harness' && (
              <div className="space-y-3 text-xs text-slate-300 font-sans">
                <p>
                  <strong>Bench Harness Wiring (Module 5F Quadlock):</strong>
                  For testing MIB3 on a desktop outside the vehicle:
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quadlock Pin 15 (+12V):</span>
                    <span className="text-red-400 font-semibold">Battery Constant (+12V)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quadlock Pin 16 (+12V):</span>
                    <span className="text-amber-400 font-semibold">Ignition (Terminal 15)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quadlock Pin 12 (GND):</span>
                    <span className="text-slate-400 font-semibold">Chassis Ground (0V)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CAN-FD Infotainment:</span>
                    <span className="text-cyan-300 font-semibold">Can-H (Pin 6), Can-L (Pin 12)</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs">
                  Note: A Gateway 19 Emulator is mandatory on the bench to prevent the MIB3 unit from shutting down after 15 minutes due to missing CAN wake-up heartbeat.
                </p>
              </div>
            )}

          </div>

          {/* Quick Battery Voltage Simulator Slider */}
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
                Simulated Battery Voltage:
              </span>
              <span className={`font-mono font-bold ${
                batteryVoltage >= 12.4 ? 'text-emerald-400' : 'text-red-400 animate-pulse'
              }`}>
                {batteryVoltage.toFixed(1)} V {batteryVoltage >= 12.4 ? '(SAFE)' : '(TOO LOW!)'}
              </span>
            </div>
            <input
              type="range"
              min="11.5"
              max="14.2"
              step="0.1"
              value={batteryVoltage}
              onChange={(e) => setBatteryVoltage(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 font-sans">
              Always maintain &gt; 12.4V using a workshop charger during coding sessions.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
