import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Gift,
  Calendar,
  Clock,
  Coins,
  Shield,
  AlertCircle,
  Check,
  Trophy,
  RefreshCw,
  ChevronRight,
  X,
  Zap,
  Info,
  Users,
  BarChart4,
  History
} from 'lucide-react';

export default function DailyRewardsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('claim');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [purchasingProtection, setPurchasingProtection] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [dialogAnimation, setDialogAnimation] = useState('');

  // Get daily rewards status
  const { data: claimStatus, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['daily-rewards-status'],
    queryFn: async () => {
      const response = await axios.get('/api/daily-rewards/status');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Get claim history
  const { data: claimHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['daily-rewards-history'],
    queryFn: async () => {
      const response = await axios.get('/api/daily-rewards/history');
      return response.data;
    },
    enabled: activeTab === 'history'
  });

  // Get leaderboard
  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['daily-rewards-leaderboard'],
    queryFn: async () => {
      const response = await axios.get('/api/daily-rewards/leaderboard');
      return response.data;
    },
    enabled: activeTab === 'leaderboard'
  });

  // Handle dialog animations
  useEffect(() => {
    if (confirmDialog) {
      setIsDialogVisible(true);
      setTimeout(() => setDialogAnimation('opacity-100 scale-100'), 10);
    } else {
      setDialogAnimation('opacity-0 scale-95');
      setTimeout(() => setIsDialogVisible(false), 300);
    }
  }, [confirmDialog]);

  // Clear claim result after 5 seconds
  useEffect(() => {
    if (claimResult) {
      const timer = setTimeout(() => {
        setClaimResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [claimResult]);

  // Claim daily reward
  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      setError('');
      setSuccess('');

      const response = await axios.post('/api/daily-rewards/claim');
      setClaimResult(response.data);
      setSuccess('Successfully claimed your daily reward!');

      // Refetch data
      queryClient.invalidateQueries(['daily-rewards-status']);
      queryClient.invalidateQueries(['daily-rewards-history']);
      queryClient.invalidateQueries(['daily-rewards-leaderboard']);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to claim daily reward');
    } finally {
      setIsClaiming(false);
    }
  };

  // Purchase protection
  const handlePurchaseProtection = async (level) => {
    try {
      setPurchasingProtection(true);
      setError('');
      setSuccess('');

      const response = await axios.post('/api/daily-rewards/protection', { level });
      setSuccess(`Successfully purchased ${level} streak protection!`);

      // Refetch status
      queryClient.invalidateQueries(['daily-rewards-status']);
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to purchase streak protection');
    } finally {
      setPurchasingProtection(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Days until format
  const getDaysUntil = (days) => {
    if (days === 1) return 'Tomorrow';
    if (days <= 0) return 'Today';
    return `In ${days} days`;
  };

  // Loading state
  if (loadingStatus && !claimStatus) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Daily Rewards</h1>
          <p className="text-[#95a1ad]">Claim rewards every day and build your streak for bigger bonuses</p>
        </div>
      </div>

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

      {/* Tab navigation */}
      <div className="border-b border-[#2e3337] overflow-x-auto">
        <div className="flex space-x-2 w-max pb-px">
          <button
            onClick={() => setActiveTab('claim')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'claim'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <Gift className="w-4 h-4" />
            Daily Claim
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'history'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <History className="w-4 h-4" />
            Claim History
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'leaderboard'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <Trophy className="w-4 h-4" />
            Streaks Leaderboard
          </button>
        </div>
      </div>

      {/* Claim Tab Content */}
      {activeTab === 'claim' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily claim card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-[#2e3337] rounded-lg bg-transparent">
              <div className="p-4 pb-3 border-b border-[#2e3337]">
                <h3 className="font-normal text-lg">Daily Rewards</h3>
              </div>
              <div className="p-6">
                {claimResult ? (
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-[#202229] border border-white/10 flex items-center justify-center">
                      <Gift className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">Reward Claimed!</h3>
                      <p className="text-2xl font-bold text-green-500">+{claimResult.reward} coins</p>
                      <p className="text-sm text-[#95a1ad]">Current streak: {claimResult.streak} day{claimResult.streak !== 1 ? 's' : ''}</p>
                    </div>

                    {claimResult.milestoneMessage && (
                      <div className="bg-[#202229] p-4 rounded-lg border border-white/10 max-w-md">
                        <p className="text-yellow-400 font-medium">{claimResult.milestoneMessage}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-md">
                      <div className="bg-[#202229] p-3 rounded-lg border border-white/5 flex flex-col items-center">
                        <p className="text-xs text-[#95a1ad]">Base</p>
                        <p className="font-medium">{claimResult.baseAmount}</p>
                      </div>
                      <div className="bg-[#202229] p-3 rounded-lg border border-white/5 flex flex-col items-center">
                        <p className="text-xs text-[#95a1ad]">Streak Bonus</p>
                        <p className="font-medium">x{claimResult.multiplier.toFixed(1)}</p>
                      </div>
                      <div className="bg-[#202229] p-3 rounded-lg border border-white/5 flex flex-col items-center">
                        <p className="text-xs text-[#95a1ad]">Milestone</p>
                        <p className="font-medium">+{claimResult.milestoneBonus}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-[#95a1ad]">
                      <p>Come back tomorrow to continue your streak!</p>
                      {claimResult.streakProtectionRemaining > 0 && (
                        <p className="text-yellow-400 mt-1">
                          You have {claimResult.streakProtectionRemaining} day{claimResult.streakProtectionRemaining !== 1 ? 's' : ''} of streak protection remaining
                        </p>
                      )}
                    </div>
                  </div>
                ) : claimStatus?.canClaim ? (
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-[#202229] border border-white/10 flex items-center justify-center">
                      <Gift className="w-12 h-12 text-[#95a1ad]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">Claim Your Daily Reward</h3>
                      <p className="text-sm text-[#95a1ad]">
                        {claimStatus.currentStreak > 0
                          ? `Current streak: ${claimStatus.currentStreak} day${claimStatus.currentStreak !== 1 ? 's' : ''}`
                          : 'Start your streak today!'}
                      </p>
                    </div>

                    <div className="bg-[#202229] p-4 rounded-lg border border-white/10 max-w-md">
                      <div className="flex justify-between mb-2 gap-3">
                        <span className="text-[#95a1ad]">Today's reward:</span>
                        <span className="font-medium">{claimStatus.nextReward.amount} coins</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mt-3">
                        <div className="p-2 rounded bg-[#1a1c1e] flex flex-col items-center">
                          <span className="text-[#95a1ad]">Base</span>
                          <span>{claimStatus.nextReward.baseAmount}</span>
                        </div>
                        <div className="p-2 rounded bg-[#1a1c1e] flex flex-col items-center">
                          <span className="text-[#95a1ad]">Multiplier</span>
                          <span>{claimStatus.nextReward.multiplier.toFixed(1)}x</span>
                        </div>
                        <div className="p-2 rounded bg-[#1a1c1e] flex flex-col items-center">
                          <span className="text-[#95a1ad]">Milestone</span>
                          <span>+{claimStatus.nextReward.milestoneBonus}</span>
                        </div>
                      </div>
                    </div>

                    {claimStatus.daysSinceLastClaim > 1 && !claimStatus.streakWillMaintain && (
                      <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 p-3 max-w-md">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">
                            It's been {claimStatus.daysSinceLastClaim} days since your last claim. Your streak will reset.
                          </span>
                        </div>
                      </div>
                    )}

                    {claimStatus.willUseProtection && (
                      <div className="rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-500 p-3 max-w-md">
                        <div className="flex items-start">
                          <Shield className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">
                            Streak protection will be used to maintain your streak.
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      className="px-6 py-3 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
                      onClick={handleClaim}
                      disabled={isClaiming}
                    >
                      {isClaiming ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                      Claim Daily Reward
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-[#202229] border border-white/10 flex items-center justify-center">
                      <Clock className="w-12 h-12 text-[#95a1ad]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">Already Claimed Today</h3>
                      <p className="text-sm text-[#95a1ad]">
                        Current streak: {claimStatus.currentStreak} day{claimStatus.currentStreak !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="bg-[#202229] p-4 rounded-lg border border-white/10 max-w-md">
                      <p className="text-[#95a1ad] mb-2">Come back tomorrow to continue your streak</p>
                      <p className="font-medium">Next reward: {claimStatus.nextReward.amount} coins</p>
                    </div>

                    <div className="text-sm text-[#95a1ad]">
                      <p>Last claimed: {formatDate(claimStatus.lastClaimTimestamp)}</p>
                    </div>

                    <button
                      className="px-6 py-3 bg-white/20 text-white/60 cursor-not-allowed rounded-md font-medium text-sm flex items-center justify-center gap-2"
                      disabled
                    >
                      <Clock className="w-4 h-4" />
                      Already Claimed Today
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming rewards preview */}
            <div className="border border-[#2e3337] rounded-lg bg-transparent">
              <div className="p-4 pb-3 border-b border-[#2e3337]">
                <h3 className="font-normal text-lg">Upcoming Rewards</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Show next 6 days of rewards */}
                  {[1, 2, 3, 4, 5, 6].map(offset => {
                    const futureStreak = (claimStatus?.projectedStreak || 0) + offset - 1;
                    // Calculate reward for this future streak day
                    const baseAmount = 25; // Same as backend calculation

                    let multiplier = 1.0;
                    let milestoneBonus = 0;
                    let isMilestone = false;

                    // Simple multiplier calculation (should match backend logic)
                    if (futureStreak <= 6) multiplier = [1.0, 1.0, 1.1, 1.1, 1.2, 1.2][futureStreak - 1];
                    else if (futureStreak === 7) { multiplier = 1.5; milestoneBonus = 50; isMilestone = true; }
                    else if (futureStreak <= 13) multiplier = 1.2 + (Math.floor((futureStreak - 8) / 2) * 0.1);
                    else if (futureStreak === 14) { multiplier = 1.75; milestoneBonus = 100; isMilestone = true; }
                    else if (futureStreak <= 20) multiplier = 1.4 + (Math.floor((futureStreak - 15) / 2) * 0.1);
                    else if (futureStreak === 21) { multiplier = 2.0; milestoneBonus = 150; isMilestone = true; }
                    else if (futureStreak <= 27) multiplier = 1.6 + (Math.floor((futureStreak - 22) / 2) * 0.1);
                    else if (futureStreak === 28) { multiplier = 2.5; milestoneBonus = 200; isMilestone = true; }
                    else if (futureStreak === 30) { multiplier = 2.0; milestoneBonus = 300; isMilestone = true; }
                    else multiplier = 2.0;

                    const amount = Math.floor((baseAmount * multiplier) + milestoneBonus);

                    return (
                      <div
                        key={offset}
                        className={`border rounded-lg p-3 ${isMilestone
                            ? 'border-yellow-500/30 bg-yellow-500/5'
                            : 'border-[#2e3337] bg-[#202229]'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-[#95a1ad]">Day {futureStreak}</span>
                          <span className="text-xs text-[#95a1ad]">{getDaysUntil(offset)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={isMilestone ? 'text-yellow-400 font-medium' : ''}>{amount} coins</span>
                          {isMilestone && <Trophy className="w-4 h-4 text-yellow-400" />}
                        </div>
                        {isMilestone && (
                          <div className="mt-1 text-xs text-yellow-400">Milestone day!</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Streak info sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-[#2e3337] rounded-lg bg-transparent">
              <div className="p-4 pb-3 border-b border-[#2e3337]">
                <h3 className="font-normal text-lg">Your Streak Info</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-col items-center justify-center space-y-3 p-4 border border-[#2e3337] rounded-lg bg-[#202229]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full">
                    <div className="flex flex-col items-center">
                      <p className="text-[#95a1ad] text-xs">Current Streak</p>
                      <p className="text-2xl font-bold">{claimStatus?.currentStreak || 0}</p>
                      <p className="text-xs text-[#95a1ad]">days</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[#95a1ad] text-xs">Longest Streak</p>
                      <p className="text-2xl font-bold">{claimStatus?.longestStreak || 0}</p>
                      <p className="text-xs text-[#95a1ad]">days</p>
                    </div>
                  </div>

                  <div className="w-full border-t border-[#2e3337] pt-3 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#95a1ad]">Total Claims:</span>
                      <span>{claimStatus?.totalClaimed || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-[#95a1ad]">Total Earned:</span>
                      <span>{claimStatus?.totalCoinsEarned || 0} coins</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-[#95a1ad]">Last Claim:</span>
                      <span>{claimStatus?.lastClaimTimestamp ? new Date(claimStatus.lastClaimTimestamp).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>

                {/* Streak protection section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Streak Protection</h4>
                    <div className="px-2 py-1 rounded bg-[#202229] text-xs">
                      {claimStatus?.streakProtection > 0
                        ? `${claimStatus.streakProtection} day${claimStatus.streakProtection !== 1 ? 's' : ''} active`
                        : 'None active'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      className={`p-2 rounded text-xs flex flex-col items-center justify-center space-y-1 transition ${claimStatus?.streakProtection >= 1
                          ? 'bg-[#202229] text-[#95a1ad] cursor-not-allowed'
                          : 'border border-[#2e3337] hover:bg-[#202229]'
                        }`}
                      onClick={() => setConfirmDialog({
                        type: 'protection',
                        level: 'bronze',
                        days: 1,
                        price: 100
                      })}
                      disabled={claimStatus?.streakProtection >= 1}
                    >
                      <Shield className="w-4 h-4 text-amber-700" />
                      <span>Bronze</span>
                      <span className="text-[#95a1ad]">1 day</span>
                      <span className="font-medium">100 coins</span>
                    </button>

                    <button
                      className={`p-2 rounded text-xs flex flex-col items-center justify-center space-y-1 transition ${claimStatus?.streakProtection >= 3
                          ? 'bg-[#202229] text-[#95a1ad] cursor-not-allowed'
                          : 'border border-[#2e3337] hover:bg-[#202229]'
                        }`}
                      onClick={() => setConfirmDialog({
                        type: 'protection',
                        level: 'silver',
                        days: 3,
                        price: 250
                      })}
                      disabled={claimStatus?.streakProtection >= 3}
                    >
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Silver</span>
                      <span className="text-[#95a1ad]">3 days</span>
                      <span className="font-medium">250 coins</span>
                    </button>

                    <button
                      className={`p-2 rounded text-xs flex flex-col items-center justify-center space-y-1 transition ${claimStatus?.streakProtection >= 7
                          ? 'bg-[#202229] text-[#95a1ad] cursor-not-allowed'
                          : 'border border-[#2e3337] hover:bg-[#202229]'
                        }`}
                      onClick={() => setConfirmDialog({
                        type: 'protection',
                        level: 'gold',
                        days: 7,
                        price: 500
                      })}
                      disabled={claimStatus?.streakProtection >= 7}
                    >
                      <Shield className="w-4 h-4 text-yellow-400" />
                      <span>Gold</span>
                      <span className="text-[#95a1ad]">7 days</span>
                      <span className="font-medium">500 coins</span>
                    </button>
                  </div>

                  <div className="text-xs text-[#95a1ad] mt-2">
                    <p>Streak protection prevents your streak from resetting if you miss a day.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#2e3337] rounded-lg bg-transparent">
              <div className="p-4 pb-3 border-b border-[#2e3337]">
                <h3 className="font-normal text-lg">How It Works</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Gift className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#95a1ad]">Claim rewards every day to build your streak</p>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#95a1ad]">Each consecutive day increases your streak multiplier</p>
                </div>
                <div className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#95a1ad]">Reach milestone days (7, 14, 21, 28, 30) for bonus rewards</p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#95a1ad]">Purchase streak protection to prevent losing your streak if you miss a day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <h3 className="font-normal text-lg">Claim History</h3>
          </div>
          <div className="p-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
              </div>
            ) : claimHistory && claimHistory.length > 0 ? (
              <div className="space-y-3">
                {claimHistory.map((claim, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#202229] border border-[#2e3337] rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1a1c1e] border border-white/5">
                        {claim.streakMaintained ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Day {claim.streak}</span>
                          {claim.streakProtectionUsed && (
                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                              <Shield className="w-3 h-3 mr-1" /> Protected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#95a1ad]">
                          {new Date(claim.timestamp).toLocaleDateString()} at {new Date(claim.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-green-500 font-medium">+{claim.reward} coins</p>
                        <p className="text-xs text-[#95a1ad]">
                          x{claim.multiplier.toFixed(1)} multiplier
                        </p>
                      </div>
                      {claim.milestoneBonus > 0 && (
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-[#95a1ad] mx-auto mb-2" />
                <p className="text-[#95a1ad]">No claim history yet</p>
                <p className="text-sm text-[#95a1ad] mt-1">Claim your first daily reward to start building history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab Content */}
      {activeTab === 'leaderboard' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <h3 className="font-normal text-lg">Streak Leaderboard</h3>
          </div>
          <div className="p-4">
            {loadingLeaderboard ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-1">
                <div className="grid grid-cols-12 text-xs text-[#95a1ad] px-4 py-2">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">User</div>
                  <div className="col-span-3 text-center">Current Streak</div>
                  <div className="col-span-3 text-center">Longest Streak</div>
                </div>

                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-12 p-4 rounded-lg items-center ${index < 3 ? 'bg-yellow-500/5 border border-yellow-500/20' : 'bg-[#202229] border border-[#2e3337]'
                      }`}
                  >
                    <div className="col-span-1 font-bold">
                      {index === 0 ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-black">1</div>
                      ) : index === 1 ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-black">2</div>
                      ) : index === 2 ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white">3</div>
                      ) : (
                        <div className="text-center">{index + 1}</div>
                      )}
                    </div>
                    <div className="col-span-5 font-medium">{entry.username}</div>
                    <div className="col-span-3 text-center">
                      <span className="font-medium">{entry.currentStreak}</span>
                      <span className="text-xs text-[#95a1ad]"> days</span>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="font-medium">{entry.longestStreak}</span>
                      <span className="text-xs text-[#95a1ad]"> days</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-[#95a1ad] mx-auto mb-2" />
                <p className="text-[#95a1ad]">No leaderboard data yet</p>
                <p className="text-sm text-[#95a1ad] mt-1">Be the first to start a streak!</p>
              </div>
            )}
          </div>
        </div>
      )}

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
                {confirmDialog?.type === 'protection' ? 'Purchase Streak Protection' : 'Confirm Action'}
              </h2>
              <p className="text-[#95a1ad] mt-1">
                {confirmDialog?.type === 'protection'
                  ? `Are you sure you want to purchase ${confirmDialog.level} streak protection?`
                  : 'Are you sure you want to perform this action?'}
              </p>
            </div>

            {confirmDialog?.type === 'protection' && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#1a1c1e] border border-white/5 flex items-center justify-center">
                    <Shield className={`w-8 h-8 ${confirmDialog.level === 'bronze' ? 'text-amber-700' :
                        confirmDialog.level === 'silver' ? 'text-gray-400' :
                          'text-yellow-400'
                      }`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Protection Level:</span>
                    <span className="capitalize">{confirmDialog.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Duration:</span>
                    <span>{confirmDialog.days} day{confirmDialog.days !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Cost:</span>
                    <span>{confirmDialog.price} coins</span>
                  </div>
                </div>

                <div className="border-t border-[#2e3337] pt-4 mt-2">
                  <p className="text-sm text-[#95a1ad]">
                    Streak protection allows you to miss days without losing your streak. It will be automatically used if you miss a day.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 font-medium text-sm transition active:scale-95"
              >
                Cancel
              </button>
              {confirmDialog?.type === 'protection' && (
                <button
                  onClick={() => handlePurchaseProtection(confirmDialog.level)}
                  disabled={purchasingProtection}
                  className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {purchasingProtection ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Purchase Protection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
