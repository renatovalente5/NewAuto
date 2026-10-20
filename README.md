# NewAuto

Sítio do **NewAuto — Comércio Automóvel**, stand de automóveis usados em Paços de
Brandão, Santa Maria da Feira.

Site estático, sem dependências, gerado por um script de Node e publicado no
GitHub Pages, com backoffice em Pages CMS. Sem framework, sem `node_modules`,
sem pedidos a terceiros — a página que o visitante recebe é a que está no disco.
A Action só instala o Pillow, para as fotografias que o cliente carrega.

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
conteudo/*.md            os textos legais e a garantia
assets/viaturas/<slug>/  fotografias das viaturas de exemplo (WebP 207/414/828 + JPEG)
assets/viaturas/_v/      versões leves das fotografias do backoffice (feitas na Action; fora do git)
assets/img/vendidos/     os quadros «VENDIDO» do stand, sem pessoas
assets/fonts/saira.woff2 a letra da marca (OFL), só latim, larguras 100–125
_fonte/originais/        as 205 fotografias como vieram, e o logótipo
_fonte/classificacao.json  o que cada fotografia mostra, classificada uma a uma
scripts/gerar.mjs        o gerador
scripts/auditar.mjs      o travão que corre antes de publicar
scripts/local.mjs        constrói + audita + serve, para revisão local
scripts/imagens.py       fotografias → WebP/JPEG; `--galeria` para as do backoffice
scripts/criar-viaturas.py  as viaturas de demonstração, agrupadas por post
scripts/logotipo.py      logótipo extraído do JPEG do cliente
scripts/padrao.py        textura de setas extraída do banner
scripts/icones.py        favicons e imagem de partilha
.pages.yml               o backoffice
_plano/                  decisões, plano, e o que falta ao cliente
```

## Decisões que não são óbvias

**Duas zonas: a marca em carvão, os carros em claro.** O cabeçalho, a capa, o
topo das páginas e o rodapé são carvão, com o padrão de setas e a faixa vermelha
das histórias do Instagram da marca. A montra, as fichas e os textos são claros:
as fotografias são de dia, ao sol, num pinhal, e lêem-se como o que são; e texto
escuro sobre claro lê-se melhor num telemóvel ao sol, que é onde se escolhe
carro. (A primeira versão era toda escura.)

**O vermelho é para agir.** Botões, o que se carrega, e a marca. Não pinta
preços nem títulos.

**A cor foi medida, não escolhida.** Vermelho `#EA3223`, a dobra do «M»
`#C1392F`, carvão `#292929`/`#333333` — do logótipo e do banner. Para texto
branco por cima usa-se `#D52B1E` (5,01:1); para vermelho escrito sobre claro,
`#C42A1D` (5,68:1); sobre carvão, `#FF6B5C` (5,20:1). Branco sobre o vermelho da
marca dá só 4,22:1.

**A letra é Saira** nos títulos, preços e botões — quadrada de cantos redondos e
larga, como a que a marca usa nas histórias do Instagram, com o «a» de uma só
bossa (`ss01`). O texto corrido é a letra do sistema. Um ficheiro só, 57 KB.

**O canto cortado** da fotografia de cada cartão é o chanfro dos traços do «N»
do logótipo. Vai na fotografia e não no cartão, porque um `clip-path` no
elemento focado cortava-lhe o contorno do foco.

**A faixa vermelha não é o logótipo redesenhado.** É um paralelogramo ao ângulo
dos traços dele, com o padrão tom-sobre-tom, como o designer da marca faz nas
histórias. O logótipo usa-se sempre como veio.

**As viaturas de exemplo são carros verdadeiros do stand.** O nome de cada
fotografia das redes traz o número do post; agrupadas por post, dão cada carro
com o seu exterior e o seu interior. A primeira versão escolhia por marca e
saíram fichas com fotografias de outro modelo e um conta-quilómetros que
contradizia o anúncio. Ver `scripts/criar-viaturas.py`.

**As fotografias de exemplo têm 414 px** e não há maiores. Os cartões nunca as
pedem acima disso; a galeria usa uma ampliação a 828 px (Lanczos e nitidez leve)
e a fotografia ampliada não passa dessa largura. As do backoffice chegam do
telemóvel e saem em 480/960/1600 px.

**Duas origens de fotografia.** `fotos_origem` (exemplo, pipeline de Python) e
`galeria` (o que o cliente carrega). As medidas lêem-se sempre do ficheiro: sem
`width`/`height` a auditoria trava a publicação — e antes, a primeira viatura
criada pelo cliente teria travado o site inteiro.

**Filtros que contam.** Cada opção mostra quantas viaturas daria com os outros
filtros como estão, e apaga-se quando daria zero. Um grupo com uma só opção não
aparece. O estado vai para o endereço (`viaturas/?marca=BMW`). No telemóvel, o
mesmo formulário muda-se para uma folha que sobe de baixo.

**Retoma e procura pelo WhatsApp, sem formulário que envie.** O formulário só
compõe a mensagem e abre o WhatsApp de quem está a ver. Não há servidor que
possa avariar em silêncio nem dados guardados.

**Sete campos são obrigatórios por lei.** O DL 74/93 exige matrícula, preço, ano
de construção, data da matrícula, registos anteriores e as duas garantias. O
gerador falha a compilação se algum faltar, e a auditoria confirma que o ano de
construção e a data da matrícula aparecem na ficha.

**A garantia é de 3 anos, nunca 12 meses.** A auditoria recusa publicar se
«garantia de 12 meses» aparecer, e também se aparecer financiamento,
mensalidades ou TAEG — enquanto não se confirmar o registo como intermediário
de crédito.

**Sem `VehicleListing`, e `Car` sem `offers` nas vendidas.** O preço só se marca
se estiver visível; numa vendida não está.

**Viaturas vendidas não se apagam.** Ficam com a ficha, marcadas, e aparecem em
`/vendidos/`.

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

O backoffice grava os caminhos das fotografias sem o prefixo (`assets/viaturas/…`),
e o gerador junta-lho; por isso escrever o `CNAME` não obriga a mudar mais nada.

## O que falta

Ver [`_plano/PENDENTE-CLIENTE.md`](_plano/PENDENTE-CLIENTE.md). Quatro pontos
bloqueiam a publicação num domínio próprio, todos por serem obrigações legais.
