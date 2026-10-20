/* ==========================================================================
   NEWAUTO — gerador do site

   Node sem dependências, uma página HTML por viatura, saída para `_site/`.
   Não há framework porque não há nada aqui que precise de um: o conteúdo muda
   quando entra ou sai uma viatura, não a cada visita.

   Porquê pré-renderizar: os robôs de pré-visualização do WhatsApp, do Facebook
   e do Instagram **não executam JavaScript**, e é por aí que um stand partilha
   um carro que acabou de entrar.

   Correr:  node scripts/local.mjs     (constrói, audita e serve em localhost)
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, cpSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname, resolve, relative, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
/* A pasta de saída é configurável para o build de produção poder ser verificado
   sem destruir o build local: sem isto, correr o gerador sem `BASE=` antes de
   publicar deixava `_site/` cheio de caminhos `/NewAuto/...` que dão 404 em
   localhost — a página abria sem CSS nem JS e parecia vazia. */
const SAIDA = process.env.SAIDA ? resolve(process.env.SAIDA) : join(RAIZ, '_site');

/* ONDE O SITE VAI VIVER — e porque é que isto não está escrito à mão.

   Um site construído para a raiz mas servido num subdirectório fica sem CSS,
   sem navegação e com o sitemap rejeitado pelo Google. Já aconteceu noutro
   projecto e ninguém deu por isso durante dias.

   Aqui o prefixo e o endereço canónico derivam ambos de um único facto —
   existe ou não existe um ficheiro CNAME. Quando o stand tiver domínio,
   escreve-se o CNAME e mais nada muda. */
const REPO = 'NewAuto';
const DONO = 'renatovalente5';
const dominio = existsSync(join(RAIZ, 'CNAME'))
  ? readFileSync(join(RAIZ, 'CNAME'), 'utf8').trim()
  : null;

const BASE = (process.env.BASE ?? (dominio ? '' : `/${REPO}`)).replace(/\/$/, '');
const SITE = (process.env.SITE ?? (dominio ? `https://${dominio}` : `https://${DONO}.github.io`)).replace(/\/$/, '');

const u = (p) => `${BASE}/${String(p).replace(/^\//, '')}`;
const abs = (p) => `${SITE}${u(p)}`;

const ler = (p) => JSON.parse(readFileSync(join(RAIZ, p), 'utf8'));
const def = ler('data/definicoes.json');

const viaturas = readdirSync(join(RAIZ, 'data/viaturas'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ler(`data/viaturas/${f}`))
  .filter((v) => !v.oculta)
  .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));

const disponiveis = viaturas.filter((v) => v.estado !== 'vendida');
const vendidas = viaturas.filter((v) => v.estado === 'vendida')
  .sort((a, b) => String(b.data_venda).localeCompare(String(a.data_venda)));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* `useGrouping: 'always'` porque o pt-PT, por omissão, não separa os milhares
   de números com quatro algarismos: na mesma grelha liam-se «8900 €» e
   «15 900 €». A auditoria formata o preço exactamente com estas opções. */
const NF = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' });
const euros = (n) => NF.format(n);
const km = (n) => `${NF.format(n)} km`;
/* «Mercedes-Benz» partia-se no hífen e ficava «Mercedes-» sozinho numa linha.
   Para mostrar, o hífen passa a inquebrável; nos dados fica como está. */
const nb = (s) => esc(s).replace(/-/g, '\u2011');
const quantas = (n, negrito = false) => `${negrito ? `<b>${n}</b>` : n} ${n === 1 ? 'viatura' : 'viaturas'}`;
const mesAno = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

/* Cache busting pelo conteúdo: sem isto, quem já visitou fica com o CSS antigo
   depois de uma publicação e vê o site partido sem saber porquê. */
function versao(rel) {
  const h = createHash('sha1').update(readFileSync(join(RAIZ, rel))).digest('hex').slice(0, 8);
  return `${u(rel)}?v=${h}`;
}

/* ------------------------------------------------------- medidas de imagem */
/* As medidas lêem-se do próprio ficheiro, sem biblioteca: um <img> sem
   width/height faz a página saltar quando a fotografia chega, e a auditoria
   recusa publicá-lo. Antes, as fotografias que o dono do stand carregasse no
   backoffice saíam sem medidas — e a primeira viatura criada por ele teria
   travado a publicação do site inteiro. */
function medidas(caminho) {
  const fd = openSync(caminho, 'r');
  const b = Buffer.alloc(65536);
  const lidos = readSync(fd, b, 0, b.length, 0);
  closeSync(fd);
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const tipo = b.toString('ascii', 12, 16);
    if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (tipo === 'VP8L') {
      const n = b.readUInt32LE(21);
      return { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) };
    }
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < lidos - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
const LOGO = medidas(join(RAIZ, 'assets/img/logo-claro.png'));

/* ------------------------------------------------------------------ ícones */
/* Traço de 1,75 em 24 px, pontas redondas. Um só desenho para o site todo. */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const ic = {
  seta: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  esq: svg('<path d="M15 6l-6 6 6 6"/>'),
  dir: svg('<path d="M9 6l6 6-6 6"/>'),
  baixo: svg('<path d="M6 9l6 6 6-6"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  tel: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>'),
  mail: svg('<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/>'),
  pin: svg('<path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10.3" r="3"/>'),
  relogio: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>'),
  calendario: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  conta: svg('<path d="M4.6 17.5a8.5 8.5 0 1 1 14.8 0"/><path d="m12 13 3.6-4.2"/><circle cx="12" cy="13.4" r="1.2"/>'),
  bomba: svg('<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10"/><path d="M14 7h2.2a1.8 1.8 0 0 1 1.8 1.8V16a1.5 1.5 0 0 0 3 0V8.6L18 6"/>'),
  caixa: svg('<circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><path d="M6 7.6v8.8M12 7.6v8.8M6 12h12V7.6"/>'),
  motor: svg('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"/>'),
  lugares: svg('<path d="M7 4h4a2 2 0 0 1 2 2v7H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M5 13v2a2 2 0 0 0 2 2h9a2 2 0 0 1 2 2v1M9 17v3"/>'),
  escudo: svg('<path d="M12 21s-7.5-3.2-7.5-10V5.2L12 2.5l7.5 2.7V11c0 6.8-7.5 10-7.5 10Z"/><path d="m8.8 11.6 2.2 2.2 4.4-4.6"/>'),
  certo: svg('<path d="m5 12.5 4.2 4.2L19 7"/>'),
  troca: svg('<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>'),
  lupa: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>'),
  camara: svg('<path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.3"/>'),
  partilhar: svg('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5"/>'),
  filtros: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  ampliar: svg('<path d="M14.5 4H20v5.5M9.5 20H4v-5.5M20 4l-6.5 6.5M4 20l6.5-6.5"/>'),
  chave: svg('<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.8-8.8M16.5 6.5l2.5 2.5M14.5 8.5l2 2"/>'),
  documento: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  zap: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.92-4.28-5.07-4.48-.15-.2-1.21-1.61-1.21-3.07S6.76 7.1 7.02 6.8c.26-.29.56-.36.75-.36l.54.01c.17.01.41-.07.64.49.24.58.81 2.03.88 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.49l-.44.51c-.15.15-.3.31-.13.61.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.69-.18 1.38Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.02H7.9v-2.92h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.92h-2.34V22C18.34 21.24 22 17.08 22 12.06Z"/></svg>',
};

/* ------------------------------------------------------------ fotografias */
/* DUAS ORIGENS DE FOTOGRAFIA, e a razão é o backoffice.

   As viaturas de demonstração usam `fotos_origem`: ficheiros em
   `_fonte/originais/` que `scripts/imagens.py` converte em WebP de 207, 414 e
   828 px. Têm 414 px de origem — vieram das redes sociais —, por isso o 828 é
   uma ampliação feita com cuidado, e os cartões nunca pedem mais de 414.

   As que o dono do stand carrega no Pages CMS vão para `assets/viaturas/` e
   ficam listadas em `galeria`. A Action corre `imagens.py --galeria`, que tira
   delas 480, 960 e 1600 px para `assets/viaturas/_v/`. Se essas variantes não
   existirem, serve-se o original — com as medidas lidas do ficheiro. */
const USOS = {
  cartao: { demo: [207, 414], galeria: [480, 960] },
  galeria: { demo: [414, 828], galeria: [480, 960, 1600] },
  miniatura: { demo: [207], galeria: [480] },
};

/* O caminho gravado pelo backoffice pode vir com ou sem barra inicial, e com ou
   sem o nome do repositório à frente — depende da configuração do `media` à
   data em que a fotografia foi carregada. Aceitam-se as três formas. */
function caminhoGaleria(p) {
  let r = String(p).trim().replace(/^\/+/, '');
  if (r.startsWith(`${REPO}/`)) r = r.slice(REPO.length + 1);
  return r;
}

function nFotos(v) {
  return (v.galeria?.length ? v.galeria.length : v.fotos_origem?.length) || 0;
}

