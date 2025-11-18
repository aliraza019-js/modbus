/**
 * IP Address validation utilities for Modbus device configuration
 */

export class IpValidator {
  /**
   * Validates if IP address is in the range 192.168.100.1 to 192.168.100.255
   */
  static isValidModbusIp(ip: string): boolean {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipRegex);
    
    if (!match) {
      return false;
    }

    const [, octet1, octet2, octet3, octet4] = match.map(Number);

    // Check if it's in the 192.168.100.x range
    if (octet1 !== 192 || octet2 !== 168 || octet3 !== 100) {
      return false;
    }

    // Check if last octet is in range 1-255
    if (octet4 < 1 || octet4 > 255) {
      return false;
    }

    return true;
  }

  /**
   * Validates IP address format
   */
  static isValidIpFormat(ip: string): boolean {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipRegex.test(ip)) {
      return false;
    }

    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  /**
   * Gets formatted error message for invalid IP
   */
  static getIpErrorMessage(ip: string): string {
    if (!this.isValidIpFormat(ip)) {
      return `Invalid IP address format: ${ip}`;
    }
    if (!this.isValidModbusIp(ip)) {
      return `IP address must be in range 192.168.100.1 to 192.168.100.255. Got: ${ip}`;
    }
    return '';
  }
}

