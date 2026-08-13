/* ==========================================================================
   Auditoria do site compilado.

   Corre depois do gerador e falha com código 1 se encontrar alguma coisa. Vive
   aqui, e não só na cabeça de quem publica, porque os erros que interessam são
   sempre os que ninguém se lembra de ir ver: uma ligação partida numa das
   fichas, um telefone sem a nota do custo da chamada, um prefixo de
   subdirectório que deixa o site sem CSS num domínio próprio.
   ========================================================================== */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, '_site');
const problemas = [];
const avisos = [];
const mal = (f, m) => problemas.push(`${f}: ${m}`);
const aviso = (f, m) => avisos.push(`${f}: ${m}`);

const DEF = JSON.parse(readFileSync(join(RAIZ, 'data/definicoes.json'), 'utf8'));
const NOME = DEF.empresa.nome;
const RE_TELEFONE = new RegExp(DEF.contactos.telefone.split('').join('\\s?'), 'g');

/* O prefixo esperado sai exactamente da mesma regra do gerador — incluindo a
   possibilidade de ser imposto pelo ambiente, que é como se constrói para o
   servidor local. Se esta linha se afastar da do gerador, a auditoria passa a
   verificar uma coisa diferente da que foi construída. */
const PREFIXO = (process.env.BASE ?? (existsSync(join(SAIDA, 'CNAME')) ? '' : '/NewAuto')).replace(/\/$/, '');
const SITE_HOST = new URL(process.env.SITE ?? (existsSync(join(SAIDA, 'CNAME'))
  ? `https://${readFileSync(join(SAIDA, 'CNAME'), 'utf8').trim()}`
  : 'https://renatovalente5.github.io')).host;

const EXTERNOS_OK = [
  SITE_HOST,
  'wa.me',
  'www.livroreclamacoes.pt',
  'www.google.com', 'maps.app.goo.gl', 'policies.google.com',
  'www.cnpd.pt', 'www.cicap.pt', 'www.consumidor.gov.pt',
  'www.instagram.com', 'www.facebook.com',
  'app.pagescms.org',
];

function todos(dir, ext, lista = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) todos(p, ext, lista);
    else if (e.name.endsWith(ext)) lista.push(p);
  }
  return lista;
}

const paginas = todos(SAIDA, '.html');
const rel = (p) => p.slice(SAIDA.length);

