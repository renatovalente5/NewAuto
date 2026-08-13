# NewAuto — Documento de Decisões

**Data:** 13-08-2026 · **Base:** 112 achados de seis investigações + estado actual do repositório `/Users/renatovalente/Websites/NewAuto`

**Nota de método:** não reabri as fontes primárias nesta sessão. As decisões abaixo assentam nos achados fornecidos, com o grau de confiança que cada um declara. Onde um achado se declarou «provável» ou «incerto», a decisão herda essa incerteza e está assinalada. A lista do que ficou por saber está no fim e é para ler antes de publicar.

---

## 0. Estado actual do repositório (o que já existe)

| Caminho | Estado |
|---|---|
| `data/definicoes.json` | Existe. Contém NIF `PLACEHOLDER-NIF`, `email: ""`, `nome_completo: "NewAuto — Comércio Automóvel"` (não é uma firma). **Três bloqueios legais activos.** |
| `data/viaturas/` | Vazia. |
| `scripts/imagens.py`, `padrao.py`, `logotipo.py` | Pipeline de imagem em Python/Pillow. Correm à mão, não no build. |
| `assets/img/` | `logo-claro.png`, `logo-escuro.png`, `simbolo.png`, `padrao.png` (textura de setas, período 165×104 medido por autocorrelação). |
| `_fonte/originais/` | 209 ficheiros: **205 a 414×414**, 1 banner 960×355, 1 a 1080×1080. Confirmado por `sips`. |
| Gerador do site | **Não existe ainda.** |
| Git | Sem commits. |

Decisão de arrumação: o pipeline de imagem fica em Python (é ferramenta nossa, corre à mão, não é dependência do site); **o gerador do site é Node sem dependências**, e o build do GitHub Actions só corre o gerador. As duas coisas não se misturam e o `_fonte/` nunca vai para produção.

---

## 1. Legal — lista fechada do que tem de constar no site

### 1.1 Rodapé de todas as páginas

| Elemento | Norma que obriga | Nota |
|---|---|---|
| Firma / denominação social completa | DL 7/2004 art. 10.º n.º 1 al. a); CSC art. 171.º n.º 1 | «NewAuto» só pode aparecer como designação comercial, ao lado da firma |
| Tipo societário («Sociedade por quotas», etc.) | CSC art. 171.º n.º 1 | Só se for sociedade |
| Endereço geográfico: Largo Igreja 133, 4535-335 Paços de Brandão | DL 7/2004 art. 10.º n.º 1 al. b); CSC art. 171.º n.º 1 (sede) | — |
| E-mail **em texto legível** | DL 7/2004 art. 10.º n.º 1 al. b) | Um botão `mailto:` sem o endereço escrito não cumpre |
| NIF / NIPC | DL 7/2004 art. 10.º n.º 1 al. d); CSC art. 171.º n.º 1 | — |
| Conservatória do Registo Comercial + n.º de matrícula | DL 7/2004 art. 10.º n.º 1 al. c); CSC art. 171.º n.º 1 | — |
| **Capital social** (e capital realizado, se diferente) | CSC art. 171.º n.º 2 | Ver 1.2 |
| Link destacado para `livroreclamacoes.pt` | DL 156/2005 art. 5.º-B n.º 2 | Botão com selo, não linha de texto corrido |
| «Entidade competente para apreciar a reclamação: ASAE» | DL 156/2005 art. 11.º n.º 1 al. a) | Não escrever AMT nem DECO |
| «(Chamada para a rede móvel nacional)» junto de cada nº | DL 59/2021 art. 3.º n.º 1, red. da Lei 14/2023 | Visibilidade equivalente, não cinzento 10px |
| Links: Privacidade · Cookies · Termos · Garantia · Resolução de litígios | Lei 24/96 art. 8.º n.º 1 al. g) e i) | — |

### 1.2 Capital social: obrigatório ou não?

**Resposta directa: depende da forma jurídica, e a forma jurídica da NewAuto é desconhecida — é um bloqueio.**

- **Se for sociedade por quotas (Lda / Unipessoal Lda), sociedade anónima ou em comandita por acções: é OBRIGATÓRIO.** O CSC art. 171.º n.º 1 enumera expressamente «sítios na Internet» entre os actos externos, e o n.º 2 acrescenta a essas sociedades o dever de indicar o capital social e o montante realizado quando diverso. Não é opcional nem uma questão de gosto de design. Sanção: art. 528.º n.º 2, coima de €250 a €1.500.
- **Se for empresário em nome individual (ENI): NÃO se aplica.** O CSC rege sociedades comerciais; um ENI não é uma. Nesse caso, o rodapé leva nome civil completo + «que usa a designação comercial NewAuto» + morada + NIF, e é **falso** inventar NIPC, conservatória, matrícula ou capital social.
- Regra pouco conhecida a verificar com o contabilista: se o capital próprio segundo o último balanço aprovado for igual ou inferior a metade do capital social, esse montante **também** tem de constar (art. 171.º n.º 2, parte final).

Uma certidão permanente resolve firma, NIPC, conservatória, matrícula e capital social de uma vez. **Enquanto não a tivermos, o rodapé fica com marcadores visíveis e o site não vai para produção.**

### 1.3 Entidade RAL competente: CICAP — e como se confirmou

**CICAP — Centro de Informação de Consumo e Arbitragem do Porto (Tribunal Arbitral de Consumo), www.cicap.pt.**

Confirmação: Despacho n.º 3077/2025 da Secretária de Estado da Justiça (DR, 2.ª série, n.º 48, de 10-03-2025), ponto 2, ampliou a competência territorial do CICAP a todos os municípios da Área Metropolitana do Porto, **listando expressamente Santa Maria da Feira**. Paços de Brandão é freguesia de Santa Maria da Feira.

A armadilha é o distrito: Santa Maria da Feira é do **distrito de Aveiro** mas integra a **AMP**, e é a pertença à AMP que manda. É por isso que aqui é CICAP e não CNIACC (residual) nem qualquer centro de Aveiro. O contraste útil, do histórico desta carteira: Ovar é distrito de Aveiro e **não** está na AMP, e por isso a Marmovar ficou com CNIACC; São João da Madeira e Santa Maria da Feira estão, e ficaram com CICAP. A conclusão para a NewAuto coincide com a que já se tinha atingido, por via independente, para a Feira Norte Auto e para a HV Limpezas.

O que **não** escrever: «CNIACC», «Centro de Arbitragem do Sector Automóvel» (extinto), «somos aderentes» (a vinculação aqui é legal, não por adesão), e **nada de plataforma ODR europeia** — o Regulamento (UE) 2024/3228 revogou o Reg. 524/2013 com efeitos a 20-07-2025; a plataforma já não existe e pôr o link é hoje um defeito.

Redacção fixada para a secção «Resolução de litígios» (página de contactos):

> Em caso de litígio de consumo, o consumidor pode recorrer ao CICAP — Centro de Informação de Consumo e Arbitragem do Porto (Tribunal Arbitral de Consumo), www.cicap.pt, territorialmente competente para o concelho de Santa Maria da Feira. Nos litígios de valor até €5.000, a NewAuto fica vinculada à arbitragem se o consumidor optar por ela (artigo 14.º da Lei n.º 24/96). Mais informação em www.consumidor.gov.pt.

A última frase não é ornamento: é o que torna legítimo e obrigatório nomear o CICAP à luz do art. 18.º n.º 1 da Lei 144/2015 na redacção do DL 102/2017 («vinculados, por adesão ou por imposição legal decorrente de arbitragem necessária»).

### 1.4 Página «Garantia e pós-venda» — obrigatória, não cortesia

Obrigatória por força da Lei 24/96 art. 8.º n.º 1 al. i) (prazo da garantia escrito). Conteúdo fixado:

> **Garantia legal de conformidade de 3 anos** (Decreto-Lei n.º 84/2021). Tratando-se de viatura usada, o prazo pode ser reduzido para 18 meses por acordo entre as partes, proposto e explicado por escrito antes da compra; nesse caso a presunção legal passa de 2 anos para 1 ano.
>
> **Assistência pós-venda 10 anos.** Nos veículos, por serem bens móveis sujeitos a registo, asseguramos assistência pós-venda em condições de mercado adequadas durante 10 anos após a colocação em mercado da última unidade do modelo (artigo 21.º do DL 84/2021).
>
> Direito de rejeição nos primeiros 30 dias; suspensão do prazo durante a reparação; +6 meses por cada reparação, até 4.

