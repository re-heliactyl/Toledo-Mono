import axios from 'axios';
import { AlertTriangle, Home, LogOut, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useSettings } from '../hooks/useSettings';

function formatBanDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function parseBanReason(reason) {
  if (!reason) {
    return { mainReason: 'No reason provided.', metadata: [], supportSentence: '' };
  }

  const metadata = [];
  let workingReason = reason.trim();
  let supportSentence = '';

  const supportMatch = workingReason.match(/If you believe this is.*$/i);
  if (supportMatch) {
    supportSentence = supportMatch[0].trim();
    workingReason = workingReason.replace(supportMatch[0], '').trim();
  }

  const metadataStart = workingReason.search(/(Banned user ID:|Banned Discord ID:|Conflicting user ID:|Conflicting Discord ID:|IP:|Alt account:)/i);

  let mainReason = workingReason;
  if (metadataStart !== -1) {
    mainReason = workingReason.slice(0, metadataStart).trim().replace(/[|\s]+$/, '');
    const metadataSection = workingReason.slice(metadataStart).trim();

    for (const part of metadataSection.split(' | ')) {
      const trimmed = part.trim();
      const colonIndex = trimmed.indexOf(':');

      if (colonIndex !== -1) {
        metadata.push({
          key: trimmed.substring(0, colonIndex).trim(),
          value: trimmed.substring(colonIndex + 1).trim(),
        });
      } else if (trimmed) {
        metadata.push({ key: '', value: trimmed });
      }
    }
  }

  return { mainReason: mainReason || reason, metadata, supportSentence };
}

export default function BannedPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [banState, setBanState] = useState(null);

  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch('/api/v5/state', {
          credentials: 'include',
        });

        if (response.status === 401) {
          navigate('/auth', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load ban state');
        }

        const data = await response.json();
        if (!data.banned) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setBanState(data.ban);
      } catch (error) {
        console.error('Failed to load banned state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [navigate]);

  const banDate = useMemo(() => formatBanDate(banState?.bannedAt), [banState?.bannedAt]);

  const parsedReason = useMemo(() => parseBanReason(banState?.reason), [banState?.reason]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await axios.post('/api/user/logout');
    } catch (error) {
      console.error('Failed to logout from banned page:', error);
    } finally {
      window.location.href = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-[#101218] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg border border-[#2e3337] bg-[#171a21] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#2e3337] px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#95a1ad]">{settings?.name || 'Heliactyl'}</span>
            <span className="text-xs text-[#95a1ad] px-2 py-1 bg-[#202229] rounded border border-[#2e3337]">
              Account suspended
            </span>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-white">Account access restricted</h1>
              <p className="text-sm text-[#95a1ad] leading-relaxed">
                Your account has been suspended. You can still access authentication to log out, but the dashboard and protected services are unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-3 text-[#95a1ad] py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading suspension details...</span>
            </div>
          ) : (
            <>
              {/* Reason */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#95a1ad] uppercase tracking-wider">
                  Reason
                </span>
                <div className="border border-[#2e3337]/50 bg-[#11141a] rounded-lg p-4 space-y-3">
                  {/* Main reason sentence */}
                  {parsedReason.mainReason && (
                    <p className="text-sm text-white leading-relaxed">
                      {parsedReason.mainReason}
                    </p>
                  )}

                  {/* Metadata as clean stacked list */}
                  {parsedReason.metadata.length > 0 && (
                    <div className="pt-2 border-t border-[#2e3337]/50 space-y-1.5">
                      {parsedReason.metadata.map((item, index) => (
                        <div key={`${item.key}-${index}`} className="flex flex-wrap gap-x-2 text-xs">
                          <span className="text-[#95a1ad]">{item.key}:</span>
                          <span className="text-white font-mono">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Support ticket sentence */}
                  {parsedReason.supportSentence && (
                    <div className="pt-2 border-t border-[#2e3337]/50">
                      <p className="text-sm text-[#95a1ad] leading-relaxed">
                        {parsedReason.supportSentence}
                      </p>
                    </div>
                  )}

                  {/* Fallback for plain strings */}
                  {!parsedReason.mainReason && !parsedReason.metadata.length && (
                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                      {banState?.reason || 'No reason provided.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#95a1ad] uppercase tracking-wider">
                    Staff member
                  </span>
                  <div className="border border-[#2e3337]/50 bg-[#11141a] rounded-lg p-3">
                    <p className="text-sm text-white">
                      {banState?.staff?.username || 'Unknown staff member'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#95a1ad] uppercase tracking-wider">
                    Suspension date
                  </span>
                  <div className="border border-[#2e3337]/50 bg-[#11141a] rounded-lg p-3">
                    <p className="text-sm text-white">{banDate}</p>
                  </div>
                </div>
              </div>

              {/* Help message */}
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4">
                <p className="text-sm text-[#95a1ad]">
                  If you believe this is an error, open a support ticket or create a Discord ticket for an unban review. Include your account username and explain why this suspension should be lifted.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-[#2e3337] hover:bg-[#202229] hover:border-[#2e3337] text-white h-11"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to website
            </Button>
            <Button
              className="flex-1 bg-[#394047] hover:bg-[#394047]/80 text-white border border-white/5 h-11"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
