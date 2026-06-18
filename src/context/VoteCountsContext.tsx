/**
 * VoteCountsContext — Global context untuk going/interested counts
 * Satu fetch untuk semua 44 konser, shared ke semua ConcertCard
 */
import React, { createContext, useContext } from 'react';
import { useVoteCounts, VoteCounts } from '../hooks/useVoteCounts';

interface VoteCountsContextValue {
  counts: VoteCounts;
  loading: boolean;
  getCount: (id: string) => { going: number; interested: number };
  fetchAll: () => Promise<void>;
}

const VoteCountsContext = createContext<VoteCountsContextValue>({
  counts: {},
  loading: false,
  getCount: () => ({ going: 0, interested: 0 }),
  fetchAll: async () => {},
});

export function VoteCountsProvider({ children }: { children: React.ReactNode }) {
  const value = useVoteCounts();
  return (
    <VoteCountsContext.Provider value={value}>
      {children}
    </VoteCountsContext.Provider>
  );
}

export const useVoteCountsCtx = () => useContext(VoteCountsContext);
