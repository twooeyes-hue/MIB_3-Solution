import React, { useState, useEffect } from 'react';
import { VehicleProfile, AdaptationChannel } from '../types/mib3';
import { 
  Gauge, Radio, Smartphone, Compass, Sparkles, 
  Terminal, ShieldCheck, Wifi, Battery, Volume2, 
  Settings, Music, Navigation, Sun, Phone, Play, Pause, RotateCw
} from 'lucide-react';

interface HeadunitSimulatorProps {
  currentProfile: VehicleProfile;
  codingHex: string;
  channels: AdaptationChannel[];
  appliedRecipeIds: string[];
}

export const HeadunitSimulator: React.FC<HeadunitSimulatorProps> = ({
  currentProfile,
  codingHex,
  channels,
  appliedRecipeIds
}) => {
  const [activeScreen, setActiveScreen] = useState<'home' | 'sport' | 'carplay' | 'ambient' | 'offroad' | 'gem'>('home');
  const [selectedColor, setSelectedColor] = useState<string>('#00f0ff');
  const [boostValue, setBoostValue] = useState<number>(1.2);
  const [powerKw, setPowerKw] = useState<number>(245);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(true);

  // Check which features are activated via recipes or coding
  const hasSportHmi = appliedRecipeIds.includes('recipe_sport_performance_hmi') || 
    channels.some(c => c.id === 'car_func_bap_sport_display' && c.currentValue === 'activated');

  const hasCarPlay = appliedRecipeIds.includes('recipe_wireless_carplay_aa') ||
    channels.some(c => c.id === 'veh_cfg_apple_carplay' && c.currentValue === 'on');

  const hasAmbient30 = appliedRecipeIds.includes('recipe_ambient_30_color') ||
    channels.some(c => c.id === 'car_func_adapt_ambient_menu' && c.currentValue === 'activated');

  const hasGem = appliedRecipeIds.includes('recipe_green_engineering_menu') ||
    channels.some(c => c.id === 'dev_gem_activation' && c.currentValue === 'activated');

  const hasOffroad = appliedRecipeIds.includes('recipe_offroad_telemetry') ||
    channels.some(c => c.id === 'offroad_bap_activation' && c.currentValue === 'activated');

  // Brand-specific accent styling
  const brandThemes = {
    Audi: { accent: '#ff0037', border: 'border-red-600/40', bg: 'from-black via-zinc-950 to-neutral-900', label: 'AUDI MMI TOUCH MIB3GP' },
    Volkswagen: { accent: '#00d2ff', border: 'border-cyan-600/40', bg: 'from-black via-slate-950 to-blue-950/40', label: 'VW DISCOVER PRO MIB3' },
    Cupra: { accent: '#ff8400', border: 'border-amber-600/40', bg: 'from-black via-stone-950 to-amber-950/30', label: 'CUPRA CONNECT INFOTAINMENT' },
    Skoda: { accent: '#00ff88', border: 'border-emerald-600/40', bg: 'from-black via-zinc-950 to-emerald-950/30', label: 'SKODA COLUMBUS MIB3' },
    Porsche: { accent: '#ffb700', border: 'border-yellow-600/40', bg: 'from-black via-neutral-950 to-zinc-900', label: 'PORSCHE PCM 6.0' },
  };

  const theme = brandThemes[currentProfile.brand] || brandThemes.Volkswagen;

  // Animated gauges loop for Sport HMI
  useEffect(() => {
    if (activeScreen !== 'sport') return;
    const interval = setInterval(() => {
      setBoostValue(prev => {
        const next = prev + (Math.random() * 0.4 - 0.2);
        return Math.max(0.4, Math.min(2.1, parseFloat(next.toFixed(2))));
      });
      setPowerKw(prev => {
        const next = prev + Math.floor(Math.random() * 20 - 10);
        return Math.max(120, Math.min(320, next));
      });
    }, 400);
    return () => clearInterval(interval);
  }, [activeScreen]);

  const ambientColors = [
    '#00f0ff', '#0070ff', '#3b82f6', '#8b5cf6', '#d946ef', 
    '#ff0055', '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#10b981', '#06b6d4', '#14b8a6', '#ffffff'
  ];

  return (
    <div className="space-y-4">
      
      {/* Top Bar for Simulator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f131d] border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            MIB3 HARDWARE DISPLAY SIMULATOR
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
              {theme.label}
            </span>
          </h3>
        </div>

        {/* Quick App Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveScreen('home')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
              activeScreen === 'home' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Home Menu
          </button>

          {hasSportHmi && (
            <button
              onClick={() => setActiveScreen('sport')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1 ${
                activeScreen === 'sport' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-900 text-cyan-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Sport HMI</span>
            </button>
          )}

          {hasCarPlay && (
            <button
              onClick={() => setActiveScreen('carplay')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1 ${
                activeScreen === 'carplay' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-900 text-emerald-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>CarPlay 5GHz</span>
            </button>
          )}

          {hasAmbient30 && (
            <button
              onClick={() => setActiveScreen('ambient')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1 ${
                activeScreen === 'ambient' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-900 text-purple-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>30 Colors</span>
            </button>
          )}

          {hasOffroad && (
            <button
              onClick={() => setActiveScreen('offroad')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1 ${
                activeScreen === 'offroad' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Offroad</span>
            </button>
          )}

          {hasGem && (
            <button
              onClick={() => setActiveScreen('gem')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1 ${
                activeScreen === 'gem' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-900 text-emerald-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>GEM Dev</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Frame (Looks like a real in-car bezel display) */}
      <div 
        className="relative rounded-2xl p-4 sm:p-6 border-4 border-slate-900 shadow-2xl overflow-hidden transition-all duration-500"
        style={{
          background: `radial-gradient(ellipse at top, ${selectedColor}15 0%, #06080d 70%)`,
          boxShadow: `0 0 40px ${selectedColor}25, inset 0 0 20px rgba(0,0,0,0.8)`
        }}
      >
        {/* Ambient Glow Strip across dashboard top */}
        <div 
          className="h-1 w-full rounded-full mb-3 transition-colors duration-500 shadow-lg"
          style={{
            backgroundColor: selectedColor,
            boxShadow: `0 0 16px ${selectedColor}`
          }}
        ></div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1 text-[11px] text-cyan-300">
              <Wifi className="w-3.5 h-3.5" /> 5GHz WLAN
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-300">21.5°C</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> SFD ACTIVE
            </span>
            <Battery className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Display Views */}
        <div className="py-4 min-h-[320px]">
          
          {/* View 1: Home Carousel Menu */}
          {activeScreen === 'home' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Tile 1: Navigation */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500 transition-all cursor-pointer group">
                  <Navigation className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="block text-sm font-bold text-white">Navigation</span>
                  <span className="text-[11px] text-slate-400">Map Database Valid</span>
                </div>

                {/* Tile 2: Smartphone Interface (CarPlay / AA) */}
                <div 
                  onClick={() => hasCarPlay && setActiveScreen('carplay')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    hasCarPlay 
                      ? 'bg-slate-900/80 border-emerald-500/60 shadow-lg shadow-emerald-950/30' 
                      : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  <Smartphone className={`w-8 h-8 mb-2 group-hover:scale-110 transition-transform ${hasCarPlay ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className="block text-sm font-bold text-white">App-Connect</span>
                  <span className="text-[11px] text-slate-400">
                    {hasCarPlay ? 'Wireless CarPlay Ready' : 'Coding Required'}
                  </span>
                </div>

                {/* Tile 3: Sport Performance Monitor */}
                <div 
                  onClick={() => hasSportHmi && setActiveScreen('sport')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    hasSportHmi 
                      ? 'bg-slate-900/80 border-cyan-500/60 shadow-lg shadow-cyan-950/30' 
                      : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  <Gauge className={`w-8 h-8 mb-2 group-hover:scale-110 transition-transform ${hasSportHmi ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <span className="block text-sm font-bold text-white">Sport Performance</span>
                  <span className="text-[11px] text-slate-400">
                    {hasSportHmi ? 'Boost & G-Meter Active' : 'Coding Required'}
                  </span>
                </div>

                {/* Tile 4: Ambient Light 30-Color */}
                <div 
                  onClick={() => hasAmbient30 && setActiveScreen('ambient')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    hasAmbient30 
                      ? 'bg-slate-900/80 border-purple-500/60 shadow-lg shadow-purple-950/30' 
                      : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  <Sparkles className={`w-8 h-8 mb-2 group-hover:scale-110 transition-transform ${hasAmbient30 ? 'text-purple-400' : 'text-slate-600'}`} />
                  <span className="block text-sm font-bold text-white">Ambient Lighting</span>
                  <span className="text-[11px] text-slate-400">
                    {hasAmbient30 ? '30 RGB Colors' : 'Standard 10 Colors'}
                  </span>
                </div>

              </div>

              {/* Media Player Bar */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Lossless Audio Protocol • Bang & Olufsen 3D</span>
                    <span className="text-[10px] text-slate-400">5.8 GHz High-Throughput Wireless Stream</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                    className="p-2 rounded-full bg-cyan-600 text-slate-950 hover:bg-cyan-500 transition-colors"
                  >
                    {isPlayingMusic ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View 2: Sport Performance HMI */}
          {activeScreen === 'sport' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold font-mono text-cyan-400 uppercase flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" /> SPORT HMI • LIVE TELEMETRY
                </span>
                <span className="text-[11px] text-slate-400 font-mono">BAP 0x3E ACTIVE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Gauge 1: Turbo Boost */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-800/60 text-center space-y-1">
                  <span className="text-xs font-mono text-slate-400 block">TURBO BOOST</span>
                  <div className="text-3xl font-extrabold font-mono text-cyan-400 my-2">
                    {boostValue} <span className="text-sm font-normal text-slate-400">bar</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(boostValue / 2.5) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Gauge 2: Power Output */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-800/60 text-center space-y-1">
                  <span className="text-xs font-mono text-slate-400 block">POWER OUTPUT</span>
                  <div className="text-3xl font-extrabold font-mono text-white my-2">
                    {powerKw} <span className="text-sm font-normal text-slate-400">kW</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-300"
                      style={{ width: `${(powerKw / 350) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Gauge 3: G-Force Lateral Accelerometer */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-800/60 text-center flex flex-col items-center justify-center">
                  <span className="text-xs font-mono text-slate-400 block mb-2">G-METER ACCEL</span>
                  <div className="w-16 h-16 rounded-full border-2 border-cyan-500/40 relative flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-cyan-400/80 shadow-md shadow-cyan-400 animate-pulse"></div>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold mt-1">1.12 G Lateral</span>
                </div>

              </div>
            </div>
          )}

          {/* View 3: Wireless CarPlay Simulation */}
          {activeScreen === 'carplay' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> APPLE CARPLAY WIRELESS 5GHz
                </span>
                <span className="text-[11px] text-slate-400 font-mono">iPhone 15 Pro • 5.8 GHz DFS</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                {[
                  { name: 'Phone', color: 'bg-emerald-500', icon: Phone },
                  { name: 'Maps', color: 'bg-blue-500', icon: Navigation },
                  { name: 'Music', color: 'bg-red-500', icon: Music },
                  { name: 'Settings', color: 'bg-slate-600', icon: Settings },
                  { name: 'Spotify', color: 'bg-green-600', icon: Radio },
                  { name: 'Telemetry', color: 'bg-purple-600', icon: Gauge },
                ].map((app) => {
                  const Icon = app.icon;
                  return (
                    <div key={app.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shadow-lg shadow-black/40`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-white">{app.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 font-mono text-center">
                ✓ 5GHz DFS Wi-Fi Hotspot link verified • Byte 15 Bits 0-3 Active • Zero audio latency
              </div>
            </div>
          )}

          {/* View 4: 30-Color Ambient Lighting Menu */}
          {activeScreen === 'ambient' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold font-mono text-purple-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 30-COLOR RGB AMBIENT LIGHTING PALETTE
                </span>
                <span className="text-[11px] text-slate-400 font-mono">BAP 0x08 LINKED</span>
              </div>

              <p className="text-xs text-slate-300">
                Click any hue below to sync interior LED door panels, footwells, and center console highlights:
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {ambientColors.map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColor(col)}
                    className={`w-9 h-9 rounded-full transition-transform cursor-pointer border-2 ${
                      selectedColor === col ? 'scale-125 border-white ring-2 ring-white/50' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                  ></button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Current Hex Hue: <strong className="text-white">{selectedColor}</strong></span>
                <span className="text-emerald-400">Module 09 BCM Synced</span>
              </div>
            </div>
          )}

          {/* View 5: Offroad Monitor */}
          {activeScreen === 'offroad' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> OFFROAD SENSOR SUITE
                </span>
                <span className="text-[11px] text-slate-400 font-mono">BAP 0x42 ACTIVE</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-800/40 font-mono">
                  <span className="text-xs text-slate-400 block">STEERING ANGLE</span>
                  <span className="text-2xl font-bold text-amber-400 block my-1">12° Left</span>
                  <span className="text-[10px] text-slate-500">CAN ESP Sensor</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-800/40 font-mono">
                  <span className="text-xs text-slate-400 block">ALTIMETER</span>
                  <span className="text-2xl font-bold text-white block my-1">428 m</span>
                  <span className="text-[10px] text-slate-500">Above Sea Level</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-800/40 font-mono">
                  <span className="text-xs text-slate-400 block">PITCH & ROLL</span>
                  <span className="text-2xl font-bold text-emerald-400 block my-1">2° Incline</span>
                  <span className="text-[10px] text-slate-500">Lateral 0°</span>
                </div>
              </div>
            </div>
          )}

          {/* View 6: Green Engineering Menu (GEM) */}
          {activeScreen === 'gem' && (
            <div className="space-y-3 font-mono text-xs text-emerald-400 bg-black/90 p-4 rounded-xl border border-emerald-900 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900 text-emerald-300 font-bold">
                <span>GREEN ENGINEERING MENU (GEM) v3.4</span>
                <span>/net/mmx/developer</span>
              </div>

              <div className="space-y-1 text-[11px] text-emerald-300/80">
                <p>&gt; sys_info: SoC Renesas R-Car H3 | 8-Core ARM64 | 8GB RAM</p>
                <p>&gt; swdl_status: Manual update unlocked via SD/USB</p>
                <p>&gt; fec_container: 11 licenses validated | Exception list active</p>
                <p>&gt; telnet_daemon: LISTENING on TCP port 23 (eth0: 192.168.1.4)</p>
                <p>&gt; screenshot_trigger: PRESS AND HOLD MEDIA BUTTON FOR 3s</p>
              </div>
            </div>
          )}

        </div>

        {/* Home Button Navigation Pill */}
        <div className="pt-2 border-t border-white/10 flex justify-center">
          <button
            onClick={() => setActiveScreen('home')}
            className="w-24 h-1.5 rounded-full bg-white/40 hover:bg-white transition-colors"
            title="Return to MIB3 Home"
          ></button>
        </div>

      </div>
    </div>
  );
};
