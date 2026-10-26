'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { urlBase64ToUint8Array } from '@/lib/utils/push-client';

interface ReminderPanelProps {
  onClose: () => void;
}

interface PushConfig {
  publicKey: string | null;
  houseTimezone: string;
}

interface SubscriptionSummary {
  id: string;
  userAgent: string | null;
  active: boolean;
  createdAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}

interface UpcomingReminder {
  eventId: string;
  title: string;
  allDay: boolean;
  start: string;
  scheduledFor: string;
  owner: { id: string; name: string | null } | null;
  url: string;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function browserSupportsPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function detectIOSNeedsInstall(): boolean {
  if (typeof window === 'undefined') return false;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isIOS && !standalone;
}

function formatUpcoming(value: string, timeZone: string | undefined): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };

  try {
    return new Intl.DateTimeFormat('es-ES', {
      ...options,
      timeZone,
    }).format(date);
  } catch {
    // Si HOUSE_TIMEZONE no es válida, el panel no debe romperse: usa la zona
    // local del navegador y el dispatch seguirá rechazando la configuración.
    return new Intl.DateTimeFormat('es-ES', options).format(date);
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo completar la operación');
  }

  return data;
}

export function ReminderPanel({ onClose }: ReminderPanelProps) {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingReminder[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<PushSubscription | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [supported, setSupported] = useState<boolean | null>(null);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'subscribe' | 'unsubscribe' | 'test' | null>(
    null,
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const headingId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [configData, subscriptionsData, upcomingData] = await Promise.all([
        fetchJson<PushConfig>('/api/push/config'),
        fetchJson<{ subscriptions: SubscriptionSummary[] }>(
          '/api/push/subscriptions',
        ),
        fetchJson<{ reminders: UpcomingReminder[] }>(
          '/api/reminders/upcoming?limit=5',
        ),
      ]);

      setConfig(configData);
      setSubscriptions(subscriptionsData.subscriptions ?? []);
      setUpcoming(upcomingData.reminders ?? []);

      if (
        IS_PRODUCTION &&
        browserSupportsPush() &&
        Notification.permission === 'granted'
      ) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setCurrentSubscription(subscription);

          if (subscription) {
            const saved = await fetchJson<{ id: string; active: boolean }>(
              '/api/push/subscriptions',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
              },
            );
            setSubscriptionId(saved.id);
            setSubscriptions((previous) =>
              previous.some((item) => item.id === saved.id)
                ? previous
                : [
                    {
                      id: saved.id,
                      userAgent: navigator.userAgent,
                      active: saved.active,
                      createdAt: new Date().toISOString(),
                      lastSuccessAt: null,
                      lastFailureAt: null,
                    },
                    ...previous,
                  ],
            );
          } else {
            setSubscriptionId(null);
          }
        } catch {
          setError('No se pudo sincronizar este dispositivo.');
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los avisos.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setSupported(browserSupportsPush());
    setIosNeedsInstall(detectIOSNeedsInstall());

    if (browserSupportsPush()) {
      setPermission(Notification.permission);
    }

    loadData();
  }, [loadData]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function requestClose() {
    setClosing(true);
    window.setTimeout(onClose, 160);
  }

  async function handleActivate() {
    if (!config?.publicKey || !browserSupportsPush() || !IS_PRODUCTION) {
      setError('Los avisos no están disponibles en este entorno.');
      return;
    }

    if (iosNeedsInstall) {
      setError('Añade casa·os a la pantalla de inicio para activar los avisos.');
      return;
    }

    setBusy('subscribe');
    setError('');
    setNotice('');

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        setError(
          nextPermission === 'denied'
            ? 'El navegador bloqueó los avisos. Desbloquéalos en sus ajustes.'
            : 'No se concedió permiso para enviar avisos.',
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        });
      }

      const saved = await fetchJson<{ id: string; active: boolean }>(
        '/api/push/subscriptions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        },
      );

      setCurrentSubscription(subscription);
      setSubscriptionId(saved.id);
      setNotice('Avisos activados en este dispositivo.');
      await loadData();
    } catch (activateError) {
      setError(
        activateError instanceof Error
          ? activateError.message
          : 'No se pudieron activar los avisos.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleUnsubscribe() {
    setBusy('unsubscribe');
    setError('');
    setNotice('');

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        currentSubscription ?? (await registration.pushManager.getSubscription());

      let id = subscriptionId;

      if (subscription && !id) {
        try {
          const saved = await fetchJson<{ id: string }>(
            '/api/push/subscriptions',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription.toJSON()),
            },
          );
          id = saved.id;
        } catch {
          // Si no se puede sincronizar, el dispatch desactivará la suscripción
          // muerta cuando el proveedor responda 404/410.
        }
      }

      if (subscription) await subscription.unsubscribe();

      if (id) {
        const response = await fetch(
          `/api/push/subscriptions/${encodeURIComponent(id)}`,
          { method: 'DELETE' },
        );
        if (!response.ok && response.status !== 404) {
          throw new Error('No se pudo eliminar el dispositivo en el servidor.');
        }
      }

      setCurrentSubscription(null);
      setSubscriptionId(null);
      setNotice('Avisos desactivados en este dispositivo.');
      await loadData();
    } catch (unsubscribeError) {
      setError(
        unsubscribeError instanceof Error
          ? unsubscribeError.message
          : 'No se pudieron desactivar los avisos.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleTest() {
    setBusy('test');
    setError('');
    setNotice('');

    try {
      const result = await fetchJson<{
        sent: number;
        failed: number;
        deactivated: number;
      }>('/api/push/test', { method: 'POST' });

      setNotice(
        result.sent > 0
          ? `Prueba enviada a ${result.sent} dispositivo(s).`
          : 'No se pudo entregar la prueba.',
      );

      if (result.deactivated > 0) {
        await loadData();
      }
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : 'No se pudo enviar la prueba.',
      );
    } finally {
      setBusy(null);
    }
  }

  const hasPublicKey = Boolean(config?.publicKey);
  const isActive = Boolean(currentSubscription);
  const activeDevices = subscriptions.filter(
    (subscription) => subscription.active,
  ).length;
  const permissionDenied = permission === 'denied';

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Cerrar panel de avisos"
        className="absolute inset-0 cursor-default bg-ink/20 backdrop-blur-[2px] animate-scrim-in"
        onClick={requestClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${headingId}-heading`}
        className={`relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-mist bg-canvas p-6 shadow-2xl md:p-8 ${
          closing ? 'animate-panel-out' : 'animate-panel-in'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-mist pb-4">
          <div>
            <p className="text-[10px] tracking-wider2 text-ash">Calendario</p>
            <h2
              id={`${headingId}-heading`}
              className="mt-1 font-display text-3xl leading-none tracking-editorial"
            >
              Avisos
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-mist text-lg text-ash transition-colors hover:border-ink hover:text-ink active:bg-pearl"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="mt-4 border border-alarm px-3 py-2 text-xs text-alarm"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-4 border border-mist bg-pearl px-3 py-2 text-xs text-ink"
          >
            {notice}
          </p>
        )}

        <section className="mt-6" aria-busy={loading}>
          <p className="text-[10px] tracking-wider2 text-ash">
            Este dispositivo
          </p>

          {supported === null || loading ? (
            <p className="mt-3 text-sm text-ash">Cargando avisos…</p>
          ) : !supported ? (
            <p className="mt-3 text-sm text-ash">
              Este navegador no admite avisos. Prueba con Chrome, Edge, Firefox
              o una PWA instalada en iOS 16.4 o superior.
            </p>
          ) : !IS_PRODUCTION ? (
            <p className="mt-3 text-sm text-ash">
              Los avisos se activan en la versión publicada. En desarrollo el
              service worker no está registrado.
            </p>
          ) : !hasPublicKey ? (
            <p className="mt-3 text-sm text-ash">
              Los avisos no están configurados en el servidor.
            </p>
          ) : isActive ? (
            <div className="mt-3 space-y-4">
              <div className="flex items-start gap-3 border border-mist px-3 py-3">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm">Avisos activos en este dispositivo.</p>
                  <p className="mt-1 text-xs text-ash">
                    {activeDevices}{' '}
                    {activeDevices === 1
                      ? 'dispositivo con avisos'
                      : 'dispositivos con avisos'}
                    .
                  </p>
                </div>
              </div>

              {permissionDenied && (
                <p className="text-xs text-ash">
                  El navegador bloqueó las notificaciones. Desbloquéalas en sus
                  ajustes para volver a recibirlas.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={handleTest}
                  disabled={busy !== null}
                >
                  {busy === 'test' ? 'Enviando…' : 'Enviar prueba'}
                </button>
                <button
                  type="button"
                  className="text-xs text-ash underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-50"
                  onClick={handleUnsubscribe}
                  disabled={busy !== null}
                >
                  {busy === 'unsubscribe'
                    ? 'Desactivando…'
                    : 'Desactivar en este dispositivo'}
                </button>
              </div>
            </div>
          ) : iosNeedsInstall ? (
            <p className="mt-3 text-sm text-ash">
              En iPhone o iPad, añade casa·os a la pantalla de inicio y ábrela
              desde ahí para poder activar los avisos.
            </p>
          ) : permissionDenied ? (
            <p className="mt-3 text-sm text-ash">
              El navegador bloqueó los avisos. Desbloquéalos en los ajustes del
              sitio y vuelve a abrir este panel.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              <p className="text-sm text-ash">
                Activa los avisos para recibir los recordatorios del calendario
                en este dispositivo.
              </p>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={handleActivate}
                disabled={busy !== null}
              >
                {busy === 'subscribe'
                  ? 'Activando…'
                  : 'Activar avisos en este dispositivo'}
              </button>
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-mist pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-wider2 text-ash">Calendario</p>
              <h3 className="mt-1 font-display text-2xl leading-none tracking-editorial">
                Próximos avisos
              </h3>
            </div>
            <span className="text-[10px] text-ash">
              {upcoming.length} {upcoming.length === 1 ? 'aviso' : 'avisos'}
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-ash">Cargando…</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-ash">
              No hay avisos programados. Crea o edita un evento con recordatorio.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-mist border-y border-mist">
              {upcoming.map((reminder) => (
                <li key={`${reminder.eventId}-${reminder.scheduledFor}`}>
                  <a
                    href={reminder.url}
                    className="block py-3 transition-colors hover:bg-pearl active:bg-pearl"
                  >
                    <p className="text-sm">{reminder.title}</p>
                    <p className="mt-1 text-xs text-ash">
                      {formatUpcoming(
                        reminder.scheduledFor,
                        config?.houseTimezone,
                      )}
                      {reminder.allDay ? ' · Todo el día' : ''} ·{' '}
                      {reminder.owner
                        ? `Para ${reminder.owner.name ?? 'un miembro'}`
                        : 'Toda la casa'}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 border-t border-mist pt-6 text-xs leading-relaxed text-ash">
          <p className="text-[10px] tracking-wider2 text-ink">Cómo funciona</p>
          <p className="mt-2">
            Si el evento tiene un responsable, solo recibe el aviso esa persona.
            Si es de «Toda la casa», lo reciben todos los miembros activos con
            avisos activos.
          </p>
          <p className="mt-2">
            Los eventos de todo el día avisan a las 09:00 de la zona horaria de
            la casa. El envío se comprueba cada 5 minutos y puede sufrir pequeños
            retrasos.
          </p>
        </section>
      </section>
    </div>,
    document.body,
  );
}
