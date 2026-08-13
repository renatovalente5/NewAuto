/* ==========================================================================
   NEWAUTO — gerador do site

   Node sem dependências, uma página HTML por viatura, saída para `_site/`.
   Não há framework porque não há nada aqui que precise de um: o conteúdo muda
   quando entra ou sai uma viatura, não a cada visita.

   Porquê pré-renderizar: os robôs de pré-visualização do WhatsApp, do Facebook
   e do Instagram **não executam JavaScript**, e é por aí que um stand partilha
   um carro que acabou de entrar.

   Correr:  BASE= SITE=http://localhost:4400 node scripts/gerar.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, cpSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
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
   projecto e ninguém deu por isso durante dias, porque a página de teste no
   endereço do GitHub redireccionava e parecia bem.

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
const vendidas = viaturas.filter((v) => v.estado === 'vendida');

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const euros = (n) => new Intl.NumberFormat('pt-PT').format(n);
const km = (n) => `${new Intl.NumberFormat('pt-PT').format(n)} km`;

/* Cache busting pelo conteúdo: sem isto, quem já visitou fica com o CSS antigo
   depois de uma publicação e vê o site partido sem saber porquê. */
function versao(rel) {
  const h = createHash('sha1').update(readFileSync(join(RAIZ, rel))).digest('hex').slice(0, 8);
  return `${u(rel)}?v=${h}`;
}

/* As medidas do logótipo lêem-se do próprio ficheiro. Um width/height errado
   distorce a imagem e faz a página saltar quando ela chega. */
