import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSettings } from '../hooks/useSettings';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  convert: (amount: number, fromCurrency?: string) => number;
  format: (amount: number) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const currency = settings?.currency || 'USD';

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setRates(data.rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const convert = useCallback((amount: number, fromCurrency: string = 'USD') => {
    if (!rates[currency] || !rates[fromCurrency]) return amount;
    const amountInUSD = amount / rates[fromCurrency];
    return amountInUSD * rates[currency];
  }, [rates, currency]);

  const format = useCallback((amount: number, fromCurrency: string = 'USD') => {
    const convertedAmount = convert(amount, fromCurrency);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(convertedAmount);
  }, [convert, currency]);

  const setCurrency = (newCurrency: string) => {
    updateSettings({ ...settings, currency: newCurrency });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
