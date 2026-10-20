#!/usr/bin/env python3
"""Favicons e imagem de partilha, a partir do símbolo da marca.

O símbolo «NA» é angular e sólido — ao contrário de um monograma manuscrito,
aguenta bem os 16 px do separador do browser sem precisar de truques.

Sobre fundo carvão, que é o do site, e não branco: a marca é escura e o
vermelho sobre carvão lê-se melhor a tamanho pequeno do que sobre branco.
"""
import pathlib
from PIL import Image, ImageDraw, ImageOps

RAIZ = pathlib.Path(__file__).resolve().parent.parent
IMG = RAIZ / 'assets/img'
CARVAO = (26, 26, 26)


def quadrado(lado, margem=0.14, raio=None):
    simbolo = Image.open(IMG / 'simbolo.png').convert('RGBA')
    simbolo = simbolo.crop(simbolo.split()[-1].getbbox())

    icone = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    placa = Image.new('RGBA', (lado, lado), CARVAO + (255,))
    if raio:
        mascara = Image.new('L', (lado, lado), 0)
        ImageDraw.Draw(mascara).rounded_rectangle((0, 0, lado - 1, lado - 1), radius=raio, fill=255)
        placa.putalpha(mascara)
    icone.alpha_composite(placa)

    util = int(lado * (1 - margem * 2))
    escala = min(util / simbolo.width, util / simbolo.height)
    s = simbolo.resize((max(1, round(simbolo.width * escala)),
                        max(1, round(simbolo.height * escala))), Image.LANCZOS)
    icone.alpha_composite(s, ((lado - s.width) // 2, (lado - s.height) // 2))
    return icone


quadrado(180, raio=34).save(IMG / 'apple-touch-icon.png', optimize=True)
quadrado(96, raio=16).save(IMG / 'favicon-96.png', optimize=True)
quadrado(32, margem=0.10, raio=5).save(IMG / 'favicon-32.png', optimize=True)
for n in ('apple-touch-icon', 'favicon-96', 'favicon-32'):
    print(f'{n}.png  {(IMG / (n + ".png")).stat().st_size / 1024:.1f} KB')

# ---------------------------------------------------------------- partilha
# 1200x630 é a medida que o WhatsApp, o Facebook e o LinkedIn recortam sem
# cortar. Sem fotografia — a maior tem 414 px —, com a linguagem da marca.
def partilha():
    """A imagem que aparece quando se partilha o site no WhatsApp ou no Facebook:
    o carvão do banner com o padrão de setas, a faixa vermelha das histórias da
    marca com o padrão tom-sobre-tom, e o logótipo. A mesma linguagem do site."""
    W, H = 1200, 630
    carvao, vermelho, sombra = (41, 41, 41), (234, 50, 35), (179, 37, 25)
    padrao = Image.open(IMG / 'padrao.png').convert('RGBA')
    alfa = Image.new('L', (W, H), 0)
    for y in range(0, H, padrao.height):
        for x in range(0, W, padrao.width):
            alfa.paste(padrao.split()[-1], (x, y))

    base = Image.new('RGB', (W, H), carvao)
    # o padrão em branco a 5 %, como no site
    base = Image.composite(Image.new('RGB', (W, H), (255, 255, 255)), base, alfa.point(lambda a: int(a * .05)))

    # a faixa: paralelogramo ao ângulo dos traços do logótipo
    faixa = Image.new('L', (W, H), 0)
    x0 = int(W * .62)
    ImageDraw.Draw(faixa).polygon([(x0 + 300, -10), (W + 160, -10), (x0 + 120, H + 10), (x0 - 180, H + 10)], fill=255)
    base = Image.composite(Image.new('RGB', (W, H), vermelho), base, faixa)
    tom = Image.composite(Image.new('RGB', (W, H), sombra), base, alfa.point(lambda a: int(a * .55)))
    base = Image.composite(tom, base, faixa)

    logo = Image.open(IMG / 'logo-claro.png').convert('RGBA')
    alto = 360
    logo = logo.resize((round(logo.width * alto / logo.height), alto), Image.LANCZOS)
    tela = base.convert('RGBA')
    tela.alpha_composite(logo, (150, (H - alto) // 2))
    tela.convert('RGB').save(IMG / 'og.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
    print(f'og.jpg  {W}x{H}  {(IMG / "og.jpg").stat().st_size // 1024} KB')


partilha()
