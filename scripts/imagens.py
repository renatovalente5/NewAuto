#!/usr/bin/env python3
"""Prepara as fotografias das viaturas.

DOIS TRABALHOS, um para cada origem de fotografia (ver `foto()` no gerador):

1. As viaturas de demonstração (`fotos_origem`). Vêm das redes sociais e têm
   todas 414x414 px — não há originais maiores. Saem em três larguras:
     207  miniaturas da galeria e cartões no telemóvel
     414  a medida real; cartões e o JPEG de reserva
     828  galeria e fotografia ampliada. É uma AMPLIAÇÃO, feita aqui com Lanczos
          e uma máscara de nitidez leve, porque se lê melhor do que deixar o
          browser esticar 414 px por interpolação lisa. Não inventa pormenor.

2. As fotografias que o dono do stand carrega no backoffice (`galeria`, com
   `--galeria`). Chegam do telemóvel com 3 a 4 MB e 4000 px. Servidas assim,
   a montra pedia dezenas de megabytes no telemóvel. Saem em 480, 960 e 1600 px
   para `assets/viaturas/_v/`, que não vai para o git: a Action corre este
   passo antes do gerador, a cada publicação. Se o Pillow faltar, o gerador
   serve o original e o site continua a funcionar.

WebP e um JPEG de reserva. O JPEG é também o único que o WhatsApp mostra nas
pré-visualizações de ligação, e é dele que sai o cartão de partilha.

Correr:  python3 scripts/imagens.py              (só o que falta)
         python3 scripts/imagens.py --tudo       (refaz tudo)
         python3 scripts/imagens.py --galeria    (as do backoffice)
"""
import json
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps
except ImportError:
    sys.exit('Falta o Pillow:  pip3 install Pillow')

RAIZ = Path(__file__).resolve().parent.parent
ORIGINAIS = RAIZ / '_fonte' / 'originais'
DESTINO = RAIZ / 'assets' / 'viaturas'
VARIANTES = DESTINO / '_v'
VIATURAS = RAIZ / 'data' / 'viaturas'

DEMO = [207, 414, 828]

# Os quadros «VENDIDO» que o stand publica por cada carro entregue. Só os que
# não mostram pessoas: a autorização que os clientes deram para o Instagram não
# cobre o site. Vão para a secção «Obrigado pela confiança».
QUADROS = [
    '658837622_122278557236191273_164394859686432014_n.jpg',    # C4 Cactus
    '658167649_122278558064191273_3669867316706584870_n.jpg',   # 5008
    '671530364_122280885200191273_3226345913111047463_n.jpg',   # 2008
    '649224953_17889139332442544_5757872782020322065_n.jpg',    # Polo
    '642669043_17889139341442544_713056345102363311_n.jpg',     # Série 1
    '649221401_17889139350442544_7478158299969930770_n.jpg',    # 308
    '642619887_17889139359442544_5987042674870729571_n.jpg',    # Clio
    '642551622_17889139371442544_7220957073791660954_n.jpg',    # Mégane
    '649227632_17889567342442544_1547911334986659277_n.jpg',    # A4 Avant
]
GALERIA = [480, 960, 1600]
OG = (1200, 630)
TUDO = '--tudo' in sys.argv


def carregar(caminho: Path) -> Image.Image:
    im = Image.open(caminho)
    return ImageOps.exif_transpose(im).convert('RGB')


def largura(im: Image.Image, w: int) -> Image.Image:
    h = round(im.height * w / im.width)
    out = im.resize((w, h), Image.LANCZOS)
    if w > im.width:
        out = out.filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
    return out


def guardar(im: Image.Image, saida: Path, fmt: str):
    if saida.exists() and not TUDO:
        return 0
    if fmt == 'WEBP':
        im.save(saida, 'WEBP', quality=80, method=6)
    else:
        im.save(saida, 'JPEG', quality=84, optimize=True, progressive=True)
    return 1


