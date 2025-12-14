'use client';

import { useState } from 'react';

interface RewardInfo {
  epochId: number;
  balance: string;
  claimed: boolean;
  claimable: boolean;
}

export default function RewardsPage() {
  const [address, setAddress] = useState('');
  const [rewards, setRewards] = useState<RewardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const mockRewards: RewardInfo[] = [
    { epochId: 1, balance: '125.50', claimed: false, claimable: true },
    { epochId: 0, balance: '89.25', claimed: true, claimable: false },
  ];

  const connectWallet = async () => {
    // Mock connection
    setConnected(true);
    setAddress('0x1234...5678');
    setRewards(mockRewards);
  };

  const claimRewards = async (epochId: number) => {
    setLoading(true);
    // In production, call the SDK
    setTimeout(() => {
      setLoading(false);
      alert(`Claimed rewards for epoch ${epochId}!`);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Rewards</h1>
        <p className="text-slate-400">
          View and claim your XSRN protocol rewards
        </p>
      </div>

      {!connected ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">💼</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-slate-400 mb-6">
            Connect your wallet to view and claim your rewards
          </p>
          <button onClick={connectWallet} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-slate-400 text-sm">Connected Wallet</div>
                <div className="text-white font-mono">{address}</div>
              </div>
              <button className="btn-secondary text-sm">
                Disconnect
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Total Earned</div>
                <div className="text-2xl font-bold text-white">$214.75</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Claimable</div>
                <div className="text-2xl font-bold text-green-400">$125.50</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Already Claimed</div>
                <div className="text-2xl font-bold text-slate-400">$89.25</div>
              </div>
            </div>
          </div>

          {/* Rewards List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Rewards by Epoch</h2>
            
            {rewards.map((reward) => (
              <div key={reward.epochId} className="card flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    Epoch #{reward.epochId}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${reward.balance}
                  </div>
                </div>
                <div>
                  {reward.claimed ? (
                    <span className="text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                      Claimed
                    </span>
                  ) : reward.claimable ? (
                    <button 
                      onClick={() => claimRewards(reward.epochId)}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Claiming...' : 'Claim Rewards'}
                    </button>
                  ) : (
                    <span className="text-yellow-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg">
            <h3 className="text-indigo-300 font-medium mb-2">How Rewards Work</h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Rewards are calculated at the end of each 7-day epoch</li>
              <li>• Distribution is based on your contribution to payment routing</li>
              <li>• Claims require a Merkle proof (handled automatically)</li>
              <li>• Unclaimed rewards do not expire</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
