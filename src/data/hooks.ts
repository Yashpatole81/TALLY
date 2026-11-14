import { useQuery } from '@tanstack/react-query';

import type { MonthKey } from '@/domain/dates';
import { avatarSignedUrl } from '@/lib/avatar';

import { queryKeys } from './query-client';
import { getActiveGoal, getProfile, getTransaction, listTransactions, savedTotal } from './repositories';

/** Read hooks over the local database. Writes go through `actions.ts`, which invalidates these. */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? '-'),
    queryFn: () => getProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useActiveGoal(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.goal(userId ?? '-'),
    queryFn: () => getActiveGoal(userId!),
    enabled: Boolean(userId),
  });
}

export function useSavedTotal(userId: string | undefined, goalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.savedTotal(userId ?? '-', goalId ?? '-'),
    queryFn: () => savedTotal(userId!, goalId!),
    enabled: Boolean(userId && goalId),
  });
}

/** Transactions for one budget month, or every month when `month` is 'all'. */
export function useTransactions(userId: string | undefined, month: MonthKey | 'all') {
  return useQuery({
    queryKey: queryKeys.transactions(userId ?? '-', month),
    queryFn: () => listTransactions(userId!, month === 'all' ? {} : { month }),
    enabled: Boolean(userId),
  });
}

export function useTransaction(userId: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transaction(userId ?? '-', id ?? '-'),
    queryFn: () => getTransaction(userId!, id!),
    enabled: Boolean(userId && id),
  });
}

/** Short-lived signed URL for the private avatar (refreshed before it expires). */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['avatar', path ?? '-'],
    queryFn: () => avatarSignedUrl(path!),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}