/* Tudo o que é preciso para desenhar a fotografia n (1, 2, …) de uma viatura. */
function fonteFoto(v, n, uso = 'galeria') {
  if (v.galeria?.length) {
    const rel = caminhoGaleria(v.galeria[n - 1]);
    const ficheiro = join(RAIZ, rel);
    const m = (existsSync(ficheiro) && medidas(ficheiro)) || { w: 1600, h: 1200 };
    const raiz = basename(rel, extname(rel));
    const variantes = USOS[uso].galeria
      .filter((w) => existsSync(join(RAIZ, `assets/viaturas/_v/${raiz}-${w}.webp`)))
      .map((w) => `${u(`assets/viaturas/_v/${raiz}-${w}.webp`)} ${Math.min(w, m.w)}w`);
    const jpg = existsSync(join(RAIZ, `assets/viaturas/_v/${raiz}-960.jpg`))
      ? u(`assets/viaturas/_v/${raiz}-960.jpg`) : u(rel);
    return { srcset: variantes.join(', '), src: jpg, w: m.w, h: m.h, grande: variantes.length ? variantes.at(-1).split(' ')[0] : u(rel) };
  }
  const base = `assets/viaturas/${v.slug}/${String(n).padStart(2, '0')}`;
  return {
    srcset: USOS[uso].demo.map((w) => `${u(`${base}-${w}.webp`)} ${w}w`).join(', '),
    src: u(`${base}-414.jpg`), w: 414, h: 414, grande: u(`${base}-828.webp`),
  };
}

function foto(v, n, { uso = 'galeria', sizes, prioritaria = false, alt = '', classe = '' }) {
  const f = fonteFoto(v, n, uso);
  const carregar = prioritaria ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<picture${classe ? ` class="${classe}"` : ''}>${f.srcset ? `<source type="image/webp" srcset="${f.srcset}" sizes="${sizes}">` : ''}<img src="${f.src}" alt="${esc(alt)}" width="${f.w}" height="${f.h}" ${carregar} decoding="async"></picture>`;
}

function urlPartilha(v) {
  if (v.galeria?.length) {
    const raiz = basename(caminhoGaleria(v.galeria[0]), extname(caminhoGaleria(v.galeria[0])));
    return existsSync(join(RAIZ, `assets/viaturas/_v/${raiz}-og.jpg`))
      ? abs(`assets/viaturas/_v/${raiz}-og.jpg`) : abs(caminhoGaleria(v.galeria[0]));
  }
  return abs(`assets/viaturas/${v.slug}/og.jpg`);
}

/* ---------------------------------------------------------------- contactos */
/* A lei obriga a indicar o custo da chamada sempre que se publica um número
   (DL 59/2021, art. 3.º, na redacção da Lei 14/2023). Uma constante só, para
   não haver um sítio onde alguém se esqueça. */
const NOTA_CHAMADA = '(Chamada para a rede móvel nacional)';
const TEL = `tel:+351${def.contactos.telefone}`;
const wa = (texto = '', numero = def.contactos.whatsapp) => `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
const MSG_GERAL = 'Olá! Vi o vosso site e gostava de saber mais.';
const ligarBtn = (classe = 'btn btn--secundario') => `<a class="${classe}" href="${TEL}">${ic.tel}<span>Ligar</span></a>`;
const zapBtn = (texto = MSG_GERAL, classe = 'btn btn--primario', rot = 'WhatsApp') => `<a class="${classe}" href="${wa(texto)}" target="_blank" rel="noopener">${ic.zap}<span>${rot}</span></a>`;

/* ------------------------------------------------------------- navegação */
const MENU = [
  { href: 'viaturas/', rot: 'Viaturas' },
  { href: 'sobre/', rot: 'Sobre nós' },
  { href: 'garantia/', rot: 'Garantia' },
  { href: 'contactos/', rot: 'Contactos' },
];

function cabecalho(pag) {
  const links = MENU.map(({ href, rot }) => {
    let act = '';
    if (pag === href) act = ' aria-current="page"';
    else if (pag.startsWith(href)) act = ' aria-current="true"';
    return `<a class="topo__link" href="${u(href)}"${act}>${rot}</a>`;
  }).join('');
  return `<a class="saltar" href="#principal">Saltar para o conteúdo</a>
<header class="topo" id="topo">
  <div class="topo__barra envolve">
    <a class="marca" href="${u('')}" aria-label="NewAuto — início">
      <img src="${u('assets/img/logo-claro.png')}" alt="NewAuto" width="${LOGO.w}" height="${LOGO.h}" fetchpriority="high">
    </a>
    <nav class="topo__nav" aria-label="Principal">${links}</nav>
    <div class="topo__accoes">
      ${zapBtn(MSG_GERAL, 'btn btn--fantasma topo__zap')}
      <a class="btn btn--primario topo__ligar" href="${TEL}" aria-label="Ligar para o stand">${ic.tel}<span>Ligar</span></a>
      <button class="hamburger" id="btn-menu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu"><span></span></button>
    </div>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav class="menu__corpo" aria-label="Menu">
    <a class="menu__link" href="${u('')}">Início</a>
    ${MENU.map(({ href, rot }) => `<a class="menu__link" href="${u(href)}">${rot}</a>`).join('')}
    <a class="menu__link" href="${u('vendidos/')}">Vendidos</a>
    <div class="menu__accoes">
      ${zapBtn(MSG_GERAL, 'btn btn--primario btn--g')}
      <a class="btn btn--fantasma btn--g" href="${TEL}">${ic.tel}<span>${esc(def.contactos.telefone_texto)}</span></a>
      <p class="nota-chamada">${NOTA_CHAMADA}</p>
    </div>
  </nav>
</div>`;
}

/* ----------------------------------------------------------------- rodapé */
/* A identificação do prestador — firma, endereço, correio electrónico e NIF — é
   imposta pelo artigo 10.º do DL 7/2004. Saiu do rodapé a pedido do cliente e
   vive na página de Termos e Condições, ligada aqui em todas as páginas; a
   auditoria confirma que essa página continua a ter os quatro elementos. */
function rodape() {
  const legais = [
    ['privacidade/', 'Política de privacidade'],
    ['cookies/', 'Cookies'],
    ['termos/', 'Termos e condições'],
    ['resolucao-de-litigios/', 'Resolução de litígios'],
  ];
  return `<footer class="rodape">
  <div class="envolve">
    <div class="rodape__grelha">
      <div class="rodape__marca">
        <img src="${u('assets/img/logo-claro.png')}" alt="NewAuto" width="${LOGO.w}" height="${LOGO.h}" loading="lazy">
        <div>
          <p class="rodape__frase">${esc(def.textos.assinatura)}</p>
          <p class="rodape__desde">${esc(def.local.localidade)} · desde ${def.empresa.desde}</p>
          <div class="rodape__redes">
            <a href="${esc(def.redes.instagram)}" target="_blank" rel="noopener" aria-label="Instagram da NewAuto">${ic.ig}</a>
            <a href="${esc(def.redes.facebook)}" target="_blank" rel="noopener" aria-label="Facebook da NewAuto">${ic.fb}</a>
            <a href="${wa(MSG_GERAL)}" target="_blank" rel="noopener" aria-label="WhatsApp da NewAuto">${ic.zap}</a>
          </div>
        </div>
      </div>
      <div>
        <h2 class="rodape__titulo">Stand</h2>
        <ul class="rodape__lista">
          <li><a href="${u('viaturas/')}">Viaturas em stock</a></li>
          <li><a href="${u('vendidos/')}">Vendidos</a></li>
          <li><a href="${u('sobre/')}">Sobre nós</a></li>
          <li><a href="${u('garantia/')}">Garantia</a></li>
        </ul>
      </div>
      <div>
        <h2 class="rodape__titulo">Contactos</h2>
        <ul class="rodape__lista rodape__contactos">
          <li>${ic.tel}<span><a href="${TEL}">${esc(def.contactos.telefone_texto)}</a><small>${NOTA_CHAMADA}</small></span></li>
          <li>${ic.zap}<span><a href="${wa(MSG_GERAL)}" target="_blank" rel="noopener">${esc(def.contactos.whatsapp_texto)}</a><small>WhatsApp ${NOTA_CHAMADA}</small></span></li>
          <li>${ic.pin}<span><a href="${esc(def.local.mapa)}" target="_blank" rel="noopener">${esc(def.local.morada)}<br>${esc(def.local.codigo_postal)} ${esc(def.local.localidade)}</a></span></li>
        </ul>
      </div>
    </div>
    <div class="rodape__legal">
      <p>&copy; ${new Date().getFullYear()} ${esc(def.empresa.nome)}</p>
      <ul>
        ${legais.map(([h, r]) => `<li><a href="${u(h)}">${r}</a></li>`).join('')}
        <li><a class="rodape__livro" href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener">${ic.documento}Livro de Reclamações</a></li>
        <li><a class="rodape__gestao" href="https://app.pagescms.org/${DONO}/${REPO}" target="_blank" rel="nofollow noopener">Gestão</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

/* O aviso foi pedido pelo cliente. Este site não instala cookies nenhum — a
   única coisa que pode carregar de terceiros é o mapa do Google, e só depois de
   a pessoa carregar no botão. Os dois botões têm exactamente o mesmo peso
   visual: um consentimento em que recusar custa mais do que aceitar não é livre. */
function avisoCookies() {
  return `<div class="cookies" id="cookies" hidden>
  <p><b>Não usamos cookies.</b> Só o mapa do Google, na página de contactos, precisa da sua autorização. <a href="${u('cookies/')}">Saber mais</a></p>
  <div class="cookies__botoes">
    <button class="btn btn--secundario" type="button" data-cookies="recusar">Recusar</button>
    <button class="btn btn--secundario" type="button" data-cookies="aceitar">Aceitar</button>
  </div>
</div>`;
}

/* --------------------------------------------------------------- esqueleto */
function pagina({ pag = '', titulo, descricao, corpo, jsonld = [], og, classe = '', naoIndexar = false, depois = '' }) {
  const url = abs(pag);
  const imagem = og ?? abs('assets/img/og.jpg');
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(def.empresa.nome)}">
<meta property="og:locale" content="pt_PT">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imagem)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#292929">
<link rel="icon" href="${u('assets/img/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${u('assets/img/favicon-96.png')}" sizes="96x96" type="image/png">
<link rel="apple-touch-icon" href="${u('assets/img/apple-touch-icon.png')}">
<script>document.documentElement.classList.add('js')</script>
<link rel="preload" href="${u('assets/fonts/saira.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${versao('assets/css/estilo.css')}">
${naoIndexar ? '<meta name="robots" content="noindex">' : ''}${dominio ? '' : '<!-- Enquanto o stand não tiver domínio, o site vive num endereço\n     provisório do GitHub. Deixá-lo indexar punha o Google a guardar o\n     endereço errado. Escrever o ficheiro CNAME faz esta linha desaparecer. -->\n<meta name="robots" content="noindex, nofollow">'}
<script type="speculationrules">{"prerender":[{"where":{"href_matches":"${BASE}/viaturas/*"},"eagerness":"moderate"}]}</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body class="${classe}">
${cabecalho(pag)}
<main id="principal">
${corpo}
</main>
${rodape()}
${depois}
${avisoCookies()}
<script src="${versao('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* --------------------------------------------------------- dados estruturados */
/* `AutoDealer` é o subtipo de LocalBusiness que a Google recomenda para stands.
   O tipo `VehicleListing` foi eliminado da Pesquisa a 09-09-2025, por isso não
   se implementa. Sem `openingHoursSpecification`, a pedido do cliente. */
const negocioLD = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  '@id': abs('#stand'),
  name: def.empresa.nome,
  legalName: def.empresa.nome_completo,
  description: def.empresa.actividade,
  url: abs(''),
  image: abs('assets/img/og.jpg'),
  logo: abs('assets/img/logo-claro.png'),
  telephone: `+351${def.contactos.telefone}`,
  vatID: `PT${def.empresa.nif}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: def.local.morada,
    postalCode: def.local.codigo_postal,
    addressLocality: def.local.localidade,
    addressRegion: def.local.distrito,
    addressCountry: 'PT',
  },
  geo: { '@type': 'GeoCoordinates', latitude: def.local.latitude, longitude: def.local.longitude },
  sameAs: [def.redes.instagram, def.redes.facebook].filter(Boolean),
  foundingDate: String(def.empresa.desde),
};

