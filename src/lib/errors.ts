export function getErrorMessage(error: unknown, fallback = 'Perubahan belum tersimpan. Coba lagi.'): string {
  return error instanceof Error ? error.message : fallback;
}