**Proibido no copy do site inteiro:** «garantia de 12 meses» (ilegal desde 01-01-2022, o DL 67/2003 foi revogado pelo art. 54.º al. b) do DL 84/2021), «18 meses» apresentado como a garantia da casa, «garantia total», «garantia sem letras pequenas», «garantia vitalícia». Razão: o art. 43.º n.os 1 a 3 do DL 84/2021 transforma o que o site diz em condição contratual vinculativa, na leitura mais favorável ao consumidor; violar os n.os 4 a 6 é contraordenação económica grave (art. 48.º n.º 1 al. l)).

Se alguma viatura for anunciada como «recondicionada», a garantia volta obrigatoriamente aos 3 anos e a menção tem de ir na factura (art. 12.º n.º 3, parte final). O gerador força isso (ver 5).

### 1.5 O que **não** entra no site

| Não pôr | Porquê |
|---|---|
| Link da plataforma ODR europeia | Revogada pelo Reg. (UE) 2024/3228, efeitos 20-07-2025 |
| Consumos e emissões de CO₂ como obrigação | O DL 304/2001 só abrange **automóveis novos** (art. 1.º e art. 2.º al. b)). Um stand só de usados não está abrangido |
| Estimativas de consumo/CO₂ | Se se publicarem voluntariamente, só valores oficiais homologados — o art. 6.º do DL 304/2001 proíbe inscrições susceptíveis de confundir |
| «desde X €», «+IVA», «sob consulta», «preço a combinar» na montra | DL 138/90 arts. 1.º n.º 5 e 6.º n.º 1: preço total, em euros, com todos os impostos |
| Mensalidades, «entrada 0%», simuladores com números | DL 133/2009 art. 5.º: obriga a TAEG e exemplo representativo completo. Opção escolhida: **só «Financiamento: apresentamos propostas de várias entidades — fale connosco»**, sem um único número |
| Preço riscado / «preço anterior» | DL 70/2007 exigiria três campos extra (preço mais baixo dos 30 dias anteriores, data de início, duração). Não se implementa |
| «eco», «verde», «amigo do ambiente», «carbono neutro» | Directiva (UE) 2024/825, aplicável desde 27-09-2026. Só dados verificáveis: autonomia WLTP, emissões oficiais, classe ambiental |
| Fotos/vídeos com derrapagem, rasto de velocidade, mota sem capacete; copy tipo «solta a fera» | Art. 22.º-A do Código da Publicidade, aditado pelo art. 1.º n.º 2 do DL 74/93 |
| Declaração de acessibilidade | DL 82/2022 não se aplica (site-montra não é comércio electrónico; e há a exclusão de microempresas do art. 2.º n.º 5 al. b)). Publicá-la seria falso — mas constrói-se para WCAG 2.1 AA na mesma |
| `aggregateRating` no AutoDealer | A Google proíbe estrelas de auto-avaliação (ver 6) |
| Carrinho, reserva paga, sinal online, «comprar agora» | Evita o DL 24/2014 (livre resolução de 14 dias sobre um automóvel) **e** cumpre os GitHub Additional Product Terms, secção Pages, que proíbem usar o Pages para «run your online business, e-commerce site» |

### 1.6 Lista off-site para entregar ao cliente (não é trabalho de site, mas é onde a ASAE fiscaliza)

1. Livro de reclamações físico **e** registo na plataforma electrónica (o formato electrónico não dispensa o físico — art. 5.º-B n.º 6). Resposta em 15 dias úteis, arquivo 3 anos.
2. Dístico com «Este estabelecimento dispõe de livro de reclamações» e identificação **e morada completas** da ASAE (art. 3.º n.º 1 al. c)).
3. Documento do DL 74/93 art. 2.º n.º 4 afixado em cada viatura, assinado, com duplicado ao comprador. **O site espelha esta obrigação, não a substitui.**
4. Preço afixado em cada viatura, total com impostos (DL 138/90).
5. Mapa de horário afixado no exterior (DL 48/96).
6. Informação de RAL/CICAP em suporte duradouro no balcão (Lei 144/2015 art. 18.º n.º 2).

### 1.7 Desvios aos requisitos explícitos do cliente

**«Aviso de cookies simples» — não se faz banner.** O site nasce sem analítica, sem fontes externas, sem embeds automáticos e sem scripts de terceiros. Nessas condições não há nada a consentir: o art. 5.º n.º 2 al. b) da Lei 41/2004 isenta o estritamente necessário, e entregar HTML não é aceder a informação armazenada no equipamento. Um banner nessas condições pede consentimento para nada, habitua o visitante a clicar sem ler, obriga a manter uma página que descreve cookies inexistentes, e vários banners genéricos introduzem eles próprios o primeiro armazenamento do site.

Substitui-se por três peças, que dão ao cliente o que ele quer (um site que «trata dos cookies») sem o custo:
1. página `/cookies/` informativa, com a redacção já fixada nos achados;
2. consentimento pontual no mapa, na página de contactos;
3. link «Definições do mapa» no rodapé de todas as páginas, para revogar.

Se o cliente insistir no banner depois de explicado: então tem de ter «Aceitar» e «Rejeitar» com igual destaque, tamanho e cor no primeiro nível, sem «X» que valha por aceitação e sem pré-selecção. Mas a recomendação é não o ter.

**«Mapa do Google nos contactos» — sim, mas só depois de clique.** Nunca `iframe` de carregamento automático. O embed normal coloca o cookie `NID` antes de qualquer interacção e transmite IP, cabeçalho e página ao Google, accionando ao mesmo tempo o art. 5.º da Lei 41/2004 (competência sancionatória da **CNPD**, art. 15.º n.º 1, moldura até €5.000.000 para pessoa colectiva) e o Capítulo V do RGPD. Marcador de posição estático com a redacção dos achados, botão «Carregar o mapa», botão «Abrir no Google Maps →» (hiperligação normal com `rel="noreferrer"`, que não precisa de consentimento por ser acção do utilizador) e, por baixo, a morada em texto — que é o que a maioria dos visitantes quer.

Escolha guardada em `localStorage`, chave `newauto:mapa`, valor `{"escolha":"sim"|"nao","data":<timestamp>}`, escrita **apenas no momento do clique**, nunca no arranque, e revalidada aos 6 meses (o `localStorage` não expira sozinho). Guarda-se também a recusa. Verificação obrigatória antes de publicar: separador Rede, zero pedidos para `google.com`, `googleapis.com`, `gstatic.com` e `maps.gstatic.com` antes do clique.

**Tudo o resto é honrado tal como pedido:** logótipo grande na navbar que encolhe no scroll (implementação em 4.6), menu de ecrã inteiro no telemóvel, ícones nos contactos do rodapé, redes sociais, Livro de Reclamações junto aos links legais, link «Gestão» discreto a seguir, «(Chamada para a rede móvel nacional)» em todos os telefones.

---

## 2. Arquitectura

### 2.1 Páginas

| URL | Página | Indexada | Notas |
|---|---|---|---|
| `/` | Início | sim | Capa tipográfica + textura de setas; 6 viaturas em destaque; promessas; contacto |
| `/viaturas/` | Montra | sim | Filtros em fragmento; contagem («48 disponíveis»); ordenação |
| `/viaturas/<marca>-<modelo>-<ano>-<ref>/` | Ficha de viatura | sim | Uma por viatura, incluindo vendidas |
| `/marcas/<marca>/` | Página de marca | sim | **Só se ≥3 viaturas** em stock recorrente |
| `/vendidos/` | Vendidos recentemente | sim | Prova de actividade; não substitui as fichas |
| `/sobre/` | Sobre | sim | «No mercado desde 2018, em Paços de Brandão» |
| `/garantia/` | Garantia e pós-venda | sim | Obrigatória (1.4) |
| `/contactos/` | Contactos | sim | Mapa por clique; horário; secção «Reclamações e resolução de litígios» |
| `/privacidade/` | Política de Privacidade | sim | Estrutura de 10 secções mapeada ao art. 13.º do RGPD |
| `/cookies/` | Cookies | sim | Explica porque não há banner |
| `/termos/` | Termos de utilização | sim | Inclui «As informações sobre viaturas constantes deste sítio têm natureza informativa e não constituem proposta contratual; a venda é feita nas nossas instalações» |
| `/404.html` | Erro | não | — |
| — | «Gestão» | — | Link directo no rodapé para o Pages CMS, `rel="nofollow noreferrer"`. **Sem página própria**, para não criar conteúdo fino indexável |