const migalhasLD = (itens) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: itens.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.nome,
    ...(it.href !== undefined ? { item: abs(it.href) } : {}),
  })),
});

const migalhas = (itens) => `<nav class="migalhas" aria-label="Migalhas">${itens.map((it, i) => (i < itens.length - 1
  ? `<a href="${u(it.href)}">${esc(it.nome)}</a>${ic.dir}`
  : `<span aria-current="page">${esc(it.nome)}</span>`)).join('')}</nav>`;

/* A faixa vermelha das histórias do Instagram da marca: um traço do «N» em ponto
   grande, com o padrão de setas tom-sobre-tom. Não é o logótipo redesenhado — é
   um paralelogramo ao ângulo dos traços dele, como o designer da marca usa. */
const FAIXA = '<div class="faixa" aria-hidden="true"><span class="faixa__traco"></span><span class="faixa__dobra"></span></div>';

/* ------------------------------------------------------------ componentes */
const dados = (v) => [String(v.ano_matricula), km(v.quilometros), v.combustivel, v.caixa];

function selo(v) {
  if (v.estado === 'vendida') return '<span class="selo selo--vendida">Vendida</span>';
  if (v.estado === 'reservada') return '<span class="selo selo--reservada">Reservada</span>';
  return '';
}

function cartao(v, i = 9, nivel = 3) {
  const vendida = v.estado === 'vendida';
  return `<article class="cartao${vendida ? ' cartao--vendida' : ''}" data-marca="${esc(v.marca)}"
  data-combustivel="${esc(v.combustivel)}" data-caixa="${esc(v.caixa)}" data-segmento="${esc(v.segmento)}"
  data-preco="${v.preco}" data-km="${v.quilometros}" data-ano="${v.ano_matricula}" data-ordem="${v.ordem ?? 999}">
  <a class="cartao__link" href="${u(`viaturas/${v.slug}/`)}">
    <div class="cartao__foto" style="view-transition-name: v-${esc(v.referencia)}">
      ${foto(v, 1, { uso: 'cartao', sizes: '(max-width: 599px) 46vw, (max-width: 1099px) 31vw, 300px', prioritaria: i < 2, alt: '' })}
      ${selo(v)}
      ${nFotos(v) > 1 ? `<span class="cartao__fotos">${ic.camara}${nFotos(v)}</span>` : ''}
    </div>
    <div class="cartao__corpo">
      <h${nivel} class="cartao__nome">${nb(v.marca)} ${nb(v.modelo)}<span class="cartao__versao">${esc(v.versao)}</span></h${nivel}>
      <ul class="cartao__dados">${dados(v).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
      <p class="cartao__preco">${vendida ? `Vendida em ${esc(mesAno(v.data_venda))}` : `${euros(v.preco)}&nbsp;&euro;`}</p>
    </div>
  </a>
</article>`;
}

/* ------------------------------------------------------- marcas em stock */
/* O slug tem de bater com o nome do ficheiro em assets/img/marcas/. */
function slugMarca(m) {
  return String(m).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/š/g, 's')
    .replace(/[^a-z0-9]/g, '');
}

/* As marcas saem de `disponiveis`: cada uma liga para `viaturas/?marca=X`, e
   uma marca sem viaturas faria o filtro ser ignorado e a montra mostrar tudo.

   MONOCROMÁTICO, e não é só estética: uma parede de emblemas nas cores da casa
   é o desenho que sugere pertença à rede oficial. O símbolo é pintado com
   `currentColor` através de `mask-image`, e só é pedido se a marca tiver stock.
   Se o ficheiro não existir (Alfa Romeo, Cupra…), fica só o nome. */
function secaoMarcas() {
  const conta = new Map();
  for (const v of disponiveis) conta.set(v.marca, (conta.get(v.marca) || 0) + 1);
  const marcas = [...conta.keys()].sort((a, b) => a.localeCompare(b, 'pt'));
  if (!marcas.length) return '';

  const itens = marcas.map((m) => {
    const rel = `assets/img/marcas/${slugMarca(m)}.svg`;
    const temSimbolo = existsSync(join(RAIZ, rel));
    return `<li class="marcas__item">
        <a class="marcas__ligacao" href="${u(`viaturas/?marca=${encodeURIComponent(m)}`)}">
          ${temSimbolo ? `<span class="marcas__simbolo" style="--simbolo:url('${u(rel)}')"></span>` : ''}
          <span class="marcas__nome">${esc(m)}</span>
          <span class="marcas__n">${conta.get(m)}</span>
        </a>
      </li>`;
  }).join('');

  return `<section class="secao secao--marcas">
  <div class="envolve">
    <div class="cabeca">
      <h2 class="h-secao">Escolha pela marca</h2>
    </div>
    <!-- Dois elementos e não um: o div é o que rola e o ul é o que desliza.
         O scroll de um contentor só assenta em pixéis inteiros; a fracção vai num
         transform do ul. Só gira quando as marcas não cabem — ver site.js, bloco 7. -->
    <div class="marcas" id="marcas" tabindex="0" role="group" aria-label="Marcas com viaturas em stock">
      <ul class="marcas__pista" id="marcas-pista" role="list">${itens}</ul>
    </div>
    <!-- Tem de ficar junto dos símbolos: o que a lei censura é dar a impressão de
         ser concessionário autorizado (DL 57/2008 art. 8.º al. d), CPI art. 254.º),
         e um aviso noutra página não corrige o que se lê nesta. -->
    <p class="nota-chamada marcas__aviso">(Stand independente: não somos concessionário autorizado de nenhuma destas marcas.)</p>
  </div>
</section>`;
}

