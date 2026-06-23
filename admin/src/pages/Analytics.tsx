import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';

const SECTOR_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#6B7280',
];

export default function Analytics() {
  const [shiftsData,  setShiftsData]  = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [sectorData,  setSectorData]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const days = 14;
      const from = subDays(new Date(), days).toISOString();

      const [{ data: shifts }, { data: txns }, { data: allShifts }] = await Promise.all([
        supabase.from('shifts').select('created_at, status').gte('created_at', from),
        supabase.from('transactions').select('created_at, net_amount, status').gte('created_at', from).eq('status', 'completed'),
        supabase.from('shifts').select('sector').not('sector', 'is', null),
      ]);

      // Build daily shift/revenue buckets
      const shiftsByDay:   Record<string, { date: string; posted: number; completed: number }> = {};
      const revenueByDay:  Record<string, { date: string; revenue: number; txns: number }>     = {};

      for (let i = days; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'MMM d');
        shiftsByDay[d]  = { date: d, posted: 0, completed: 0 };
        revenueByDay[d] = { date: d, revenue: 0, txns: 0 };
      }

      (shifts ?? []).forEach((s) => {
        const d = format(new Date(s.created_at), 'MMM d');
        if (shiftsByDay[d]) {
          shiftsByDay[d].posted++;
          if (s.status === 'completed') shiftsByDay[d].completed++;
        }
      });

      (txns ?? []).forEach((t) => {
        const d = format(new Date(t.created_at), 'MMM d');
        if (revenueByDay[d]) {
          revenueByDay[d].revenue += t.net_amount * 0.05;
          revenueByDay[d].txns++;
        }
      });

      // Sector breakdown
      const sectorCounts: Record<string, number> = {};
      (allShifts ?? []).forEach((s) => {
        if (s.sector) sectorCounts[s.sector] = (sectorCounts[s.sector] ?? 0) + 1;
      });
      const sectorArr = Object.entries(sectorCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setShiftsData(Object.values(shiftsByDay));
      setRevenueData(Object.values(revenueByDay));
      setSectorData(sectorArr);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>

      {/* Shifts chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Shifts (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={shiftsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="posted"    fill="#6366f1" name="Posted"    radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue + Sector side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Platform Revenue (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
              <Tooltip formatter={(v: number) => [`₱${v.toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} dot={false} name="Revenue (₱)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sector breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Shifts by Sector</h3>
          {sectorData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No sector data yet — add a sector when posting shifts.
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Shifts']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sectorData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600 flex-1">{s.name}</span>
                    <span className="text-xs font-semibold text-gray-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
