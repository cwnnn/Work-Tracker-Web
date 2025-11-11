let wakeLock: WakeLockSentinel | null = null

// Ekranın kapanmasını engeller
export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen')
      console.log('🔒 Screen Wake Lock aktif')
      wakeLock.addEventListener('release', () => {
        console.log('🔓 Screen Wake Lock bırakıldı')
      })
    } else {
      console.warn('Wake Lock API desteklenmiyor.')
    }
  } catch (err) {
    console.error('WakeLock hatası:', err)
  }
}

// Wake Lock’u bırakır
export function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release()
    wakeLock = null
    console.log('🔓 Wake Lock bırakıldı')
  }
}
