type BridgeResponse = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

type AndroidBridge = {
  call: (requestId: string, method: string, paramsJson: string) => void;
};

type PendingCall = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge;
    __nativeBridgeResolve?: (requestId: string, payloadJson: string) => void;
  }
}

const androidBridge = window.AndroidBridge;
const pending = new Map<string, PendingCall>();
let sequence = 0;

const nextRequestId = (): string => {
  sequence += 1;

  return `req-${Date.now()}-${sequence}`;
};

if (androidBridge) {
  window.__nativeBridgeResolve = (requestId, payloadJson) => {
    const call = pending.get(requestId);

    if (!call) return;

    pending.delete(requestId);

    let response: BridgeResponse;

    try {
      response = JSON.parse(payloadJson) as BridgeResponse;
    } catch {
      response = { ok: false, error: 'invalid_payload' };
    }

    if (response.ok) {
      call.resolve(response.data ?? null);
    } else {
      call.reject(new Error(response.error ?? 'native_error'));
    }
  };
}

export const isNativeBridgeAvailable = (): boolean => Boolean(androidBridge);

export const callNative = <T>(method: string, params: Record<string, unknown> = {}): Promise<T> => {
  if (!androidBridge) return Promise.reject(new Error('bridge_unavailable'));

  return new Promise<T>((resolve, reject) => {
    const requestId = nextRequestId();

    pending.set(requestId, { resolve: resolve as (value: unknown) => void, reject });
    androidBridge.call(requestId, method, JSON.stringify(params));
  });
};
