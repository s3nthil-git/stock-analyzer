export function validateTicker(ticker: string): { valid: boolean; sanitized: string; error?: string } {
  if (!ticker || !ticker.trim()) {
    return { valid: false, sanitized: '', error: 'Ticker symbol is required' };
  }

  const sanitized = ticker.trim().toUpperCase();

  if (!/^[A-Z]{1,5}$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Ticker must be 1-5 alphabetic characters' };
  }

  return { valid: true, sanitized };
}
