# NewAuto — plano de construção

Cada passo diz **como se prova que ficou feito**. Sem prova, o passo não está feito.
As decisões fundamentadas, com as fontes, estão em [`DECISOES.md`](DECISOES.md) —
112 achados de seis investigações. Aqui está só o que se faz e por que ordem.

---

## O que se apurou antes de planear

**A marca tem cor, e é forte.** Medido no logótipo do cliente: vermelho
`#EA3223` (saturação 0,85, matiz 4,5°), um vermelho secundário `#C1392F` na
palavra «AUTO», e carvão `#292929`/`#333333` no banner. Não há aqui a dúvida
que houve noutros projectos — a paleta está definida pelo cliente e mede-se.

**O logótipo veio dentro de uma fotografia.** O ficheiro é um JPEG com a marca
por cima de uma rua desfocada. Foi extraído por distância à cor da marca, não
por brilho: a primeira tentativa, por luminância, trouxe o bokeh do fundo e
deixava um halo cinzento à volta do símbolo sobre o carvão da navbar.

**A marca já tem um padrão próprio.** O banner das redes sociais é o símbolo
repetido em relevo sobre carvão. Período medido por autocorrelação: 165×104 px.
É o elemento gráfico mais distintivo depois do logótipo e sai de graça — não é
preciso inventar linguagem visual nenhuma.

**As 205 fotografias têm 414×414 px.** Isto decide o desenho do site inteiro e
não é contornável — não há originais maiores. Classificadas uma a uma:

| | |
|---|---|
| interiores | 86 |
| carros inteiros | 48 |
| pormenores de exterior | 22 |
| emblemas | 20 |
| rodas | 12 |
| pessoas | 9 |
| outros | 8 |
| **servem de capa de anúncio** | **45** |

Marcas legíveis: Peugeot 45, BMW 20, Renault 16, Citroën 17, Opel 12,
Mercedes-Benz 11, Seat 6, Alfa Romeo 2, Volkswagen 1.

**Consequência:** a capa do site **não** é uma fotografia de largura total —
a 414 px apareceria mole e esticada. É construída com tipografia e com a textura
da marca, o que calha bem a uma identidade que é assumidamente gráfica. As
fotografias vivem onde cabem: cartões, galerias e mosaicos até ~400 px.

**Os dados das viaturas são de demonstração**, autorizados pelo cliente. Ficam
ancorados na realidade possível: as marcas e modelos saem dos carros que estão
mesmo nas fotografias. Tudo o resto — quilómetros, anos, preços — é para o dono
do stand substituir no backoffice.

---

## O que se traz de novo, e porquê

Não por moda. Cada uma resolve um problema concreto deste site.

1. **A textura da marca como sistema, não como enfeite.** O padrão de setas
   aparece na capa, nas secções escuras e no rodapé, com opacidade e escala
   diferentes. Dá coerência sem precisar de fotografia grande — que é
   exactamente o que falta.
2. **View Transitions entre páginas.** Da montra para a ficha, a fotografia
   cresce em vez de haver um salto branco. Nativo, sem JavaScript.
3. **Filtros que contam.** Cada faceta mostra quantas viaturas tem, e as
   faixas de preço e quilómetros são geradas do stock real — nunca há uma
   faixa que devolva zero.
4. **Galeria com `<dialog>` nativo.** Sem biblioteca, com teclado e Esc.
5. **Viaturas vendidas não desaparecem.** Ficam com a ficha, marcadas, e
   servem de prova de actividade. Apagar páginas que o Google já indexou é
   deitar fora o trabalho de as pôr lá.

Regra que manda em todas: **melhoria progressiva**. Sem JavaScript o site
lê-se, navega-se e mostra todas as viaturas.

---

## Fase 0 — Fundação

| # | Passo | Como se prova |
|---|---|---|
| 0.1 | Repositório `NewAuto` no GitHub | `gh repo view` responde |
| 0.2 | Logótipo extraído do JPEG, em duas versões | renderiza a 40 px e a 400 px sem sujidade, nos dois fundos |
| 0.3 | Textura de setas extraída do banner | ladrilha sem costura visível |
| 0.4 | `BASE` derivado do CNAME desde o primeiro dia | a auditoria confirma prefixo e canónico coerentes |

## Fase 1 — Dados

