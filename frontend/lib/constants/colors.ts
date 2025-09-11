export const SEMANTIC_COLORS = {
  discount: {
    500: '#2563EB',
    600: '#1D4ED8',
  },
  user: {
    500: '#2563EB',
    600: '#1D4ED8',
  },
  gift: {
    500: '#10B981',
    600: '#059669',
  },
  partnership: {
    500: '#3B82F6',
    600: '#2563EB',
  },
  default: {
    500: '#9CA3AF',
    600: '#6B7280',
  },
} as const;

export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;