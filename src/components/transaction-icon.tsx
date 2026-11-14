import {
    Briefcase,
    Gift,
    Laptop,
    PiggyBank,
    Plane,
    Receipt,
    ShoppingBag,
    ShoppingCart,
    Tag,
    Wallet,
    Zap,
} from 'lucide-react-native';
import { View } from 'react-native';

import type { Transaction } from '@/data/types';
import { colors } from '@/theme/tokens';

type IconKey =
  | 'food'
  | 'bills'
  | 'shopping'
  | 'travel'
  | 'other'
  | 'salary'
  | 'freelance'
  | 'gift'
  | 'wallet'
  | 'savings'
  | 'tag';

const ICON_PROPS = { size: 18, color: colors.icon, strokeWidth: 1.6 } as const;

/** Static icon elements, chosen by key (never creates components during render). */
function renderIcon(key: IconKey) {
  switch (key) {
    case 'food':
      return <ShoppingCart {...ICON_PROPS} />;
    case 'bills':
      return <Zap {...ICON_PROPS} />;
    case 'shopping':
      return <ShoppingBag {...ICON_PROPS} />;
    case 'travel':
      return <Plane {...ICON_PROPS} />;
    case 'other':
      return <Receipt {...ICON_PROPS} />;
    case 'salary':
      return <Briefcase {...ICON_PROPS} />;
    case 'freelance':
      return <Laptop {...ICON_PROPS} />;
    case 'gift':
      return <Gift {...ICON_PROPS} />;
    case 'savings':
      return <PiggyBank {...ICON_PROPS} />;
    case 'wallet':
      return <Wallet {...ICON_PROPS} />;
    default:
      return <Tag {...ICON_PROPS} />;
  }
}

const SOURCE_KEYS: Record<string, IconKey> = {
  salary: 'salary',
  freelance: 'freelance',
  bonus: 'gift',
  gift: 'gift',
  refund: 'other',
  other: 'wallet',
};
const CATEGORY_KEYS: Record<string, IconKey> = {
  food: 'food',
  bills: 'bills',
  shopping: 'shopping',
  travel: 'travel',
  other: 'other',
};

export function iconKeyFor(tx: Pick<Transaction, 'type' | 'kind' | 'category' | 'source'>): IconKey {
  if (tx.kind === 'salary') return 'salary';
  if (tx.type === 'savings') return 'savings';
  if (tx.type === 'income') return SOURCE_KEYS[tx.source ?? ''] ?? 'wallet';
  return CATEGORY_KEYS[tx.category ?? ''] ?? 'tag';
}

/** 36pt tile with a stroked icon (Figma transaction rows). */
export function TransactionIcon({ tx }: { tx: Pick<Transaction, 'type' | 'kind' | 'category' | 'source'> }) {
  return <View className="h-9 w-9 items-center justify-center rounded-tile bg-tile">{renderIcon(iconKeyFor(tx))}</View>;
}
