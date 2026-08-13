#!/usr/bin/env python3
"""Extrai a textura de setas da marca, a partir do banner do cliente.

A NewAuto já tem um padrão próprio: o símbolo repetido em relevo sobre carvão,
que se vê no banner das redes sociais. É o elemento gráfico mais distintivo que
a marca tem depois do logótipo, e sai de graça — não é preciso inventar nada.

O período foi medido por autocorrelação no banner: 165x104 px. A textura é
guardada em branco com transparência, e não com o carvão colado, para o CSS
poder controlar a cor de fundo e a intensidade sem gerar um ficheiro por variante.
"""
import pathlib
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / '_fonte/originais/banner.jpg'
DESTINO = RAIZ / 'assets/img/padrao.png'
CAIXA = (60, 40, 60 + 165, 40 + 104)   # zona limpa, longe do logótipo vermelho


def main():
    t = Image.open(ORIGEM).convert('L').crop(CAIXA)
    px = t.load()
    W, H = t.size
    valores = [px[x, y] for y in range(H) for x in range(W)]
    fundo = min(valores)
    alcance = max(1, max(valores) - fundo)

    out = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    op = out.load()
    for y in range(H):
        for x in range(W):
            a = (px[x, y] - fundo) / alcance
            op[x, y] = (255, 255, 255, int(a * 255))
    out.save(DESTINO, optimize=True)
    print(f'padrao.png  {W}x{H}  {DESTINO.stat().st_size / 1024:.1f} KB'
          f'  (fundo {fundo}, alcance {alcance})')


if __name__ == '__main__':
    main()
