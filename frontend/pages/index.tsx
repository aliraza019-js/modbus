import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Icon from '@mdi/react';
import { 
  mdiCog, 
  mdiChartLine, 
  mdiRefresh,
  mdiClockOutline,
  mdiAlert,
  mdiChartBar,
  mdiCalendarClock,
  mdiFactory
} from '@mdi/js';
import DooterLogo from '../components/DooterLogo';

interface RegisterValue {
  address: number;
  rawValue: number;
}

interface RegisterResponse {
  success: boolean;
  type: string;
  values: RegisterValue[];
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
  return 'http://localhost:3002';
};

const API_URL = getApiUrl();
// Primary color
const DUCORR_PRIMARY = '#d9823f';

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<RegisterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [config, setConfig] = useState({
    type: 'holding',
    address: 0,
    quantity: 1,
    autoRefresh: true,
    refreshInterval: 2000,
  });

  // Update current time on client side only to avoid hydration errors
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('viewSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setConfig(prev => ({
          ...prev,
          type: settings.registerType || prev.type,
          address: settings.startAddress || prev.address,
          quantity: settings.addressLength || prev.quantity,
          autoRefresh: settings.autoRefresh !== undefined ? settings.autoRefresh : prev.autoRefresh,
          refreshInterval: settings.refreshInterval || prev.refreshInterval,
        }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  }, []);

  const fetchRegisterData = async () => {
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

      const result: RegisterResponse = await response.json();

      if (result.success) {
        setData(result);
        setConnectionStatus('connected');
      } else {
        setError(result.error || 'Failed to read register data');
        setConnectionStatus('disconnected');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error. Make sure the backend is running on port 3002.');
      setData(null);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisterData();

    if (config.autoRefresh) {
      const interval = setInterval(fetchRegisterData, config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [config]);

  return (
    <>
      <Head>
        <title>Data Monitoring | Industrial Monitoring</title>
        <meta name="description" content="Real-time industrial data monitoring" />
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
                  <span style={styles.titleText}>Equipment Monitoring</span>
                </h1>
              </div>
              <div style={styles.headerActions}>
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
                <button 
                  onClick={() => router.push('/settings')}
                  style={styles.settingsButton}
                  title="Settings"
                >
                  <Icon path={mdiCog} size={1.2} color="white" />
                  Settings
                </button>
              </div>
            </div>
            <p style={styles.subtitle}>View real-time equipment output and operating parameters</p>
          </div>
        </header>

        {/* Equipment Data Display */}
        <section style={styles.dataPanel}>
          <div style={styles.dataHeader}>
            <div style={styles.dataHeaderLeft}>
              <h2 style={styles.sectionTitle}>
                <Icon path={mdiFactory} size={1.2} color={DUCORR_PRIMARY} />
                Equipment Output
              </h2>
              <div style={styles.dateTimeDisplay}>
                <Icon path={mdiCalendarClock} size={1} color="#666" />
                <span style={styles.dateTimeText}>
                  {currentTime || 'Loading...'}
                </span>
              </div>
            </div>
            <button 
              onClick={fetchRegisterData} 
              style={styles.refreshButton}
              disabled={loading}
              title="Refresh data"
            >
              <Icon path={mdiRefresh} size={1} color="white" />
              {loading ? 'Updating...' : 'Refresh'}
            </button>
          </div>
          
          {loading && !data && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Connecting to equipment...</p>
            </div>
          )}

          {error && (
            <div style={styles.errorCard}>
              <Icon path={mdiAlert} size={1.5} color="#dc2626" />
              <div style={styles.errorContent}>
                <h3 style={styles.errorTitle}>Connection Error</h3>
                <p style={styles.errorMessage}>{error}</p>
                <p style={styles.errorHint}>Please check your settings or contact support if the problem persists.</p>
              </div>
            </div>
          )}

          {data && data.success && (
            <div style={styles.dataContainer}>
              <div style={styles.valuesGrid}>
                {data.values.map((value, index) => (
                  <div key={index} style={styles.valueCard}>
                    <div style={styles.valueCardHeader}>
                      <Icon path={mdiChartBar} size={1.2} color={DUCORR_PRIMARY} />
                      <span style={styles.valueLabel}>Parameter {index + 1}</span>
                    </div>
                    <div style={styles.valueContent}>
                      <div style={styles.valueRaw}>
                        {value.rawValue.toLocaleString()}
                      </div>
                      <div style={styles.valueSubtext}>
                        Last updated: {new Date(data.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  settingsButton: {
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
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  brandName: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '0.5px',
  },
  titleText: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '0.5px',
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
    margin: '0',
    color: '#666',
    fontSize: '1.1rem',
    fontWeight: '400',
  },
  refreshButton: {
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
  dataHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  dateTimeDisplay: {
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
  dateTimeText: {
    fontFamily: 'monospace',
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
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#991b1b',
    lineHeight: '1.6',
  },
  errorHint: {
    margin: 0,
    fontSize: '12px',
    color: '#b91c1c',
    fontStyle: 'italic',
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
  valueLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '600',
  },
  valueSubtext: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
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
