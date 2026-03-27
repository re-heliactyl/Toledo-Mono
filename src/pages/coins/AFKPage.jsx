import React, { useEffect, useState } from 'react';
import { Coins, Clock, History, AlertCircle } from 'lucide-react';

export default function AFKPage() {
  const [connected, setConnected] = useState(false);
  const [nextReward, setNextReward] = useState(60000);
  const [coinsPerMinute, setCoinsPerMinute] = useState(1.5);
  const [totalEarned, setTotalEarned] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const ws = new WebSocket('/ws');

    ws.onopen = () => {
      setConnected(true);
      setError('');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'afk_state') {
        setNextReward(data.nextRewardIn);
        setCoinsPerMinute(data.coinsPerMinute);
        setTotalEarned(prev => prev + (data.nextRewardIn === 0 ? data.coinsPerMinute : 0));
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      if (event.code === 4001) {
        setError('You must be logged in to earn AFK rewards');
      } else if (event.code === 4002) {
        setError('AFK rewards are already running in another tab');
      } else {
        setError('Connection lost. Please refresh the page.');
      }
    };

    // Track session time
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Earn coins (AFK page)</h1>
          <p className="text-[#95a1ad]">Earn coins passively by keeping this page open</p>
        </div>
        <div className={`py-1 px-4 text-xs rounded-md ${connected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {connected ? 'Connected' : 'Connection failure'}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 p-3 flex items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <Coins className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Earnings Rate</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-semibold">
              {coinsPerMinute.toFixed(1)} coins/min
            </div>
          </div>
        </div>

        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
                <Clock className="w-4 h-4 text-[#95a1ad]" />
              </div>
              <h3 className="font-normal text-sm">Session Time</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-semibold">
              {formatTime(sessionTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-[#2e3337] rounded-lg bg-transparent">
        <div className="p-4 pb-3 border-b border-[#2e3337]">
          <h3 className="font-normal text-sm">Next Reward</h3>
        </div>
        <div className="px-4 py-3">
          <div className="h-2 bg-[#202229] rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-300 rounded-full"
              style={{ width: `${((60000 - nextReward) / 60000) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <p className="text-xs text-[#95a1ad]">
            Next reward in {Math.ceil(nextReward / 1000)} seconds
          </p>
        </div>
      </div>

      <div className="border border-[#2e3337] rounded-lg bg-transparent">
        <div className="p-4 pb-3 border-b border-[#2e3337]">
          <h3 className="font-normal text-lg">How it works</h3>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-[#95a1ad]">
            Earn coins automatically just by keeping this page open! You'll receive {coinsPerMinute} coins every minute.
          </p>
          <p className="text-sm text-[#95a1ad]">
            You can use the coins to purchase resources and upgrades in the store.
          </p>
        </div>
      </div>
    </div>
  );
}