**Não existem** páginas por concelho («carros usados Ovar», «carros usados Espinho»…). São *doorway pages* na definição literal das políticas de spam da Google. O sinal geográfico vive na homepage, no rodapé, na página de contactos (freguesia, concelho, distrito, acessos A1/A29 em texto corrido) e no perfil do Google Business.

**Não existem** páginas por combustível nem por escalão de preço nesta fase: com dados de demonstração não há massa crítica e o inventário roda. Reavaliar com o Search Console 3 meses depois do lançamento.

### 2.2 Filtros

Estado no **fragmento** (`#marca=bmw&combustivel=diesel&preco=10000-20000&ordem=preco-asc`), não em query string. Razão: num site estático a query string não gera páginas distintas mas gera URLs rastreáveis, e a Google recomenda expressamente manter as facetas fora do rastreio. Com fragmento não se gera um único URL rastreável a mais e dispensa-se `robots.txt` defensivo. Os filtros continuam partilháveis.

Sem biblioteca. Carrega-se `viaturas.json` inteiro (dezenas de viaturas = poucos KB) e aplica-se o padrão do astro-hyperdrive — um array de predicados `CarFilter[]` e `.filter(v => filtros.every(f => f(v)))` — em JavaScript simples. As contagens por faceta («Gasóleo (7)») saem em ~30 linhas do mesmo JSON. As faixas de preço e de quilómetros são geradas no build a partir do stock real, para nunca haver faixa vazia.

Sem resultados é um **estado**, não um erro. (O endpoint do astro-hyperdrive devolve 404 nesse caso; não se copia.)

Sem JS: mostra-se a lista completa, e as páginas `/marcas/<marca>/` são as únicas versões filtradas com URL próprio e ligação interna. Não se faz `<form method="get">`, porque o GitHub Pages ignora a query string e o formulário não faria nada — pior do que não existir.

### 2.3 Modelo de dados de uma viatura

Sete campos derivam directamente do **DL 74/93 art. 2.º n.º 1** (matrícula, preço, ano de construção, data da matrícula, registos anteriores e seu número, garantia de fábrica, garantia de usado). O gerador **recusa publicar** uma ficha com qualquer um deles vazio. Os restantes seguem as etiquetas do `__NEXT_DATA__` do Standvirtual, para o cliente não ter de traduzir mentalmente entre o feed que já preenche e o backoffice.

**Identificação**

| Campo | Tipo | Obrig. | Origem / porquê |
|---|---|---|---|
| `referencia` | string | sim | Referência interna; entra no slug |
| `titulo` | string (max 90) | sim | Marca + modelo + versão, sem ano |
| `marca` | select (enum fechado) | sim | Standvirtual |
| `modelo` | string | sim | Standvirtual |
| `versao` | string | não | Standvirtual «Versão» |
| `matricula` | string, `pattern ^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$` | sim | **DL 74/93 al. a)** |
| `vin` | string | não | Publicado só com autorização expressa (ver 2.5) |

**Estado**

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `estado` | select: `disponivel` \| `reservada` \| `vendida` | sim | Nunca se apaga a viatura |
| `data_venda` | date | condicional | Obrigatório se `estado: vendida`; validado pelo gerador |
| `destaque` | boolean | não | Homepage |
| `oculta` | boolean | não | Tira da montra sem apagar |
| `demonstracao` | boolean | não | Ver 3.4 |

**Preço** — DL 138/90

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `preco` | number, `step 0.01` | sim | **DL 74/93 al. b)**. Total, IVA incluído, sem «desde» |
| `despesas_administrativas` | number, `step 0.01` | não | Se >0, a ficha imprime «Preço total: X» (padrão Só Barroso) |
| `iva_dedutivel` | boolean | não | Etiqueta **secundária**, nunca forma de mostrar um número mais baixo |
| `negociavel` | boolean | não | Standvirtual |
| `aceita_retoma` | boolean | não | Standvirtual |

**Registo e história**

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `ano_construcao` | number, `step 1` | sim | **DL 74/93 al. c)**, conforme o livrete |
| `mes_matricula` | select 01–12 | sim | **DL 74/93 al. d)** |
| `ano_matricula` | number, `step 1` | sim | **DL 74/93 al. d)** |
| `registos_anteriores` | number, `min 0`, `step 1` | sim | **DL 74/93 al. e)** |
| `quilometros` | number, `min 0`, `step 1` | sim | Standvirtual |
| `origem` | select: Nacional \| Importado | sim | Standvirtual `is_imported_car` |
| `proveniencia` | select: Particular \| Gestora de frota \| Rent-a-car \| Empresa \| Desconhecida | não | Só Barroso; diferencia |
| `livro_revisoes` | boolean | não | Autohero |
| `proxima_inspecao` | date | não | Autohero (ITV) |
| `numero_chaves` | number, `step 1` | não | Autohero; substitui o «2.ª Chave» do Standvirtual |

**Garantia** — DL 74/93 + DL 84/2021

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `garantia_usado` | select de **dois** valores fixos | sim | **DL 74/93 al. g)**. Valores: «3 anos — garantia legal de conformidade (DL 84/2021)» \| «3 anos — garantia legal, redutível a 18 meses por acordo escrito antes da compra». **Nunca campo numérico nem texto livre** |
| `garantia_fabrica` | select: Não aplicável \| Sim | sim | **DL 74/93 al. f)** |
| `garantia_fabrica_ate` | date | condicional | Se `garantia_fabrica: Sim` |
| `garantia_fabrica_km` | number, `step 1` | condicional | Idem |
| `recondicionado` | boolean | não | Se `true`, o gerador força `garantia_usado` aos 3 anos e imprime o aviso da menção obrigatória na factura |

**Técnicos**

`combustivel` select (Gasolina, Gasóleo, Híbrido, Híbrido Plug-in, Elétrico, GPL) · `caixa` select (Manual, Automática) · `potencia_cv` number `step 1` · `cilindrada_cc` number `step 1` (omitida em eléctricos) · `bateria_kwh` number `step 0.1` · `autonomia_wltp_km` number `step 1` · `mudancas` number `step 1` · `tracao` select · `segmento` select · `portas` number `step 1` · `lugares` number `step 1` · `cor` string (nome comercial do fabricante, não «Cinza») · `tipo_cor` select · `jantes_polegadas` number `step 1`.

**Consumo e emissões** — `emissoes_co2` number `step 1`, `consumo_l100` number `step 0.1`. Ambos **opcionais** e só com valores oficiais homologados do certificado de conformidade. Nunca estimativas (DL 304/2001 art. 6.º).

**Equipamento** — cinco `select` múltiplos, com a taxonomia fixa do Standvirtual e **só ela**: `equipamento_audio` (Áudio e Multimédia), `equipamento_conforto` (Conforto e Outros Equipamentos), `equipamento_eletronica` (Electrónica e Assistência à Condução), `equipamento_performance` (Performance e Tuning), `equipamento_seguranca` (Segurança). Não se inventam categorias próprias.

Ressalva: em `equipamento_seguranca` admitem-se itens descritivos («Airbags frontais», «Airbags de cortina»); **não** se cria campo numérico de contagem de airbags nem qualquer afirmação sobre estado ou substituição de airbags. É a leitura estreita do precedente PokeAuto — ali o problema era publicitar intervenção em airbags, não descrever o equipamento de série de um carro.

