import React from 'react';
import { Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500">
            <Shield size={24} />
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <h2 className="text-xl font-black text-white mb-2">Upgrade Required</h2>
        <p className="text-zinc-400 mb-8">
          To use <strong>{featureName}</strong>, please upgrade your plan.
        </p>
        <button 
          onClick={() => {
            navigate('/billing/plans');
            onClose();
          }}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all"
        >
          View Plans
        </button>
      </div>
    </div>
  );
};
