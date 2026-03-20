declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const isOneSignalEnabled =
  import.meta.env.VITE_ENABLE_ONESIGNAL === 'true' && !isLocalhost;

async function getOneSignalInstance(): Promise<any> {
  if (!isOneSignalEnabled) {
    throw new Error('OneSignal desativado neste ambiente.');
  }

  if (window.OneSignal?.User?.PushSubscription) {
    return window.OneSignal;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('OneSignal não inicializou a tempo.'));
    }, 10000);

    window.OneSignalDeferred!.push((OneSignal: any) => {
      clearTimeout(timeout);
      resolve(OneSignal);
    });
  });
}

export async function getPushSubscriptionId(): Promise<string | null> {
  try {
    const OneSignal = await getOneSignalInstance();
    return OneSignal?.User?.PushSubscription?.id ?? null;
  } catch {
    return null;
  }
}

export async function isPushOptedIn(): Promise<boolean> {
  try {
    const OneSignal = await getOneSignalInstance();
    return Boolean(OneSignal?.User?.PushSubscription?.optedIn);
  } catch {
    return false;
  }
}

export async function enablePushAndGetSubscriptionId(): Promise<string | null> {
  const OneSignal = await getOneSignalInstance();

  if (!OneSignal?.Notifications?.isPushSupported?.()) {
    throw new Error('Este navegador não suporta notificações push.');
  }

  if (!OneSignal.Notifications.permission) {
    await OneSignal.Notifications.requestPermission();
  }

  if (!OneSignal?.User?.PushSubscription?.optedIn) {
    await OneSignal.User.PushSubscription.optIn();
  }

  return OneSignal?.User?.PushSubscription?.id ?? null;
}

export async function disablePush(): Promise<void> {
  const OneSignal = await getOneSignalInstance();

  if (OneSignal?.User?.PushSubscription?.optOut) {
    await OneSignal.User.PushSubscription.optOut();
  }
}