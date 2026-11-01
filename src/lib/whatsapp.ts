/**
 * National number as digits, without a trunk "0" (050... in Israel).
 * Owner profiles are stored that way already, but listing phones are
 * stored as typed, and "972" + "0501234567" is not a dialable number.
 */
function nationalDigits(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d]/g, "").replace(/^0+/, "");
}

function countryDigits(countryCode: string): string {
  return countryCode.replace(/[^\d]/g, "");
}

export function buildWhatsAppLink({
  countryCode,
  phoneNumber,
  message,
}: {
  countryCode: string;
  phoneNumber: string;
  message?: string;
}): string {
  const digitsOnly = `${countryDigits(countryCode)}${nationalDigits(phoneNumber)}`;
  return message
    ? `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digitsOnly}`;
}

/** `tel:` href in international form, dialable from any country. */
export function buildTelLink(countryCode: string, phoneNumber: string): string {
  return `tel:+${countryDigits(countryCode)}${nationalDigits(phoneNumber)}`;
}

/**
 * Readable international number: "+972 50-123-4567", "+1 (718) 555-1234".
 * Unknown shapes fall back to "+<code> <digits>" rather than guessing.
 */
export function formatPhoneForDisplay(
  countryCode: string,
  phoneNumber: string,
): string {
  const cc = countryDigits(countryCode);
  const n = nationalDigits(phoneNumber);
  if (cc === "1" && n.length === 10) {
    return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  }
  if (cc === "972" && n.length === 9) {
    return `+972 ${n.slice(0, 2)}-${n.slice(2, 5)}-${n.slice(5)}`;
  }
  if (cc === "972" && n.length === 8) {
    return `+972 ${n.slice(0, 1)}-${n.slice(1, 4)}-${n.slice(4)}`;
  }
  return `+${cc} ${n}`;
}
