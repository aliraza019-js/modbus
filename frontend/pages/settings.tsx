import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Icon from '@mdi/react';
import { 
  mdiCog, 
  mdiArrowLeft,
  mdiDatabase, 
  mdiDownload, 
  mdiLightningBolt, 
  mdiPowerPlug,
  mdiMapMarker,
  mdiRuler,
  mdiRefresh,
  mdiClockOutline,
  mdiInformation,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiChartLine,
  mdiLan
} from '@mdi/js';
import DooterLogo from '../components/DooterLogo';

// Get API URL from environment
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'modbus.ducorr.com' || hostname.includes('ducorr.com')) {
      return 'https://ap-modbus.ducorr.com';
    }
  }
  return 'http://localhost:3002';
};

const API_URL = getApiUrl();
const DUCORR_PRIMARY = '#d9823f';

export default function Settings() {
  const router = useRouter();
  const [deviceIp, setDeviceIp] = useState('192.168.100.49');
  const [devicePort, setDevicePort] = useState(5000);
  const [slaveId, setSlaveId] = useState(1);
  const [registerType, setRegisterType] = useState('holding');
  const [startAddress, setStartAddress] = useState(0);
  const [addressLength, setAddressLength] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/modbus/config`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.config) {
            setDeviceIp(result.config.host || '192.168.100.49');
            setDevicePort(result.config.port || 5000);
            setSlaveId(result.config.slaveId || 1);
          }
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveMessage('');
    
    try {
      // Save device configuration
      const configResponse = await fetch(`${API_URL}/modbus/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: deviceIp,
          port: devicePort,
          slaveId: slaveId,
        }),
      });

      if (!configResponse.ok) {
        const errorData = await configResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to save device configuration';
        throw new Error(errorMessage);
      }

      // Save view settings to localStorage
      const viewSettings = {
        registerType,
        startAddress,
        addressLength,
        autoRefresh,
        refreshInterval,
      };
      localStorage.setItem('viewSettings', JSON.stringify(viewSettings));

      setSaveStatus('success');
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 2000);
    } catch (err: any) {
      setSaveStatus('error');
      let errorMessage = 'Failed to save settings';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your connection.';
      } else if (err.name === 'NetworkError' || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to reach the server. Please check if the backend is running.';
      }
      
      setSaveMessage(errorMessage);
    }
  };

  return (
    <>
      <Head>
        <title>Settings | Data Monitoring</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerTop}>
              <div style={styles.titleContainer}>
                <div style={styles.logoContainer}>
                  <DooterLogo width={60} height={60} showText={false} />
                </div>
                <h1 style={styles.title}>
                  <span style={styles.titleText}>Settings</span>
                </h1>
              </div>
              <button 
                onClick={() => router.push('/')}
                style={styles.backButton}
              >
                <Icon path={mdiArrowLeft} size={1} color="white" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div style={styles.settingsContainer}>
          {/* Device Connection Settings */}
          <section style={styles.settingsSection}>
            <h2 style={styles.sectionTitle}>
              <Icon path={mdiCog} size={1.2} color={DUCORR_PRIMARY} />
              Device Connection
            </h2>
            <div style={styles.settingsGrid}>
              <div style={styles.settingItem}>
                <label style={styles.label}>
                  <Icon path={mdiMapMarker} size={1} color={DUCORR_PRIMARY} />
                  Device IP Address
                </label>
                <input
                  type="text"
                  value={deviceIp}
                  onChange={(e) => setDeviceIp(e.target.value)}
                  style={styles.input}
                  placeholder="192.168.100.49"
                />
                <p style={styles.helperText}>IP address of the equipment</p>
              </div>

              <div style={styles.settingItem}>
                <label style={styles.label}>
                  <Icon path={mdiLan} size={1} color={DUCORR_PRIMARY} />
                  Device Port
                </label>
                <input
                  type="number"
                  value={devicePort}
                  onChange={(e) => setDevicePort(parseInt(e.target.value) || 5000)}
                  style={styles.input}
                  min="1"
                  max="65535"
                />
                <p style={styles.helperText}>Port number for Modbus TCP connection (default: 5000)</p>
              </div>

              <div style={styles.settingItem}>
                <label style={styles.label}>
                  <Icon path={mdiDatabase} size={1} color={DUCORR_PRIMARY} />
                  Device ID
                </label>
                <input
                  type="number"
                  value={slaveId}
                  onChange={(e) => setSlaveId(parseInt(e.target.value) || 1)}
                  style={styles.input}
                  min="1"
                  max="255"
                />
                <p style={styles.helperText}>Unique identifier for this device</p>
              </div>
            </div>
          </section>

          {/* Data Reading Settings */}
          <section style={styles.settingsSection}>
            <h2 style={styles.sectionTitle}>
              <Icon path={mdiChartLine} size={1.2} color={DUCORR_PRIMARY} />
              Data Reading Configuration
            </h2>
            <div style={styles.settingsGrid}>
              <div style={styles.settingItem}>
                <label style={styles.label}>
                  <Icon path={mdiDatabase} size={1} color={DUCORR_PRIMARY} />
                  Register Type
                </label>
                <select
                  value={registerType}
                  onChange={(e) => setRegisterType(e.target.value)}
                  style={styles.select}
                >
                  <option value="coil">01: Coil Status</option>
                  <option value="discrete">02: Input Status</option>
                  <option value="holding">03: Holding Register</option>
                  <option value="input">04: Input Register</option>
                </select>
                <p style={styles.helperText}>Type of data to read from the device</p>
              </div>

              <div style={styles.settingItem}>
                <label style={styles.label}>
                  <Icon path={mdiMapMarker} size={1} color={DUCORR_PRIMARY} />
                  Start Address
                </label>
                <input
                  type="number"
                  value={startAddress}
                  onChange={(e) => setStartAddress(parseInt(e.target.value) || 0)}
                  style={styles.input}
                  min="0"
                />
                <p style={styles.helperText}>Starting point for reading data</p>
              </div>

              <div style={styles.settingItem}>
                <label style={styles.label}>
                  <Icon path={mdiRuler} size={1} color={DUCORR_PRIMARY} />
                  Address Length
                </label>
                <input
                  type="number"
                  value={addressLength}
                  onChange={(e) => setAddressLength(parseInt(e.target.value) || 1)}
                  style={styles.input}
                  min="1"
                  max="125"
                />
                <p style={styles.helperText}>Number of values to read</p>
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section style={styles.settingsSection}>
            <h2 style={styles.sectionTitle}>
              <Icon path={mdiClockOutline} size={1.2} color={DUCORR_PRIMARY} />
              Display Settings
            </h2>
            <div style={styles.settingsGrid}>
              <div style={styles.settingItem}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    style={styles.toggle}
                  />
                  <span style={styles.toggleText}>Auto Refresh</span>
                </label>
                <p style={styles.helperText}>Automatically update data at regular intervals</p>
              </div>

              {autoRefresh && (
                <div style={styles.settingItem}>
                  <label style={styles.label}>
                    <Icon path={mdiClockOutline} size={1} color={DUCORR_PRIMARY} />
                    Refresh Interval (milliseconds)
                  </label>
                  <input
                    type="number"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 2000)}
                    style={styles.input}
                    min="500"
                    step="500"
                  />
                  <p style={styles.helperText}>How often to update the data</p>
                </div>
              )}
            </div>
          </section>

          {/* Save Button */}
          <div style={styles.saveSection}>
            {saveMessage && (
              <div style={{
                ...styles.statusMessage,
                backgroundColor: saveStatus === 'success' ? '#d1fae5' : '#fee2e2',
                color: saveStatus === 'success' ? '#065f46' : '#991b1b',
              }}>
                <Icon 
                  path={saveStatus === 'success' ? mdiCheckCircle : mdiAlertCircle} 
                  size={1} 
                  color={saveStatus === 'success' ? '#10b981' : '#ef4444'} 
                />
                {saveMessage}
              </div>
            )}
            <button 
              onClick={handleSave}
              style={{
                ...styles.saveButton,
                opacity: saveStatus === 'saving' ? 0.7 : 1,
              }}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Information Section */}
          <section style={styles.infoSection}>
            <h3 style={styles.infoTitle}>
              <Icon path={mdiInformation} size={1.2} color={DUCORR_PRIMARY} />
              About Register Types
            </h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoCardIcon}>
                  <Icon path={mdiLightningBolt} size={1.5} color="white" />
                </div>
                <h4 style={styles.infoCardTitle}>01: Coil Status</h4>
                <p style={styles.infoCardText}>Read/write digital outputs</p>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardIcon}>
                  <Icon path={mdiPowerPlug} size={1.5} color="white" />
                </div>
                <h4 style={styles.infoCardTitle}>02: Input Status</h4>
                <p style={styles.infoCardText}>Read-only digital inputs</p>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardIcon}>
                  <Icon path={mdiDatabase} size={1.5} color="white" />
                </div>
                <h4 style={styles.infoCardTitle}>03: Holding Register</h4>
                <p style={styles.infoCardText}>Read/write analog values</p>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoCardIcon}>
                  <Icon path={mdiDownload} size={1.5} color="white" />
                </div>
                <h4 style={styles.infoCardTitle}>04: Input Register</h4>
                <p style={styles.infoCardText}>Read-only analog inputs</p>
              </div>
            </div>
          </section>
        </div>
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
    padding: '30px 40px',
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
    flexWrap: 'wrap',
    gap: '15px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    height: '60px',
  },
  title: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#000000',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
  titleText: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '0.5px',
  },
  backButton: {
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
  },
  settingsContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  settingsSection: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
  },
  sectionTitle: {
    margin: '0 0 25px 0',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    width: '100%',
    boxSizing: 'border-box',
  },
  settingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    boxSizing: 'border-box',
    minWidth: 0,
    overflow: 'hidden',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
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
    boxSizing: 'border-box',
    maxWidth: '100%',
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
    boxSizing: 'border-box',
    maxWidth: '100%',
  },
  helperText: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  toggle: {
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  toggleText: {
    fontSize: '14px',
    fontWeight: '500',
    marginLeft: '10px',
    color: '#333',
  },
  saveSection: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'center',
  },
  saveButton: {
    padding: '15px 40px',
    background: DUCORR_PRIMARY,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    minWidth: '200px',
  },
  statusMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  infoSection: {
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

