# NewAuto

Sítio do **NewAuto — Comércio Automóvel**, stand de automóveis usados em Paços de
Brandão, Santa Maria da Feira.

Site estático, sem dependências, gerado por um script de Node e publicado no
GitHub Pages, com backoffice em Pages CMS. Sem framework, sem `node_modules`,
sem pedidos a terceiros — a página que o visitante recebe é a que está no disco.

## Correr localmente

```bash
node scripts/local.mjs
```

Constrói, audita e serve em <http://localhost:4400>. É o único comando de que se
precisa para ver o site.

**Não construir com `node scripts/gerar.mjs` para ver em localhost.** Sem `BASE=`
o gerador constrói para produção, onde tudo mora em `/NewAuto/...`: servido em
localhost, o endereço responde 200 mas o CSS, o JS e todas as ligações dão 404, e
a página abre a branco — parece que o servidor morreu, quando o que está errado é
o build. Foi por isto que este script existe.

Para conferir o build de produção sem estragar o local, há a variável `SAIDA`:

```bash
SAIDA=/tmp/prod node scripts/gerar.mjs     # produção numa pasta à parte
SAIDA=/tmp/prod node scripts/auditar.mjs   # auditada com o prefixo de produção
```

## Como está organizado

```
data/definicoes.json     dados do stand, contactos, horário, textos
data/viaturas/*.json     uma viatura por ficheiro
conteudo/*.md            os quatro textos legais
assets/viaturas/<slug>/  fotografias tratadas (AVIF, WebP, JPEG × 2 larguras)
_fonte/originais/        as 205 fotografias como vieram, e o logótipo
_fonte/classificacao.json  o que cada fotografia mostra, classificada uma a uma
scripts/gerar.mjs        o gerador
scripts/auditar.mjs      o travão que corre antes de publicar
scripts/local.mjs        constrói + audita + serve, para revisão local
scripts/imagens.py       fotografias → os três formatos
scripts/logotipo.py      logótipo extraído do JPEG do cliente
scripts/padrao.py        textura de setas extraída do banner
scripts/icones.py        favicons e imagem de partilha
scripts/criar-viaturas.py  as viaturas de demonstração
.pages.yml               o backoffice
_plano/                  decisões, plano, e o que falta ao cliente
```

## Decisões que não são óbvias

**A cor foi medida, não escolhida.** Vermelho `#EA3223` (saturação 0,85, matiz
4,5°), vermelho secundário `#C1392F`, carvão `#292929`/`#333333` — todos medidos
no logótipo e no banner do cliente.

**Há três vermelhos, e não é indecisão.** O da marca fica onde é superfície e
forma. Para texto branco por cima usa-se `#DE2C1E`, porque branco sobre
`#EA3223` dá 4,22:1 e o mínimo é 4,5. Para vermelho escrito sobre carvão usa-se
`#FF5A4A`, porque o da marca dava 3,73:1 nos cartões.

**O site é escuro porque a marca é.** O banner que o stand já usa é o símbolo
repetido sobre carvão. E as fotografias, que são pequenas e de luz quente,
ganham sobre escuro.

**A textura de setas é do cliente.** Extraída do banner dele; período 165×104 px
medido por autocorrelação. É o que dá coerência a um site que não pode contar
com fotografia grande.

**As fotografias têm 414 px.** Foram recolhidas das redes sociais e não há
maiores. Por isso a capa é tipográfica e não fotográfica, e por isso só há duas
larguras no `<picture>`.

**Duas origens de fotografia.** As viaturas de exemplo usam `fotos_origem`
(ficheiros em `_fonte/`, convertidos pelo pipeline de Python). As que o cliente
criar no backoffice usam `galeria` e servem-se como estão — perde-se o AVIF, mas
um backoffice que não consegue publicar uma fotografia não é um backoffice.

**Sete campos são obrigatórios por lei.** O artigo 2.º n.º 1 do DL 74/93 exige
matrícula, preço, ano de construção, data da matrícula, registos anteriores e as
duas garantias em qualquer anúncio de veículo usado. **O gerador falha a
compilação** se algum estiver vazio.

**A garantia é de 3 anos, nunca 12 meses.** O DL 67/2003 foi revogado a
01-01-2022. A auditoria recusa publicar se «garantia de 12 meses» aparecer em
qualquer página, porque o artigo 43.º do DL 84/2021 transforma o que o site diz
em condição vinculativa.

**Nada de plataforma ODR.** Foi revogada a 20-07-2025 pelo Regulamento (UE)
2024/3228. A auditoria também recusa isso.

**Sem `VehicleListing`.** O tipo foi eliminado da Pesquisa Google a 09-09-2025.
Usa-se `AutoDealer` no negócio e `Car` com `offers` em cada ficha — que hoje não
produz resultado enriquecido nenhum, mas desambigua a entidade. A auditoria
verifica que o preço marcado aparece **visível** na página, porque marcar preços
invisíveis é proibido.

**Viaturas vendidas não se apagam.** Ficam com a ficha, marcadas, e aparecem em
`/vendidos/`. Apagar páginas que o Google já indexou é deitar fora o trabalho de
as pôr lá.

## Onde o site vive

O prefixo dos caminhos e o endereço canónico saem os dois de um único facto:
existe, ou não, um ficheiro `CNAME` na raiz.

| | prefixo | canónicos | indexação |
|---|---|---|---|
| **com** `CNAME` | vazio | `https://<domínio>` | permitida |
| **sem** `CNAME` | `/NewAuto` | `https://renatovalente5.github.io` | `noindex` |

É de propósito que não há uma segunda linha para actualizar. Num projecto
anterior o prefixo e o endereço real discordaram e o site esteve dias sem folha
de estilo — `scripts/auditar.mjs` confirma que os dois concordam e a Action
recusa-se a publicar se não concordarem.

**Ao escrever o `CNAME`, mudar também `media.output` no `.pages.yml`.** É a única
coisa que não deriva sozinha.

## O que falta

Ver [`_plano/PENDENTE-CLIENTE.md`](_plano/PENDENTE-CLIENTE.md). Quatro pontos
bloqueiam a publicação num domínio próprio, todos por serem obrigações legais.
