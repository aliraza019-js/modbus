import { useEffect, useState } from 'react';
import Head from 'next/head';
import Icon from '@mdi/react';
import { 
  mdiCog, 
  mdiChartLine, 
  mdiDatabase, 
  mdiDownload, 
  mdiLightningBolt, 
  mdiPowerPlug,
  mdiMapMarker,
  mdiNumeric,
  mdiRefresh,
  mdiClockOutline,
  mdiAlert,
  mdiChartBar,
  mdiInformation,
  mdiMagnify
} from '@mdi/js';
import ModbusLogo from '../components/ModbusLogo';

interface ModbusValue {
  address: number;
  rawValue: number;
}

interface ModbusResponse {
  success: boolean;
  type: string;
  values: ModbusValue[];
  timestamp: string;
  error?: string;
}

// Get API URL from environment, with fallback based on NODE_ENV
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback: check if we're in production
  if (typeof window !== 'undefined') {
    // Client-side: check hostname
    const hostname = window.location.hostname;
    if (hostname === 'modbus.ducorr.com' || hostname.includes('ducorr.com')) {
      return 'https://ap-modbus.ducorr.com';
    }
  }
  
  // Default to localhost for local development
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();
// Ducorr primary color - professional industrial blue
const DUCORR_PRIMARY = '#0066CC';

