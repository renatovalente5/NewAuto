#!/usr/bin/env python3
"""Cria os ficheiros das viaturas de demonstração.

**Estes dados são de demonstração e o cliente vai substituí-los no backoffice.**
Foi ele que o autorizou. Mas não são inventados do nada: a marca, o modelo e a
cor de cada viatura saem dos carros que estão mesmo nas 205 fotografias, que
foram classificadas uma a uma. O que é inventado — quilómetros, ano, preço,
matrícula, equipamento — está agrupado numa tabela só, à vista, para se saber
exactamente o que é preciso corrigir.

Sete campos são obrigatórios por lei (DL 74/93, art. 2.º n.º 1): matrícula,
preço, ano de construção, data da matrícula, número de registos anteriores,
garantia de fábrica e garantia de usado. O gerador recusa publicar uma ficha
sem eles, e por isso todos vão preenchidos.

A garantia legal de conformidade é de **3 anos** (DL 84/2021). O DL 67/2003, que
previa os 12 meses para usados, foi revogado a 01-01-2022. Nenhuma viatura pode
dizer «12 meses».
"""
import json
import pathlib
import random
import unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CLASSIFICACAO = RAIZ / '_fonte/classificacao.json'
DESTINO = RAIZ / 'data/viaturas'

# marca, modelo -> como aparece nas fotografias; o resto é demonstração
DEMO = [
    dict(marca='Peugeot', modelo='308 SW', versao='1.5 BlueHDi Allure', ano=2018, mes='06',
         km=145_320, cv=130, cc=1499, preco=14_900, caixa='Manual', segmento='Carrinha',
         cor='Cinzento Platinum', portas=5, destaque=True,
         descricao='Carrinha familiar com boa capacidade de carga e consumos contidos. '
                   'Segundo dono, livro de revisões completo e quilometragem certificada.'),
    dict(marca='Peugeot', modelo='508 SW', versao='1.5 BlueHDi GT Line', ano=2019, mes='09',
         km=128_450, cv=130, cc=1499, preco=19_500, caixa='Automática', segmento='Carrinha',
         cor='Azul Escuro Metalizado', portas=5, destaque=True,
         descricao='Versão GT Line com caixa automática de 8 relações. Interior em pele '
                   'sintética, navegação e câmara de marcha-atrás.'),
    dict(marca='BMW', modelo='Série 1', versao='116d Advantage', ano=2019, mes='03',
         km=98_700, cv=116, cc=1496, preco=19_900, caixa='Manual', segmento='Utilitário',
         cor='Preto Sapphire', portas=5, destaque=True,
         descricao='Utilitário premium de cinco portas, com o equilíbrio de consumo e '
                   'prestações que fez a fama do modelo. Manutenção feita em concessionário.'),
    dict(marca='BMW', modelo='Série 3', versao='320d Line Sport', ano=2016, mes='11',
         km=178_900, cv=190, cc=1995, preco=17_500, caixa='Automática', segmento='Berlina',
         cor='Preto Sapphire', portas=4, destaque=True,
         descricao='Berlina de referência do segmento, com caixa automática Steptronic. '
                   'Estofos em pele, jantes de 18 polegadas e faróis LED.'),
    dict(marca='Citroën', modelo='C4 Cactus', versao='1.6 BlueHDi Shine', ano=2017, mes='04',
         km=132_100, cv=100, cc=1560, preco=10_900, caixa='Manual', segmento='SUV/TT',
         cor='Cinzento Alumínio', portas=5, destaque=True,
         descricao='O desenho mais distinto do segmento, com os Airbump laterais originais. '
                   'Consumos muito baixos em estrada e manutenção barata.'),
    dict(marca='Seat', modelo='Leon ST', versao='1.6 TDI Style', ano=2018, mes='07',
         km=141_800, cv=115, cc=1598, preco=13_500, caixa='Manual', segmento='Carrinha',
         cor='Cinzento Magnético', portas=5, destaque=True,
         descricao='Carrinha compacta sobre a plataforma do Grupo Volkswagen. Boa mala, '
                   'condução equilibrada e custos de utilização reduzidos.'),
    dict(marca='Mercedes-Benz', modelo='Classe A', versao='A 180 d Style', ano=2016, mes='02',
         km=165_400, cv=109, cc=1461, preco=15_900, caixa='Manual', segmento='Utilitário',
         cor='Branco Polar', portas=5,
         descricao='Compacto premium com acabamentos cuidados. Sensores de estacionamento, '
                   'faróis bi-xénon e sistema multimédia com ecrã.'),
    dict(marca='Opel', modelo='Meriva', versao='1.6 CDTi Cosmo', ano=2015, mes='05',
         km=152_600, cv=110, cc=1598, preco=8_750, caixa='Manual', segmento='Monovolume',
         cor='Cinzento Claro', portas=5,
         descricao='Monovolume compacto com as portas traseiras de abertura invertida. '
                   'Muito espaço para o tamanho exterior — escolha prática para família.'),
    dict(marca='Renault', modelo='Mégane Sport Tourer', versao='1.5 dCi Limited', ano=2017, mes='10',
         km=156_200, cv=110, cc=1461, preco=11_500, caixa='Manual', segmento='Carrinha',
         cor='Cinzento Titânio', portas=5,
         descricao='Carrinha familiar com o motor 1.5 dCi, dos mais fiáveis e económicos '
                   'da sua geração. Climatização automática e navegação R-Link.'),
    dict(marca='Peugeot', modelo='5008', versao='1.5 BlueHDi Allure 7L', ano=2018, mes='08',
         km=149_300, cv=130, cc=1499, preco=18_900, caixa='Manual', segmento='SUV/TT',
         cor='Cinzento Artense', portas=5, lugares=7,
         descricao='SUV de sete lugares com a terceira fila removível. i-Cockpit digital, '
                   'tejadilho panorâmico e sensores dianteiros e traseiros.'),
    dict(marca='Renault', modelo='Espace', versao='1.6 dCi Intens EDC', ano=2016, mes='01',
         km=172_800, cv=160, cc=1598, preco=16_500, caixa='Automática', segmento='Monovolume',
         cor='Cinzento Cassiopée', portas=5, lugares=7,
         descricao='Monovolume de sete lugares com caixa automática de dupla embraiagem. '
                   'Suspensão adaptativa, ecrã vertical R-Link 2 e faróis Full LED.'),
    dict(marca='Alfa Romeo', modelo='MiTo', versao='1.3 JTDm Distinctive', ano=2014, mes='03',
         km=118_900, cv=85, cc=1248, preco=6_900, caixa='Manual', segmento='Citadino',
         cor='Vermelho Alfa', portas=3, estado='vendida', data_venda='2026-07-28',
         descricao='Citadino italiano com o carácter que se lhe conhece. Selector DNA, '
                   'jantes de liga leve e estofos desportivos.'),
]

