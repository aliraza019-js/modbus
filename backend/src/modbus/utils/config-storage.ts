import * as fs from 'fs';
import * as path from 'path';

// Store config file in backend directory
// process.cwd() will be the backend directory when server runs from backend/
const CONFIG_FILE = path.join(process.cwd(), 'modbus-config.json');

export interface StoredConfig {
  host?: string;
  port?: number;
  slaveId?: number;
  timeout?: number;
  lastUpdated?: string;
}

export class ConfigStorage {
  /**
   * Load configuration from file
   */
  static loadConfig(): StoredConfig | null {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error: any) {
      console.error(`Failed to load config from file: ${error.message}`);
    }
    return null;
  }

  /**
   * Save configuration to file
   */
  static saveConfig(config: Partial<StoredConfig>): void {
    try {
      const existing = this.loadConfig() || {};
      const updated = {
        ...existing,
        ...config,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
    } catch (error: any) {
      console.error(`Failed to save config to file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get config file path (for logging)
   */
  static getConfigFilePath(): string {
    return CONFIG_FILE;
  }
}