for (const f of paginas) {
  const h = readFileSync(f, 'utf8');
  const n = rel(f);

  /* 1. o prefixo dos caminhos tem de bater certo com onde o site vai ser
        servido — é a avaria que deixou outro site sem CSS durante dias */
  const css = (h.match(/<link rel="stylesheet" href="([^"?]+)/) || [])[1];
  if (css !== `${PREFIXO}/assets/css/estilo.css`) {
    mal(n, `a folha de estilo aponta para ${css}, e devia apontar para ${PREFIXO}/assets/css/estilo.css`);
  }

  /* 2. ligações e recursos internos apontam para ficheiros que existem */
  const refs = [...h.matchAll(/(?:href|src|srcset)="([^"]+)"/g)].flatMap(([, v]) =>
    v.includes(' ') && v.includes(',') ? v.split(',').map((s) => s.trim().split(/\s+/)[0]) : [v]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(r)) continue;
    const semQuery = r.split('?')[0].split('#')[0];
    if (!semQuery) continue;
    const alvo = semQuery.startsWith('/') ? join(SAIDA, semQuery.slice(PREFIXO.length)) : resolve(dirname(f), semQuery);
    const existe = existsSync(alvo) && (statSync(alvo).isFile() || existsSync(join(alvo, 'index.html')));
    if (!existe) mal(n, `aponta para ${semQuery}, que não existe`);
  }

  /* 3. domínios externos previstos */
  for (const [, url] of h.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
    const host = new URL(url).host;
    if (!EXTERNOS_OK.includes(host)) mal(n, `recurso externo não previsto: ${host}`);
  }

  /* 4. imagens: o atributo alt tem de existir sempre. Vazio é uma escolha
        legítima — diz "esta imagem é decorativa" — mas ausente é esquecimento.
        Sem width/height, a página salta ao carregar. */
  for (const [, tag] of h.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\salt="/.test(tag)) mal(n, `<img> sem atributo alt: ${tag.trim().slice(0, 70)}`);
    if (!/\swidth="\d/.test(tag) || !/\sheight="\d/.test(tag)) mal(n, '<img> sem width/height');
  }

  /* 5. toda a ligação tem de ter nome acessível */
  for (const [, atributos, dentro] of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (/aria-label="[^"]/.test(atributos)) continue;
    const texto = dentro.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').trim();
    if (!texto && !/<img[^>]*\salt="[^"]/.test(dentro)) {
      mal(n, `ligação sem nome acessível: ${atributos.trim().slice(0, 60)}`);
    }
  }

  /* 6. títulos: exactamente um <h1>, e nenhum salto de nível */
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) mal(n, `tem ${h1} elementos <h1> (devia ter 1)`);
  let anterior = 0;
  for (const [, nivel] of h.matchAll(/<h([1-6])[\s>]/g)) {
    const v = +nivel;
    if (anterior && v > anterior + 1) mal(n, `salto de <h${anterior}> para <h${v}>`);
    anterior = v;
  }

  /* 7. cabeça */
  for (const [re, m] of [
    [/<link rel="canonical" href="https?:\/\/[^"]+"/, 'sem canonical'],
    [/<meta name="description" content="[^"]{50,}"/, 'sem description (ou com menos de 50 caracteres)'],
    [/<meta property="og:image" content="https?:\/\/[^"]+"/, 'sem og:image absoluto'],
    [/<html lang="pt-PT">/, 'sem lang="pt-PT"'],
  ]) if (!re.test(h)) mal(n, m);

  const titulo = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (titulo.length > 60) aviso(n, `título com ${titulo.length} caracteres (o Google corta perto dos 60)`);
  if (!titulo.includes(NOME)) aviso(n, 'título sem o nome do stand');
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.length > 160) aviso(n, `description com ${desc.length} caracteres (o Google corta aos 160)`);

  /* 8. o custo da chamada, obrigatório onde quer que apareça um número.
        O número vem das definições e não escrito à mão: uma auditoria que
        procura um número velho deixa de encontrar seja o que for e passa
        sempre, calada. */
  const nums = (h.match(RE_TELEFONE) || []).length;
  const notas = (h.match(/\(Chamada para a rede móvel nacional\)/g) || []).length;
  if (nums && !notas) mal(n, 'mostra o telefone sem a nota do custo da chamada');

  /* 9. JSON-LD válido, e nada de Product/Car sem preço visível */
  for (const [, bruto] of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let dados;
    try { dados = JSON.parse(bruto); } catch (e) { mal(n, `JSON-LD inválido: ${e.message}`); continue; }
    for (const item of [dados].flat()) {
      if (!['Product', 'Car', 'Vehicle'].includes(item['@type'])) continue;
      if (!item.offers) { mal(n, `${item['@type']} sem offers`); continue; }
      const preco = item.offers.price;
      if (!preco) { mal(n, `${item['@type']} com offers sem preço`); continue; }
      /* Marcar um preço que não está visível na página é expressamente
         proibido pelas políticas de dados estruturados da Google. */
      /* Os dois lados normalizam-se da mesma maneira. O `Intl` usa espaço
         estreito inquebrável (U+202F) nos milhares; o `\s+` deste lado
         convertia-o em espaço normal só no texto da página, e a comparação
         falhava sempre com preços acima de mil. */
      const normalizar = (x) => String(x).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const visivel = normalizar(h);
      const formatado = normalizar(new Intl.NumberFormat('pt-PT').format(preco));
      if (!visivel.includes(formatado)) {
        mal(n, `${item['@type']} marca o preço ${formatado} que não aparece visível na página`);
      }
    }
  }

  /* 10. abrir noutro separador sem rel="noopener" é falha de segurança */
  for (const [, tag] of h.matchAll(/<a\b([^>]*target="_blank"[^>]*)>/g)) {
    if (!/rel="[^"]*noopener/.test(tag)) mal(n, 'target="_blank" sem rel="noopener"');
  }

  /* 11. o rodapé legal, em todas as páginas */
  for (const t of ['Livro de Reclamações', 'Política de privacidade', 'Termos e condições', 'Gestão']) {
    if (!h.includes(t)) mal(n, `o rodapé não tem a ligação "${t}"`);
  }
  /* Proibido em todo o site: a garantia de 12 meses para usados foi revogada a
     01-01-2022 e o que o site disser vincula o vendedor (DL 84/2021 art. 43.º). */
  if (/garantia\s+(de\s+)?12\s*meses/i.test(h)) {
    mal(n, 'menciona «garantia de 12 meses» — revogada pelo DL 84/2021, a garantia legal é de 3 anos');
  }
  /* A plataforma ODR europeia foi revogada a 20-07-2025; ligar para lá é hoje
     mandar o consumidor a um sítio que já não existe. */
  if (/ec\.europa\.eu\/consumers\/odr|plataforma\s+(europeia\s+)?(de\s+)?resolução\s+de\s+litígios\s+em\s+linha/i.test(h)) {
    mal(n, 'refere a plataforma ODR europeia, desactivada em 20-07-2025');
  }
}