**Media** — `galeria` image múltipla (`max: 40`, `unique: true`, extensões `jpg,jpeg,webp,avif`) · `video_url` string (renderizado como fachada com clique, **nunca** iframe automático — mesma regra do mapa) · `imperfeicoes` lista de objectos `{imagem, legenda}` com `collapsible.summary`.

**Texto** — `body` rich-text. Regra dura: quilometragem, potência e ano **só** podem sair dos campos estruturados, por interpolação, nunca escritos à mão no corpo. É o erro da F2Car (specs dizem 6 077 km, descrição diz 5 500 km) e não é aceitável.

**Interno** — `notas_internas` text com `hidden: true`, nunca renderizado.

### 2.4 Viaturas vendidas

A página **fica no ar, no mesmo URL, com o mesmo conteúdo**. A Google é explícita: não bloquear com 403/404/410 nem `noindex`; marcar como esgotado para as pessoas perceberem o que aconteceu.

O que muda quando `estado: vendida`:
- selo «VENDIDO» visível no topo e a data da venda;
- desaparecem os CTA de contacto **daquela** viatura;
- aparece um bloco de 3 a 6 viaturas semelhantes em stock;
- `availability` no JSON-LD passa a `https://schema.org/SoldOut`;
- o `lastmod` do sitemap actualiza (a marcação como vendida é alteração significativa).

O que **não** muda: galeria, ano, quilómetros, combustível, caixa, extras, descrição. Reduzir a página a «Esta viatura já não está disponível» com HTTP 200 é o padrão exacto do *soft 404* e acaba desindexada, anulando o benefício de a ter mantido.

Ao fim de 12 meses, arquiva-se: 404 simples, sem redireccionar em massa para a homepage (redireccionar para conteúdo não equivalente é tratado como soft 404). 404 e 410 são indiferentes para a Google e nenhum tem efeito no ranking nem na taxa de rastreio.

No backoffice isto é um `select` de estado mais uma data — nunca apagar o ficheiro. Daí `operations: { delete: false, rename: false }`.

### 2.5 Matrícula e VIN — decisão sobre um conflito entre achados

**Matrícula: publica-se na ficha; nunca no URL, no nome do ficheiro, no nome da imagem nem no sitemap.**

Justificação: o DL 74/93 art. 2.º n.º 1 al. a) coloca a matrícula em primeiro lugar na informação obrigatória da venda; a matrícula está fisicamente visível no carro e nas próprias fotografias; e ocultá-la numa ficha que a lei manda prestar seria incoerente. O fundamento RGPD é o art. 6.º n.º 1 al. c) conjugado com a al. f). O que se recusa é pô-la no URL público, onde fica indexada, é ligada permanentemente à página e sobrevive à venda — daí `filename` sem `{fields.matricula}`.

**VIN: campo existe, mas não é publicado por omissão.** Ao contrário da matrícula, não é exigido por nenhuma norma, e permite a terceiros extrair o histórico completo do veículo. Publica-se apenas com autorização expressa do cliente, ponderada viatura a viatura. `Origem` e `Proveniência` já dão a maior parte do sinal de confiança sem esse custo.

### 2.6 Contactos: sem formulário

**Decisão: o site não tem formulário de contacto.** Telefone com clique-para-ligar, WhatsApp e e-mail em texto legível resolvem os contactos de um stand de usados. Não cria subcontratante na acepção do art. 28.º do RGPD, não cria transferência adicional para os EUA, não cria prazo de conservação a gerir, e — sobretudo — não pode avariar em silêncio. O precedente interno é claro: um formulário esteve morto cinco meses e meio por faltar a chamada de execução do Turnstile, sem ninguém notar. Um formulário que não entrega é pior do que não ter formulário.

Se o cliente exigir formulário: Cloudflare Worker próprio + Turnstile + Resend, sem persistência, com teste de ponta a ponta obrigatório antes de publicar e teste periódico depois. **Nunca** Formspree/Web3Forms/Getform/FormSubmit.

O botão de WhatsApp obriga a nomear a **Meta Platforms Ireland Limited** como destinatário na secção 5 da política de privacidade.

---

## 3. As fotografias

### 3.1 O facto

205 das 209 imagens têm **414×414 px**, verificado por `sips`. São quase todas de pormenor: volantes, jantes, emblemas, interiores. Não há um único carro inteiro utilizável. Não há originais maiores.

### 3.2 O que **não** se pode fazer

| Ideia | Porque não |
|---|---|
| Capa de largura total com fotografia | 414 px esticados para 1920 são 4,6× de ampliação. Fica mole e mata a percepção de qualidade logo no primeiro ecrã |
| Ficha de viatura com foto grande em desktop | Idem. A coluna de foto de uma ficha anda nos 700–900 px |
| Os 24–45 fotos por viatura que os bons stands têm | Não há fotos de carros. É norma para as futuras, não para estas |
| Vista 360º e separador de vídeo | Não há material. E o `carcutter/cars-webplayer-js` traz React embutido e carrega o bundle de um CDN externo — estraga a postura sem terceiros |
| Separador «Imperfeições» ao estilo Autohero | O padrão de confiança mais forte que se encontrou, e não há como o alimentar agora. O campo fica criado e vazio |
| `srcset` com três larguras acima de 414 | Não se sobre-amostra. A maior largura útil é 414 |
| Marca de água em fotos de 414 px | Rouba área a uma imagem que já tem pouca |

### 3.3 O que se faz em vez disso

1. **A capa é tipográfica**, construída com o vermelho #EC3223, o carvão #292929/#333333 e a textura de setas já extraída para `assets/img/padrao.png` (período 165×104 medido por autocorrelação). É uma limitação que calha bem: o grafismo da NewAuto é assumidamente gráfico, não fotográfico. Um monograma «NA» angular e um padrão de setas aguentam um ecrã inteiro; uma foto de 414 px não.
2. **Os pormenores são usados como pormenores**, e assumidamente: mosaico de textura entre secções, fundo do bloco «Sobre», separadores. Nunca a fingir de fotografia de stock.
3. **Cartões quadrados.** 414×414 é exactamente 1:1. Os cartões da montra usam recorte quadrado, com largura máxima de **414 CSS px** em desktop. Nada é servido acima da resolução que existe.
4. **Em telemóvel, grelha de 2 colunas enquanto durar a demonstração.** Num telemóvel de 390 px com DPR 3, um cartão de largura total pede 1170 px de imagem e só há 414 — nota-se. A 2 colunas cada cartão pede ~540 px, ainda acima de 414 mas muito mais perto. Quando chegarem fotos a sério, passa-se a 1 coluna com recorte 16:9. É uma linha de CSS controlada pelo modo de demonstração.
5. Geram-se só duas larguras: **414 e 207**, em AVIF, WebP e JPEG. O JPEG é a rede de segurança e o único que o WhatsApp mostra nas pré-visualizações de ligação.

### 3.4 Modo de demonstração — a decisão que evita o acidente

Os dados de viaturas são inventados. Publicar preços, quilómetros, matrículas e garantias inventadas é publicidade enganosa e viola o DL 74/93. Portanto:

`data/definicoes.json` ganha `"modo": "demonstracao" | "producao"`.

Em `demonstracao`:
- barra visível no topo de todas as páginas: «Site em preparação — as viaturas apresentadas são exemplos de demonstração»;
- `<meta name="robots" content="noindex, nofollow">` em todo o site;
- sem sitemap, sem JSON-LD de viatura;
- o build passa mesmo com marcadores de posição no rodapé.

Em `producao`, o build **falha** se: houver `PLACEHOLDER-` em qualquer valor; `email` vazio; alguma viatura com `demonstracao: true`; alguma viatura sem os sete campos do DL 74/93; alguma viatura com menos de 4 fotos (aviso abaixo de 12).

### 3.5 Protocolo de fotografia a entregar ao cliente

O maior retorno visual deste projecto não é CSS, é fotografia. Por viatura: **mínimo 12, alvo 24–35**. Ordem fixa: 3/4 frente → frente → 3/4 traseira → traseira → perfis → jantes → interior (painel, consola, bancos da frente, bancos de trás) → porta-bagagens → motor → conta-quilómetros → pormenores e defeitos. Fundo consistente (parede lisa ou lona) e a mesma sequência de enquadramentos em todas as viaturas — é o que faz a montra parecer uma colecção e não um classificados.

