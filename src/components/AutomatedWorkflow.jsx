import React, { useState } from 'react';
import { Zap, Layers, Loader, CheckCircle, ArrowRight, Play } from 'lucide-react';

const AutomatedWorkflow = ({ onAutomate, onManual, loading }) => {
  const [selectedMode, setSelectedMode] = useState(null);

  const modes = [
    {
      id: 'automated',
      title: 'Full-Stack Generation',
      subtitle: 'AI Autopilot',
      description: 'Let AI handle everything - from ideation to deployment',
      icon: Zap,
      color: 'from-purple-500 to-cyan-500',
      features: [
        'Automated ideation analysis',
        'Complete code generation',
        'Comprehensive documentation',
        'Full test suite creation',
        'Deployment configuration'
      ],
      time: '~3-5 minutes',
      recommended: true
    },
    {
      id: 'manual',
      title: 'Step-by-Step Control',
      subtitle: 'Manual Mode',
      description: 'Control each agent individually for precise customization',
      icon: Layers,
      color: 'from-blue-500 to-indigo-500',
      features: [
        'Review each stage output',
        'Regenerate specific parts',
        'Fine-tune configurations',
        'Selective agent execution',
        'Maximum flexibility'
      ],
      time: 'Variable',
      recommended: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-3">
          Choose Your Workflow
        </h2>
        <p className="text-gray-400 text-lg">
          How would you like to build your project?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              disabled={loading}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10 scale-105'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mode.recommended && (
                <div className="absolute -top-3 -right-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                    Recommended
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {mode.title}
                  </h3>
                  <p className={`text-sm font-medium bg-gradient-to-r ${mode.color} bg-clip-text text-transparent`}>
                    {mode.subtitle}
                  </p>
                </div>

                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                )}
              </div>

              <p className="text-gray-300 text-sm mb-4">
                {mode.description}
              </p>

              <div className="space-y-2 mb-4">
                {mode.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-gray-500">Estimated time</span>
                <span className="text-sm font-semibold text-white">{mode.time}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            if (selectedMode === 'automated') {
              onAutomate();
            } else if (selectedMode === 'manual') {
              onManual();
            }
          }}
          disabled={!selectedMode || loading}
          className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          {loading ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Start Building</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {selectedMode === 'automated' && !loading && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-blue-400 text-sm">
              ⚡ AI will automatically run all agents and generate your complete project
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedWorkflow;