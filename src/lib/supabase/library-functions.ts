
import { supabase } from "@/integrations/supabase/client";
import { BookUploadForm, Book } from "@/types/library";

// Get public books
export async function getPublicBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_public', true)
    .order('uploaded_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }
  
  return (data || []).map(mapBookFromDb);
}

// Get books by category
export async function getBooksByCategory(category: string): Promise<Book[]> {
  if (!category || category === 'all') return getPublicBooks();
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_public', true)
    .eq('category', category)
    .order('uploaded_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Error fetching books by category:', error);
    return [];
  }
  
  return (data || []).map(mapBookFromDb);
}

// Get popular books (sorted by downloads + likes)
export async function getPopularBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_public', true)
    .order('downloads', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching popular books:', error);
    return [];
  }
  
  return (data || []).map(mapBookFromDb);
}

// Get user's uploaded books
export async function getUserBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('uploaded_by', userId)
    .order('uploaded_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user books:', error);
    return [];
  }
  
  return (data || []).map(mapBookFromDb);
}

// Upload book
export async function uploadBook(form: BookUploadForm, userId: string): Promise<void> {
  let coverImageUrl: string | undefined;
  let fileUrl: string | undefined;
  
  // Upload cover image if provided
  if (form.coverImage) {
    const ext = form.coverImage.name.split('.').pop();
    const coverPath = `covers/${Date.now()}.${ext}`;
    const { error: coverError } = await supabase.storage
      .from('books')
      .upload(coverPath, form.coverImage);
    
    if (!coverError) {
      const { data } = supabase.storage.from('books').getPublicUrl(coverPath);
      coverImageUrl = data.publicUrl;
    }
  }
  
  // Upload book file if provided
  if (form.bookFile) {
    const ext = form.bookFile.name.split('.').pop();
    const filePath = `files/${Date.now()}.${ext}`;
    const { error: fileError } = await supabase.storage
      .from('books')
      .upload(filePath, form.bookFile);
    
    if (!fileError) {
      const { data } = supabase.storage.from('books').getPublicUrl(filePath);
      fileUrl = data.publicUrl;
    }
  }
  
  // Insert book record
  const { error } = await supabase.from('books').insert({
    title: form.title,
    author: form.author,
    description: form.description || '',
    cover_image_url: coverImageUrl,
    file_url: fileUrl,
    external_link: form.externalLink,
    category: form.category,
    tags: form.tags || [],
    uploaded_by: userId,
    is_public: form.isPublic,
  });
  
  if (error) throw error;
}

// Like/Unlike book
export async function toggleLikeBook(bookId: string, userId: string): Promise<boolean> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('book_likes')
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .single();
  
  if (existing) {
    // Unlike
    await supabase.from('book_likes').delete().eq('id', existing.id);
    await supabase.from('books').update({ likes: supabase.rpc('decrement_likes', { row_id: bookId }) }).eq('id', bookId);
    return false;
  } else {
    // Like
    await supabase.from('book_likes').insert({ book_id: bookId, user_id: userId });
    // Increment likes count
    const { data: book } = await supabase.from('books').select('likes').eq('id', bookId).single();
    if (book) {
      await supabase.from('books').update({ likes: (book.likes || 0) + 1 }).eq('id', bookId);
    }
    return true;
  }
}

// Increment download count
export async function incrementDownload(bookId: string): Promise<void> {
  const { data: book } = await supabase.from('books').select('downloads').eq('id', bookId).single();
  if (book) {
    await supabase.from('books').update({ downloads: (book.downloads || 0) + 1 }).eq('id', bookId);
  }
}

// Check if user has liked a book
export async function hasUserLikedBook(bookId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('book_likes')
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .single();
  
  return !!data;
}

// Helper to map DB row to Book type
function mapBookFromDb(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description || '',
    coverImageUrl: row.cover_image_url,
    fileUrl: row.file_url,
    externalLink: row.external_link,
    category: row.category,
    tags: row.tags || [],
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    likes: row.likes || 0,
    downloads: row.downloads || 0,
    isPublic: row.is_public,
  };
}
