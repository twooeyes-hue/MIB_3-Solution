import React, { useState, useEffect } from 'react';
import { 
  Cpu, ShieldCheck, ShieldAlert, Car, Wrench, Download, 
  GitCompare, RefreshCw, Radio, Cable, Zap, Monitor, Usb, Bluetooth, Terminal, Power
} from 'lucide-react';
import { SfdTokenInfo, VehicleProfile } from '../types/mib3';
import { VEHICLE_PROFILES } from '../data/mib3Database';
import { hardwareDiagnostic, HardwareConnectionState, HardwareInterfaceBrand } from '../utils/hardwareConnection';

interface HeaderProps {
  currentProfile: VehicleProfile;
  onSelectProfile: (profile: VehicleProfile) => void;
  sfdToken: SfdTokenInfo;
  onToggleSfd: () => void;
  stagedChangesCount: number;
  onOpenExport: () => void;
  onOpenDiff: () => void;
  onOpenFlash: () => void;
  onResetToStock: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isVehicleLoaded?: boolean;
  vehicleDataSource?: 'none' | 'vci' | 'scan' | 'demo';
  onLoadDemo?: () => void;
  onUnloadVehicle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  onSelectProfile,
  sfdToken,
  onToggleSfd,
  stagedChangesCount,
  onOpenExport,
  onOpenDiff,
  onOpenFlash,
  onResetToStock,
  activeTab,
  setActiveTab,
  isVehicleLoaded = false,
  vehicleDataSource = 'none',
  onLoadDemo,
  onUnloadVehicle
}) => {
  const [hwState, setHwState] = useState<HardwareConnectionState>(hardwareDiagnostic.getState());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  useEffect(() => {
    const unsub = hardwareDiagnostic.subscribe(setHwState);
    return () => unsub();
  }, []);

  const handleInterfaceChange = (brand: HardwareInterfaceBrand) => {
    hardwareDiagnostic.setSelectedBrand(brand);
  };

  const handleConnectToggle = async () => {
    if (hwState.isConnected) {
      hardwareDiagnostic.disconnect();
    } else {
      setIsConnecting(true);
      await hardwareDiagnostic.connectSelectedBrand('usb');
      setIsConnecting(false);
    }
  };

  const tabs = [
    { id: 'real_workstation', label: 'Poste Réel Véhicule', icon: Terminal, badge: 'Live ECU 5F' },
    { id: 'long_coding', label: 'Long Coding 32-Octets', icon: Cpu, badge: 'Expert' },
    { id: 'adaptations', label: 'Adaptations (IDE)', icon: Car },
    { id: 'sfd', label: 'Protection SFD', icon: sfdToken.status === 'UNLOCKED' ? ShieldCheck : ShieldAlert },
    { id: 'fec_swap', label: 'Licences FEC / SWaP', icon: Radio },
    { id: 'connect_guide', label: 'Câblage & Pinout VCI', icon: Cable },
    { id: 'virtual_bench', label: '🧪 Simulateur / Banc Virtuel', icon: Monitor, badge: 'Hors-Ligne' },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0e121b]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Bar with Brand, Vehicle Selector, Interface Switcher and Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Logo, Platform Info & Real Interface Selector */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30 shrink-0">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  MIB3 <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">VAG STUDIO</span>
                </h1>

                {/* Real Hardware Interface Selector: Autel JVCI, ODIS, OBDeleven */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-[11px] font-mono">
                  <span className="text-slate-400 mr-1 text-[10px]">VCI:</span>
                  <select
                    aria-label="Hardware Diagnostic Interface"
                    value={hwState.selectedBrand}
                    onChange={(e) => handleInterfaceChange(e.target.value as HardwareInterfaceBrand)}
                    className="bg-transparent border-0 font-bold text-cyan-300 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="autel_jvci" className="bg-slate-900 text-white">Autel MaxiFlash JVCI (IM608 Pro)</option>
                    <option value="vas6154" className="bg-slate-900 text-white">ODIS / VAS 6154A (DoIP)</option>
                    <option value="obdeleven" className="bg-slate-900 text-white">OBDeleven NextGen (BLE)</option>
                    <option value="vcds" className="bg-slate-900 text-white">Ross-Tech VCDS (HEX-NET)</option>
                    <option value="doip_direct" className="bg-slate-900 text-white">Direct DoIP Ethernet (100BASE-T1)</option>
                  </select>
                </div>

                {/* Connection Status Button / Badge */}
                <button
                  onClick={handleConnectToggle}
                  disabled={isConnecting}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hwState.isConnected
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                      : 'bg-slate-900 text-cyan-300 border-cyan-800/80 hover:bg-cyan-950'
                  }`}
                  title={hwState.isConnected ? 'Click to Disconnect' : 'Click to Connect Hardware'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hwState.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                  }`}></span>
                  <span>{isConnecting ? 'CONNECTING...' : hwState.isConnected ? 'ONLINE (PassThru)' : 'CONNECT VCI'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>ECU: <strong className="text-slate-300 font-mono">0x5F (Information Electronics 1)</strong></span>
                <span className="text-slate-600">|</span>
                <span>FW: <strong className={`font-mono text-[11px] ${isVehicleLoaded ? 'text-cyan-300' : 'text-slate-500'}`}>
                  {isVehicleLoaded ? currentProfile.firmwareVersion : '-- Non lu (UDS 0xF189)'}
                </strong></span>
              </p>
            </div>
          </div>

          {/* Vehicle Switcher & Hardware Specs */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {isVehicleLoaded ? (
              <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                <span className="text-slate-400 mr-2 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  Véhicule:
                </span>
                <span className="font-bold text-white mr-2">
                  {currentProfile.name}
                </span>
                {vehicleDataSource === 'demo' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-700 text-purple-300 font-bold font-mono">
                    🧪 DÉMO
                  </span>
                )}
                {vehicleDataSource === 'vci' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold font-mono">
                    ⚡ VCI LIVE
                  </span>
                )}
                {vehicleDataSource === 'scan' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-bold font-mono">
                    📄 RAPPORT
                  </span>
                )}
                {onUnloadVehicle && (
                  <button
                    onClick={onUnloadVehicle}
                    className="ml-2 text-slate-400 hover:text-red-400 text-xs font-mono"
                    title="Décharger ce véhicule"
                  >
                    &times;
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center bg-slate-950/90 border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 gap-2">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-mono text-[11px] font-bold">
                  Aucun véhicule lu
                </span>
                <span className="text-slate-500 text-[10px]">
                  (Branchez VCI ou importez scan)
                </span>
              </div>
            )}

            {/* SFD Status Toggle */}
            <button
              onClick={onToggleSfd}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                sfdToken.status === 'UNLOCKED'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Statut SFD module 5F (UDS 0x27)"
            >
              {sfdToken.status === 'UNLOCKED' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SFD: Unlocked (5F)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  <span>SFD: Verrouillé (5F)</span>
                </>
              )}
            </button>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <button
                onClick={onOpenDiff}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="View differences from original stock coding"
              >
                <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Diff</span>
                {stagedChangesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-bold">
                    {stagedChangesCount}
                  </span>
                )}
              </button>

              <button
                onClick={onResetToStock}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-red-950/60 hover:text-red-300 text-slate-400 border border-slate-700/60 transition-colors"
                title="Reset all coding and adaptations to OEM factory defaults"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Export script for Autel JVCI, ODIS-E, VCDS, or OBDeleven"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </button>

              <button
                onClick={onOpenFlash}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/25 transition-all"
                title="Directly execute and flash coding to the vehicle"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Flash to Car</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
