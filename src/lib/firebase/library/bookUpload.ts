
import { 
  collection, 
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../config";
import { libraryStorage, libraryDb } from "../libraryConfig";
import { Book, BookUploadForm } from "@/types/library";

const COLLECTION_NAME = "library_books";

// पुस्तक अपलोड करने का फंक्शन
export const uploadBook = async (bookData: BookUploadForm): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("आपको लॉगिन करना होगा");

    const bookToUpload: Partial<Book> = {
      title: bookData.title,
      author: bookData.author,
      description: bookData.description,
      category: bookData.category,
      tags: bookData.tags,
      externalLink: bookData.externalLink || "",
      uploadedBy: currentUser.uid,
      uploadedAt: serverTimestamp(),
      likes: 0,
      downloads: 0,
      isPublic: bookData.isPublic
    };

    // अगर कवर इमेज है तो अपलोड करें
    if (bookData.coverImage) {
      const coverImageRef = ref(libraryStorage, `library/covers/${Date.now()}_${bookData.coverImage.name}`);
      const coverSnapshot = await uploadBytes(coverImageRef, bookData.coverImage);
      bookToUpload.coverImageUrl = await getDownloadURL(coverSnapshot.ref);
    }

    // अगर पुस्तक फाइल है तो अपलोड करें
    if (bookData.bookFile) {
      const bookFileRef = ref(libraryStorage, `library/files/${Date.now()}_${bookData.bookFile.name}`);
      const bookSnapshot = await uploadBytes(bookFileRef, bookData.bookFile);
      bookToUpload.fileUrl = await getDownloadURL(bookSnapshot.ref);
    }

    // फायरस्टोर में पुस्तक सेव करें
    const bookRef = await addDoc(collection(libraryDb, COLLECTION_NAME), bookToUpload);
    return bookRef.id;
  } catch (error) {
    console.error("पुस्तक अपलोड में त्रुटि:", error);
    throw error;
  }
};
