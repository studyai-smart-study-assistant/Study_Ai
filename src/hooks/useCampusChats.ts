import { useCampusUsers } from './useCampusUsers';

export const useCampusChats = (searchQuery: string) => {
  const { users, loading } = useCampusUsers(searchQuery);
  
  return { 
    chats: [], // Will be implemented when needed for chat list view
    users, 
    loading 
  };
};