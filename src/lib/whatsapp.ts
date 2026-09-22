export function buildWhatsAppLink({
  countryCode,
  phoneNumber,
  message,
}: {
  countryCode: string;
  phoneNumber: string;
  message?: string;
}): string {
  const digitsOnly = `${countryCode}${phoneNumber}`.replace(/[^\d]/g, "");
  return message
    ? `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digitsOnly}`;
}
