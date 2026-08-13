#!/usr/bin/env python3
"""Prepara as fotografias das viaturas.

**A limitação que manda em tudo:** as 205 fotografias que o cliente tem foram
recolhidas das redes sociais e têm todas 414x414 px. Não há originais maiores.
Isto não é um pormenor — decide o desenho do site inteiro:

  - servem para cartões e mosaicos até cerca de 400 px de lado;
  - **não servem** para uma capa de largura total nem para uma ficha em ecrã
    grande, onde apareceriam esticadas e moles;
  - a capa do site é construída com tipografia e com a textura da marca, e não
    com uma fotografia — o que, sendo uma limitação, calha bem a uma marca cujo
    grafismo é assumidamente gráfico e não fotográfico.

Quando o cliente enviar fotografias em condições, muda-se `LARGURAS` e volta a
correr-se; o resto do site não precisa de saber.

Três formatos por tamanho, do mais eficiente para o mais compatível: AVIF, WebP
e JPEG. O JPEG é a rede de segurança e o único que o WhatsApp mostra nas
pré-visualizações de ligação.

Correr:  python3 scripts/imagens.py            (só o que falta)
         python3 scripts/imagens.py --tudo     (refaz tudo)
"""
import json
import re
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps, features
except ImportError:
    sys.exit('Falta o Pillow:  pip3 install Pillow')

RAIZ = Path(__file__).resolve().parent.parent
ORIGINAIS = RAIZ / '_fonte' / 'originais'
DESTINO = RAIZ / 'assets' / 'viaturas'
VIATURAS = RAIZ / 'data' / 'viaturas'

LARGURAS = [200, 414]
QUALIDADE = {'AVIF': 55, 'WEBP': 80, 'JPEG': 84}
OG = (1200, 630)
TUDO = '--tudo' in sys.argv


def carregar(caminho: Path) -> Image.Image:
    im = Image.open(caminho)
    return ImageOps.exif_transpose(im).convert('RGB')


def variantes(im: Image.Image, pasta: Path, base: str) -> int:
    feitas = 0
    for w in LARGURAS:
        escala = im.copy()
        if escala.width > w:
            escala.thumbnail((w, w * 10), Image.LANCZOS)
        for fmt, ext in (('AVIF', 'avif'), ('WEBP', 'webp'), ('JPEG', 'jpg')):
            saida = pasta / f'{base}-{w}.{ext}'
            if saida.exists() and not TUDO:
                continue
            escala.save(saida, fmt, quality=QUALIDADE[fmt],
                        **({'method': 6} if fmt == 'WEBP' else {}))
            feitas += 1
    return feitas


def cartao_partilha(im: Image.Image, pasta: Path):
    """1200x630 para o WhatsApp e o Facebook. A fotografia tem 414 px, por isso
    é ampliada — mas numa pré-visualização de ligação, num telemóvel, isso não
    se nota, e é preferível a não haver imagem nenhuma."""
    ImageOps.fit(im, OG, Image.LANCZOS, centering=(0.5, 0.5)).save(
        pasta / 'og.jpg', 'JPEG', quality=82, optimize=True)


def main():
    if not features.check('avif'):
        print('AVISO: este Pillow não escreve AVIF — só saem WebP e JPEG.')

    total = 0
    for jf in sorted(VIATURAS.glob('*.json')):
        v = json.loads(jf.read_text(encoding='utf-8'))
        pasta = DESTINO / v['slug']
        pasta.mkdir(parents=True, exist_ok=True)
        for i, origem in enumerate(v['fotos_origem'], 1):
            f = ORIGINAIS / origem
            if not f.exists():
                print(f'  !! {v["slug"]}: falta {origem}')
                continue
            im = carregar(f)
            total += variantes(im, pasta, f'{i:02d}')
            if i == 1 and (TUDO or not (pasta / 'og.jpg').exists()):
                cartao_partilha(im, pasta)
        print(f'  {v["slug"]}: {len(v["fotos_origem"])} fotografias')

    print(f'\n{total} ficheiros novos')


if __name__ == '__main__':
    main()
