#!/usr/bin/env python3
"""Extrai o logótipo do ficheiro que o cliente tem.

O original é um JPEG com o logótipo por cima de uma fotografia de rua desfocada.
Não se redesenha nada — tira-se o fundo e mantém-se o traço tal como está.

**Separa-se por cor da marca, não por brilho.** A primeira tentativa usou a
luminância e trouxe o bokeh escuro da fotografia consigo: ficava um halo cinzento
à volta do símbolo, visível assim que se punha o logótipo sobre o carvão da
navbar. O logótipo tem duas cores sólidas e medidas — vermelho #EA3223 e cinzento
#555250 — e a distância à cor separa-as sem tocar na forma.

O cinzento da assinatura («comércio automóvel») só se procura na faixa de baixo,
onde ela está. No resto da imagem, cinzento é fundo.

Saem dois ficheiros porque o site tem zonas claras e escuras, e a assinatura em
cinzento desaparecia sobre o carvão.
"""
import colorsys
import pathlib
from PIL import Image, ImageFilter

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / '_fonte/originais/logo.jpg'
DESTINO = RAIZ / 'assets/img'

# onde está a marca dentro do quadrado, em fracções
CAIXA = (0.27, 0.29, 0.73, 0.71)
FAIXA_ASSINATURA = 0.86   # abaixo disto está o «comércio automóvel»
LARGURA = 560             # três vezes a maior utilização no site


def extrair():
    im = Image.open(ORIGEM).convert('RGB')
    w, h = im.size
    lock = im.crop((int(CAIXA[0] * w), int(CAIXA[1] * h), int(CAIXA[2] * w), int(CAIXA[3] * h)))
    W, H = lock.size
    px = lock.load()

    alfa = Image.new('L', (W, H), 0)
    cor = Image.new('RGB', (W, H), (0, 0, 0))
    ap, cp = alfa.load(), cor.load()

    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            matiz, sat, val = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            graus = matiz * 360
            if (graus < 22 or graus > 340) and sat > 0.42 and val > 0.30:
                ap[x, y] = int(min(1.0, (sat - 0.42) / 0.35) * 255)
                cp[x, y] = (r, g, b)
            elif y / H > FAIXA_ASSINATURA:
                lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
                if lum < 150 and sat < 0.35:
                    ap[x, y] = int(min(1.0, (150 - lum) / 70) * 255)
                    cp[x, y] = (r, g, b)

    # o JPEG deixa pixéis soltos nas arestas; a mediana limpa-os sem comer a forma
    return alfa.filter(ImageFilter.MedianFilter(3)), cor


def montar(alfa, cor, assinatura):
    W, H = alfa.size
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    op, ap, cp = out.load(), alfa.load(), cor.load()
    for y in range(H):
        for x in range(W):
            a = ap[x, y]
            if not a:
                continue
            r, g, b = cp[x, y]
            _, sat, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            op[x, y] = (*((r, g, b) if sat > 0.35 else assinatura), a)
    out = out.crop(out.getbbox())
    return out.resize((LARGURA, round(out.height * LARGURA / out.width)), Image.LANCZOS)


def poupar(img):
    """O logótipo tem três cores e transparência. Guardado em RGBA são 152 KB,
    a maior parte deles a descrever variações de anti-aliasing que ninguém vê.
    Numa paleta de 48 cores fica visualmente igual e pesa uma fracção — e isto
    é um ficheiro que entra em todas as páginas do site."""
    return img.quantize(colors=128, method=Image.FASTOCTREE)


def main():
    alfa, cor = extrair()
    for nome, assinatura in (('logo-claro', (228, 228, 228)), ('logo-escuro', (85, 82, 80))):
        img = poupar(montar(alfa, cor, assinatura))
        caminho = DESTINO / f'{nome}.png'
        img.save(caminho, optimize=True)
        print(f'{nome}.png  {img.width}x{img.height}  {caminho.stat().st_size / 1024:.1f} KB')

    # só o símbolo, para o favicon e para onde não caiba a palavra
    alfa2, cor2 = extrair()
    W, H = alfa2.size
    simbolo = montar(alfa2.crop((0, 0, W, int(H * 0.70))), cor2.crop((0, 0, W, int(H * 0.70))), (228, 228, 228))
    poupar(simbolo).save(DESTINO / 'simbolo.png', optimize=True)
    print(f'simbolo.png  {simbolo.width}x{simbolo.height}')


if __name__ == '__main__':
    main()