def cartao_partilha(im: Image.Image, saida: Path):
    """1200x630 para o WhatsApp e o Facebook. A partir de 414 px é uma
    ampliação — numa pré-visualização de ligação, num telemóvel, não se nota,
    e é preferível a não haver imagem nenhuma."""
    if saida.exists() and not TUDO:
        return
    c = ImageOps.fit(im, OG, Image.LANCZOS, centering=(0.5, 0.55))
    c = c.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    c.save(saida, 'JPEG', quality=82, optimize=True, progressive=True)


def demonstracao():
    fichas = [json.loads(f.read_text(encoding='utf-8')) for f in sorted(VIATURAS.glob('*.json'))]
    vivas = {v['slug'] for v in fichas if v.get('fotos_origem')}

    # Pastas de viaturas que já não existem: ficavam a ser publicadas para nada.
    for p in DESTINO.iterdir():
        if p.is_dir() and p.name != '_v' and p.name not in vivas:
            shutil.rmtree(p)
            print(f'  removida {p.name}/')

    total = 0
    for v in fichas:
        if not v.get('fotos_origem'):
            continue
        pasta = DESTINO / v['slug']
        pasta.mkdir(parents=True, exist_ok=True)
        esperados = {'og.jpg'}
        for i, origem in enumerate(v['fotos_origem'], 1):
            f = ORIGINAIS / origem
            if not f.exists():
                print(f'  !! {v["slug"]}: falta {origem}')
                continue
            im = carregar(f)
            base = f'{i:02d}'
            for w in DEMO:
                total += guardar(largura(im, w), pasta / f'{base}-{w}.webp', 'WEBP')
                esperados.add(f'{base}-{w}.webp')
            total += guardar(largura(im, 414), pasta / f'{base}-414.jpg', 'JPEG')
            esperados.add(f'{base}-414.jpg')
            if i == 1:
                cartao_partilha(im, pasta / 'og.jpg')
        # Restos de uma versão anterior (AVIF, outras larguras, outra ordem).
        for resto in pasta.iterdir():
            if resto.name not in esperados:
                resto.unlink()
        print(f'  {v["slug"]}: {len(v["fotos_origem"])} fotografias')
    pasta = RAIZ / 'assets' / 'img' / 'vendidos'
    pasta.mkdir(parents=True, exist_ok=True)
    for i, origem in enumerate(QUADROS, 1):
        im = carregar(ORIGINAIS / origem)
        total += guardar(largura(im, 207), pasta / f'{i:02d}-207.webp', 'WEBP')
        total += guardar(im, pasta / f'{i:02d}-414.webp', 'WEBP')
        total += guardar(im, pasta / f'{i:02d}-414.jpg', 'JPEG')
    print(f'\n{total} ficheiros novos')


def galeria():
    VARIANTES.mkdir(parents=True, exist_ok=True)
    total = 0
    for jf in sorted(VIATURAS.glob('*.json')):
        v = json.loads(jf.read_text(encoding='utf-8'))
        for caminho in v.get('galeria') or []:
            rel = str(caminho).lstrip('/')
            if rel.startswith('NewAuto/'):
                rel = rel[len('NewAuto/'):]
            f = RAIZ / rel
            if not f.exists():
                print(f'  !! {v["slug"]}: falta {rel}')
                continue
            im = carregar(f)
            for w in GALERIA:
                if w > im.width and w != GALERIA[0]:
                    continue   # não se amplia o que veio do telemóvel
                total += guardar(largura(im, min(w, im.width)), VARIANTES / f'{f.stem}-{w}.webp', 'WEBP')
            total += guardar(largura(im, min(960, im.width)), VARIANTES / f'{f.stem}-960.jpg', 'JPEG')
            cartao_partilha(im, VARIANTES / f'{f.stem}-og.jpg')
    print(f'galeria: {total} ficheiros novos em {VARIANTES.relative_to(RAIZ)}/')


if __name__ == '__main__':
    galeria() if '--galeria' in sys.argv else demonstracao()
