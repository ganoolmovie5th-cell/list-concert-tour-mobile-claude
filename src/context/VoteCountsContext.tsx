// ponytail: logic merged into AppContext. Shim preserves import paths for consumers.
import React from 'react';
import { useApp } from './AppContext';

export function VoteCountsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useVoteCountsCtx = () => {
  const { counts, voteCountsLoading: loading, getCount, fetchAll } = useApp();
  return { counts, loading, getCount, fetchAll };
};
