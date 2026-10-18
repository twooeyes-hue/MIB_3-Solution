import React, { useState } from 'react';
import { Cpu, Shield, Layers, HardDrive, Network, Zap, CheckCircle2, ArrowRight, Server, Terminal, Lock, ChevronRight } from 'lucide-react';
import { VehicleProfile } from '../types/mib3';

interface ArchitectureViewProps {
  currentProfile: VehicleProfile;
  onNavigateToRecipes: () => void;
  onNavigateToLongCoding: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  currentProfile,
  onNavigateToRecipes,
  onNavigateToLongCoding
}) => {
  const [selectedLayer, setSelectedLayer] = useState<'hardware' | 'os' | 'security' | 'diagnostic' | 'app_pipeline'>('app_pipeline');

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining the Architecture Solution */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-800/40 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
              SYSTEM ARCHITECTURE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              VAG MIB3 Headunit Diagnostic & Automated Coding Architecture
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl">
              Tired of 40 manual steps, cryptic adaptation channels, and bricked SFD lockouts? 
              Here is the blueprint for how modern automated coding replaces error-prone manual VCDS/OBDeleven tweaking with an atomic state-driven pipeline.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNavigateToRecipes}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
            >
              <span>Launch 1-Click Recipes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layer Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6 pt-5 border-t border-slate-800">
          {[
            { id: 'app_pipeline', label: '1. App Coding Pipeline', icon: Zap },
            { id: 'security', label: '2. SFD & Security Layer', icon: Shield },
            { id: 'diagnostic', label: '3. UDS / DoIP Bus Stack', icon: Network },
            { id: 'os', label: '4. QNX / Linux OS Stack', icon: Layers },
            { id: 'hardware', label: '5. SoC & Hardware Modules', icon: HardDrive },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedLayer === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedLayer(item.id as any)}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Architecture Diagram & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual System Topology Diagram */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-cyan-400" />
              MIB3 Topology & Data Flow Map
            </h3>

            {/* Diagram Blocks */}
            <div className="space-y-3 font-mono text-xs">
              
              {/* Level 1: Diagnostic Tool / Client Interface */}
              <div className="p-3 rounded-lg border border-cyan-500/40 bg-cyan-950/20">
                <div className="flex items-center justify-between text-cyan-300 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> CLIENT LAYER (MIB3 Coding Studio)
                  </span>
                  <span className="text-[10px] bg-cyan-900/60 px-1.5 py-0.5 rounded text-cyan-200">ISO 14229 / UDS</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Automated Recipe Engine converts high-level intents into atomic 32-Byte Long Coding and Adaptation sequences.
                </p>
              </div>

              {/* Connector */}
              <div className="flex justify-center text-slate-600">
                <div className="h-4 w-0.5 bg-cyan-500/40 animate-pulse"></div>
              </div>

              {/* Level 2: Gateway & SFD Protection */}
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-950/20">
                <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> MODULE 19: DIAGNOSTIC GATEWAY & SFD
                  </span>
                  <span className="text-[10px] bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-200">DoIP / CAN-FD</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Validates SFD 1.0/2.0 Challenge-Response token. Authorizes 90-minute write access to protected 0x5F endpoints.
                </p>
              </div>

              {/* Connector */}
              <div className="flex justify-center text-slate-600">
                <div className="h-4 w-0.5 bg-amber-500/40 animate-pulse"></div>
              </div>

              {/* Level 3: MIB3 Headunit Core (Module 5F) */}
              <div className="p-3.5 rounded-lg border border-purple-500/40 bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> MODULE 0x5F: MIB3 INFORMATION ELECTRONICS
                  </span>
                  <span className="text-[10px] bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-200 font-mono">
                    {currentProfile.headunitType}
                  </span>
                </div>
                
                {/* Sub components inside 5F */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-700/80">
                    <span className="text-cyan-400 font-semibold block text-[11px]">Long Coding (32B)</span>
                    <span className="text-slate-400 text-[10px] font-sans">Byte 00-31 Bitmasks (CarPlay, Brand, Display, DSP)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-700/80">
                    <span className="text-amber-400 font-semibold block text-[11px]">Adaptations (IDE)</span>
                    <span className="text-slate-400 text-[10px] font-sans">BAP 0x3E Sport HMI, 0x08 Ambient, WLAN 5GHz</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-700/80">
                    <span className="text-emerald-400 font-semibold block text-[11px]">FEC / SWaP</span>
                    <span className="text-slate-400 text-[10px] font-sans">fec_container.fec licenses (00060800, 00040100)</span>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center text-slate-600">
                <div className="h-4 w-0.5 bg-purple-500/40"></div>
              </div>

              {/* Level 4: Peripheral Bus Sync */}
              <div className="p-3 rounded-lg border border-slate-700 bg-slate-900/60">
                <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-emerald-400" /> BAP BUS / PERIPHERAL SYNC
                  </span>
                  <span className="text-[10px] text-slate-400">100BASE-T1 Ethernet</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-[11px] p-1.5 rounded bg-slate-800/70 border border-slate-700/60">
                    <span className="text-slate-300 font-semibold">Module 17 (Virtual Cockpit)</span>
                    <p className="text-[10px] text-slate-400 font-sans">H.264 map video streaming & tachometer sync</p>
                  </div>
                  <div className="text-[11px] p-1.5 rounded bg-slate-800/70 border border-slate-700/60">
                    <span className="text-slate-300 font-semibold">Module 09 (BCM Central Electrics)</span>
                    <p className="text-[10px] text-slate-400 font-sans">30-color ambient RGB LED door cards</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Architecture Principles / Why Manual Fails */}
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Why Engineers Get Exhausted with Manual Coding:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 space-y-1">
                <span className="font-semibold text-red-300 flex items-center gap-1">
                  ✕ The Manual Coding Nightmare:
                </span>
                <ul className="text-slate-400 space-y-1 pl-4 list-disc font-sans">
                  <li>20-40 individual clicks per feature in VCDS/OBDeleven.</li>
                  <li>Cryptic channel names like <code className="text-red-300 font-mono">ENG122229-ENG...</code>.</li>
                  <li>SFD timeout kicks in mid-procedure, causing partial brick.</li>
                  <li>No version control or 1-click rollback if screen goes black.</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  ✓ The Automated Solution:
                </span>
                <ul className="text-slate-400 space-y-1 pl-4 list-disc font-sans">
                  <li>Atomic transaction bundles: flips bytes and adaptations simultaneously.</li>
                  <li>Auto-managed SFD session lifecycle with token validation.</li>
                  <li>Live bit-inspector with verified OEM byte semantics.</li>
                  <li>Instant multi-tool export: ODIS-E XML, VCDS, or direct UDS.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deep Layer Technical Details */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-lg">
            
            {/* Header of selected layer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase">
                {selectedLayer === 'app_pipeline' && '1. App Coding Pipeline Architecture'}
                {selectedLayer === 'security' && '2. SFD 1.0 & 2.0 Security Specifications'}
                {selectedLayer === 'diagnostic' && '3. UDS & DoIP Diagnostic Protocol Stack'}
                {selectedLayer === 'os' && '4. QNX & Linux Hypervisor Architecture'}
                {selectedLayer === 'hardware' && '5. MIB3 Hardware Components & SoC'}
              </h3>
            </div>

            {/* Layer content */}
            {selectedLayer === 'app_pipeline' && (
              <div className="space-y-4 text-xs text-slate-300">
                <p>
                  The core philosophy behind this application is <strong>Declarative State Management for Automotive Infotainment</strong>. 
                  Instead of imperatively modifying bits one by one, the engineer declares target capabilities (e.g. "Wireless CarPlay + RS HMI + 30 Colors"), 
                  and the engine computes the minimal diff against the active stock firmware.
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white font-mono flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400" /> Key Pipeline Stages:
                  </h4>
                  <div className="space-y-2 pl-2">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <strong className="text-cyan-300">1. Vehicle Profile Resolution:</strong>
                      <p className="text-slate-400 mt-0.5 font-sans">Identifies platform (MQB-evo vs MLB-evo) and OEM brand personality (VW, Audi, Cupra) to prevent incompatible bit flips.</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <strong className="text-amber-300">2. Conflict Detection Engine:</strong>
                      <p className="text-slate-400 mt-0.5 font-sans">Detects mutual exclusions (e.g. attempting to enable external MOST DSP while keeping internal 4-ch amp bit active).</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <strong className="text-emerald-300">3. SFD Token Handshake:</strong>
                      <p className="text-slate-400 mt-0.5 font-sans">Interrogates Gateway 19 to confirm write authorization before firing ISO 14229 Service 0x2E commands.</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <strong className="text-purple-300">4. Multi-Target Code Generation:</strong>
                      <p className="text-slate-400 mt-0.5 font-sans">Outputs byte streams natively into ODIS-E automation XML, VCDS Long Coding strings, or OBDeleven instructions.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onNavigateToLongCoding}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-cyan-800/40 text-center transition-colors"
                  >
                    Explore 32-Byte Long Coding Matrix
                  </button>
                </div>
              </div>
            )}

            {selectedLayer === 'security' && (
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  <strong>Schutz FahrzeugDiagnose (SFD)</strong> was introduced in VAG MQB-evo vehicles (Golf 8, Audi A3 8Y, Formentor, Octavia 4) 
                  to prevent unauthorized modifications to safety and security-critical ECUs, especially Module 5F.
                </p>

                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 space-y-2">
                  <span className="font-semibold text-amber-200">The 2-Stage Challenge/Response:</span>
                  <ol className="list-decimal pl-4 space-y-1 font-sans text-slate-300">
                    <li>Tester sends UDS request: <code className="text-amber-300 font-mono">27 01</code> (Seed Request).</li>
                    <li>Module 5F replies with a 48-byte cryptographic Challenge Token containing VIN, Tester ID, and Timestamp.</li>
                    <li>Activation token is generated via RSA-2048 signing with VAG backend certificate.</li>
                    <li>Tester transmits response: <code className="text-amber-300 font-mono">27 02 [Token]</code>.</li>
                    <li>5F unlocks for exactly <strong>90 minutes</strong>.</li>
                  </ol>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-200 font-semibold block">Bench Harness Bypass:</span>
                  <p className="text-slate-400 font-sans mt-1">
                    On a standalone bench setup without an online GeKo gateway, developers use a patched gateway emulator or pre-unlocked developer firmware to bypass the SFD check.
                  </p>
                </div>
              </div>
            )}

            {selectedLayer === 'diagnostic' && (
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Diagnostic communication with MIB3 occurs via <strong>DoIP (Diagnostic over Internet Protocol - ISO 13400)</strong> 
                  over 100BASE-T1 automotive Ethernet, bridged by Gateway 19 to standard CAN-FD.
                </p>

                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">DoIP Port:</span>
                    <span className="text-cyan-300 font-bold">13400 (TCP/UDP)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">5F Logical Address:</span>
                    <span className="text-cyan-300 font-bold">0x105F</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Write Coding DID:</span>
                    <span className="text-cyan-300 font-bold">0x0600 (Service 0x2E)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Security Login Code:</span>
                    <span className="text-cyan-300 font-bold">20103</span>
                  </div>
                </div>

                <p className="text-slate-400 font-sans mt-2">
                  Adaptations use proprietary ODX/ASAM mapping files. Our application caches all known identifiers to allow direct naming instead of numeric ODX lookups.
                </p>
              </div>
            )}

            {selectedLayer === 'os' && (
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Unlike MIB2 (which ran primarily QNX Neutrino 6.5.0 on Nvidia Tegra / Freescale i.MX6), MIB3 features a complex multi-OS architecture:
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-cyan-300">RCC (Radio Communication Controller):</strong>
                    <p className="text-slate-400 mt-1 font-sans">
                      Runs RTOS / QNX microkernel for real-time CAN bus handling, vehicle safety chimes, fast reverse camera feed, and terminal power state.
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-purple-300">MMX (MultiMedia eXtension):</strong>
                    <p className="text-slate-400 mt-1 font-sans">
                      Runs embedded Linux or Android Automotive OS with OpenGL ES 3.1 acceleration for high-definition 3D navigation, CarPlay/Android Auto wireless projection, and HMI rendering.
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-300">IFS (Image File System) & eMMC:</strong>
                    <p className="text-slate-400 mt-1 font-sans">
                      Stores firmware partitions, FEC license container, and adaptation channel parameter tables.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedLayer === 'hardware' && (
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  MIB3 headunits are manufactured by Tier-1 suppliers with standardized VAG pinouts and quadlock connectors:
                </p>

                <div className="space-y-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 font-mono block">Primary SoC:</span>
                    <strong className="text-white">Renesas R-Car H3 (Quad ARM Cortex-A57 + Quad Cortex-A53)</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 font-mono block">Memory:</span>
                    <strong className="text-white">4GB - 8GB LPDDR4 + 64GB - 128GB eMMC/UFS Storage</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 font-mono block">LVDS Display Output:</span>
                    <strong className="text-white">APIX3 / FPD-Link III Serializer</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 font-mono block">Suppliers:</span>
                    <strong className="text-white">Harman (High/OI3), Aptiv/Delphi (CNS3.0), Preh / Technisat (Entry)</strong>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
