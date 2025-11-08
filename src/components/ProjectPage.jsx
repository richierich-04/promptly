import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Code, 
  FileText, 
  TestTube, 
  Rocket, 
  CheckCircle, 
  Clock, 
  Zap,
  Play,
  Loader,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Eye,
  Download
} from 'lucide-react';

const ProjectPage = ({ project, onBack, onRunAgent, onOpenEditor }) => {
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentProgress, setAgentProgress] = useState({});

  // Calculate overall project progress
  const calculateProgress = () => {
    const stages = {
      ideation: project.ideation ? 100 : 0,
      code: project.fileStructure ? 100 : 0,
      documentation: project.documentation ? 100 : 0,
      tests: project.testSuite ? 100 : 0,
      deployment: project.deploymentConfig ? 100 : 0
    };

    const totalProgress = Object.values(stages).reduce((sum, val) => sum + val, 0) / 5;
    return { stages, totalProgress };
  };

  const { stages, totalProgress } = calculateProgress();

  // Available agents with their status
  const agents = [
    {
      id: 'ideation',
      name: 'Ideation Agent',
      icon: Sparkles,
      description: 'Refine and expand your project concept',
      color: 'from-purple-500 to-pink-500',
      status: stages.ideation === 100 ? 'completed' : 'available',
      action: 'Regenerate Ideation',
      badge: stages.ideation === 100 ? 'Complete' : 'Not Started'
    },
    {
      id: 'coding',
      name: 'Coding Agent',
      icon: Code,
      description: 'Generate or improve project code',
      color: 'from-blue-500 to-cyan-500',
      status: stages.code === 100 ? 'completed' : stages.ideation === 100 ? 'available' : 'locked',
      action: stages.code === 100 ? 'Regenerate Code' : 'Generate Code',
      badge: stages.code === 100 ? 'Complete' : 'Ready',
      requires: 'Requires Ideation'
    },
    {
      id: 'documentation',
      name: 'Documentation Agent',
      icon: FileText,
      description: 'Create comprehensive project docs',
      color: 'from-green-500 to-emerald-500',
      status: stages.documentation === 100 ? 'completed' : stages.code === 100 ? 'available' : 'locked',
      action: stages.documentation === 100 ? 'Regenerate Docs' : 'Generate Documentation',
      badge: stages.documentation === 100 ? 'Complete' : 'Ready',
      requires: 'Requires Code'
    },
    {
      id: 'testing',
      name: 'Testing Agent',
      icon: TestTube,
      description: 'Generate test suite and quality reports',
      color: 'from-yellow-500 to-orange-500',
      status: stages.tests === 100 ? 'completed' : stages.code === 100 ? 'available' : 'locked',
      action: stages.tests === 100 ? 'Regenerate Tests' : 'Generate Tests',
      badge: stages.tests === 100 ? 'Complete' : 'Ready',
      requires: 'Requires Code'
    },
    {
      id: 'deployment',
      name: 'Deployment Agent',
      icon: Rocket,
      description: 'Deploy your application to production',
      color: 'from-red-500 to-pink-500',
      status: stages.deployment === 100 ? 'completed' : stages.code === 100 ? 'available' : 'locked',
      action: stages.deployment === 100 ? 'Redeploy' : 'Deploy Now',
      badge: stages.deployment === 100 ? 'Complete' : 'Ready',
      requires: 'Requires Code'
    }
  ];

  const handleRunAgent = async (agent) => {
    if (agent.status === 'locked') {
      alert(`This agent requires ${agent.requires}`);
      return;
    }

    setActiveAgent(agent.id);
    setAgentProgress({ [agent.id]: 0 });

    // Simulate progress
    const interval = setInterval(() => {
      setAgentProgress(prev => {
        const current = prev[agent.id] || 0;
        if (current >= 100) {
          clearInterval(interval);
          setActiveAgent(null);
          return prev;
        }
        return { ...prev, [agent.id]: current + 10 };
      });
    }, 300);

    // Call the actual agent function
    if (onRunAgent) {
      await onRunAgent(agent.id);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'locked') return <Clock className="w-5 h-5 text-gray-400" />;
    return <Zap className="w-5 h-5 text-yellow-400" />;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-blue-500 to-cyan-500';
    if (progress >= 30) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090b1a] via-[#0e1130] to-[#1a093b] text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-100px] right-[-50px] w-[300px] h-[300px] bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-50px] w-[300px] h-[300px] bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-cyan-500/20 blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {project.name || project.ideation?.projectName || 'Untitled Project'}
              </h1>
              <p className="text-gray-400 mt-1">
                {project.description || project.ideation?.description || 'No description'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEditor}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/70 to-cyan-500/70 hover:from-purple-500 hover:to-cyan-500 rounded-lg text-sm font-medium transition-all shadow-md shadow-purple-500/20"
          >
            <Eye className="w-5 h-5" />
            Open Editor
          </button>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Project Progress</h2>
              <p className="text-gray-400">Track your development journey</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
                {Math.round(totalProgress)}%
              </div>
              <p className="text-sm text-gray-400 mt-1">Overall Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressColor(totalProgress)} transition-all duration-500`}
                style={{ width: `${totalProgress}%` }}
              >
                <div className="h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(stages).map(([stage, progress]) => (
              <div key={stage} className="text-center">
                <div className={`w-8 h-8 mx-auto mb-1 rounded-lg flex items-center justify-center ${
                  progress === 100 ? 'bg-green-500/20 border border-green-400/30' : 'bg-white/5 border border-white/10'
                }`}>
                  {progress === 100 ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-400 capitalize">{stage}</p>
                <p className="text-sm font-semibold text-white">{progress}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Files</p>
                <p className="text-2xl font-bold text-white">{project.fileStructure ? '24' : '0'}</p>
              </div>
              <Code className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Lines of Code</p>
                <p className="text-2xl font-bold text-white">{project.fileStructure ? '1.2K' : '0'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Test Coverage</p>
                <p className="text-2xl font-bold text-white">{project.testSuite ? '85%' : '0%'}</p>
              </div>
              <TestTube className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Quality Score</p>
                <p className="text-2xl font-bold text-white">{project.codeQuality ? '87' : '0'}</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Available Agents */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            AI Agents
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isActive = activeAgent === agent.id;
              const progress = agentProgress[agent.id] || 0;

              return (
                <div
                  key={agent.id}
                  className={`relative bg-white/5 backdrop-blur-md border rounded-lg p-4 transition-all duration-200 ${
                    agent.status === 'locked' 
                      ? 'border-gray-700 opacity-60' 
                      : 'border-white/10 hover:border-white/20 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {getStatusIcon(agent.status)}
                  </div>

                  {/* Agent Icon */}
                  <div className={`w-16 h-16 mb-4 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Agent Info */}
                  <h3 className="text-xl font-bold text-white mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{agent.description}</p>

                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      agent.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                        : agent.status === 'locked'
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                    }`}>
                      {agent.badge}
                    </span>
                  </div>

                  {/* Progress Bar (if active) */}
                  {isActive && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Running...</span>
                        <span className="text-white font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className={`h-full bg-gradient-to-r ${agent.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                    {totalProgress === 100 && (
                    <div className="mt-4 bg-green-500/10 border border-green-400/30 rounded-lg p-3 text-sm text-green-300">
                        <p>✅ All modules generated successfully!</p>
                        <ul className="mt-1 space-y-0.5 text-gray-300 text-xs">
                        <li>💡 Ideation: Complete</li>
                        <li>💻 Code: Generated</li>
                        <li>📘 Docs: Ready</li>
                        <li>🧪 Tests: Passed</li>
                        <li>🚀 Deployment: Successful</li>
                        </ul>
                    </div>
                    )}


                  {/* Action Button */}
                  <button
                    onClick={() => handleRunAgent(agent)}
                    disabled={agent.status === 'locked' || isActive}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      agent.status === 'locked'
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : isActive
                        ? 'bg-gray-700 text-gray-300 cursor-wait'
                        : `bg-gradient-to-r ${agent.color} hover:scale-105 text-white shadow-lg`
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        {agent.action}
                      </>
                    )}
                  </button>

                  {/* Requirements */}
                  {agent.status === 'locked' && agent.requires && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>{agent.requires}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onOpenEditor}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Code className="w-5 h-5" />
            Open Code Editor
          </button>

          <button
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;