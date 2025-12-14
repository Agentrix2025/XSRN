'use client';

import { useState } from 'react';

interface Attestation {
  id: string;
  attester: string;
  targetHash: string;
  status: 'active' | 'challenged' | 'resolved';
  bondAmount: string;
  timestamp: string;
}

export default function AttestationsPage() {
  const [attestations, setAttestations] = useState<Attestation[]>([
    {
      id: '1',
      attester: '0xabcd...ef12',
      targetHash: '0x1234...5678',
      status: 'active',
      bondAmount: '0.1',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      attester: '0x5678...9abc',
      targetHash: '0xdef0...1234',
      status: 'challenged',
      bondAmount: '0.1',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newAttestation, setNewAttestation] = useState({
    targetHash: '',
    metadataUri: '',
    bondAmount: '0.1',
  });

  const submitAttestation = () => {
    // In production, call SDK
    setShowModal(false);
    alert('Attestation submitted!');
  };

  const challengeAttestation = (id: string) => {
    // In production, call SDK
    alert(`Challenge submitted for attestation ${id}!`);
  };

  const getStatusColor = (status: Attestation['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30';
      case 'challenged': return 'text-yellow-400 bg-yellow-900/30';
      case 'resolved': return 'text-slate-400 bg-slate-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Attestations</h1>
          <p className="text-slate-400">
            Submit and challenge quality attestations
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Attestation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="text-slate-400 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-400">12</div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">Challenged</div>
          <div className="text-2xl font-bold text-yellow-400">3</div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">Total Staked</div>
          <div className="text-2xl font-bold text-white">1.5 BNB</div>
        </div>
      </div>

      {/* Attestations List */}
      <div className="space-y-4">
        {attestations.map((attestation) => (
          <div key={attestation.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-mono text-sm">
                    {attestation.targetHash}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(attestation.status)}`}>
                    {attestation.status}
                  </span>
                </div>
                <div className="text-slate-400 text-sm">
                  By {attestation.attester} • {new Date(attestation.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{attestation.bondAmount} BNB</div>
                <div className="text-slate-400 text-sm">Bond</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {attestation.status === 'active' && (
                <button 
                  onClick={() => challengeAttestation(attestation.id)}
                  className="btn-secondary text-sm"
                >
                  Challenge
                </button>
              )}
              <button className="btn-secondary text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="mt-8 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
        <h3 className="text-purple-300 font-medium mb-2">How Attestations Work</h3>
        <ul className="text-slate-400 text-sm space-y-1">
          <li>• Stake a bond to submit an attestation about an agent or service</li>
          <li>• Other users can challenge if they believe the attestation is false</li>
          <li>• After the challenge period, the winner receives the bond</li>
          <li>• Valid attestations contribute to agent reputation</li>
        </ul>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">New Attestation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Target Hash</label>
                <input
                  type="text"
                  value={newAttestation.targetHash}
                  onChange={(e) => setNewAttestation({...newAttestation, targetHash: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-1">Metadata URI</label>
                <input
                  type="text"
                  value={newAttestation.metadataUri}
                  onChange={(e) => setNewAttestation({...newAttestation, metadataUri: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="ipfs://..."
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-1">Bond Amount (BNB)</label>
                <input
                  type="number"
                  value={newAttestation.bondAmount}
                  onChange={(e) => setNewAttestation({...newAttestation, bondAmount: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  step="0.01"
                  min="0.1"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={submitAttestation} className="btn-primary flex-1">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
