// src/components/PromptView.jsx - New Enhanced Prompting Interface
import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Zap, 
  Code, 
  Palette, 
  Globe, 
  Database,
  ShoppingCart,
  Calendar,
  MessageCircle,
  Music,
  Camera,
  MapPin,
  Heart,
  BookOpen,
  Send,
  Loader,
  Wand2,
  Stars,
  Rocket,
  ArrowLeft
} from 'lucide-react';

const PromptView = ({ onGenerateIdeation, loading, error, onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showExamples, setShowExamples] = useState(true);

  const categories = [
    { 
      id: 'productivity', 
      name: 'Productivity', 
      icon: Calendar, 
      color: 'from-blue-500 to-cyan-500',
      examples: [
        'A task manager with AI-powered priority suggestions',
        'A time tracking app with analytics dashboard',
        'A note-taking app with markdown support'
      ]
    },
    { 
      id: 'ecommerce', 
      name: 'E-Commerce', 
      icon: ShoppingCart, 
      color: 'from-purple-500 to-pink-500',
      examples: [
        'An online store with cart and payment integration',
        'A product marketplace with seller dashboard',
        'A subscription box service platform'
      ]
    },
    { 
      id: 'social', 
      name: 'Social', 
      icon: MessageCircle, 
      color: 'from-green-500 to-emerald-500',
      examples: [
        'A community forum with real-time chat',
        'A social media platform for creators',
        'A photo sharing app with filters'
      ]
    },
    { 
      id: 'content', 
      name: 'Content', 
      icon: BookOpen, 
      color: 'from-orange-500 to-red-500',
      examples: [
        'A blog platform with SEO optimization',
        'A portfolio website builder',
        'A recipe sharing community'
      ]
    },
    { 
      id: 'creative', 
      name: 'Creative', 
      icon: Palette, 
      color: 'from-pink-500 to-rose-500',
      examples: [
        'A design tool with collaborative features',
        'An image editor with AI filters',
        'A music playlist curator'
      ]
    },
    { 
      id: 'fitness', 
      name: 'Health & Fitness', 
      icon: Heart, 
      color: 'from-red-500 to-pink-500',
      examples: [
        'A workout tracker with progress analytics',
        'A meal planning app with nutrition info',
        'A meditation and mindfulness app'
      ]
    },
    { 
      id: 'travel', 
      name: 'Travel', 
      icon: MapPin, 
      color: 'from-indigo-500 to-purple-500',
      examples: [
        'A trip planner with itinerary builder',
        'A travel photo journal',
        'A local experiences marketplace'
      ]
    },
    { 
      id: 'entertainment', 
      name: 'Entertainment', 
      icon: Music, 
      color: 'from-violet-500 to-purple-500',
      examples: [
        'A movie recommendation engine',
        'A podcast player with discovery',
        'A gaming leaderboard platform'
      ]
    }
  ];

  const quickPrompts = [
    { icon: Code, text: 'Build me a', category: 'productivity' },
    { icon: Sparkles, text: 'Create an app that', category: 'social' },
    { icon: Rocket, text: 'I need a platform for', category: 'ecommerce' },
    { icon: Stars, text: 'Design a tool to', category: 'creative' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerateIdeation(prompt);
    }
  };
  

  const handleExampleClick = (example) => {
    setPrompt(example);
    setShowExamples(false);
  };

  const handleQuickPromptClick = (quickPrompt) => {
    setPrompt(quickPrompt.text + ' ');
    setSelectedCategory(quickPrompt.category);
    document.getElementById('prompt-input')?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090b1a] via-[#0e1130] to-[#1a093b] text-white relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-cyan-500/20 blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-300 hover:border-purple-500/50 group"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
            <span className="text-gray-300 group-hover:text-white transition-colors">Back to Dashboard</span>
          </button>
        )}

        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-50 animate-pulse" />
              <Wand2 className="relative w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
            What Should We Build Today?
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Describe your idea in plain English, and watch AI transform it into a fully functional application
          </p>
        </div>

        {/* Quick Prompt Starters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleQuickPromptClick(qp)}
                className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-full transition-all duration-300 hover:scale-105"
              >
                <Icon className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{qp.text}</span>
              </button>
            );
          })}
        </div>

        {/* Main Prompt Input */}
        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 group-focus-within:opacity-50 transition-opacity duration-300" />
              
              <div className="relative bg-gray-900/90 backdrop-blur-xl border-2 border-gray-700 group-hover:border-purple-500/50 group-focus-within:border-purple-500 rounded-2xl transition-all duration-300">
                <textarea
                  id="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setShowExamples(false)}
                  placeholder="Describe your app idea... (e.g., 'A recipe sharing app where users can save and rate recipes')"
                  className="w-full px-6 py-6 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-lg"
                  rows="4"
                  disabled={loading}
                />
                
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>{prompt.length} / 1000 characters</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-shake">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Categories & Examples */}
        {showExamples && (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Choose a Category for Inspiration
              </h2>
              <p className="text-gray-400">Or browse examples to get started quickly</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                      isSelected 
                        ? 'bg-white/10 border-purple-500 scale-105' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 hover:scale-105'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 ${isSelected ? 'opacity-20' : ''} rounded-2xl transition-opacity`} />
                    
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-400">{category.examples.length} examples</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Example Prompts */}
            {selectedCategory && (
              <div className="animate-slide-up">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Example Prompts
                  </h3>
                  
                  <div className="grid gap-3">
                    {categories
                      .find(c => c.id === selectedCategory)
                      ?.examples.map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExampleClick(example)}
                          className="group text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xl transition-all duration-300 hover:scale-102"
                        >
                          <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 group-hover:text-yellow-400 transition-colors" />
                            <span className="text-gray-300 group-hover:text-white transition-colors">{example}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Preview */}
        {!showExamples && prompt.length === 0 && (
          <div className="max-w-4xl mx-auto mt-12 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'AI-Powered Generation',
                  description: 'Advanced AI creates complete, functional applications from your descriptions'
                },
                {
                  icon: Code,
                  title: 'Production-Ready Code',
                  description: 'Get clean, modern code with best practices and full documentation'
                },
                {
                  icon: Rocket,
                  title: 'Instant Preview',
                  description: 'See your app come to life instantly with live preview and editing'
                }
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 group">
                    <Icon className="w-10 h-10 text-purple-400 mb-4 group-hover:text-cyan-400 group-hover:scale-110 transition-all" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.3s ease-out;
        }
        
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default PromptView;