/* -------------------------------------------- pedidos pelo WhatsApp */
/* Retoma e procura: o formulário não envia nada a ninguém. Compõe a mensagem e
   abre o WhatsApp de quem está a ver, que é quem a manda. Não há servidor que
   possa avariar em silêncio, nem dados guardados — e sem JavaScript a ligação
   abre o WhatsApp com uma mensagem genérica. */
function secaoPedidos() {
  const retoma = 'Olá! Gostava de uma avaliação do meu carro para retoma.';
  const procura = 'Olá! Procuro um carro e não o encontrei no site.';
  return `<section class="secao secao--pedidos" id="pedidos">
  <div class="envolve pedidos">
    <form class="pedido" data-pedido="retoma" action="${wa(retoma)}" method="get" target="_blank" rel="noopener">
      <span class="pedido__icone">${ic.troca}</span>
      <h2 class="pedido__titulo">Tens um carro para dar na troca?</h2>
      <p class="pedido__texto">Diz-nos qual é. Respondemos com uma proposta de retoma.</p>
      <div class="pedido__campos">
        <label class="campo campo--largo"><span>Marca e modelo</span><input name="carro" autocomplete="off" placeholder="Ex.: Renault Clio" required></label>
        <label class="campo"><span>Ano</span><input name="ano" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="2016"></label>
        <label class="campo"><span>Quilómetros</span><input name="km" inputmode="numeric" placeholder="120 000"></label>
      </div>
      <button class="btn btn--primario btn--g" type="submit">${ic.zap}<span>Pedir avaliação</span></button>
    </form>
    <form class="pedido pedido--claro" data-pedido="procura" action="${wa(procura)}" method="get" target="_blank" rel="noopener">
      <span class="pedido__icone">${ic.lupa}</span>
      <h2 class="pedido__titulo">Não encontras o que procuras?</h2>
      <p class="pedido__texto">Diz-nos o carro e o orçamento. Procuramos por ti.</p>
      <div class="pedido__campos">
        <label class="campo campo--largo"><span>Que carro procuras</span><input name="carro" autocomplete="off" placeholder="Ex.: carrinha automática" required></label>
        <label class="campo campo--largo"><span>Orçamento até</span><input name="orcamento" inputmode="numeric" placeholder="15 000 €"></label>
      </div>
      <button class="btn btn--escuro btn--g" type="submit">${ic.zap}<span>Enviar pedido</span></button>
    </form>
  </div>
</section>`;
}

/* ------------------------------------------------------------ o horário */
function horario() {
  return `<dl class="horario" data-horario='${esc(JSON.stringify(def.horario.estruturado || []))}'>
    ${def.horario.linhas.map((h) => `<div><dt>${esc(h.dias)}</dt><dd>${esc(h.horas)}</dd></div>`).join('')}
  </dl>
  <p class="estado-agora" id="estado-agora" hidden></p>`;
}

/* ------------------------------------------------- os quadros «VENDIDO» */
/* O stand publica um quadro por carro vendido. São deles, feitos pelo designer
   da marca; usam-se só os que não mostram pessoas. */
function quadros(n = 6) {
  const pasta = join(RAIZ, 'assets/img/vendidos');
  if (!existsSync(pasta)) return '';
  const lista = readdirSync(pasta).filter((f) => f.endsWith('-414.webp')).sort().slice(0, n);
  if (!lista.length) return '';
  return `<ul class="quadros" role="list">${lista.map((f) => {
    const b = f.replace('-414.webp', '');
    return `<li><picture><source type="image/webp" srcset="${u(`assets/img/vendidos/${b}-207.webp`)} 207w, ${u(`assets/img/vendidos/${f}`)} 414w" sizes="(max-width: 599px) 42vw, 200px"><img src="${u(`assets/img/vendidos/${b}-414.jpg`)}" alt="Quadro «Vendido» de uma viatura entregue pela NewAuto" width="414" height="414" loading="lazy" decoding="async"></picture></li>`;
  }).join('')}</ul>`;
}

/* ---------------------------------------------------------------- páginas */
function paginaInicial() {
  /* Oito: duas filas inteiras de quatro no computador, quatro de duas no
     telemóvel. Primeiro as que o stand marcou como destaque. */
  const lista = [...disponiveis.filter((v) => v.destaque), ...disponiveis.filter((v) => !v.destaque)].slice(0, 8);
  const n = disponiveis.length;

  const corpo = `
<section class="capa">
  ${FAIXA}
  <div class="envolve capa__interior">
    <p class="capa__sobre">${esc(def.textos.reclamo)}</p>
    <h1 class="capa__titulo">${esc(def.textos.hero_titulo)}</h1>
    <p class="capa__texto">${quantas(n)} em stock. ${esc(def.textos.hero_texto)}</p>
    <div class="capa__accoes">
      <a class="btn btn--primario btn--g" href="${u('viaturas/')}">Ver ${n === 1 ? 'a viatura' : `as ${n} viaturas`} ${ic.seta}</a>
      ${zapBtn(MSG_GERAL, 'btn btn--fantasma btn--g')}
    </div>
    <ul class="capa__selos" role="list">
      <li>${ic.conta}Quilometragem certificada</li>
      <li>${ic.escudo}Garantia legal de 3 anos</li>
      <li>${ic.troca}Aceitamos retoma</li>
    </ul>
  </div>
</section>

<section class="secao secao--stock">
  <div class="envolve">
    <div class="cabeca">
      <h2 class="h-secao">Acabados de chegar</h2>
      <a class="ligacao" href="${u('viaturas/')}">Ver todas e filtrar ${ic.seta}</a>
    </div>
    <div class="grelha">${lista.map((v, i) => cartao(v, i)).join('')}</div>
  </div>
</section>

${secaoMarcas()}

${secaoPedidos()}

${existsSync(join(RAIZ, 'assets/img/vendidos')) ? `<section class="secao secao--obrigado">
  <div class="envolve">
    <div class="cabeca">
      <div>
        <h2 class="h-secao">Obrigado pela confiança</h2>
        <p class="cabeca__texto">Desde ${def.empresa.desde}, centenas de carros entregues.</p>
      </div>
      <a class="ligacao" href="${u('vendidos/')}">Ver vendidos ${ic.seta}</a>
    </div>
    ${quadros(6)}
  </div>
</section>` : ''}

<section class="secao secao--visita">
  <div class="envolve visita">
    <div class="visita__texto">
      <h2 class="h-secao">Vem ver ao vivo</h2>
      <p class="visita__morada">${ic.pin}<span>${esc(def.local.morada)}<br>${esc(def.local.codigo_postal)} ${esc(def.local.localidade)}, ${esc(def.local.concelho)}</span></p>
      <div class="visita__accoes">
        <a class="btn btn--escuro" href="${esc(def.local.mapa)}" target="_blank" rel="noopener">${ic.pin}<span>Como chegar</span></a>
        <a class="btn btn--secundario" href="${TEL}">${ic.tel}<span>${esc(def.contactos.telefone_texto)}</span></a>
      </div>
      <p class="nota-chamada">${NOTA_CHAMADA}</p>
    </div>
    <div class="visita__horario">
      <h3 class="h-bloco">${ic.relogio}Horário</h3>
      ${horario()}
    </div>
  </div>
</section>`;

  return pagina({
    pag: '',
    titulo: 'NewAuto — Carros usados em Paços de Brandão',
    descricao: `Stand de automóveis usados em Paços de Brandão, Santa Maria da Feira. ${quantas(n)} com quilometragem certificada e garantia legal de 3 anos.`,
    corpo,
    classe: 'pagina-inicial',
    jsonld: [negocioLD, {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: def.empresa.nome, alternateName: 'NewAuto Comércio Automóvel',
      url: abs(''), inLanguage: 'pt-PT', publisher: { '@id': abs('#stand') },
    }],
  });
}

/* --------------------------------------------------------------- montra */
/* Uma faceta com um só valor não filtra nada — com o stock todo a gasóleo, o
   grupo «Combustível» era um botão que não mudava nada. Só aparece quando há
   pelo menos duas opções. */
function facetas(lista) {
  const grupo = (titulo, chave) => {
    const m = new Map();
    for (const v of lista) m.set(v[chave], (m.get(v[chave]) || 0) + 1);
    if (m.size < 2) return '';
    const vals = [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'pt'));
    return `<fieldset class="filtro">
      <legend>${titulo}</legend>
      <div class="filtro__opcoes">${vals.map(([val, n]) => `<label class="chip"><input type="checkbox" name="${chave}" value="${esc(val)}"><span>${esc(val)}</span><b data-n>${n}</b></label>`).join('')}</div>
    </fieldset>`;
  };
  return grupo('Marca', 'marca') + grupo('Tipo', 'segmento') + grupo('Combustível', 'combustivel') + grupo('Caixa', 'caixa');
}

