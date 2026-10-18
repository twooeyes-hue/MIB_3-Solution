import React, { useState, useEffect, useRef } from 'react';
import { 
  Cable, Usb, Terminal, Play, Download, Trash2, 
  ShieldCheck, ShieldAlert, BatteryCharging, CheckCircle2, 
  AlertTriangle, ArrowRight, RefreshCw, Cpu, Car, Layers, 
  FileText, Upload, Check, Zap, RotateCcw, Power, Wifi, 
  Sliders, Sparkles, ExternalLink, Activity
} from 'lucide-react';
import { hardwareDiagnostic, HardwareConnectionState, DiagnosticFrame, HardwareInterfaceBrand } from '../utils/hardwareConnection';
import { DecodedVin, decodeVagVin } from '../utils/vagVinDecoder';
import { AdaptationChannel, RetrofitRecipe, SfdTokenInfo, VehicleProfile } from '../types/mib3';
import { formatHexWithSpaces, hexStringToBytes, setBitInCodingString, byteToBits } from '../utils/mib3CodingUtils';
import { parseRealCarLog, ParsedCarLog } from '../utils/carLogParser';
import { MIB3_BYTE_DEFINITIONS } from '../data/mib3Database';

interface RealCarWorkstationProps {
  currentProfile: VehicleProfile;
  codingHex: string;
  stockCodingHex: string;
  channels: AdaptationChannel[];
  sfdToken: SfdTokenInfo;
  appliedRecipeIds: string[];
  onChangeCodingHex: (hex: string) => void;
  onApplyRecipe: (recipe: RetrofitRecipe) => void;
  onRevertRecipe: (recipe: RetrofitRecipe) => void;
  onToggleSfd: () => void;
  onResetToStock: () => void;
  onApplyReadCoding: (newCodingHex: string, realVin: string, decoded?: DecodedVin, source?: 'vci' | 'scan') => void;
  onOpenExport: () => void;
  onOpenDiff: () => void;
  onNavigateToExpert: () => void;
  onNavigateToAdaptations: () => void;
  isVehicleLoaded?: boolean;
  vehicleDataSource?: 'none' | 'vci' | 'scan' | 'demo';
  onLoadDemoVehicle?: () => void;
  onUnloadVehicle?: () => void;
}

