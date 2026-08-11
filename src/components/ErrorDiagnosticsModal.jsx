import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertTriangle, Copy, Check, Info, ShieldAlert } from 'lucide-react';

export function ErrorDiagnosticsModal({ isOpen, onClose, errorData }) {
  const [copied, setCopied] = useState(false);

  if (!errorData) return null;

  const {
    code = 'ERR-UNKNOWN',
    title = 'Error Occurred',
    message = 'An error occurred during operation.',
    cause = 'Cause could not be determined automatically.',
    suggestion = 'Retry the action or contact support.',
    status = 'N/A',
    rawDetails = {},
  } = errorData;

  const cleanTitle = (typeof title === 'string' ? title : 'Error').replace(/\s*\[ERR-[^\]]+\]/g, '').trim() || 'Error';

  const formatCopyPayload = () => {
    return [
      `=== OVERNODE ERROR DIAGNOSTIC REPORT ===`,
      `Error Code: ${code}`,
      `Title: ${cleanTitle}`,
      `Status Code: ${status}`,
      `Message: ${message}`,
      `Cause Analysis: ${cause}`,
      `Recommendation: ${suggestion}`,
      `Timestamp: ${rawDetails.timestamp || new Date().toISOString()}`,
      `API Endpoint: ${rawDetails.method || 'GET'} ${rawDetails.url || 'N/A'}`,
      `Raw Response: ${JSON.stringify(rawDetails.responsePayload || {}, null, 2)}`,
      `======================================`,
    ].join('\n');
  };

  const handleCopy = async () => {
    const textToCopy = formatCopyPayload();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error diagnostics:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-neutral-950 text-neutral-100 border-neutral-800">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {cleanTitle}
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-red-950 text-red-300 border border-red-800">
                {code}
              </span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-neutral-400 text-sm">
            Detailed error diagnostics and cause report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Main Error Message */}
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-200 font-medium">
            {message}
          </div>

          {/* Probable Cause Section */}
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 text-xs uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              Probable Cause
            </div>
            <p className="text-neutral-300 text-xs leading-relaxed">
              {cause}
            </p>
          </div>

          {/* Recommended Resolution */}
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-blue-400 text-xs uppercase tracking-wider">
              <Info className="h-3.5 w-3.5" />
              Recommended Resolution
            </div>
            <p className="text-neutral-300 text-xs leading-relaxed">
              {suggestion}
            </p>
          </div>

          {/* Technical Payload Details */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-neutral-400">Diagnostic Details:</label>
            <pre className="p-3 rounded bg-neutral-900 text-neutral-300 font-mono text-[11px] max-h-[140px] overflow-y-auto border border-neutral-800">
              {JSON.stringify(
                {
                  code,
                  status,
                  url: rawDetails.url,
                  method: rawDetails.method,
                  timestamp: rawDetails.timestamp,
                  response: rawDetails.responsePayload,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1.5 border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied Diagnostic Report' : 'Copy Diagnostic Report'}
          </Button>

          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
