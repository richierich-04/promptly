// src/components/Dashboard.jsx - Complete User Dashboard
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
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserProjects, 
  deleteProject, 
  duplicateProject,
  updateLastAccessed,
  getProjectStats,
  searchProjects
} from '../services/projectService';

const Dashboard = ({ onNewProject, onOpenProject, onLogout }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'draft', 'in-progress', 'completed'
  const [stats, setStats] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load projects on mount
  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadStats();
    }
  }, [currentUser]);

  // Filter projects when search or filter changes
  useEffect(() => {
    filterProjects();
  }, [searchQuery, filterStatus, projects]);

  const loadProjects = async () => {
    setLoading(true);
    const { success, projects: userProjects, error } = await getUserProjects(currentUser.uid);
    
    if (success) {
      setProjects(userProjects);
    } else {
      console.error('Error loading projects:', error);
    }
    
    setLoading(false);
  };

  const loadStats = async () => {
    const { success, stats: projectStats } = await getProjectStats(currentUser.uid);
    if (success) {
      setStats(projectStats);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Apply search
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
    await updateLastAccessed(project.id);
    onOpenProject(project);
  };

  const handleDeleteProject = async (projectId) => {
    const { success } = await deleteProject(projectId);
    
    if (success) {
      setProjects(projects.filter(p => p.id !== projectId));
      setShowDeleteModal(false);
      setSelectedProject(null);
      loadStats(); // Refresh stats
    }
  };

  const handleDuplicateProject = async (projectId) => {
    const { success, projectId: newProjectId } = await duplicateProject(projectId, currentUser.uid);
    
    if (success) {
      loadProjects(); // Reload to show the new project
      loadStats();
    }
  };

  const getProjectColor = (status) => {
    switch (status) {
      case 'completed': return 'border-green-500/40 hover:border-green-500/70';
      case 'in-progress': return 'border-blue-500/40 hover:border-blue-500/70';
      default: return 'border-purple-500/40 hover:border-purple-500/70';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400',
      'in-progress': 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || colors.draft}`}>
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
            <div className="bg-gray-900 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Projects</span>
                <Folder className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">In Progress</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.inProgressProjects}</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Completed</span>
                <Code className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.completedProjects}</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Draft</span>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.draftProjects}</div>
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

        {/* Projects Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
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
                className={`bg-gray-900 rounded-xl border-2 ${getProjectColor(project.status)} hover:bg-gray-800 transition-all cursor-pointer group ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
                onClick={() => handleOpenProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project.id === selectedProject ? null : project.id);
                      }}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {selectedProject === project.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-10">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    {project.techStack?.frontend?.[0] && (
                      <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full">
                        {project.techStack.frontend[0]}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
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
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30">
            <h3 className="text-xl font-bold text-white mb-4">Delete Project?</h3>
            <p className="text-gray-400 mb-6">
              This action cannot be undone. The project and all its files will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProject(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(selectedProject)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;