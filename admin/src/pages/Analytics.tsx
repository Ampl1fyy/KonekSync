import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

const SECTOR_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#6B7280',
];

const SHIFTS_DATA = [
  { date: 'Jun 17', posted: 0, completed: 0 },
  { date: 'Jun 18', posted: 0, completed: 0 },
  { date: 'Jun 19', posted: 0, completed: 0 },
  { date: 'Jun 20', posted: 2, completed: 0 },
  { date: 'Jun 21', posted: 1, completed: 0 },
  { date: 'Jun 22', posted: 0, completed: 0 },
  { date: 'Jun 23', posted: 0, completed: 0 },
  { date: 'Jun 24', posted: 3, completed: 0 },
  { date: 'Jun 25', posted: 1, completed: 1 },
  { date: 'Jun 26', posted: 0, completed: 0 },
  { date: 'Jun 27', posted: 0, completed: 0 },
  { date: 'Jun 28', posted: 1, completed: 1 },
  { date: 'Jun 29', posted: 0, completed: 0 },
  { date: 'Jun 30', posted: 6, completed: 0 },
  { date: 'Jul 1',  posted: 0, completed: 0 },
];

const REVENUE_DATA = [
  { date: 'Jun 17', revenue: 0 },
  { date: 'Jun 18', revenue: 0 },
  { date: 'Jun 19', revenue: 0 },
  { date: 'Jun 20', revenue: 0 },
  { date: 'Jun 21', revenue: 0 },
  { date: 'Jun 22', revenue: 0 },
  { date: 'Jun 23', revenue: 0 },
  { date: 'Jun 24', revenue: 0 },
  { date: 'Jun 25', revenue: 34.50 },
  { date: 'Jun 26', revenue: 0 },
  { date: 'Jun 27', revenue: 0 },
  { date: 'Jun 28', revenue: 52.00 },
  { date: 'Jun 29', revenue: 0 },
  { date: 'Jun 30', revenue: 0 },
  { date: 'Jul 1',  revenue: 0 },
];

const SECTOR_DATA = [
  { name: 'Events',          value: 3 },
  { name: 'Food & Beverage', value: 3 },
  { name: 'Retail',          value: 2 },
  { name: 'Administrative',  value: 1 },
];

export default function Analytics() {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>

      {/* Shifts chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Shifts (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={SHIFTS_DATA}>
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
            <LineChart data={REVENUE_DATA}>
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
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={SECTOR_DATA}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {SECTOR_DATA.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Shifts']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {SECTOR_DATA.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  <span className="text-xs text-gray-600 flex-1">{s.name}</span>
                  <span className="text-xs font-semibold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
