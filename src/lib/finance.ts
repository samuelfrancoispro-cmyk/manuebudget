import type { Transaction, TransactionRecurrente } from '@/types';

export function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function expandRecurrentesPourMois(
  recurrentes: TransactionRecurrente[],
  mk: string
): TransactionRecurrente[] {
  return recurrentes.filter((r) => r.actif);
}

export function soldeCompteCourant(
  compteId: string,
  soldeInitial: number,
  transactions: Transaction[]
): number {
  return transactions
    .filter((t) => t.compteCourantId === compteId)
    .reduce((acc, t) => acc + (t.type === 'credit' ? t.montant : -t.montant), soldeInitial);
}
