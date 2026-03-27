import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Fingerprint, AlertCircle, RefreshCw } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

// Discord icon component
const DiscordIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width="24"
    height="24"
    viewBox="0 -28.5 256 256"
    preserveAspectRatio="xMidYMid"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z"
      fill="currentColor"
    />
  </svg>
);

// Toast component for notifications
const Toast = ({ toast, setToast }) => {
  if (!toast.visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-[#202229] border border-white/5 rounded-lg p-4 w-[90vw] sm:w-80 shadow-lg max-w-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{toast.title}</h3>
          <p className="text-sm text-[#95a1ad] mt-1">{toast.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setToast({ ...toast, visible: false })}
          className="text-[#95a1ad] hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings, isLoading: isSettingsLoading } = useSettings();

  // Toast state for simple notifications
  const [toast, setToast] = useState({ visible: false, title: '', description: '' });

  // Check if already logged in and if browser supports WebAuthn
  useEffect(() => {
    // Check if passkeys are supported
    const checkPasskeySupport = async () => {
      try {
        if (typeof window !== 'undefined' && window.PublicKeyCredential !== undefined) {
          setPasskeySupported(true);
        }
      } catch (error) {
        console.error('Error checking passkey support:', error);
        setPasskeySupported(false);
      }
    };

    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v5/state', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();

          if (data.banned) {
            navigate('/banned', { replace: true });
            return;
          }

          // If 2FA is pending, redirect to 2FA page
          if (data.twoFactorPending) {
            navigate('/auth/2fa', { replace: true });
            return;
          }

          // If already authenticated, redirect to dashboard
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkPasskeySupport();
    checkAuth();
  }, [navigate]);

  const showToast = useCallback((title, description) => {
    setToast({ visible: true, title, description });
  }, []);

  // Check for VPN or Discord auth errors in URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'vpn') {
      setErrorMessage('VPN detected! Please disable your VPN or proxy to continue.');
      showToast('VPN Detected', 'Please disable your VPN or proxy to continue.');
    } else if (error === 'discord_session_expired') {
      setErrorMessage('Discord login expired before it could finish. Please try again from a fresh login window.');
      showToast('Session Expired', 'Discord login expired before it could finish. Please try again.');
    } else if (error === 'discord_email_in_use') {
      setErrorMessage('This Discord email is already linked to another dashboard account. Contact support so the accounts can be merged or updated safely.');
      showToast('Email Already In Use', 'This Discord email is already linked to another account on this dashboard.');
    } else if (error === 'discord_email_unavailable') {
      setErrorMessage('Discord did not provide an email address for this account. Please verify the email on Discord and try again.');
      showToast('Discord Email Missing', 'Discord did not provide an email address for this account.');
    } else if (error === 'discord_oauth_error') {
      setErrorMessage('Discord rejected the authentication request. Please try again in a moment.');
      showToast('Discord Error', 'Discord rejected the authentication request. Please try again.');
    } else if (error === 'discord_missing_code') {
      setErrorMessage('Discord did not return a valid login code. Please start the login again.');
      showToast('Discord Login Failed', 'Discord did not return a valid login code.');
    } else if (error === 'discord' || error === 'discord_auth_failed') {
      setErrorMessage(
        'Discord authentication failed. If email/password sign-in is unavailable on this instance, please contact support.'
      );
      showToast(
        'Authentication Failed',
        'Discord authentication failed. Please try again or contact support.'
      );
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ ...toast, visible: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDiscordLogin = () => {
    setIsLoading(true);
    try {
      window.location.href = '/auth/discord/login';
    } catch (err) {
      showToast('Error', 'Failed to redirect to Discord. Please try again.');
      setIsLoading(false);
    }
  };

  // Helper function to convert base64url to ArrayBuffer
  const base64urlToBuffer = (base64url) => {
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const binary = window.atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return buffer;
  };

  // Helper function to convert ArrayBuffer to base64url
  const bufferToBase64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const handlePasskeyLogin = async () => {
    if (!passkeySupported) {
      showToast('Error', 'Your browser does not support passkeys');
      return;
    }

    try {
      setIsPasskeyLoading(true);
      setErrorMessage("");

      // 1. Get authentication options from server
      const optionsResponse = await fetch('/auth/passkey/options');

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to start authentication');
      }

      const options = await optionsResponse.json();

      // 2. Convert options for the credential API
      options.challenge = base64urlToBuffer(options.challenge);
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(cred => ({
          ...cred,
          id: base64urlToBuffer(cred.id)
        }));
      }

      // 3. Get credential from browser
      const credential = await navigator.credentials.get({
        publicKey: options
      });

      // 4. Send credential to server for verification
      const authResponse = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        response: {
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          authenticatorData: bufferToBase64url(credential.response.authenticatorData),
          signature: bufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle ? bufferToBase64url(credential.response.userHandle) : null
        },
        type: credential.type
      };

      const verificationResponse = await fetch('/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResponse)
      });

      const verificationData = await verificationResponse.json();

      if (!verificationResponse.ok) {
        if (verificationData.code === 'USER_BANNED') {
          navigate('/banned', { replace: true });
          return;
        }

        throw new Error(verificationData.error || 'Failed to verify passkey');
      }

      // Successfully authenticated
      navigate('/dashboard');
    } catch (err) {
      console.error('Passkey authentication error:', err);
      // Show user-friendly error
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Authentication was cancelled');
      } else if (err.name === 'SecurityError') {
        setErrorMessage('Security error occurred. Make sure you\'re using HTTPS.');
      } else {
        setErrorMessage(err.message || 'Failed to authenticate with passkey');
      }
      setIsPasskeyLoading(false);
    }
  };

  if (isSettingsLoading && !settings) {
    return (
      <div className="min-h-screen bg-[#101218] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#101218] p-4">
      {/* Toast notification */}
      <Toast toast={toast} setToast={setToast} />

      {/* Logo Section */}
      <div className="mb-10">
        <img
          src={settings?.logo || "https://i.imgur.com/gUUze6A.png"}
          alt={settings?.name || "Heliactyl"}
          className="h-10 w-auto hover:opacity-90 transition-opacity"
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md bg-transparent border border-[#2e3337] rounded-lg overflow-hidden">
        <div className="p-6 pb-4 border-b border-[#2e3337]">
          <h2 className="text-2xl text-white font-medium text-center">
            Welcome to {settings?.name || "Heliactyl"}
          </h2>
          <p className="text-[#95a1ad] text-sm text-center mt-2">
            Sign in to continue to your dashboard
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Discord OAuth Button */}
          <button
            type="button"
            className="w-full relative flex items-center transition justify-center h-11 bg-[#394047] hover:bg-[#394047]/50 text-white rounded-md border border-white/5 active:scale-95"
            onClick={handleDiscordLogin}
            disabled={isLoading}
          >
            <DiscordIcon className="h-5 w-5 absolute left-3" />
            <span className="font-medium text-sm">
              {isLoading ? 'Ok, one moment...' : 'Continue with Discord OAuth2'}
            </span>
          </button>

          {/* Passkey Button (if supported) */}
          {passkeySupported && (
            <>
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-[#2e3337]"></div>
                <span className="flex-shrink mx-4 text-[#95a1ad] text-sm">or</span>
                <div className="flex-grow border-t border-[#2e3337]"></div>
              </div>

              <button
                type="button"
                className="w-full relative flex items-center transition justify-center h-11 bg-[#202229] hover:bg-[#202229]/50 text-white rounded-md border border-white/5 active:scale-95"
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading}
              >
                <Fingerprint className="h-5 w-5 absolute left-3" />
                <span className="font-medium text-sm">
                  {isPasskeyLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    'Sign in with passkey'
                  )}
                </span>
              </button>
            </>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="rounded-md p-3 flex items-start border border-red-500/20 bg-red-500/10 text-red-500">
              <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 px-4 mt-10">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm text-[#95a1ad]">
            © {new Date().getFullYear()} {settings?.name || "Heliactyl"}, Inc. All rights reserved.
          </p>
          <p className="text-xs text-[#95a1ad]/70 mt-0.5">
            Powered by Heliactyl Next 10.0.0 [toledo]<br />Designed, developed and built by Ether, edited and maintained by achul123
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;
