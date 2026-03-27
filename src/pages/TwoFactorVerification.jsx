import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';

const TwoFactorVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Reset to 30 when it hits zero
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      setError('Please enter a verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the intended page or dashboard
        const redirectUrl = location.state?.redirectUrl || '/dashboard';
        navigate(redirectUrl, { replace: true });
      } else {
        setError(data.error || 'Invalid verification code');
        setVerificationCode('');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    // Sign out and redirect to login page
    fetch('/auth/logout', { method: 'POST' })
      .finally(() => {
        navigate('/auth', { replace: true });
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#101218] p-4">
      <div className="w-full max-w-md bg-transparent border border-[#2e3337] rounded-lg overflow-hidden">
        <div className="p-6 pb-4 border-b border-[#2e3337] flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white font-medium">
              Two-Factor Authentication
            </h2>
            <p className="text-[#95a1ad] text-sm mt-1">
              Enter the verification code from your authenticator app
            </p>
          </div>
          <Shield className="w-8 h-8 text-white/80" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="code" className="text-sm text-[#95a1ad] font-medium">
                Verification Code or Backup Code
              </label>
              <div className="text-xs text-[#95a1ad]">
                Refreshes in <span className="text-white font-mono">{countdown}s</span>
              </div>
            </div>
            <input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => {
                // For 6-digit codes, only allow numbers and limit to 6
                if (e.target.value.match(/^[0-9]*$/) && e.target.value.length <= 6) {
                  setVerificationCode(e.target.value);
                }
                // For backup codes in format XXXX-XXXX, allow alphanumeric and hyphen
                else if (e.target.value.match(/^[A-Za-z0-9\-]*$/) && e.target.value.length <= 9) {
                  setVerificationCode(e.target.value.toUpperCase());
                }
              }}
              className="w-full px-3 py-2 bg-[#394047] border border-white/5 rounded-md text-lg tracking-widest font-mono focus:outline-none focus:border-white/5 focus:ring-1 focus:ring-white/20 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md p-3 flex items-start border border-red-500/20 bg-red-500/10 text-red-500">
              <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isVerifying}
              className={`px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 ${isVerifying ? 'bg-white/20 text-white/60 cursor-not-allowed' : ''
                }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </span>
              ) : 'Verify'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-transparent border border-white/10 text-white hover:bg-white/5 rounded-md font-medium text-sm transition active:scale-95"
            >
              Cancel Sign In
            </button>
          </div>

          <div className="text-center text-xs text-[#95a1ad]">
            <p>Lost your device? Use one of your backup codes</p>
            <p className="mt-1">Need help? Join our Discord server for support</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerification;