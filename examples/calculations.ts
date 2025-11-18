/**
 * Example calculations for converting Modbus raw values to meaningful units
 * 
 * These examples show common ways to interpret Modbus register values
 * based on different device specifications.
 */

// Example 1: Simple scaling (e.g., temperature sensor with 0.1°C resolution)
export function calculateTemperature(rawValue: number, scale: number = 0.1): number {
  return rawValue * scale;
}

// Example 2: Signed 16-bit integer
export function toSigned16Bit(rawValue: number): number {
  // If value is >= 32768, it's negative in two's complement
  return rawValue >= 32768 ? rawValue - 65536 : rawValue;
}

// Example 3: Read 32-bit float from two 16-bit registers
export function readFloat32(highRegister: number, lowRegister: number): number {
  // Create a buffer with the two 16-bit values
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeUInt16BE(highRegister, 0);
  buffer.writeUInt16BE(lowRegister, 2);
  return buffer.readFloatBE(0);
}

// Example 4: Read 32-bit integer from two 16-bit registers
export function readInt32(highRegister: number, lowRegister: number): number {
  return (highRegister << 16) | lowRegister;
}

// Example 5: Read signed 32-bit integer
export function readSignedInt32(highRegister: number, lowRegister: number): number {
  const value = (highRegister << 16) | lowRegister;
  return value >= 2147483648 ? value - 4294967296 : value;
}

// Example 6: Extract bits from a register (for packed data)
export function extractBits(register: number, startBit: number, length: number): number {
  const mask = (1 << length) - 1;
  return (register >> startBit) & mask;
}

// Example 7: Convert BCD (Binary Coded Decimal) to decimal
export function bcdToDecimal(bcdValue: number): number {
  let result = 0;
  let multiplier = 1;
  
  while (bcdValue > 0) {
    const digit = bcdValue & 0x0F;
    result += digit * multiplier;
    multiplier *= 10;
    bcdValue >>= 4;
  }
  
  return result;
}

// Example 8: Pressure sensor with offset and scale
export function calculatePressure(
  rawValue: number,
  scale: number = 0.01,
  offset: number = 0
): number {
  return (rawValue * scale) + offset;
}

// Example 9: Flow rate calculation
export function calculateFlowRate(
  rawValue: number,
  maxFlow: number = 100.0,
  maxRegister: number = 65535
): number {
  return (rawValue / maxRegister) * maxFlow;
}

// Example 10: Status word interpretation (checking individual bits)
export function parseStatusWord(register: number): {
  bit0: boolean;
  bit1: boolean;
  bit2: boolean;
  bit3: boolean;
  // ... add more bits as needed
} {
  return {
    bit0: (register & 0x0001) !== 0,
    bit1: (register & 0x0002) !== 0,
    bit2: (register & 0x0004) !== 0,
    bit3: (register & 0x0008) !== 0,
  };
}

/**
 * Usage example in your API route:
 * 
 * import { calculateTemperature, readFloat32 } from '@/examples/calculations';
 * 
 * // In your API handler:
 * const values = result.data.map((val, index) => {
 *   const rawValue = val;
 *   return {
 *     address: Number(address) + index,
 *     rawValue: rawValue,
 *     temperature: calculateTemperature(rawValue, 0.1), // °C
 *   };
 * });
 * 
 * // For 32-bit values:
 * if (quantity >= 2) {
 *   const floatValue = readFloat32(result.data[0], result.data[1]);
 *   // Use floatValue
 * }
 */

