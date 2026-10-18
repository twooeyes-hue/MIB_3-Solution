import React, { useState } from 'react';
import { VEHICLE_PROFILES, MIB3_ADAPTATION_CHANNELS, RETROFIT_RECIPES, DEFAULT_SFD_TOKEN } from './data/mib3Database';
import { AdaptationChannel, RetrofitRecipe, SfdTokenInfo, VehicleProfile } from './types/mib3';
import { Header } from './components/Header';
import { ArchitectureView } from './components/ArchitectureView';
import { RecipeAutomator } from './components/RecipeAutomator';
import { LongCodingStudio } from './components/LongCodingStudio';
import { AdaptationManager } from './components/AdaptationManager';
import { SfdManager } from './components/SfdManager';
import { FecSwapManager } from './components/FecSwapManager';
import { DiffEngine } from './components/DiffEngine';
import { ExportModal } from './components/ExportModal';
import { CarConnectionGuide } from './components/CarConnectionGuide';
import { LiveFlashModal } from './components/LiveFlashModal';
import { HeadunitSimulator } from './components/HeadunitSimulator';
import { RealCarWorkstation } from './components/RealCarWorkstation';
import { DecodedVin } from './utils/vagVinDecoder';
import { setBitInCodingString, hexStringToBytes } from './utils/mib3CodingUtils';

