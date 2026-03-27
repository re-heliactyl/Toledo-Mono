import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  Check,
  Coins,
  Download,
  FileText,
  History,
  LayoutDashboard,
  PiggyBank,
  Plus,
  RefreshCw,
  Send,
  Trophy,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import StakingPage from './Staking';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState({ checkout: false, purchase: false, transfer: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transfer State
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Fetch user info for Receive ID (uses consolidated init endpoint)
  const { data: userInfo } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/init');
      return response.data.user;
    }
  });

  // Handle query param for tab selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const action = params.get('action');

    if (tab && ['overview', 'saving', 'activity', 'invoices', 'leaderboards'].includes(tab)) {
      setActiveTab(tab);
    }

    // Handle actions from sidebar
    if (action === 'send') {
      setActiveTab('overview');
      setIsSendOpen(true);
    } else if (action === 'receive') {
      setActiveTab('overview');
      setIsReceiveOpen(true);
    }
  }, [location.search]);

  // Fetch billing info
  const { data: billingInfo, isLoading: loadingInfo } = useQuery({
    queryKey: ['billingInfo'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/billing/info');
      return response.data;
    }
  });

  // Fetch transactions
  const { data: transactions, isLoading: loadingTxns } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/billing/transactions');
      return response.data;
    }
  });

  // Fetch invoices
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/billing/invoices');
      return response.data;
    },
    enabled: activeTab === 'invoices'
  });

  const formatTransactionDetails = (txn) => {
    if (!txn.details) return 'No details available';
    if (typeof txn.details === 'string') return txn.details;

    const { type, details } = txn;

    if (type === 'credit_purchase') return 'Stripe Top-up';
    if (type === 'coin_purchase') return `${details.package_amount || 'Unknown'} Coins`;
    if (type === 'transfer_sent') return `Sent to ${details.to || 'Unknown'}`;
    if (type === 'transfer_received') return `Received from ${details.from || 'Unknown'}`;
    
    if (type === 'store_purchase' || type === 'store purchase') {
      return `Bought ${details.amount || 1}x ${details.resource || 'resource'}`;
    }
    
    if (type === 'daily_claim' || type === 'daily claim') {
      return `Daily reward (Streak: ${details.streak || 0})`;
    }
    
    if (type === 'purchase') {
      if (details.package_amount) {
        return `Package of ${details.package_amount} Coins ($${details.price_usd})`;
      }
      if (details.amount_usd) {
        return (
          <span className="flex items-center gap-2">
            Stripe Top-up (${(details.amount_usd / 100).toFixed(2)})
            {details.invoice_url && (
              <a href={details.invoice_url} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors" title="View Invoice">
                <FileText className="w-3 h-3" />
              </a>
            )}
          </span>
        );
      }
    }

    if (type === 'spend') {
      return details.description || 'Spend';
    }

    return details.description || JSON.stringify(details);
  };

  const formatTransactionAmount = (txn) => {
    let isCurrency = false;
    let isCoins = false;

    if (['credit_purchase', 'bundle_purchase', 'credit_spend', 'spend'].includes(txn.type)) {
      isCurrency = true;
    } else if (txn.type === 'purchase' && txn.details?.amount_usd) {
      isCurrency = true;
    } else if (
      ['coin_purchase', 'transfer_sent', 'transfer_received', 'daily_claim', 'daily claim', 'stake_create', 'stake_claim', 'store_purchase', 'store purchase', 'boost_purchase', 'boost_refund', 'boost_extend'].includes(txn.type) ||
      (txn.type === 'purchase' && txn.details?.package_amount)
    ) {
      isCoins = true;
    }

    const isNegative = txn.amount < 0 || txn.type === 'spend' || txn.type === 'credit_spend';
    const sign = txn.amount === 0 ? '' : (isNegative ? '-' : '+');
    const rawAmount = Math.abs(txn.amount);

    if (isCurrency) {
      return `${sign}${(rawAmount / 100).toFixed(2)}`;
    } else if (isCoins) {
      return `${sign}${rawAmount} Coins`;
    } else {
      return `${sign}${rawAmount}`;
    }
  };

  const handleTopUp = async () => {
    try {
      if (!amount || parseFloat(amount) < 1) {
        setError('Minimum top-up amount is $1.00');
        return;
      }

      setLoading(prev => ({ ...prev, checkout: true }));
      setError('');
      
      const response = await axios.post('/api/v5/billing/checkout', {
        amount_usd: parseFloat(amount)
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to initiate checkout: No redirect URL provided');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate checkout');
    } finally {
      setLoading(prev => ({ ...prev, checkout: false }));
    }
  };
  
  const handlePurchaseCoins = async (packageId, priceUsd) => {
    try {
      const currentCredit = billingInfo?.balances?.credit_usd || 0;

      // If user doesn't have enough credit, redirect to Stripe checkout first
      if (currentCredit < priceUsd) {
        setLoading(prev => ({ ...prev, checkout: true }));
        setError('');
        
        const response = await axios.post('/api/v5/billing/checkout', {
          amount_usd: priceUsd
        });

        if (response.data.url) {
          window.location.href = response.data.url;
          return;
        } else {
          throw new Error('No redirect URL provided');
        }
      }

      // Normal purchase if credit is sufficient
      setLoading(prev => ({ ...prev, purchase: true }));
      setError('');
      setSuccess('');

      await axios.post('/api/v5/billing/purchase-coins', {
        package_id: packageId
      });

      setSuccess('Coins purchased successfully!');
      queryClient.invalidateQueries(['billingInfo']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['storeConfig']); // Update header balance
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to process purchase');
    } finally {
      setLoading(prev => ({ ...prev, purchase: false, checkout: false }));
    }
  };

  const handleTransfer = async () => {
    try {
      if (!recipientId || !transferAmount || parseInt(transferAmount) <= 0) {
        setError('Please enter a valid recipient ID and amount');
        return;
      }

      setLoading(prev => ({ ...prev, transfer: true }));
      setError('');
      
      await axios.post('/api/v5/billing/transfer-coins', {
        recipientEmail: recipientId, // Using ID as email field for now based on backend logic
        amount: parseInt(transferAmount)
      });

      setSuccess(`Successfully sent ${transferAmount} coins to ${recipientId}`);
      setIsSendOpen(false);
      setRecipientId('');
      setTransferAmount('');
      queryClient.invalidateQueries(['billingInfo']);
      queryClient.invalidateQueries(['transactions']);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer coins');
    } finally {
      setLoading(prev => ({ ...prev, transfer: false }));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'saving', label: 'Saving', icon: PiggyBank },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
  ];

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wallet</h1>
          <p className="text-[#95a1ad]">Manage your credits, savings and activity</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2e3337] overflow-x-auto">
        <div className="flex space-x-2 w-max pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 p-3 flex items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 text-green-500 p-3 flex items-start">
          <Check className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coin Balance Card - New */}
          <div className="border border-[#2e3337] rounded-lg bg-transparent">
            <div className="p-4 pb-3 border-b border-[#2e3337]">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                  <Coins className="w-4 h-4 text-[#95a1ad]" />
                </div>
                <h3 className="font-normal text-sm">Coin Balance</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white mb-4">
                {(billingInfo?.balances?.coins || 0).toLocaleString()} <span className="text-sm text-[#95a1ad] font-normal">coins</span>
              </div>
              {settings?.features?.coinTransfer !== false && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsSendOpen(true)}
                  className="flex-1 py-2 px-3 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
                <button 
                  onClick={() => setIsReceiveOpen(true)}
                  className="flex-1 py-2 px-3 bg-[#202229] text-white hover:bg-[#202229]/80 border border-white/10 rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Receive
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Balance Card */}
          <div className="border border-[#2e3337] rounded-lg bg-transparent">
            <div className="p-4 pb-3 border-b border-[#2e3337]">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                  <Wallet className="w-4 h-4 text-[#95a1ad]" />
                </div>
                <h3 className="font-normal text-sm">Credit Balance</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white mb-4">
                ${billingInfo?.balances?.credit_usd?.toFixed(2) || '0.00'}
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#95a1ad]">$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-6 bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md py-2 text-sm focus:outline-none transition-colors text-white placeholder-white/30"
                    />
                  </div>
                  <button 
                    onClick={handleTopUp}
                    disabled={loading.checkout || !amount}
                    className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.checkout ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Funds
                  </button>
                </div>
                <p className="text-xs text-[#95a1ad]">
                  Payments are processed securely via Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* Coin Exchange Card */}
          <div className="border border-[#2e3337] rounded-lg bg-transparent lg:col-span-1">
            <div className="p-4 pb-3 border-b border-[#2e3337]">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                  <RefreshCw className="w-4 h-4 text-[#95a1ad]" />
                </div>
                <div>
                  <h3 className="font-normal text-sm">Purchase Coins</h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3">
                {billingInfo?.coin_packages?.slice(0, 3).map((pkg) => {
                  const hasEnough = billingInfo?.balances?.credit_usd >= pkg.price_usd;
                  return (
                    <button
                      key={pkg.amount}
                      onClick={() => handlePurchaseCoins(pkg.amount, pkg.price_usd)}
                      disabled={loading.purchase || loading.checkout}
                      className={`
                        relative group flex items-center justify-between p-3 rounded-lg border transition-all
                        border-[#2e3337] hover:bg-[#202229]/50 hover:border-white/20 cursor-pointer active:scale-95
                      `}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-white">{pkg.amount} Coins</span>
                        {!hasEnough && <span className="text-[10px] text-yellow-500/80">Buy directly via Stripe</span>}
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-[#202229] text-white border border-white/10 flex items-center gap-2">
                        {loading.checkout && (billingInfo?.balances?.credit_usd < pkg.price_usd) ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : null}
                        ${pkg.price_usd}
                      </span>
                    </button>
                  );
                })}
                <button 
                  onClick={() => window.location.href = '/coins/store'}
                  className="w-full py-2 text-xs text-[#95a1ad] hover:text-white transition-colors text-center"
                >
                  View all packages
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saving' && (
        <StakingPage embedded={true} />
      )}

      {activeTab === 'activity' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <History className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Transaction History</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#95a1ad] bg-[#202229]/50 border-b border-[#2e3337]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e3337]">
                {transactions?.transactions?.length > 0 ? (
                  transactions.transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-[#202229]/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white/70">
                        {new Date(txn.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#202229] text-white border border-white/10 capitalize">
                          {txn.type.replace('_', ' ')}
                        </span>
                      </td>
                       <td className="px-4 py-3 text-[#95a1ad]">
                        {formatTransactionDetails(txn)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        (txn.amount < 0 || (txn.amount > 0 && (txn.type === 'spend' || txn.type === 'credit_spend'))) ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {formatTransactionAmount(txn)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#95a1ad]">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <FileText className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Invoices</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[#95a1ad] bg-[#202229]/50 border-b border-[#2e3337]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Invoice ID</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e3337]">
                {invoices?.invoices?.length > 0 ? (
                  invoices.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#202229]/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white/70">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#95a1ad]">
                        {inv.id}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        ${inv.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[#95a1ad] hover:text-white"
                          onClick={() => window.open(inv.url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#95a1ad]">
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaderboards' && (
        <div className="flex flex-col items-center justify-center py-24 border border-[#2e3337] rounded-lg bg-transparent border-dashed">
          <Trophy className="w-16 h-16 text-[#2e3337] mb-4" />
          <h3 className="text-lg font-medium text-white">Leaderboards</h3>
          <p className="text-[#95a1ad] mt-2">Coming soon to Heliactyl Next</p>
        </div>
      )}

      {/* Send Dialog */}
{settings?.features?.coinTransfer !== false && (
<Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
  <DialogContent className="bg-[#202229] border border-white/5 text-white sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Send Coins</DialogTitle>
      <DialogDescription className="text-[#95a1ad]">
        Transfer coins to another user immediately.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#95a1ad]">Recipient ID</label>
        <input
          placeholder="Enter user ID"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="w-full bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors text-white placeholder-white/30"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#95a1ad]">Amount</label>
        <input
          type="number"
          placeholder="Amount to send"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          className="w-full bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors text-white placeholder-white/30"
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsSendOpen(false)} className="text-[#95a1ad] hover:text-white hover:bg-white/5">Cancel</Button>
      <Button 
        onClick={handleTransfer} 
        disabled={loading.transfer || !recipientId || !transferAmount}
        className="bg-white text-black hover:bg-white/90"
      >
        {loading.transfer ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        Send Coins
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
)}

      {/* Receive Dialog */}
{settings?.features?.coinTransfer !== false && (
<Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
  <DialogContent className="bg-[#202229] border border-white/5 text-white sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Receive Coins</DialogTitle>
      <DialogDescription className="text-[#95a1ad]">
        Share your User ID with others to receive coins.
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col items-center justify-center py-6 space-y-4">
      <div className="p-4 bg-[#1a1c1e] rounded-lg border border-dashed border-[#2e3337] w-full text-center">
        <p className="text-xs text-[#95a1ad] mb-1">Your User ID</p>
        <p className="text-lg md:text-2xl overflow-auto font-mono font-bold tracking-wider select-all">{userInfo?.id || 'Loading...'}</p>
      </div>
      <p className="text-xs text-[#95a1ad] text-center max-w-xs">
        Transactions are irreversible. Only share this ID with trusted users.
      </p>
    </div>
    <DialogFooter>
      <Button onClick={() => setIsReceiveOpen(false)} className="w-full bg-white text-black hover:bg-white/90">
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
)}
    </div>
  );
}
