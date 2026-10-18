import { VagBrand } from '../types/mib3';

export interface DecodedVin {
  vin: string;
  isValid: boolean;
  brand: VagBrand | 'Unknown';
  manufacturer: string;
  country: string;
  modelSeries: string;
  platform: 'MQB-evo' | 'MLB-evo' | 'MEB' | 'MSB' | 'Legacy';
  modelYear: number;
  modelYearCode: string;
  assemblyPlant: string;
  serialNumber: string;
  detectedHeadunit: 'MIB3 High (Harman)' | 'MIB3GP (Audi MMI)' | 'MIB3 Standard (Aptiv/Delphi)' | 'MIB3 Entry (Technisat)' | 'Unknown';
}

const YEAR_CODES: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029
};

const PLANT_CODES: Record<string, string> = {
  'W': 'Wolfsburg, Germany',
  'E': 'Emden, Germany',
  'H': 'Hannover, Germany',
  'K': 'Osnabrück, Germany',
  'P': 'Mosel / Zwickau, Germany (MEB EV Plant)',
  'A': 'Ingolstadt, Germany (Audi)',
  'N': 'Neckarsulm, Germany (Audi)',
  'R': 'Martorell, Spain (SEAT / Cupra)',
  '8': 'Mladá Boleslav, Czech Republic (Škoda)',
  'L': 'Leipzig, Germany (Porsche)',
  'S': 'Stuttgart-Zuffenhausen, Germany (Porsche)',
  'M': 'Puebla, Mexico',
  '4': 'Curitiba, Brazil',
};

