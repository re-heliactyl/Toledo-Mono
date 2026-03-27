import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, AlertCircle, RefreshCw, QrCode } from 'lucide-react';

const TwoFactorAuth = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        const response = await fetch('/api/2fa/status');
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Failed to fetch 2FA status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTwoFactorStatus();
  }, []);

  const startSetup = async () => {
    setIsSettingUp(true);
    setMessage(null);

    try {
      const response = await fetch('/api/2fa/setup', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
      } else {
        throw new Error('Failed to initialize 2FA setup');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to initialize 2FA setup' });
      setIsSettingUp(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData.secret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        setIsEnabled(true);
        setMessage({ type: 'success', text: '2FA successfully enabled!' });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Invalid verification code');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to verify code' });
    }
  };

  const disable2FA = async () => {
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password to disable 2FA' });
      return;
    }

    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
        }),
      });

      if (response.ok) {
        setIsEnabled(false);
        setIsSettingUp(false);
        setSetupData(null);
        setCurrentPassword('');
        setBackupCodes([]);
        setShowBackupCodes(false);
        setMessage({ type: 'success', text: '2FA has been disabled' });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to disable 2FA' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
  };

  const copyBackupCodes = () => {
    copyToClipboard(backupCodes.join('\n'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
      </div>
    );
  }

  return (
    <div className="border border-[#2e3337] rounded-lg bg-transparent">
      <div className="p-4 pb-3 border-b border-[#2e3337]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-normal text-lg">Two-Factor Authentication</h3>
        </div>
        <p className="text-sm text-[#95a1ad] mt-1">
          Add an extra layer of security to your account by enabling 2FA
        </p>
      </div>

      <div className="p-4 space-y-4">
        {!isEnabled && !isSettingUp && (
          <div className="flex flex-col space-y-4">
            <p className="text-[#95a1ad]">
              Two-factor authentication adds an additional layer of security to your account by requiring a code from your phone in addition to your password.
            </p>
            <button
              type="button"
              onClick={startSetup}
              className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 self-start"
            >
              Set Up 2FA
            </button>
          </div>
        )}

        {isSettingUp && setupData && !showBackupCodes && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-white p-4 rounded-lg inline-block flex-shrink-0">
                <img
                  src={setupData.qrCodeUrl}
                  alt="QR Code for 2FA"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <h4 className="font-medium text-sm mb-1">Setup Instructions:</h4>
                  <ol className="text-sm text-[#95a1ad] space-y-2 list-decimal pl-5">
                    <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code or enter the setup key manually</li>
                    <li>Enter the 6-digit code from your app below</li>
                  </ol>
                </div>

                <div>
                  <p className="text-sm text-[#95a1ad] mb-1">Manual setup key:</p>
                  <div className="flex items-center gap-2">
                    <input
                      value={setupData.secret}
                      readOnly
                      className="flex-1 px-3 py-2 bg-[#394047] border border-white/5 rounded-md text-sm font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(setupData.secret)}
                      className="p-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 transition active:scale-95"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[#95a1ad] mb-1">Verification code:</p>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-full px-3 py-2 bg-[#394047] border border-white/5 rounded-md text-sm focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={verifyAndEnable}
                    className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95"
                  >
                    Verify and Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingUp(false);
                      setSetupData(null);
                      setMessage(null);
                    }}
                    className="px-4 py-2 bg-transparent text-white hover:bg-white/5 border border-white/10 rounded-md font-medium text-sm transition active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBackupCodes && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Backup Codes</h4>
              <p className="text-sm text-[#95a1ad] mb-3">
                Store these recovery codes in a safe place. If you lose your 2FA device, you can use one of these codes to regain access to your account.
                <strong className="block mt-1 text-white">Each code can only be used once.</strong>
              </p>

              <div className="bg-[#202229] border border-[#2e3337] rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={code || `backup-code-${index + 1}`} className="font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={copyBackupCodes}
                className="px-4 py-2 bg-[#394047] text-white hover:bg-[#394047]/70 rounded-md font-medium text-sm transition active:scale-95 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy All Codes</span>
              </button>
            </div>

            <div className="border-t border-[#2e3337] pt-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowBackupCodes(false);
                  setIsSettingUp(false);
                }}
                className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95"
              >
                I've Saved My Backup Codes
              </button>
            </div>
          </div>
        )}

        {isEnabled && !isSettingUp && !showBackupCodes && (
          <div className="space-y-4">
            <div className="flex items-center bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg p-3">
              <ShieldCheck className="h-5 w-5 mr-3" />
              <span>Two-factor authentication is enabled for your account</span>
            </div>

            <div className="pt-2">
              <div className="mb-3 max-w-md">
                <p className="text-sm text-[#95a1ad] mb-1">Current password</p>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 bg-[#394047] border border-white/5 rounded-md text-sm focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={disable2FA}
                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-md font-medium text-sm transition active:scale-95"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`rounded-md p-3 flex items-start ${message.type === 'error' ? 'border border-red-500/20 bg-red-500/10 text-red-500' : 'border border-green-500/20 bg-green-500/10 text-green-500'}`}>
            <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
