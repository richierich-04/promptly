import React, { useState } from 'react';
import { FileText, CheckCircle, XCircle, AlertTriangle, Play, Download, RefreshCw, Save } from 'lucide-react';

const TestingAgentViewer = ({ testResults, codeQuality, onClose, onRunTests, onSave, saving }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedTest, setSelectedTest] = useState(null);

  if (!testResults && !codeQuality) return null;

  const renderSummary = () => (
    <div className="space-y-6">
      {/* Test Coverage */}
      {testResults && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Test Coverage
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="text-3xl font-bold text-blue-400">{testResults.summary?.totalTests || 0}</div>
              <div className="text-sm text-gray-300 mt-1">Total Tests</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
              <div className="text-3xl font-bold text-green-400">{testResults.summary?.components || 0}</div>
              <div className="text-sm text-gray-300 mt-1">Components</div>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
              <div className="text-3xl font-bold text-purple-400">{testResults.summary?.utilities || 0}</div>
              <div className="text-sm text-gray-300 mt-1">Utilities</div>
            </div>
            <div className="bg-cyan-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-3xl font-bold text-cyan-400">{testResults.summary?.hooks || 0}</div>
              <div className="text-sm text-gray-300 mt-1">Custom Hooks</div>
            </div>
          </div>

          {/* Test Files List */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Generated Test Files</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(testResults.tests || {}).map(([path, test]) => (
                <button
                  key={path}
                  onClick={() => {
                    setSelectedTest(test);
                    setActiveTab('tests');
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-white">{test.name}</div>
                      <div className="text-xs text-gray-400">{path}</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-400">✓ Generated</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code Quality */}
      {codeQuality && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Code Quality Analysis
          </h3>

          {/* Quality Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Overall Quality Score</span>
              <span className="text-lg font-bold text-white">{codeQuality.metrics?.codeQuality || 0}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  (codeQuality.metrics?.codeQuality || 0) >= 80 ? 'bg-green-500' :
                  (codeQuality.metrics?.codeQuality || 0) >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${codeQuality.metrics?.codeQuality || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded p-3">
              <div className="text-sm text-gray-400">Total Files</div>
              <div className="text-2xl font-bold text-white">{codeQuality.metrics?.totalFiles || 0}</div>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <div className="text-sm text-gray-400">Lines of Code</div>
              <div className="text-2xl font-bold text-white">{codeQuality.metrics?.totalLines || 0}</div>
            </div>
          </div>

          {/* Issues */}
          {codeQuality.issues && codeQuality.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Issues Found</h4>
              {codeQuality.issues.slice(0, 5).map((issue, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded border-l-4 ${
                    issue.severity === 'error' 
                      ? 'bg-red-900/20 border-red-500' 
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{issue.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{issue.file}</div>
                      {issue.count && <div className="text-xs text-gray-500 mt-1">{issue.count} occurrence(s)</div>}
                    </div>
                  </div>
                </div>
              ))}
              {codeQuality.issues.length > 5 && (
                <button 
                  onClick={() => setActiveTab('issues')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View all {codeQuality.issues.length} issues →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTests = () => (
    <div className="space-y-4">
      {selectedTest ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedTest.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{selectedTest.path}</p>
            </div>
            <button
              onClick={() => setSelectedTest(null)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Back to List
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {selectedTest.content}
            </pre>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
              <Play className="w-4 h-4" />
              Run Test
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(testResults?.tests || {}).map(([path, test]) => (
            <div
              key={path}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => setSelectedTest(test)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{test.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">Ready</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderIssues = () => (
    <div className="space-y-3">
      {codeQuality?.issues?.map((issue, idx) => (
        <div 
          key={idx}
          className={`p-4 rounded-lg border-l-4 ${
            issue.severity === 'error' 
              ? 'bg-red-900/20 border-red-500' 
              : 'bg-yellow-900/20 border-yellow-500'
          }`}
        >
          <div className="flex items-start gap-3">
            {issue.severity === 'error' ? (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold uppercase ${
                  issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {issue.severity}
                </span>
              </div>
              <div className="text-sm font-medium text-white mb-1">{issue.message}</div>
              <div className="text-xs text-gray-400">{issue.file}</div>
              {issue.count && (
                <div className="text-xs text-gray-500 mt-2">
                  Found {issue.count} occurrence{issue.count > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Test Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">jest.config.js</h4>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {testResults?.config?.['jest.config.js'] || 'No configuration available'}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Required Dependencies</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {JSON.stringify(testResults?.config?.['package.json.additions'], null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Installation Command</h4>
            <code className="text-sm text-blue-400">
              npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
            </code>
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Testing Agent</h1>
              <p className="text-sm text-gray-400">Automated test generation and code quality analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save Button */}
            {onSave && (
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            {onRunTests && (
              <button
                onClick={onRunTests}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Run All Tests
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex gap-1">
          {[
            { id: 'summary', label: 'Summary', icon: FileText },
            { id: 'tests', label: 'Test Files', icon: CheckCircle },
            { id: 'issues', label: 'Issues', icon: AlertTriangle },
            { id: 'config', label: 'Configuration', icon: RefreshCw }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
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
          {activeTab === 'summary' && renderSummary()}
          {activeTab === 'tests' && renderTests()}
          {activeTab === 'issues' && renderIssues()}
          {activeTab === 'config' && renderConfig()}
        </div>
      </div>
    </div>
  );
};

export default TestingAgentViewer;