import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import {
  Fingerprint,
  KeyRound,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Shield
} from 'lucide-react';

const PasskeysPage = () => {
  const { toast } = useToast();
  const [passkeys, setPasskeys] = useState([]);
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // Check if browser supports WebAuthn
  const supportsWebAuthn = typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined;

  // Fetch passkey status
  const fetchPasskeyStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/passkey/status');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch passkey status');
      }

      const data = await response.json();
      setPasskeys(data.passkeys || []);
      setIsPasskeyEnabled(data.enabled || false);
    } catch (err) {
      console.error('Error fetching passkey status:', err);
      toast({
        title: 'Error',
        description: 'Failed to load passkey information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (supportsWebAuthn) {
      fetchPasskeyStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Helper functions for WebAuthn
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

  const bufferToBase64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  // Register new passkey
  const registerPasskey = async (e) => {
    e.preventDefault();

    if (!newPasskeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a name for this passkey',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRegistering(true);
      // 1. Get registration options from server
      const optionsResponse = await fetch('/api/passkey/registration-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPasskeyName.trim() })
      });

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to start registration');
      }

      const options = await optionsResponse.json();
      // 2. Create credential with browser API
      options.user.id = base64urlToBuffer(options.user.id);
      options.challenge = base64urlToBuffer(options.challenge);
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(cred => ({
          ...cred,
          id: base64urlToBuffer(cred.id)
        }));
      }

      let credential;
      try {
        credential = await navigator.credentials.create({
          publicKey: options
        });
      } catch (credError) {
        if (credError.name === 'NotAllowedError') {
          throw new Error('Registration was cancelled or timed out');
        } else {
          throw new Error(`Passkey creation failed: ${credError.message}`);
        }
      }
      // 3. Send credential to server for verification
      const attestationResponse = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        response: {
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          attestationObject: bufferToBase64url(credential.response.attestationObject)
        },
        type: credential.type,
        transports: credential.response.getTransports ? credential.response.getTransports() : undefined
      };
      const verificationResponse = await fetch('/api/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attestationResponse)
      });
      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.error || 'Failed to register passkey');
      }
      const verificationData = await verificationResponse.json();
      setPasskeys(verificationData.passkeys);
      setIsPasskeyEnabled(true);
      toast({
        title: 'Success',
        description: 'Passkey successfully registered',
      });
      setNewPasskeyName('');
    } catch (err) {
      console.error('Passkey registration error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to register passkey',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Remove passkey
  const removePasskey = async (passkeyId) => {
    try {
      setIsDeleting(passkeyId);
      const response = await fetch(`/api/passkey/${passkeyId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove passkey');
      }
      const data = await response.json();
      setPasskeys(data.passkeys);
      setIsPasskeyEnabled(data.passkeys.length > 0);
      toast({
        title: 'Success',
        description: 'Passkey successfully removed',
      });
    } catch (err) {
      console.error('Error removing passkey:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove passkey',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-center h-80">
          <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
        </div>
      </div>
    );
  }

  if (!supportsWebAuthn) {
    return (
      <div className="p-6 max-w-screen-2xl mx-auto">
        <div className="border border-[#2e3337] rounded-lg bg-transparent mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-1">Passkeys</h1>
            <p className="text-[#95a1ad]">Use biometrics or security keys to sign in without passwords</p>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Passkeys not supported</p>
            <p className="text-sm mt-1">Your browser doesn't support WebAuthn, which is required for passkeys. Try using a modern browser like Chrome, Firefox, Safari, or Edge.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Passkeys</h1>
            <p className="text-[#95a1ad]">Use biometrics or security keys to sign in without passwords</p>
          </div>
          <div className="rounded-lg flex items-center gap-2">
            {isPasskeyEnabled ?
              <CheckCircle2 className="w-5 h-5 text-green-500" /> :
              <AlertCircle className="w-5 h-5 text-amber-500" />
            }
            <span className="text-sm">{isPasskeyEnabled ? 'Enabled' : 'Not Configured Yet'}</span>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Your Passkeys Section */}
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-normal text-lg">Your Passkeys</h3>
            </div>
          </div>
          <div className="p-4">
            {passkeys.length > 0 ? (
              <div className="space-y-3">
                {passkeys.map(passkey => (
                  <div key={passkey.id} className="flex items-center justify-between p-3 bg-[#202229] border border-[#2e3337] rounded-md">
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-[#95a1ad]" />
                      <div>
                        <p className="text-sm font-medium">{passkey.name}</p>
                        <p className="text-xs text-[#95a1ad]">
                          Added {new Date(passkey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ConfirmDialog
                      title="Remove Passkey"
                      description="Are you sure you want to remove this passkey? This action cannot be undone."
                      confirmText="Remove"
                      variant="destructive"
                      onConfirm={() => removePasskey(passkey.id)}
                      trigger={
                        <button
                          disabled={isDeleting === passkey.id}
                          className="p-1.5 text-red-500 rounded-md hover:bg-red-500/10 transition active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent disabled:active:scale-100"
                          title="Remove passkey"
                        >
                          {isDeleting === passkey.id ?
                            <RefreshCw className="w-4 h-4 animate-spin" /> :
                            <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Shield className="w-8 h-8 text-[#95a1ad] mb-2" />
                <p className="text-[#95a1ad]">No passkeys registered</p>
                <p className="text-sm text-[#95a1ad]/80 mt-1">Add your first passkey using the form below</p>
              </div>
            )}
          </div>
        </div>
        {/* Register New Passkey Section */}
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              <h3 className="font-normal text-lg">Register New Passkey</h3>
            </div>
          </div>
          <div className="p-4">
            <form onSubmit={registerPasskey} className="space-y-4">
              <div>
                <label htmlFor="passkey-name" className="block text-sm text-[#95a1ad] mb-1">Passkey Name</label>
                <input
                  id="passkey-name"
                  type="text"
                  placeholder="e.g. MacBook Pro, iPhone 15, YubiKey"
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#394047] border border-white/5 rounded-md text-sm focus:outline-none focus:border-white/5 focus:ring-1 focus:ring-white/20 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isRegistering || !newPasskeyName.trim()}
                className={`px-4 py-2 rounded-md font-medium text-sm transition active:scale-95 flex items-center gap-2 ${isRegistering || !newPasskeyName.trim()
                    ? 'bg-white/20 text-white/60 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-white/90'
                  }`}
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Register New Passkey
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasskeysPage;