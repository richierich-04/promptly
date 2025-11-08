import React from 'react';
import { Loader, CheckCircle, AlertCircle, Sparkles, Code, FileText, TestTube, Rocket, Zap } from 'lucide-react';

const AutomatedProgressTracker = ({ currentStage, stages, error }) => {
  const stageIcons = {
    ideation: Sparkles,
    coding: Code,
    documentation: FileText,
    testing: TestTube,
    deployment: Rocket
  };

  const stageColors = {
    ideation: 'from-purple-500 to-pink-500',
    coding: 'from-blue-500 to-cyan-500',
    documentation: 'from-green-500 to-emerald-500',
    testing: 'from-yellow-500 to-orange-500',
    deployment: 'from-red-500 to-pink-500'
  };

  const getStageStatus = (stage) => {
    const currentIdx = stages.findIndex(s => s.id === currentStage);
    const stageIdx = stages.findIndex(s => s.id === stage.id);
    
    if (stage.error) return 'error';
    if (stage.completed) return 'completed';
    if (stageIdx === currentIdx) return 'active';
    if (stageIdx < currentIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090b1a] via-[#0e1130] to-[#1a093b] text-white flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Building Your Project
          </h1>
          <p className="text-gray-400 text-lg">
            AI agents are working together to create your complete application
          </p>
        </div>

        {/* Progress Stages */}
        <div className="space-y-4 mb-8">
          {stages.map((stage, idx) => {
            const Icon = stageIcons[stage.id];
            const status = getStageStatus(stage);
            const color = stageColors[stage.id];
            
            return (
              <div
                key={stage.id}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  status === 'active'
                    ? 'border-purple-500 bg-purple-500/10 scale-105'
                    : status === 'completed'
                    ? 'border-green-500/30 bg-green-500/5'
                    : status === 'error'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Stage Number & Icon */}
                  <div className="flex-shrink-0">
                    <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : status === 'error' ? (
                        <AlertCircle className="w-8 h-8 text-white" />
                      ) : status === 'active' ? (
                        <Loader className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Icon className="w-8 h-8 text-white opacity-50" />
                      )}
                      
                      {/* Stage number badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 border-2 border-white/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {stage.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {stage.description}
                    </p>
                    
                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      {status === 'completed' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                          ✓ Completed
                        </span>
                      )}
                      {status === 'active' && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                          ⚡ In Progress
                        </span>
                      )}
                      {status === 'error' && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
                          ❌ Error
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-full border border-gray-500/30">
                          ⏳ Pending
                        </span>
                      )}
                      
                      {stage.duration && status === 'completed' && (
                        <span className="text-xs text-gray-500">
                          {stage.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  {status === 'active' && stage.progress !== undefined && (
                    <div className="flex-shrink-0 w-24">
                      <div className="text-right mb-1">
                        <span className="text-sm font-bold text-white">
                          {stage.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-300`}
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {status === 'error' && stage.error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{stage.error}</p>
                  </div>
                )}

                {/* Task list for active stage */}
                {status === 'active' && stage.tasks && (
                  <div className="mt-4 space-y-2">
                    {stage.tasks.map((task, taskIdx) => (
                      <div
                        key={taskIdx}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                        )}
                        <span>{task.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-white">Overall Progress</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
              {Math.round((stages.filter(s => s.completed).length / stages.length) * 100)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${(stages.filter(s => s.completed).length / stages.length) * 100}%` }}
            >
              <div className="h-full bg-white/20 animate-pulse" />
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-3 text-center">
            {stages.filter(s => s.completed).length} of {stages.length} stages completed
          </p>
        </div>

        {/* Global error message */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-1">Error</h4>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedProgressTracker;