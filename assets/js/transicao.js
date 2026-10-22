/* A FOTOGRAFIA QUE VOA DO CARTÃO PARA A FICHA (e volta ao cartão).
 *
 * View Transitions entre páginas (o @view-transition no estilo.css): o browser
 * fotografa a página que sai e anima até à que entra, e o que tiver o mesmo
 * `view-transition-name` nas duas voa de um sítio para o outro. Aqui decide-se
 * QUEM leva o nome «foto-viatura» em cada página, um elemento de cada vez:
 * dois com o mesmo nome e o browser desiste da transição inteira — foi por
 * isso que os cartões deixaram de o trazer no HTML (com todos nomeados, os
 * carros das «Viaturas semelhantes» voavam também, por cima do que se clicou).
 *
 *   · Na ficha, a galeria tem-no sempre (no CSS).
 *   · Ao carregar num cartão, a fotografia desse cartão leva-o (e, se a página
 *     for uma ficha, a galeria dela larga-o — senão eram dois).
 *   · Ao voltar de uma ficha (o «voltar» do browser, ou um link), leva-o o
 *     cartão dessa viatura, se estiver à vista: a fotografia volta ao lugar.
 *
 * Vai EM LINHA no <head> (o gerar.mjs mete-o lá): o `pagereveal` tem de estar
 * à escuta antes da primeira pintura da página que entra. Quem não tem View
 * Transitions entre páginas (o Firefox) navega como sempre: nada aqui é
 * preciso para o site funcionar. */
(() => {
  const NOME = 'foto-viatura';
  const DE = 'na-vt-de';      // a ficha de onde se saiu (o slug)
  const PARA = 'na-vt-para';  // a ficha do cartão em que se carregou (o slug)

  const fichaDe = (href) => {
    try { return /\/viaturas\/([a-z0-9-]+)\/?$/.exec(new URL(href, location.href).pathname)?.[1] ?? null; } catch { return null; }
  };
  const palco = () => document.querySelector('.galeria__palco');
  const ler = (k) => { try { const v = sessionStorage.getItem(k); sessionStorage.removeItem(k); return v; } catch { return null; } };
  const guardar = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* sem sessionStorage: só não há a volta */ } };

  /* O que se pôs aqui, para o tirar todo antes de pôr outra vez (uma página
     que volta da cache do «voltar» traz o da última vez). */
  const postos = [];
  const limpar = () => { for (const [el, prop] of postos.splice(0)) el.style.removeProperty(prop); };
  const por = (el, nome = NOME) => { el.style.setProperty('view-transition-name', nome); postos.push([el, 'view-transition-name']); };
  /* Os cartões têm content-visibility: auto, e o que está por pintar não
     entra na transição. No primeiro fotograma da página que entra ainda
     nenhum foi pintado: sem isto, no «voltar», a fotografia não tinha onde
     pousar. */
  const porNoCartao = (foto) => {
    por(foto);
    const c = foto.closest('.cartao');
    if (c) { c.style.setProperty('content-visibility', 'visible'); postos.push([c, 'content-visibility']); }
    /* O contador de fotografias é do cartão: na galeria não existe, e ia
       ficar a pairar por cima dela até ao fim do voo. */
    const n = foto.querySelector('.cartao__fotos');
    if (n) { n.style.setProperty('visibility', 'hidden'); postos.push([n, 'visibility']); }
    /* Sem o zoom de passar o rato: com ele, a fotografia do cartão ia 4,5 %
       maior do que a da galeria, e ao pousar as duas não batiam — a imagem
       encolhia depois de chegar. */
    const img = foto.querySelector('img');
    if (img) {
      img.style.setProperty('transition', 'none'); img.style.setProperty('transform', 'none');
      postos.push([img, 'transition'], [img, 'transform']);
    }
  };

  const fotoDoCartao = (slug) => {
    for (const a of document.querySelectorAll('a.cartao__link')) if (fichaDe(a.href) === slug) return a.querySelector('.cartao__foto');
    return null;
  };
  /* Um cartão fora do ecrã não leva o nome: a fotografia ia voar para fora da
     vista (e um cartão com content-visibility por pintar nem conta). */
  const aVista = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a.cartao__link') : null;
    const slug = a && fichaDe(a.href);
    const foto = a?.querySelector('.cartao__foto');
    if (!slug || !foto) return;
    limpar();
    const p = palco();
    if (p) por(p, 'none');
    porNoCartao(foto);
    guardar(PARA, slug);
  });

  /* Ao sair de uma ficha, fica dito qual era: a página que entra procura o
     cartão dela. (O pagehide é para quem não tem pageswap.) */
  const aSair = () => { const s = fichaDe(location.href); if (s && palco()) guardar(DE, s); };
  addEventListener('pageswap', aSair);
  addEventListener('pagehide', aSair);

  addEventListener('pagereveal', (e) => {
    const para = ler(PARA);
    const de = ler(DE);
    const html = document.documentElement;
    limpar();
    html.classList.remove('vt-espera', 'vt-nitida');
    if (!e.viewTransition) return;
    const aqui = fichaDe(location.href);
    const p = palco();
    if (p && de && de !== aqui && para !== aqui) {
      /* Voltou-se de OUTRA ficha a esta (pelas «Viaturas semelhantes»): a
         galeria desta é outro carro, e quem recebe a fotografia é o cartão
         dele, aqui em baixo. */
      por(p, 'none');
      const f = fotoDoCartao(de);
      if (f && aVista(f)) porNoCartao(f);
    } else if (!p && de) {
      const f = fotoDoCartao(de);
      if (f && aVista(f)) porNoCartao(f);
    }
    /* Na ida para uma ficha: com a fotografia da galeria já carregada neste
       instante (pré-carregada ao passar o rato), voa ela, a nítida, desde o
       arranque e pousa sem trocar de imagem («vt-nitida» no estilo.css). Sem
       ela, voa a do cartão («vt-espera») e cede-lhe o lugar em pleno voo
       logo que ela esteja pronta a pintar — a imagem de chegada é viva, no
       Chrome e no Safari (provado em velocidade real; em câmara lenta, por
       playbackRate, o Safari mostra um vazio que não existe). */
    const img = p && !postos.some(([el]) => el === p) ? p.querySelector('img') : null;
    let emVoo = true;
    if (img) {
      if (img.complete && img.naturalWidth > 0) html.classList.add('vt-nitida');
      else { html.classList.add('vt-espera'); img.decode().then(() => { if (emVoo) html.classList.add('vt-nitida'); }, () => {}); }
    }
    e.viewTransition.finished.finally(() => { emVoo = false; limpar(); html.classList.remove('vt-espera', 'vt-nitida'); });
  });
})();
