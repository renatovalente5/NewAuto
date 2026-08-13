# O que falta ao cliente dar ou decidir

Ordenado por urgência. Os quatro primeiros **impedem a publicação** num domínio
próprio: são obrigações legais, não preferências.

---

## Bloqueia a publicação

### 1. A forma jurídica — e com ela o capital social

O senhor pediu que o capital social **não** aparecesse no rodapé, «a não ser que
seja obrigatório por lei». A resposta honesta é: **depende da forma jurídica, e
não sabemos qual é.**

- Se a NewAuto for **sociedade por quotas (Lda ou Unipessoal Lda) ou anónima**,
  o **artigo 171.º do Código das Sociedades Comerciais** obriga a indicar o
  capital social nos sítios da Internet. O n.º 1 enumera expressamente «sítios
  na Internet» entre os actos externos. Não é opcional. A coima vai de €250 a
  €1.500 (art. 528.º n.º 2).
- Se for **empresário em nome individual**, o CSC não se aplica — não há
  sociedade nem capital social. Nesse caso, inventar um NIPC, uma conservatória
  ou um capital social seria **falso**, e o rodapé leva o nome civil completo
  mais «que usa a designação comercial NewAuto».

O rodapé está construído para os dois casos: os campos existem e só aparecem se
estiverem preenchidos. Uma **certidão permanente** resolve tudo de uma vez —
firma, NIPC, conservatória, matrícula e capital social.

### 2. NIF / NIPC

Está `PLACEHOLDER-NIF` no ficheiro de definições e aparece assim no rodapé, de
propósito, à vista. É obrigatório pelo **artigo 10.º do DL 7/2004**.

### 3. Firma / denominação social completa

Está «NewAuto — Comércio Automóvel», que **não é uma firma**. É o nome comercial.
A denominação legal completa é obrigatória no rodapé (mesmo artigo).

### 4. Endereço de correio electrónico

Está vazio. O artigo 10.º n.º 1 alínea b) do DL 7/2004 exige-o **em texto
legível** — um botão de contacto não cumpre.

---

## Confirmar antes de publicar

### 5. Os números de telefone

Recebi três: **917 849 998** para chamadas e **913 319 419** / **936 703 417**
para WhatsApp. Estão todos no site, cada um com «(Chamada para a rede móvel
nacional)» ao lado, como a lei exige.

**Nota:** ao pesquisar a empresa apareceu-me também o número **912 174 195** e o
email **newauto1995@hotmail.com** associados à NewAuto de Paços de Brandão. Não
os usei — o que o cliente dá manda sobre o que eu encontro —, mas convém saber
se são antigos ou se ainda circulam, porque dados desencontrados prejudicam a
posição no Google.

### 6. A política de garantia praticada

O site diz **garantia legal de conformidade de 3 anos** (DL 84/2021), que é a
regra. A lei permite reduzir a 18 meses nas viaturas usadas, **por acordo escrito
antes da compra**. Se é isso que fazem, é preciso dizer-me — e o acordo tem de
existir em papel, não pode ser só uma prática.

**Aviso importante:** o site nunca pode dizer «garantia de 12 meses». Isso foi
revogado a 01-01-2022 e o artigo 43.º do DL 84/2021 transforma o que o site diz
em condição contratual vinculativa. A auditoria automática recusa publicar se
essa expressão aparecer em qualquer página.

### 7. As coordenadas do mapa

Pus **40,9739 / −8,5628**, derivadas da morada. Confirme que o marcador cai à
porta do stand e não no centro da freguesia — o mapa e o perfil do Google usam
isto.

---

## Os dados das viaturas são de demonstração

As **12 viaturas** que estão no site são exemplos, como combinámos. Não são
inventadas do nada: **a marca, o modelo e a cor de cada uma saem dos carros que
estão mesmo nas 205 fotografias** que me deu, classificadas uma a uma.

O que é inventado e tem de ser corrigido no backoffice:

| Campo | Estado |
|---|---|
| Matrícula | inventada, formato válido |
| Preço | plausível para o mercado, não real |
| Quilómetros | inventados |
| Mês e ano da matrícula | inventados |
| Registos anteriores | inventados |
| Descrição | escrita por mim |

Cada viatura tem um campo **«Dados de demonstração»** marcado. Desmarque-o
depois de conferir a viatura — serve para saber o que já foi revisto.

**O site está com `noindex` enquanto não houver domínio próprio**, precisamente
para que estes dados não sejam apanhados pelo Google. Isso desaparece
automaticamente quando o CNAME for escrito.

---

## As fotografias

As 205 que me deu têm **414×414 px** — foram recolhidas das redes sociais e não
há maiores. Isto condicionou o desenho do site inteiro:

- servem para cartões e galerias até cerca de 400 px de lado;
- **não** dão para uma capa de largura total, onde apareceriam moles;
- a capa é construída com tipografia e com a textura de setas da marca.

Além disso, **86 das 205 são de interior e só 48 mostram carros inteiros** — não
há como agrupar por viatura, porque os ficheiros não trazem essa informação.

**Se me enviar as fotografias originais** (do telemóvel ou da máquina, sem passar
pelas redes sociais), o site melhora muito: dá para capas de largura total e
para galerias com pormenor a sério. É a única coisa que me falta que mudaria o
aspecto do site de forma visível.

---

## Domínio

O site está preparado para os dois cenários e **decide sozinho**: se existir um
ficheiro `CNAME` na raiz do repositório, constrói para a raiz desse domínio; se
não existir, constrói para o endereço de projecto do GitHub Pages e fica com
`noindex`.

Ao escrever o `CNAME`, há **uma coisa a mudar à mão**: no `.pages.yml`, o campo
`media.output` passa de `/NewAuto/assets/viaturas` para `/assets/viaturas`.
Está comentado no ficheiro. Sem isso, as fotografias que carregar no backoffice
ficam com o caminho errado.

---

## Fica por confirmar (não bloqueia)

- **Intermediação de crédito.** Se a NewAuto apresenta propostas de
  financiamento de instituições de crédito, pode ter de estar registada como
  intermediária de crédito junto do Banco de Portugal (DL 81-C/2017). Enquanto
  não estiver confirmado, **o site não menciona financiamento** em lado nenhum.
- **Registo do estabelecimento** na plataforma do Livro de Reclamações
  electrónico — confirmar que já existe.
- **Número de trabalhadores**, que determina o escalão de coima em caso de
  contra-ordenação.
