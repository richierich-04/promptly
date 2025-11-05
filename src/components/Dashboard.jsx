import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Folder, 
  Clock, 
  Trash2, 
  Edit, 
  Copy, 
  MoreVertical,
  Filter,
  Grid,
  List,
  TrendingUp,
  Code,
  Loader,
  Star,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';


// Mock Auth Context (replace with your actual auth)
const useAuth = () => ({
  currentUser: { uid: 'user123', displayName: 'John Doe', email: 'john@example.com' }
});

// Mock Project Service (replace with your actual Firestore service)
const projectService = {
  getUserProjects: async (userId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      projects: [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Full-stack online store with cart and payments',
          status: 'in-progress',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-15'),
          lastAccessedAt: new Date('2024-01-15'),
          techStack: {
            frontend: ['React', 'Tailwind CSS'],
            backend: ['Node.js', 'Express'],
            database: ['MongoDB']
          },
          thumbnail: null,
          progress: 75,
          filesCount: 24,
          linesOfCode: 3420
        },
        {
          id: '2',
          name: 'Task Manager Pro',
          description: 'Productivity app with AI suggestions',
          status: 'completed',
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-14'),
          lastAccessedAt: new Date('2024-01-14'),
          techStack: {
            frontend: ['React', 'Redux'],
            backend: ['Firebase']
          },
          progress: 100,
          filesCount: 18,
          linesOfCode: 2150
        },
        {
          id: '3',
          name: 'Portfolio Website',
          description: 'Modern portfolio with animations',
          status: 'draft',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12'),
          lastAccessedAt: new Date('2024-01-12'),
          techStack: {
            frontend: ['React', 'Framer Motion']
          },
          progress: 30,
          filesCount: 8,
          linesOfCode: 850
        },
        {
          id: '4',
          name: 'Weather Dashboard',
          description: 'Real-time weather with maps',
          status: 'in-progress',
          createdAt: new Date('2024-01-09'),
          updatedAt: new Date('2024-01-13'),
          lastAccessedAt: new Date('2024-01-13'),
          techStack: {
            frontend: ['React'],
            backend: ['OpenWeather API']
          },
          progress: 60,
          filesCount: 12,
          linesOfCode: 1540
        },
        {
          id: '5',
          name: 'Social Media App',
          description: 'Connect with friends and share moments',
          status: 'in-progress',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-11'),
          lastAccessedAt: new Date('2024-01-11'),
          techStack: {
            frontend: ['React', 'Redux'],
            backend: ['Node.js', 'Socket.io'],
            database: ['PostgreSQL']
          },
          progress: 45,
          filesCount: 32,
          linesOfCode: 4200
        },
        {
          id: '6',
          name: 'Recipe Finder',
          description: 'Discover and save delicious recipes',
          status: 'completed',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-10'),
          lastAccessedAt: new Date('2024-01-10'),
          techStack: {
            frontend: ['React'],
            backend: ['Spoonacular API']
          },
          progress: 100,
          filesCount: 15,
          linesOfCode: 1890
        }
      ]
    };
  },
  
  deleteProject: async (projectId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },
  
  duplicateProject: async (projectId, userId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, projectId: 'new-' + projectId };
  },
  
  updateLastAccessed: async (projectId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  },
  
  getProjectStats: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      stats: {
        totalProjects: 6,
        draftProjects: 1,
        inProgressProjects: 3,
        completedProjects: 2,
        totalLines: 14050,
        totalFiles: 109
      }
    };
  }
};

const Dashboard = ({ onNewProject, onOpenProject, onLogout }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load projects and stats
  useEffect(() => {
    if (currentUser) {
      loadProjects(true); // initial load
      loadStats();
    }
  }, [currentUser]);  

  // Filter projects
  useEffect(() => {
    filterProjects();
  }, [searchQuery, filterStatus, projects]);

  const loadProjects = async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
  
    const { success, projects: userProjects } = await projectService.getUserProjects(currentUser.uid);
    if (success) {
      setProjects(userProjects);
    }
  
    if (isInitial) setInitialLoading(false);
  };

  const loadStats = async () => {
    const { success, stats: projectStats } = await projectService.getProjectStats(currentUser.uid);
    if (success) {
      setStats(projectStats);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProjects(filtered);
  };

  const handleOpenProject = async (project) => {
    setActionLoading(true);
    await projectService.updateLastAccessed(project.id);
    setTimeout(() => {
      setActionLoading(false);
      onOpenProject(project);
    }, 500);
  };

  const handleDeleteProject = async (projectId) => {
    setActionLoading(true);
    const { success } = await projectService.deleteProject(projectId);
    
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setShowDeleteModal(false);
      setSelectedProject(null);
      loadStats();
    }
    setActionLoading(false);
  };
  
  const handleDuplicateProject = async (projectId) => {
    setActionLoading(true);
    const { success } = await projectService.duplicateProject(projectId, currentUser.uid);
    
    if (success) {
      await loadProjects();  // ✅ now only refresh, no flicker
      await loadStats();
    }
    setActionLoading(false);
  };
  
  const getProjectColor = (status) => {
    switch (status) {
      case 'completed': return 'border-green-500/40 hover:border-green-500/70 bg-green-500/5';
      case 'in-progress': return 'border-blue-500/40 hover:border-blue-500/70 bg-blue-500/5';
      default: return 'border-purple-500/40 hover:border-purple-500/70 bg-purple-500/5';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    
    const icons = {
      draft: <Edit className="w-3 h-3" />,
      'in-progress': <Loader className="w-3 h-3 animate-spin" />,
      completed: <CheckCircle className="w-3 h-3" />
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${colors[status] || colors.draft}`}>
        {icons[status]}
        {status.replace('-', ' ')}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                My Projects
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Welcome back, {currentUser?.displayName || 'Developer'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={onNewProject}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  {currentUser?.displayName?.charAt(0).toUpperCase() || 
                   currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Projects</span>
                <Folder className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
              <div className="text-xs text-gray-500 mt-1">{stats.totalFiles} files total</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">In Progress</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.inProgressProjects}</div>
              <div className="text-xs text-gray-500 mt-1">Active development</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Completed</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.completedProjects}</div>
              <div className="text-xs text-gray-500 mt-1">Ready to deploy</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Lines of Code</span>
                <Code className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalLines?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Total written</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Folder className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first project to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={onNewProject}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`bg-gray-900 rounded-xl border-2 ${getProjectColor(project.status)} transition-all cursor-pointer group relative overflow-hidden ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
                onClick={() => handleOpenProject(project)}
              >
                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {project.name}
                        </h3>
                        {project.progress === 100 && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(selectedProject === project.id ? null : project.id);
                        }}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {selectedProject === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProject(project.id);
                              setSelectedProject(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteModal(true);
                              setSelectedProject(project.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(project.progress)} transition-all duration-500`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tech Stack Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techStack?.frontend?.slice(0, 3).map((tech, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {project.filesCount} files
                      </span>
                      <span className="flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        {project.linesOfCode?.toLocaleString()} LOC
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  {/* Last Modified */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    {formatDate(project.lastAccessedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Project?</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              The project and all its files will be permanently deleted from your workspace.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProject(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(selectedProject)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Loading Overlay */}
      {actionLoading && !showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 border-2 border-purple-500/30">
            <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-center">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;