export default function App() {
  const [isVehicleLoaded, setIsVehicleLoaded] = useState<boolean>(false);
  const [vehicleDataSource, setVehicleDataSource] = useState<'none' | 'vci' | 'scan' | 'demo'>('none');
  const [currentProfile, setCurrentProfile] = useState<VehicleProfile>({
    id: 'unconnected',
    name: 'Aucun véhicule lu',
    brand: 'Volkswagen AG',
    platform: 'Attente lecture VCI',
    headunitType: 'Module 0x5F (Inconnu)',
    vinSample: '-- NON LU --',
    firmwareVersion: '-- NON LU --',
    defaultCoding: '00'.repeat(32)
  });
  const [stockCodingHex, setStockCodingHex] = useState<string>('00'.repeat(32));
  const [codingHex, setCodingHex] = useState<string>('00'.repeat(32));
  const [channels, setChannels] = useState<AdaptationChannel[]>(MIB3_ADAPTATION_CHANNELS);
  const [appliedRecipeIds, setAppliedRecipeIds] = useState<string[]>([]);
  const [sfdToken, setSfdToken] = useState<SfdTokenInfo>(DEFAULT_SFD_TOKEN);
  const [activeTab, setActiveTab] = useState<string>('real_workstation');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isFlashOpen, setIsFlashOpen] = useState<boolean>(false);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch Vehicle Profile (User chosen)
  const handleSelectProfile = (profile: VehicleProfile) => {
    setCurrentProfile(profile);
    setStockCodingHex(profile.defaultCoding);
    setCodingHex(profile.defaultCoding);
    setAppliedRecipeIds([]);
    setIsVehicleLoaded(true);
    setVehicleDataSource('demo');
    setSfdToken(prev => ({
      ...prev,
      vin: profile.vinSample,
      brand: profile.brand
    }));
    showToast(`Profil ${profile.name} chargé (${profile.headunitType})`);
  };

  // Load Demo Golf 8 (explicit test without real car)
  const handleLoadDemoVehicle = () => {
    const demo = VEHICLE_PROFILES[0];
    setCurrentProfile(demo);
    setStockCodingHex(demo.defaultCoding);
    setCodingHex(demo.defaultCoding);
    setAppliedRecipeIds([]);
    setIsVehicleLoaded(true);
    setVehicleDataSource('demo');
    setSfdToken({
      ...DEFAULT_SFD_TOKEN,
      vin: demo.vinSample,
      brand: demo.brand
    });
    showToast('Données démo Golf 8 chargées (Banc Virtuel)');
  };

  // Unload vehicle data back to zero
  const handleUnloadVehicle = () => {
    setIsVehicleLoaded(false);
    setVehicleDataSource('none');
    setCurrentProfile({
      id: 'unconnected',
      name: 'Aucun véhicule lu',
      brand: 'Volkswagen AG',
      platform: 'Attente lecture VCI',
      headunitType: 'Module 0x5F (Inconnu)',
      vinSample: '-- NON LU --',
      firmwareVersion: '-- NON LU --',
      defaultCoding: '00'.repeat(32)
    });
    setStockCodingHex('00'.repeat(32));
    setCodingHex('00'.repeat(32));
    setAppliedRecipeIds([]);
    setSfdToken(DEFAULT_SFD_TOKEN);
    showToast('Calculateur déchargé. Prêt pour une nouvelle lecture.');
  };

  // Synchronize real vehicle data read from hardware or parsed scan
  const handleApplyReadCoding = (newCodingHex: string, realVin: string, decoded?: DecodedVin, source: 'vci' | 'scan' = 'vci') => {
    setCodingHex(newCodingHex);
    setStockCodingHex(newCodingHex);
    setAppliedRecipeIds([]);
    setIsVehicleLoaded(true);
    setVehicleDataSource(source);

    if (decoded) {
      const matched = VEHICLE_PROFILES.find(p => p.brand === decoded.brand);
      setCurrentProfile({
        id: `car_${realVin}`,
        name: `${decoded.brand || 'VAG'} ${decoded.modelSeries || 'Véhicule'} (${decoded.modelYear || '2022+'})`,
        brand: (decoded.brand || 'Volkswagen') as any,
        platform: (decoded.platform !== 'Legacy' ? decoded.platform : (matched?.platform || 'MQB-evo')) as any,
        headunitType: (decoded.detectedHeadunit !== 'Unknown' ? decoded.detectedHeadunit : (matched?.headunitType || 'MIB3 High (Harman)')) as any,
        vinSample: realVin,
        firmwareVersion: matched?.firmwareVersion || 'MOI3_EU_VW_R8410L',
        defaultCoding: newCodingHex
      });
    }

    setSfdToken(prev => ({
      ...prev,
      vin: realVin,
      brand: decoded?.brand && decoded.brand !== 'Unknown' ? decoded.brand : prev.brand
    }));
  };

  // Apply a 1-Click Retrofit Recipe
  const handleApplyRecipe = (recipe: RetrofitRecipe) => {
    let updatedHex = codingHex;

    // Apply Long Coding Bit changes
    recipe.byteChanges.forEach((bc) => {
      updatedHex = setBitInCodingString(updatedHex, bc.byteIndex, bc.bitIndex, bc.targetValue);
    });

    // Apply Adaptation changes
    const updatedChannels = channels.map((ch) => {
      const match = recipe.adaptationChanges.find(ac => ac.channelId === ch.id);
      if (match) {
        return { ...ch, currentValue: match.targetValue };
      }
      return ch;
    });

    setCodingHex(updatedHex);
    setChannels(updatedChannels);
    setAppliedRecipeIds(prev => [...prev, recipe.id]);
    showToast(`Successfully applied: ${recipe.title}`);
  };

  // Revert a Retrofit Recipe
  const handleRevertRecipe = (recipe: RetrofitRecipe) => {
    let updatedHex = codingHex;

    // Revert Long Coding Bit changes
    recipe.byteChanges.forEach((bc) => {
      // Revert to inverse or stock
      updatedHex = setBitInCodingString(updatedHex, bc.byteIndex, bc.bitIndex, !bc.targetValue);
    });

    // Revert Adaptation changes
    const updatedChannels = channels.map((ch) => {
      const match = recipe.adaptationChanges.find(ac => ac.channelId === ch.id);
      if (match) {
        return { ...ch, currentValue: ch.defaultValue };
      }
      return ch;
    });

    setCodingHex(updatedHex);
    setChannels(updatedChannels);
    setAppliedRecipeIds(prev => prev.filter(id => id !== recipe.id));
    showToast(`Reverted: ${recipe.title}`);
  };

  // Reset Everything to OEM Factory Baseline
  const handleResetToStock = () => {
    setCodingHex(stockCodingHex);
    setChannels(channels.map(c => ({ ...c, currentValue: c.defaultValue })));
    setAppliedRecipeIds([]);
    setIsDiffOpen(false);
    showToast('Reset all coding and adaptations to OEM factory defaults');
  };

  // Toggle SFD Security State
  const handleToggleSfd = () => {
    const nextStatus = sfdToken.status === 'UNLOCKED' ? 'LOCKED' : 'UNLOCKED';
    setSfdToken(prev => ({ ...prev, status: nextStatus }));
    showToast(`SFD Module 5F state changed to: ${nextStatus}`);
  };

  // Change individual adaptation channel value
  const handleChangeChannelValue = (channelId: string, newValue: string) => {
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, currentValue: newValue } : ch));
  };

  // Reset individual adaptation channel
  const handleResetChannel = (channelId: string) => {
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, currentValue: ch.defaultValue } : ch));
  };

  // Count staged differences
  const currentBytes = hexStringToBytes(codingHex, 32);
  const stockBytes = hexStringToBytes(stockCodingHex, 32);
  let changedBytesCount = 0;
  currentBytes.forEach((b, i) => {
    if (b !== stockBytes[i]) changedBytesCount++;
  });
  const changedChannelsCount = channels.filter(c => c.currentValue !== c.defaultValue).length;
  const stagedChangesCount = changedBytesCount + changedChannelsCount;

  const appliedRecipesList = RETROFIT_RECIPES.filter(r => appliedRecipeIds.includes(r.id));

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col selection:bg-cyan-900 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-cyan-300 border border-cyan-500/80 px-4 py-2.5 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        currentProfile={currentProfile}
        onSelectProfile={handleSelectProfile}
        sfdToken={sfdToken}
        onToggleSfd={handleToggleSfd}
        stagedChangesCount={stagedChangesCount}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenDiff={() => setIsDiffOpen(true)}
        onOpenFlash={() => setIsFlashOpen(true)}
        onResetToStock={handleResetToStock}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsDiffOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Main Body Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {isDiffOpen ? (
          <DiffEngine
            currentProfile={currentProfile}
            codingHex={codingHex}
            stockCodingHex={stockCodingHex}
            channels={channels}
            onRollbackToStock={handleResetToStock}
            onClose={() => setIsDiffOpen(false)}
          />
        ) : (
          <>
            {activeTab === 'real_workstation' && (
              <RealCarWorkstation
                currentProfile={currentProfile}
                codingHex={codingHex}
                stockCodingHex={stockCodingHex}
                channels={channels}
                sfdToken={sfdToken}
                appliedRecipeIds={appliedRecipeIds}
                onChangeCodingHex={setCodingHex}
                onApplyRecipe={handleApplyRecipe}
                onRevertRecipe={handleRevertRecipe}
                onToggleSfd={handleToggleSfd}
                onResetToStock={handleResetToStock}
                onApplyReadCoding={handleApplyReadCoding}
                onOpenExport={() => setIsExportOpen(true)}
                onOpenDiff={() => setIsDiffOpen(true)}
                onNavigateToExpert={() => setActiveTab('long_coding')}
                onNavigateToAdaptations={() => setActiveTab('adaptations')}
              />
            )}

            {activeTab === 'long_coding' && (
              <LongCodingStudio
                currentProfile={currentProfile}
                codingHex={codingHex}
                stockCodingHex={stockCodingHex}
                onChangeCodingHex={setCodingHex}
                onResetToStock={handleResetToStock}
              />
            )}

            {activeTab === 'adaptations' && (
              <AdaptationManager
                channels={channels}
                onChangeChannelValue={handleChangeChannelValue}
                onResetChannel={handleResetChannel}
                sfdToken={sfdToken}
              />
            )}

            {activeTab === 'sfd' && (
              <SfdManager
                currentProfile={currentProfile}
                sfdToken={sfdToken}
                onUpdateToken={setSfdToken}
              />
            )}

            {activeTab === 'fec_swap' && (
              <FecSwapManager
                currentProfile={currentProfile}
              />
            )}

            {activeTab === 'connect_guide' && (
              <CarConnectionGuide
                currentProfile={currentProfile}
                sfdToken={sfdToken}
                onNavigateToRecipes={() => setActiveTab('real_workstation')}
                onNavigateToSfd={() => setActiveTab('sfd')}
              />
            )}

            {activeTab === 'virtual_bench' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600/80 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span>
                      <strong>MODE SIMULATEUR / BANC VIRTUEL HORS-LIGNE :</strong> Cet écran est une émulation de test visuelle et n'envoie aucune trame vers un véhicule réel. Pour coder une vraie voiture ou un headunit physique, retournez sur l'onglet <strong>"Poste Réel Véhicule"</strong>.
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('real_workstation')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer hover:bg-amber-400"
                  >
                    Retour au Poste Réel &rarr;
                  </button>
                </div>

                <HeadunitSimulator
                  currentProfile={currentProfile}
                  codingHex={codingHex}
                  channels={channels}
                  appliedRecipeIds={appliedRecipeIds}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Live Flasher Modal */}
      <LiveFlashModal
        isOpen={isFlashOpen}
        onClose={() => setIsFlashOpen(false)}
        profile={currentProfile}
        codingHex={codingHex}
        channels={channels}
        appliedRecipes={appliedRecipesList}
        sfdToken={sfdToken}
        onFlashCompleted={() => {
          setActiveTab('preview');
          showToast('Flashing completed successfully! Showing live MIB3 screen.');
        }}
      />

      {/* Multi-Tool Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        profile={currentProfile}
        codingHex={codingHex}
        stockCodingHex={stockCodingHex}
        channels={channels}
        appliedRecipes={appliedRecipesList}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#0a0c10] py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MIB3 VAG Coding Studio • Modularer Infotainment-Baukasten 3</span>
          <span className="text-slate-600">Supports Audi (MMI MIB3/MHI3), VW (Discover Pro/Media), Cupra/Seat, Skoda (Columbus), Porsche (PCM 6.0)</span>
        </div>
      </footer>
    </div>
  );
}
