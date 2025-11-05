// src/services/projectService.js - Complete Database Service for Projects
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp,
    onSnapshot
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  
  const PROJECTS_COLLECTION = 'projects';
  
  // Create a new project
  export const createProject = async (userId, projectData) => {
    try {
      const projectRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
        userId,
        name: projectData.name,
        description: projectData.description,
        ideation: projectData.ideation || null,
        fileStructure: projectData.fileStructure || null,
        techStack: projectData.techStack || {},
        status: 'draft', // draft, in-progress, completed
        thumbnail: projectData.thumbnail || null,
        tags: projectData.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        projectId: projectRef.id,
        error: null 
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return { 
        success: false, 
        projectId: null, 
        error: error.message 
      };
    }
  };
  
  // Get all projects for a user
  export const getUserProjects = async (userId) => {
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate()
      }));
      
      return { 
        success: true, 
        projects, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting user projects:', error);
      return { 
        success: false, 
        projects: [], 
        error: error.message 
      };
    }
  };
  
  // Get a single project by ID
  export const getProject = async (projectId) => {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          success: true, 
          project: {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastAccessedAt: data.lastAccessedAt?.toDate()
          },
          error: null 
        };
      } else {
        return { 
          success: false, 
          project: null, 
          error: 'Project not found' 
        };
      }
    } catch (error) {
      console.error('Error getting project:', error);
      return { 
        success: false, 
        project: null, 
        error: error.message 
      };
    }
  };
  
  // Update a project
  export const updateProject = async (projectId, updates) => {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        error: null 
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  // Update last accessed time
  export const updateLastAccessed = async (projectId) => {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      await updateDoc(docRef, {
        lastAccessedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        error: null 
      };
    } catch (error) {
      console.error('Error updating last accessed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  // Delete a project
  export const deleteProject = async (projectId) => {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      await deleteDoc(docRef);
      
      return { 
        success: true, 
        error: null 
      };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  // Search projects
  export const searchProjects = async (userId, searchTerm) => {
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastAccessedAt: doc.data().lastAccessedAt?.toDate()
        }))
        .filter(project => 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return { 
        success: true, 
        projects, 
        error: null 
      };
    } catch (error) {
      console.error('Error searching projects:', error);
      return { 
        success: false, 
        projects: [], 
        error: error.message 
      };
    }
  };
  
  // Get recent projects (last 5)
  export const getRecentProjects = async (userId, limitCount = 5) => {
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate()
      }));
      
      return { 
        success: true, 
        projects, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting recent projects:', error);
      return { 
        success: false, 
        projects: [], 
        error: error.message 
      };
    }
  };
  
  // Subscribe to real-time project updates
  export const subscribeToProjects = (userId, callback) => {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('lastAccessedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate()
      }));
      callback(projects);
    });
  };
  
  // Get project statistics
  export const getProjectStats = async (userId) => {
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => doc.data());
      
      const stats = {
        totalProjects: projects.length,
        draftProjects: projects.filter(p => p.status === 'draft').length,
        inProgressProjects: projects.filter(p => p.status === 'in-progress').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        techStacks: {},
        recentActivity: projects.length > 0 ? 
          Math.max(...projects.map(p => p.lastAccessedAt?.toDate?.() || new Date(0))) : 
          null
      };
      
      // Count tech stacks
      projects.forEach(project => {
        if (project.techStack?.frontend) {
          project.techStack.frontend.forEach(tech => {
            stats.techStacks[tech] = (stats.techStacks[tech] || 0) + 1;
          });
        }
      });
      
      return { 
        success: true, 
        stats, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting project stats:', error);
      return { 
        success: false, 
        stats: null, 
        error: error.message 
      };
    }
  };
  
  // Duplicate a project
  export const duplicateProject = async (projectId, userId) => {
    try {
      const { success, project, error } = await getProject(projectId);
      
      if (!success) {
        return { success: false, error };
      }
      
      // Create new project with duplicated data
      const newProjectData = {
        name: `${project.name} (Copy)`,
        description: project.description,
        ideation: project.ideation,
        fileStructure: project.fileStructure,
        techStack: project.techStack,
        status: 'draft',
        tags: project.tags
      };
      
      return await createProject(userId, newProjectData);
    } catch (error) {
      console.error('Error duplicating project:', error);
      return { 
        success: false, 
        projectId: null, 
        error: error.message 
      };
    }
  };