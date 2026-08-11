import React, { useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "~/components/ui/toast";
import { useToast } from "~/hooks/use-toast";
import { ErrorDiagnosticsModal } from "~/components/ErrorDiagnosticsModal";
import { AlertCircle, Bug } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();
  const [selectedErrorData, setSelectedErrorData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDiagnostics = (toastData) => {
    setSelectedErrorData({
      code: toastData.errorCode || 'ERR-UNKNOWN',
      title: toastData.title || 'Error',
      message: typeof toastData.description === 'string' ? toastData.description : 'An error occurred.',
      cause: toastData.cause || 'Cause could not be identified automatically.',
      suggestion: toastData.suggestion || 'Try again or contact support.',
      status: toastData.errorDetails?.status || 'N/A',
      rawDetails: toastData.errorDetails || {},
    });
    setIsModalOpen(true);
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, errorCode, cause, suggestion, errorDetails, ...props }) {
        const isErrorToast = props.variant === 'destructive' || errorCode;

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1.5 w-full">
              <div className="flex items-start justify-between gap-2">
                {title && (
                  <ToastTitle className="flex items-center gap-1.5 flex-wrap">
                    {title}
                    {errorCode && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-red-950/90 text-red-200 border border-red-800/80">
                        {errorCode}
                      </span>
                    )}
                  </ToastTitle>
                )}
              </div>

              {description && (
                <ToastDescription className="text-xs">{description}</ToastDescription>
              )}

              {isErrorToast && cause && (
                <div className="mt-1 p-1.5 rounded bg-black/20 border border-white/10 text-[11px] space-y-0.5">
                  <div className="font-semibold text-red-200 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                    <span>Reason:</span> {cause}
                  </div>
                  {suggestion && (
                    <div className="text-amber-200/90 text-[10.5px] pl-4">
                      <span>Tip:</span> {suggestion}
                    </div>
                  )}
                </div>
              )}

              {isErrorToast && (errorCode || errorDetails) && (
                <button
                  type="button"
                  onClick={() => handleOpenDiagnostics({ title, description, errorCode, cause, suggestion, errorDetails })}
                  className="mt-1 self-start inline-flex items-center gap-1 text-[10px] font-semibold text-red-200 hover:text-white underline decoration-red-400/60 transition-colors"
                >
                  <Bug className="h-3 w-3" /> View Diagnostic Report
                </button>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />

      <ErrorDiagnosticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        errorData={selectedErrorData}
      />
    </ToastProvider>
  );
}
