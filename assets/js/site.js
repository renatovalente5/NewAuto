/* ==========================================================================
   NEWAUTO

   Regra da casa: o site tem de funcionar sem isto. Sem JavaScript perde-se o
   menu do telemóvel, os filtros, a galeria ampliada e o mapa — e mais nada. O
   stock aparece todo, as fichas lêem-se e os contactos funcionam.

   Por isso não há biblioteca nenhuma: são seis comportamentos pequenos, e
   cada um cabe numa função que se lê de uma vez.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* navegação privada */ } };
  const lido = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const esquecer = (k) => { try { localStorage.removeItem(k); } catch { /* navegação privada */ } };

  /* ------------------------------------------------------------------------
     1. O cabeçalho encolhe ao descer e volta a crescer no topo.

     Os dois limiares são diferentes de propósito — encolhe aos 90 px, volta a
     crescer só abaixo dos 40. Com um limiar único, uma página parada em cima da
     fronteira fica a piscar entre os dois estados, porque a própria mudança de
     altura do cabeçalho move o scroll e volta a disparar o teste.
  ------------------------------------------------------------------------ */
  const topo = $('#topo');
  const subir = $('#subir');
  let encolhido = false;

  function aoRolar() {
    const y = window.scrollY;
    if (!encolhido && y > 90) { encolhido = true; topo?.classList.add('topo--encolhido'); }
    else if (encolhido && y < 40) { encolhido = false; topo?.classList.remove('topo--encolhido'); }
    subir?.classList.toggle('subir--dentro', y > 700);
  }

  let agendado = false;
  addEventListener('scroll', () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; aoRolar(); });
  }, { passive: true });
  aoRolar();

  subir?.addEventListener('click', () => {
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
  });

  /* ------------------------------------------------------------------------
     2. Menu de ecrã inteiro.

     Nasce com `hidden` no HTML e é este script que o tira. Assim, quem não
     tiver JavaScript nunca fica com um painel encostado ao fundo da página que
     não sabe fechar.
  ------------------------------------------------------------------------ */
  const menu = $('#menu');
  const btnMenu = $('#btn-menu');

  if (menu && btnMenu) {
    menu.hidden = false;
    let ultimoFoco = null;
    const focaveis = () => $$('a[href], button:not([disabled])', menu).filter((el) => el.offsetParent !== null);
    const aberto = () => document.body.classList.contains('menu-aberto');

    function abrir() {
      ultimoFoco = document.activeElement;
      document.body.classList.add('menu-aberto');
      btnMenu.setAttribute('aria-expanded', 'true');
      btnMenu.setAttribute('aria-label', 'Fechar menu');
      /* Com o menu aberto o cabeçalho volta ao tamanho grande: é o espaço que
         o menu reserva no topo, e assim o logótipo e o botão de fechar caem
         exactamente onde estavam antes de abrir. */
      topo?.classList.remove('topo--encolhido');
      focaveis()[0]?.focus();
    }

    function fechar({ devolverFoco = true } = {}) {
      document.body.classList.remove('menu-aberto');
      btnMenu.setAttribute('aria-expanded', 'false');
      btnMenu.setAttribute('aria-label', 'Abrir menu');
      encolhido = false;
      aoRolar();
      if (devolverFoco) (ultimoFoco instanceof HTMLElement ? ultimoFoco : btnMenu).focus();
    }

    btnMenu.addEventListener('click', () => (aberto() ? fechar() : abrir()));
    $$('a[href]', menu).forEach((a) => a.addEventListener('click', () => fechar({ devolverFoco: false })));

    document.addEventListener('keydown', (e) => {
      if (!aberto()) return;
      if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
      if (e.key !== 'Tab') return;
      /* Prender o foco: o botão de fechar vive no cabeçalho, fora do painel,
         por isso entra à mão no fim da lista. */
      const lista = [...focaveis(), btnMenu];
      if (!lista.length) return;
      const primeiro = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    });

    const largo = matchMedia('(min-width: 901px)');
    largo.addEventListener('change', (e) => { if (e.matches && aberto()) fechar({ devolverFoco: false }); });
  }

  /* ------------------------------------------------------------------------
     3. Filtros e ordenação da montra.

     Esconde-se com o atributo `hidden`, e a folha de estilo tem
     `[hidden] { display: none !important }`. Sem esse `!important`, o `display`
     que dermos ao cartão ganha à regra do browser e os cartões "escondidos"
     continuam à vista — um filtro que conta certo e não esconde nada.
  ------------------------------------------------------------------------ */
  const forma = $('#filtros');
  const grelha = $('#grelha');

  if (forma && grelha) {
    const cartoes = $$('.cartao', grelha);
    const contagem = $('#contagem');
    const vazio = $('#vazio');
    const ordem = $('#ordem');
    const precoMax = $('#preco-max');
    const precoSaida = $('#preco-saida');
    const limpar = $('#limpar');
    const painel = $('.montra__filtros');
    const btnFiltros = $('#btn-filtros');
    const nf = new Intl.NumberFormat('pt-PT');

    const seleccionados = (nome) => $$(`input[name="${nome}"]:checked`, forma).map((i) => i.value);

    function aplicar({ historico = true } = {}) {
      const criterios = ['marca', 'combustivel', 'caixa', 'segmento']
        .map((c) => [c, seleccionados(c)])
        .filter(([, v]) => v.length);
      const tecto = precoMax ? Number(precoMax.value) : Infinity;

      let n = 0;
      for (const c of cartoes) {
        const passa = criterios.every(([chave, vals]) => vals.includes(c.dataset[chave]))
          && Number(c.dataset.preco) <= tecto;
        c.hidden = !passa;
        if (passa) n++;
      }

      if (contagem) contagem.textContent = n === 1 ? '1 viatura' : `${n} viaturas`;
      if (vazio) vazio.hidden = n > 0;
      if (limpar) limpar.hidden = !criterios.length && tecto >= Number(precoMax?.max ?? 0);

      if (historico) {
        const url = new URL(location.href);
        url.search = '';
        for (const [chave, vals] of criterios) url.searchParams.set(chave, vals.join(','));
        if (precoMax && tecto < Number(precoMax.max)) url.searchParams.set('ate', String(tecto));
        history.replaceState(null, '', url);
      }
    }

    function ordenar() {
      const modo = ordem?.value || 'ordem';
      const chave = {
        'preco-asc': (c) => Number(c.dataset.preco),
        'preco-desc': (c) => -Number(c.dataset.preco),
        'km-asc': (c) => Number(c.dataset.km),
        'ano-desc': (c) => -Number(c.dataset.ano),
        ordem: (_, i) => i,
      }[modo];
      cartoes
        .map((c, i) => [chave(c, i), c])
        .sort((a, b) => a[0] - b[0])
        .forEach(([, c]) => grelha.appendChild(c));
    }

    forma.addEventListener('change', () => aplicar());
    precoMax?.addEventListener('input', () => {
      if (precoSaida) precoSaida.textContent = `${nf.format(Number(precoMax.value))} €`;
      aplicar();
    });
    ordem?.addEventListener('change', ordenar);
    const limparTudo = () => { forma.reset(); if (precoMax) precoMax.value = precoMax.max; precoMax?.dispatchEvent(new Event('input')); aplicar(); };
    limpar?.addEventListener('click', limparTudo);
    $('#limpar-2')?.addEventListener('click', limparTudo);
    btnFiltros?.addEventListener('click', () => {
      const aberto = painel.classList.toggle('aberto');
      btnFiltros.setAttribute('aria-expanded', String(aberto));
    });

    /* Estado inicial vindo do endereço: assim um filtro pode ser partilhado. */
    const p = new URL(location.href).searchParams;
    let algum = false;
    for (const chave of ['marca', 'combustivel', 'caixa', 'segmento']) {
      const vals = (p.get(chave) || '').split(',').filter(Boolean);
      for (const v of vals) {
        const el = $$(`input[name="${chave}"]`, forma).find((i) => i.value === v);
        if (el) { el.checked = true; algum = true; }
      }
    }
    if (p.get('ate') && precoMax) { precoMax.value = p.get('ate'); precoMax.dispatchEvent(new Event('input')); algum = true; }
    if (algum) aplicar({ historico: false });
  }

  /* ------------------------------------------------------------------------
     4. Galeria ampliada, com o <dialog> nativo.

     Sem biblioteca: o elemento já traz o fundo escurecido, o fecho no Esc e a
     devolução do foco. As fotografias vêm de um <script type="application/json">
     escrito pelo gerador, para não haver um segundo sítio a listar ficheiros.
  ------------------------------------------------------------------------ */
  const caixa = $('#lightbox');
  const dados = $('#fotos-viatura');

  if (caixa && dados) {
    const fotos = JSON.parse(dados.textContent);
    const img = $('#lightbox-img');
    const conta = $('#lightbox-conta');
    let actual = 0;

    const mostrar = (i) => {
      actual = (i + fotos.length) % fotos.length;
      img.src = fotos[actual];
      img.alt = `Fotografia ${actual + 1} de ${fotos.length}`;
      if (conta) conta.textContent = `${actual + 1} / ${fotos.length}`;
    };

    $$('[data-galeria]').forEach((b) => b.addEventListener('click', () => {
      mostrar(Number(b.dataset.galeria));
      caixa.showModal();
    }));
    $('.lightbox__fechar')?.addEventListener('click', () => caixa.close());
    $('.lightbox__nav--esq')?.addEventListener('click', () => mostrar(actual - 1));
    $('.lightbox__nav--dir')?.addEventListener('click', () => mostrar(actual + 1));
    caixa.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(actual - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(actual + 1); }
    });
    /* Clicar fora da imagem fecha. O <dialog> ocupa o ecrã todo, por isso
       compara-se com o próprio alvo do clique. */
    caixa.addEventListener('click', (e) => { if (e.target === caixa) caixa.close(); });
  }

  /* ------------------------------------------------------------------------
     5. Mapa só depois de autorizado.

     O embed do Google instala cookies mal é carregado, e o consentimento tem
     de ser prévio (artigo 5.º da Lei 41/2004). Por isso o endereço vive num
     atributo e só se transforma em <iframe> depois do clique.

     As duas funções ficam guardadas fora deste bloco porque o aviso de cookies,
     mais abaixo, também as usa: aceitar ali tem de carregar o mapa na hora, e
     recusar tem de o descarregar. Antes não usava, e quem aceitava as cookies
     ficava a olhar para um segundo botão sem entender porquê.
  ------------------------------------------------------------------------ */
  const CHAVE_MAPA = 'na:mapa';
  let carregarMapa = null;
  let descarregarMapa = null;

  const mapa = $('#mapa');
  if (mapa) {
    const aviso = $('#mapa-aviso');

    carregarMapa = () => {
      if ($('iframe', mapa)) return;
      const f = document.createElement('iframe');
      f.src = mapa.dataset.mapa;
      f.title = 'Mapa com a localização do stand NewAuto, em Paços de Brandão';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      mapa.appendChild(f);
      if (aviso) aviso.hidden = true;
    };

    /* Retirar o consentimento tem de ser tão fácil como dá-lo (artigo 7.º n.º 3
       do RGPD), por isso o iframe sai mesmo — não basta esconder. */
    descarregarMapa = () => {
      $('iframe', mapa)?.remove();
      if (aviso) aviso.hidden = false;
    };

    $('#btn-mapa')?.addEventListener('click', () => { guardar(CHAVE_MAPA, '1'); carregarMapa(); });
    if (lido(CHAVE_MAPA) === '1') carregarMapa();
  }

  /* ------------------------------------------------------------------------
     6. Aviso de cookies.

     Este site não instala cookies nenhum. A única coisa que precisa de
     consentimento em todo o sítio é o mapa do Google na página de contactos, e
     é isso que estes dois botões decidem — o aviso di-lo por palavras.

     Aceitar carrega o mapa na hora, esteja o visitante na página de contactos
     ou não (fica autorizado para quando lá chegar). Recusar retira a
     autorização e descarrega o mapa se ele já estiver aberto. Recusar continua
     a custar exactamente um clique, como aceitar.
  ------------------------------------------------------------------------ */
  const cookies = $('#cookies');
  if (cookies) {
    const CHAVE = 'na:aviso';
    if (!lido(CHAVE)) {
      /* Só aparece depois da primeira pintura, para não competir com o
         conteúdo no momento em que a página abre. */
      setTimeout(() => { cookies.hidden = false; }, 700);
    }
    $$('[data-cookies]', cookies).forEach((b) => b.addEventListener('click', () => {
      const aceitou = b.dataset.cookies === 'aceitar';
      guardar(CHAVE, b.dataset.cookies);
      if (aceitou) { guardar(CHAVE_MAPA, '1'); carregarMapa?.(); }
      else { esquecer(CHAVE_MAPA); descarregarMapa?.(); }
      cookies.hidden = true;
    }));
  }

  /* ------------------------------------------------------------------------
     7. Carrocel das marcas, a girar sozinho.

     Scroll nativo e não `transform` para o grosso do movimento: já foi medido
     noutro projecto que ligações dentro de uma faixa animada por `transform` não
     são clicáveis, porque o alvo desliza entre o `mousedown` e o `mouseup`.

     PORQUE É QUE A FAIXA TRAVAVA. O `scrollLeft` de um contentor só assenta em
     pixéis inteiros — medido no browser do cliente: escrever 100,5 lê 101,
     escrever 100,25 lê 100. A versão anterior fazia
     `scrollLeft = scrollLeft + velocidade * dt`, ou seja LIA DE VOLTA um valor já
     arredondado e somava-lhe meio pixel. Conforme o `dt` oscilava, uns quadros
     arredondavam para baixo e a faixa não andava nada, outros para cima e saltava
     um pixel inteiro. Travar e saltar, e a fracção deitada fora a cada quadro.

     Agora a posição vive aqui, em vírgula flutuante, e nunca é lida do DOM. A
     parte inteira vai no `scrollLeft` e a fracção vai num `translateX` da pista,
     que aceita sub-pixel. O deslocamento do `transform` nunca passa de 1 px, por
     isso não afecta onde os cliques aterram.

     A VOLTA CONTÍNUA. O HTML traz as marcas uma só vez — sem JavaScript fica uma
     fila limpa que se arrasta com o dedo. Os clones são feitos aqui, tantos
     quantos a largura pedir: para a volta não deixar buraco, o conteúdo total tem
     de chegar à largura de um grupo mais a largura visível. Levam `aria-hidden` e
     `tabindex="-1"` — existem para os olhos, não para quem ouve a página.

     O movimento é feito em JavaScript e não em CSS por uma razão medida: a regra
     global de `prefers-reduced-motion` corta a duração das animações para .01ms
     sem lhes tocar nas iterações, o que numa animação infinita não a pára —
     acelera-a até piscar. Aqui, «menos movimento» é movimento nenhum.
  ------------------------------------------------------------------------ */
  const fila = $('#marcas');
  const pista = $('#marcas-pista');
  if (fila && pista && pista.children.length) {
    const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
    const originais = [...pista.children];
    let larguraGrupo = 0;
    let pos = 0;

    function preparar() {
      for (const el of [...pista.children]) if (el.dataset.clone) el.remove();
      const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
      larguraGrupo = originais.reduce((a, el) => a + el.getBoundingClientRect().width, 0)
        + gap * originais.length;
      if (!larguraGrupo) return;

      const preciso = larguraGrupo + fila.clientWidth;
      let copias = 0;
      while (larguraGrupo * (copias + 1) < preciso && copias < 12) {
        for (const el of originais) {
          const c = el.cloneNode(true);
          c.dataset.clone = '1';
          c.setAttribute('aria-hidden', 'true');
          c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
          pista.appendChild(c);
        }
        copias++;
      }
      pos = fila.scrollLeft;
    }

    let sobre = false;
    let visivel = true;
    let ultimo = 0;
    const VELOCIDADE = 34;   // px por segundo

    function passo(agora) {
      if (!ultimo) ultimo = agora;
      const dt = Math.min((agora - ultimo) / 1000, 0.05);
      ultimo = agora;

      if (!sobre && visivel && !menosMovimento.matches && larguraGrupo > 0) {
        pos += VELOCIDADE * dt;
        /* À largura de um grupo o que se vê é igual ao início, por isso voltar
           atrás essa distância não se nota. */
        if (pos >= larguraGrupo) pos -= larguraGrupo;
        const inteiro = Math.floor(pos);
        fila.scrollLeft = inteiro;
        pista.style.transform = `translateX(${-(pos - inteiro).toFixed(3)}px)`;
      }
      requestAnimationFrame(passo);
    }

    fila.addEventListener('pointerenter', () => { sobre = true; });
    fila.addEventListener('pointerleave', () => { sobre = false; });
    fila.addEventListener('focusin', () => { sobre = true; });
    fila.addEventListener('focusout', () => { sobre = false; });
    fila.addEventListener('pointerdown', () => { sobre = true; });
    addEventListener('pointerup', () => { sobre = false; });

    /* Se for o utilizador a arrastar, a nossa posição fica desactualizada e ao
       retomar a faixa saltaria para trás. Enquanto ele mexe, seguimos o que ele
       faz. */
    fila.addEventListener('scroll', () => { if (sobre) pos = fila.scrollLeft; }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(fila);
    }

    let reagendado;
    addEventListener('resize', () => { clearTimeout(reagendado); reagendado = setTimeout(preparar, 150); });
    menosMovimento.addEventListener('change', preparar);
    preparar();
    requestAnimationFrame(passo);
  }
})();
