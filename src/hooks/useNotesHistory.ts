import { useState, useEffect } from 'react';
import { getItem, setItem } from '@/lib/chat/db-init';

export interface SavedNote {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  class: string;
  language: string;
  content: string;
  keyPoints: string[];
  timestamp: number;
}

const NOTES_STORAGE_KEY = 'generated-notes-history';

export const useNotesHistory = () => {
  const [notes, setNotes] = useState<SavedNote[]>([]);

  const loadHistory = () => {
    try {
      const savedNotes = getItem(NOTES_STORAGE_KEY) || [];
      setNotes(savedNotes.sort((a: SavedNote, b: SavedNote) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading notes history:', error);
    }
  };

  const saveNote = (note: Omit<SavedNote, 'id' | 'timestamp'>) => {
    try {
      const newNote: SavedNote = {
        ...note,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      
      const savedNotes = getItem(NOTES_STORAGE_KEY) || [];
      const updatedNotes = [newNote, ...savedNotes];
      setItem(NOTES_STORAGE_KEY, updatedNotes);
      setNotes(updatedNotes);
      
      return newNote.id;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  const deleteNote = (noteId: string) => {
    try {
      const savedNotes = getItem(NOTES_STORAGE_KEY) || [];
      const updatedNotes = savedNotes.filter((note: SavedNote) => note.id !== noteId);
      setItem(NOTES_STORAGE_KEY, updatedNotes);
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const getNote = (noteId: string): SavedNote | null => {
    const savedNotes = getItem(NOTES_STORAGE_KEY) || [];
    return savedNotes.find((note: SavedNote) => note.id === noteId) || null;
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return {
    notes,
    saveNote,
    deleteNote,
    getNote,
    loadHistory,
  };
};
