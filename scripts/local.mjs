/* ==========================================================================
   NEWAUTO — ver o site localmente

   Um comando:  node scripts/local.mjs        (depois abrir http://localhost:4400)

   Existe por causa de um erro que já aconteceu mais do que uma vez: correr
   `node scripts/gerar.mjs` sem `BASE=` constrói para produção, onde tudo mora em
   `/NewAuto/...`. Servido em localhost, esse build responde 200 na página mas dá
   404 no CSS, no JS e em todas as ligações — a página abre a branco e parece que
   o servidor morreu, quando o que está errado é o build.

   Aqui o prefixo é sempre o da raiz, por isso não há como enganar-se.

   Node sem dependências, como o resto do projecto.
   ========================================================================== */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '_site');
const PORTA = Number(process.env.PORTA ?? 4400);
const ENDERECO = `http://localhost:${PORTA}`;

/* ------------------------------------------------------------------ build */
const build = spawnSync(process.execPath, [join(RAIZ, 'scripts/gerar.mjs')], {
  env: { ...process.env, BASE: '', SITE: ENDERECO },
  stdio: 'inherit',
});
if (build.status !== 0) process.exit(build.status ?? 1);

/* A auditoria corre com o mesmo prefixo do build, senão acusa erros que só
   existem em produção. Não impede o servidor de arrancar: localmente serve para
   avisar, não para bloquear. */
spawnSync(process.execPath, [join(RAIZ, 'scripts/auditar.mjs')], {
  env: { ...process.env, BASE: '', SITE: ENDERECO },
  stdio: 'inherit',
});

/* --------------------------------------------------------------- servidor */
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
};

createServer((pedido, resposta) => {
  /* `normalize` mais o teste do prefixo impedem que um `../` saia de `_site`. */
  const caminho = decodeURIComponent(new URL(pedido.url, ENDERECO).pathname);
  let ficheiro = normalize(join(SAIDA, caminho));
  if (!ficheiro.startsWith(SAIDA)) { resposta.writeHead(403).end('403'); return; }

  if (existsSync(ficheiro) && statSync(ficheiro).isDirectory()) ficheiro = join(ficheiro, 'index.html');

  if (!existsSync(ficheiro)) {
    /* A mesma página 404 que o GitHub Pages serve, para se poder ver como é. */
    const quatro = join(SAIDA, '404.html');
    const corpo = existsSync(quatro) ? readFileSync(quatro) : 'Não encontrado';
    resposta.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(corpo);
    return;
  }

  resposta.writeHead(200, {
    'content-type': TIPOS[extname(ficheiro)] ?? 'application/octet-stream',
    /* Sem cache: durante a revisão, ver o ficheiro antigo é pior do que esperar. */
    'cache-control': 'no-store',
  }).end(readFileSync(ficheiro));
}).listen(PORTA, () => {
  console.log(`\n  ${ENDERECO}\n  Ctrl+C para parar.\n`);
});
