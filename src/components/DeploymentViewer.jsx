// src/components/DeploymentViewer.jsx - Complete Deployment Dashboard
import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Download, 
  Terminal,
  Globe,
  Clock,
  Settings,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const DeploymentViewer = ({ 
  deploymentResult, 
  deploymentConfig, 
  onClose, 
  onRedeploy 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedConfig, setCopiedConfig] = useState(null);

  if (!deploymentResult) return null;

  const copyToClipboard = (text, configName) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(configName);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  const downloadConfig = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Deployment Successful!</h3>
            <p className="text-gray-300 mt-1">Your application is now live and accessible</p>
          </div>
        </div>

        {/* Deployment URL */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Live URL</p>
                <a 
                  href={deploymentResult.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 font-medium flex items-center gap-2 transition-colors"
                >
                  {deploymentResult.deploymentUrl}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(deploymentResult.deploymentUrl, 'url')}
              className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copiedConfig === 'url' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Platform</span>
          </div>
          <p className="text-lg font-bold text-white">{deploymentResult.target}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Build Time</span>
          </div>
          <p className="text-lg font-bold text-white">{deploymentResult.buildTime}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Status</span>
          </div>
          <p className="text-lg font-bold text-green-400">Live</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Deploy ID</span>
          </div>
          <p className="text-xs font-mono text-white truncate">{deploymentResult.deploymentId}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href={deploymentResult.deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Live Site
          </a>

          {onRedeploy && (
            <button
              onClick={onRedeploy}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Redeploy
            </button>
          )}

          <button
            onClick={() => setActiveTab('configs')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            View Configs
          </button>
        </div>
      </div>

      {/* Deployment Timeline */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">Deployment Timeline</h4>
        <div className="space-y-3">
          {[
            { phase: 'Preparation', time: '0:05', status: 'completed' },
            { phase: 'Build', time: '1:30', status: 'completed' },
            { phase: 'Deployment', time: '0:35', status: 'completed' },
            { phase: 'Verification', time: '0:05', status: 'completed' }
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{step.phase}</p>
              </div>
              <span className="text-xs text-gray-400">{step.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConfigs = () => (
    <div className="space-y-4">
      {Object.entries(deploymentConfig).map(([filename, content]) => {
        if (filename === 'instructions') return null;
        
        const displayContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        
        return (
          <div key={filename} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">{filename}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(displayContent, filename)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedConfig === filename ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadConfig(filename, displayContent)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {displayContent}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderInstructions = () => (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-300 mb-2">Deployment Instructions</h4>
            <p className="text-sm text-gray-300">
              Follow these steps to deploy your application to {deploymentResult.target}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="prose prose-invert max-w-none">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
            {deploymentConfig.instructions}
          </pre>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-yellow-300 mb-1">Important Notes</h5>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Make sure all environment variables are properly configured</li>
              <li>Test the deployment thoroughly before sharing the URL</li>
              <li>Keep your deployment configuration files in version control</li>
              <li>Consider setting up monitoring and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Deployment Dashboard</h1>
              <p className="text-sm text-gray-400">
                Deployed to {deploymentResult.target} at {new Date(deploymentResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'configs', label: 'Configuration Files', icon: Settings },
            { id: 'instructions', label: 'Instructions', icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'configs' && renderConfigs()}
          {activeTab === 'instructions' && renderInstructions()}
        </div>
      </div>
    </div>
  );
};

export default DeploymentViewer;