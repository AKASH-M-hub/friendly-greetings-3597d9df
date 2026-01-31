import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LedgerEntry {
  id: string;
  transaction_id: string | null;
  user_id: string;
  entry_type: 'credit_earned' | 'credit_spent' | 'credit_adjustment' | 'credit_rollback' | 'credit_dispute_hold' | 'credit_dispute_release';
  amount: number;
  balance_after: number;
  session_id: string | null;
  partner_user_id: string | null;
  role: 'teacher' | 'learner' | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreditBalance {
  current_balance: number;
  total_earned: number;
  total_spent: number;
  held_credits: number;
}

export interface SessionTransaction {
  id: string;
  session_id: string;
  teacher_id: string;
  learner_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back' | 'disputed';
  duration_minutes: number;
  credits_amount: number;
  teacher_confirmed: boolean;
  learner_confirmed: boolean;
  teacher_confirmed_at: string | null;
  learner_confirmed_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useCreditLedger() {
  const { user } = useAuth();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<CreditBalance>({
    current_balance: 0,
    total_earned: 0,
    total_spent: 0,
    held_credits: 0,
  });
  const [pendingTransactions, setPendingTransactions] = useState<SessionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch ledger entries
      const { data: entries, error: entriesError } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (entriesError) throw entriesError;
      const typedEntries = (entries || []) as unknown as LedgerEntry[];
      setLedgerEntries(typedEntries);

      // Fetch or calculate balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_credit_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

      if (balanceData) {
        setBalance({
          current_balance: balanceData.current_balance,
          total_earned: balanceData.total_earned,
          total_spent: balanceData.total_spent,
          held_credits: balanceData.held_credits,
        });
      } else {
        // Calculate from ledger entries
        const earned = typedEntries
          .filter(e => e.entry_type === 'credit_earned')
          .reduce((sum, e) => sum + e.amount, 0);
        const spent = typedEntries
          .filter(e => e.entry_type === 'credit_spent')
          .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const held = typedEntries
          .filter(e => e.entry_type === 'credit_dispute_hold')
          .reduce((sum, e) => sum + Math.abs(e.amount), 0);

        setBalance({
          current_balance: earned - spent,
          total_earned: earned,
          total_spent: spent,
          held_credits: held,
        });
      }

      // Fetch pending transactions
      const { data: transactions, error: txError } = await supabase
        .from('session_transactions')
        .select('*')
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setPendingTransactions((transactions as SessionTransaction[]) || []);

    } catch (err) {
      console.error('Error fetching ledger:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('credit_ledger_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_ledger',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchLedger();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_transactions',
        },
        () => {
          fetchLedger();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLedger]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Add credit to ledger (teaching)
  const addCredit = useCallback(async (
    sessionId: string,
    amount: number,
    partnerUserId: string,
    description: string
  ) => {
    if (!user) return null;

    const currentBalance = balance.current_balance + amount;

    const { data, error } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: user.id,
        entry_type: 'credit_earned',
        amount,
        balance_after: currentBalance,
        session_id: sessionId,
        partner_user_id: partnerUserId,
        role: 'teacher',
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding credit:', error);
      return null;
    }

    await fetchLedger();
    return data;
  }, [user, balance, fetchLedger]);

  // Spend credit (learning)
  const spendCredit = useCallback(async (
    sessionId: string,
    amount: number,
    partnerUserId: string,
    description: string
  ) => {
    if (!user) return null;

    const currentBalance = balance.current_balance - amount;

    const { data, error } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: user.id,
        entry_type: 'credit_spent',
        amount: -amount,
        balance_after: currentBalance,
        session_id: sessionId,
        partner_user_id: partnerUserId,
        role: 'learner',
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error spending credit:', error);
      return null;
    }

    await fetchLedger();
    return data;
  }, [user, balance, fetchLedger]);

  // Confirm transaction
  const confirmTransaction = useCallback(async (
    transactionId: string,
    role: 'teacher' | 'learner'
  ) => {
    if (!user) return false;

    const updateField = role === 'teacher' 
      ? { teacher_confirmed: true, teacher_confirmed_at: new Date().toISOString() }
      : { learner_confirmed: true, learner_confirmed_at: new Date().toISOString() };

    const { error } = await supabase
      .from('session_transactions')
      .update(updateField)
      .eq('id', transactionId);

    if (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }

    await fetchLedger();
    return true;
  }, [user, fetchLedger]);

  // Dispute transaction
  const disputeTransaction = useCallback(async (
    transactionId: string,
    reason: string
  ) => {
    if (!user) return false;

    const { error } = await supabase
      .from('session_transactions')
      .update({
        status: 'disputed',
        recovery_data: { dispute_reason: reason, disputed_by: user.id, disputed_at: new Date().toISOString() },
      })
      .eq('id', transactionId);

    if (error) {
      console.error('Error disputing transaction:', error);
      return false;
    }

    await fetchLedger();
    return true;
  }, [user, fetchLedger]);

  return {
    ledgerEntries,
    balance,
    pendingTransactions,
    loading,
    error,
    refetch: fetchLedger,
    addCredit,
    spendCredit,
    confirmTransaction,
    disputeTransaction,
  };
}
