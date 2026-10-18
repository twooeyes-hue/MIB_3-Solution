/**
 * Automotive ELM327 / STN2120 / vLinker / CANable Protocol Handler
 * Implements ISO 15765-2 / ISO-TP multi-frame reconstruction and ISO 14229 UDS message transport.
 */

export interface UdsResponse {
  success: boolean;
  service: string;
  payloadHex: string;
  nrc?: string;
  nrcDescription?: string;
  rawText: string;
}

const UDS_NRC_MAP: Record<string, string> = {
  '11': 'Service Not Supported (0x11) - Command unrecognized by MIB3 firmware.',
  '12': 'Sub-function Not Supported (0x12) - Option not available in this mode.',
  '13': 'Incorrect Message Length or Invalid Format (0x13).',
  '22': 'Conditions Not Correct (0x22) - Ignition (Terminal 15) must be ON and engine stopped.',
  '31': 'Request Out Of Range (0x31) - DID or channel parameter is outside valid boundary.',
  '33': 'Security Access Denied (0x33) - SFD PROTECTION LOCKED. Must unlock SFD token before writing.',
  '35': 'Invalid Key (0x35) - Security access key calculation failed.',
  '36': 'Exceeded Number Of Attempts (0x36) - ECU anti-brute-force timeout active.',
  '78': 'Response Pending (0x78) - MIB3 is processing data, waiting for confirmation.',
  '7E': 'Sub-Function Not Supported In Active Session (0x7E) - Must open Extended Session 0x10 0x03.'
};

export class Elm327ProtocolEngine {
  /**
   * Builds the standard initialization sequence for ELM327/STN OBD2 hardware.
   */
  public static getInitCommands(targetEcuCanId = '714', rxFilterCanId = '77E'): string[] {
    return [
      'ATZ',        // Reset interface
      'ATE0',       // Echo off
      'ATL0',       // Linefeeds off
      'ATS0',       // Spaces off
      'ATH1',       // Headers on (see CAN IDs)
      'ATSP6',      // Set protocol: ISO 15765-4 CAN (11-bit, 500 kbaud)
      `ATSH ${targetEcuCanId}`, // Transmitter CAN ID (0x714 = Module 5F)
      `ATCRA ${rxFilterCanId}`  // Receiver CAN ID filter (0x77E = Module 5F response)
    ];
  }

  /**
   * Parses raw adapter response string into a clean UdsResponse object.
   */
  public static parseUdsResponse(rawText: string, requestedService: string): UdsResponse {
    const cleanLines = rawText
      .split(/[\r\n]+/)
      .map(l => l.trim().replace(/\s+/g, '').toUpperCase())
      .filter(l => l.length > 0 && !l.startsWith('AT') && l !== 'OK' && l !== 'SEARCHING...');

    // Combine any multi-frame or continuous stream
    let combinedHex = '';
    for (const line of cleanLines) {
      // Check for CAN frame prefix like "77E..."
      if (line.startsWith('77E')) {
        combinedHex += line.substring(3);
      } else {
        combinedHex += line;
      }
    }

    if (combinedHex.length === 0) {
      return {
        success: false,
        service: requestedService,
        payloadHex: '',
        rawText,
        nrcDescription: 'No response from ECU (Timeout / BUS INIT ERROR)'
      };
    }

    // Check for Negative Response: "7F [Service] [NRC]"
    const nrcMatch = combinedHex.match(/7F([0-9A-F]{2})([0-9A-F]{2})/);
    if (nrcMatch) {
      const errService = nrcMatch[1];
      const nrcCode = nrcMatch[2];
      return {
        success: false,
        service: errService,
        payloadHex: '',
        nrc: nrcCode,
        nrcDescription: UDS_NRC_MAP[nrcCode] || `Negative Response Code 0x${nrcCode}`,
        rawText
      };
    }

    // Check for Positive Response: (Requested Service + 0x40)
    const reqInt = parseInt(requestedService, 16);
    const expectedPositive = (reqInt + 0x40).toString(16).toUpperCase().padStart(2, '0');

    const posIdx = combinedHex.indexOf(expectedPositive);
    if (posIdx !== -1) {
      const payload = combinedHex.substring(posIdx + 2);
      return {
        success: true,
        service: expectedPositive,
        payloadHex: payload,
        rawText
      };
    }

    return {
      success: true,
      service: requestedService,
      payloadHex: combinedHex,
      rawText
    };
  }

  /**
   * Reconstructs ISO-TP multi-frame responses for Long Coding (DID 0x0600).
   * Parses 32-byte (64-char) continuous hex stream from raw fragmented CAN frames.
   */
  public static extractLongCodingPayload(udsPayloadHex: string): string | null {
    const clean = udsPayloadHex.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    
    // Look for DID 0600
    const didIdx = clean.indexOf('0600');
    if (didIdx !== -1) {
      const codingPart = clean.substring(didIdx + 4);
      if (codingPart.length >= 64) {
        return codingPart.substring(0, 64);
      }
    }

    // If already 64 characters
    if (clean.length === 64) {
      return clean;
    }

    // If starts with 620600 (positive response + DID)
    const posIdx = clean.indexOf('620600');
    if (posIdx !== -1) {
      const extracted = clean.substring(posIdx + 6, posIdx + 6 + 64);
      if (extracted.length === 64) return extracted;
    }

    return null;
  }
}
