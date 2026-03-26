import { GLOBAL_CURRENCIES } from '../constants';

export const formatCurrency = (value: number, currencyCode: string = 'USD') => {
  const currency = GLOBAL_CURRENCIES.find(c => c.code === currencyCode) || GLOBAL_CURRENCIES[0];
  const symbol = currency.symbol;
  
  return `${symbol}${value.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const getCurrencySymbol = (currencyCode: string = 'USD') => {
  const currency = GLOBAL_CURRENCIES.find(c => c.code === currencyCode) || GLOBAL_CURRENCIES[0];
  return currency.symbol;
};
