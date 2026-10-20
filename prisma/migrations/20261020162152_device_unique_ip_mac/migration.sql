-- Migracion no destructiva: no modifica filas. Si existen IP o MAC duplicadas,
-- aborta con un error explicito y se revierte entera para resolverlo a mano.
DO $$
DECLARE
  duplicate_ips integer;
  duplicate_macs integer;
BEGIN
  SELECT COUNT(*) INTO duplicate_ips
  FROM (SELECT "ip" FROM "Device" GROUP BY "ip" HAVING COUNT(*) > 1) AS d;

  SELECT COUNT(*) INTO duplicate_macs
  FROM (
    SELECT "mac"
    FROM "Device"
    WHERE "mac" IS NOT NULL
    GROUP BY "mac"
    HAVING COUNT(*) > 1
  ) AS d;

  IF duplicate_ips > 0 OR duplicate_macs > 0 THEN
    RAISE EXCEPTION
      'Dispositivos duplicados: % IP(s), % MAC(s). Resuélvelos antes de aplicar la unicidad.',
      duplicate_ips,
      duplicate_macs;
  END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "Device_ip_key" ON "Device"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "Device_mac_key" ON "Device"("mac");
