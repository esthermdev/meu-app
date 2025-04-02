// context/RequestsContext.tsx
import React, { createContext, useContext, useState } from 'react';

type RequestsContextType = {
  refreshTrigger: number;
  triggerRefresh: () => void;
};

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

export function RequestsProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <RequestsContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (context === undefined) {
    throw new Error('useRequests must be used within a RequestsProvider');
  }
  return context;
}