Requisitos técnicos, ditados pelo backoffice: **lado maior ≥ 2000 px**, **JPEG e não HEIC** (o Pages CMS não aceita HEIC e o iPhone grava HEIC por omissão — Definições > Câmara > Formatos > «Mais compatível»), e **≤ 2 MB por ficheiro** antes do upload (o Pages CMS falha acima de ~3,3 MB, sem mensagem de erro que o explique).

Um vídeo de 60 s por viatura, mesmo com telemóvel em plano fixo, coloca o site acima da esmagadora maioria dos stands portugueses. Fica como sugestão comercial, ligado por fachada e não por embed.

---

## 4. Inovação — o que se usa e o que se rejeita

Todas as percentagens são de **Portugal**, calculadas sobre `region-usage-json/PT.json` do caniuse com dados de 2026-08-07. Portugal está à frente da média mundial em quase tudo (mais Chrome/Edge, menos Firefox), pelo que as técnicas recentes são mais seguras aqui do que os números globais sugerem. A excepção a respeitar é o Safari iOS com 11,1%: qualquer técnica sem Safari perde um em cada nove visitantes.

### 4.1 `content-visibility: auto` — 95,0% PT

O maior ganho de desempenho numa montra longa: o browser salta maquetização e pintura de tudo o que está fora do ecrã. Com 200+ fotografias, é a diferença entre arrancar em 300 ms e em 3 s. Aplica-se aos cartões da montra e aos blocos da galeria.

Obrigatório acompanhar de `contain-intrinsic-size: auto 420px` — sem isso o browser assume altura 0 para o que ainda não mediu, a barra de deslocamento salta e o CLS dispara. O `auto` antes do valor faz o browser memorizar a altura real depois da primeira medição.

Degradação: propriedade desconhecida é ignorada. A página fica mais lenta, nunca partida.

### 4.2 Speculation Rules com `prerender` — 79,9% PT

Quatro linhas de HTML, degradação invisível (um `<script type="speculationrules">` é ignorado como tipo desconhecido no Firefox e no Safari), e beneficia 4 em cada 5 visitantes portugueses. Numa montra, o utilizador clica viatura após viatura; com prerender ao passar o rato, a ficha já está renderizada quando o clique acontece. É o maior ganho de percepção de toda a lista, e num site estático não custa nada de servidor.

`eagerness: "moderate"`, nunca `"eager"` — com 30 viaturas na montra, `eager` faria 30 prerenders e torrava os dados móveis do visitante.

### 4.3 View Transitions entre páginas — 84,6% PT

`@view-transition { navigation: auto }`. Cerca de cinco linhas de CSS; quem não suporta tem o corte seco de sempre. Combina com 4.2: prerender + transição = navegação sem corte visível.

Restrição dura: **nada pode depender da transição para funcionar.** 15% dos visitantes nunca a vão ver, e entre eles todo o Firefox (que só implementa o Nível 1, mesmo documento) e o Samsung Internet.

Na grelha de viaturas, `view-transition-name: match-element` (85,2% PT, presente nos três motores), com recurso a nomes gerados pelo gerador (`view-transition-name: v-{referencia}`) como alternativa. Um `view-transition-name` repetido em 30 cartões faz a transição inteira **abortar** — não degrada bonito, simplesmente não acontece.

### 4.4 `<dialog>` + `showModal()` — 99,7% PT

Serve **duas** peças pedidas pelo cliente com a mesma primitiva: o lightbox da galeria e o menu de ecrã inteiro no telemóvel. Dá de graça o backdrop, a captura de foco, o fecho com Escape e o `inert` no resto da página — acessibilidade de teclado sem escrever JS. Substitui o par embla-carousel + glightbox (~30 KB de JS) que o astro-hyperdrive usa.

Uma regra obrigatória: `dialog:not([open]) { display: none }`, senão em browsers sem suporte o conteúdo fica visível em linha na página.

Rejeita-se `popover` (94,6% PT) para o lightbox: cinco pontos a menos e pior modo de falha (sem suporte, o conteúdo fica sempre visível). Fica reservado para coisas não críticas, como o painel de filtros.

### 4.5 Subgrid + `:has()` — 97,4% e 97,6% PT

Subgrid alinha título, preço e botão na mesma linha horizontal entre cartões de alturas diferentes, sem alturas fixas — é o problema real de uma grelha de viaturas com nomes de comprimentos díspares. `:has()` permite estilar o cartão a partir do que ele contém (`.cartao:has(.selo-vendido)`), evitando classes extra no gerador.

Ambos degradam em silêncio, portanto **nunca** se põe regra crítica dentro de um `:has()`. Junta-se `text-wrap: balance` (96,0% PT) só nos títulos de cartão, nunca em parágrafos.

*(Higiene, não inovação: `<picture>` com AVIF → WebP → JPEG (96,9% / 99,8% / universal em PT), `loading="lazy"` (98,9%) e `fetchpriority="high"` (95,3%). A primeira foto da ficha leva `fetchpriority="high"` e **não** leva `loading="lazy"` — é o elemento LCP e pô-la em lazy piora exactamente o que se quer melhorar. `width`/`height` explícitos em todas, lidos pelo pipeline a partir de `_fonte/originais`.)*

### 4.6 Rejeitadas, com o motivo

| Técnica | Suporte PT | Porque não |
|---|---|---|
| **Animações conduzidas pelo scroll** (`animation-timeline`) | 89,3% | Firefox **não tem** em versão estável (Baseline «limited»). Pior: o modo de falha é conteúdo invisível para sempre se se começar em `opacity: 0`. E há a armadilha já conhecida desta carteira — `animation-timeline: view()` num filho de `column-count` colapsa as colunas todas numa só. O logótipo que encolhe no scroll faz-se com um sentinela no topo + `IntersectionObserver` + uma classe: oito linhas, 100% de suporte, sem modo de falha |
| **CSS Anchor Positioning** | 84,1% | O pior número da lista e a pior degradação: um elemento com `position-anchor` que o browser não percebe fica onde o `position: absolute` o deixar, tipicamente no canto errado por cima de outro conteúdo. Para os 16% é preciso escrever o posicionamento de reserva dentro de `@supports not`, ou seja paga-se o trabalho duas vezes. Reavaliar daqui a 12 meses |
| **CSS Nesting servido em cru** | 92,2% + 5,2% parcial | É sintaxe: uma regra encaixada que o browser não percebe faz descartar o bloco inteiro. Único caso da lista onde a degradação apaga maquetização. Ou se compila no pipeline, ou não se usa — e não se vai acrescentar um passo de compilação de CSS a um gerador sem dependências |
| **JPEG XL** | 0,00% real | `usage_perc_y` é literalmente zero. Ninguém o suporta por omissão |
| **Pagefind** | — | Acrescenta um binário Rust ao build e uma pasta `/pagefind` ao repositório para resolver um problema que 30 linhas de JS resolvem com dezenas de viaturas |
| **itemsjs** | — | Bom (Apache-2.0, ~1 ficheiro), mas desnecessário abaixo de ~150 viaturas. Fica como plano B documentado |
| **NoLoJS** (filtro só com `:has()`) | — | GPL-3.0: a técnica é livre, o código do repositório não vai para o site de um cliente. E não cruza facetas, não dá contagens, não guarda estado no URL |
| **astro-hyperdrive** | — | **Não tem ficheiro LICENSE.** Sem licença é «todos os direitos reservados» e não pode ser copiado. Aproveita-se o desenho e o modelo de dados, reescritos de raiz |
| **carcutter/cars-webplayer-js** (360º) | — | Traz React embutido e o script documentado vem de CDN externo. E não há sessões 360 para mostrar |

---

## 5. Pages CMS — esqueleto de configuração

Três armadilhas conhecidas estão resolvidas **antes** de o cliente entrar: `merge: true` (senão qualquer chave fora do esquema é apagada em silêncio ao gravar), `step` em todos os campos numéricos (sem ele o browser recusa decimais, e `min: 0` torna-se a base do step), e `extensions` **sem** `categories` (declarar as duas faz o `categories` ser deitado fora sem aviso).

