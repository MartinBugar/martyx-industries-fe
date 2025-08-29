export function mapDownloadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/410|expired|expire/i.test(msg)) {
    return 'This download link expired. Please refresh to generate a new one.';
  }
  if (/403|forbidden|not authorized|unauthor/i.test(msg)) {
    return 'You are not entitled to download this file.';
  }
  if (/404|not found/i.test(msg)) {
    return 'The file is not available.';
  }
  return 'Failed to download file. Please try again later.';
}
