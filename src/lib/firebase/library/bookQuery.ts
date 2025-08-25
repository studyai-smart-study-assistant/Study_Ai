
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
} from "firebase/firestore";
import { auth } from "../config";
import { libraryDb } from "../libraryConfig";
import { Book } from "@/types/library";

const COLLECTION_NAME = "library_books";

// सभी सार्वजनिक पुस्तकें प्राप्त करें
export const getPublicBooks = async (): Promise<Book[]> => {
  try {
    const q = query(
      collection(libraryDb, COLLECTION_NAME), 
      where("isPublic", "==", true),
      orderBy("uploadedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
  } catch (error) {
    console.error("पुस्तकें लोड करने में त्रुटि:", error);
    throw error;
  }
};

// श्रेणी के अनुसार पुस्तकें प्राप्त करें
export const getBooksByCategory = async (category: string): Promise<Book[]> => {
  try {
    const q = query(
      collection(libraryDb, COLLECTION_NAME),
      where("category", "==", category),
      where("isPublic", "==", true),
      orderBy("uploadedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
  } catch (error) {
    console.error("श्रेणी पुस्तकें लोड करने में त्रुटि:", error);
    throw error;
  }
};

// उपयोगकर्ता की अपलोड की गई पुस्तकें प्राप्त करें
export const getUserBooks = async (userId?: string): Promise<Book[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser && !userId) throw new Error("उपयोगकर्ता लॉगिन नहीं है");
    
    const uid = userId || currentUser?.uid;
    
    const q = query(
      collection(libraryDb, COLLECTION_NAME),
      where("uploadedBy", "==", uid),
      orderBy("uploadedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
  } catch (error) {
    console.error("उपयोगकर्ता की पुस्तकें लोड करने में त्रुटि:", error);
    throw error;
  }
};

// विशिष्ट पुस्तक की जानकारी प्राप्त करें
export const getBookById = async (bookId: string): Promise<Book> => {
  try {
    const bookDoc = await getDoc(doc(libraryDb, COLLECTION_NAME, bookId));
    
    if (!bookDoc.exists()) {
      throw new Error("पुस्तक नहीं मिली");
    }
    
    return {
      id: bookDoc.id,
      ...bookDoc.data()
    } as Book;
  } catch (error) {
    console.error("पुस्तक लोड करने में त्रुटि:", error);
    throw error;
  }
};

// लोकप्रिय पुस्तकें प्राप्त करें
export const getPopularBooks = async (limitCount = 10): Promise<Book[]> => {
  try {
    const q = query(
      collection(libraryDb, COLLECTION_NAME),
      where("isPublic", "==", true),
      orderBy("likes", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Book[];
  } catch (error) {
    console.error("लोकप्रिय पुस्तकें लोड करने में त्रुटि:", error);
    throw error;
  }
};