```yaml
media:
  - name: viaturas
    label: Fotografias de viaturas
    input: assets/viaturas
    output: /assets/viaturas          # ver aviso do BASE abaixo
    extensions: [jpg, jpeg, png, webp, avif]
    rename: safe

content:
  - name: viaturas
    label: Viaturas
    type: collection
    path: data/viaturas
    format: yaml-frontmatter
    filename: "{fields.marca}-{fields.modelo}-{fields.ano_matricula}-{fields.referencia}.md"
    view:
      fields: [titulo, preco, ano_matricula, quilometros, estado, destaque]
      primary: titulo
      sort: [preco, ano_matricula, quilometros, titulo]
      default: { sort: ano_matricula, order: desc }
    operations:
      delete: false     # vendida marca-se, não se apaga
      rename: false     # renomear parte o URL e os links partilhados
    fields:
      # --- Identificação ---
      - { name: referencia, label: Referência interna, type: string, required: true,
          description: "Ex.: NA-014. Entra no endereço da página e não deve mudar depois de publicada." }
      - { name: titulo, label: Título, type: string, required: true, options: { maxlength: 90 },
          description: "Marca, modelo e versão. Sem o ano." }
      - { name: marca, type: select, required: true, options: { values: [Audi, BMW, Citroën, Dacia, Fiat, Ford, Honda, Hyundai, Kia, Mazda, Mercedes-Benz, MINI, Nissan, Opel, Peugeot, Renault, SEAT, Škoda, Toyota, Volkswagen, Volvo] } }
      - { name: modelo, type: string, required: true }
      - { name: versao, label: Versão, type: string }
      - name: matricula
        label: Matrícula
        type: string
        required: true
        pattern: { regex: "^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$", message: "Formato AA-00-AA" }
        description: "Obrigatória por lei na venda de usados (DL 74/93). Aparece na ficha, nunca no endereço da página."
      - { name: vin, label: "VIN (não publicado)", type: string,
          description: "Guardado para uso interno. Só é publicado mediante autorização expressa." }

      # --- Estado ---
      - { name: estado, type: select, required: true,
          options: { values: [ {name: disponivel, label: Disponível}, {name: reservada, label: Reservada}, {name: vendida, label: Vendida} ] } }
      - { name: data_venda, label: Data da venda, type: date,
          description: "Preencher apenas quando o estado passa a Vendida." }
      - { name: destaque, type: boolean, default: false }
      - { name: oculta, label: Esconder da montra, type: boolean, default: false }
      - { name: demonstracao, label: Dados de demonstração, type: boolean, default: false, readonly: true }

      # --- Preço (DL 138/90: total, com IVA) ---
      - { name: preco, label: "Preço total (EUR, com IVA)", type: number, required: true,
          options: { min: 0, step: 0.01 } }
      - { name: despesas_administrativas, label: "Despesas administrativas (EUR)", type: number,
          options: { min: 0, step: 0.01 },
          description: "Se preencher, a ficha mostra o preço total já com estas despesas." }
      - { name: iva_dedutivel, label: IVA dedutível, type: boolean, default: false }
      - { name: negociavel, type: boolean, default: false }
      - { name: aceita_retoma, label: Aceita retoma, type: boolean, default: false }

      # --- Registo e história (DL 74/93) ---
      - { name: ano_construcao, label: Ano de construção, type: number, required: true, options: { min: 1950, max: 2030, step: 1 } }
      - { name: mes_matricula, label: Mês da matrícula, type: select, required: true, options: { values: ["01","02","03","04","05","06","07","08","09","10","11","12"] } }
      - { name: ano_matricula, label: Ano da matrícula, type: number, required: true, options: { min: 1950, max: 2030, step: 1 } }
      - { name: registos_anteriores, label: Registos anteriores de propriedade, type: number, required: true, options: { min: 0, step: 1 } }
      - { name: quilometros, label: Quilómetros, type: number, required: true, options: { min: 0, step: 1 } }
      - { name: origem, type: select, options: { values: [Nacional, Importado] } }
      - { name: proveniencia, label: Proveniência, type: select, options: { values: [Particular, "Gestora de frota", "Rent-a-car", Empresa, Desconhecida] } }
      - { name: livro_revisoes, label: Livro de revisões completo, type: boolean, default: false }
      - { name: proxima_inspecao, label: Próxima inspecção, type: date }
      - { name: numero_chaves, label: Nº de chaves, type: number, options: { min: 0, step: 1 } }

      # --- Garantia (DL 74/93 + DL 84/2021) ---
      - name: garantia_usado
        label: Garantia de usado
        type: select
        required: true
        options:
          values:
            - { name: legal3, label: "3 anos — garantia legal de conformidade (DL 84/2021)" }
            - { name: legal3red18, label: "3 anos — garantia legal, redutível a 18 meses por acordo escrito antes da compra" }
        description: "Não existe garantia de 12 meses. A redução para 18 meses só vale por acordo escrito com aquele comprador."
      - { name: garantia_fabrica, label: Garantia de fábrica, type: select, required: true,
          options: { values: ["Não aplicável", "Sim"] } }
      - { name: garantia_fabrica_ate, label: Garantia de fábrica até, type: date }
      - { name: garantia_fabrica_km, label: "Garantia de fábrica até (km)", type: number, options: { min: 0, step: 1 } }
      - { name: recondicionado, label: Anunciado como recondicionado, type: boolean, default: false,
          description: "Se marcar, a garantia volta obrigatoriamente aos 3 anos e a menção tem de constar da factura." }

      # --- Técnicos ---
      - { name: combustivel, label: Combustível, type: select, required: true,
          options: { values: [Gasolina, Gasóleo, Híbrido, "Híbrido Plug-in", Elétrico, GPL] } }
      - { name: caixa, label: Tipo de caixa, type: select, required: true, options: { values: [Manual, Automática] } }
      - { name: potencia_cv, label: "Potência (cv)", type: number, required: true, options: { min: 1, step: 1 } }
      - { name: cilindrada_cc, label: "Cilindrada (cc)", type: number, options: { min: 0, step: 1 },
          description: "Deixar vazio nos eléctricos." }
      - { name: bateria_kwh, label: "Bateria (kWh)", type: number, options: { min: 0, step: 0.1 } }
      - { name: autonomia_wltp_km, label: "Autonomia WLTP (km)", type: number, options: { min: 0, step: 1 } }
      - { name: tracao, label: Tracção, type: select, options: { values: [Frente, Trás, "4x4"] } }
      - { name: segmento, type: select, required: true,
          options: { values: [Citadino, Utilitário, Berlina, Carrinha, "SUV/TT", Monovolume, Coupé, Cabrio, Comercial] } }
      - { name: portas, label: Nº de portas, type: number, options: { min: 2, max: 5, step: 1 } }
      - { name: lugares, label: Lotação, type: number, options: { min: 1, max: 9, step: 1 } }
      - { name: cor, type: string, required: true, description: "Nome comercial do fabricante, não «cinzento»." }
      - { name: tipo_cor, label: Tipo de cor, type: select, options: { values: [Sólida, Metalizada, Perolada] } }
      - { name: jantes_polegadas, label: "Jantes (polegadas)", type: number, options: { min: 12, max: 24, step: 1 } }

      # --- Consumo (opcional, só valores homologados) ---
      - { name: emissoes_co2, label: "Emissões CO₂ (g/km, WLTP oficial)", type: number, options: { min: 0, step: 1 },
          description: "Só o valor oficial do certificado de conformidade. Nunca estimativas." }
      - { name: consumo_l100, label: "Consumo (l/100 km, WLTP oficial)", type: number, options: { min: 0, step: 0.1 } }

      # --- Equipamento (taxonomia Standvirtual) ---
      - { name: equipamento_audio, label: "Áudio e Multimédia", type: select, options: { multiple: true, values: [] } }
      - { name: equipamento_conforto, label: "Conforto e Outros Equipamentos", type: select, options: { multiple: true, values: [] } }
      - { name: equipamento_eletronica, label: "Electrónica e Assistência à Condução", type: select, options: { multiple: true, values: [] } }
      - { name: equipamento_performance, label: "Performance e Tuning", type: select, options: { multiple: true, values: [] } }
      - { name: equipamento_seguranca, label: "Segurança", type: select, options: { multiple: true, values: [] } }

      # --- Media ---
      - name: galeria
        label: Galeria
        type: image
        options:
          media: viaturas
          multiple: { max: 40 }
          unique: true
          extensions: [jpg, jpeg, webp, avif]
        description: "Mínimo 12 fotografias. JPEG, não HEIC. Máximo 2 MB por ficheiro."
      - { name: video_url, label: "Vídeo (link YouTube)", type: string }
      - name: imperfeicoes
        label: Imperfeições
        type: object
        list:
          max: 10
          collapsible: { collapsed: true, summary: "{legenda} ({index})" }
        fields:
          - { name: imagem, type: image, options: { media: viaturas } }
          - { name: legenda, type: string }

      - { name: body, label: Descrição, type: rich-text,
          description: "Não repita aqui quilómetros, potência nem ano — esses saem automaticamente dos campos acima." }
      - { name: notas_internas, label: Notas internas, type: text, hidden: true }

settings:
  content:
    merge: true            # OBRIGATÓRIO. Sem isto, gravar apaga tudo o que não está no esquema
  commit:
    identity: user         # os commits do cliente ficam com o nome dele
```

