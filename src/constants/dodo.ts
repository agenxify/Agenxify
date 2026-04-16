
export const DODO_PLANS = {
  STARTER: {
    MONTHLY: 'pdt_0NckvQE3HywSee6JgtHXw',
    ANNUALLY: 'pdt_0NckvPi0O0zcfuDx6ZT5o'
  },
  GROWTH: {
    MONTHLY: 'pdt_0NckvOyjqE4RPKwCSpVmi',
    ANNUALLY: 'pdt_0NckvOcOHLEzMboNue6b9'
  },
  ENTERPRISE: {
    MONTHLY: 'pdt_0NckvOEbd0kSY8rTlBRYc',
    ANNUALLY: 'pdt_0NckvNTjLTWviyfugsfxG'
  }
};

export const DODO_ADDONS = {
  AI_GENERATOR_PRO: {
    MONTHLY: 'pdt_0NckvGkhLSlHe4mjTIMq1',
    ANNUALLY: 'pdt_0NckvGkhLSlHe4mjTIMq1' // Same ID provided by user
  },
  CLOUD_STORAGE: {
    MONTHLY: 'pdt_0NckvFCxageoUUR2P317X',
    ANNUALLY: 'pdt_0NckvEnLbAuQpRHJgx46F'
  },
  EXTRA_WORKSPACE: {
    MONTHLY: 'pdt_0NckvEDwBk3bglpRJ2iBN',
    ANNUALLY: 'pdt_0NckvDteMUzJNzDQ6Pghc'
  },
  EXTRA_SEATS: {
    MONTHLY: 'pdt_0NckvDBZovVigjdVS5U1e',
    ANNUALLY: 'pdt_0NckvCY1XpnaAiefT3rQH'
  },
  EMAIL_BROADCASTING: {
    MONTHLY: 'pdt_0NckvC3e8XZ67XGU7XvhK',
    ANNUALLY: 'pdt_0NckvB9I64Cs1foyJDhYy'
  },
  AI_AUTOMATION: {
    MONTHLY: 'pdt_0NckvAkhXu6acNZ39bPX9',
    ANNUALLY: 'pdt_0NckvA2eWLuZSAYp9BJa7'
  }
};

export const DODO_CREDITS = {
  STARTER_BOOST: 'pdt_0NcplIaIzEFtvIBsrPuSm',
  GROWTH_PACK: 'pdt_0NcplPOW4ftUAFciHSZ7G',
  POWER_USER: 'pdt_0NcplZqPBlqEFWxFPjlyf',
  AGENCY_SCALE: 'pdt_0NckvHhyg5xsRY3Bsz67A'
};

// Map credit product IDs to credit amounts
export const CREDIT_AMOUNTS: Record<string, number> = {
  'pdt_0NcplIaIzEFtvIBsrPuSm': 5000,   // Starter Boost (Assumption, need to check or set sensible defaults)
  'pdt_0NcplPOW4ftUAFciHSZ7G': 20000,  // Growth Pack
  'pdt_0NcplZqPBlqEFWxFPjlyf': 50000,  // Power User
  'pdt_0NckvHhyg5xsRY3Bsz67A': 150000  // Agency Scale
};

// Map Plan IDs to Plan Details
export const PLAN_DETAILS: Record<string, any> = {
  [DODO_PLANS.STARTER.MONTHLY]: { name: 'Starter Plan', cycle: 'monthly', price: 29 },
  [DODO_PLANS.STARTER.ANNUALLY]: { name: 'Starter Plan', cycle: 'annually', price: 290 },
  [DODO_PLANS.GROWTH.MONTHLY]: { name: 'Growth Plan', cycle: 'monthly', price: 79 },
  [DODO_PLANS.GROWTH.ANNUALLY]: { name: 'Growth Plan', cycle: 'annually', price: 790 },
  [DODO_PLANS.ENTERPRISE.MONTHLY]: { name: 'Enterprise Plan', cycle: 'monthly', price: 199 },
  [DODO_PLANS.ENTERPRISE.ANNUALLY]: { name: 'Enterprise Plan', cycle: 'annually', price: 1990 },
};

export const ADDON_DETAILS: Record<string, string> = {
  [DODO_ADDONS.AI_GENERATOR_PRO.MONTHLY]: 'ai_pro',
  [DODO_ADDONS.CLOUD_STORAGE.MONTHLY]: 'cloud_storage',
  [DODO_ADDONS.EXTRA_WORKSPACE.MONTHLY]: 'extra_workspace',
  [DODO_ADDONS.EXTRA_SEATS.MONTHLY]: 'extra_seats',
  [DODO_ADDONS.EMAIL_BROADCASTING.MONTHLY]: 'email_broadcasting',
  [DODO_ADDONS.AI_AUTOMATION.MONTHLY]: 'ai_automation',
};
