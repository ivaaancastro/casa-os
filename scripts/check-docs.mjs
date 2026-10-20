#!/usr/bin/env node
/**
 * Comprueba el cierre documental de una feature.
 *
 * Uso:
 *   npm run docs:check -- <nombre>
 *
 * No sustituye a la verificación de producción ni a la revisión humana:
 * detecta olvidos mecánicos (archivos, casillas y enlaces).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const rawSlug = process.argv[2];
if (!rawSlug || rawSlug === '--help' || rawSlug === '-h') {
  console.log('Uso: npm run docs:check -- <nombre-de-feature>');
  console.log('Ejemplo: npm run docs:check -- dispositivos-crud');
  process.exit(rawSlug ? 0 : 2);
}

const slug = rawSlug.replace(/^specs\//, '').replace(/\/+$/, '');
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`Nombre de feature no válido: "${rawSlug}"`);
  process.exit(2);
}

const root = process.cwd();
const specDir = join(root, 'specs', slug);
const files = {
  plan: join(specDir, 'plan.md'),
  spec: join(specDir, 'spec.md'),
  tasks: join(specDir, 'tasks.md'),
  cierre: join(specDir, 'cierre.md'),
  memory: join(root, 'MEMORY.md'),
};

const results = [];
function check(ok, label, detail = '') {
  results.push({ ok, label, detail });
}

const missing = Object.entries(files)
  .filter(([, path]) => !existsSync(path))
  .map(([name, path]) => `${name}: ${path}`);

if (missing.length > 0) {
  console.error(`\nCierre incompleto de "${slug}": faltan archivos.\n`);
  for (const item of missing) console.error(`  ✗ ${item}`);
  console.error('\nCompleta la Fase A/B de docs/cierre-feature.md.\n');
  process.exit(1);
}

const read = (path) => readFileSync(path, 'utf8');
const tasks = read(files.tasks);
const cierre = read(files.cierre);
const memory = read(files.memory);
const plan = read(files.plan);
const spec = read(files.spec);

const unchecked = (text) => (text.match(/^\s*[-*]\s*\[\s\]/gm) ?? []).length;
const countChecked = (text) => (text.match(/^\s*[-*]\s*\[x\]/gim) ?? []).length;

check(plan.trim().length > 0, 'plan.md tiene contenido');
check(spec.trim().length > 0, 'spec.md tiene contenido');

const pendingTasks = unchecked(tasks);
check(
  pendingTasks === 0,
  'tasks.md sin casillas pendientes',
  pendingTasks > 0 ? `${pendingTasks} pendiente(s)` : `${countChecked(tasks)} completada(s)`
);

const pendingCloseout = unchecked(cierre);
check(
  pendingCloseout === 0,
  'cierre.md sin casillas pendientes',
  pendingCloseout > 0 ? `${pendingCloseout} pendiente(s)` : `${countChecked(cierre)} comprobada(s)`
);

const requiredSections = [
  '## Verificación',
  '## Documentación actualizada',
  '## Tareas',
  '## Producción',
  '## Checklist de cierre',
];
for (const section of requiredSections) {
  check(cierre.includes(section), `cierre.md incluye "${section}"`);
}

check(
  /\*\*Estado:\*\*\s*cerrada/i.test(cierre),
  'cierre.md marcado como "Estado: cerrada"'
);

check(
  memory.includes(`specs/${slug}/cierre.md`),
  'MEMORY.md enlaza el cierre',
  `specs/${slug}/cierre.md`
);

const failed = results.filter((result) => !result.ok);
console.log(`\nComprobación de cierre: ${slug}\n`);
for (const result of results) {
  const icon = result.ok ? '✓' : '✗';
  const detail = result.detail ? ` — ${result.detail}` : '';
  console.log(`  ${icon} ${result.label}${detail}`);
}

if (failed.length > 0) {
  console.error(`\nCierre incompleto: ${failed.length} comprobación(es) fallida(s).`);
  console.error('Corrige y vuelve a ejecutar: npm run docs:check -- ' + slug + '\n');
  process.exit(1);
}

console.log('\nCierre documental correcto. Aún falta mergear el PR de cierre y');
console.log('verificar el CI de main; hasta entonces la feature no está cerrada.\n');
