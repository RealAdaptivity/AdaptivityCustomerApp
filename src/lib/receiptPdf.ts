import { Share, Platform } from 'react-native';

export type ReceiptData = {
  referenceCode: string;
  customerName: string;
  vehicle: string;
  services: string[];
  totalDollars: number;
  paymentStatus: string;
  dateLabel: string;
  address?: string;
};

export function buildReceiptText(data: ReceiptData): string {
  const services = data.services.length ? data.services.map((s) => `  • ${s}`).join('\n') : '  • —';
  return [
    'ADAPTIVITY PERFORMANCE',
    'Mobile service receipt',
    `Date: ${data.dateLabel}`,
    `Booking: ${data.referenceCode}`,
    `Customer: ${data.customerName}`,
    `Vehicle: ${data.vehicle}`,
    data.address ? `Address: ${data.address}` : null,
    `Payment: ${data.paymentStatus}`,
    'Services:',
    services,
    `Total: $${data.totalDollars.toFixed(2)}`,
    '',
    'Thank you for choosing Adaptivity Performance.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Share a text receipt (user can save/print from the share sheet). */
export async function shareReceipt(data: ReceiptData) {
  const message = buildReceiptText(data);
  await Share.share(
    Platform.OS === 'ios'
      ? { message, title: `Receipt ${data.referenceCode}` }
      : { message, title: `Receipt ${data.referenceCode}` }
  );
}
