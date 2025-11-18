import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Add global styles for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      select:focus, input:focus {
        border-color: #0066CC !important;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
      }
      button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3) !important;
        background-color: #0052a3 !important;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      input[type="checkbox"] {
        position: relative;
        appearance: none;
        width: 44px;
        height: 24px;
        background-color: #ccc;
        border-radius: 12px;
        transition: background-color 0.3s;
      }
      input[type="checkbox"]::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }
      input[type="checkbox"]:checked {
        background-color: #0066CC !important;
      }
      input[type="checkbox"]:checked::before {
        transform: translateX(20px);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <Component {...pageProps} />;
}

