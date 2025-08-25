
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  increment
} from "firebase/firestore";
import { auth } from "../config";
import { libraryDb } from "../libraryConfig";
import { getBookById } from "./bookQuery";

const COLLECTION_NAME = "library_books";

// पुस्तक को लाइक करें
export const likeBook = async (bookId: string): Promise<void> => {
  try {
    const bookRef = doc(libraryDb, COLLECTION_NAME, bookId);
    await updateDoc(bookRef, {
      likes: increment(1)
    });
  } catch (error) {
    console.error("पुस्तक लाइक करने में त्रुटि:", error);
    throw error;
  }
};

// पुस्तक डाउनलोड काउंट बढ़ाएं
export const incrementDownload = async (bookId: string): Promise<void> => {
  try {
    const bookRef = doc(libraryDb, COLLECTION_NAME, bookId);
    await updateDoc(bookRef, {
      downloads: increment(1)
    });
  } catch (error) {
    console.error("डाउनलोड काउंट बढ़ाने में त्रुटि:", error);
    throw error;
  }
};

// पुस्तक हटाएं
export const deleteBook = async (bookId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("आपको लॉगिन करना होगा");
    
    // पहले जांचें कि क्या यह पुस्तक वर्तमान उपयोगकर्ता की है
    const bookData = await getBookById(bookId);
    if (bookData.uploadedBy !== currentUser.uid) {
      throw new Error("आप इस पुस्तक को हटाने के अधिकृत नहीं हैं");
    }
    
    await deleteDoc(doc(libraryDb, COLLECTION_NAME, bookId));
  } catch (error) {
    console.error("पुस्तक हटाने में त्रुटि:", error);
    throw error;
  }
};
