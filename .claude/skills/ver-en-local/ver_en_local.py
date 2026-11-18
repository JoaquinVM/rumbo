#!/usr/bin/env python3
"""Run this checkout of Rumbo 2 locally, with a test base of its own, for Joaquín to see a change.

Usage (from any folder of the checkout or one of its worktrees):
    python3 -I .claude/skills/ver-en-local/ver_en_local.py            # build, start (or reuse) and print the access
    python3 -I .claude/skills/ver-en-local/ver_en_local.py --vaciar   # erase the test person's data: back to the example
    python3 -I .claude/skills/ver-en-local/ver_en_local.py --parar    # stop the server (keeps the base)
    python3 -I .claude/skills/ver-en-local/ver_en_local.py --borrar   # stop and drop the test base

It builds the app and the server of this branch and runs e2e/servidor-prueba.mjs (the fake Cloudflare Access of the
e2e tests, open: every request is the person e2e@rumbo.test) against a base `rumbo_local_<branch>` in the
`rumbo-pg-prueba` container. It never touches production, Joaquín's data or another session's trial. With nothing
saved, Rumbo shows its example data. State and logs live in ~/.cache/rumbo-ver-en-local/<branch>/, outside the repo.
"""
import json, os, re, shutil, signal, socket, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

CONTAINER, PGPORT, PGUSER, PGPASS = 'rumbo-pg-prueba', 55432, 'rumbo', 'prueba'


def sh(*cmd, cwd=None, check=True, env=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=env)
    if check and r.returncode != 0:
        sys.exit(f'Falló: {" ".join(cmd)}\n{(r.stderr or r.stdout).strip()[-3000:]}')
    return r.stdout.strip()


ROOT = Path(sh('git', 'rev-parse', '--show-toplevel'))
BRANCH = sh('git', 'rev-parse', '--abbrev-ref', 'HEAD', cwd=ROOT)
if BRANCH == 'HEAD':
    BRANCH = 'sha-' + sh('git', 'rev-parse', '--short', 'HEAD', cwd=ROOT)
SLUG = re.sub(r'[^a-z0-9]+', '_', BRANCH.lower()).strip('_')[:40]
DB = f'rumbo_local_{SLUG}'
STATE_DIR = Path.home() / '.cache' / 'rumbo-ver-en-local' / SLUG
STATE = STATE_DIR / 'estado.json'


def load():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save(st):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(st, indent=2))


def alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except (OSError, TypeError):
        return False


def free(port):
    with socket.socket() as s:
        try:
            s.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False


def status(url, method='GET'):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method=method), timeout=5) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except (urllib.error.URLError, OSError):
        return 0


def psql(sql):
    return sh('docker', 'exec', CONTAINER, 'psql', '-U', PGUSER, '-d', 'postgres', '-tAc', sql)


def stop(st):
    pid = st.pop('pid', None)
    if pid and alive(pid):
        try:
            os.killpg(pid, signal.SIGTERM)
        except OSError:
            pass
    save(st)


def env_node():
    # Node 24 as in production; 22 if this Mac does not have it yet
    base = Path.home() / '.nvm' / 'versions' / 'node'
    nvm = sorted(base.glob('v24.*')) or sorted(base.glob('v22.*'))
    path = f'{nvm[-1] / "bin"}:{os.environ["PATH"]}' if nvm else os.environ['PATH']
    return {**os.environ, 'PATH': path}


