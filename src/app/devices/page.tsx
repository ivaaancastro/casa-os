import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { deviceWithOwner } from '@/lib/devices';
import { formatDeviceStatus } from '@/lib/utils/device';
import {
  DeviceManager,
  type DeviceItem,
  type DeviceOwnerOption,
} from '@/components/devices/DeviceManager';

export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const [devices, owners] = await Promise.all([
    prisma.device.findMany({
      include: deviceWithOwner,
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const items: DeviceItem[] = devices.map((device) => ({
    id: device.id,
    name: device.name,
    ip: device.ip,
    mac: device.mac,
    type: device.type,
    status: formatDeviceStatus({
      online: device.online,
      lastSeen: device.lastSeen,
    }),
    notes: device.notes,
    owner: device.owner
      ? { id: device.owner.id, name: device.owner.name }
      : null,
  }));

  const ownersOptions: DeviceOwnerOption[] = owners.map((owner) => ({
    id: owner.id,
    name: owner.name,
    email: owner.email,
  }));

  const onlineCount = devices.filter((device) => device.online).length;
  const deviceLabel = devices.length === 1 ? 'dispositivo' : 'dispositivos';

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <header className="col-span-12 border-t border-mist pt-8">
          <p className="mb-4 text-xs tracking-wider2 text-ash">
            Casa · Dispositivos
          </p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-6xl">
            Dispositivos
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ash">
            Inventario de los equipos de la casa.
          </p>
          <p className="mt-2 text-[10px] tracking-wider2 text-ash">
            {devices.length} {deviceLabel} · {onlineCount} en línea
          </p>
        </header>

        <section className="col-span-12 border-t border-mist pt-8">
          <DeviceManager
            devices={items}
            owners={ownersOptions}
            currentUserRole={user.role}
          />
        </section>
      </div>
    </div>
  );
}
