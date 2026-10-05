import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Download, ChevronDown } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import appIconSrc from '../assets/overnode-app-icon.png';

const AppleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.38-.58.68-1.09 1.77-.95 2.82 1.02.08 2.05-.52 2.68-1.29z" />
  </svg>
);

const WindowsIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.45l7.35-1.01v7.22H3V5.45zm0 13.1l7.35 1.01v-7.22H3v7.22zm8.35-14.24L21 3v8.66h-9.65V4.31zm9.65 15.38L11.35 18.3v-6.96H21v8.35z" />
  </svg>
);

export default function OvernodeAppCard({ variant = "dashboard" }) {
  const { settings } = useSettings();
  const [showNotes, setShowNotes] = useState(false);

  // Check if disabled in TOML config
  const isEnabled = settings?.features?.desktopApp !== false;

  // Detect OS for smart primary CTA
  const detectedOS = useMemo(() => {
    if (typeof window === 'undefined') return 'mac';
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'mac';
    return 'mac';
  }, []);

  // Fetch release info from Toledo backend
  const { data: appData } = useQuery({
    queryKey: ['overnode-app-latest'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/app/latest');
      return data;
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1
  });

  if (!isEnabled) {
    return null;
  }

  const latestVersion = appData?.latestVersion || "1.1.57";
  const macDownloadLink = appData?.platforms?.mac?.downloadUrl || "/api/v5/app/download/mac";
  const winDownloadLink = appData?.platforms?.windows?.downloadUrl || "/api/v5/app/download/windows";

  const isLanding = variant === "landing";

  return (
    <div className={`border border-[#2e3337]/50 rounded-lg p-5 bg-[#15161a]/60 transition ${isLanding ? 'max-w-4xl mx-auto shadow-sm' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left side: Icon & Information */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#202229] border border-[#2e3337]/60 p-2 flex items-center justify-center flex-shrink-0">
            <img
              src={appIconSrc}
              alt="Overnode Desktop"
              className="w-full h-full object-contain rounded-md"
            />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-semibold text-white tracking-tight">Overnode Desktop</h3>
              <span className="text-[11px] font-mono text-[#95a1ad] bg-[#202229] px-2 py-0.5 rounded border border-[#2e3337]/60">
                v{latestVersion}
              </span>
            </div>
            <p className="text-xs text-[#95a1ad] mt-1 leading-relaxed">
              Official desktop app to manage your servers with native performance and instant controls.
            </p>
          </div>
        </div>

        {/* Right side: Strict DMG and MSI direct downloads */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
          {detectedOS === 'mac' ? (
            <>
              {/* Primary: macOS (.dmg) */}
              <a
                href={macDownloadLink}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 transition"
              >
                <AppleIcon className="w-4 h-4" />
                <span>Download for macOS (.dmg)</span>
              </a>

              {/* Secondary: Windows (.msi) */}
              <a
                href={winDownloadLink}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#202229] text-white hover:bg-[#2e3337] border border-[#2e3337]/80 transition"
              >
                <WindowsIcon className="w-4 h-4 text-[#95a1ad]" />
                <span>Windows (.msi)</span>
              </a>
            </>
          ) : (
            <>
              {/* Primary: Windows (.msi) */}
              <a
                href={winDownloadLink}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 transition"
              >
                <WindowsIcon className="w-4 h-4" />
                <span>Download for Windows (.msi)</span>
              </a>

              {/* Secondary: macOS (.dmg) */}
              <a
                href={macDownloadLink}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#202229] text-white hover:bg-[#2e3337] border border-[#2e3337]/80 transition"
              >
                <AppleIcon className="w-4 h-4 text-[#95a1ad]" />
                <span>macOS (.dmg)</span>
              </a>
            </>
          )}

          {/* Release Notes Button */}
          {appData?.releaseNotes && (
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-[#95a1ad] hover:text-white px-2 py-2 text-xs flex items-center justify-center gap-1 transition"
              title="Toggle release notes"
            >
              <span>Notes</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Release Notes */}
      {showNotes && appData?.releaseNotes && (
        <div className="mt-4 pt-3 border-t border-[#2e3337]/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-white">Release Notes:</span>
            <span className="text-[10px] text-[#95a1ad] font-mono">macOS (.dmg) & Windows (.msi)</span>
          </div>
          <div className="bg-[#101218] border border-[#2e3337]/40 rounded p-3 text-[#95a1ad] font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
            {appData.releaseNotes}
          </div>
        </div>
      )}
    </div>
  );
}
