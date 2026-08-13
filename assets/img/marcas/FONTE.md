# Logótipos das marcas

## De onde vieram

Quase todos são do **[Simple Icons](https://github.com/simple-icons/simple-icons)**,
descarregados de `raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/<marca>.svg`
em 13-08-2026.

A excepção é o **`mercedesbenz.svg`**, que o Simple Icons não tem. Veio do Wikimedia Commons,
de [`Mercedes-Benz Star (1969-1986, 2025-).svg`](https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Star_(1969-1986,_2025-).svg):
1571 bytes, **domínio público** (figura geométrica simples, abaixo do limiar de originalidade),
um só `<path>` e nenhum gradiente — a mesma estrutura dos outros. É a estrela oficial, não um
redesenho. Há no Commons uma versão com 305 KB, 489 caminhos e 52 gradientes; essa não serve,
porque achatá-la seria redesenhar.

Todos são glifos de um só caminho e sem cor própria. É por isso que se conseguem pintar com
`currentColor` através de `mask-image` e ficam monocromáticos sem ninguém os redesenhar.

**Nenhum foi redesenhado nem alterado.** Estão byte a byte como vieram.

## O que a licença cobre e o que não cobre

O projecto Simple Icons é CC0, mas **isso aplica-se ao código do projecto, não à arte das
marcas** — o próprio DISCLAIMER do projecto o diz, e nenhum destes ficheiros traz campo
`license`. Cada símbolo continua a ser marca registada do seu titular.

O que nos permite usá-los é outra coisa, e não a licença: o **uso referencial**. Um
revendedor independente pode usar a marca alheia para dizer que vende produtos dessa marca
— artigo 254.º alínea c) do CPI (DL 110/2018) e artigo 14.º n.º 1 alínea c) do Regulamento
(UE) 2017/1001, condicionados a «práticas honestas» pelo n.º 2. O TJUE confirmou-o em
BMW/Deenik (C-63/97), onde diz que o revendedor «não consegue na prática comunicar essa
informação sem usar a marca», e em Portakabin (C-558/08 § 91), que legitima mostrar várias
marcas ao mesmo tempo.

O limite é não dar a impressão de ligação comercial ou de pertença à rede oficial. É por
isso que a secção da página inicial:

- mostra os símbolos **monocromáticos**, e não nas cores oficiais de cada fabricante;
- põe o **nome** de cada marca ao lado do símbolo, porque a palavra é o uso mais seguro
  (em *BMW v. Technosport* [2017] EWCA Civ 779 o tribunal separou os dois e decidiu contra
  o símbolo, não contra a palavra);
- liga cada marca ao **filtro do stock**, o que a torna um índice do que está para venda e
  não um selo de parceria;
- traz, **dentro da secção e não numa página distante**, a frase que diz que a NewAuto é um
  stand independente. Gillette (C-228/03 § 46) manda olhar à apresentação global, e um
  esclarecimento a três ecrãs de distância não corrige a impressão criada onde a marca está.

Se algum fabricante contestar, a resposta é retirar o símbolo dessa marca — apagar o
ficheiro basta, o site passa a mostrar só o nome e nada se parte.

## Marcas sem ficheiro

Faltam **sete** das trinta e três marcas que o backoffice permite:

| Marca | Porque não há |
|---|---|
| Alfa Romeo | não tem vector livre em sítio nenhum; o emblema está protegido por **direito de autor**, não só como marca, e na Wikipédia vive como ficheiro não-livre justificado por *fair use* — doutrina dos EUA que a UE não tem |
| Cupra, Jaguar, Land Rover, Lexus | não existem no Simple Icons |
| Outra | é a opção de recurso do backoffice, não é uma marca |

**Isto não é um problema a resolver: é o caso normal.** Uma marca sem ficheiro aparece com
o nome em texto, no mesmo sítio e com o mesmo peso visual. O gerador verifica se o ficheiro
existe e decide sozinho — não há lista a manter em dois sítios.

## Acrescentar uma marca

1. ver se o Simple Icons tem: `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/<slug>.svg`
2. se não tiver, procurar no Wikimedia Commons uma versão **de um só caminho e sem gradientes**,
   marcada como domínio público — foi assim que se resolveu a Mercedes-Benz. Um ficheiro com
   dezenas de gradientes não serve: a máscara usa o canal alfa, e achatá-lo é redesenhar
3. guardar aqui como `<slug>.svg`, sem alterar nada
4. o slug é o nome em minúsculas, sem acentos, sem espaços e sem pontuação —
   `Mercedes-Benz` → `mercedesbenz`, `Land Rover` → `landrover`, `Citroën` → `citroen`

Se não houver nenhuma versão simples, não fazer nada. O nome aparece em texto e está correcto assim.
**Não redesenhar um emblema à mão** — é a regra da casa para logótipos de clientes e vale
com mais razão para marcas registadas de terceiros.