function medidaPNG(rel) {
  const b = readFileSync(join(RAIZ, rel));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const LOGO = medidaPNG('assets/img/logo-claro.png');

/* ------------------------------------------------------------------ ícones */
const ic = {
  seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  cima: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  esq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  dir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10.3" r="3"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.25.69-1.45 1.32-2 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.92-4.28-5.07-4.48-.15-.2-1.21-1.61-1.21-3.07S6.76 7.1 7.02 6.8c.26-.29.56-.36.75-.36l.54.01c.17.01.41-.7.64.49.24.58.81 2.03.88 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.49l-.44.51c-.15.15-.3.31-.13.61.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.7.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.69-.18 1.38Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.02H7.9v-2.92h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.92h-2.34V22C18.34 21.24 22 17.08 22 12.06Z"/></svg>',
};

/* ------------------------------------------------------------ fotografias */
/* As fotografias de origem têm 414x414 px — foram recolhidas das redes sociais
   e não há maiores. É por isso que só há duas larguras e que nenhuma imagem
   deste site aparece a toda a largura do ecrã: a 414 px ficaria mole.
   Ver `scripts/imagens.py`. */
const LARGURAS = [200, 414];

/* DUAS ORIGENS DE FOTOGRAFIA, e a razão é o backoffice.

   As viaturas de demonstração usam `fotos_origem`: nomes de ficheiros em
   `_fonte/originais/`, que `scripts/imagens.py` converte em AVIF, WebP e JPEG
   em duas larguras. Bom para o peso, mas exige correr Python — coisa que o dono
   do stand não vai fazer.

   Quando ele acrescenta uma viatura no Pages CMS, as fotografias vão
   directamente para `assets/viaturas/` e ficam listadas em `galeria`. Essas
   servem-se como estão, num `<img>` simples: perde-se o AVIF, mas um backoffice
   que não consegue publicar uma fotografia não é um backoffice. É a troca certa.

   Se um dia interessar optimizar também essas, corre-se o pipeline sobre elas —
   mas isso é trabalho nosso, não dele. */
function nFotos(v) {
  return (v.galeria?.length ? v.galeria.length : v.fotos_origem?.length) || 0;
}

function urlFoto(v, n) {
  if (v.galeria?.length) return u(String(v.galeria[n - 1]).replace(/^\/+/, ''));
  return u(`assets/viaturas/${v.slug}/${String(n).padStart(2, '0')}-414.jpg`);
}

function foto(v, n, { sizes, prioritaria = false, classe = '', alt }) {
  const carregar = prioritaria ? 'fetchpriority="high"' : 'loading="lazy"';

  if (v.galeria?.length) {
    const src = urlFoto(v, n);
    return `<picture class="${classe}"><img src="${src}" sizes="${sizes}"
      alt="${esc(alt)}" ${carregar} decoding="async"></picture>`;
  }

  const base = `assets/viaturas/${v.slug}/${String(n).padStart(2, '0')}`;
  const conj = (ext) => LARGURAS.map((w) => `${u(`${base}-${w}.${ext}`)} ${w}w`).join(', ');
  return `<picture class="${classe}">
    <source type="image/avif" srcset="${conj('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${conj('webp')}" sizes="${sizes}">
    <img src="${u(`${base}-414.jpg`)}" srcset="${conj('jpg')}" sizes="${sizes}"
         alt="${esc(alt)}" width="414" height="414"
         ${carregar} decoding="async">
  </picture>`;
}

/* ---------------------------------------------------------------- telefone */
/* A lei obriga a indicar o custo da chamada sempre que se publica um número
   (DL 59/2021, art. 3.º, na redacção da Lei 14/2023), e com visibilidade
   equivalente à do próprio número. Uma função só, para não haver um sítio
   onde alguém se esqueça. */
const NOTA_CHAMADA = '(Chamada para a rede móvel nacional)';
const telefone = (classe = '') => `<a class="tel ${classe}" href="tel:+351${def.contactos.telefone}">
    ${ic.tel}<span>${esc(def.contactos.telefone_texto)}</span></a>
  <span class="nota-chamada">${NOTA_CHAMADA}</span>`;

/* ------------------------------------------------------------- navegação */
const MENU = [
  { href: '', rot: 'Início' },
  { href: 'viaturas/', rot: 'Viaturas' },
  { href: 'sobre/', rot: 'Sobre nós' },
  { href: 'garantia/', rot: 'Garantia' },
  { href: 'contactos/', rot: 'Contactos' },
];

function cabecalho(pag) {
  const links = MENU.map(({ href, rot }) => {
    let act = '';
    if (pag === href) act = ' aria-current="page"';
    else if (href && pag.startsWith(href)) act = ' aria-current="true"';
    return `<a class="topo__link" href="${u(href)}"${act}>${rot}</a>`;
  }).join('');
  return `<a class="saltar" href="#principal">Saltar para o conteúdo</a>
<header class="topo" id="topo">
  <div class="topo__barra">
    <a class="marca" href="${u('')}" aria-label="NewAuto — início">
      <img src="${u('assets/img/logo-claro.png')}" alt="NewAuto" width="${LOGO.w}" height="${LOGO.h}" fetchpriority="high">
    </a>
    <nav class="topo__nav" aria-label="Principal">${links}</nav>
    <a class="btn btn--cheio topo__cta" href="tel:+351${def.contactos.telefone}">${ic.tel} Ligar</a>
    <button class="hamburger" id="btn-menu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu">
      <span></span>
    </button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav class="menu__corpo" aria-label="Menu">
    ${MENU.map(({ href, rot }) => `<a class="menu__link" href="${u(href)}">${rot}</a>`).join('')}
    <div class="menu__accoes">
      <a class="btn btn--cheio" href="tel:+351${def.contactos.telefone}">${ic.tel} Ligar agora</a>
      <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${ic.zap} WhatsApp</a>
    </div>
    <p class="nota-chamada">${NOTA_CHAMADA}</p>
  </nav>
</div>`;
}

/* ----------------------------------------------------------------- rodapé */
/* A identificação do prestador — firma, endereço, correio electrónico e NIF — é
   imposta pelo artigo 10.º do DL 7/2004. Estava aqui no rodapé e saiu a pedido
   do cliente, porque com o NIF ainda por dar aparecia um marcador à vista em
   todas as páginas.

   Não desapareceu do sítio: a obrigação é de «disponibilização permanente, em
   condições que permitam um acesso fácil e directo», e cumpre-se com a página
   de Termos e Condições, que está ligada no rodapé de todas as páginas. A
   auditoria confirma que essa página continua a ter os quatro elementos — se
   alguém os tirar de lá, a publicação falha. */

function rodape() {
  /* A Garantia saiu desta fila quando voltou à navbar: a coluna «Navegar» do
     rodapé é gerada a partir do MENU, e tê-la nos dois sítios escrevia
     «Garantia» duas vezes no mesmo rodapé. */
  const legais = [
    ['privacidade/', 'Política de privacidade'],
    ['cookies/', 'Cookies'],
    ['termos/', 'Termos e condições'],
  ];
  return `<footer class="rodape">
  <div class="envolve">
    <div class="rodape__grelha">
      <div>
        <img class="rodape__marca" src="${u('assets/img/logo-claro.png')}" alt="NewAuto" width="${LOGO.w}" height="${LOGO.h}" loading="lazy">
        <p class="rodape__texto">${esc(def.textos.assinatura)}</p>
        <div class="rodape__redes">
          <a class="rodape__rede" href="${esc(def.redes.instagram)}" target="_blank" rel="noopener" aria-label="Instagram da NewAuto">${ic.ig}</a>
          <a class="rodape__rede" href="${esc(def.redes.facebook)}" target="_blank" rel="noopener" aria-label="Facebook da NewAuto">${ic.fb}</a>
          <a class="rodape__rede" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp da NewAuto">${ic.zap}</a>
        </div>
      </div>
      <div>
        <h2>Navegar</h2>
        <ul class="rodape__lista">
          ${MENU.map(({ href, rot }) => `<li><a href="${u(href)}">${rot}</a></li>`).join('')}
          <li><a href="${u('vendidos/')}">Vendidos</a></li>
        </ul>
      </div>
      <div>
        <h2>Contactos</h2>
        <ul class="rodape__lista rodape__contactos">
          <li>${ic.tel}<span><a href="tel:+351${def.contactos.telefone}">${esc(def.contactos.telefone_texto)}</a>
            <small>${NOTA_CHAMADA}</small></span></li>
          <li>${ic.zap}<span><a href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${esc(def.contactos.whatsapp_texto)}</a>
            <small>WhatsApp ${NOTA_CHAMADA}</small></span></li>
          <li>${ic.pin}<span>${esc(def.local.morada)}<br>${esc(def.local.codigo_postal)} ${esc(def.local.localidade)}</span></li>
        </ul>
      </div>
    </div>


    <div class="rodape__legal">
      <p>&copy; ${new Date().getFullYear()} ${esc(def.empresa.nome)}</p>
      <ul class="rodape__links">
        ${legais.map(([h, r]) => `<li><a href="${u(h)}">${r}</a></li>`).join('')}
        <li><a href="${u('resolucao-de-litigios/')}">Resolução de litígios</a></li>
        <li><a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener">Livro de Reclamações</a></li>
        <li><a class="rodape__gestao" href="https://app.pagescms.org/${DONO}/${REPO}" target="_blank" rel="nofollow noopener">Gestão</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

/* --------------------------------------------------------------- esqueleto */
function pagina({ pag = '', titulo, descricao, corpo, jsonld = [], og, classe = '', naoIndexar = false }) {
  const url = abs(pag);
  const imagem = og ?? abs('assets/img/og.jpg');
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="theme-color" content="#1A1A1A">
<link rel="icon" href="${u('assets/img/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${u('assets/img/favicon-96.png')}" sizes="96x96" type="image/png">
<link rel="apple-touch-icon" href="${u('assets/img/apple-touch-icon.png')}">
<link rel="stylesheet" href="${versao('assets/css/estilo.css')}">
${naoIndexar ? '<meta name="robots" content="noindex">' : ''}${dominio ? '' : '<!-- Enquanto o stand não tiver domínio, o site vive num endereço\n     provisório do GitHub. Deixá-lo indexar punha o Google a guardar o\n     endereço errado, e depois havia que o desfazer. Escrever o ficheiro\n     CNAME faz esta linha desaparecer sozinha. -->\n<meta name="robots" content="noindex, nofollow">'}
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body class="${classe}">
${cabecalho(pag)}
<main id="principal">
${corpo}
</main>
${rodape()}
<button class="subir" id="subir" type="button" aria-label="Voltar ao topo da página">${ic.cima}</button>
${avisoCookies()}
<script src="${versao('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* O aviso de cookies foi pedido pelo cliente. Este site não instala cookies
   nenhum — a única coisa que pode carregar de terceiros é o mapa do Google, e
   só depois de a pessoa carregar no botão. O aviso serve, então, para dizer
   isso com clareza, e os dois botões têm exactamente o mesmo peso visual:
   um consentimento em que recusar custa mais do que aceitar não é livre. */
function avisoCookies() {
  return `<div class="cookies" id="cookies" hidden>
  <div class="cookies__corpo">
    <p><b>Não usamos cookies.</b> Só o mapa do Google, na página de contactos, precisa da sua
      autorização. <a href="${u('cookies/')}">Saber mais</a></p>
    <div class="cookies__botoes">
      <button class="btn btn--linha" type="button" data-cookies="recusar">Recusar</button>
      <button class="btn btn--cheio" type="button" data-cookies="aceitar">Aceitar</button>
    </div>
  </div>
</div>`;
}

/* --------------------------------------------------------- dados estruturados */
/* `AutoDealer` é o subtipo de LocalBusiness que a Google recomenda para stands.
   O tipo `VehicleListing` foi eliminado da Pesquisa a 09-09-2025 — a
   documentação responde 301 —, por isso não se implementa. Em cada ficha vai um
   `Car` com `offers`, que não produz resultado enriquecido nenhum hoje mas
   serve para desambiguar a entidade e para os motores de resposta. */
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
  /* Sem `openingHoursSpecification` a pedido do cliente: o horário deixou de
     sair do rodapé e também não é declarado aqui, pelo que a Google não o mostra
     na ficha do negócio. O horário continua a existir em definicoes.json e na
     página de contactos — basta devolver esta propriedade para o recuperar. */
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

/* ------------------------------------------------------------ componentes */
function cartaoViatura(v, i = 9, nivel = 3) {
  const vendida = v.estado === 'vendida';
  return `<article class="cartao${vendida ? ' cartao--vendida' : ''}" data-marca="${esc(v.marca)}"
    data-combustivel="${esc(v.combustivel)}" data-caixa="${esc(v.caixa)}"
    data-segmento="${esc(v.segmento)}" data-preco="${v.preco}" data-km="${v.quilometros}"
    data-ano="${v.ano_matricula}" data-estado="${esc(v.estado)}">
  <a class="cartao__link" href="${u('viaturas/' + v.slug + '/')}">
    <div class="cartao__foto" style="view-transition-name: viatura-${esc(v.slug)}">
      ${foto(v, 1, { sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 30vw', prioritaria: i < 3, alt: '' })}
      ${vendida ? '<span class="etiqueta etiqueta--vendida">Vendida</span>' : ''}
      ${v.estado === 'reservada' ? '<span class="etiqueta etiqueta--reservada">Reservada</span>' : ''}
    </div>
    <div class="cartao__corpo">
      <h${nivel} class="cartao__nome">${esc(v.titulo)}</h${nivel}>
      <ul class="cartao__dados">
        <li>${v.ano_matricula}</li>
        <li>${km(v.quilometros)}</li>
        <li>${esc(v.combustivel)}</li>
        <li>${esc(v.caixa)}</li>
      </ul>
      <p class="cartao__preco">${vendida ? '<span class="cartao__vendido">Vendida</span>' : `${euros(v.preco)} &euro;`}</p>
    </div>
  </a>
</article>`;
}

const FICHA = [
  ['Marca', (v) => v.marca],
  ['Modelo', (v) => v.modelo],
  ['Versão', (v) => v.versao],
  ['Matrícula', (v) => v.matricula],
  ['Mês/ano da matrícula', (v) => `${v.mes_matricula}/${v.ano_matricula}`],
  ['Ano de construção', (v) => v.ano_construcao],
  ['Quilómetros', (v) => km(v.quilometros)],
  ['Combustível', (v) => v.combustivel],
  ['Caixa', (v) => v.caixa],
  ['Potência', (v) => `${v.potencia_cv} cv`],
  ['Cilindrada', (v) => (v.cilindrada_cc ? `${euros(v.cilindrada_cc)} cm³` : '')],
  ['Segmento', (v) => v.segmento],
  ['Portas', (v) => v.portas],
  ['Lugares', (v) => v.lugares],
  ['Cor', (v) => v.cor],
  ['Registos anteriores', (v) => v.registos_anteriores],
  ['Origem', (v) => v.origem],
  ['Livro de revisões', (v) => (v.livro_revisoes ? 'Completo' : '')],
  ['Garantia', (v) => v.garantia_usado],
  ['Garantia de fábrica', (v) => v.garantia_fabrica],
];

/* ---------------------------------------------------------------- páginas */
function paginaInicial() {
  const destaques = disponiveis.filter((v) => v.destaque).slice(0, 6);
  const lista = destaques.length ? destaques : disponiveis.slice(0, 6);

  const corpo = `
<section class="capa">
  <div class="envolve capa__interior">
    <p class="sobretitulo">${esc(def.textos.reclamo)}</p>
    <h1 class="capa__titulo">${esc(def.textos.hero_titulo)}</h1>
    <p class="capa__lead">${esc(def.textos.hero_texto)}</p>
    <div class="capa__accoes">
      <a class="btn btn--cheio btn--g" href="${u('viaturas/')}">Ver as ${disponiveis.length} viaturas ${ic.seta}</a>
      <a class="btn btn--linha btn--g" href="tel:+351${def.contactos.telefone}">${ic.tel} ${esc(def.contactos.telefone_texto)}</a>
    </div>
    <p class="nota-chamada">${NOTA_CHAMADA}</p>
  </div>
</section>

<section class="secao">
  <div class="envolve">
    <div class="secao__topo">
      <div>
        <p class="sobretitulo">Em destaque</p>
        <h2 class="h-secao">Algumas viaturas</h2>
      </div>
      <a class="ligacao" href="${u('viaturas/')}">Ver todas ${ic.seta}</a>
    </div>
    <div class="grelha">${lista.map((v, i) => cartaoViatura(v, i)).join('')}</div>
  </div>
</section>

${secaoMarcas()}

<section class="secao secao--escura secao--textura">
  <div class="envolve">
    <p class="sobretitulo sobretitulo--claro">Como trabalhamos</p>
    <h2 class="h-secao h-secao--claro">Vendemos mais do que carros</h2>
    <ol class="passos">
      <li class="passo"><span class="passo__n">1</span><h3>Escolhe</h3>
        <p>Vê o stock aqui ou passa pelo stand em Paços de Brandão. Mostramos tudo o que há para ver, sem pressa.</p></li>
      <li class="passo"><span class="passo__n">2</span><h3>Experimenta</h3>
        <p>Marca um ensaio. Andar com o carro é a única forma de saber se é o teu.</p></li>
      <li class="passo"><span class="passo__n">3</span><h3>Trata-se de tudo</h3>
        <p>Documentação, transferência de registo e inspecção. Aceitamos a tua viatura como retoma.</p></li>
      <li class="passo"><span class="passo__n">4</span><h3>Leva-o</h3>
        <p>Com garantia legal de conformidade de 3 anos e o apoio de quem fica cá depois da venda.</p></li>
    </ol>
  </div>
</section>

<section class="secao">
  <div class="envolve">
    <div class="faixa">
      <div>
        <h2 class="h-secao">Procura alguma coisa em concreto?</h2>
        <p class="faixa__texto">Diga-nos o que precisa e o orçamento. Se não estiver no stand, procuramos.</p>
      </div>
      <div class="faixa__accoes">
        <a class="btn btn--cheio" href="tel:+351${def.contactos.telefone}">${ic.tel} Ligar</a>
        <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${ic.zap} WhatsApp</a>
      </div>
    </div>
    <p class="nota-chamada nota-chamada--centro">${NOTA_CHAMADA}</p>
  </div>
</section>`;

  return pagina({
    pag: '',
    titulo: `NewAuto — Carros usados em Paços de Brandão`,
    descricao: `Stand de automóveis usados em Paços de Brandão, Santa Maria da Feira. ${disponiveis.length} viaturas com quilometragem certificada e garantia legal de 3 anos.`,
    corpo,
    classe: 'pagina-inicial',
    jsonld: [negocioLD, {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: def.empresa.nome, alternateName: 'NewAuto Comércio Automóvel',
      url: abs(''), inLanguage: 'pt-PT', publisher: { '@id': abs('#stand') },
    }],
  });
}

/* ------------------------------------------------------- marcas em stock */
/* O slug tem de bater com o nome do ficheiro em assets/img/marcas/. Não há
   tabela de correspondência a manter: `Mercedes-Benz` → `mercedesbenz`,
   `Citroën` → `citroen`, `Škoda` → `skoda`. */
function slugMarca(m) {
  return String(m).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/š/g, 's')
    .replace(/[^a-z0-9]/g, '');
}

/* A secção dos logótipos das marcas.

   PORQUE É QUE O SÍMBOLO É OPCIONAL. O backoffice aceita 33 marcas e o Simple
   Icons só tem 25 delas — falta a Mercedes-Benz, a Alfa Romeo, a Cupra, a
   Jaguar, a Land Rover e a Lexus, e não existem em vector livre em sítio nenhum
   (o emblema da Alfa Romeo está protegido por direito de autor, não só como
   marca). Se o símbolo fosse obrigatório, a primeira Cupra que entrasse no
   backoffice ou fazia falhar a publicação ou deixava um buraco na fila, e o
   dono do stand não teria como resolver. Aqui o gerador olha para o disco: se o
   ficheiro existe mostra o símbolo com o nome ao lado, se não existe mostra só o
   nome, e nos dois casos a marca está na fila e liga para o stock dela.
   Ver assets/img/marcas/FONTE.md.

   MONOCROMÁTICO, e não é só estética. As cores oficiais de sete fabricantes
   juntas sobre carvão sujam a secção; e uma parede de emblemas nas cores da casa
   é precisamente o desenho que a jurisprudência censura por sugerir pertença à
   rede oficial. O símbolo é pintado com `currentColor` através de `mask-image`,
   o que também evita 25 ficheiros dentro do HTML — o da Porsche sozinho tem
   24 KB, e só é pedido se houver uma Porsche em stock.

   As marcas saem de `disponiveis`, não de todas as viaturas: cada uma liga para
   `viaturas/?marca=X`, e esse filtro é do lado do cliente. Medido antes de
   decidir: com uma marca sem stock (a Alfa Romeo, que está vendida) o parâmetro
   é ignorado em silêncio e a página mostra as 11 viaturas todas, em vez de dizer
   que não há nenhuma. Uma marca sem carros para vender não pode estar aqui. */
function secaoMarcas() {
  const marcas = [...new Set(disponiveis.map((v) => v.marca))]
    .sort((a, b) => a.localeCompare(b, 'pt'));
  if (!marcas.length) return '';

  const itens = marcas.map((m) => {
    const s = slugMarca(m);
    const rel = `assets/img/marcas/${s}.svg`;
    const temSimbolo = existsSync(join(RAIZ, rel));
    return `<li class="marcas__item">
        <a class="marcas__ligacao${temSimbolo ? '' : ' marcas__ligacao--nome'}" href="${u(`viaturas/?marca=${encodeURIComponent(m)}`)}">
          ${temSimbolo ? `<span class="marcas__simbolo" style="--simbolo:url('${u(rel)}')"></span>` : ''}
          <span class="marcas__nome">${esc(m)}</span>
        </a>
      </li>`;
  }).join('');

  return `<section class="secao secao--marcas">
  <div class="envolve">
    <div class="secao__topo">
      <div>
        <p class="sobretitulo">Marcas em stock</p>
        <h2 class="h-secao">O que temos para venda</h2>
      </div>
    </div>

    <ul class="marcas" id="marcas" tabindex="0" role="list"
        aria-label="Marcas com viaturas em stock" data-grupo="${marcas.length}">${itens}</ul>

    <!-- Uma linha, e não um parágrafo. Nenhuma lei manda imprimir este texto: o que
         está proibido é dar a impressão de ser concessionário autorizado sem o ser
         (DL 57/2008 art. 8.º al. d), e a condição de «práticas honestas» do art. 254.º
         do CPI). É essa impressão que a frase desfaz, e desfaz-se numa linha. Tem de
         ficar aqui, junto dos símbolos: Gillette (C-228/03 § 46) manda olhar à
         apresentação global, e um aviso noutra página não corrige o que se lê nesta. -->
    <p class="marcas__aviso">Stand independente: não somos concessionário autorizado de nenhuma
      destas marcas.</p>
  </div>
</section>`;
}

function facetas(lista) {
  const conta = (chave) => {
    const m = new Map();
    for (const v of lista) m.set(v[chave], (m.get(v[chave]) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const grupo = (nome, chave) => `<fieldset class="filtro">
    <legend>${nome}</legend>
    ${conta(chave).map(([val, n]) => `<label class="opcao">
      <input type="checkbox" name="${chave}" value="${esc(val)}"> <span>${esc(val)}</span> <b>${n}</b>
    </label>`).join('')}
  </fieldset>`;
  return grupo('Marca', 'marca') + grupo('Combustível', 'combustivel')
    + grupo('Caixa', 'caixa') + grupo('Segmento', 'segmento');
}

function paginaViaturas() {
  /* O passo do cursor tem de dividir o intervalo, senão o browser encaixa o
     valor inicial no degrau abaixo e a viatura mais cara fica escondida por
     omissão. Medido antes de corrigir: com min 8750, max 19900 e passo 500, o
     valor inicial descia para 19750 e o carro de 19.900 não aparecia — nem
     depois de carregar em «Limpar». Arredondar as pontas ao passo resolve. */
  const PASSO = 500;
  const brutos = disponiveis.map((v) => v.preco);
  const precoMin = Math.floor(Math.min(...brutos) / PASSO) * PASSO;
  const precoMax = Math.ceil(Math.max(...brutos) / PASSO) * PASSO;
  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">Viaturas</span></nav>
    <p class="sobretitulo">Stock</p>
    <h1 class="h-pagina">Viaturas disponíveis</h1>
    <p class="lead">Todas com quilometragem certificada e garantia legal de conformidade de 3 anos.</p>

    <div class="montra">
      <aside class="montra__filtros">
        <div class="montra__filtros-topo">
          <h2>Filtrar</h2>
          <button class="ligacao" type="button" id="limpar" hidden>Limpar</button>
        </div>
        <form id="filtros">
          ${facetas(disponiveis)}
          <fieldset class="filtro">
            <legend>Preço até</legend>
            <input type="range" id="preco-max" name="preco" min="${precoMin}" max="${precoMax}"
                   value="${precoMax}" step="${PASSO}">
            <output for="preco-max" id="preco-saida">${euros(precoMax)} €</output>
          </fieldset>
        </form>
      </aside>

      <div class="montra__lista">
        <div class="montra__barra">
          <p class="contagem" id="contagem" role="status">${disponiveis.length} viaturas</p>
          <label class="ordenar">Ordenar
            <select id="ordem">
              <option value="ordem">Mais recentes</option>
              <option value="preco-asc">Preço, mais baixo</option>
              <option value="preco-desc">Preço, mais alto</option>
              <option value="km-asc">Quilómetros, menos</option>
              <option value="ano-desc">Ano, mais novo</option>
            </select>
          </label>
          <button class="btn btn--linha btn--filtros" type="button" id="btn-filtros" aria-expanded="false">Filtros</button>
        </div>
        <div class="grelha grelha--montra" id="grelha">
          ${disponiveis.map((v, i) => cartaoViatura(v, i)).join('')}
        </div>
        <p class="vazio" id="vazio" hidden>Nenhuma viatura corresponde a estes filtros. <button class="ligacao" type="button" id="limpar-2">Limpar os filtros</button></p>
      </div>
    </div>
  </div>
</section>`;

  return pagina({
    pag: 'viaturas/',
    titulo: `Viaturas usadas | NewAuto, Paços de Brandão`,
    descricao: `${disponiveis.length} viaturas usadas em stock no NewAuto, em Paços de Brandão: ${[...new Set(disponiveis.map((v) => v.marca))].slice(0, 5).join(', ')} e mais.`,
    corpo,
    jsonld: [
      migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Viaturas' }]),
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'Viaturas disponíveis', numberOfItems: disponiveis.length,
        itemListElement: disponiveis.map((v, i) => ({
          '@type': 'ListItem', position: i + 1,
          url: abs('viaturas/' + v.slug + '/'), name: v.titulo,
        })),
      },
    ],
  });
}

function paginaViatura(v) {
  const vendida = v.estado === 'vendida';
  const outras = disponiveis.filter((x) => x.slug !== v.slug);
  const i = outras.findIndex((x) => x.ordem > v.ordem);
  const base = i >= 0 ? i : 0;
  const relacionadas = Array.from({ length: Math.min(3, outras.length) },
    (_, k) => outras[(base + k) % outras.length]);

  const ficha = FICHA.map(([k, f]) => [k, f(v)]).filter(([, val]) => val !== '' && val != null);
  const msg = encodeURIComponent(`Olá! Tenho interesse no ${v.titulo} (ref. ${v.referencia}) — ${abs('viaturas/' + v.slug + '/')}`);

  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas">
      <a href="${u('')}">Início</a> <span>/</span>
      <a href="${u('viaturas/')}">Viaturas</a> <span>/</span>
      <span aria-current="page">${esc(v.titulo)}</span>
    </nav>

    <div class="viatura">
      <div class="viatura__galeria">
        <button class="viatura__principal" type="button" data-galeria="0"
                style="view-transition-name: viatura-${esc(v.slug)}" aria-label="Ampliar fotografia">
          ${foto(v, 1, { sizes: '(max-width: 980px) 100vw, 60vw', prioritaria: true, alt: `${v.titulo}` })}
          ${vendida ? '<span class="etiqueta etiqueta--vendida">Vendida</span>' : ''}
        </button>
        <div class="viatura__mais">
          ${Array.from({ length: Math.max(0, nFotos(v) - 1) }).map((_, k) => `<button class="viatura__extra" type="button" data-galeria="${k + 1}" aria-label="Ampliar fotografia ${k + 2}">
            ${foto(v, k + 2, { sizes: '(max-width: 980px) 30vw, 19vw', alt: `${v.titulo} — fotografia ${k + 2}` })}
          </button>`).join('')}
        </div>
      </div>

      <aside class="viatura__lado">
        <div class="painel">
          <p class="sobretitulo">Ref. ${esc(v.referencia)}</p>
          <h1 class="painel__titulo">${esc(v.titulo)}</h1>
          <!-- Sem a potência: são os mesmos quatro dados do cartão, para a linha
               caber de uma vez. Os cv continuam na tabela de especificações, que
               é a ficha completa da viatura. -->
          <ul class="painel__resumo">
            <li>${v.ano_matricula}</li><li>${km(v.quilometros)}</li>
            <li>${esc(v.combustivel)}</li><li>${esc(v.caixa)}</li>
          </ul>
          <p class="painel__preco">${vendida ? 'Vendida' : `${euros(v.preco)} &euro;`}</p>
          ${vendida ? '<p class="painel__nota">Esta viatura já foi vendida. Temos outras semelhantes — fale connosco.</p>'
      : `<p class="painel__nota">${v.negociavel ? 'Preço negociável.' : ''} ${v.aceita_retoma ? 'Aceitamos retoma.' : ''}</p>`}
          <div class="painel__accoes">
            <a class="btn btn--cheio" href="tel:+351${def.contactos.telefone}">${ic.tel} Ligar agora</a>
            <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}?text=${msg}" target="_blank" rel="noopener">${ic.zap} WhatsApp</a>
          </div>
          <p class="nota-chamada">${NOTA_CHAMADA}</p>
        </div>
      </aside>
    </div>

    <div class="viatura__baixo">
      <section class="bloco">
        <h2 class="h-secao">Ficha técnica</h2>
        <dl class="tabela">
          ${ficha.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}
        </dl>
      </section>

      <section class="bloco">
        <h2 class="h-secao">Descrição</h2>
        <p class="lead">${esc(v.descricao)}</p>
        <p class="aviso">As informações desta página têm natureza informativa e não constituem
          proposta contratual. A venda é feita nas nossas instalações, onde todos os elementos
          podem ser confirmados.</p>
      </section>
    </div>

    <section class="secao__relacionadas">
      <h2 class="h-secao">Outras viaturas</h2>
      <div class="grelha">${relacionadas.map((x, k) => cartaoViatura(x, k + 9)).join('')}</div>
    </section>
  </div>
</section>

<dialog class="lightbox" id="lightbox">
  <button class="lightbox__fechar" type="button" aria-label="Fechar">${ic.x}</button>
  <button class="lightbox__nav lightbox__nav--esq" type="button" aria-label="Anterior">${ic.esq}</button>
  <img id="lightbox-img" alt="" width="414" height="414">
  <button class="lightbox__nav lightbox__nav--dir" type="button" aria-label="Seguinte">${ic.dir}</button>
  <p class="lightbox__conta" id="lightbox-conta"></p>
</dialog>
<script type="application/json" id="fotos-viatura">${JSON.stringify(
    Array.from({ length: nFotos(v) }, (_, k) => urlFoto(v, k + 1)),
  )}</script>`;

  /* `Car` com `offers`. Não produz resultado enriquecido — a Google eliminou o
     tipo de anúncio de veículo em Setembro de 2025 —, mas desambigua a entidade
     e alimenta os motores de resposta. O preço está visível na página, que é a
     condição para o poder marcar. */
  const carroLD = {
    '@context': 'https://schema.org', '@type': 'Car',
    name: v.titulo, brand: { '@type': 'Brand', name: v.marca }, model: v.modelo,
    vehicleModelDate: String(v.ano_construcao),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.quilometros, unitCode: 'KMT' },
    fuelType: v.combustivel, vehicleTransmission: v.caixa, color: v.cor,
    numberOfDoors: v.portas, vehicleSeatingCapacity: v.lugares,
    vehicleEngine: { '@type': 'EngineSpecification', enginePower: { '@type': 'QuantitativeValue', value: v.potencia_cv, unitCode: 'BHP' } },
    itemCondition: 'https://schema.org/UsedCondition',
    image: Array.from({ length: nFotos(v) }, (_, k) => SITE + urlFoto(v, k + 1)),
    offers: {
      '@type': 'Offer', price: v.preco, priceCurrency: 'EUR',
      availability: vendida ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: { '@id': abs('#stand') },
      url: abs('viaturas/' + v.slug + '/'),
    },
  };

  return pagina({
    pag: `viaturas/${v.slug}/`,
    titulo: `${v.titulo} ${v.ano_matricula} | NewAuto`,
    descricao: `${v.titulo} de ${v.ano_matricula} com ${km(v.quilometros)}, ${v.combustivel.toLowerCase()}, caixa ${v.caixa.toLowerCase()}. ${vendida ? 'Vendida.' : `${euros(v.preco)} € no NewAuto, Paços de Brandão.`}`,
    corpo,
    og: abs(`assets/viaturas/${v.slug}/og.jpg`),
    jsonld: [carroLD, negocioLD, migalhasLD([
      { nome: 'Início', href: '' }, { nome: 'Viaturas', href: 'viaturas/' }, { nome: v.titulo },
    ])],
  });
}

function paginaVendidos() {
  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">Vendidos</span></nav>
    <p class="sobretitulo">Histórico</p>
    <h1 class="h-pagina">Viaturas vendidas</h1>
    <p class="lead">O que já saiu do stand. Se procura algo parecido, diga-nos — aparecem viaturas todas as semanas.</p>
    ${vendidas.length
      ? `<div class="grelha">${vendidas.map((v, i) => cartaoViatura(v, i, 2)).join('')}</div>`
      : '<p class="vazio">Ainda não há viaturas marcadas como vendidas.</p>'}
  </div>
</section>`;
  return pagina({
    pag: 'vendidos/',
    titulo: 'Viaturas vendidas | NewAuto',
    descricao: 'Viaturas já vendidas pelo NewAuto, em Paços de Brandão. Aparecem viaturas novas em stock todas as semanas.',
    corpo,
    jsonld: [migalhasLD([{ nome: 'Início', href: '' }, { nome: 'Vendidos' }])],
  });
}

function paginaSobre() {
  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">Sobre nós</span></nav>
    <div class="duas">
      <div>
        <p class="sobretitulo">Quem somos</p>
        <h1 class="h-pagina">${esc(def.textos.sobre_titulo)}</h1>
        <p class="lead">${esc(def.textos.sobre_texto)}</p>
        <p class="assinatura">${esc(def.textos.assinatura)}</p>
        <div class="capa__accoes">
          <a class="btn btn--cheio" href="${u('viaturas/')}">Ver as viaturas ${ic.seta}</a>
          <a class="btn btn--linha" href="${u('contactos/')}">Onde estamos</a>
        </div>
      </div>
      <div class="duas__foto">
        ${disponiveis[0] ? foto(disponiveis[0], 1, { sizes: '(max-width: 900px) 92vw, 44vw', alt: 'Viatura no stand NewAuto' }) : ''}
      </div>
    </div>
  </div>
</section>

<section class="secao secao--escura secao--textura">
  <div class="envolve">
    <p class="sobretitulo sobretitulo--claro">O que nos distingue</p>
    <h2 class="h-secao h-secao--claro h-secao--espaco">Sem letras pequenas</h2>
    <div class="cartas">
      <div class="carta"><h3>Quilometragem certificada</h3>
        <p>Todas as viaturas são verificadas antes de entrarem no stand. O que está na ficha é o que o carro tem.</p></div>
      <div class="carta"><h3>Garantia legal de 3 anos</h3>
        <p>É a garantia de conformidade prevista no Decreto-Lei n.º 84/2021, e aplica-se a todas as viaturas usadas que vendemos.</p></div>
      <div class="carta"><h3>Retoma e financiamento</h3>
        <p>Aceitamos a sua viatura como parte do pagamento e ajudamos a tratar do resto.</p></div>
    </div>
  </div>
</section>`;
  return pagina({
    pag: 'sobre/',
    titulo: 'Sobre nós | NewAuto, Paços de Brandão',
    descricao: `A NewAuto é um stand de automóveis em Paços de Brandão, no mercado desde ${def.empresa.desde}. Quilometragem certificada e garantia legal de 3 anos.`,
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
    ${ic.pin}
    <p><b>Mapa do Google</b><br>
      Fica por carregar até o autorizar, porque vem dos servidores do Google e pode instalar cookies.</p>
    <div class="mapa__botoes">
      <button class="btn btn--cheio" type="button" id="btn-mapa">Carregar o mapa</button>
      <a class="btn btn--linha" href="${esc(def.local.mapa)}" target="_blank" rel="noopener">Abrir no Google Maps</a>
    </div>
  </div>
</div>`;
}

function paginaContactos() {
  const corpo = `
<section class="secao secao--topo">
  <div class="envolve">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">Contactos</span></nav>
    <div class="painel-contacto">
      <div class="painel-contacto__info">
        <p class="sobretitulo">Falar connosco</p>
        <h1 class="h-pagina">Venha ver ao vivo</h1>
        <p class="lead">Estamos em Paços de Brandão, Santa Maria da Feira. Ligue, mande mensagem
          ou apareça — mostramos as viaturas sem compromisso.</p>

        <ul class="contacto__lista">
          <li>${ic.tel}<span><b><a href="tel:+351${def.contactos.telefone}">${esc(def.contactos.telefone_texto)}</a></b>
            <small>${NOTA_CHAMADA}</small></span></li>
          <li>${ic.zap}<span><b><a href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${esc(def.contactos.whatsapp_texto)}</a></b>
            <small>WhatsApp ${NOTA_CHAMADA}</small></span></li>
          <li>${ic.zap}<span><b><a href="https://wa.me/${def.contactos.whatsapp_2}" target="_blank" rel="noopener">${esc(def.contactos.whatsapp_2_texto)}</a></b>
            <small>WhatsApp ${NOTA_CHAMADA}</small></span></li>
          <li>${ic.pin}<span><b>${esc(def.local.morada)}</b>
            <small>${esc(def.local.codigo_postal)} ${esc(def.local.localidade)}, ${esc(def.local.concelho)}</small></span></li>
          <li>${ic.relogio}<span><b>Horário</b>
            <small>${def.horario.linhas.map((h) => `${esc(h.dias)}: ${esc(h.horas)}`).join('<br>')}</small></span></li>
        </ul>

        <div class="capa__accoes">
          <a class="btn btn--cheio" href="tel:+351${def.contactos.telefone}">${ic.tel} Ligar agora</a>
          <a class="btn btn--linha" href="https://wa.me/${def.contactos.whatsapp}" target="_blank" rel="noopener">${ic.zap} WhatsApp</a>
        </div>

        <div class="contacto__redes">
          <span>Siga-nos</span>
          <a href="${esc(def.redes.instagram)}" target="_blank" rel="noopener" aria-label="Instagram da NewAuto">${ic.ig}</a>
          <a href="${esc(def.redes.facebook)}" target="_blank" rel="noopener" aria-label="Facebook da NewAuto">${ic.fb}</a>
        </div>
      </div>
      <div class="painel-contacto__mapa">${mapa()}</div>
    </div>

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
function marcarDown(md) {
  const inline = (s) => esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
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

function paginaTexto(ficheiro, pag) {
  const bruto = readFileSync(join(RAIZ, 'conteudo', ficheiro), 'utf8');
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  m[1].split('\n').forEach((l) => {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
  const corpo = `<section class="secao secao--topo">
  <div class="envolve envolve--texto">
    <nav class="migalhas" aria-label="Migalhas"><a href="${u('')}">Início</a> <span>/</span> <span aria-current="page">${esc(meta.titulo)}</span></nav>
    <article class="texto">${marcarDown(m[2])}</article>
  </div>
</section>`;
  return pagina({
    pag, titulo: `${meta.titulo} | ${def.empresa.nome}`, descricao: meta.descricao, corpo,
    jsonld: [migalhasLD([{ nome: 'Início', href: '' }, { nome: meta.titulo }])],
  });
}

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
  for (const [f, pag] of Object.entries(legais)) escrever(`${pag}index.html`, paginaTexto(f, pag));

  escrever('404.html', pagina({
    pag: '404.html', naoIndexar: true,
    titulo: `Página não encontrada | ${def.empresa.nome}`,
    descricao: 'O endereço que procura não existe. Veja as viaturas em stock ou fale connosco.',
    corpo: `<section class="secao secao--topo"><div class="envolve envolve--texto">
      <p class="sobretitulo">Erro 404</p>
      <h1 class="h-pagina">Esta página não existe</h1>
      <p class="lead">O endereço que seguiu não corresponde a nada aqui. Pode ter sido escrito
        com um erro, ou a viatura pode já ter sido vendida.</p>
      <div class="capa__accoes">
        <a class="btn btn--cheio" href="${u('viaturas/')}">Ver as viaturas ${ic.seta}</a>
        <a class="btn btn--linha" href="${u('')}">Voltar ao início</a>
      </div></div></section>`,
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

  /* `_site/` é a pasta que o servidor de revisão serve. Um build de produção
     escrito aqui responde 200 na página e 404 no CSS, no JS e em todas as
     ligações: a página abre a branco e parece que o servidor caiu. Já aconteceu
     e demorou a diagnosticar, por isso passa a dizer-se em voz alta. */
  if (BASE && SAIDA === join(RAIZ, '_site')) {
    console.log(`\n  ATENÇÃO: isto é um build de produção (${BASE}) escrito em _site/,`);
    console.log('  que é a pasta da revisão local — o localhost vai dar 404 no CSS e no JS.');
    console.log('  Para voltar ao local:  node scripts/local.mjs');
    console.log('  Para conferir produção sem estragar o local:  SAIDA=/tmp/prod node scripts/gerar.mjs\n');
  }
}

main();
