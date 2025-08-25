
import { useTeacherChatData } from './useTeacherChatData';
import { useTeacherChatEdit } from './useTeacherChatEdit';
import { useTeacherChatSelection } from './useTeacherChatSelection';
import { useTeacherChatOperations } from './useTeacherChatOperations';

export const useTeacherChats = () => {
  const {
    chats,
    setChats,
    filteredChats,
    isLoading,
    isDataLoading,
    searchTerm,
    setSearchTerm
  } = useTeacherChatData();

  const {
    editingChatId,
    editingChatTitle,
    setEditingChatTitle,
    handleEditChat,
    saveEditedChat,
    cancelEditing
  } = useTeacherChatEdit(chats, setChats);

  const {
    selectedChats,
    isBatchDeleteMode,
    toggleChatSelection,
    toggleBatchDeleteMode,
    selectAllChats,
    handleBatchDelete
  } = useTeacherChatSelection(chats, setChats);

  const {
    handleChatClick,
    handleDeleteChat,
    formatDate,
    formatTime
  } = useTeacherChatOperations(chats, setChats, isBatchDeleteMode, toggleChatSelection);

  // Wrap selectAllChats to pass the filtered chats
  const selectAllFilteredChats = () => selectAllChats(filteredChats);

  return {
    // Data and loading states
    chats: filteredChats,
    isLoading,
    isDataLoading,
    
    // Search functionality
    searchTerm,
    setSearchTerm,
    
    // Chat editing
    editingChatId,
    editingChatTitle,
    setEditingChatTitle,
    handleEditChat,
    saveEditedChat,
    cancelEditing: cancelEditing,
    
    // Chat operations
    handleChatClick,
    handleDeleteChat,
    formatDate,
    formatTime,
    
    // Batch delete functionality
    isBatchDeleteMode,
    toggleBatchDeleteMode,
    selectedChats,
    toggleChatSelection,
    handleBatchDelete,
    selectAllChats: selectAllFilteredChats
  };
};