/* O passo do cursor tem de dividir o intervalo, senão o browser encaixa o valor
   inicial no degrau abaixo e a viatura mais cara fica escondida por omissão.
   Arredondar as pontas ao passo resolve. */
function cursor({ id, nome, titulo, valores, passo, formato }) {
  if (valores.length < 2) return '';
  const min = Math.floor(Math.min(...valores) / passo) * passo;
  const max = Math.ceil(Math.max(...valores) / passo) * passo;
  if (min === max) return '';
  return `<fieldset class="filtro">
      <legend>${titulo}</legend>
      <input class="cursor" type="range" id="${id}" name="${nome}" min="${min}" max="${max}" value="${max}" step="${passo}" data-formato="${formato}" aria-describedby="${id}-saida">
      <output class="cursor__saida" for="${id}" id="${id}-saida">${formato === 'euros' ? `${euros(max)} €` : km(max)}</output>
    </fieldset>`;
}

function paginaViaturas() {
  const n = disponiveis.length;
  const corpo = `
<section class="cabeca-pagina">
  ${FAIXA}
  <div class="envolve">
    ${migalhas([{ nome: 'Início', href: '' }, { nome: 'Viaturas' }])}
    <h1 class="h-pagina">Viaturas em stock</h1>
    <p class="cabeca-pagina__texto">Preços finais, com IVA incluído. Garantia legal de 3 anos em todas.</p>
  </div>
</section>

<section class="secao secao--montra">
  <div class="envolve montra">
    <aside class="montra__lado" id="lado-filtros" aria-label="Filtros">
      <form class="filtros" id="filtros">
        <div class="filtros__topo">
          <h2>Filtrar</h2>
          <button class="ligacao" type="button" id="limpar" hidden>Limpar</button>
        </div>
        ${facetas(disponiveis)}
        ${cursor({ id: 'preco-max', nome: 'ate', titulo: 'Preço até', valores: disponiveis.map((v) => v.preco), passo: 500, formato: 'euros' })}
        ${cursor({ id: 'km-max', nome: 'km', titulo: 'Quilómetros até', valores: disponiveis.map((v) => v.quilometros), passo: 10000, formato: 'km' })}
      </form>
    </aside>

    <div class="montra__lista">
      <div class="montra__barra">
        <p class="contagem" id="contagem" role="status">${quantas(n, true)}</p>
        <button class="btn btn--secundario btn--filtros" type="button" id="btn-filtros" hidden>${ic.filtros}<span>Filtros</span><b id="n-filtros" hidden></b></button>
        <label class="ordenar"><span>Ordenar</span>
          <select id="ordem">
            <option value="ordem">Mais recentes</option>
            <option value="preco-asc">Preço mais baixo</option>
            <option value="preco-desc">Preço mais alto</option>
            <option value="km-asc">Menos quilómetros</option>
            <option value="ano-desc">Mais novos</option>
          </select>
        </label>
      </div>
      <div class="activos" id="activos" hidden></div>
      <div class="grelha grelha--montra" id="grelha">
        ${disponiveis.map((v, i) => cartao(v, i, 2)).join('')}
      </div>
      <div class="vazio" id="vazio" hidden>
        <p class="vazio__titulo">Nenhuma viatura com estes filtros.</p>
        <p>Diz-nos o que procuras — se não estiver no stand, procuramos por ti.</p>
        <div class="vazio__accoes">
          <button class="btn btn--secundario" type="button" id="limpar-2">Limpar filtros</button>
          ${zapBtn('Olá! Procuro um carro e não o encontrei no site.', 'btn btn--primario', 'Pedir pelo WhatsApp')}
        </div>
      </div>
    </div>
  </div>
</section>`;

  const folha = `<dialog class="folha" id="folha" aria-labelledby="folha-titulo">
  <div class="folha__topo">
    <h2 id="folha-titulo">Filtros</h2>
    <button class="folha__fechar" type="button" data-fechar aria-label="Fechar os filtros">${ic.x}</button>
  </div>
  <div class="folha__corpo" id="folha-corpo"></div>
  <div class="folha__base">
    <button class="btn btn--secundario" type="button" id="folha-limpar">Limpar</button>
    <button class="btn btn--primario" type="button" data-fechar id="folha-ver">Ver ${n} viaturas</button>
  </div>
</dialog>`;

  return pagina({
    pag: 'viaturas/',
    titulo: 'Viaturas usadas em stock | NewAuto, Paços de Brandão',
    descricao: `${n} viaturas usadas em stock no NewAuto, em Paços de Brandão: ${[...new Set(disponiveis.map((v) => v.marca))].slice(0, 5).join(', ')} e mais. Preços finais, garantia legal de 3 anos.`,
    corpo,
    depois: folha,
    classe: 'pagina-montra',
    jsonld: [
      migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Viaturas' }]),
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'Viaturas em stock', numberOfItems: n,
        itemListElement: disponiveis.map((v, i) => ({
          '@type': 'ListItem', position: i + 1,
          url: abs(`viaturas/${v.slug}/`), name: v.titulo,
        })),
      },
    ],
  });
}

/* ------------------------------------------------------------ ficha */
/* A ficha técnica, por grupos. Os sete campos do DL 74/93 estão todos aqui; o
   ano de construção e a data da matrícula vão numa linha só, «Ano», mas os dois
   lá estão — a auditoria confirma-o em cada ficha. */
const FICHA = [
  ['Registo', [
    ['Matrícula', (v) => v.matricula],
    ['Ano', (v) => `${v.ano_construcao} (matrícula ${v.mes_matricula}/${v.ano_matricula})`],
    ['Quilómetros', (v) => km(v.quilometros)],
    ['Registos anteriores', (v) => v.registos_anteriores],
    ['Origem', (v) => v.origem],
    ['Livro de revisões', (v) => (v.livro_revisoes ? 'Completo' : '')],
  ]],
  ['Motor', [
    ['Combustível', (v) => v.combustivel],
    ['Potência', (v) => (v.potencia_cv ? `${v.potencia_cv} cv` : '')],
    ['Cilindrada', (v) => (v.cilindrada_cc ? `${euros(v.cilindrada_cc)} cm³` : '')],
    ['Caixa', (v) => v.caixa],
  ]],
  ['Carroçaria', [
    ['Tipo', (v) => v.segmento],
    ['Portas', (v) => v.portas],
    ['Lugares', (v) => v.lugares],
    ['Cor', (v) => v.cor],
  ]],
  ['Garantia', [
    ['Garantia', (v) => v.garantia_usado],
    ['Garantia de fábrica', (v) => v.garantia_fabrica],
  ]],
];

/* As semelhantes: o mesmo tipo de carro primeiro, e depois o preço mais perto. */
function semelhantes(v, n = 4) {
  return disponiveis.filter((x) => x.slug !== v.slug)
    .map((x) => [x, (x.segmento === v.segmento ? 0 : 1) * 1e6 + Math.abs(x.preco - v.preco)])
    .sort((a, b) => a[1] - b[1]).slice(0, n).map(([x]) => x);
}

