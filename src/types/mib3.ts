export type VagBrand = 'Audi' | 'Volkswagen' | 'Cupra' | 'Skoda' | 'Porsche';

export interface VehicleProfile {
  id: string;
  name: string;
  brand: VagBrand;
  platform: 'MQB-evo' | 'MLB-evo' | 'MEB' | 'MSB';
  headunitType: 'MIB3 High (Harman)' | 'MIB3 Standard (Aptiv/Delphi)' | 'MIB3 Entry (Technisat)' | 'MIB3GP (Audi MMI)';
  vinSample: string;
  defaultCoding: string;
  firmwareVersion: string;
}

export interface BitDefinition {
  bit: number;
  name: string;
  description: string;
  options?: { value: number; label: string }[];
}

export interface ByteDefinition {
  byteIndex: number;
  name: string;
  category: 'System' | 'Brand & Platform' | 'Display & UI' | 'Audio' | 'Connectivity' | 'Vehicle Features' | 'Navigation' | 'Developer & Services';
  description: string;
  bits: BitDefinition[];
}

export interface AdaptationChannel {
  id: string;
  channelName: string;
  subName?: string;
  category: 'Connectivity' | 'Lighting & Ambience' | 'Display & Virtual Cockpit' | 'Audio & Acoustics' | 'Developer & Services' | 'Vehicle Configuration';
  currentValue: string;
  defaultValue: string;
  allowedValues?: string[];
  description: string;
  requiresSfd: boolean;
  securityAccess?: string;
}

export interface RetrofitRecipe {
  id: string;
  title: string;
  category: 'Connectivity' | 'Sport & Cockpit' | 'Comfort & Ambience' | 'Developer & Diagnostics' | 'Audio';
  description: string;
  complexity: 'Easy' | 'Moderate' | 'Advanced';
  estimatedTimeSec: number;
  requiresSfd: boolean;
  securityAccess: string;
  supportedUnits: string[];
  byteChanges: {
    byteIndex: number;
    bitIndex: number;
    targetValue: boolean;
    reason: string;
  }[];
  adaptationChanges: {
    channelId: string;
    targetValue: string;
    reason: string;
  }[];
  fecRequired?: string;
}

export interface FecCode {
  code: string;
  description: string;
  category: 'Connectivity' | 'Navigation' | 'Audio/Voice' | 'Sport/UI';
  defaultStatus: 'Installed' | 'Valid' | 'Not Installed' | 'Illegal';
}

export interface SfdTokenInfo {
  vin: string;
  brand: string;
  targetEcu: string;
  testerId: string;
  requestTime: string;
  expirationTime: string;
  rightsMask: string;
  status: 'LOCKED' | 'UNLOCKED' | 'EXPIRED' | 'OFFLINE_SIMULATED';
}

export type ExportTool = 'vcds' | 'obdeleven' | 'odis' | 'autel_jvci' | 'vcp' | 'doip_raw';
