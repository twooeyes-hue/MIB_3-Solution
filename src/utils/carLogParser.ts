import { decodeVagVin, DecodedVin } from './vagVinDecoder';
import { normalizeHexString } from './mib3CodingUtils';

export interface ParsedCarLog {
  success: boolean;
  rawText: string;
  sourceTool: 'VCDS' | 'OBDeleven' | 'ODIS' | 'Autel_IM608' | 'RawHex' | 'Unknown';
  vin?: string;
  decodedVin?: DecodedVin;
  partNumber?: string;
  softwareVersion?: string;
  hardwareNumber?: string;
  hardwareVersion?: string;
  componentName?: string;
  longCodingHex?: string;
  extractedAdaptations?: { channel: string; value: string }[];
  summary: string;
}

/**
 * Universal Parser for Real VAG Car Scans:
 * Parses VCDS Autoscans, OBDeleven Control Unit backups, Autel IM608 MaxiIM reports, ODIS logs, and raw hex strings.
 */
export function parseRealCarLog(input: string): ParsedCarLog {
  const text = input.trim();
  if (!text) {
    return {
      success: false,
      rawText: input,
      sourceTool: 'Unknown',
      summary: 'Empty input provided.'
    };
  }

  // 1. Check if input is a pure 64-char Hex Long Coding string
  const cleanHex = normalizeHexString(text);
  if (cleanHex.length === 64) {
    return {
      success: true,
      rawText: input,
      sourceTool: 'RawHex',
      longCodingHex: cleanHex,
      summary: `Successfully parsed 32-Byte (64 hex characters) Long Coding string.`
    };
  }

  // 2. Detect Source Tool
  let sourceTool: 'VCDS' | 'OBDeleven' | 'ODIS' | 'Autel_IM608' | 'RawHex' | 'Unknown' = 'Unknown';
  if (text.includes('Autel') || text.includes('MaxiIM') || text.includes('IM608') || text.includes('MaxiSys') || text.includes('MaxiFlash') || text.includes('System: 5F') || text.includes('5F - Information Control Unit 1')) {
    sourceTool = 'Autel_IM608';
  } else if (text.includes('Ross-Tech') || text.includes('Address 5F:') || text.includes('VCDS')) {
    sourceTool = 'VCDS';
  } else if (text.includes('OBDeleven') || text.includes('Control unit: 5F') || text.includes('Long coding:')) {
    sourceTool = 'OBDeleven';
  } else if (text.includes('ODIS') || text.includes('<Odis') || text.includes('DiagnosticSession')) {
    sourceTool = 'ODIS';
  }

  // 3. Extract VIN (17 alphanumeric chars starting with VAG WMIs: WVW, WAU, VSS, TMB, WP1, etc.)
  const vinMatch = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
  let vin: string | undefined;
  let decodedVin: DecodedVin | undefined;
  if (vinMatch) {
    vin = vinMatch[1].toUpperCase();
    decodedVin = decodeVagVin(vin);
  }

  // 4. Extract Long Coding (Look for 64 contiguous hex chars or space-separated hex)
  let longCodingHex: string | undefined;

  // Match "Coding: 03330024..." or "Long coding: \n 033300..."
  const codingLineMatch = text.match(/(?:Coding|Long coding|Code)\s*:?\s*([0-9A-Fa-f\s]{60,80})/i);
  if (codingLineMatch) {
    const candidate = normalizeHexString(codingLineMatch[1]);
    if (candidate.length >= 64) {
      longCodingHex = candidate.substring(0, 64);
    }
  }

  if (!longCodingHex) {
    // Search anywhere for 64 contiguous hex chars
    const raw64Match = text.match(/\b([0-9A-Fa-f]{64})\b/);
    if (raw64Match) {
      longCodingHex = raw64Match[1].toUpperCase();
    }
  }

  // 5. Extract Part Number & Software Version
  // VCDS: "Part No SW: 5H0 035 820 D    HW: 5H0 035 820"
  // OBDeleven: "Software number: 5H0035820D"
  let partNumber: string | undefined;
  let softwareVersion: string | undefined;
  let hardwareNumber: string | undefined;
  let componentName: string | undefined;

  const swPartMatch = text.match(/(?:Part No SW|Software number)\s*:?\s*([0-9A-Z\s]{9,15})/i);
  if (swPartMatch) {
    partNumber = swPartMatch[1].replace(/\s+/g, '').toUpperCase();
  }

  const swVerMatch = text.match(/(?:Software version|Component:\s*[A-Z0-9_-]+\s*H\d+\s*)\s*(\d{4}|[A-Z0-9_]{6,25})/i);
  if (swVerMatch) {
    softwareVersion = swVerMatch[1].trim();
  }

  const compMatch = text.match(/Component\s*:?\s*([^\r\n]+)/i);
  if (compMatch) {
    componentName = compMatch[1].trim();
  }

  const hwMatch = text.match(/(?:Part No HW|Hardware number)\s*:?\s*([0-9A-Z\s]{9,15})/i);
  if (hwMatch) {
    hardwareNumber = hwMatch[1].replace(/\s+/g, '').toUpperCase();
  }

  // 6. Extract any Adaptations
  const adaptations: { channel: string; value: string }[] = [];
  const lines = text.split(/[\r\n]+/);
  for (const line of lines) {
    // Pattern: Channel-Subchannel,Value or Channel: Value
    const adaptMatch = line.match(/([A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)?)\s*[,:=]\s*([A-Za-z0-9_]+)/);
    if (adaptMatch && !adaptMatch[1].toLowerCase().includes('coding') && !adaptMatch[1].toLowerCase().includes('part')) {
      adaptations.push({
        channel: adaptMatch[1].trim(),
        value: adaptMatch[2].trim()
      });
    }
  }

  const hasCoding = !!longCodingHex;
  const hasVin = !!vin;

  if (!hasCoding && !hasVin && !partNumber) {
    return {
      success: false,
      rawText: input,
      sourceTool,
      summary: 'Could not detect 5F Long Coding or VAG VIN in the pasted text. Please paste a VCDS autoscan, OBDeleven backup, or raw 64-char hex string.'
    };
  }

  const summary = [
    `Identified source: ${sourceTool}.`,
    hasVin ? `Vehicle VIN: ${vin} (${decodedVin?.brand} ${decodedVin?.modelSeries || ''}).` : 'No VIN found.',
    partNumber ? `Part No: ${partNumber}.` : '',
    hasCoding ? `Extracted 32-Byte Long Coding successfully.` : 'No 32-byte coding string found in log.'
  ].filter(Boolean).join(' ');

  return {
    success: true,
    rawText: input,
    sourceTool,
    vin,
    decodedVin,
    partNumber,
    softwareVersion,
    hardwareNumber,
    componentName,
    longCodingHex,
    extractedAdaptations: adaptations.length > 0 ? adaptations : undefined,
    summary
  };
}