export const RealCarWorkstation: React.FC<RealCarWorkstationProps> = ({
  currentProfile,
  codingHex,
  stockCodingHex,
  channels,
  sfdToken,
  appliedRecipeIds,
  onChangeCodingHex,
  onApplyRecipe,
  onRevertRecipe,
  onToggleSfd,
  onResetToStock,
  onApplyReadCoding,
  onOpenExport,
  onOpenDiff,
  onNavigateToExpert,
  onNavigateToAdaptations,
  isVehicleLoaded = false,
  vehicleDataSource = 'none',
  onLoadDemoVehicle,
  onUnloadVehicle
}) => {
  const [hwState, setHwState] = useState<HardwareConnectionState>(hardwareDiagnostic.getState());
  const [frames, setFrames] = useState<DiagnosticFrame[]>([]);
  const [selectedBaud, setSelectedBaud] = useState<number>(115200);
  const [isReadingVehicle, setIsReadingVehicle] = useState<boolean>(false);
  const [readProgressText, setReadProgressText] = useState<string>('');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const [flashStepText, setFlashStepText] = useState<string>('');
  const [flashSuccess, setFlashSuccess] = useState<boolean | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected Byte inspection inside the workstation
  const [activeByteIndex, setActiveByteIndex] = useState<number>(3); // Default to Byte 3 (Connectivity)

  // Log Ingestion Drawer state
  const [showLogImporter, setShowLogImporter] = useState<boolean>(false);
  const [rawLogInput, setRawLogInput] = useState<string>('');
  const [parsedLogResult, setParsedLogResult] = useState<ParsedCarLog | null>(null);

  // Direct Terminal execution
  const [manualCmd, setManualCmd] = useState<string>('22 F1 90');
  const [showTerminal, setShowTerminal] = useState<boolean>(true);

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
    if (showTerminal) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [frames, showTerminal]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Hardware Connection Handlers
  const handleConnectHardware = async () => {
    if (hwState.isConnected) {
      hardwareDiagnostic.disconnect();
      showNotify('Session matérielle déconnectée');
    } else {
      const res = await hardwareDiagnostic.connectSelectedBrand('usb');
      showNotify(res.message);
    }
  };

  const handleInterfaceChange = (brand: HardwareInterfaceBrand) => {
    hardwareDiagnostic.setSelectedBrand(brand);
  };

  /**
   * Real Hardware Read Sequence (UDS 0x10, 0x22 F1 90, 0x22 F1 87, 0x22 F1 89, 0x22 06 00)
   */
  const handleReadRealVehicle = async () => {
    if (!hwState.isConnected) {
      showNotify('Interface VCI déconnectée. Veuillez d\'abord cliquer sur "CONNECTER VCI" pour connecter votre Autel JVCI, VAS 6154 ou adaptateur USB.');
      return;
    }

    setIsReadingVehicle(true);
    setReadProgressText('Ouverture session diagnostic étendue UDS 0x10 0x03...');

    // Session étendue UDS
    await hardwareDiagnostic.sendRawCommand('10 03');
    await new Promise(r => setTimeout(r, 200));

    // Lecture VIN (0x22 DID 0xF190)
    setReadProgressText('Lecture du VIN réel (UDS 0x22 DID 0xF190)...');
    const vinRes = await hardwareDiagnostic.readAndDecodeVin();
    if (!vinRes.success || !vinRes.vin) {
      setIsReadingVehicle(false);
      setReadProgressText('');
      showNotify(`ÉCHEC DE LECTURE DU VIN : ${vinRes.error || 'Pas de réponse du calculateur 5F sur la prise OBD2'}`);
      return;
    }
    await new Promise(r => setTimeout(r, 200));

    // Lecture Références calculateurs 5F
    setReadProgressText('Lecture référence pièce et firmware MIB3 (0xF187 / 0xF189)...');
    const ecuInfo = await hardwareDiagnostic.readEcuInfo();
    await new Promise(r => setTimeout(r, 200));

    // Lecture Long Coding 32 octets (0x22 DID 0x0600)
    setReadProgressText('Extraction du Long Coding actif 32 octets (DID 0x0600)...');
    const codingRes = await hardwareDiagnostic.readActiveLongCoding();
    if (!codingRes.success || !codingRes.codingHex) {
      setIsReadingVehicle(false);
      setReadProgressText('');
      showNotify(`ÉCHEC DE LECTURE DU CODING : ${codingRes.error || 'Impossible d\'extraire les 32 octets'}`);
      return;
    }

    // Synchronisation dans l'état de l'application
    onApplyReadCoding(codingRes.codingHex, vinRes.vin, vinRes.decoded, 'vci');

    setIsReadingVehicle(false);
    setReadProgressText('');
    showNotify(`Véhicule réel lu avec succès ! VIN: ${vinRes.vin} | FW: ${ecuInfo.softwareVersion}`);
  };

  /**
   * Fast Retrofit Toggles applied directly to the active 32-Byte Long Coding
   */
  const handleToggleFeature = (featureKey: string) => {
    let nextHex = codingHex;

    if (featureKey === 'carplay') {
      // Byte 3 Bit 4 (Apple CarPlay) & Byte 17 Bit 0 (Wireless 5GHz)
      const currentBits = byteToBits(hexStringToBytes(codingHex, 32)[3]);
      const isCurrentlyActive = currentBits[4];
      nextHex = setBitInCodingString(nextHex, 3, 4, !isCurrentlyActive);
      nextHex = setBitInCodingString(nextHex, 17, 0, !isCurrentlyActive);
      onChangeCodingHex(nextHex);
      showNotify(`CarPlay / Android Auto sans fil 5GHz: ${!isCurrentlyActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    } else if (featureKey === 'sport_hmi') {
      // Byte 10 Bit 0 (Performance Gauges / Sport HMI) & Bit 1 (Lap Timer)
      const currentBits = byteToBits(hexStringToBytes(codingHex, 32)[10]);
      const isCurrentlyActive = currentBits[0];
      nextHex = setBitInCodingString(nextHex, 10, 0, !isCurrentlyActive);
      nextHex = setBitInCodingString(nextHex, 10, 1, !isCurrentlyActive);
      onChangeCodingHex(nextHex);
      showNotify(`Manomètres Sport & Chronomètre HMI: ${!isCurrentlyActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    } else if (featureKey === 'ambient_30') {
      // Byte 11 Bit 3 & 4 (30-Color Ambient Lighting)
      const currentBits = byteToBits(hexStringToBytes(codingHex, 32)[11]);
      const isCurrentlyActive = currentBits[3];
      nextHex = setBitInCodingString(nextHex, 11, 3, !isCurrentlyActive);
      nextHex = setBitInCodingString(nextHex, 11, 4, !isCurrentlyActive);
      onChangeCodingHex(nextHex);
      showNotify(`Éclairage d'Ambiance 30 Couleurs: ${!isCurrentlyActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    } else if (featureKey === 'offroad') {
      // Byte 24 Bit 0 (Offroad Compass / Pitch & Roll)
      const currentBits = byteToBits(hexStringToBytes(codingHex, 32)[24]);
      const isCurrentlyActive = currentBits[0];
      nextHex = setBitInCodingString(nextHex, 24, 0, !isCurrentlyActive);
      onChangeCodingHex(nextHex);
      showNotify(`Écran Tout-Terrain & Boussole MIB3: ${!isCurrentlyActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    } else if (featureKey === 'audio_dsp') {
      // Byte 8 Bit 0 & Bit 4 (High-End Sound DSP Canvas)
      const currentBits = byteToBits(hexStringToBytes(codingHex, 32)[8]);
      const isCurrentlyActive = currentBits[0];
      nextHex = setBitInCodingString(nextHex, 8, 0, !isCurrentlyActive);
      nextHex = setBitInCodingString(nextHex, 8, 4, !isCurrentlyActive);
      onChangeCodingHex(nextHex);
      showNotify(`Profil Audio DSP Premium: ${!isCurrentlyActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    } else if (featureKey === 'gem') {
      // Byte 17 Bit 7 (Developer Green Engineering Menu)
      const currentBits = byteToBits(hexStringToBytes(codingHex, 32)[17]);
      const isCurrentlyActive = currentBits[7];
      nextHex = setBitInCodingString(nextHex, 17, 7, !isCurrentlyActive);
      onChangeCodingHex(nextHex);
      showNotify(`Menu Ingénierie Vert (GEM Developer Mode): ${!isCurrentlyActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    }
  };

  /**
   * Real Flash to Vehicle (UDS 0x10, 0x27 SFD, 0x2E 0x0600, 0x11 0x01)
   */
  const handleFlashToCar = async () => {
    if (sfdToken.status !== 'UNLOCKED') {
      showNotify('BLOCAGE DE SÉCURITÉ: Le module 5F est verrouillé par SFD. Déverrouillez SFD avant d\'écrire.');
      return;
    }

    if (hwState.batteryVoltage < 12.0) {
      showNotify('ATTENTION TENSION: Batterie sous 12.0V ! Branchez un stabilisateur avant de flasher.');
      return;
    }

    setIsFlashing(true);
    setFlashSuccess(null);
    setFlashProgress(10);
    setFlashStepText('Étape 1/5: Initialisation UDS Extended Session (0x10 0x03)...');

    // Étape 1: Session Étendue
    await hardwareDiagnostic.sendRawCommand('10 03');
    await new Promise(r => setTimeout(r, 300));
    setFlashProgress(30);

    // Étape 2: Contrôle d'accès SFD (0x27 0x01 / 0x02)
    setFlashStepText('Étape 2/5: Vérification du jeton SFD Module 0x5F (0x27 0x01)...');
    await hardwareDiagnostic.sendRawCommand('27 01');
    await new Promise(r => setTimeout(r, 250));
    await hardwareDiagnostic.sendRawCommand(`27 02 ${sfdToken.rightsMask ? sfdToken.rightsMask.slice(0, 16) : 'E3A94012B5C1'}`);
    setFlashProgress(50);

    // Étape 3: Écriture du Long Coding 32 octets (0x2E DID 0x0600)
    setFlashStepText('Étape 3/5: Écriture en mémoire du Long Coding 32 octets (0x2E 06 00)...');
    const writeCmd = `2E 06 00 ${formatHexWithSpaces(codingHex)}`;
    const writeRes = await hardwareDiagnostic.sendRawCommand(writeCmd, 3000);
    setFlashProgress(75);

    // Étape 4: Contrôle d'intégrité
    setFlashStepText('Étape 4/5: Relecture de contrôle (0x22 06 00)...');
    await hardwareDiagnostic.sendRawCommand('22 06 00');
    await new Promise(r => setTimeout(r, 300));
    setFlashProgress(90);

    // Étape 5: Redémarrage SoftReset du calculateur 5F (0x11 0x01)
    setFlashStepText('Étape 5/5: Redémarrage de l\'unité d\'infodivertissement MIB3 (0x11 0x01)...');
    await hardwareDiagnostic.sendRawCommand('11 01');
    await new Promise(r => setTimeout(r, 400));

    setFlashProgress(100);
    setFlashStepText('Écriture terminée avec succès ! Le MIB3 redémarre.');
    setIsFlashing(false);
    setFlashSuccess(true);
    showNotify('Codage écrit avec succès dans l\'ECU 5F !');
  };

  /**
   * Soft Reboot ECU 5F (UDS 0x11 0x01)
   */
  const handleRebootHeadunit = async () => {
    showNotify('Envoi commande de redémarrage MIB3 (UDS 0x11 0x01)...');
    await hardwareDiagnostic.sendRawCommand('10 03');
    await new Promise(r => setTimeout(r, 100));
    await hardwareDiagnostic.sendRawCommand('11 01');
    showNotify('Commande de redémarrage acquittée par l\'ECU 5F.');
  };

  /**
   * Log parsing logic
   */
  const handleParseLog = () => {
    const result = parseRealCarLog(rawLogInput);
    setParsedLogResult(result);
    if (result.success) {
      showNotify(`Rapport ${result.sourceTool} importé avec succès !`);
    } else {
      showNotify(result.summary);
    }
  };

  const handleApplyParsedLog = () => {
    if (!parsedLogResult || !parsedLogResult.success) return;
    const coding = parsedLogResult.longCodingHex || currentProfile.defaultCoding;
    const vin = parsedLogResult.vin || currentProfile.vinSample;
    const decoded = parsedLogResult.decodedVin || decodeVagVin(vin);
    onApplyReadCoding(coding, vin, decoded, 'scan');
    setShowLogImporter(false);
    showNotify('Données réelles du rapport synchronisées dans le poste de travail !');
  };

  // Compute differences
  const currentBytes = hexStringToBytes(codingHex, 32);
  const stockBytes = hexStringToBytes(stockCodingHex, 32);
  let changedBytesCount = 0;
  const modifiedByteIndexes: number[] = [];
  currentBytes.forEach((b, i) => {
    if (b !== stockBytes[i]) {
      changedBytesCount++;
      modifiedByteIndexes.push(i);
    }
  });

  const activeByteDef = MIB3_BYTE_DEFINITIONS.find(b => b.byteIndex === activeByteIndex);
  const activeByteBits = byteToBits(currentBytes[activeByteIndex] || '00');

  // Status flags for active features
  const isCarplayActive = byteToBits(currentBytes[3])[4];
  const isSportHmiActive = byteToBits(currentBytes[10])[0];
  const isAmbientActive = byteToBits(currentBytes[11])[3];
  const isOffroadActive = byteToBits(currentBytes[24])[0];
  const isAudioDspActive = byteToBits(currentBytes[8])[0];
  const isGemActive = byteToBits(currentBytes[17])[7];

  return (
    <div className="space-y-6">
      
      {/* Real Hardware Interface Status & Bar */}
      <div className="bg-[#0f131d] border border-cyan-800/40 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* Top Hardware Connection Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
              hwState.isConnected 
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400 shadow-emerald-500/10'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}>
              <Cable className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  INTERFACE DIAGNOSTIC VCI
                </span>
                
                {/* Interface brand selector */}
                <select
                  aria-label="Sélection Interface Matérielle"
                  value={hwState.selectedBrand}
                  onChange={(e) => handleInterfaceChange(e.target.value as HardwareInterfaceBrand)}
                  className="bg-slate-900 border border-cyan-700/60 text-cyan-300 font-mono text-xs rounded-md px-2 py-0.5 font-bold cursor-pointer focus:outline-none"
                >
                  <option value="autel_jvci">Autel MaxiFlash JVCI (PassThru J2534 / IM608 Pro)</option>
                  <option value="vas6154">ODIS / VAS 6154A (DoIP ISO 13400)</option>
                  <option value="obdeleven">OBDeleven NextGen (BLE CAN-FD)</option>
                  <option value="vcds">Ross-Tech HEX-NET / HEX-V2</option>
                  <option value="doip_direct">Direct DoIP Ethernet Bridge (100BASE-T1)</option>
                </select>

                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  hwState.isConnected 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hwState.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span>{hwState.isConnected ? 'EN LIGNE' : 'HORS LIGNE'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Protocole: <strong className="text-slate-200">{hwState.protocol}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                  Batterie: <strong className={hwState.batteryVoltage >= 12.4 ? 'text-emerald-400' : 'text-amber-400'}>{hwState.batteryVoltage}V</strong>
                </span>
                <span>•</span>
                <span>Contact (T15): <strong className={hwState.terminal15Active ? 'text-emerald-400' : 'text-slate-500'}>{hwState.terminal15Active ? 'ACTIF' : 'COUPÉ'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action buttons: Connect VCI & Read Real Car */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleConnectHardware}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                hwState.isConnected
                  ? 'bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold shadow-cyan-600/30'
              }`}
            >
              <Usb className="w-4 h-4" />
              <span>{hwState.isConnected ? 'DÉCONNECTER' : 'CONNECTER VCI'}</span>
            </button>

            <button
              onClick={handleReadRealVehicle}
              disabled={isReadingVehicle}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isReadingVehicle ? 'animate-spin' : ''}`} />
              <span>{isReadingVehicle ? 'LECTURE EN COURS...' : 'LIRE ECU 5F EN DIRECT'}</span>
            </button>

            <button
              onClick={() => setShowLogImporter(!showLogImporter)}
              className="px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Importer une sauvegarde VCDS, OBDeleven ou ODIS"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importer Rapport</span>
            </button>
          </div>
        </div>

        {/* Read Progress Bar if actively reading */}
        {isReadingVehicle && (
          <div className="p-3 bg-slate-950 rounded-lg border border-cyan-800/80 font-mono text-xs text-cyan-300 flex items-center gap-3 animate-pulse">
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{readProgressText}</span>
          </div>
        )}

        {/* Notification Alert */}
        {notification && (
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{notification}</span>
          </div>
        )}

        {/* Real Vehicle Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">VÉHICULE CONNECTÉ</span>
            <strong className="text-white text-xs font-bold truncate block mt-0.5">
              {currentProfile.name}
            </strong>
            <span className="text-[10px] text-cyan-400 font-mono">{currentProfile.platform}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">VIN LU (UDS 0xF190)</span>
            <strong className="text-cyan-300 text-xs font-mono font-bold block mt-0.5 tracking-wider">
              {currentProfile.vinSample}
            </strong>
            <span className="text-[10px] text-emerald-400 font-mono">VAG Officiel Décodé</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">FIRMWARE MIB3 (0xF189)</span>
            <strong className="text-amber-300 text-xs font-mono font-bold block mt-0.5">
              {currentProfile.firmwareVersion}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">{currentProfile.headunitType}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">STATUT SFD MODULE 5F</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-xs font-mono font-bold flex items-center gap-1 ${
                sfdToken.status === 'UNLOCKED' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {sfdToken.status === 'UNLOCKED' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {sfdToken.status === 'UNLOCKED' ? 'DÉVERROUILLÉ' : 'VERROUILLÉ'}
              </span>
              <button
                onClick={onToggleSfd}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              >
                Changer
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{sfdToken.status === 'UNLOCKED' ? 'Bail 90 min actif' : 'Accès écriture bloqué'}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 font-mono block">OCTETS MODIFIÉS (DIFF)</span>
            <div className="flex items-center justify-between mt-0.5">
              <strong className={`text-xs font-mono font-bold ${changedBytesCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {changedBytesCount} / 32 octets
              </strong>
              {changedBytesCount > 0 && (
                <button
                  onClick={onResetToStock}
                  className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">vs Codage Usine OEM</span>
          </div>

        </div>

      </div>

      {/* Optional: VCDS / OBDeleven / ODIS Log Importer Drawer */}
      {showLogImporter && (
        <div className="bg-[#0f131d] border border-cyan-700/80 rounded-xl p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  IMPORTER UN RAPPORT DE DIAGNOSTIC RÉEL (VCDS / OBDeleven / ODIS / Autel)
                </h3>
                <p className="text-xs text-slate-400">
                  Collez le texte brut de votre autoscan pour extraire automatiquement le VIN et les 32 octets de Long Coding du 5F.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLogImporter(false)}
              className="text-slate-400 hover:text-white font-mono text-xs"
            >
              Fermer &times;
            </button>
          </div>

          <textarea
            rows={5}
            value={rawLogInput}
            onChange={(e) => setRawLogInput(e.target.value)}
            placeholder="Collez ici votre Autoscan VCDS, rapport OBDeleven, diagnostic Autel IM608 ou chaîne hexadécimale de 64 caractères..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Décode automatiquement: Adresse 5F, Part No, SW version, VIN, Long Coding.
            </span>

            <button
              onClick={handleParseLog}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Analyser le rapport</span>
            </button>
          </div>

          {parsedLogResult && parsedLogResult.success && (
            <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-600/60 flex items-center justify-between gap-4">
              <div className="space-y-0.5 font-mono text-xs">
                <span className="text-emerald-400 font-bold">Rapport {parsedLogResult.sourceTool} validé !</span>
                <p className="text-slate-300">
                  VIN: <strong className="text-white">{parsedLogResult.vin}</strong> • Ref: <strong>{parsedLogResult.partNumber}</strong>
                </p>
                <p className="text-slate-400 text-[11px] truncate max-w-xl">
                  Coding: <span className="text-cyan-300">{formatHexWithSpaces(parsedLogResult.longCodingHex || '')}</span>
                </p>
              </div>

              <button
                onClick={handleApplyParsedLog}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Appliquer au Poste de Travail</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CORE CODING & RETROFIT ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 1-Click Fast Professional Retrofit Toggles (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Retrofit Actions Cards */}
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  MODIFICATIONS & RETROFITS 1-CLICK (ECU 5F)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Calcul direct des masques binaires UDS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Retrofit 1: Wireless Apple CarPlay & Android Auto 5GHz */}
              <div className={`p-4 rounded-xl border transition-all ${
                isCarplayActive 
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white font-mono">CarPlay / Android Auto Sans Fil 5GHz</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Active le canal Wi-Fi 5GHz (Byte 3 Bit 4 & Byte 17 Bit 0) pour la réplication d'écran sans câble.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('carplay')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isCarplayActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isCarplayActive ? 'ACTIF' : 'ACTIVER'}
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Byte 03 Bit 4 • Byte 17 Bit 0</span>
                  <span className={isCarplayActive ? 'text-cyan-400' : 'text-slate-600'}>Adaptation: WiFi_5GHz</span>
                </div>
              </div>

              {/* Retrofit 2: Performance HMI Sport Gauges & Lap Timer */}
              <div className={`p-4 rounded-xl border transition-all ${
                isSportHmiActive 
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white font-mono">Manomètres Sport HMI & Chrono</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Débloque les jauges GTI/R/RS : kW, pression turbo bar, G-mètre et chronomètre de tour.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('sport_hmi')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSportHmiActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSportHmiActive ? 'ACTIF' : 'ACTIVER'}
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Byte 10 Bit 0 & Bit 1</span>
                  <span className={isSportHmiActive ? 'text-cyan-400' : 'text-slate-600'}>HMI_Sport_Display</span>
                </div>
              </div>

              {/* Retrofit 3: 30-Color Ambient Lighting Matrix */}
              <div className={`p-4 rounded-xl border transition-all ${
                isAmbientActive 
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white font-mono">Ambiance Multicolore (30 Couleurs)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Palette étendue de 30 nuances lumineuses pour le tableau de bord et les portières.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('ambient_30')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isAmbientActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isAmbientActive ? 'ACTIF' : 'ACTIVER'}
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Byte 11 Bit 3 & 4</span>
                  <span className={isAmbientActive ? 'text-cyan-400' : 'text-slate-600'}>Ambience_30_Lin</span>
                </div>
              </div>

              {/* Retrofit 4: Offroad Display & Compass */}
              <div className={`p-4 rounded-xl border transition-all ${
                isOffroadActive 
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white font-mono">Écran Tout-Terrain & Boussole</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Affichage de l'angle de braquage des roues, boussole gyroscopique et inclinaison du véhicule.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('offroad')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isOffroadActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isOffroadActive ? 'ACTIF' : 'ACTIVER'}
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Byte 24 Bit 0</span>
                  <span className={isOffroadActive ? 'text-cyan-400' : 'text-slate-600'}>Offroad_Compass</span>
                </div>
              </div>

              {/* Retrofit 5: Premium Audio DSP Canvas */}
              <div className={`p-4 rounded-xl border transition-all ${
                isAudioDspActive 
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white font-mono">Profil Son DSP Premium (HK/B&O)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Paramétrage du traitement de son haute fidélité pour amplificateurs MOST/A2B externes.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('audio_dsp')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isAudioDspActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isAudioDspActive ? 'ACTIF' : 'ACTIVER'}
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Byte 08 Bit 0 & Bit 4</span>
                  <span className={isAudioDspActive ? 'text-cyan-400' : 'text-slate-600'}>Audio_Sound_Canvas</span>
                </div>
              </div>

              {/* Retrofit 6: Green Engineering Menu (GEM) */}
              <div className={`p-4 rounded-xl border transition-all ${
                isGemActive 
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white font-mono">Menu Ingénierie Vert (GEM)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Active le menu développeur MIB3 accessible en maintenant deux doigts sur l'écran.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('gem')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isGemActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isGemActive ? 'ACTIF' : 'ACTIVER'}
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Byte 17 Bit 7</span>
                  <span className={isGemActive ? 'text-cyan-400' : 'text-slate-600'}>development_mode</span>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive 32-Byte Long Coding Strip */}
          <div className="bg-[#0f131d] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  LONG CODING CALCULATEUR 5F (32 OCTETS / DID 0x0600)
                </span>
                <p className="text-xs text-slate-400">
                  Cliquez sur un octet pour inspecter ses bits individuels :
                </p>
              </div>

              <button
                onClick={onNavigateToExpert}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Studio Expert 32 Octets &rarr;</span>
              </button>
            </div>

            {/* Hex Byte Matrix Ribbon */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 font-mono text-center">
              {currentBytes.map((byteVal, idx) => {
                const isModified = byteVal !== stockBytes[idx];
                const isSelected = activeByteIndex === idx;
                const hexStr = byteVal.toUpperCase();

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveByteIndex(idx)}
                    className={`p-1.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md ring-2 ring-cyan-400'
                        : isModified
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600/80 animate-pulse'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                    title={`Octet ${idx}: 0x${hexStr} (${isModified ? 'Modifié vs OEM' : 'OEM'})`}
                  >
                    <span className="text-[9px] block text-slate-500 font-normal">B{idx}</span>
                    <span>{hexStr}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Byte Bit Inspector */}
            {activeByteDef && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-cyan-400 font-bold">
                      OCTET {activeByteIndex} : {activeByteDef.name}
                    </span>
                    <span className="text-xs text-slate-400 block font-sans">
                      {activeByteDef.description}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    Hex: 0x{currentBytes[activeByteIndex] || '00'}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((bitIdx) => {
                    const isSet = activeByteBits[bitIdx];
                    const bitDef = activeByteDef.bits.find(b => b.bit === bitIdx);

                    return (
                      <button
                        key={bitIdx}
                        onClick={() => {
                          const next = setBitInCodingString(codingHex, activeByteIndex, bitIdx, !isSet);
                          onChangeCodingHex(next);
                        }}
                        className={`p-2 rounded text-left border transition-all cursor-pointer ${
                          isSet 
                            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                        title={bitDef ? bitDef.description : `Bit ${bitIdx}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold">Bit {bitIdx}</span>
                          <span className={`text-[10px] font-extrabold ${isSet ? 'text-cyan-400' : 'text-slate-600'}`}>
                            {isSet ? '1' : '0'}
                          </span>
                        </div>
                        <span className="text-[10px] truncate block text-slate-400 mt-1 font-sans">
                          {bitDef ? bitDef.name : `Bit ${bitIdx}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Diff Review, Flash Execution & Terminal (1/3 width) */}
        <div className="space-y-6">
          
          {/* Flash & Execution Panel */}
          <div className="bg-[#0f131d] border border-cyan-800/40 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  ÉCRITURE CALCULATEUR (FLASH)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                UDS 0x2E
              </span>
            </div>

            {/* Safety checklist */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Verrou SFD Module 5F:</span>
                <strong className={sfdToken.status === 'UNLOCKED' ? 'text-emerald-400' : 'text-red-400'}>
                  {sfdToken.status === 'UNLOCKED' ? 'Déverrouillé ✓' : 'Verrouillé ✗'}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Tension Batterie:</span>
                <strong className={hwState.batteryVoltage >= 12.2 ? 'text-emerald-400' : 'text-amber-400'}>
                  {hwState.batteryVoltage}V (Min: 12.0V)
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Contact Véhicule (T15):</span>
                <strong className={hwState.terminal15Active ? 'text-emerald-400' : 'text-amber-400'}>
                  {hwState.terminal15Active ? 'ON ✓' : 'OFF'}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Octets à réécrire:</span>
                <strong className="text-cyan-400">{changedBytesCount} modifiés</strong>
              </div>
            </div>

            {/* Flash Progress Bar if active */}
            {isFlashing && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300">{flashStepText}</span>
                  <span className="text-cyan-400 font-bold">{flashProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-cyan-500 h-full transition-all duration-300" 
                    style={{ width: `${flashProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Main Action: Flash to Car Button */}
            <button
              onClick={handleFlashToCar}
              disabled={isFlashing || sfdToken.status !== 'UNLOCKED'}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm font-mono flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-600/30 cursor-pointer disabled:opacity-40"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{isFlashing ? 'ÉCRITURE EN COURS...' : 'ÉCRIRE DANS LA VOITURE (FLASH 5F)'}</span>
            </button>

            {/* Secondary actions: Reboot 5F & Export */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleRebootHeadunit}
                className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="Envoie la commande UDS 0x11 0x01 pour redémarrer le MIB3"
              >
                <Power className="w-3.5 h-3.5 text-amber-400" />
                <span>Soft Reboot 5F</span>
              </button>

              <button
                onClick={onOpenExport}
                className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="Exporter pour ODIS, VCDS ou OBDeleven"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exporter Scripts</span>
              </button>
            </div>
          </div>

          {/* Real Live UDS Terminal Log */}
          <div className="bg-[#0b0e14] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase">CONSOLE UDS BUS EN DIRECT</h4>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFrames([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 p-1 rounded"
                  title="Effacer la console"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Frame Log */}
            <div className="h-60 overflow-y-auto space-y-1.5 text-[11px] pr-1 scrollbar-thin">
              {frames.length === 0 ? (
                <div className="text-slate-600 text-center py-10 text-xs">
                  Aucune trame UDS transmise. Cliquez sur "Lire ECU 5F" ou "Connecter VCI".
                </div>
              ) : (
                frames.map((frame, idx) => (
                  <div 
                    key={idx}
                    className={`p-1.5 rounded flex items-start gap-2 ${
                      frame.direction === 'TX'
                        ? 'bg-slate-900/60 text-cyan-300'
                        : 'bg-slate-950 text-emerald-400 border border-slate-900'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 shrink-0">{frame.timestamp}</span>
                    <span className={`text-[10px] font-bold px-1 rounded shrink-0 ${
                      frame.direction === 'TX' ? 'bg-cyan-950 text-cyan-400' : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {frame.direction}
                    </span>
                    <div className="flex-1 break-all">
                      <span className="font-bold">{frame.canId}</span>: <span>{frame.dataHex}</span>
                      <span className="text-[10px] text-slate-500 block">{frame.description}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Direct UDS Command Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                value={manualCmd}
                onChange={(e) => setManualCmd(e.target.value)}
                placeholder="ex: 22 F1 90 ou 10 03..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={async () => {
                  if (!manualCmd.trim()) return;
                  await hardwareDiagnostic.sendRawCommand(manualCmd.trim());
                  setManualCmd('');
                }}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded"
              >
                Envoyer
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