LETRAS = 'ABCDEFGHJKLMNPQRSTUVXZ'


def slugificar(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode()
    return ''.join(c if c.isalnum() else '-' for c in t.lower()).strip('-').replace('--', '-')


def matricula(rng):
    """Formato português de duas letras, dois dígitos, duas letras."""
    return (f'{rng.choice(LETRAS)}{rng.choice(LETRAS)}-'
            f'{rng.randint(10, 99)}-'
            f'{rng.choice(LETRAS)}{rng.choice(LETRAS)}')


def escolher_fotos(v, fotos, usadas):
    """Capa da própria marca e modelo, depois interiores da mesma marca, depois
    pormenores quaisquer. Nenhuma fotografia se repete entre viaturas — com 205
    disponíveis e 12 viaturas, há folga de sobra."""
    def livres(cond):
        return [f for f in fotos if f['ficheiro'] not in usadas and cond(f)]

    marca, modelo = v['marca'], v['modelo']
    capas = livres(lambda f: f.get('capa') and f['tipo'] == 'carro-inteiro'
                   and f.get('marca') == marca and f.get('modelo', '').startswith(modelo.split()[0]))
    if not capas:
        capas = livres(lambda f: f.get('capa') and f['tipo'] == 'carro-inteiro' and f.get('marca') == marca)
    if not capas:
        capas = livres(lambda f: f.get('capa') and f['tipo'] == 'carro-inteiro')
    capas.sort(key=lambda f: -f.get('qualidade', 0))

    interiores = livres(lambda f: f['tipo'] == 'interior' and f.get('marca') == marca)
    interiores += livres(lambda f: f['tipo'] == 'interior' and not f.get('marca'))
    interiores.sort(key=lambda f: -f.get('qualidade', 0))

    detalhes = livres(lambda f: f['tipo'] in ('exterior-pormenor', 'roda', 'emblema'))
    detalhes.sort(key=lambda f: -f.get('qualidade', 0))

    escolhidas = capas[:3] + interiores[:3] + detalhes[:2]
    for f in escolhidas:
        usadas.add(f['ficheiro'])
    return [f['ficheiro'] for f in escolhidas]


def main():
    fotos = json.loads(CLASSIFICACAO.read_text(encoding='utf-8'))
    norm = {'Citroen': 'Citroën', 'SEAT': 'Seat', 'Mercedes': 'Mercedes-Benz', 'Serie 1': 'Série 1'}
    for f in fotos:
        f['marca'] = norm.get(f.get('marca', ''), f.get('marca', ''))
        f['modelo'] = norm.get(f.get('modelo', ''), f.get('modelo', ''))

    DESTINO.mkdir(parents=True, exist_ok=True)
    for antigo in DESTINO.glob('*.json'):
        antigo.unlink()

    usadas = set()
    rng = random.Random(2026)
    for i, v in enumerate(DEMO, 1):
        slug = slugificar(f"{v['marca']} {v['modelo']} {v['versao']} {v['ano']}")
        ficha = {
            'slug': slug,
            'referencia': f'NA{i:03d}',
            'titulo': f"{v['marca']} {v['modelo']} {v['versao']}",
            'marca': v['marca'],
            'modelo': v['modelo'],
            'versao': v['versao'],
            'matricula': matricula(rng),
            'estado': v.get('estado', 'disponivel'),
            'data_venda': v.get('data_venda', ''),
            'destaque': v.get('destaque', False),
            'oculta': False,
            'demonstracao': True,
            'preco': v['preco'],
            'negociavel': True,
            'aceita_retoma': True,
            'ano_construcao': v['ano'],
            'mes_matricula': v['mes'],
            'ano_matricula': v['ano'],
            'registos_anteriores': rng.randint(1, 3),
            'quilometros': v['km'],
            'origem': 'Nacional',
            'livro_revisoes': True,
            'garantia_usado': 'Garantia legal de conformidade de 3 anos (DL 84/2021)',
            'garantia_fabrica': 'Não aplicável',
            'combustivel': 'Gasóleo',
            'caixa': v['caixa'],
            'potencia_cv': v['cv'],
            'cilindrada_cc': v['cc'],
            'segmento': v['segmento'],
            'portas': v.get('portas', 5),
            'lugares': v.get('lugares', 5),
            'cor': v['cor'],
            'descricao': v['descricao'],
            'ordem': i,
            'fotos_origem': escolher_fotos(v, fotos, usadas),
        }
        (DESTINO / f'{slug}.json').write_text(
            json.dumps(ficha, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f"  {slug:<48} {len(ficha['fotos_origem'])} fotos  {ficha['preco']:>6} EUR"
              f"  {'VENDIDA' if ficha['estado'] == 'vendida' else ''}")

    print(f'\n{len(DEMO)} viaturas · {len(usadas)} fotografias usadas de {len(fotos)}')


if __name__ == '__main__':
    main()
