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
# cortar. Aqui não há fotografia grande — a maior tem 414 px —, por isso a
# imagem de partilha é construída com a linguagem da marca: carvão, a textura
# de setas e o logótipo. Fica melhor do que uma fotografia esticada.
ALVO = (1200, 630)
og = Image.new('RGB', ALVO, CARVAO)
padrao = Image.open(IMG / 'padrao.png').convert('RGBA')
p = padrao.resize((padrao.width * 2, padrao.height * 2), Image.LANCZOS)
camada = Image.new('RGBA', ALVO, (0, 0, 0, 0))
for x in range(0, ALVO[0], p.width):
    for y in range(0, ALVO[1], p.height):
        camada.alpha_composite(p, (x, y))
camada.putalpha(camada.split()[-1].point(lambda v: int(v * 0.16)))
og = Image.alpha_composite(og.convert('RGBA'), camada)

logo = Image.open(IMG / 'logo-claro.png').convert('RGBA')
lh = 300
logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
og.alpha_composite(logo, ((ALVO[0] - logo.width) // 2, (ALVO[1] - logo.height) // 2 - 10))

og.convert('RGB').save(IMG / 'og.jpg', quality=88, optimize=True, progressive=True)
print(f'og.jpg  {ALVO[0]}x{ALVO[1]}  {(IMG / "og.jpg").stat().st_size // 1024} KB')