/* 12. dados das viaturas: os sete campos do DL 74/93, e sem repetições */
{
  const vistos = new Map();
  for (const f of readdirSync(join(RAIZ, 'data/viaturas')).filter((x) => x.endsWith('.json'))) {
    const v = JSON.parse(readFileSync(join(RAIZ, 'data/viaturas', f), 'utf8'));
    if (`${v.slug}.json` !== f) mal(`data/viaturas/${f}`, `o slug diz "${v.slug}" e o ficheiro chama-se outra coisa`);
    for (const c of ['matricula', 'preco', 'ano_construcao', 'mes_matricula', 'ano_matricula',
      'registos_anteriores', 'garantia_usado', 'garantia_fabrica']) {
      if (v[c] === undefined || v[c] === '' || v[c] === null) {
        mal(`data/viaturas/${f}`, `falta o campo ${c}, obrigatório pelo DL 74/93 art. 2.º n.º 1`);
      }
    }
    if (v.estado === 'vendida' && !v.data_venda) mal(`data/viaturas/${f}`, 'vendida sem data_venda');
    if (vistos.has(v.titulo)) aviso(`data/viaturas/${f}`, `título repetido com ${vistos.get(v.titulo)}`);
    else vistos.set(v.titulo, v.slug);
    for (const foto of v.fotos_origem) {
      if (!existsSync(join(RAIZ, '_fonte/originais', foto))) {
        mal(`data/viaturas/${f}`, `a fotografia de origem ${foto} não existe`);
      }
    }
  }
}

/* 13. indexação: só com domínio próprio */
{
  const temDominio = existsSync(join(SAIDA, 'CNAME'));
  const robots = readFileSync(join(SAIDA, 'robots.txt'), 'utf8');
  for (const f of paginas) {
    if (rel(f) === '/404.html') continue;
    const noindex = /<meta name="robots" content="noindex/.test(readFileSync(f, 'utf8'));
    if (temDominio && noindex) mal(rel(f), 'tem noindex apesar de haver domínio próprio');
    if (!temDominio && !noindex) mal(rel(f), 'sem noindex, e o site ainda está no endereço provisório');
  }
  if (temDominio !== robots.includes('Allow: /')) mal('robots.txt', 'não condiz com a existência de domínio');
}

/* 14. o sitemap cobre todas as páginas e nada a mais */
const mapa = readFileSync(join(SAIDA, 'sitemap.xml'), 'utf8');
const noMapa = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, v]) => new URL(v).pathname.slice(PREFIXO.length));
const noDisco = paginas.map((p) => rel(p).replace(/index\.html$/, '')).filter((p) => p !== '/404.html');
for (const p of noDisco) if (!noMapa.includes(p)) mal('sitemap.xml', `falta ${p}`);
for (const p of noMapa) if (!noDisco.includes(p)) mal('sitemap.xml', `${p} não existe`);

/* 15. peso da primeira página */
const inicio = readFileSync(join(SAIDA, 'index.html'), 'utf8');
const kb = (p) => Math.round(statSync(join(SAIDA, p)).size / 102.4) / 10;
console.log(`índice ${Math.round(inicio.length / 1024)} KB · css ${kb('assets/css/estilo.css')} KB · js ${kb('assets/js/site.js')} KB`);

console.log(`${paginas.length} páginas auditadas`);
if (avisos.length) { console.log('\nAvisos:'); avisos.forEach((a) => console.log('  ~ ' + a)); }
if (problemas.length) {
  console.log(`\n${problemas.length} problemas:`);
  problemas.forEach((p) => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('sem problemas');
