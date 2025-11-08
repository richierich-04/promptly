// src/components/DeploymentModal.jsx - Deployment Progress & Target Selection
import React, { useState } from 'react';
import { Rocket, CheckCircle, AlertCircle, Loader, ExternalLink, Info } from 'lucide-react';
import { DEPLOYMENT_TARGETS } from '../hooks/useDeploymentAgent';

export const DeploymentProgressModal = ({ isOpen, onClose, progress }) => {
  if (!isOpen) return null;

  const getPhaseColor = (phase) => {
    const colors = {
      'Preparing': 'from-blue-500 to-cyan-500',
      'Building': 'from-purple-500 to-pink-500',
      'Deploying': 'from-green-500 to-emerald-500',
      'Verifying': 'from-yellow-500 to-orange-500',
      'Complete': 'from-green-500 to-emerald-500',
      'Error': 'from-red-500 to-red-700'
    };
    return colors[phase] || 'from-gray-500 to-gray-700';
  };

  const getPhaseIcon = (phase) => {
    const icons = {
      'Preparing': '📦',
      'Building': '🔨',
      'Deploying': '🚀',
      'Verifying': '✅',
      'Complete': '🎉',
      'Error': '❌'
    };
    return icons[phase] || '⚙️';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-xl w-full mx-4 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 animate-bounce">
            {getPhaseIcon(progress.phase)}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {progress.percentage === 100 ? '🎉 Deployment Complete!' : 'Deploying Your Application'}
          </h2>
          <p className="text-gray-400">
            {progress.percentage === 100 
              ? 'Your application is now live and ready to use'
              : 'Building and deploying your code to production...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300 font-semibold">{progress.phase}</span>
            <span className={`font-bold bg-gradient-to-r ${getPhaseColor(progress.phase)} bg-clip-text text-transparent`}>
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className={`h-full bg-gradient-to-r ${getPhaseColor(progress.phase)} transition-all duration-500 ease-out relative`}
              style={{ width: `${progress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current Task */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
          <div className="flex items-start gap-3">
            <div className="text-2xl animate-spin">⚙️</div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Current Task</p>
              <p className="text-white font-medium">{progress.currentTask}</p>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        {progress.completedTasks.length > 0 && (
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30 max-h-32 overflow-y-auto mb-4">
            <p className="text-sm text-green-400 font-semibold mb-2">✓ Completed</p>
            <div className="space-y-1">
              {progress.completedTasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-300 animate-slide-in">
                  <span className="text-green-400">✓</span>
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs */}
        {progress.logs && progress.logs.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 max-h-32 overflow-y-auto mb-4 font-mono text-xs">
            {progress.logs.map((log, idx) => (
              <div key={idx} className={`${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 
                'text-gray-300'
              }`}>
                {log.message}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          disabled={progress.percentage < 100}
          className={`w-full px-6 py-3 rounded-xl font-semibold transition-all transform ${
            progress.percentage < 100
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 shadow-lg shadow-green-500/50'
          }`}
        >
          {progress.percentage < 100 ? 'Deploying...' : 'View Deployment Dashboard'}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in {
          from { 
            opacity: 0; 
            transform: translateX(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Deployment Target Selection Modal
export const DeploymentTargetModal = ({ isOpen, onClose, onSelect }) => {
  const [selectedTarget, setSelectedTarget] = useState(null);

  if (!isOpen) return null;

  const handleDeploy = () => {
    if (selectedTarget) {
      onSelect(selectedTarget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full mx-4 border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-white mb-2">Choose Deployment Platform</h2>
          <p className="text-gray-400">Select where you want to deploy your application</p>
        </div>

        {/* Deployment Targets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {DEPLOYMENT_TARGETS.map(target => (
            <button
              key={target.id}
              onClick={() => setSelectedTarget(target)}
              className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                selectedTarget?.id === target.id
                  ? 'border-purple-500 bg-purple-500/10 scale-105'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              {/* Recommended Badge */}
              {target.recommended && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                    Recommended
                  </span>
                </div>
              )}

              {/* Icon & Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{target.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{target.name}</h3>
                  <span className={`text-xs font-medium ${
                    target.difficulty === 'Easy' ? 'text-green-400' :
                    target.difficulty === 'Intermediate' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {target.difficulty}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-4">{target.description}</p>

              {/* Features */}
              <div className="space-y-1">
                {target.features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Selection Indicator */}
              {selectedTarget?.id === target.id && (
                <div className="absolute top-3 left-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-1">Getting Started</h4>
              <p className="text-sm text-gray-300">
                After deployment, you'll receive configuration files and step-by-step instructions 
                for your chosen platform. We'll generate everything you need to get your app live.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeploy}
            disabled={!selectedTarget}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Rocket className="w-5 h-5" />
            Deploy to {selectedTarget?.name || 'Platform'}
          </button>
        </div>
      </div>
    </div>
  );
};