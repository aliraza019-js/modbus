/**
 * Slave ID validation utilities
 */

export class SlaveIdValidator {
  /**
   * Validates if Slave ID is in range 1-255
   */
  static isValid(slaveId: number): boolean {
    return Number.isInteger(slaveId) && slaveId >= 1 && slaveId <= 255;
  }

  /**
   * Gets error message for invalid Slave ID
   */
  static getErrorMessage(slaveId: number): string {
    if (!Number.isInteger(slaveId)) {
      return `Slave ID must be an integer. Got: ${slaveId}`;
    }
    if (slaveId < 1 || slaveId > 255) {
      return `Slave ID must be in range 1-255. Got: ${slaveId}`;
    }
    return '';
  }
}

