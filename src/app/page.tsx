export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏠 casa-os
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tu hogar digital. Gestiona dispositivos, notas familiares y más,
          todo en un solo lugar.
        </p>
      </div>

      {/* Estado del proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatusCard
          emoji="📊"
          title="Dashboard"
          status="En desarrollo"
          statusColor="text-yellow-600 bg-yellow-50"
        />
        <StatusCard
          emoji="🖥️"
          title="Dispositivos"
          status="En desarrollo"
          statusColor="text-yellow-600 bg-yellow-50"
        />
        <StatusCard
          emoji="🛒"
          title="Notas / Compra"
          status="En desarrollo"
          statusColor="text-yellow-600 bg-yellow-50"
        />
        <StatusCard
          emoji="📅"
          title="Calendario"
          status="Planificado"
          statusColor="text-blue-600 bg-blue-50"
        />
        <StatusCard
          emoji="📦"
          title="Inventario"
          status="Planificado"
          statusColor="text-blue-600 bg-blue-50"
        />
        <StatusCard
          emoji="💰"
          title="Gastos"
          status="Idea"
          statusColor="text-gray-500 bg-gray-100"
        />
      </div>

      {/* Info */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">🚀 Primeros pasos</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>
            Configura las variables de entorno:{' '}
            <code className="bg-gray-100 px-1 rounded">cp .env.example .env</code>
          </li>
          <li>
            Inicializa la base de datos:{' '}
            <code className="bg-gray-100 px-1 rounded">npm run db:push && npm run db:seed</code>
          </li>
          <li>
            Instala dependencias:{' '}
            <code className="bg-gray-100 px-1 rounded">npm install</code>
          </li>
          <li>
            Arranca el servidor:{' '}
            <code className="bg-gray-100 px-1 rounded">npm run dev</code>
          </li>
        </ol>
      </div>
    </div>
  );
}

function StatusCard({
  emoji,
  title,
  status,
  statusColor,
}: {
  emoji: string;
  title: string;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{emoji}</div>
      <h3 className="font-medium text-gray-900">{title}</h3>
      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
        {status}
      </span>
    </div>
  );
}
