import { saveGlobalErrorLog } from '@/utils/firebaseUtils/firebaseUtils'

let wakeLock: WakeLockSentinel | null = null

// Ekranın kapanmasını engeller
export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen')

      // Release event'i yakala
      wakeLock.addEventListener('release', async () => {})
    }
  } catch (err: unknown) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : String(err),
      'WakeLock.request',
      undefined,
      err instanceof Error ? err.stack : undefined,
    )
  }
}

// Wake Lock’u bırakır
export function releaseWakeLock() {
  try {
    if (wakeLock) {
      wakeLock.release()
      wakeLock = null
    }
  } catch (err: unknown) {
    saveGlobalErrorLog(
      err instanceof Error ? err.message : String(err),
      'WakeLock.release',
      undefined,
      err instanceof Error ? err.stack : undefined,
    )
  }
}
