import { useState } from 'react';
import { format } from 'date-fns';

const DEMO_SHIFTS = [
  { id: 's1', title: 'Cashier – SM Aura',          businesses: { name: 'Ayala Malls Events' },  time_start: '2026-07-01T08:00:00+08:00', hourly_rate: 80,  slots: 2, slots_filled: 1, role_required: 'Cashier',          status: 'open'      },
  { id: 's2', title: 'Barista – Coffee Corner',     businesses: { name: 'Ayala Malls Events' },  time_start: '2026-07-01T10:00:00+08:00', hourly_rate: 90,  slots: 1, slots_filled: 0, role_required: 'Barista',           status: 'open'      },
  { id: 's3', title: 'Food Server – Greenbelt 5',   businesses: { name: 'Greenbelt Dining Co.' }, time_start: '2026-07-01T11:00:00+08:00', hourly_rate: 75,  slots: 3, slots_filled: 1, role_required: 'Food Server',       status: 'open'      },
  { id: 's4', title: 'Promo Staff – Greenbelt',     businesses: { name: 'Greenbelt Dining Co.' }, time_start: '2026-07-01T14:00:00+08:00', hourly_rate: 85,  slots: 2, slots_filled: 0, role_required: 'Promotions Staff',  status: 'open'      },
  { id: 's5', title: 'Event Usher – BGC',           businesses: { name: 'BGC Events Inc.' },      time_start: '2026-07-01T09:00:00+08:00', hourly_rate: 95,  slots: 4, slots_filled: 2, role_required: 'Event Usher',       status: 'open'      },
  { id: 's6', title: 'Event Coordinator Asst.',     businesses: { name: 'BGC Events Inc.' },      time_start: '2026-07-01T13:00:00+08:00', hourly_rate: 110, slots: 1, slots_filled: 0, role_required: 'Coordinator Asst.', status: 'open'      },
  { id: 's7', title: 'Customer Service Rep',        businesses: { name: 'Ayala Malls Events' },  time_start: '2026-06-30T09:00:00+08:00', hourly_rate: 80,  slots: 1, slots_filled: 1, role_required: 'Customer Service',  status: 'active'    },
  { id: 's8', title: 'Cashier – Weekend Sale',      businesses: { name: 'Ayala Malls Events' },  time_start: '2026-06-28T08:00:00+08:00', hourly_rate: 80,  slots: 1, slots_filled: 1, role_required: 'Cashier',           status: 'completed' },
  { id: 's9', title: 'Food Server – Branch Launch', businesses: { name: 'Greenbelt Dining Co.' }, time_start: '2026-06-25T10:00:00+08:00', hourly_rate: 75,  slots: 2, slots_filled: 1, role_required: 'Food Server',       status: 'completed' },
];

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  filled: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function Shifts() {
  const [shifts, setShifts] = useState(DEMO_SHIFTS);
  const [statusFilter, setStatusFilter] = useState('all');

  const displayed = statusFilter === 'all' ? shifts : shifts.filter((s) => s.status === statusFilter);
  const statuses = ['all', 'open', 'filled', 'active', 'completed', 'cancelled'];

  function cancelShift(id: string) {
    if (!confirm('Cancel this shift?')) return;
    setShifts((prev) => prev.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s));
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Shifts</h2>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Shift</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pay/hr</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slots</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No shifts found.</td></tr>
            ) : displayed.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{s.title}</div>
                  <div className="text-xs text-gray-400">{s.role_required}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.businesses?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {format(new Date(s.time_start), 'MMM d, h:mm a')}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">₱{s.hourly_rate}</td>
                <td className="px-4 py-3 text-gray-600">{s.slots_filled}/{s.slots}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.status === 'open' && (
                    <button onClick={() => cancelShift(s.id)} className="text-xs text-red-500 hover:underline font-medium">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
