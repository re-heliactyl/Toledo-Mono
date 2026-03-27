import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, RefreshCw, FileText, Calendar, DollarSign, CreditCard, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [transaction, setTransaction] = useState(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid session ID');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await axios.get(`/api/v5/billing/verify-checkout?session_id=${sessionId}`);
        setStatus('success');
        setMessage('Your payment has been processed successfully! Credits have been added to your account.');
        if (response.data.transaction) {
          setTransaction(response.data.transaction);
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        if (error.response?.data?.error === 'This payment has already been processed') {
            setStatus('success');
            setMessage('This payment was already processed.');
        } else {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Failed to verify payment. Please contact support.');
        }
      }
    };

    const timeout = setTimeout(verifyPayment, 1000);
    return () => clearTimeout(timeout);
  }, [sessionId]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/wallet');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-[#1a1c1e] border-[#2e3337] text-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#202229] border border-white/5">
            {status === 'verifying' && <RefreshCw className="h-10 w-10 animate-spin text-[#95a1ad]" />}
            {status === 'success' && <CheckCircle className="h-10 w-10 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-10 w-10 text-red-500" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'verifying' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'error' && 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-[#95a1ad] text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {status === 'success' && transaction && (
            <div className="bg-[#202229] border border-white/5 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#95a1ad] text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Amount Paid
                </span>
                <span className="text-xl font-bold text-white">${transaction.amount_usd?.toFixed(2)}</span>
              </div>
              
              <Separator className="bg-white/5" />
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad] flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </span>
                  <span>{new Date(transaction.date || Date.now()).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad] flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Transaction ID
                  </span>
                  <span className="font-mono text-xs text-white/70 truncate max-w-[150px]" title={transaction.id}>
                    {transaction.id}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad] flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Method
                  </span>
                  <span>{transaction.method || 'Credit Card'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button 
            onClick={() => navigate('/wallet')}
            className="w-full bg-white text-black hover:bg-white/90 font-medium h-11"
          >
            Return to Wallet {status === 'success' && `(${countdown}s)`} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          
          {status === 'success' && (
            <p className="text-xs text-[#95a1ad] text-center">
              You will be automatically redirected in {countdown} seconds.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
