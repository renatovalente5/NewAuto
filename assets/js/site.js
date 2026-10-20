/* ==========================================================================
   NEWAUTO

   Regra da casa: o site tem de funcionar sem isto. Sem JavaScript perde-se o
   menu do telemóvel, os filtros, a fotografia ampliada e o mapa — e mais nada.
   O stock aparece todo, as fichas lêem-se, a galeria desliza com o dedo e os
   contactos funcionam.

   Sem biblioteca nenhuma: cada comportamento cabe num bloco que se lê de uma vez.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* navegação privada */ } };
  const lido = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const esquecer = (k) => { try { localStorage.removeItem(k); } catch { /* navegação privada */ } };
  const NF = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' });
  const suave = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const largo = matchMedia('(min-width: 1024px)');

  /* ------------------------------------------------------------------------
     1. O cabeçalho encolhe ao descer e volta a crescer no topo.

     Dois limiares diferentes de propósito — encolhe aos 90 px, cresce só abaixo
     dos 30. Com um limiar único, uma página parada em cima da fronteira fica a
     piscar, porque a própria mudança de altura mexe no scroll.
  ------------------------------------------------------------------------ */
  const topo = $('#topo');
  let encolhido = false;
  function aoRolar() {
    const y = window.scrollY;
    if (!encolhido && y > 90) { encolhido = true; topo?.classList.add('topo--encolhido'); }
    else if (encolhido && y < 30) { encolhido = false; topo?.classList.remove('topo--encolhido'); }
  }
  let agendado = false;
  addEventListener('scroll', () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; aoRolar(); });
  }, { passive: true });
  aoRolar();

  /* ------------------------------------------------------------------------
     2. Menu de ecrã inteiro.

     Nasce com `hidden` no HTML e é este script que o tira: quem não tiver
     JavaScript nunca fica com um painel que não sabe fechar.
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
      /* O cabeçalho volta ao tamanho grande: é o espaço que o menu reserva no
         topo, e assim o botão de fechar cai onde estava o de abrir. */
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
      /* Prender o foco: o botão de fechar vive no cabeçalho, fora do painel. */
      const lista = [...focaveis(), btnMenu];
      const primeiro = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    });
    largo.addEventListener('change', (e) => { if (e.matches && aberto()) fechar({ devolverFoco: false }); });
  }

  /* ------------------------------------------------------------------------
     3. Montra: filtros que contam, ordenação, e a folha do telemóvel.

     Cada opção mostra quantas viaturas daria SE fosse escolhida, com os outros
     filtros como estão — e apaga-se quando daria zero. O estado vai para o
     endereço, para um filtro se poder partilhar (e as marcas da página inicial
     entram por aí: `viaturas/?marca=BMW`).

     Esconde-se com `hidden`, e a folha de estilo tem `[hidden] { display: none
     !important }`. Sem esse `!important`, o `display` do cartão ganhava e os
     cartões «escondidos» continuavam à vista.
  ------------------------------------------------------------------------ */
  const forma = $('#filtros');
  const grelha = $('#grelha');
  if (forma && grelha) {
    const cartoes = $$('.cartao', grelha);
    const GRUPOS = ['marca', 'segmento', 'combustivel', 'caixa'];
    const cursores = [
      { el: $('#preco-max'), chave: 'preco', param: 'ate', rot: (v) => `Até ${NF.format(v)} €` },
      { el: $('#km-max'), chave: 'km', param: 'km', rot: (v) => `Até ${NF.format(v)} km` },
    ].filter((c) => c.el);
    const contagem = $('#contagem');
    const vazio = $('#vazio');
    const activos = $('#activos');
    const ordem = $('#ordem');
    const limpar = $('#limpar');
    const btnFiltros = $('#btn-filtros');
    const nFiltros = $('#n-filtros');
    const folha = $('#folha');
    const folhaCorpo = $('#folha-corpo');
    const folhaVer = $('#folha-ver');
    const lado = $('#lado-filtros');
    const quantas = (n) => `<b>${n}</b> ${n === 1 ? 'viatura' : 'viaturas'}`;

    const escolhidos = (g) => $$(`input[name="${g}"]:checked`, forma).map((i) => i.value);
    function criterios() {
      const c = GRUPOS.map((g) => [g, escolhidos(g)]).filter(([, v]) => v.length);
      const tectos = cursores.map((k) => [k, Number(k.el.value)]).filter(([k, v]) => v < Number(k.el.max));
      return { c, tectos };
    }
    const passa = (cartao, { c, tectos }, ignorar = '') =>
      c.every(([g, vals]) => g === ignorar || vals.includes(cartao.dataset[g]))
      && tectos.every(([k, v]) => Number(cartao.dataset[k.chave]) <= v);

    function aplicar({ historico = true } = {}) {
      const cr = criterios();
      let n = 0;
      for (const c of cartoes) {
        const ok = passa(c, cr);
        c.hidden = !ok;
        if (ok) n++;
      }
      if (contagem) contagem.innerHTML = quantas(n);
      if (vazio) vazio.hidden = n > 0;
      if (folhaVer) folhaVer.textContent = n === 0 ? 'Nenhuma viatura' : `Ver ${n} ${n === 1 ? 'viatura' : 'viaturas'}`;

      /* As contagens de cada opção: quantas passariam com esta opção, mantendo
         os outros grupos como estão. */
      for (const g of GRUPOS) {
        for (const input of $$(`input[name="${g}"]`, forma)) {
          const k = cartoes.filter((c) => passa(c, cr, g) && c.dataset[g] === input.value).length;
          const chip = input.closest('.chip');
          const b = $('[data-n]', chip);
          if (b) b.textContent = k;
          chip.classList.toggle('chip--zero', k === 0 && !input.checked);
          chip.classList.toggle('chip--on', input.checked);
        }
      }

      const total = cr.c.reduce((a, [, v]) => a + v.length, 0) + cr.tectos.length;
      if (limpar) limpar.hidden = total === 0;
      if (nFiltros) { nFiltros.hidden = total === 0; nFiltros.textContent = total; }

      if (activos) {
        activos.innerHTML = '';
        for (const [g, vals] of cr.c) for (const v of vals) activos.append(etiqueta(v, () => { $(`input[name="${g}"][value="${CSS.escape(v)}"]`, forma).checked = false; aplicar(); }));
        for (const [k, v] of cr.tectos) activos.append(etiqueta(k.rot(v), () => { k.el.value = k.el.max; mostrarCursor(k); aplicar(); }));
        if (total > 1) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'ligacao'; b.textContent = 'Limpar tudo';
          b.addEventListener('click', limparTudo);
          activos.append(b);
        }
        activos.hidden = total === 0;
      }

      if (historico) {
        const url = new URL(location.href);
        url.search = '';
        for (const [g, vals] of cr.c) url.searchParams.set(g, vals.join(','));
        for (const [k, v] of cr.tectos) url.searchParams.set(k.param, String(v));
        if (ordem && ordem.value !== 'ordem') url.searchParams.set('ordem', ordem.value);
        history.replaceState(null, '', url);
      }
    }

    function etiqueta(texto, tirar) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'activo';
      b.setAttribute('aria-label', `Tirar o filtro ${texto}`);
      b.innerHTML = `<span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
      b.firstChild.textContent = texto;
      b.addEventListener('click', tirar);
      return b;
    }

    function mostrarCursor(k) {
      const saida = $(`#${k.el.id}-saida`);
      const v = Number(k.el.value);
      if (saida) saida.textContent = k.chave === 'preco' ? `${NF.format(v)} €` : `${NF.format(v)} km`;
    }

    function ordenar() {
      const modo = ordem?.value || 'ordem';
      const chave = {
        'preco-asc': (c) => Number(c.dataset.preco),
        'preco-desc': (c) => -Number(c.dataset.preco),
        'km-asc': (c) => Number(c.dataset.km),
        'ano-desc': (c) => -Number(c.dataset.ano),
        ordem: (c) => Number(c.dataset.ordem),
      }[modo];
      cartoes
        .map((c) => [chave(c), Number(c.dataset.ordem), c])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .forEach(([, , c]) => grelha.appendChild(c));
    }

    function limparTudo() {
      forma.reset();
      cursores.forEach((k) => { k.el.value = k.el.max; mostrarCursor(k); });
      aplicar();
    }

    forma.addEventListener('change', () => aplicar());
    cursores.forEach((k) => k.el.addEventListener('input', () => { mostrarCursor(k); aplicar(); }));
    ordem?.addEventListener('change', () => { ordenar(); aplicar(); });
    limpar?.addEventListener('click', limparTudo);
    $('#limpar-2')?.addEventListener('click', limparTudo);
    $('#folha-limpar')?.addEventListener('click', limparTudo);

    /* A folha do telemóvel. O formulário muda-se para dentro dela ao abrir e
       volta para a coluna ao fechar — o que estava escolhido vai junto.
       `devolver()` é idempotente e chamado de vários sítios: há browsers onde o
       `close()` não dispara o evento `close`. */
    if (folha && folhaCorpo && btnFiltros && lado) {
      btnFiltros.hidden = false;
      if (folha.open) folha.close();   // o Chrome restaura o [open] ao recarregar
      const devolver = () => { if (forma.parentElement !== lado) lado.prepend(forma); };
      const fecharFolha = () => { if (folha.open) folha.close(); devolver(); btnFiltros.focus(); };
      btnFiltros.addEventListener('click', () => {
        folhaCorpo.append(forma);
        folha.showModal();
      });
      $$('[data-fechar]', folha).forEach((b) => b.addEventListener('click', fecharFolha));
      folha.addEventListener('close', devolver);
      folha.addEventListener('click', (e) => { if (e.target === folha) fecharFolha(); });
      largo.addEventListener('change', (e) => { if (e.matches) { if (folha.open) folha.close(); devolver(); } });
    }

    /* Estado inicial vindo do endereço. */
    const p = new URL(location.href).searchParams;
    for (const g of GRUPOS) {
      for (const v of (p.get(g) || '').split(',').filter(Boolean)) {
        const el = $$(`input[name="${g}"]`, forma).find((i) => i.value === v);
        if (el) el.checked = true;
      }
    }
    for (const k of cursores) {
      const v = Number(p.get(k.param));
      if (v) { k.el.value = String(v); mostrarCursor(k); }
    }
    if (ordem && p.get('ordem') && [...ordem.options].some((o) => o.value === p.get('ordem'))) {
      ordem.value = p.get('ordem');
      ordenar();
    }
    aplicar({ historico: false });
  }

  /* ------------------------------------------------------------------------
     4. Galeria da ficha: desliza com o dedo (scroll-snap nativo), setas no
        computador, miniaturas, contador, e a fotografia ampliada num <dialog>.

     Sem JavaScript a faixa continua a deslizar e as miniaturas são âncoras.
  ------------------------------------------------------------------------ */
  const pista = $('#galeria-pista');
  if (pista) {
    const slides = $$('.galeria__slide', pista);
    const actual = $('#galeria-actual');
    const minis = $$('.galeria__miniaturas a');
    const total = slides.length;
    let indice = 0;

    const ir = (i, comportamento = suave()) => {
      const alvo = (i + total) % total;
      const salto = Math.abs(alvo - indice) > 1;
      pista.scrollTo({ left: alvo * pista.clientWidth, behavior: salto ? 'auto' : comportamento });
    };
    const marcar = (i) => {
      if (i === indice) return;
      indice = i;
      if (actual) actual.textContent = String(i + 1);
      minis.forEach((m, k) => {
        if (k === i) {
          m.setAttribute('aria-current', 'true');
          /* Rolar a fila das miniaturas, e só ela: um scrollIntoView arrastava a
             página inteira para cima e para baixo. */
          const fila = m.parentElement.parentElement;
          const esq = m.offsetLeft - fila.offsetLeft;
          if (esq < fila.scrollLeft || esq + m.offsetWidth > fila.scrollLeft + fila.clientWidth) {
            fila.scrollTo({ left: esq - fila.clientWidth / 2 + m.offsetWidth / 2, behavior: suave() });
          }
        } else m.removeAttribute('aria-current');
      });
    };
    let pedido = false;
    pista.addEventListener('scroll', () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(() => { pedido = false; marcar(Math.round(pista.scrollLeft / pista.clientWidth)); });
    }, { passive: true });
    $$('#galeria [data-passo]').forEach((b) => b.addEventListener('click', () => ir(indice + Number(b.dataset.passo))));
    minis.forEach((m) => m.addEventListener('click', (e) => { e.preventDefault(); ir(Number(m.dataset.ir)); }));
    pista.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(indice + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(indice - 1); }
    });
    addEventListener('resize', () => pista.scrollTo({ left: indice * pista.clientWidth }));

    /* A fotografia ampliada. As fotografias vêm de um <script type="application/json">
       escrito pelo gerador; os elementos só se criam na primeira abertura. */
    const caixa = $('#lightbox');
    const lbPista = $('#lightbox-pista');
    const lbConta = $('#lightbox-conta');
    const dados = $('#fotos-viatura');
    if (caixa && lbPista && dados) {
      if (caixa.open) caixa.close();
      const fotos = JSON.parse(dados.textContent);
      const titulo = $('.painel__titulo')?.firstChild?.textContent?.trim() || 'Viatura';
      let lbIndice = 0;
      const montar = () => {
        if (lbPista.children.length) return;
        fotos.forEach((f, k) => {
          const li = document.createElement('li');
          const pic = document.createElement('picture');
          if (f.s) {
            const s = document.createElement('source');
            s.type = 'image/webp'; s.srcset = f.s; s.sizes = '100vw';
            pic.append(s);
          }
          const img = document.createElement('img');
          img.src = f.f; img.width = f.w; img.height = f.h; img.decoding = 'async';
          img.loading = 'lazy';
          if (f.m) img.style.maxWidth = `min(100%, ${f.m}px)`;
          img.alt = `${titulo} — fotografia ${k + 1} de ${fotos.length}`;
          pic.append(img);
          li.append(pic);
          lbPista.append(li);
        });
      };
      const mostrarConta = () => { if (lbConta) lbConta.textContent = `${lbIndice + 1} / ${fotos.length}`; };
      const lbIr = (i, comportamento = suave()) => {
        lbIndice = (i + fotos.length) % fotos.length;
        lbPista.scrollTo({ left: lbIndice * lbPista.clientWidth, behavior: comportamento });
        mostrarConta();
      };
      $$('[data-ampliar]', pista).forEach((b) => b.addEventListener('click', () => {
        montar();
        caixa.showModal();
        requestAnimationFrame(() => lbIr(Number(b.dataset.ampliar), 'auto'));
      }));
      let lbPedido = false;
      lbPista.addEventListener('scroll', () => {
        if (lbPedido) return;
        lbPedido = true;
        requestAnimationFrame(() => {
          lbPedido = false;
          lbIndice = Math.round(lbPista.scrollLeft / lbPista.clientWidth);
          mostrarConta();
        });
      }, { passive: true });
      $$('[data-passo]', caixa).forEach((b) => b.addEventListener('click', () => lbIr(lbIndice + Number(b.dataset.passo))));
      $$('[data-fechar]', caixa).forEach((b) => b.addEventListener('click', () => caixa.close()));
      caixa.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); lbIr(lbIndice + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); lbIr(lbIndice - 1); }
      });
      /* Tocar no escuro à volta da fotografia fecha; tocar na fotografia não. */
      lbPista.addEventListener('click', (e) => { if (e.target.tagName === 'LI') caixa.close(); });
      /* Ao fechar, a galeria da ficha fica na fotografia onde a pessoa estava. */
      caixa.addEventListener('close', () => { ir(lbIndice, 'auto'); marcar(lbIndice); });
    }
  }

  /* ------------------------------------------------------------------------
     5. A barra de contacto do telemóvel, na ficha, só aparece quando os botões
        do painel saem do ecrã. Com eles à vista, seria o mesmo botão duas vezes.
  ------------------------------------------------------------------------ */
  const barra = $('#barra-fixa');
  const accoes = $('.painel__accoes');
  if (barra && accoes && 'IntersectionObserver' in window) {
    /* A margem de cima desconta o cabeçalho pegajoso: atrás dele os botões já
       não se vêem, mas para o observador ainda estavam no ecrã. */
    const cab = () => Math.round(topo?.getBoundingClientRect().height || 0);
    new IntersectionObserver(([e]) => {
      barra.classList.toggle('barra-fixa--escondida', e.isIntersecting || e.boundingClientRect.top > innerHeight);
    }, { rootMargin: `-${cab()}px 0px 0px 0px` }).observe(accoes);
  }

  /* ------------------------------------------------------------------------
     6. Partilhar uma viatura: a folha de partilha do telemóvel, ou copiar a
        ligação no computador. Sem nenhuma das duas, o botão nem aparece.
  ------------------------------------------------------------------------ */
  const partilhar = $('#partilhar');
  if (partilhar) {
    const dadosP = { title: partilhar.dataset.titulo, url: partilhar.dataset.url };
    const rot = partilhar.lastChild;
    if (navigator.share) {
      partilhar.hidden = false;
      partilhar.addEventListener('click', () => navigator.share(dadosP).catch(() => {}));
    } else if (navigator.clipboard) {
      partilhar.hidden = false;
      rot.textContent = 'Copiar ligação';
      partilhar.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(dadosP.url); rot.textContent = 'Ligação copiada'; }
        catch { rot.textContent = 'Não foi possível copiar'; }
        setTimeout(() => { rot.textContent = 'Copiar ligação'; }, 2200);
      });
    }
  }

  /* ------------------------------------------------------------------------
     7. Retoma e procura pelo WhatsApp.

     O formulário não envia nada a ninguém: compõe a mensagem e abre o WhatsApp
     de quem está a ver, que é quem decide mandá-la. Sem JavaScript, o próprio
     formulário abre o WhatsApp com uma mensagem genérica.
  ------------------------------------------------------------------------ */
  $$('form[data-pedido]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const numero = new URL(f.action).pathname.replace(/\D/g, '');
    const val = (n) => (f.elements[n]?.value || '').trim();
    const digitos = (n) => val(n).replace(/\D/g, '');
    let texto;
    if (f.dataset.pedido === 'retoma') {
      const partes = [val('carro'), digitos('ano') && `de ${digitos('ano')}`, digitos('km') && `com ${NF.format(Number(digitos('km')))} km`].filter(Boolean);
      texto = `Olá! Gostava de uma avaliação do meu carro para retoma: ${partes.join(', ')}.`;
    } else {
      const ate = digitos('orcamento') ? `, até ${NF.format(Number(digitos('orcamento')))} €` : '';
      texto = `Olá! Procuro ${val('carro')}${ate}. Podem ajudar?`;
    }
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  }));

  /* ------------------------------------------------------------------------
     8. «Aberto agora». Lê o horário estruturado que o gerador escreveu e a hora
        de Lisboa, seja qual for o fuso de quem está a ver. Marca a linha de hoje
        na tabela. É o horário habitual — feriados não estão lá.
  ------------------------------------------------------------------------ */
  const DIAS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DIAS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  $$('.horario[data-horario]').forEach((dl) => {
    let regras;
    try { regras = JSON.parse(dl.dataset.horario); } catch { return; }
    const partes = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Lisbon', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const hoje = DIAS_EN.indexOf(partes.weekday);
    const agora = `${partes.hour}:${partes.minute}`;
    const intervalo = (d) => regras.find((r) => r.dias.includes(DIAS_EN[d]));

    for (const linha of $$('div', dl)) {
      const t = $('dt', linha).textContent.toLowerCase();
      const nomes = DIAS_PT.filter((n) => t.includes(n)).map((n) => DIAS_PT.indexOf(n));
      let cobre = nomes.includes(hoje);
      if (/ a /.test(t) && nomes.length === 2) {
        const [a, b] = nomes.sort((x, y) => t.indexOf(DIAS_PT[x]) - t.indexOf(DIAS_PT[y]));
        cobre = a <= b ? hoje >= a && hoje <= b : hoje >= a || hoje <= b;
      }
      linha.classList.toggle('hoje', cobre);
    }

    const estado = dl.nextElementSibling;
    if (!estado?.classList.contains('estado-agora') || hoje < 0) return;
    const r = intervalo(hoje);
    let texto, aberto = false;
    if (r && agora >= r.abre && agora < r.fecha) { aberto = true; texto = `Aberto agora · fecha às ${r.fecha}`; }
    else if (r && agora < r.abre) texto = `Fechado · abre hoje às ${r.abre}`;
    else {
      for (let k = 1; k <= 7; k++) {
        const d = (hoje + k) % 7;
        const prox = intervalo(d);
        if (prox) {
          texto = `${r ? 'Fechado' : 'Hoje só por marcação'} · abre ${k === 1 ? 'amanhã' : `${DIAS_PT[d]}${d >= 1 && d <= 5 ? '-feira' : ''}`} às ${prox.abre}`;
          break;
        }
      }
    }
    if (!texto) return;
    estado.textContent = texto;
    estado.classList.toggle('estado-agora--aberto', aberto);
    estado.hidden = false;
  });

  /* ------------------------------------------------------------------------
     9. Mapa só depois de autorizado.

     O embed do Google instala cookies mal é carregado, e o consentimento tem de
     ser prévio (artigo 5.º da Lei 41/2004). O endereço vive num atributo e só se
     transforma em <iframe> depois do clique. As duas funções ficam cá fora
     porque o aviso de cookies também as usa.
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
    /* Retirar o consentimento tem de ser tão fácil como dá-lo (RGPD, art. 7.º
       n.º 3): o iframe sai mesmo, não basta escondê-lo. */
    descarregarMapa = () => {
      $('iframe', mapa)?.remove();
      if (aviso) aviso.hidden = false;
    };
    $('#btn-mapa')?.addEventListener('click', () => { guardar(CHAVE_MAPA, '1'); carregarMapa(); });
    if (lido(CHAVE_MAPA) === '1') carregarMapa();
  }

  /* ------------------------------------------------------------------------
     10. Aviso de cookies. Este site não instala nenhum; a única coisa que
         precisa de consentimento é o mapa. Aceitar carrega-o (ou deixa-o
         autorizado); recusar retira a autorização. Os dois custam um clique.
  ------------------------------------------------------------------------ */
  const cookies = $('#cookies');
  if (cookies) {
    const CHAVE = 'na:aviso';
    if (!lido(CHAVE)) setTimeout(() => { cookies.hidden = false; }, 700);
    $$('[data-cookies]', cookies).forEach((b) => b.addEventListener('click', () => {
      const aceitou = b.dataset.cookies === 'aceitar';
      guardar(CHAVE, b.dataset.cookies);
      if (aceitou) { guardar(CHAVE_MAPA, '1'); carregarMapa?.(); }
      else { esquecer(CHAVE_MAPA); descarregarMapa?.(); }
      cookies.hidden = true;
    }));
  }

  /* ------------------------------------------------------------------------
     11. A faixa das marcas gira sozinha — pedido do cliente —, mas só quando
         não cabem todas. Com sete marcas num ecrã largo, uma fila parada que
         se lê de uma vez é melhor do que uma que foge.

     PORQUE É QUE A FAIXA TRAVAVA. O `scrollLeft` de um contentor só assenta em
     pixéis inteiros; somar meio pixel a um valor lido do DOM fazia uns quadros
     não andar e outros saltar. A posição vive aqui, em vírgula flutuante: a parte
     inteira vai no `scrollLeft` e a fracção num `translateX` da pista.

     Os clones levam `aria-hidden` e `tabindex="-1"` — existem para os olhos.
     Movimento em JavaScript e não em CSS: a regra de `prefers-reduced-motion`
     encurta as animações sem as parar, e numa infinita isso só a acelerava.
  ------------------------------------------------------------------------ */
  const fila = $('#marcas');
  const pistaM = $('#marcas-pista');
  if (fila && pistaM && pistaM.children.length) {
    const menosMovimento = matchMedia('(prefers-reduced-motion: reduce)');
    const originais = [...pistaM.children];
    let larguraGrupo = 0;
    let pos = 0;
    let gira = false;

    function preparar() {
      for (const el of [...pistaM.children]) if (el.dataset.clone) el.remove();
      pistaM.style.transform = '';
      fila.classList.remove('marcas--cabe');
      const gap = parseFloat(getComputedStyle(pistaM).columnGap) || 0;
      larguraGrupo = originais.reduce((a, el) => a + el.getBoundingClientRect().width, 0) + gap * originais.length;
      const disponivel = fila.clientWidth - parseFloat(getComputedStyle(fila).paddingLeft) * 2;
      gira = larguraGrupo - gap > disponivel && !menosMovimento.matches;
      if (!gira) {
        if (larguraGrupo - gap <= disponivel) fila.classList.add('marcas--cabe');
        fila.scrollLeft = 0;
        return;
      }
      const preciso = larguraGrupo + fila.clientWidth;
      let copias = 0;
      while (larguraGrupo * (copias + 1) < preciso && copias < 12) {
        for (const el of originais) {
          const c = el.cloneNode(true);
          c.dataset.clone = '1';
          c.setAttribute('aria-hidden', 'true');
          c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
          pistaM.appendChild(c);
        }
        copias++;
      }
      pos = fila.scrollLeft;
    }

    let sobre = false;
    let visivel = true;
    let ultimo = 0;
    const VELOCIDADE = 32;
    function passo(agoraT) {
      if (!ultimo) ultimo = agoraT;
      const dt = Math.min((agoraT - ultimo) / 1000, 0.05);
      ultimo = agoraT;
      if (gira && !sobre && visivel && larguraGrupo > 0) {
        pos += VELOCIDADE * dt;
        if (pos >= larguraGrupo) pos -= larguraGrupo;
        const inteiro = Math.floor(pos);
        fila.scrollLeft = inteiro;
        pistaM.style.transform = `translateX(${-(pos - inteiro).toFixed(3)}px)`;
      }
      requestAnimationFrame(passo);
    }
    fila.addEventListener('pointerenter', () => { sobre = true; });
    fila.addEventListener('pointerleave', () => { sobre = false; });
    fila.addEventListener('focusin', () => { sobre = true; });
    fila.addEventListener('focusout', () => { sobre = false; });
    fila.addEventListener('pointerdown', () => { sobre = true; });
    addEventListener('pointerup', () => { sobre = false; });
    fila.addEventListener('scroll', () => { if (sobre) pos = fila.scrollLeft; }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(fila);
    let reagendado;
    addEventListener('resize', () => { clearTimeout(reagendado); reagendado = setTimeout(preparar, 150); });
    menosMovimento.addEventListener('change', preparar);
    document.fonts?.ready.then(preparar);
    preparar();
    requestAnimationFrame(passo);
  }
})();
