'use client';

import { useState, useEffect } from 'react';

interface EpochInfo {
  id: number;
  startTime: string;
  endTime: string;
  finalized: boolean;
  totalRewards: string;
}

interface ProtocolStats {
  totalVolume: string;
  totalTransactions: number;
  activeAgents: number;
  currentEpoch: number;
}

export default function Home() {
  const [epoch, setEpoch] = useState<EpochInfo | null>(null);
  const [stats, setStats] = useState<ProtocolStats>({
    totalVolume: '0',
    totalTransactions: 0,
    activeAgents: 0,
    currentEpoch: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from API
    setLoading(false);
    setStats({
      totalVolume: '1,234,567.89',
      totalTransactions: 12345,
      activeAgents: 89,
      currentEpoch: 1,
    });
    setEpoch({
      id: 1,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      finalized: false,
      totalRewards: '0',
    });
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Protocol Overview</h1>
        <p className="text-slate-400">
          X402 Service Routing Network - Real-time protocol statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-white">
            ${stats.totalVolume}
          </div>
          <div className="text-green-400 text-sm mt-2">↑ 12.5% from last epoch</div>
        </div>

        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Transactions</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalTransactions.toLocaleString()}
          </div>
          <div className="text-green-400 text-sm mt-2">↑ 8.3% from last epoch</div>
        </div>

        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Active Agents</div>
          <div className="text-2xl font-bold text-white">
            {stats.activeAgents}
          </div>
          <div className="text-slate-400 text-sm mt-2">Participating this epoch</div>
        </div>

        <div className="card">
          <div className="text-slate-400 text-sm mb-1">Current Epoch</div>
          <div className="text-2xl font-bold text-white">
            #{stats.currentEpoch}
          </div>
          <div className="text-indigo-400 text-sm mt-2">
            {epoch ? (epoch.finalized ? 'Finalized' : 'Active') : '...'}
          </div>
        </div>
      </div>

      {/* Epoch Details */}
      {epoch && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Current Epoch Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-slate-400 text-sm">Start Time</div>
              <div className="text-white">{formatDate(epoch.startTime)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">End Time</div>
              <div className="text-white">{formatDate(epoch.endTime)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Status</div>
              <div className={epoch.finalized ? 'text-green-400' : 'text-yellow-400'}>
                {epoch.finalized ? 'Finalized' : 'In Progress'}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Epoch Progress</span>
              <span className="text-white">3 days remaining</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                style={{ width: '57%' }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/rewards" className="card hover:border-indigo-500 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Check Rewards
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                View and claim your earned rewards
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </a>

        <a href="/attestations" className="card hover:border-purple-500 transition-colors cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                Attestations
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Submit and challenge quality attestations
              </p>
            </div>
            <div className="text-3xl">🔐</div>
          </div>
        </a>
      </div>
    </div>
  );
}
