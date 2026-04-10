declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    __ONESIGNAL_STATUS__?: {
      initialized: boolean;
      failed: boolean;
      error: string | null;
    };
  }
}

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

function isFeatureEnabledByEnv(): boolean {
  return import.meta.env.VITE_ENABLE_ONESIGNAL === 'true' && !isLocalhost;
}

export function isOneSignalEnabled(): boolean {
  if (!isFeatureEnabledByEnv()) {
    return false;
  }

  if (window.__ONESIGNAL_STATUS__?.failed) {
    return false;
  }

  return true;
}

async function getOneSignalInstance(): Promise<any> {
  if (!isFeatureEnabledByEnv()) {
    throw new Error('OneSignal desativado neste ambiente.');
  }

  if (window.__ONESIGNAL_STATUS__?.failed) {
    throw new Error(
      'OneSignal não está liberado para esta URL. Verifique a URL configurada no painel da OneSignal.'
    );
  }

  if (window.OneSignal?.User?.PushSubscription) {
    return window.OneSignal;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('OneSignal não inicializou a tempo.'));
    }, 20000);
    
    window.OneSignalDeferred!.push((OneSignal: any) => {
      clearTimeout(timeout);

      if (window.__ONESIGNAL_STATUS__?.failed) {
        reject(
          new Error(
            'OneSignal não está liberado para esta URL. Verifique a URL configurada no painel da OneSignal.'
          )
        );
        return;
      }

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

  await OneSignal.Notifications.requestPermission();

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