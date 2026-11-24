import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function greeting() {
  const h = new Date().getHours();
  if (h < 7) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const [notes, events, devices] = await Promise.all([
    prisma.note.findMany({
      take: 4,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, type: true, updatedAt: true },
    }),
    prisma.event.findMany({
      where: { start: { gte: new Date() } },
      take: 4,
      orderBy: { start: 'asc' },
      select: { id: true, title: true, start: true, allDay: true },
    }),
    prisma.device.findMany({
      select: { online: true, lastSeen: true },
    }),
  ]);

  const onlineCount = devices.filter((d) => d.online).length;
  const totalDevices = devices.length;
  const lastSeen = devices
    .map((d) => d.lastSeen)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const quickActions = [
    { label: 'Nueva nota', href: '/notas', accent: true },
    { label: 'Nuevo evento', href: '/calendario', accent: true },
    { label: 'Dispositivos', href: '/devices', accent: false },
    { label: 'Cuentas', href: '/cuentas', accent: false },
    { label: 'Familia', href: '/familia', accent: false },
    { label: 'Perfil', href: '/perfil', accent: false },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 md:px-8 md:py-10">
      <div className="grid animate-fade-rise grid-cols-1 gap-6">
        <header className="pb-2">
          <p className="text-[13px] text-ash">{greeting()}</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink md:text-[40px]">
            {session.user.name ?? 'Tu hogar'}
          </h1>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`rounded-2xl px-4 py-4 text-[15px] font-medium shadow-sm transition-shadow hover:shadow-md ${
                action.accent
                  ? 'bg-accent text-white'
                  : 'bg-surface text-ink'
              }`}
            >
              {action.label}
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-ink">Próximos eventos</h2>
              <Link href="/calendario" className="text-[13px] text-accent">
                Ver todo
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-ash">No hay eventos próximos.</p>
            ) : (
              <ul className="grid gap-3">
                {events.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[15px] text-ink">{event.title}</span>
                    <span className="shrink-0 text-[12px] text-ash">
                      {formatDate(event.start)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-ink">Notas recientes</h2>
              <Link href="/notas" className="text-[13px] text-accent">
                Ver todo
              </Link>
            </div>
            {notes.length === 0 ? (
              <p className="text-sm text-ash">Aún no hay notas.</p>
            ) : (
              <ul className="grid gap-3">
                {notes.map((note) => (
                  <li key={note.id} className="truncate text-[15px] text-ink">
                    {note.title || 'Sin título'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-semibold text-ink">Dispositivos</h2>
              <p className="mt-1 text-sm text-ash">
                {totalDevices === 0
                  ? 'No hay dispositivos registrados.'
                  : `${onlineCount} de ${totalDevices} en línea${
                      lastSeen ? ` · última vista ${formatDate(lastSeen)}` : ''
                    }`}
              </p>
            </div>
            <Link
              href="/devices"
              className="rounded-xl bg-canvas px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-mist/60"
            >
              Gestionar
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
