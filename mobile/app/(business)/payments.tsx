import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatPHP } from '../../lib/payments';
import { format } from 'date-fns';
import type { Transaction } from '../../types';

const DEMO_TRANSACTIONS: Record<string, Transaction[]> = {
  'Patricia Ayala': [
    { id: 'txn-a1', application_id: 'app-a1', worker_id: '20c148e6-d64d-4a54-a613-9199dfd55e89', business_id: 'biz-ayala', amount: 1040.00, platform_fee: 52.00, net_amount: 988.00, payment_method: 'gcash', status: 'completed', payment_reference: 'REF-20260628-MIG001', initiated_at: '2026-06-27T18:00:00+08:00', completed_at: '2026-06-28T10:00:00+08:00' },
  ],
  'Marco Villanueva': [
    { id: 'txn-g1', application_id: 'app-g1', worker_id: 'eb06b0a7-9f16-4f77-bf6e-f8c745d7a5d5', business_id: 'biz-grn', amount: 690.00, platform_fee: 34.50, net_amount: 655.50, payment_method: 'maya', status: 'completed', payment_reference: 'REF-20260625-SOF001', initiated_at: '2026-06-25T17:00:00+08:00', completed_at: '2026-06-26T09:00:00+08:00' },
  ],
  'Jose Santos': [],
};

export default function BusinessPaymentsScreen() {
  const { profile } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (!profile) return;

    supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', profile.id)
      .single()
      .then(({ data: biz }) => {
        if (!biz) {
          // Fall back to demo data
          const demo = DEMO_TRANSACTIONS[profile.full_name] ?? [];
          setTransactions(demo);
          setTotalPaid(demo.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0));
          setLoading(false);
          return;
        }
        supabase
          .from('transactions')
          .select('*')
          .eq('business_id', biz.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            const txns = data ?? [];
            if (txns.length === 0) {
              const demo = DEMO_TRANSACTIONS[profile.full_name] ?? [];
              setTransactions(demo);
              setTotalPaid(demo.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0));
            } else {
              setTransactions(txns);
              setTotalPaid(txns.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0));
            }
            setLoading(false);
          });
      });
  }, [profile]);

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3D2C8D" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Payments</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="bg-primary-600 rounded-2xl p-4 mb-5">
            <Text className="text-primary-100 text-xs mb-1">Total Paid Out</Text>
            <Text className="text-white text-2xl font-bold">{formatPHP(totalPaid)}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 flex-row justify-between items-center border border-gray-100">
            <View>
              <Text className="font-medium text-gray-800 capitalize">{item.payment_method} payout</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {format(new Date(item.initiated_at), 'MMM d, yyyy h:mm a')}
              </Text>
              {item.payment_reference && (
                <Text className="text-xs text-gray-400">Ref: {item.payment_reference}</Text>
              )}
            </View>
            <View className="items-end">
              <Text className="font-bold text-gray-800">{formatPHP(item.amount)}</Text>
              <Text className="text-xs text-gray-400">Fee: {formatPHP(item.platform_fee)}</Text>
              <StatusBadge status={item.status} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">💳</Text>
            <Text className="text-gray-500">No payments yet.</Text>
          </View>
        }
      />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'completed' ? 'text-green-600' : status === 'pending' ? 'text-yellow-600' : 'text-red-600';
  return <Text className={`text-xs capitalize mt-1 ${cls}`}>{status}</Text>;
}