| # | Passo | Como se prova |
|---|---|---|
| 1.1 | Modelo de dados com os sete campos do DL 74/93 | o gerador recusa publicar uma ficha sem eles |
| 1.2 | 12 viaturas de demonstração, ancoradas nas fotografias reais | marca e modelo correspondem a carros que estão mesmo nas fotos |
| 1.3 | Fotografias associadas por viatura | cada ficha tem capa + galeria |
| 1.4 | Pipeline AVIF/WebP/JPEG em duas larguras | contagem de ficheiros e pesos medidos |

## Fase 2 — Identidade

| # | Passo | Como se prova |
|---|---|---|
| 2.1 | Paleta e escala tipográfica | todos os pares de texto ≥ 4,5:1 |
| 2.2 | Cabeçalho com logótipo grande que encolhe no scroll | alturas medidas nos dois estados, com histerese |
| 2.3 | Menu de ecrã inteiro no telemóvel | ocupa 100 % do ecrã, foco preso, fecha no Esc |
| 2.4 | Textura da marca aplicada | visível na capa, secções escuras e rodapé |

## Fase 3 — Montra e fichas

| # | Passo | Como se prova |
|---|---|---|
| 3.1 | Montra com filtros e contagens | nº visível = nº do contador, medido no DOM |
| 3.2 | Ficha de viatura na ordem que o comprador português conhece | galeria, preço, ficha técnica, equipamento, contacto |
| 3.3 | Galeria em `<dialog>` | abre, navega com setas, fecha no Esc |
| 3.4 | Vendidas marcadas, não apagadas | a ficha responde 200 e diz que está vendida |

## Fase 4 — Páginas e conteúdo

| # | Passo | Como se prova |
|---|---|---|
| 4.1 | Início, Sobre, Garantia, Contactos | responsivo a 320 / 375 / 768 / 1440 |
| 4.2 | Mapa do Google só depois de autorizado | zero pedidos ao Google antes do clique |
| 4.3 | Aviso de cookies simples, com aceitar e recusar do mesmo peso | a escolha fica guardada e não volta a perguntar |
| 4.4 | «(Chamada para a rede móvel nacional)» em todos os telefones | contagem: nº de telefones = nº de avisos |

## Fase 5 — Legal

| # | Passo | Como se prova |
|---|---|---|
| 5.1 | Identificação do prestador — DL 7/2004 art. 10.º | rodapé completo, com marcadores no que falta |
| 5.2 | Livro de Reclamações junto dos restantes links legais | presente em todas as páginas |
| 5.3 | RAL: **CICAP**, competente para Santa Maria da Feira | Despacho 3077/2025 lista o concelho |
| 5.4 | Garantia legal de 3 anos — DL 84/2021 | nenhuma página diz «12 meses» |
| 5.5 | Sem plataforma ODR | revogada a 20-07-2025; não se liga |
| 5.6 | Capital social só se for sociedade | depende da forma jurídica, que é pendência |

## Fase 6 — Backoffice

| # | Passo | Como se prova |
|---|---|---|
| 6.1 | `.pages.yml` com a colecção de viaturas | gravar sem alterar nada deixa o `git diff` vazio |
| 6.2 | `merge: true` | sem isto, gravar apaga os campos não declarados |
| 6.3 | Link «Gestão» discreto no rodapé | a seguir ao Livro de Reclamações |

## Fase 7 — Prova

| # | Passo | Como se prova |
|---|---|---|
| 7.1 | Medição a 320, 375, 414, 768, 1024, 1440, 1920 | zero transbordo horizontal |
| 7.2 | Contraste e teclado | pares medidos; Tab alcança tudo |
| 7.3 | Peso e LCP | LCP < 2,5 s |
| 7.4 | Auditoria automática na Action | falha a publicação se algo partir |

---

## Regras para todos os passos

1. **Nada é dado por feito sem medição.** Capturas de ecrã enganam.
2. **Os dados das viaturas são de demonstração e têm de o parecer** para quem
   os gere — nunca para quem visita, mas o cliente tem de saber o que substituir.
3. **Nada de inventar factos legais.** O que não estiver confirmado fica como
   marcador visível, não como texto plausível.
4. **Tudo degrada.** Sem JavaScript, o site lê-se e vê-se o stock todo.
5. **Verificação no telemóvel primeiro**, não só no CSS.