function paginaViatura(v) {
  const vendida = v.estado === 'vendida';
  const total = nFotos(v);
  const url = abs(`viaturas/${v.slug}/`);
  const nome = `${v.marca} ${v.modelo}`;
  const msg = `Olá! Tenho interesse no ${v.titulo} de ${v.ano_matricula} (ref. ${v.referencia}). Ainda está disponível? ${url}`;
  const msgVisita = `Olá! Gostava de marcar uma visita para ver o ${v.titulo} (ref. ${v.referencia}).`;
  const grupos = FICHA.map(([t, linhas]) => [t, linhas.map(([k, f]) => [k, f(v)]).filter(([, val]) => val !== '' && val != null)])
    .filter(([, l]) => l.length);

  const factos = [
    [ic.calendario, 'Ano', String(v.ano_matricula)],
    [ic.conta, 'Quilómetros', km(v.quilometros)],
    [ic.bomba, 'Combustível', v.combustivel],
    [ic.caixa, 'Caixa', v.caixa],
    [ic.motor, 'Potência', v.potencia_cv ? `${v.potencia_cv} cv` : ''],
    [ic.lugares, 'Lugares', v.lugares ? String(v.lugares) : ''],
  ].filter(([, , val]) => val);

  const slides = Array.from({ length: total }, (_, k) => `<li class="galeria__slide" id="foto-${k + 1}">
        <button class="galeria__ampliar" type="button" data-ampliar="${k}" aria-label="Ampliar a fotografia ${k + 1} de ${total}">
          ${foto(v, k + 1, { uso: 'galeria', sizes: '(max-width: 1023px) 100vw, 760px', prioritaria: k === 0, alt: k === 0 ? `${v.titulo}, ${v.cor}` : `${v.titulo} — fotografia ${k + 1}` })}
        </button>
      </li>`).join('');

  const grandes = Array.from({ length: total }, (_, k) => {
    const f = fonteFoto(v, k + 1, 'galeria');
    return { s: f.srcset, f: f.src, w: f.w, h: f.h, m: v.galeria?.length ? Math.min(1600, f.w) : 828 };
  });

  const corpo = `
<section class="secao secao--ficha">
  <div class="envolve">
    ${migalhas([{ nome: 'Início', href: '' }, { nome: 'Viaturas', href: 'viaturas/' }, { nome }])}

    <div class="ficha">
      <div class="ficha__galeria">
        <div class="galeria" id="galeria">
          <div class="galeria__palco" style="view-transition-name: v-${esc(v.referencia)}">
            <ul class="galeria__pista" id="galeria-pista" role="list" tabindex="0" aria-label="Fotografias da viatura">${slides}</ul>
            ${selo(v)}
            ${total > 1 ? `<button class="galeria__nav galeria__nav--ant" type="button" data-passo="-1" aria-label="Fotografia anterior">${ic.esq}</button>
            <button class="galeria__nav galeria__nav--seg" type="button" data-passo="1" aria-label="Fotografia seguinte">${ic.dir}</button>
            <p class="galeria__conta" aria-hidden="true"><b id="galeria-actual">1</b> / ${total}</p>` : ''}
          </div>
          ${total > 1 ? `<ul class="galeria__miniaturas" role="list">${Array.from({ length: total }, (_, k) => `<li><a href="#foto-${k + 1}" data-ir="${k}" aria-label="Ver a fotografia ${k + 1}"${k === 0 ? ' aria-current="true"' : ''}>${foto(v, k + 1, { uso: 'miniatura', sizes: '96px', alt: '' })}</a></li>`).join('')}</ul>` : ''}
        </div>
      </div>

      <aside class="ficha__lado">
        <div class="painel">
          <p class="painel__ref">Ref. ${esc(v.referencia)}</p>
          <h1 class="painel__titulo">${nb(nome)}<span>${esc(v.versao)}</span></h1>
          <ul class="painel__dados">${dados(v).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
          ${vendida
      ? `<p class="painel__preco painel__preco--vendida">Vendida</p>
          <p class="painel__nota">Esta viatura foi vendida em ${esc(mesAno(v.data_venda))}. Temos outras parecidas em stock.</p>
          <a class="btn btn--primario btn--g" href="${u('viaturas/')}">Ver viaturas em stock ${ic.seta}</a>`
      : `<p class="painel__preco">${euros(v.preco)}&nbsp;&euro;</p>
          <p class="painel__nota">Preço final, IVA incluído.${v.estado === 'reservada' ? ' Neste momento está <b>reservada</b>.' : ''}</p>
          <div class="painel__accoes">
            ${zapBtn(msg, 'btn btn--primario btn--g', 'Falar no WhatsApp')}
            <a class="btn btn--secundario btn--g" href="${TEL}">${ic.tel}<span>Ligar ${esc(def.contactos.telefone_texto)}</span></a>
          </div>
          <p class="nota-chamada">${NOTA_CHAMADA}</p>
          <div class="painel__extra">
            <a class="ligacao" href="${wa(msgVisita)}" target="_blank" rel="noopener">${ic.calendario}Marcar visita</a>
            <button class="ligacao" type="button" id="partilhar" data-titulo="${esc(`${v.titulo} — NewAuto`)}" data-url="${esc(url)}" hidden>${ic.partilhar}Partilhar</button>
          </div>`}
          <ul class="painel__confianca" role="list">
            <li>${ic.escudo}<span>Garantia legal de 3 anos</span></li>
            <li>${ic.conta}<span>Quilometragem certificada</span></li>
            ${v.aceita_retoma && !vendida ? `<li>${ic.troca}<span>Aceitamos o teu carro na troca</span></li>` : ''}
          </ul>
        </div>
      </aside>

      <div class="ficha__info">
        <ul class="factos" role="list">${factos.map(([i, k, val]) => `<li>${i}<span>${esc(k)}</span><b>${esc(val)}</b></li>`).join('')}</ul>

        ${v.descricao ? `<section class="bloco">
          <h2 class="h-bloco">Sobre esta viatura</h2>
          <p class="bloco__texto">${esc(v.descricao)}</p>
        </section>` : ''}

        ${v.equipamento?.length ? `<section class="bloco">
          <h2 class="h-bloco">Equipamento</h2>
          <ul class="equipamento" role="list">${v.equipamento.map((e) => `<li>${ic.certo}${esc(e)}</li>`).join('')}</ul>
        </section>` : ''}

        <section class="bloco">
          <h2 class="h-bloco">Ficha técnica</h2>
          <div class="tabelas">
            ${grupos.map(([t, linhas]) => `<div class="tabela${t === 'Garantia' ? ' tabela--larga' : ''}">
              <h3>${esc(t)}</h3>
              <dl>${linhas.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>
            </div>`).join('')}
          </div>
          <p class="aviso">As informações desta página têm natureza informativa e não constituem proposta contratual. A venda é feita nas nossas instalações, onde todos os elementos podem ser confirmados.</p>
        </section>
      </div>
    </div>

    <section class="semelhantes">
      <div class="cabeca">
        <h2 class="h-secao">${vendida ? 'Em stock agora' : 'Também te pode interessar'}</h2>
        <a class="ligacao" href="${u('viaturas/')}">Ver todas ${ic.seta}</a>
      </div>
      <div class="grelha">${semelhantes(v).map((x, k) => cartao(x, k + 9, 3)).join('')}</div>
    </section>
  </div>
</section>`;

  const depois = `${vendida ? '' : `<div class="barra-fixa" id="barra-fixa">
  <p class="barra-fixa__preco"><span>${esc(nome)}</span><b>${euros(v.preco)}&nbsp;&euro;</b></p>
  <a class="btn btn--secundario btn--icone" href="${TEL}" aria-label="Ligar para o stand">${ic.tel}</a>
  ${zapBtn(msg, 'btn btn--primario', 'WhatsApp')}
</div>`}
<dialog class="lightbox" id="lightbox" aria-label="Fotografias de ${esc(nome)}">
  <ul class="lightbox__pista" id="lightbox-pista" role="list"></ul>
  <button class="lightbox__fechar" type="button" data-fechar aria-label="Fechar">${ic.x}</button>
  <button class="lightbox__nav lightbox__nav--ant" type="button" data-passo="-1" aria-label="Fotografia anterior">${ic.esq}</button>
  <button class="lightbox__nav lightbox__nav--seg" type="button" data-passo="1" aria-label="Fotografia seguinte">${ic.dir}</button>
  <p class="lightbox__conta" id="lightbox-conta"></p>
</dialog>
<script type="application/json" id="fotos-viatura">${JSON.stringify(grandes).replace(/</g, '\\u003c')}</script>`;

  /* `Car` com `offers`. Não produz resultado enriquecido — a Google eliminou o
     tipo de anúncio de veículo em Setembro de 2025 —, mas desambigua a entidade.
     O preço está visível na página, que é a condição para o poder marcar. */
  const carroLD = {
    '@context': 'https://schema.org', '@type': 'Car',
    name: v.titulo, brand: { '@type': 'Brand', name: v.marca }, model: v.modelo,
    vehicleModelDate: String(v.ano_construcao),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.quilometros, unitCode: 'KMT' },
    fuelType: v.combustivel, vehicleTransmission: v.caixa, color: v.cor,
    numberOfDoors: v.portas, vehicleSeatingCapacity: v.lugares,
    ...(v.potencia_cv ? { vehicleEngine: { '@type': 'EngineSpecification', enginePower: { '@type': 'QuantitativeValue', value: v.potencia_cv, unitCode: 'BHP' } } } : {}),
    itemCondition: 'https://schema.org/UsedCondition',
    image: Array.from({ length: total }, (_, k) => SITE + fonteFoto(v, k + 1).src),
    offers: {
      '@type': 'Offer', price: v.preco, priceCurrency: 'EUR',
      availability: vendida ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: { '@id': abs('#stand') },
      url,
    },
  };

  /* O preço só pode ir marcado se estiver visível. Numa vendida não está — o
     painel diz «Vendida» —, e por isso o `Car` vai sem `offers` nenhum. */
  if (vendida) delete carroLD.offers;

  const longo = `${v.titulo} ${v.ano_matricula} | NewAuto`;
  return pagina({
    pag: `viaturas/${v.slug}/`,
    titulo: longo.length <= 60 ? longo : `${nome} ${v.versao.split(' ')[0]} ${v.ano_matricula} | NewAuto`,
    descricao: `${v.titulo} de ${v.ano_matricula}, ${km(v.quilometros)}, ${v.combustivel.toLowerCase()}, caixa ${v.caixa.toLowerCase()}. ${vendida ? 'Vendida.' : `${euros(v.preco)} € no NewAuto, Paços de Brandão.`}`,
    corpo,
    depois,
    classe: `pagina-ficha${vendida ? ' pagina-ficha--vendida' : ''}`,
    og: urlPartilha(v),
    jsonld: [carroLD, migalhasLD([
      { nome: 'Início', href: '' }, { nome: 'Viaturas', href: 'viaturas/' }, { nome: v.titulo },
    ])],
  });
}

