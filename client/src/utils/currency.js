/**
 * Currency & Country Detection Utilities
 */

export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: '₹ (INR - Indian Rupee)' },
  { code: 'USD', symbol: '$', label: '$ (USD - US Dollar)' },
  { code: 'GBP', symbol: '£', label: '£ (GBP - British Pound)' },
  { code: 'EUR', symbol: '€', label: '€ (EUR - Euro)' },
  { code: 'AED', symbol: 'AED ', label: 'AED (UAE Dirham)' },
  { code: 'AUD', symbol: 'A$', label: 'A$ (Australian Dollar)' },
  { code: 'CAD', symbol: 'C$', label: 'C$ (Canadian Dollar)' },
];

/**
 * Detect currency symbol based on phone number or dealer default
 * If the customer phone begins with +91 or is an Indian mobile number, it returns ₹.
 */
export function detectCurrency(phone, fallbackCurrency = '$') {
  if (phone) {
    const cleanPhone = String(phone).replace(/[\s\-\(\)\.]/g, '');
    
    // India: +91, 91 (12 digits), or 10-digit standard Indian mobile starting with 6-9
    if (
      cleanPhone.startsWith('+91') || 
      (cleanPhone.startsWith('91') && cleanPhone.length >= 12) ||
      (/^\+?91/.test(cleanPhone)) ||
      (/^[6-9]\d{9}$/.test(cleanPhone))
    ) {
      return '₹';
    }

    // UK: +44
    if (cleanPhone.startsWith('+44') || (cleanPhone.startsWith('44') && cleanPhone.length >= 11)) {
      return '£';
    }

    // Eurozone: +33, +49, +34, +39, +31, +32, +351, +353, +30, +43
    if (/^\+?(33|49|34|39|31|32|351|353|30|43)/.test(cleanPhone)) {
      return '€';
    }

    // UAE: +971
    if (cleanPhone.startsWith('+971') || (cleanPhone.startsWith('971') && cleanPhone.length >= 12)) {
      return 'AED ';
    }

    // Australia: +61
    if (cleanPhone.startsWith('+61') || (cleanPhone.startsWith('61') && cleanPhone.length >= 11)) {
      return 'A$';
    }

    // US / Canada: +1
    if (cleanPhone.startsWith('+1') || (cleanPhone.startsWith('1') && cleanPhone.length === 11)) {
      return '$';
    }
  }

  return fallbackCurrency || '$';
}

/**
 * Format amount with detected currency symbol
 */
export function formatCurrency(amount, phone, fallbackCurrency = '$') {
  const symbol = detectCurrency(phone, fallbackCurrency);
  return `${symbol}${Number(amount || 0).toFixed(2)}`;
}