export default function Home() {
  const [data, setData] = useState<ModbusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [config, setConfig] = useState({
    type: 'holding',
    address: 0,
    quantity: 1,
  });

  const fetchModbusData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('connecting');
      
      const params = new URLSearchParams({
        type: config.type,
        address: config.address.toString(),
        quantity: config.quantity.toString(),
      });

      const response = await fetch(`${API_URL}/modbus/read?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: ModbusResponse = await response.json();

      if (result.success) {
        setData(result);
        setConnectionStatus('connected');
      } else {
        setError(result.error || 'Failed to read Modbus data');
        setConnectionStatus('disconnected');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error. Make sure the backend is running on port 3001.');
      setData(null);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModbusData();

    if (autoRefresh) {
      const interval = setInterval(fetchModbusData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, config]);

  const handleConfigChange = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const getRegisterTypeInfo = (type: string) => {
    const types: { [key: string]: { name: string; icon: string; color: string; description: string } } = {
      holding: { name: 'Holding Registers', icon: mdiDatabase, color: DUCORR_PRIMARY, description: 'Read/write analog values' },
      input: { name: 'Input Registers', icon: mdiDownload, color: '#2c3e50', description: 'Read-only analog inputs' },
      coil: { name: 'Coils', icon: mdiLightningBolt, color: '#34495e', description: 'Read/write digital outputs' },
      discrete: { name: 'Discrete Inputs', icon: mdiPowerPlug, color: '#1a1a1a', description: 'Read-only digital inputs' },
    };
    return types[type] || types.holding;
  };

  const typeInfo = getRegisterTypeInfo(config.type);

  return (
    <>
      <Head>
        <title>Modbus Data Reader | Industrial Monitoring</title>
        <meta name="description" content="Real-time Modbus data monitoring" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerTop}>
              <div style={styles.titleContainer}>
                <div style={styles.logoContainer}>
                  <ModbusLogo width={180} height={60} showText={true} />
                </div>
                <h1 style={styles.title}>
                  Data Reader
                </h1>
              </div>
              <div style={styles.statusBadge}>
                <div 
                  style={{
                    ...styles.statusDot,
                    backgroundColor: connectionStatus === 'connected' ? '#10b981' : 
                                   connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444'
                  }}
                />
                <span style={styles.statusText}>
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            </div>
            <p style={styles.subtitle}>Real-time industrial automation monitoring</p>
            <div style={styles.deviceInfo}>
              <div style={styles.apiInfo}>
                <span style={styles.apiLabel}>API:</span>
                <code style={styles.apiCode}>{API_URL}</code>
              </div>
              <div style={styles.deviceConfig}>
                <span style={styles.deviceLabel}>Device IP:</span>
                <code style={styles.deviceValue}>192.168.100.40</code>
                <span style={styles.deviceLabel}>Slave ID:</span>
                <code style={styles.deviceValue}>1</code>
              </div>
            </div>
          </div>
        </header>

        {/* Configuration Panel */}
        <section style={styles.configPanel}>
          <div style={styles.configHeader}>
            <h2 style={styles.sectionTitle}>
              <Icon path={mdiCog} size={1.2} color={DUCORR_PRIMARY} />
              Configuration
            </h2>
          </div>
          
          <div style={styles.configGrid}>
            <div style={styles.configCard}>
              <label style={styles.label}>
                <Icon path={typeInfo.icon} size={1} color={DUCORR_PRIMARY} />
                Register Type
              </label>
              <select
                value={config.type}
                onChange={(e) => handleConfigChange('type', e.target.value)}
                style={styles.select}
              >
                <option value="holding">Holding Registers (4xxxx)</option>
                <option value="input">Input Registers (3xxxx)</option>
                <option value="coil">Coils (0xxxx)</option>
                <option value="discrete">Discrete Inputs (1xxxx)</option>
              </select>
              <p style={styles.helperText}>{typeInfo.description}</p>
            </div>

            <div style={styles.configCard}>
              <label style={styles.label}>
                <Icon path={mdiMapMarker} size={1} color={DUCORR_PRIMARY} />
                Start Address
              </label>
              <input
                type="number"
                value={config.address}
                onChange={(e) => handleConfigChange('address', parseInt(e.target.value) || 0)}
                style={styles.input}
                min="0"
                placeholder="0"
              />
            </div>

            <div style={styles.configCard}>
              <label style={styles.label}>
                <Icon path={mdiNumeric} size={1} color={DUCORR_PRIMARY} />
                Quantity
              </label>
              <input
                type="number"
                value={config.quantity}
                onChange={(e) => handleConfigChange('quantity', parseInt(e.target.value) || 1)}
                style={styles.input}
                min="1"
                max="125"
                placeholder="1"
              />
            </div>
          </div>

          <div style={styles.controls}>
            <button 
              onClick={fetchModbusData} 
              style={styles.button}
              disabled={loading}
            >
              <Icon path={mdiRefresh} size={1} color="white" />
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
            
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={styles.toggle}
              />
              <span style={styles.toggleText}>Auto Refresh</span>
            </label>
            
            {autoRefresh && (
              <div style={styles.intervalControl}>
                <label style={styles.intervalLabel}>Interval:</label>
                <input
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 2000)}
                  style={styles.intervalInput}
                  min="500"
                  step="500"
                />
                <span style={styles.intervalUnit}>ms</span>
              </div>
            )}
          </div>
        </section>

        {/* Live Readings Panel */}
        <section style={styles.dataPanel}>
          <div style={styles.dataHeader}>
            <h2 style={styles.sectionTitle}>
              <Icon path={mdiChartLine} size={1.2} color={DUCORR_PRIMARY} />
              Live Readings
            </h2>
            {data && data.success && (
              <div style={styles.timestamp}>
                <Icon path={mdiClockOutline} size={0.9} color="#666" />
                {new Date(data.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {loading && !data && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Connecting to Modbus device...</p>
            </div>
          )}

          {error && (
            <div style={styles.errorCard}>
              <Icon path={mdiAlert} size={1.5} color="#dc2626" />
              <div style={styles.errorContent}>
                <h3 style={styles.errorTitle}>Connection Error</h3>
                <p style={styles.errorMessage}>{error}</p>
              </div>
            </div>
          )}

          {data && data.success && (
            <div style={styles.dataContainer}>
              <div style={styles.metadataCard}>
                <div style={styles.metadataItem}>
                  <span style={styles.metadataLabel}>Type:</span>
                  <span style={{...styles.metadataValue, color: typeInfo.color, display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Icon path={typeInfo.icon} size={0.9} color={typeInfo.color} />
                    {typeInfo.name}
                  </span>
                </div>
                <div style={styles.metadataItem}>
                  <span style={styles.metadataLabel}>Registers:</span>
                  <span style={styles.metadataValue}>{data.values.length}</span>
                </div>
              </div>

              <div style={styles.valuesGrid}>
                {data.values.map((value, index) => (
                  <div key={index} style={styles.valueCard}>
                    <div style={styles.valueCardHeader}>
                      <Icon path={mdiChartBar} size={1.2} color={DUCORR_PRIMARY} />
                      <span style={styles.valueAddress}>Address {value.address}</span>
                    </div>
                    <div style={styles.valueContent}>
                      <div style={styles.valueRaw}>
                        {value.rawValue.toLocaleString()}
                      </div>
                      <div style={styles.valueFormats}>
                        <div style={styles.valueFormat}>
                          <span style={styles.formatLabel}>HEX</span>
                          <code style={styles.formatValue}>
                            0x{value.rawValue.toString(16).toUpperCase().padStart(4, '0')}
                          </code>
                        </div>
                        <div style={styles.valueFormat}>
                          <span style={styles.formatLabel}>BIN</span>
                          <code style={styles.formatValue}>
                            {value.rawValue.toString(2).padStart(16, '0').match(/.{1,4}/g)?.join(' ')}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <details style={styles.rawData}>
                <summary style={styles.summary}>
                  <Icon path={mdiMagnify} size={1} color="#333" />
                  View Raw JSON Response
                </summary>
                <pre style={styles.pre}>{JSON.stringify(data, null, 2)}</pre>
              </details>
            </div>
          )}
        </section>

        {/* Info Panel */}
        <section style={styles.infoPanel}>
          <h3 style={styles.infoTitle}>
            <Icon path={mdiInformation} size={1.2} color={DUCORR_PRIMARY} />
            About Modbus Registers
          </h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoCardIcon}>
                <Icon path={mdiDatabase} size={1.5} color="white" />
              </div>
              <h4 style={styles.infoCardTitle}>Holding Registers (4xxxx)</h4>
              <p style={styles.infoCardText}>Read/write analog values</p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoCardIcon}>
                <Icon path={mdiDownload} size={1.5} color="white" />
              </div>
              <h4 style={styles.infoCardTitle}>Input Registers (3xxxx)</h4>
              <p style={styles.infoCardText}>Read-only analog inputs</p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoCardIcon}>
                <Icon path={mdiLightningBolt} size={1.5} color="white" />
              </div>
              <h4 style={styles.infoCardTitle}>Coils (0xxxx)</h4>
              <p style={styles.infoCardText}>Read/write digital outputs</p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoCardIcon}>
                <Icon path={mdiPowerPlug} size={1.5} color="white" />
              </div>
              <h4 style={styles.infoCardTitle}>Discrete Inputs (1xxxx)</h4>
              <p style={styles.infoCardText}>Read-only digital inputs</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    color: '#333',
  },
  subtitle: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '1.1rem',
    fontWeight: '400',
  },
  deviceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px',
  },
  apiInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
  },
  apiLabel: {
    color: '#666',
    fontWeight: '500',
  },
  apiCode: {
    color: '#000000',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  deviceConfig: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '10px 15px',
    backgroundColor: '#e8f4f8',
    borderRadius: '8px',
    fontSize: '14px',
    flexWrap: 'wrap',
  },
  deviceLabel: {
    color: '#666',
    fontWeight: '500',
  },
  deviceValue: {
    color: DUCORR_PRIMARY,
    fontFamily: 'monospace',
    fontWeight: '600',
    padding: '2px 8px',
    backgroundColor: 'white',
    borderRadius: '4px',
  },
  configPanel: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
  },
  configHeader: {
    marginBottom: '25px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '25px',
  },
  configCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    border: '2px solid transparent',
    transition: 'all 0.3s ease',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  helperText: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: '#666',
  },
  select: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    paddingTop: '20px',
    borderTop: '2px solid #f0f0f0',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: DUCORR_PRIMARY,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  toggle: {
    cursor: 'pointer',
  },
  toggleText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  intervalControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  intervalLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
  },
  intervalInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    width: '80px',
    fontSize: '14px',
    outline: 'none',
  },
  intervalUnit: {
    fontSize: '14px',
    color: '#666',
  },
  dataPanel: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
  },
  dataHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f0f0f0',
    borderTop: `4px solid ${DUCORR_PRIMARY}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#666',
    fontSize: '16px',
    fontWeight: '500',
  },
  errorCard: {
    display: 'flex',
    gap: '20px',
    padding: '25px',
    backgroundColor: '#fef2f2',
    borderRadius: '15px',
    border: '2px solid #fecaca',
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#dc2626',
  },
  errorMessage: {
    margin: 0,
    fontSize: '14px',
    color: '#991b1b',
    lineHeight: '1.6',
  },
  dataContainer: {
    marginTop: '20px',
  },
  metadataCard: {
    display: 'flex',
    gap: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap',
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  metadataLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '25px',
  },
  valueCard: {
    padding: '25px',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    transition: 'all 0.3s ease',
  },
  valueCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  valueAddress: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  valueContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  valueRaw: {
    fontSize: '36px',
    fontWeight: '700',
    color: DUCORR_PRIMARY,
    lineHeight: '1.2',
  },
  valueFormats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  valueFormat: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: '8px',
  },
  formatLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    minWidth: '35px',
  },
  formatValue: {
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#333',
    fontWeight: '600',
  },
  rawData: {
    marginTop: '25px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    border: '2px solid #e0e0e0',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#333',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  pre: {
    marginTop: '15px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    color: '#00ff00',
    borderRadius: '10px',
    overflow: 'auto',
    fontSize: '13px',
    fontFamily: 'monospace',
    lineHeight: '1.6',
    border: '1px solid #333',
  },
  infoPanel: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
  },
  infoTitle: {
    margin: '0 0 25px 0',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    textAlign: 'center',
    transition: 'transform 0.2s',
  },
  infoCardIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
    backgroundColor: DUCORR_PRIMARY,
  },
  infoCardTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  infoCardText: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.5',
  },
};
