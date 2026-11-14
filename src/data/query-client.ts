import { QueryClient } from '@tanstack/react-query';

/**
 * Queries read the local SQLite database, so they never go stale on their own. Writes and
 * sync invalidate them explicitly. `networkMode: 'always'` keeps local reads running offline.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, gcTime: 5 * 60 * 1000, retry: 1, networkMode: 'always' },
    mutations: { networkMode: 'always' },
  },
});

export const queryKeys = {
  all: (userId: string) => ['user', userId] as const,
  profile: (userId: string) => ['user', userId, 'profile'] as const,
  goal: (userId: string) => ['user', userId, 'goal'] as const,
  savedTotal: (userId: string, goalId: string) => ['user', userId, 'saved', goalId] as const,
  transactions: (userId: string, month: string) => ['user', userId, 'transactions', month] as const,
  transaction: (userId: string, id: string) => ['user', userId, 'transaction', id] as const,
};

export function invalidateUser(userId: string) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.all(userId) });
}
