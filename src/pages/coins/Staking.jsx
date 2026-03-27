import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CoinsIcon,
  Clock,
  TrendingUp,
  Percent,
  RefreshCw,
  Check,
  X,
  BarChart4,
  ArrowRight,
  HelpCircle,
  Calculator,
  ChevronDown,
  Wallet
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function StakingPage({ embedded = false }) {
  const queryClient = useQueryClient();
  // Initialize all state variables with proper defaults
  const [selectedPlan, setSelectedPlan] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [calculationDays, setCalculationDays] = useState('30');
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState({}); // Initialize as empty object
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [dialogAnimation, setDialogAnimation] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Fetch staking plans
  const { data: plans, isLoading: loadingPlans, error: plansError } = useQuery({
    queryKey: ['staking-plans'],
    queryFn: async () => {
      const response = await axios.get('/api/staking/plans');
      return response.data;
    }
  });

  // Fetch user's stakes
  const { data: stakes, isLoading: loadingStakes, error: stakesError } = useQuery({
    queryKey: ['staking-stakes'],
    queryFn: async () => {
      const response = await axios.get('/api/staking/stakes');
      return response.data;
    }
  });

  // Fetch staking summary
  const { data: summary, isLoading: loadingSummary, error: summaryError } = useQuery({
    queryKey: ['staking-summary'],
    queryFn: async () => {
      const response = await axios.get('/api/staking/summary');
      return response.data;
    }
  });

  // Fetch transaction history
  const { data: history, isLoading: loadingHistory, error: historyError } = useQuery({
    queryKey: ['staking-history'],
    queryFn: async () => {
      const response = await axios.get('/api/staking/history');
      return response.data;
    },
    enabled: activeTab === 'history'
  });

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plans && Object.keys(plans).length > 0 && !selectedPlan) {
      setSelectedPlan(Object.keys(plans)[0]);
    }
  }, [plans, selectedPlan]);

  // Handle dialog animation
  useEffect(() => {
    if (confirmDialog) {
      setIsDialogVisible(true);
      setTimeout(() => setDialogAnimation('opacity-100 scale-100'), 10);
    } else {
      setDialogAnimation('opacity-0 scale-95');
      setTimeout(() => setIsDialogVisible(false), 300);
    }
  }, [confirmDialog]);

  // Calculate potential earnings when values change
  useEffect(() => {
    if (selectedPlan && stakeAmount && !isNaN(Number(stakeAmount)) && plans) {
      calculateEarnings();
    } else {
      setCalculation(null);
    }
  }, [selectedPlan, stakeAmount, calculationDays, plans]);

  const calculateEarnings = async () => {
    try {
      const amount = parseFloat(stakeAmount);
      const days = parseInt(calculationDays) || 30;

      if (isNaN(amount) || amount <= 0) return;

      const response = await axios.get('/api/staking/calculate', {
        params: {
          planId: selectedPlan,
          amount,
          duration: days
        }
      });

      setCalculation(response.data);
    } catch (error) {
      console.error('Failed to calculate earnings:', error);
    }
  };

  const handleStake = async () => {
    if (!selectedPlan || !stakeAmount) return;

    try {
      setLoading(prev => ({ ...prev, stake: true }));
      setError('');
      setSuccess('');

      const response = await axios.post('/api/staking/stakes', {
        planId: selectedPlan,
        amount: parseFloat(stakeAmount)
      });

      setSuccess('Stake created successfully!');
      setStakeAmount('');

      // Invalidate related queries to refresh data
      await queryClient.invalidateQueries(['staking-stakes']);
      await queryClient.invalidateQueries(['staking-summary']);
      await queryClient.invalidateQueries(['staking-history']);

      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create stake');
    } finally {
      setLoading(prev => ({ ...prev, stake: false }));
    }
  };

  const handleClaim = async (stakeId) => {
    try {
      setLoading(prev => ({ ...prev, [`claim-${stakeId}`]: true }));
      setError('');
      setSuccess('');

      await axios.post(`/api/staking/stakes/${stakeId}/claim`);

      setSuccess('Stake claimed successfully!');

      // Invalidate related queries to refresh data
      await queryClient.invalidateQueries(['staking-stakes']);
      await queryClient.invalidateQueries(['staking-summary']);
      await queryClient.invalidateQueries(['staking-history']);

      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to claim stake');
    } finally {
      setLoading(prev => ({ ...prev, [`claim-${stakeId}`]: false }));
    }
  };

  const handleStakeDialogOpen = () => {
    if (!selectedPlan || !stakeAmount || !plans) return;

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) return;

    const plan = plans[selectedPlan];
    const calculatedReward = calculation?.totalReturn;

    setConfirmDialog({
      type: 'stake',
      plan,
      amount,
      calculatedReward
    });
  };

  const handleClaimDialogOpen = (stake) => {
    setConfirmDialog({
      type: 'claim',
      stake
    });
  };

  const formatDateFromNow = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
  };

  const isActuallyLoading = loadingPlans || loadingSummary || loadingStakes;
  const hasError = plansError || summaryError || stakesError || plans?.error || summary?.error || stakes?.error || (!loadingPlans && !plans);

  if (isActuallyLoading && !hasError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
        </div>
      </div>
    );
  }

  if (hasError && !plans) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading staking</h3>
            <p className="text-sm mt-1">
              {plansError?.response?.data?.message ||
                plansError?.response?.data?.error ||
                plansError?.message ||
                plans?.error ||
                plans?.message ||
                "Failed to load staking configuration. Please try again later."}
            </p>
            <button
              onClick={() => {
                queryClient.invalidateQueries(['staking-plans']);
                queryClient.invalidateQueries(['staking-summary']);
                queryClient.invalidateQueries(['staking-stakes']);
              }}
              className="mt-3 px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeStakes = Array.isArray(stakes) ? stakes.filter(stake => stake.status === 'active') : [];
  const claimedStakes = Array.isArray(stakes) ? stakes.filter(stake => stake.status === 'claimed') : [];

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-6 max-w-screen-2xl mx-auto'}`}>
      {/* Header section - only show if not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Staking</h1>
            <p className="text-[#95a1ad]">Stake your coins and earn high APY rewards over time</p>
          </div>
          <div className="flex items-center gap-4 hidden">
            <div className="py-2 px-4 border border-[#2e3337] rounded-md flex items-center">
              <Wallet className="w-4 h-4 mr-2 text-[#95a1ad]" />
              <span>{(summary?.availableBalance || 0).toLocaleString()} coins</span>
            </div>
          </div>
        </div>
      )}

      {/* Alert messages */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <CoinsIcon className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Total Staked</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-2xl font-medium">{(summary?.totalStaked || 0).toLocaleString()} coins</p>
            <p className="text-sm text-[#95a1ad] mt-1">Across {summary?.activeStakesCount || 0} active stake{summary?.activeStakesCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <TrendingUp className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Accrued Rewards</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-2xl font-medium">{(summary?.totalRewards || 0).toLocaleString()} coins</p>
            <p className="text-sm text-[#95a1ad] mt-1">Ready to claim</p>
          </div>
        </div>

        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <Percent className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Returns</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-2xl font-medium">15-80% APY</p>
            <p className="text-sm text-[#95a1ad] mt-1">Depending on stake duration</p>
          </div>
        </div>
      </div>

      {/* Main content area - two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staking form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-[#2e3337] rounded-lg bg-transparent">
            <div className="p-4 pb-3 border-b border-[#2e3337]">
              <h3 className="font-normal text-lg">Start saving</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[#95a1ad] block">Saving Plan</label>
                <div className="relative">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full appearance-none bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors pr-10"
                  >
                    {plans && typeof plans === 'object' && Object.entries(plans).map(([id, plan]) => (
                      <option key={id} value={id}>{plan.name} ({plan.apy}% APY)</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-[#95a1ad]" />
                  </div>
                </div>
                {selectedPlan && plans && (
                  <div className="text-xs text-[#95a1ad] mt-1">
                    Min amount: {plans[selectedPlan].minAmount} coins
                    {plans[selectedPlan].minDuration > 0 && (
                      <> · Min duration: {Math.floor(plans[selectedPlan].minDuration / (24 * 60 * 60 * 1000))} days</>
                    )}
                    {plans[selectedPlan].penaltyPercent > 0 && (
                      <> · Early withdrawal fee: {plans[selectedPlan].penaltyPercent}%</>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#95a1ad] block">Amount to Save</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors"
                />
              </div>

              {calculation && (
                <div className="space-y-3 p-3 border border-[#2e3337] rounded-md bg-[#202229]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Daily reward:</span>
                    <span>{calculation.dailyReward.toFixed(2)} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Monthly reward:</span>
                    <span>{calculation.monthlyReward.toFixed(2)} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Yearly reward:</span>
                    <span>{calculation.yearlyReward.toFixed(2)} coins</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t border-[#2e3337]">
                    <span>Total after {calculationDays} days:</span>
                    <span>{calculation.totalReturn.toFixed(2)} coins</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="text-sm text-[#95a1ad] hover:text-white flex items-center gap-1"
                >
                  <Calculator className="w-3 h-3" />
                  {showCalculator ? 'Hide calculator' : 'Show calculator'}
                </button>
              </div>

              {showCalculator && (
                <div className="space-y-2">
                  <label className="text-sm text-[#95a1ad] block">Calculate for (days)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-2">
                    {[7, 14, 30, 60].map(days => (
                      <button
                        key={days}
                        className={`py-1 rounded-md font-medium text-sm transition active:scale-95 ${parseInt(calculationDays) === days
                            ? 'bg-white text-black'
                            : 'border border-[#2e3337] text-[#95a1ad] hover:text-white hover:bg-white/5'
                          }`}
                        onClick={() => setCalculationDays(days.toString())}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Custom days"
                    value={calculationDays}
                    onChange={(e) => setCalculationDays(e.target.value)}
                    className="w-full bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>
            <div className="p-4 pt-2">
              <button
                className={`w-full py-2 flex items-center justify-center rounded-md font-medium text-sm transition active:scale-95 ${loading.stake || !selectedPlan || !stakeAmount || parseFloat(stakeAmount) <= 0 || (plans && plans[selectedPlan]?.minAmount > parseFloat(stakeAmount))
                    ? 'bg-white/20 text-white/60 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-white/90'
                  }`}
                onClick={handleStakeDialogOpen}
                disabled={loading.stake || !selectedPlan || !stakeAmount || parseFloat(stakeAmount) <= 0 || (plans && plans[selectedPlan]?.minAmount > parseFloat(stakeAmount))}
              >
                {loading.stake ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CoinsIcon className="w-4 h-4 mr-2" />
                )}
                Save Coins
              </button>
            </div>
          </div>

          <div className="border border-[#2e3337] rounded-lg bg-transparent">
            <div className="p-4 pb-3 border-b border-[#2e3337]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#95a1ad]" />
                <h3 className="font-normal text-sm">How saving works</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-[#95a1ad] space-y-3">
                <p>1. Choose a saving plan based on your preferred duration and APY.</p>
                <p>2. Save your coins to start earning rewards immediately.</p>
                <p>3. Rewards are calculated and added daily to your savings.</p>
                <p>4. Claim your original amount plus rewards at any time.</p>
                <p>5. Early withdrawal may incur a penalty fee based on the plan.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active stakes and history */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#2e3337] rounded-lg bg-transparent">
            <div className="border-b border-[#2e3337]">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'active'
                      ? 'border-white text-white'
                      : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
                    }`}
                >
                  <CoinsIcon className="w-4 h-4" />
                  Active Savings
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'history'
                      ? 'border-white text-white'
                      : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
                    }`}
                >
                  <BarChart4 className="w-4 h-4" />
                  History
                </button>
              </div>
            </div>

            {activeTab === 'active' && (
              <div className="p-4">
                {Array.isArray(activeStakes) && activeStakes.length > 0 ? (
                  <div className="space-y-4">
                    {activeStakes.map(stake => (
                      <div
                        key={stake.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-[#2e3337] rounded-lg bg-[#202229]"
                      >
                        <div className="space-y-3 mb-4 md:mb-0">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1c1e] border border-white/5">
                              <CoinsIcon className="w-4 h-4 text-[#95a1ad]" />
                            </div>
                            <div>
                              <p className="font-medium">{stake.planDetails?.name} Plan</p>
                              <p className="text-xs text-[#95a1ad]">
                                Staked {formatDateFromNow(stake.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <p className="text-[#95a1ad]">Staked Amount:</p>
                              <p>{(stake.amount || 0).toLocaleString()} coins</p>
                            </div>
                            <div>
                              <p className="text-[#95a1ad]">Current Rewards:</p>
                              <p className="text-green-500">+{stake.accruedRewards.toFixed(2)} coins</p>
                            </div>
                            <div>
                              <p className="text-[#95a1ad]">APY Rate:</p>
                              <p>{stake.planDetails?.apy}%</p>
                            </div>
                            <div>
                              <p className="text-[#95a1ad]">Total Value:</p>
                              <p>{(stake.amount + stake.accruedRewards).toFixed(2)} coins</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            className={`py-2 px-4 rounded-md font-medium text-sm transition active:scale-95 ${loading[`claim-${stake.id}`]
                                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-white/90'
                              }`}
                            onClick={() => handleClaimDialogOpen(stake)}
                            disabled={loading[`claim-${stake.id}`]}
                          >
                            {loading[`claim-${stake.id}`] ? (
                              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              <>
                                <span>Claim Stake</span>
                              </>
                            )}
                          </button>

                          {stake.planDetails?.minDuration && stake.endTime && (
                            <div className="text-xs text-center">
                              {Date.now() < stake.endTime ? (
                                <span className="text-amber-500 flex items-center justify-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.ceil((stake.endTime - Date.now()) / (24 * 60 * 60 * 1000))} days until penalty-free
                                </span>
                              ) : (
                                <span className="text-green-500 flex items-center justify-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Penalty-free withdrawal available
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CoinsIcon className="w-12 h-12 text-[#95a1ad] mb-3 opacity-50" />
                    <p className="text-[#95a1ad]">You don't have any active stakes yet</p>
                    <p className="text-sm text-[#95a1ad] mt-1">Use the form on the left to start staking and earning rewards</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
                  </div>
                ) : (Array.isArray(claimedStakes) && claimedStakes.length > 0) || (Array.isArray(history) && history.length > 0) ? (
                  <div className="space-y-4">
                    {claimedStakes.map(stake => (
                      <div
                        key={stake.id}
                        className="p-4 border border-[#2e3337] rounded-lg bg-[#202229]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1c1e] border border-white/5">
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">Stake Claimed</p>
                            <p className="text-xs text-[#95a1ad]">
                              {stake.claimedAt ? formatDateFromNow(stake.claimedAt) : 'Date unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                          <div>
                            <p className="text-[#95a1ad]">Plan:</p>
                            <p>{stake.planDetails?.name || 'Unknown plan'}</p>
                          </div>
                          <div>
                            <p className="text-[#95a1ad]">Initial Amount:</p>
                            <p>{(stake.amount || 0).toLocaleString()} coins</p>
                          </div>
                          <div>
                            <p className="text-[#95a1ad]">Earned Rewards:</p>
                            <p className="text-green-500">+{stake.accruedRewards.toFixed(2)} coins</p>
                          </div>
                          {stake.penalty > 0 && (
                            <div>
                              <p className="text-[#95a1ad]">Early Withdrawal Fee:</p>
                              <p className="text-red-500">-{stake.penalty.toFixed(2)} coins</p>
                            </div>
                          )}
                          <div className="col-span-2 pt-2 border-t border-[#2e3337] mt-2">
                            <p className="text-[#95a1ad]">Total Returned:</p>
                            <p className="font-medium">{stake.returnedAmount?.toFixed(2) || (stake.amount + stake.accruedRewards - (stake.penalty || 0)).toFixed(2)} coins</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {Array.isArray(history) && history.map(transaction => (
                      <div
                        key={transaction.id}
                        className="p-4 border border-[#2e3337] rounded-lg bg-[#202229]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1c1e] border border-white/5">
                              {transaction.type === 'claim' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <CoinsIcon className="w-4 h-4 text-[#95a1ad]" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {transaction.type === 'claim' ? 'Stake Claimed' : 'Stake Created'}
                              </p>
                              <p className="text-xs text-[#95a1ad]">
                                {formatDateFromNow(transaction.timestamp)}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#95a1ad]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart4 className="w-12 h-12 text-[#95a1ad] mb-3 opacity-50" />
                    <p className="text-[#95a1ad]">No staking history yet</p>
                    <p className="text-sm text-[#95a1ad] mt-1">Your claimed stakes and transactions will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {isDialogVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ${dialogAnimation ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setConfirmDialog(null)}
          ></div>
          <div
            className={`relative bg-[#202229] border border-white/5 rounded-lg w-full max-w-md p-6 transition-all duration-300 ${dialogAnimation}`}
          >
            <div className="mb-4">
              <h2 className="text-lg font-medium">
                {confirmDialog?.type === 'stake' ? 'Confirm Saving' : 'Confirm Claim'}
              </h2>
              <p className="text-[#95a1ad] mt-1">
                {confirmDialog?.type === 'stake'
                  ? 'Are you sure you want to save your coins?'
                  : 'Are you sure you want to claim this savings?'}
              </p>
            </div>

            <div className="space-y-4 py-4">
              {confirmDialog?.type === 'stake' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Saving Plan:</span>
                    <span>{confirmDialog.plan?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Amount:</span>
                    <span>{confirmDialog.amount?.toLocaleString()} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">APY Rate:</span>
                    <span>{confirmDialog.plan?.apy}%</span>
                  </div>
                  {confirmDialog.calculatedReward && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#95a1ad]">Projected return:</span>
                      <span>{confirmDialog.calculatedReward.toFixed(2)} coins</span>
                    </div>
                  )}
                  {confirmDialog.plan?.minDuration > 0 && (
                    <div className="pt-3 border-t border-[#2e3337] text-sm">
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {confirmDialog.plan.penaltyPercent}% penalty for withdrawals before {Math.floor(confirmDialog.plan.minDuration / (24 * 60 * 60 * 1000))} days
                      </span>
                    </div>
                  )}
                </div>
              )}

              {confirmDialog?.type === 'claim' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Saving Plan:</span>
                    <span>{confirmDialog.stake?.planDetails?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Original Amount:</span>
                    <span>{(confirmDialog.stake?.amount || 0).toLocaleString()} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Earned Rewards:</span>
                    <span className="text-green-500">+{confirmDialog.stake?.accruedRewards.toFixed(2)} coins</span>
                  </div>

                  {confirmDialog.stake?.planDetails?.minDuration > 0 &&
                    confirmDialog.stake?.endTime &&
                    Date.now() < confirmDialog.stake.endTime && (
                      <div className="pt-3 border-t border-[#2e3337] text-sm">
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Early withdrawal will incur a {confirmDialog.stake.planDetails.penaltyPercent}% fee on the staked amount
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 font-medium text-sm transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDialog?.type === 'stake' ? handleStake() : handleClaim(confirmDialog?.stake?.id || '')}
                className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                {loading.stake || loading[`claim-${confirmDialog?.stake?.id}`] ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm {confirmDialog?.type === 'stake' ? 'Save' : 'Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}