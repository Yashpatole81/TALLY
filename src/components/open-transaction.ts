import { router } from 'expo-router';

import type { Transaction } from '@/data/types';

/** Savings rows open the goal; expenses and income open the edit sheet. */
export function openTransaction(tx: Transaction) {
  if (tx.type === 'savings') router.push('/edit-goal');
  else router.push({ pathname: '/add-transaction', params: { id: tx.id, type: tx.type } });
}