export function decodeVagVin(vinInput: string): DecodedVin {
  const vin = vinInput.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');

  if (vin.length !== 17) {
    return {
      vin: vinInput,
      isValid: false,
      brand: 'Unknown',
      manufacturer: 'Invalid VIN Length (Must be 17 characters)',
      country: 'Unknown',
      modelSeries: 'Unknown',
      platform: 'Legacy',
      modelYear: 0,
      modelYearCode: '',
      assemblyPlant: 'Unknown',
      serialNumber: '',
      detectedHeadunit: 'Unknown'
    };
  }

  const wmi = vin.substring(0, 3);
  const vds = vin.substring(3, 9);
  const yearChar = vin.charAt(9);
  const plantChar = vin.charAt(10);
  const serial = vin.substring(11, 17);

  let brand: VagBrand | 'Unknown' = 'Unknown';
  let manufacturer = 'Unknown VAG Manufacturer';
  let country = 'Germany';

  if (wmi === 'WVW' || wmi === 'WV1' || wmi === 'WV2') {
    brand = 'Volkswagen';
    manufacturer = 'Volkswagen AG (Germany)';
    country = 'Germany';
  } else if (wmi === 'WAU' || wmi === 'WA1' || wmi === 'WUA' || wmi === 'TRU') {
    brand = 'Audi';
    manufacturer = wmi === 'WUA' ? 'Audi Sport GmbH' : 'Audi AG';
    country = wmi === 'TRU' ? 'Hungary (Győr)' : 'Germany';
  } else if (wmi === 'VSS') {
    brand = 'Cupra';
    manufacturer = 'SEAT / Cupra S.A.';
    country = 'Spain';
  } else if (wmi === 'TMB' || wmi === 'TMP') {
    brand = 'Skoda';
    manufacturer = 'Škoda Auto a.s.';
    country = 'Czech Republic';
  } else if (wmi === 'WP1' || wmi === 'WP0') {
    brand = 'Porsche';
    manufacturer = 'Dr. Ing. h.c. F. Porsche AG';
    country = 'Germany';
  } else if (wmi === '1V1' || wmi === '3VW') {
    brand = 'Volkswagen';
    manufacturer = wmi === '1V1' ? 'Volkswagen USA (Chattanooga)' : 'Volkswagen de México';
    country = wmi === '1V1' ? 'USA' : 'Mexico';
  }

  // Detect Model Series from positions 7 and 8 (European VAG format)
  // or positions 4-6 (NAR format)
  const pos78 = vin.substring(6, 8);
  let modelSeries = 'VAG Vehicle';
  let platform: 'MQB-evo' | 'MLB-evo' | 'MEB' | 'MSB' | 'Legacy' = 'MQB-evo';
  let detectedHeadunit: 'MIB3 High (Harman)' | 'MIB3GP (Audi MMI)' | 'MIB3 Standard (Aptiv/Delphi)' | 'MIB3 Entry (Technisat)' | 'Unknown' = 'MIB3 High (Harman)';

  if (brand === 'Volkswagen') {
    if (pos78 === 'CD') {
      modelSeries = 'Golf Mk8 (CD1/CG5)';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else if (pos78 === 'CB') {
      modelSeries = 'Passat B8.5 Facelift (3G)';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else if (pos78 === '3H') {
      modelSeries = 'Arteon Facelift';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else if (pos78 === 'E1' || pos78 === 'E2') {
      modelSeries = 'ID.3 / ID.4 / ID.5 Electric';
      platform = 'MEB';
      detectedHeadunit = 'MIB3 Standard (Aptiv/Delphi)';
    } else if (pos78 === 'CT') {
      modelSeries = 'T-Roc Facelift';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 Standard (Aptiv/Delphi)';
    } else {
      modelSeries = `Volkswagen Series (${pos78})`;
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    }
  } else if (brand === 'Audi') {
    if (pos78 === 'GY') {
      modelSeries = 'Audi A3 / S3 / RS3 (8Y)';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3GP (Audi MMI)';
    } else if (pos78 === 'F2' || pos78 === '4K') {
      modelSeries = 'Audi A6 / S6 / RS6 / A7 (C8 / 4K)';
      platform = 'MLB-evo';
      detectedHeadunit = 'MIB3GP (Audi MMI)';
    } else if (pos78 === 'FY') {
      modelSeries = 'Audi Q5 / SQ5 Facelift';
      platform = 'MLB-evo';
      detectedHeadunit = 'MIB3GP (Audi MMI)';
    } else if (pos78 === '4M' || pos78 === '4L') {
      modelSeries = 'Audi Q7 / Q8 / RSQ8';
      platform = 'MLB-evo';
      detectedHeadunit = 'MIB3GP (Audi MMI)';
    } else {
      modelSeries = `Audi (${pos78})`;
      platform = 'MLB-evo';
      detectedHeadunit = 'MIB3GP (Audi MMI)';
    }
  } else if (brand === 'Cupra') {
    if (pos78 === 'KM') {
      modelSeries = 'Cupra Formentor (KM7)';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else if (pos78 === 'KL') {
      modelSeries = 'Leon Mk4 / Cupra Leon';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else if (pos78 === 'K1') {
      modelSeries = 'Cupra Born EV';
      platform = 'MEB';
      detectedHeadunit = 'MIB3 Standard (Aptiv/Delphi)';
    } else {
      modelSeries = `Cupra / SEAT (${pos78})`;
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    }
  } else if (brand === 'Skoda') {
    if (pos78 === 'NX') {
      modelSeries = 'Škoda Octavia Mk4 (NX)';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 Standard (Aptiv/Delphi)';
    } else if (pos78 === 'NY') {
      modelSeries = 'Škoda Enyaq iV';
      platform = 'MEB';
      detectedHeadunit = 'MIB3 Standard (Aptiv/Delphi)';
    } else if (pos78 === '3V') {
      modelSeries = 'Škoda Superb Mk3 Facelift';
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else {
      modelSeries = `Škoda (${pos78})`;
      platform = 'MQB-evo';
      detectedHeadunit = 'MIB3 Standard (Aptiv/Delphi)';
    }
  } else if (brand === 'Porsche') {
    if (pos78 === '95' || pos78 === '9B') {
      modelSeries = 'Porsche Macan III';
      platform = 'MSB';
      detectedHeadunit = 'MIB3 High (Harman)';
    } else if (pos78 === 'Y1') {
      modelSeries = 'Porsche Taycan';
      platform = 'MSB';
      detectedHeadunit = 'MIB3GP (Audi MMI)';
    } else {
      modelSeries = `Porsche (${pos78})`;
      platform = 'MSB';
      detectedHeadunit = 'MIB3 High (Harman)';
    }
  }

  const modelYear = YEAR_CODES[yearChar] || 2023;
  const assemblyPlant = PLANT_CODES[plantChar] || `Plant Code ${plantChar}`;

  return {
    vin,
    isValid: true,
    brand,
    manufacturer,
    country,
    modelSeries,
    platform,
    modelYear,
    modelYearCode: yearChar,
    assemblyPlant,
    serialNumber: serial,
    detectedHeadunit
  };
}

/**
 * Converts raw UDS 0x22 0xF190 ASCII hex response from ECU to VIN string.
 * Example: "62 F1 90 57 56 57 5A 5A 5A 43 44 5A 4D 57 30 31 39 32 38 34" -> "WVWZZZCDZMW019284"
 */
export function parseVinFromUdsResponse(rawHex: string): string {
  const clean = rawHex.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  
  // Find "62F190" (UDS positive response to 22 F1 90)
  const headerIdx = clean.indexOf('62F190');
  let hexBytes = '';
  
  if (headerIdx !== -1) {
    hexBytes = clean.substring(headerIdx + 6, headerIdx + 6 + 34); // 17 bytes * 2
  } else {
    // Or take first 34 hex characters if raw payload
    hexBytes = clean.substring(0, 34);
  }

  let vin = '';
  for (let i = 0; i < hexBytes.length; i += 2) {
    const code = parseInt(hexBytes.substring(i, i + 2), 16);
    if (code >= 32 && code <= 126) {
      vin += String.fromCharCode(code);
    }
  }

  return vin.trim();
}
