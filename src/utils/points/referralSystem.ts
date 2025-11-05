
// Referral system for earning points

import { addPointsToUser } from './core';

export const REFERRAL_REWARDS = {
  REFERRER: 250, // Points for the person who refers
  REFERRED: 200, // Points for the person who signs up
};

export interface ReferralData {
  referrerId: string;
  referredId: string;
  timestamp: string;
  rewardClaimed: boolean;
}

export async function generateReferralCode(userId: string): Promise<string> {
  // Generate a unique referral code based on user ID
  const code = `REF${userId.substring(0, 8).toUpperCase()}`;
  
  // Store referral code
  localStorage.setItem(`${userId}_referral_code`, code);
  
  return code;
}

export function getReferralCode(userId: string): string | null {
  return localStorage.getItem(`${userId}_referral_code`);
}

export async function applyReferralCode(
  referredUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  if (!referredUserId || !referralCode) {
    return { success: false, message: 'Invalid parameters' };
  }

  // Check if user has already used a referral code
  const hasUsedReferral = localStorage.getItem(`${referredUserId}_used_referral`);
  if (hasUsedReferral) {
    return { success: false, message: 'आप पहले ही एक रेफरल कोड का उपयोग कर चुके हैं' };
  }

  // Find the referrer by searching for the referral code
  const referrerId = await findUserByReferralCode(referralCode);
  
  if (!referrerId) {
    return { success: false, message: 'अमान्य रेफरल कोड' };
  }

  if (referrerId === referredUserId) {
    return { success: false, message: 'आप अपना रेफरल कोड उपयोग नहीं कर सकते' };
  }

  try {
    // Award points to referrer
    await addPointsToUser(
      referrerId,
      REFERRAL_REWARDS.REFERRER,
      'achievement',
      `रेफरल बोनस - ${REFERRAL_REWARDS.REFERRER} पॉइंट्स!`
    );

    // Award points to referred user
    await addPointsToUser(
      referredUserId,
      REFERRAL_REWARDS.REFERRED,
      'achievement',
      `रेफरल से जुड़ने का बोनस - ${REFERRAL_REWARDS.REFERRED} पॉइंट्स!`
    );

    // Mark as used
    localStorage.setItem(`${referredUserId}_used_referral`, 'true');

    // Log referral
    logReferral({
      referrerId,
      referredId: referredUserId,
      timestamp: new Date().toISOString(),
      rewardClaimed: true
    });

    return {
      success: true,
      message: `बधाई हो! आपको ${REFERRAL_REWARDS.REFERRED} पॉइंट्स मिले!`
    };
  } catch (error) {
    console.error('Error applying referral code:', error);
    return { success: false, message: 'रेफरल कोड लागू करने में त्रुटि' };
  }
}

async function findUserByReferralCode(referralCode: string): Promise<string | null> {
  // In a real implementation, this would query the database
  // For now, we'll extract the user ID from the referral code
  if (!referralCode.startsWith('REF')) return null;
  
  const userId = referralCode.substring(3).toLowerCase();
  
  // Verify this is a valid user (in localStorage)
  const userPoints = localStorage.getItem(`${userId}_points`);
  if (userPoints !== null) {
    return userId;
  }
  
  return null;
}

function logReferral(referral: ReferralData): void {
  const allReferrals = getAllReferrals();
  allReferrals.push(referral);
  localStorage.setItem('all_referrals', JSON.stringify(allReferrals));
  
  // Also log for individual users
  const referrerReferrals = getUserReferrals(referral.referrerId);
  referrerReferrals.push({
    userId: referral.referredId,
    timestamp: referral.timestamp,
    reward: REFERRAL_REWARDS.REFERRER
  });
  localStorage.setItem(`${referral.referrerId}_referrals`, JSON.stringify(referrerReferrals));
}

function getAllReferrals(): ReferralData[] {
  const saved = localStorage.getItem('all_referrals');
  return saved ? JSON.parse(saved) : [];
}

export function getUserReferrals(userId: string): any[] {
  const saved = localStorage.getItem(`${userId}_referrals`);
  return saved ? JSON.parse(saved) : [];
}

export function getTotalReferrals(userId: string): number {
  return getUserReferrals(userId).length;
}
