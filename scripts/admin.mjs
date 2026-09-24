import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const adminDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'admin');

if (!existsSync(path.join(adminDir, 'node_modules'))) {
  console.log('Installation des dependances de l\'admin...');
  const install = spawnSync('npm', ['install'], { cwd: adminDir, stdio: 'inherit', shell: true });
  if (install.status !== 0) process.exit(install.status ?? 1);
}

const dev = spawn('npm', ['run', 'dev'], { cwd: adminDir, stdio: 'inherit', shell: true });
dev.on('exit', (code) => process.exit(code ?? 0));