### Notas de operação

- **Aviso do BASE:** `output: /assets/viaturas` pressupõe domínio próprio na raiz. Se o site for servido em `github.io/NewAuto/`, os caminhos gravados nos ficheiros ficam partidos. **Decidir o CNAME antes de configurar o `media`.** É a mesma armadilha do Pau Ferro Atelier.
- **Colaborador por e-mail:** o dono do stand é convidado por e-mail e **não precisa de conta GitHub**. Não gerir o `.pages.yml` nem colaboradores.
- **Teste obrigatório antes de entregar:** abrir uma viatura no backoffice, gravar sem alterar nada, e confirmar que `git diff` está vazio. Se não estiver, falta `merge: true` ou falta declarar um campo.
- **`select` de equipamento com `values: []`:** as listas fixas são geradas por nós a partir da taxonomia do Standvirtual e escritas no `.pages.yml`; ficaram aqui vazias para não inchar o esqueleto.
- **Renomear campos ou mudar `path` exige migração dos ficheiros no mesmo commit.** O Pages CMS não migra nada e, com `merge: false`, apagaria a chave antiga.
- **HEIC não é aceite** (a lista de extensões do produto não o inclui) e falha em silêncio, com um genérico «Some files were skipped». Instruir o cliente a pôr o iPhone em «Mais compatível».
- **Limite de upload ~3,3 MB por ficheiro**, empírico, causado pelo envio em base64 contra o limite de corpo de pedido do alojamento. Não há definição no produto que o levante. Se se tornar bloqueio real, a alternativa a testar é o **Sveltia CMS**, que optimiza e redimensiona as imagens no browser antes do commit — ataca a causa, não o sintoma. Não testado.

---

## 6. SEO

### 6.1 Dados estruturados: sim para o negócio, mínimo para as viaturas, nada de expectativas

**Não se implementa `VehicleListing`.** O tipo foi eliminado da Pesquisa Google em 09-09-2025; a documentação responde 301, o suporte no Search Console cessou e a API manteve-o só até Dezembro de 2025. Hoje está extinto. O programa de feeds «Vehicle listings on Google» também foi encerrado — não se constrói feed.

**Não se implementa `merchant listing`.** A Google exige que o comprador possa comprar na própria página; um stand não tem checkout. Fingir com um botão «Contactar» é marcação enganosa e sujeita a acção manual.

**Não se implementa `aggregateRating`** no AutoDealer. A documentação de review snippet é explícita: quem controla as avaliações sobre si próprio fica inelegível para estrelas. Os testemunhos aparecem como texto na página, sem marcação. As estrelas vivem legitimamente no Google Business Profile.

**Não se constrói a página em torno de um bloco de FAQ** à espera de rich snippet: o rich result de FAQ deixou de ser mostrado (nota de changelog de Maio de 2026).

**Implementa-se:**
- **um** `AutoDealer` (subtipo mais específico de `LocalBusiness`, conforme a recomendação da Google) na homepage e na página de contactos: `name` NewAuto, `address` Largo Igreja 133 / 4535-335 / Paços de Brandão, `telephone +351917849998`, `geo` com 5 casas decimais, `openingHoursSpecification` a partir de `data/definicoes.json`, `sameAs` para Instagram, Facebook e Google Business Profile, e `foundingDate: 2018`;
- em cada ficha, um `Car` mínimo (`name`, `brand`, `model`, `vehicleModelDate`, `mileageFromOdometer`, `fuelType`, `vehicleTransmission`, `color`, `numberOfDoors`, `vehicleSeatingCapacity`, `itemCondition: UsedCondition`) mais `offers` com `price`, `priceCurrency: EUR` e `availability` (`InStock` / `SoldOut`).

Custa ~20 linhas emitidas dos campos que o gerador já tem, e nenhum stand português analisado o faz. Mas a promessa ao cliente tem de ser honesta: **hoje não existe nenhum resultado enriquecido para automóveis na galeria da Google** (25 tipos listados, nenhum de veículos; `/structured-data/car` devolve 404). As fichas vão aparecer como resultado azul normal. O JSON-LD serve desambiguação de entidade e os motores de IA, não fichas ricas.

Regra dura ligada ao `offers`: as políticas de dados estruturados proíbem marcar conteúdo invisível. Ou o preço está renderizado em texto visível na página — e está, porque é campo obrigatório — ou o bloco `offers` é **omitido inteiro**. Nunca `price: 0` nem `price: null`.

### 6.2 Estrutura e rastreio

- URLs descritivos: `/viaturas/`, `/viaturas/<marca>-<modelo>-<ano>-<ref>/`, `/marcas/<marca>/` só com ≥3 viaturas.
- Filtros no fragmento (2.2) — nenhum URL rastreável gerado por filtro, e por isso nenhum `robots.txt` defensivo.
- `<title>` das fichas: marca + modelo + versão + ano + «usado» + concelho. Meta description escrita a partir dos campos, distinta por viatura.
- Uma única página de zona genuinamente útil («Onde estamos e como chegar»), com indicações de acesso a partir das localidades vizinhas — não páginas por concelho.
- Termos a servir em texto: «carros usados Santa Maria da Feira», «stand automóveis Paços de Brandão», «carros usados Feira» (é como a zona trata Santa Maria da Feira). Não se persegue «perto de mim»: a distância é o único dos três factores de SEO local que não se optimiza, e uma pesquisa feita no Porto não vai devolver Paços de Brandão.
- Sitemap: **sem `<priority>` e sem `<changefreq>`** (a Google ignora-os). `lastmod` de cada ficha vem da data do último commit que tocou no ficheiro de conteúdo, **nunca** a data do build carimbada em todos os URLs — é precisamente o padrão que faz a Google deixar de confiar no `lastmod` do site inteiro. A marcação como vendida conta como alteração significativa e actualiza o `lastmod`.
- Viaturas vendidas: ver 2.4.

### 6.3 O activo número um não é o site

É o **Google Business Profile verificado**. Os factores oficiais são relevância, distância e proeminência, e a Google diz textualmente que não há forma de pedir ou pagar melhor posicionamento local. Ordem de trabalhos: reclamar e verificar o perfil, categoria primária de stand de automóveis usados (a designação exacta em português confirma-se na interface), morada/horário/atributos/fotos completos, pedir avaliações e responder-lhes — **antes** de afinar meta tags.

O site tem três funções de SEO local: confirmar o NAP exactamente igual ao do perfil («NewAuto», «Largo Igreja 133, 4535-335 Paços de Brandão», «917 849 998»), ser o destino da ligação do perfil, e dar conteúdo que sustente a relevância.

**Google Vehicle Ads (pago) ainda não existe em Portugal** — o Merchant Center lista Espanha, Itália e Alemanha desde Março de 2026. Não prometer formato visual de automóvel no Google, nem orgânico nem pago. Reavaliar dentro de 12 meses.

