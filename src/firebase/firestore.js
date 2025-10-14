// Firestore database utility functions
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
  setDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Create a document
export const createDocument = async (collectionName, data, customId = null) => {
  try {
    let docRef;
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (customId) {
      docRef = doc(db, collectionName, customId);
      await setDoc(docRef, dataWithTimestamp);
    } else {
      docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
    }
    
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Read a document by ID
export const getDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Document not found' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Update a document
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Delete a document
export const deleteDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Get all documents from a collection
export const getCollection = async (collectionName, constraints = []) => {
  try {
    const collectionRef = collection(db, collectionName);
    let q = collectionRef;
    
    if (constraints.length > 0) {
      q = query(collectionRef, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { data: documents, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Get documents with where clause
export const getDocumentsWhere = async (collectionName, field, operator, value) => {
  try {
    const q = query(collection(db, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { data: documents, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Get user's documents
export const getUserDocuments = async (collectionName, userId) => {
  return await getDocumentsWhere(collectionName, 'userId', '==', userId);
};

// Real-time listener for a collection
export const subscribeToCollection = (collectionName, callback, constraints = []) => {
  const collectionRef = collection(db, collectionName);
  let q = collectionRef;
  
  if (constraints.length > 0) {
    q = query(collectionRef, ...constraints);
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};

// Real-time listener for a document
export const subscribeToDocument = (collectionName, documentId, callback) => {
  const docRef = doc(db, collectionName, documentId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
};

// Firestore query helpers
export const createQuery = (collectionName, ...constraints) => {
  return query(collection(db, collectionName), ...constraints);
};

export { where, orderBy, limit, serverTimestamp };