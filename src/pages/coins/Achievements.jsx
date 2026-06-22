import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Coins,
  Award,
  Sparkles,
  RefreshCw,
  Server,
  Gift,
  TrendingUp,
  UserPlus,
  Users
} from 'lucide-react';

export default function AchievementsPage() {
  const { data: achievements, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/achievements');
      return response.data;
    }
  });

  // Helper to map achievement keys to corresponding icons
  const getAchievementIcon = (key, unlocked) => {
    const colorClass = unlocked ? 'text-yellow-400' : 'text-[#95a1ad]';
    switch (key) {
      case 'create_server':
        return <Server className={`w-8 h-8 ${colorClass}`} />;
      case 'daily_claim':
        return <Gift className={`w-8 h-8 ${colorClass}`} />;
      case 'stake_coins':
        return <TrendingUp className={`w-8 h-8 ${colorClass}`} />;
      case 'generate_referral':
        return <UserPlus className={`w-8 h-8 ${colorClass}`} />;
      case 'claim_referral':
        return <Users className={`w-8 h-8 ${colorClass}`} />;
      default:
        return <Award className={`w-8 h-8 ${colorClass}`} />;
    }
  };

  const unlockedCount = achievements ? achievements.filter(a => a.unlocked).length : 0;
  const totalCount = achievements ? achievements.length : 0;
  const percentUnlocked = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-normal text-white">Succès & Quêtes</h2>
          <p className="text-sm text-[#95a1ad]">Accomplissez des quêtes sur le panel pour gagner des récompenses en pièces.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-[#202229] hover:bg-[#2b2e36] text-white border border-[#2e3337] rounded-md transition text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-10 h-10 text-white animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-md text-sm">
          Erreur lors du chargement des succès : {error.message || 'Erreur inconnue'}
        </div>
      ) : (
        <>
          {/* Progress Bar Card */}
          <div className="border border-[#2e3337] rounded-lg bg-[#141619] p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#202229] border border-white/10 flex items-center justify-center relative shrink-0">
              <Trophy className="w-10 h-10 text-yellow-400" />
              {percentUnlocked === 100 && (
                <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
              )}
            </div>
            <div className="space-y-2 w-full">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-white text-base">Progression globale</span>
                <span className="text-[#95a1ad] font-mono">
                  {unlockedCount} / {totalCount} ({percentUnlocked}%)
                </span>
              </div>
              <div className="w-full bg-[#202229] h-3 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentUnlocked}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#95a1ad]">
                {percentUnlocked === 100 
                  ? "Félicitations ! Vous avez débloqué tous les succès disponibles."
                  : "Chaque succès vous rapporte des pièces instantanément lors de son déblocage."}
              </p>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements?.map((ach) => (
              <div
                key={ach.id}
                className={`border rounded-lg transition-all duration-300 relative overflow-hidden group ${
                  ach.unlocked
                    ? 'border-[#2e3337] bg-[#141619]/60 hover:bg-[#141619]'
                    : 'border-[#2e3337]/50 bg-[#141619]/20 hover:border-[#2e3337] hover:bg-[#141619]/30'
                }`}
              >
                {/* Glow effect for unlocked achievements on hover */}
                {ach.unlocked && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-70"></div>
                )}

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-lg bg-[#202229] border border-white/5">
                      {getAchievementIcon(ach.key, ach.unlocked)}
                    </div>
                    <div>
                      {ach.unlocked ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Débloqué
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-[#95a1ad] bg-[#202229] px-2.5 py-1 rounded-full border border-white/5">
                          <Lock className="w-3.5 h-3.5" />
                          Verrouillé
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`font-medium text-base ${ach.unlocked ? 'text-white' : 'text-white/60'}`}>
                      {ach.name}
                    </h4>
                    <p className="text-sm text-[#95a1ad] line-clamp-2 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#2e3337]/50 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                      <Coins className="w-4 h-4" />
                      +{ach.rewardCoins} coins
                    </div>
                    {ach.unlockedAt && (
                      <span className="text-xs text-[#95a1ad] font-mono">
                        {new Date(ach.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
