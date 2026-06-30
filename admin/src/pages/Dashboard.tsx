import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalWorkers: number;
  totalBusinesses: number;
  openShifts: number;
  completedShifts: number;
  openDisputes: number;
  totalTransactions: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Demo data for presentation
    setStats({
      totalUsers: 8,
      totalWorkers: 4,
      totalBusinesses: 3,
      openShifts: 6,
      completedShifts: 2,
      openDisputes: 1,
      totalTransactions: 2,
      totalRevenue: 86.50, // 5% platform fee on ₱1,730 total paid out
    });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers ?? '–'} icon="👥" color="bg-blue-50 text-blue-600" />
        <StatCard label="Workers" value={stats?.totalWorkers ?? '–'} icon="👷" color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Businesses" value={stats?.totalBusinesses ?? '–'} icon="🏢" color="bg-purple-50 text-purple-600" />
        <StatCard label="Open Shifts" value={stats?.openShifts ?? '–'} icon="📋" color="bg-green-50 text-green-600" />
        <StatCard label="Completed Shifts" value={stats?.completedShifts ?? '–'} icon="✅" color="bg-teal-50 text-teal-600" />
        <StatCard label="Open Disputes" value={stats?.openDisputes ?? '–'} icon="⚖️" color="bg-red-50 text-red-600" />
        <StatCard label="Transactions" value={stats?.totalTransactions ?? '–'} icon="💸" color="bg-yellow-50 text-yellow-600" />
        <StatCard
          label="Platform Revenue"
          value={stats ? `₱${stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '–'}
          icon="💰"
          color="bg-emerald-50 text-emerald-600"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg mb-3 ${color.split(' ')[0]}`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
