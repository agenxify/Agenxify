import { useState } from 'react';
import { usePlanEnforcement } from './usePlanEnforcement';

export const useMarketingPlan = () => {
  const { checkSharedLimit } = usePlanEnforcement();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');

  const checkMarketingLimit = async (tableName: string, key: any, name: string, sumColumn?: string) => {
    const canCreate = await checkSharedLimit(tableName, key, undefined, sumColumn);
    if (!canCreate) {
      setFeatureName(name);
      setIsUpgradeModalOpen(true);
      return false;
    }
    return true;
  };

  return {
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    featureName,
    checkMarketingLimit
  };
};
