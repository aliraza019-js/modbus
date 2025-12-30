/**
 * IP Address validation utilities for Modbus device configuration
 * Supports any valid IPv4 address (no hardcoded restrictions)
 */

export class IpValidator {
  /**
   * Validates if IP address is a valid IPv4 address
   * No longer restricted to 192.168.100.x range - supports any valid IP
   */
  static isValidModbusIp(ip: string): boolean {
    return this.isValidIpFormat(ip);
  }

  /**
   * Validates IP address format (any valid IPv4)
   */
  static isValidIpFormat(ip: string): boolean {
    if (!ip || typeof ip !== 'string') {
      return false;
    }

    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!ipRegex.test(ip)) {
      return false;
    }

    const parts = ip.split('.').map(Number);
    
    // Check all parts are valid (0-255) and not NaN
    if (parts.length !== 4 || parts.some(part => isNaN(part) || part < 0 || part > 255)) {
      return false;
    }

    // Reject 0.0.0.0 and 255.255.255.255 as invalid device addresses
    if (ip === '0.0.0.0' || ip === '255.255.255.255') {
      return false;
    }

    return true;
  }

  /**
   * Gets formatted error message for invalid IP
   */
  static getIpErrorMessage(ip: string): string {
    if (!ip || typeof ip !== 'string') {
      return `IP address is required`;
    }
    if (!this.isValidIpFormat(ip)) {
      return `Invalid IP address format: ${ip}. Must be a valid IPv4 address (e.g., 192.168.1.100)`;
    }
    return '';
  }
}