def ensure_pg():
    if shutil.which('docker') is None:
        sys.exit('No encuentro docker. Abre Docker Desktop y vuelve a intentar.')
    state = sh('docker', 'inspect', '-f', '{{.State.Running}}', CONTAINER, check=False)
    if state == '':
        sh('docker', 'run', '-d', '--name', CONTAINER, '-e', f'POSTGRES_USER={PGUSER}', '-e', f'POSTGRES_PASSWORD={PGPASS}',
           '-e', 'POSTGRES_DB=rumbo', '-p', f'127.0.0.1:{PGPORT}:5432', 'postgres:17')
    elif state != 'true':
        sh('docker', 'start', CONTAINER)
    for _ in range(30):
        if sh('docker', 'exec', CONTAINER, 'pg_isready', '-U', PGUSER, check=False).endswith('accepting connections'):
            break
        time.sleep(1)
    if not psql(f"SELECT 1 FROM pg_database WHERE datname='{DB}'"):
        psql(f'CREATE DATABASE {DB} OWNER {PGUSER}')


def build():
    env = env_node()
    if not (ROOT / 'node_modules').exists():
        print('Instalando dependencias (npm ci, una sola vez por carpeta)…', flush=True)
        sh('npm', 'ci', '--no-audit', '--no-fund', cwd=ROOT, env=env)
    print(f'Construyendo la app y el servidor de {BRANCH}…', flush=True)
    sh('npm', 'run', 'construir', cwd=ROOT, env=env)
    sh('npm', 'run', 'construir-servidor', cwd=ROOT, env=env)


def start(st):
    port = next((p for p in range(4380, 4480) if free(p)), None) or sys.exit('No hay puertos libres desde 4380.')
    log = STATE_DIR / 'servidor.log'
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    env = {**env_node(), 'PORT': str(port), 'E2E_ACCESS_ABIERTO': '1', 'PGHOST': '127.0.0.1', 'PGPORT': str(PGPORT),
           'PGUSER': PGUSER, 'PGPASSWORD': PGPASS, 'PGDATABASE': DB}
    p = subprocess.Popen(['node', '--conditions=rumbo-compilado', 'e2e/servidor-prueba.mjs'], cwd=ROOT, env=env,
                         stdout=open(log, 'w'), stderr=subprocess.STDOUT, start_new_session=True)
    st.update(pid=p.pid, puerto=port)
    save(st)
    end = time.time() + 60
    while time.time() < end and p.poll() is None and status(f'http://localhost:{port}/salud') != 200:
        time.sleep(1)
    if status(f'http://localhost:{port}/salud') != 200:
        tail = '\n'.join(log.read_text(errors='replace').splitlines()[-25:])
        sys.exit(f'El servidor no respondió. Últimas líneas de {log}:\n{tail}')


def main():
    st = load()
    arg = sys.argv[1] if len(sys.argv) > 1 else ''
    if arg in ('--parar', '--borrar'):
        stop(st)
        if arg == '--borrar':
            psql(f'DROP DATABASE IF EXISTS {DB}')
            shutil.rmtree(STATE_DIR, ignore_errors=True)
            print(f'Paré el servidor y borré la base {DB}.')
        else:
            print(f'Paré el servidor. La base {DB} queda para la próxima vez.')
        return
    if arg == '--vaciar':
        if not st.get('puerto') or status(f'http://localhost:{st["puerto"]}/salud') != 200:
            sys.exit('El servidor no está corriendo: corre el script sin opciones primero.')
        code = status(f'http://localhost:{st["puerto"]}/api/v2/datos', 'DELETE')
        print('Datos borrados: Rumbo vuelve a mostrar el ejemplo.' if code == 204 else f'No pude borrar ({code}).')
        return

    ensure_pg()
    # Always rebuild: the branch may have changed since the last start, and a stale build would show old code
    stop(st)
    build()
    start(st)
    me = Path(__file__).resolve().relative_to(ROOT)
    print(json.dumps({
        'rama': BRANCH, 'carpeta': str(ROOT),
        'url': f'http://localhost:{st["puerto"]}/',
        'api': f'http://localhost:{st["puerto"]}/api/v2/datos',
        'persona': 'e2e@rumbo.test (Access de prueba, abierto: no hace falta encabezado)',
        'vaciar': f'python3 -I {me} --vaciar',
        'base': DB, 'logs': str(STATE_DIR),
    }, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
