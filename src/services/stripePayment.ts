// Payment method integration removed. This module is kept as a no-op to preserve imports.

export interface PaymentRequestOptions {
  amount: number;
  currency?: string;
  label?: string;
}

export async function mountPaymentRequestButton(
  _containerId: string,
  _opts: PaymentRequestOptions
): Promise<{ mounted: boolean; reason?: string }> {
  void _containerId;
  void _opts;
  return { mounted: false, reason: 'This payment method is disabled in this build' };
}