function paginaVendidos() {
  const corpo = `
<section class="cabeca-pagina">
  ${FAIXA}
  <div class="envolve">
    ${migalhas([{ nome: 'Início', href: '' }, { nome: 'Vendidos' }])}
    <h1 class="h-pagina">Vendidos</h1>
    <p class="cabeca-pagina__texto">O que já saiu do stand. Entram viaturas novas todas as semanas.</p>
  </div>
</section>
<section class="secao">
  <div class="envolve">
    ${vendidas.length
    ? `<div class="grelha">${vendidas.map((v, i) => cartao(v, i, 2)).join('')}</div>`
    : '<p class="vazio__titulo">Ainda não há viaturas marcadas como vendidas.</p>'}
    ${existsSync(join(RAIZ, 'assets/img/vendidos')) ? `<div class="cabeca cabeca--espaco"><h2 class="h-secao">Obrigado pela confiança</h2></div>${quadros(6)}` : ''}
    <div class="faixa-cta">
      <p>Procuras alguma coisa parecida?</p>
      <div class="faixa-cta__accoes">
        <a class="btn btn--primario" href="${u('viaturas/')}">Ver viaturas em stock ${ic.seta}</a>
        ${zapBtn('Olá! Procuro um carro parecido com um dos que venderam.', 'btn btn--secundario')}
      </div>
    </div>
  </div>
</section>`;
  return pagina({
    pag: 'vendidos/',
    titulo: 'Viaturas vendidas | NewAuto',
    descricao: 'Viaturas já vendidas pelo NewAuto, em Paços de Brandão. Entram viaturas novas em stock todas as semanas.',
    corpo,
    jsonld: [migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Vendidos' }])],
  });
}

function paginaSobre() {
  const corpo = `
<section class="sobre-capa">
  ${FAIXA}
  <div class="envolve">
    ${migalhas([{ nome: 'Início', href: '' }, { nome: 'Sobre nós' }])}
    <p class="capa__sobre">Quem somos</p>
    <h1 class="sobre-capa__titulo">${esc(def.textos.sobre_titulo)}</h1>
  </div>
</section>

<section class="secao">
  <div class="envolve sobre">
    <div class="sobre__texto">
      <p class="bloco__texto bloco__texto--g">${esc(def.textos.sobre_texto)}</p>
      <p class="assinatura">${esc(def.textos.assinatura)}</p>
    </div>
    <ul class="numeros" role="list">
      <li><b>${def.empresa.desde}</b><span>no mercado desde</span></li>
      <li><b>${disponiveis.length}</b><span>viaturas em stock agora</span></li>
      <li><b>3 anos</b><span>de garantia legal em todas</span></li>
    </ul>
  </div>
</section>

<section class="secao secao--valores">
  <div class="envolve">
    <ul class="valores" role="list">
      <li>${ic.conta}<h2>Quilometragem certificada</h2><p>Os quilómetros de cada viatura são verificados antes de ela entrar no stand.</p></li>
      <li>${ic.documento}<h2>Transparência</h2><p>Preço final à vista, ficha completa e o estado de cada carro explicado antes da compra.</p></li>
      <li>${ic.escudo}<h2>Garantia legal de 3 anos</h2><p>A garantia de conformidade do Decreto-Lei n.º 84/2021, em todas as viaturas usadas que vendemos.</p></li>
    </ul>
  </div>
</section>

${existsSync(join(RAIZ, 'assets/img/vendidos')) ? `<section class="secao secao--obrigado">
  <div class="envolve">
    <div class="cabeca"><h2 class="h-secao">Obrigado pela confiança</h2></div>
    ${quadros(6)}
  </div>
</section>` : ''}

<section class="secao">
  <div class="envolve">
    <div class="faixa-cta">
      <p>Vem conhecer-nos a ${esc(def.local.localidade)}.</p>
      <div class="faixa-cta__accoes">
        <a class="btn btn--primario" href="${u('viaturas/')}">Ver as viaturas ${ic.seta}</a>
        <a class="btn btn--secundario" href="${u('contactos/')}">${ic.pin}<span>Onde estamos</span></a>
      </div>
    </div>
  </div>
</section>`;
  return pagina({
    pag: 'sobre/',
    titulo: 'Sobre nós | NewAuto, Paços de Brandão',
    descricao: `A NewAuto é um stand de automóveis usados em Paços de Brandão, no mercado desde ${def.empresa.desde}. Quilometragem certificada e garantia legal de 3 anos.`,
    corpo,
    jsonld: [negocioLD, migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Sobre nós' }])],
  });
}

/* O mapa só carrega depois de a pessoa autorizar: o embed do Google instala
   cookies antes de qualquer interacção, e o consentimento tem de ser prévio
   (artigo 5.º da Lei 41/2004). */
function mapa() {
  const q = encodeURIComponent(`${def.local.morada}, ${def.local.codigo_postal} ${def.local.localidade}, Portugal`);
  return `<div class="mapa" id="mapa" data-mapa="https://www.google.com/maps?q=${q}&z=16&output=embed">
  <div class="mapa__aviso" id="mapa-aviso">
    <span class="mapa__pino">${ic.pin}</span>
    <p><b>Mapa do Google</b><br>Fica por carregar até o autorizar, porque vem dos servidores do Google e pode instalar cookies.</p>
    <div class="mapa__botoes">
      <button class="btn btn--primario" type="button" id="btn-mapa">Carregar o mapa</button>
      <a class="btn btn--secundario" href="${esc(def.local.mapa)}" target="_blank" rel="noopener">Abrir no Google Maps</a>
    </div>
  </div>
</div>`;
}

function paginaContactos() {
  const linha = (icone, titulo, valor, href, nota = '', fora = false) => `<li>
          <a class="contacto" href="${esc(href)}"${fora ? ' target="_blank" rel="noopener"' : ''}>
            <span class="contacto__icone">${icone}</span>
            <span class="contacto__texto"><span>${titulo}</span><b>${valor}</b>${nota ? `<small>${nota}</small>` : ''}</span>
            ${ic.dir}
          </a>
        </li>`;
  const corpo = `
<section class="cabeca-pagina">
  ${FAIXA}
  <div class="envolve">
    ${migalhas([{ nome: 'Início', href: '' }, { nome: 'Contactos' }])}
    <h1 class="h-pagina">Contactos</h1>
    <p class="cabeca-pagina__texto">Estamos em ${esc(def.local.localidade)}, ${esc(def.local.concelho)}. Liga, manda mensagem ou aparece.</p>
  </div>
</section>

<section class="secao">
  <div class="envolve contactos">
    <div class="contactos__lista">
      <ul class="contactos__linhas" role="list">
        ${linha(ic.tel, 'Telefone', esc(def.contactos.telefone_texto), TEL, NOTA_CHAMADA)}
        ${linha(ic.zap, 'WhatsApp', esc(def.contactos.whatsapp_texto), wa(MSG_GERAL), `WhatsApp ${NOTA_CHAMADA}`, true)}
        ${def.contactos.whatsapp_2 ? linha(ic.zap, 'WhatsApp', esc(def.contactos.whatsapp_2_texto), wa(MSG_GERAL, def.contactos.whatsapp_2), `WhatsApp ${NOTA_CHAMADA}`, true) : ''}
        ${def.contactos.email ? linha(ic.mail, 'Email', esc(def.contactos.email), `mailto:${def.contactos.email}`) : ''}
        ${linha(ic.pin, 'Morada', `${esc(def.local.morada)}, ${esc(def.local.codigo_postal)} ${esc(def.local.localidade)}`, def.local.mapa, 'Abrir no Google Maps', true)}
      </ul>
      <div class="contactos__horario">
        <h2 class="h-bloco">${ic.relogio}Horário</h2>
        ${horario()}
      </div>
      <div class="contactos__redes">
        <span>Segue-nos</span>
        <a href="${esc(def.redes.instagram)}" target="_blank" rel="noopener" aria-label="Instagram da NewAuto">${ic.ig}</a>
        <a href="${esc(def.redes.facebook)}" target="_blank" rel="noopener" aria-label="Facebook da NewAuto">${ic.fb}</a>
      </div>
    </div>
    <div class="contactos__mapa">${mapa()}</div>
  </div>
</section>`;
  return pagina({
    pag: 'contactos/',
    titulo: 'Contactos | NewAuto, Paços de Brandão',
    descricao: `NewAuto — ${def.local.morada}, ${def.local.codigo_postal} ${def.local.localidade}. Telefone ${def.contactos.telefone_texto}. ${def.horario.linhas[0].dias}: ${def.horario.linhas[0].horas}.`,
    corpo,
    jsonld: [negocioLD, migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Contactos' }])],
  });
}

/* ------------------------------------------------------ markdown mínimo */
/* As ligações relativas dos textos (`../contactos/`) resolvem contra a página
   onde aparecem, por isso funcionam com qualquer prefixo. As absolutas a
   começar por `/` levariam o prefixo esquecido — passam por `u()`. */
function marcarDown(md) {
  const inline = (s) => esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => {
      const href = h.startsWith('/') ? u(h) : h;
      const fora = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href}"${fora}>${t}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  let html = '', lista = false;
  for (const l of md.split('\n')) {
    const t = l.trim();
    if (/^- /.test(t)) {
      if (!lista) { html += '<ul>'; lista = true; }
      html += `<li>${inline(t.slice(2))}</li>`; continue;
    }
    if (lista) { html += '</ul>'; lista = false; }
    if (!t) continue;
    const h = t.match(/^(#{1,3})\s+(.*)$/);
    if (h) { const n = h[1].length; html += `<h${n}>${inline(h[2])}</h${n}>`; continue; }
    if (/^_.*_$/.test(t)) { html += `<p class="actualizado">${inline(t.slice(1, -1))}</p>`; continue; }
    html += `<p>${inline(t)}</p>`;
  }
  if (lista) html += '</ul>';
  return html;
}

function lerTexto(ficheiro) {
  const bruto = readFileSync(join(RAIZ, 'conteudo', ficheiro), 'utf8');
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  m[1].split('\n').forEach((l) => {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
  return { meta, md: m[2] };
}

/* O título do markdown é o <h1>; sai do corpo para ir para a cabeça da página. */
function paginaTexto(ficheiro, pag, { resumo = '' } = {}) {
  const { meta, md } = lerTexto(ficheiro);
  const semTitulo = md.replace(/^\s*#\s+.*$/m, '');
  const corpo = `<section class="cabeca-pagina">
  ${FAIXA}
  <div class="envolve">
    ${migalhas([{ nome: 'Início', href: '' }, { nome: meta.titulo }])}
    <h1 class="h-pagina">${esc(meta.titulo)}</h1>
  </div>
</section>
${resumo}
<section class="secao">
  <div class="envolve envolve--texto">
    <article class="texto">${marcarDown(semTitulo)}</article>
  </div>
</section>`;
  return pagina({
    pag, titulo: `${meta.titulo} | ${def.empresa.nome}`, descricao: meta.descricao, corpo,
    jsonld: [migalhasLD([{ nome: 'Início', href: '' }, { nome: meta.titulo }])],
  });
}

/* A garantia em três linhas, por cima do texto legal. Diz o mesmo que o texto —
   que é o que vincula (DL 84/2021, art. 43.º) — e nada que lá não esteja. */
const RESUMO_GARANTIA = `<section class="secao secao--resumo">
  <div class="envolve">
    <div class="garantia">
      <div class="garantia__grande">
        <span class="garantia__icone">${ic.escudo}</span>
        <p><b>3 anos</b>de garantia legal de conformidade, nas viaturas que vendemos a consumidores.</p>
      </div>
      <ul class="garantia__pontos" role="list">
        <li><b>30 dias</b><span>para pedir a substituição ou desfazer a compra, se surgir uma falta de conformidade.</span></li>
        <li><b>Prazo parado</b><span>enquanto a viatura estiver connosco em reparação.</span></li>
        <li><b>+6 meses</b><span>por cada reparação, até quatro, na peça reparada.</span></li>
      </ul>
    </div>
  </div>
</section>`;

/* ------------------------------------------------------------------ escrita */
function escrever(caminho, html) {
  const destino = join(SAIDA, caminho);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html, 'utf8');
}

/* O `lastmod` sai da data do ficheiro de dados de cada viatura, e não da data
   da compilação. Carimbar hoje em todos os endereços é o padrão que faz o
   Google deixar de confiar no lastmod do site inteiro. */
function ultimaAlteracao(rel) {
  try { return statSync(join(RAIZ, rel)).mtime.toISOString().slice(0, 10); }
  catch { return new Date().toISOString().slice(0, 10); }
}

function main() {
  rmSync(SAIDA, { recursive: true, force: true });
  mkdirSync(SAIDA, { recursive: true });
  cpSync(join(RAIZ, 'assets'), join(SAIDA, 'assets'), { recursive: true });
  if (existsSync(join(RAIZ, 'CNAME'))) cpSync(join(RAIZ, 'CNAME'), join(SAIDA, 'CNAME'));

  /* Os sete campos do artigo 2.º n.º 1 do DL 74/93 são obrigatórios em qualquer
     anúncio de venda de veículo usado. O gerador recusa-se a publicar uma ficha
     sem eles — mais vale falhar a compilação do que publicar um anúncio ilegal. */
  const OBRIGATORIOS = ['matricula', 'preco', 'ano_construcao', 'mes_matricula',
    'ano_matricula', 'registos_anteriores', 'garantia_usado', 'garantia_fabrica'];
  for (const v of viaturas) {
    const falta = OBRIGATORIOS.filter((c) => v[c] === undefined || v[c] === '' || v[c] === null);
    if (falta.length) {
      throw new Error(`viatura ${v.slug}: faltam campos obrigatórios pelo DL 74/93 — ${falta.join(', ')}`);
    }
    if (!nFotos(v)) throw new Error(`viatura ${v.slug}: não tem nenhuma fotografia`);
  }

  escrever('index.html', paginaInicial());
  escrever('viaturas/index.html', paginaViaturas());
  escrever('vendidos/index.html', paginaVendidos());
  escrever('sobre/index.html', paginaSobre());
  escrever('contactos/index.html', paginaContactos());
  for (const v of viaturas) escrever(`viaturas/${v.slug}/index.html`, paginaViatura(v));

  const legais = {
    'privacidade.md': 'privacidade/',
    'cookies.md': 'cookies/',
    'termos.md': 'termos/',
    'garantia.md': 'garantia/',
    'resolucao-de-litigios.md': 'resolucao-de-litigios/',
  };
  for (const [f, pag] of Object.entries(legais)) {
    escrever(`${pag}index.html`, paginaTexto(f, pag, { resumo: f === 'garantia.md' ? RESUMO_GARANTIA : '' }));
  }

  escrever('404.html', pagina({
    pag: '404.html', naoIndexar: true,
    titulo: `Página não encontrada | ${def.empresa.nome}`,
    descricao: 'O endereço que procura não existe. Veja as viaturas em stock ou fale connosco.',
    corpo: `<section class="cabeca-pagina cabeca-pagina--erro">
  ${FAIXA}
  <div class="envolve">
    <p class="capa__sobre">Erro 404</p>
    <h1 class="h-pagina">Esta página não existe</h1>
    <p class="cabeca-pagina__texto">O endereço pode ter um erro, ou a viatura pode já ter saído do site.</p>
    <div class="capa__accoes">
      <a class="btn btn--primario" href="${u('viaturas/')}">Ver as viaturas ${ic.seta}</a>
      <a class="btn btn--fantasma" href="${u('')}">Voltar ao início</a>
    </div>
  </div>
</section>`,
  }));

  const urls = [
    ['', 'data/definicoes.json'],
    ['viaturas/', 'data/viaturas'],
    ['vendidos/', 'data/viaturas'],
    ['sobre/', 'data/definicoes.json'],
    ['contactos/', 'data/definicoes.json'],
    ...Object.entries(legais).map(([f, pag]) => [pag, `conteudo/${f}`]),
    ...viaturas.map((v) => [`viaturas/${v.slug}/`, `data/viaturas/${v.slug}.json`]),
  ];
  escrever('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([p, orig]) => `  <url><loc>${abs(p)}</loc><lastmod>${ultimaAlteracao(orig)}</lastmod></url>`).join('\n')}
</urlset>
`);
  escrever('robots.txt', dominio
    ? `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`
    : '# Endereço provisório, sem domínio próprio ainda. Não indexar.\nUser-agent: *\nDisallow: /\n');

  console.log(`gerado em ${relative(process.cwd(), SAIDA) || '.'}/`);
  console.log(`  ${viaturas.length} viaturas (${disponiveis.length} disponíveis, ${vendidas.length} vendidas)`);
  console.log(`  ${urls.length} páginas no sitemap`);
  console.log(`  base: ${BASE || '/'}   site: ${SITE}`);

  if (BASE && SAIDA === join(RAIZ, '_site')) {
    console.log(`\n  ATENÇÃO: isto é um build de produção (${BASE}) escrito em _site/,`);
    console.log('  que é a pasta da revisão local — o localhost vai dar 404 no CSS e no JS.');
    console.log('  Para voltar ao local:  node scripts/local.mjs');
    console.log('  Para conferir produção sem estragar o local:  SAIDA=/tmp/prod node scripts/gerar.mjs\n');
  }
}

main();
