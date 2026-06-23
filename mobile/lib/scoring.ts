/**
 * Applicant Match Scoring
 *
 * Produces a 0–100 score for ranking job applicants on the business side.
 * No ML model — just a weighted formula over verifiable signals.
 *
 * Weights:
 *   Reliability score (0–5)   → 40 pts max
 *   Average rating   (0–5)    → 30 pts max
 *   KYC verified               → 20 pts
 *   Base (just for showing up) → 10 pts
 *   ─────────────────────────────────────
 *   Total max                  → 100 pts
 */

import type { Profile } from '../types';

export function computeApplicantScore(profile: Profile): number {
  const reliability = ((profile.reliability_score ?? 0) / 5) * 40;
  const rating      = ((profile.average_rating ?? 0) / 5) * 30;
  const kyc         = profile.kyc_status === 'verified' ? 20 : 0;
  const base        = 10;

  return Math.round(base + reliability + rating + kyc);
}

export interface ScoreLabel {
  label: string;
  bg: string;
  text: string;
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 85) return { label: 'Top Match',  bg: 'bg-green-100',   text: 'text-green-700'   };
  if (score >= 65) return { label: 'Good Match',  bg: 'bg-blue-100',    text: 'text-blue-700'    };
  if (score >= 40) return { label: 'Fair Match',  bg: 'bg-yellow-100',  text: 'text-yellow-700'  };
  return               { label: 'New Worker',  bg: 'bg-gray-100',    text: 'text-gray-500'    };
}
