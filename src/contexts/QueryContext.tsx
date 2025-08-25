
import React, { createContext, useContext } from 'react';

interface QueryContextType {
  // This can be empty for now or add any query-related functionality later
}

const QueryContext = createContext<QueryContextType>({});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryContext.Provider value={{}}>
      {children}
    </QueryContext.Provider>
  );
};

export const useQuery = () => {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
};
