import React, { useState, useEffect } from "react";
import {
  Plus, Search, Folder, Clock, Trash2, Edit, Copy, MoreVertical,
  Grid, List, TrendingUp, Code, Loader, Star, FileText, CheckCircle, 
  AlertCircle, Sparkles, LogOut, User, Save
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getUserProjects, 
  deleteProject, 
  duplicateProject, 
  updateLastAccessed,
  getProjectStats 
} from "../services/projectService";

const Dashboard = ({ onNewProject, onOpenProject, onLogout, setViewTransitionLoading }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadStats();
    }
  }, [currentUser]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, filterStatus]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { success, projects: data, error: fetchError } = await getUserProjects(currentUser.uid);
      
      if (success) {
        setProjects(data);
      } else {
        setError(fetchError || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { success, stats: projectStats } = await getProjectStats(currentUser.uid);
      
      if (success) {
        setStats(projectStats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.ideation?.projectName?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    setActionLoading(true);
    
    try {
      const { success, error } = await deleteProject(projectToDelete.id);
      
      if (success) {
        // Remove from local state
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        setShowDeleteModal(false);
        setProjectToDelete(null);
        setSelectedProject(null);
        
        // Reload stats
        loadStats();
      } else {
        alert(`Failed to delete project: ${error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateProject = async (projectId) => {
    setActionLoading(true);
    
    try {
      const { success, projectId: newProjectId, error } = await duplicateProject(
        projectId, 
        currentUser.uid
      );
      
      if (success) {
        // Reload projects to show the duplicate
        await loadProjects();
        setSelectedProject(null);
      } else {
        alert(`Failed to duplicate project: ${error}`);
      }
    } catch (err) {
      console.error('Duplicate error:', err);
      alert('An error occurred while duplicating the project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenProject = async (project) => {
    setViewTransitionLoading(true);
    
    setTimeout(() => {
      onOpenProject(project); // This calls the parent's handler
      setViewTransitionLoading(false);
    }, 800);
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const projectDate = date instanceof Date ? date : new Date(date);
    const diffMs = now - projectDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return projectDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const statusBadge = (status) => {
    const map = {
      draft: { label: "draft", color: "text-purple-300 bg-purple-500/10 border-purple-400/30" },
      "in-progress": { label: "in progress", color: "text-blue-300 bg-blue-500/10 border-blue-400/30" },
      completed: { label: "completed", color: "text-green-300 bg-green-500/10 border-green-400/30" }
    };
    const item = map[status];
    if (!item) return null;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const getProgressFromStatus = (project) => {
    const stages = [
      project.ideation,
      project.fileStructure,
      project.documentation,
      project.testSuite,
      project.deploymentConfig
    ];
    
    const completed = stages.filter(Boolean).length;
    return Math.round((completed / stages.length) * 100);
  };
  

  const progressColor = (v) =>
    v >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
    v >= 50 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
    v >= 30 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : 
    "bg-gradient-to-r from-gray-500 to-gray-600";

  const getTechStackFromProject = (project) => {
    if (project.techStack?.frontend) {
      return project.techStack.frontend;
    }
    if (project.ideation?.techStack?.frontend) {
      return project.ideation.techStack.frontend;
    }
    return ['React'];
  };

  const countFiles = (fileStructure) => {
    if (!fileStructure) return 0;
    
    let count = 0;
    const traverse = (node) => {
      if (node.type === 'file') count++;
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(fileStructure);
    return count;
  };

  const countLines = (fileStructure) => {
    if (!fileStructure) return 0;
    
    let lines = 0;
    const traverse = (node) => {
      if (node.type === 'file' && node.content) {
        lines += node.content.split('\n').length;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(fileStructure);
    return lines;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090b1a] via-[#0e1130] to-[#1a093b] text-white relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-200px] right-[-100px] w-[400px] h-[400px] bg-purple-600/15 blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/15 blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                My Projects
              </h1>
              <p className="text-sm text-gray-400">
                Welcome back, {currentUser?.displayName || 'User'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNewProject}
              className="group px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              New Workspace
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold hover:scale-105 transition-transform shadow-lg"
              >
                {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase()}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl p-5 z-50 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white">
                      {currentUser?.displayName?.charAt(0).toUpperCase() ||
                      currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-lg">
                        {currentUser?.displayName}
                      </h2>
                      <p className="text-xs text-gray-400">
                        Member since{" "}
                        {currentUser?.metadata?.creationTime
                          ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                      <p className="text-xs text-gray-400 mb-1">Display Name</p>
                      <p className="text-white font-medium">{currentUser?.displayName}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                      <p className="text-xs text-gray-400 mb-1">Email Address</p>
                      <p className="text-white font-medium">{currentUser?.email}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                      <p className="text-xs text-gray-400 mb-1">Email Verification</p>
                      <p className={`font-medium flex items-center gap-2 ${
                        currentUser?.emailVerified ? "text-green-400" : "text-yellow-400"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          currentUser?.emailVerified ? "bg-green-400" : "bg-yellow-400"
                        }`}></span>
                        {currentUser?.emailVerified ? "Verified" : "Not Verified"}
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/10 my-4" />

                  <button
                    onClick={onLogout}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Total Projects", v: stats.totalProjects, icon: Folder, gradient: "from-purple-500 to-pink-500" },
              { label: "In Progress", v: stats.inProgressProjects, icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
              { label: "Completed", v: stats.completedProjects, icon: CheckCircle, gradient: "from-green-500 to-emerald-500" },
              { label: "Tech Stacks", v: Object.keys(stats.techStacks || {}).length, icon: Code, gradient: "from-orange-500 to-yellow-500" },
            ].map((s, i) => (
              <div key={i}
                className="group p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-400">{s.label}</span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search + View Toggle */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="flex-1 min-w-[300px] relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
            <input
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl pl-12 pr-4 py-3.5 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading your projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first project to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onNewProject}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold transition-all shadow-lg"
                >
                  Create Project
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredProjects.map(p => {
              const progress = getProgressFromStatus(p);
              const techStack = getTechStackFromProject(p);
              const filesCount = countFiles(p.fileStructure);
              const linesOfCode = countLines(p.fileStructure);
              const displayName = p.name || p.ideation?.projectName || 'Untitled Project';
              const displayDesc = p.description || p.ideation?.description || '';

              return (
                <div
                  key={p.id}
                  className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-400/40 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all cursor-pointer"
                  onClick={() => handleOpenProject(p)}
                >
                  {/* Menu Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(selectedProject === p.id ? null : p.id);
                    }}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </button>

                  {selectedProject === p.id && (
                    <div className="absolute right-4 top-12 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProject(p.id);
                        }}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/10 w-full text-left transition-colors disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4" /> Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(p);
                        }}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}

                  {/* Project Content */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-2">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{displayDesc}</p>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor(progress)} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {techStack.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-lg border border-purple-400/30 text-purple-300 bg-purple-500/10 backdrop-blur-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      {filesCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {filesCount}
                        </span>
                      )}
                      {linesOfCode > 0 && (
                        <span className="flex items-center gap-1">
                          <Code className="w-3 h-3" /> {linesOfCode.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {statusBadge(p.status)}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(p.lastAccessedAt)}
                    </span>
                    {p.status === 'completed' && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-3">Delete Project?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{projectToDelete?.name || projectToDelete?.ideation?.projectName}"? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;