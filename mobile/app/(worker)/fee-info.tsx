/**
 * Transparent fee breakdown / "How Payouts Work" screen.
 * Accessible from the earnings tab and shift detail view.
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const PLATFORM_FEE_PCT = 5;
const EXAMPLE_RATE     = 150;
const EXAMPLE_HOURS    = 8;

export default function FeeInfoScreen() {
  const router   = useRouter();
  const { profile } = useAuthStore();
  const waiversLeft = profile?.fee_waiver_count ?? 0;

  const gross   = EXAMPLE_RATE * EXAMPLE_HOURS;
  const fee     = gross * (PLATFORM_FEE_PCT / 100);
  const net     = gross - fee;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">How Payouts Work</Text>
        <Text className="text-sm text-gray-500 mt-0.5">No hidden fees — ever.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Fee waiver banner */}
        {waiversLeft > 0 && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 flex-row items-center">
            <Text className="text-2xl mr-3">🎁</Text>
            <View className="flex-1">
              <Text className="font-semibold text-green-800">
                You have {waiversLeft} zero-fee cashout{waiversLeft !== 1 ? 's' : ''} left!
              </Text>
              <Text className="text-xs text-green-700 mt-0.5">
                Your platform fee is waived for your next {waiversLeft} payout{waiversLeft !== 1 ? 's' : ''} as a welcome gift for verifying your identity.
              </Text>
            </View>
          </View>
        )}

        {/* Platform fee card */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
          <Text className="font-semibold text-gray-800 mb-1">Platform Fee</Text>
          <Text className="text-3xl font-bold text-primary-600 mb-2">{PLATFORM_FEE_PCT}%</Text>
          <Text className="text-sm text-gray-500 leading-5">
            KonekSync charges a {PLATFORM_FEE_PCT}% service fee on each completed shift payout.
            This covers payment processing, insurance partnerships, dispute resolution, and platform maintenance.
          </Text>
        </View>

        {/* Example breakdown */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
          <Text className="font-semibold text-gray-800 mb-4">Example Breakdown</Text>
          <Text className="text-xs text-gray-400 mb-3">
            Based on ₱{EXAMPLE_RATE}/hr × {EXAMPLE_HOURS} hours
          </Text>

          <Row label="Gross Earnings"   value={`₱${gross.toFixed(2)}`}   muted={false} />
          <View className="h-px bg-gray-100 my-3" />
          <Row label={`Platform Fee (${PLATFORM_FEE_PCT}%)`} value={`−₱${fee.toFixed(2)}`} muted />
          <View className="h-px bg-gray-100 my-3" />
          <Row label="You Receive"      value={`₱${net.toFixed(2)}`}     muted={false} bold />
        </View>

        {/* Timeline */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
          <Text className="font-semibold text-gray-800 mb-4">When Will I Get Paid?</Text>
          <TimelineStep
            n="1" title="Shift Completed"
            body="Business confirms check-out. Your earnings are locked in."
          />
          <TimelineStep
            n="2" title="Business Releases Payment"
            body={'The business taps "Release Payment" — usually same day.'}
          />
          <TimelineStep
            n="3" title="Transferred to Your Wallet"
            body="Funds arrive in your GCash or Maya within minutes."
          />
        </View>

        {/* Zero-fee perk explainer */}
        <View className="bg-primary-50 rounded-2xl p-5 mb-4 border border-primary-100">
          <Text className="font-semibold text-primary-800 mb-2">🎁 Zero-Fee Welcome Perk</Text>
          <Text className="text-sm text-primary-700 leading-5">
            When you verify your identity (KYC), KonekSync waives the 5% platform fee on your
            first 3 payouts. No code needed — it's applied automatically.
          </Text>
        </View>

        {/* FAQ */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100">
          <Text className="font-semibold text-gray-800 mb-4">FAQs</Text>
          <FAQ
            q="Are there any other fees?"
            a="No. There are no withdrawal fees, subscription fees, or hidden charges."
          />
          <FAQ
            q="What if a business doesn't pay?"
            a="File a dispute. Our team reviews within 48 hours and can initiate a manual transfer if the business is at fault."
          />
          <FAQ
            q="Can I see my fee on every transaction?"
            a="Yes — the full breakdown (gross, fee, net) is shown in your Earnings tab for every transaction."
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted: boolean; bold?: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={`text-sm ${muted ? 'text-gray-500' : 'text-gray-800'}`}>{label}</Text>
      <Text className={`text-sm ${bold ? 'font-bold text-gray-900' : muted ? 'text-gray-500' : 'text-gray-800'}`}>
        {value}
      </Text>
    </View>
  );
}

function TimelineStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View className="flex-row mb-4 last:mb-0">
      <View className="w-7 h-7 rounded-full bg-primary-600 items-center justify-center mr-3 mt-0.5 shrink-0">
        <Text className="text-white text-xs font-bold">{n}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-medium text-gray-800 text-sm">{title}</Text>
        <Text className="text-xs text-gray-500 mt-0.5 leading-4">{body}</Text>
      </View>
    </View>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <View className="mb-4 last:mb-0">
      <Text className="text-sm font-medium text-gray-800 mb-1">{q}</Text>
      <Text className="text-sm text-gray-500 leading-5">{a}</Text>
    </View>
  );
}