### 6.4 Enquadramento comercial

O site não substitui o Standvirtual. O portal traz volume de procura que um stand local não gera sozinho; o site traz marca, perfil e canal directo sem comissão. O argumento é que o custo anual do site (domínio, poucas dezenas de euros) é uma fracção de um único mês de portal — mas a recomendação honesta é manter os dois. *(Os valores de tabela do Standvirtual citados nos achados vêm de fonte terceira e não foram confirmados; não os usar em proposta escrita.)*

---

## 7. Contradições entre achados, e o que se escolheu

| Contradição | Escolha | Porquê |
|---|---|---|
| Publicar matrícula (DL 74/93 al. a) + RGPD 6/1/c) **vs** «nunca publicar em página indexada» | **Publica-se na ficha; nunca no URL, nome de ficheiro ou sitemap** | A lei lista a matrícula em primeiro lugar e ela é visível no carro e nas fotos. O que se recusa é a persistência indexada no endereço. Ver 2.5 |
| Filtros em query string, partilháveis e com `<form method=get>` sem JS (astro-hyperdrive) **vs** filtros em fragmento para não gerar URLs rastreáveis (SEO) | **Fragmento** | Continuam partilháveis; e num site estático o `<form method=get>` não faria nada, porque o GitHub Pages ignora a query string. A alternativa sem JS é a lista completa mais as páginas de marca |
| «Garantia de Stand» como campo livre (Standvirtual) **vs** garantia legal de 3 anos redutível só por acordo (DL 84/2021) | **`select` de dois valores fixos** | O DL 74/93 obriga a declarar a garantia de usado, mas o art. 43.º do DL 84/2021 transforma o que o site disser em condição vinculativa. Um número livre é uma armadilha |
| Preço «sob consulta» tolerado pelo achado de dados estruturados **vs** proibido pelo DL 138/90 | **Preço obrigatório sempre** | A obrigação legal estrita de preço afixado é no stand, no documento do DL 74/93; mas um anúncio de venda sem preço é incoerente com esse documento, mata a comparação e a regra dos `offers`. Regra de projecto: o gerador recusa publicar sem preço. A regra defensiva de omitir `offers` fica no gerador para o caso de alguém a contornar |
| «Aviso de cookies simples» pedido pelo cliente **vs** «não fazer banner» | **Sem banner de entrada** | Não há nada a consentir. Substituído por página de cookies + consentimento no mapa + «Definições do mapa» no rodapé. Explicado ao cliente; se insistir, banner com Aceitar/Rejeitar de igual peso |
| Ordem canónica do Standvirtual (preço antes da galeria) **vs** galeria acima do preço em desktop (Só Barroso, F2Car, Autohero) | **Galeria à esquerda, preço e CTA em coluna direita fixa em desktop; ordem do Standvirtual em telemóvel** | É o desvio que os três sites melhor apresentados fazem, e não quebra a expectativa em mobile, que é onde está a maioria do tráfego |
| «Nunca publicar menos de 12 fotos» **vs** só existirem fotos de pormenor a 414 px | **Modo de demonstração com `noindex` e barra visível** | Resolve a incompatibilidade sem publicar anúncios falsos. Ver 3.4 |
| «Gerador Node sem dependências» **vs** scripts Python já existentes | **Ambos, separados** | Python é ferramenta de preparação de assets, corre à mão. O build só corre o gerador Node |

---

## 8. O que ficou por saber

### Bloqueia a publicação

1. **Forma jurídica** (ENI vs Lda/Unipessoal Lda). Sem isto não se sabe sequer se o capital social é obrigatório. Uma certidão permanente resolve firma, NIPC, conservatória, matrícula e capital social de uma vez.
2. **Firma / denominação social completa.** `"NewAuto — Comércio Automóvel"` no `definicoes.json` não é uma firma.
3. **NIF/NIPC.** Está `PLACEHOLDER-NIF`.
4. **E-mail oficial.** Está vazio. É obrigatório em texto legível (DL 7/2004 art. 10.º n.º 1 al. b)).
5. **Confirmação de que 917 849 998 é o número de contacto do consumidor**, e qual o papel dos dois números de WhatsApp (913 319 419 e 936 703 417) — se são apresentados como linhas de contacto, levam também a menção de custo de chamada.
6. **Política de garantia praticada:** 3 anos, ou proposta de redução para 18 meses por acordo escrito.

### Condiciona decisões técnicas

7. **Domínio próprio / CNAME.** Determina o BASE e, com ele, o `output` do `media` no Pages CMS. Decidir antes de configurar o backoffice.
8. **Número de trabalhadores.** Determina o escalão de coima (RJCE art. 19.º) e confirma a qualificação como microempresa.
9. **Se a NewAuto intermedeia crédito.** Se apresenta propostas de financeiras, pode ter de estar registada como intermediário de crédito junto do Banco de Portugal (DL 81-C/2017). **Não verificado em nenhuma ronda.** Enquanto não estiver confirmado, o site não menciona intermediação nem qualquer número de financiamento.
10. **Se alguma viatura será «km 0» genuína** (nunca matriculada). Nesse caso entra no DL 304/2001 e passa a exigir rótulo e cartaz no stand e menção de consumo/CO₂ na publicidade.
11. **Registo do estabelecimento na plataforma do Livro de Reclamações electrónico** — confirmar que já existe.

### Fontes com limitação declarada

12. **Directiva (UE) 2024/825** (alegações ambientais): o diploma português de transposição **não foi localizado**. Aplicável desde 27-09-2026. Reconfirmar em Outubro de 2026. Até lá escreve-se como se já estivesse em vigor, que é a posição segura.
13. **DL 70/2007** (preço riscado): o articulado não foi lido integralmente; a base é a FAQ da ASAE. Irrelevante enquanto não houver preço riscado, que se decidiu não implementar.
14. **DL 24/2014** (contratos à distância): o articulado não foi relido; a conclusão de inaplicabilidade assenta no âmbito conhecido. Se algum dia se acrescentar reserva paga, reavaliar a sério.
15. **Limite de upload do Pages CMS:** os ~3,3 MB são empíricos; o valor de 4,5 MB do limite de corpo de pedido do alojamento não foi reconfirmado.
16. **Sveltia CMS** como alternativa (optimiza imagens no browser antes do commit): não testado, e o seu limite de upload não está documentado. Teste empírico obrigatório antes de trocar.
17. **Designação exacta da categoria primária do Google Business Profile em português europeu:** não confirmada em fonte oficial. Confirmar na interface no momento da configuração.
18. **Preços de tabela do Standvirtual:** fonte terceira, não confirmados. Não usar em proposta escrita.
19. **`foundingDate: 2018`:** vem do texto de marketing já no `definicoes.json`, não de fonte documental. Confirmar com o cliente antes de o marcar em JSON-LD.
20. **Latitude/longitude (40.9739, −8.5628):** confirmar que apontam à porta do stand e não ao centróide da freguesia — a Google recomenda 5 casas decimais e um ponto errado prejudica o perfil.
21. **Estado do EU-U.S. Data Privacy Framework:** válido, mas sob recurso no TJUE (Latombe, recurso de Outubro de 2025, sem data de audiência conhecida) e com a carta do CEPD de 31-07-2026 sobre *Trump v. Slaughter*. A política de privacidade é redigida com **os dois fundamentos em cascata** (adequação + cláusulas contratuais-tipo, «em complemento»), para que uma eventual anulação obrigue a mudar uma frase e não a secção. Entrada fixa no plano de manutenção anual: verificar se a Decisão (UE) 2023/1795 continua em vigor e se o GitHub, Inc. mantém certificação activa.
22. **Directrizes da CNPD sobre cookies:** anunciadas no Plano de Actividades de 2021, **nunca publicadas**. A única peça nacional citável é a Nota Informativa de 25-06-2021, que deve ficar no dossiê do cliente. Não copiar padrões franceses ou espanhóis — em particular, não instalar analítica sem consentimento invocando a excepção de medição de audiência da CNIL, que a CNPD não subscreveu.