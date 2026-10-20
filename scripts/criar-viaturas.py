#!/usr/bin/env python3
"""Cria os ficheiros das viaturas de demonstração.

**Estes dados são de demonstração e o cliente vai substituí-los no backoffice.**
Foi ele que o autorizou. Mas não são inventados do nada.

CADA VIATURA É UM CARRO VERDADEIRO DO STAND. As 205 fotografias vieram dos posts
do Instagram e do Facebook da NewAuto, e o nome de cada ficheiro traz o número da
publicação: as fotografias de um mesmo post têm números seguidos. Agrupadas assim,
dão os carros que o stand já vendeu, cada um com o seu exterior e o seu interior.
A primeira versão deste script escolhia fotografias por marca, e saíram fichas com
um BMW Série 3 na capa de um Série 1, estrelas da Mercedes na galeria de um
Peugeot e um conta-quilómetros a dizer 181 mil numa viatura anunciada com 152 mil.

O modelo, a geração, a cor e a caixa de cada ficha batem com o que as fotografias
mostram. O que é de demonstração — matrícula, preço, quilómetros, datas,
registos, equipamento e o texto — está todo nesta tabela, à vista, para se saber
exactamente o que é preciso corrigir.

Ficaram de fora, de propósito: fotografias com pessoas (a autorização de imagem
que deram para o Instagram não cobre o site), emblemas de outras marcas e os
conta-quilómetros legíveis, que contradiriam os quilómetros de demonstração.

Sete campos são obrigatórios por lei (DL 74/93, art. 2.º n.º 1): matrícula,
preço, ano de construção, data da matrícula, número de registos anteriores,
garantia de fábrica e garantia de usado. O gerador recusa publicar uma ficha
sem eles, e por isso todos vão preenchidos.

A garantia legal de conformidade é de **3 anos** (DL 84/2021). O DL 67/2003, que
previa os 12 meses para usados, foi revogado a 01-01-2022. Nenhuma viatura pode
dizer «12 meses».

Correr:  python3 scripts/criar-viaturas.py     (apaga e reescreve data/viaturas/)
"""
import json
import pathlib
import unicodedata

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGINAIS = RAIZ / '_fonte/originais'
DESTINO = RAIZ / 'data/viaturas'

GARANTIA = 'Garantia legal de conformidade de 3 anos (DL 84/2021)'


def fotos(*nomes):
    """Os nomes vêm sem o sufixo, para a tabela caber no ecrã."""
    return [f'{n}_n.jpg' for n in nomes]


VIATURAS = [
    dict(ref='NA001', marca='BMW', modelo='Série 1', versao='116d Advantage',
         construcao=2019, mes='02', ano=2020, km=92_800, preco=22_900, registos=1,
         origem='Nacional', revisoes=True, combustivel='Gasóleo', caixa='Manual',
         cv=116, cc=1496, segmento='Utilitário', portas=5, lugares=5, cor='Preto Sapphire',
         matricula='AA-12-NA', destaque=True,
         equipamento=['Painel de instrumentos digital', 'Navegação', 'Ar condicionado automático',
                      'Sensores de estacionamento traseiros', 'Cruise control', 'Faróis LED'],
         descricao='A geração actual do Série 1, com o painel de instrumentos digital e o '
                   'ecrã central da BMW. Cinco portas e bagageira com rede de carga.',
         fotos=fotos('709864176_122288369444191273_2297375480982318602', '709737356_122288369486191273_5529197881392270215',
                     '709013885_122288372336191273_4019765799664273984', '709101615_122288372474191273_564864883599668804',
                     '709166642_122288372516191273_7726751183366626328', '710573464_122288369528191273_5475232084885371076',
                     '710723136_122288369576191273_962212301547876723', '709864200_122288372426191273_6886164087347981242',
                     '709186165_122288369618191273_5470759467947759779', '711474735_122288369744191273_792995017215428776',
                     '709102079_122288369876191273_2936202052059436937', '709134852_122288370080191273_1792573871058520613',
                     '708413947_122288369942191273_2390215890526291319', '708999693_122288369990191273_4954727016320378543')),
    dict(ref='NA002', marca='Peugeot', modelo='308 SW', versao='1.5 BlueHDi Allure',
         construcao=2018, mes='06', ano=2018, km=118_450, preco=15_900, registos=1,
         origem='Importado', revisoes=True, combustivel='Gasóleo', caixa='Manual',
         cv=130, cc=1499, segmento='Carrinha', portas=5, lugares=5, cor='Cinzento Hurricane',
         matricula='18-NA-02', destaque=True,
         equipamento=['i-Cockpit com ecrã táctil', 'Navegação', 'Climatização automática bizona',
                      'Sensores de estacionamento', 'Cruise control', 'Jantes de liga leve'],
         descricao='Carrinha com o i-Cockpit da Peugeot: volante pequeno, painel por cima '
                   'dele e ecrã táctil ao centro. Bagageira grande e regular.',
         fotos=fotos('670971576_17897395710442544_5957317837030942737', '682310701_17897395548442544_3303199804575967771',
                     '684217616_17897395695442544_345982779080378893', '681277157_17897395539442544_6529159257631229004',
                     '682704028_17897395665442544_7253541893635485079', '683804297_17897395575442544_9168845381990215846',
                     '682685762_17897395605442544_8200963468846795953', '684820510_17897395608442544_7983808440084570680',
                     '675513379_17897395557442544_459555065601976390', '684845689_17897395572442544_5589407274964619752',
                     '684791351_17897395632442544_1677005523567915605', '681939115_17897395641442544_359369680627255725',
                     '681969185_17897395668442544_4253315472133597185', '684810744_17897395677442544_7483523812528629429')),
    dict(ref='NA003', marca='Mercedes-Benz', modelo='Classe A', versao='A 180 d Urban',
         construcao=2016, mes='04', ano=2016, km=148_700, preco=15_900, registos=2,
         origem='Importado', revisoes=True, combustivel='Gasóleo', caixa='Manual',
         cv=109, cc=1461, segmento='Utilitário', portas=5, lugares=5, cor='Prata Polar',
         matricula='16-NA-03', destaque=True,
         equipamento=['Ecrã multimédia', 'Bluetooth', 'Ar condicionado', 'Jantes de liga leve',
                      'Cruise control', 'Volante multifunções em pele'],
         descricao='Classe A da fase final da geração W176, com a grelha de pontos e as '
                   'jantes pretas. Interior com os arejadores de turbina da marca.',
         fotos=fotos('726794940_122291550470191273_2436275371014400198', '727276031_122291552030191273_2698209433960871004',
                     '728255043_122291552228191273_1245794111054005948', '726432102_122291550872191273_5773163615367380394',
                     '726270196_122291551172191273_3153780701090720681', '727704050_122291551550191273_7561189574223526902',
                     '726405580_122291551754191273_7172989192844716604', '727490610_122291551940191273_5855550487801546858',
                     '728127504_122291552066191273_3644398521115450786', '727789590_122291552096191273_3339010455911197758',
                     '726900510_122291552108191273_8626157162173553618', '726447412_122291552198191273_6163374390093102686')),
    dict(ref='NA004', marca='Seat', modelo='Leon ST', versao='1.6 TDI Style DSG',
         construcao=2017, mes='10', ano=2017, km=139_600, preco=15_400, registos=1,
         origem='Nacional', revisoes=True, combustivel='Gasóleo', caixa='Automática',
         cv=115, cc=1598, segmento='Carrinha', portas=5, lugares=5, cor='Cinzento Pirineus',
         matricula='17-NA-04', destaque=True,
         equipamento=['Caixa automática DSG de 7 velocidades', 'Ecrã táctil', 'Ar condicionado automático',
                      'Sensores de estacionamento', 'Volante multifunções', 'Jantes de liga leve'],
         descricao='Carrinha compacta com caixa automática de dupla embraiagem. '
                   'Bagageira ampla e bancos traseiros rebatíveis.',
         fotos=fotos('687816528_122284613444191273_1333163244873740366', '687041933_122284613402191273_8417984624242879806',
                     '690950324_122284613492191273_1179378441307644260', '687615139_122284613582191273_1631972640630905499',
                     '686921630_122284613780191273_8436602404413583971', '687032373_122284613828191273_244354319358381240',
                     '687041304_122284613540191273_1201361385918294952', '690537480_122284613684191273_2379262534506224846',
                     '687588098_122284613732191273_7290530892237825686')),
    dict(ref='NA005', marca='Citroën', modelo='C4 Cactus', versao='1.2 PureTech Feel',
         construcao=2016, mes='05', ano=2016, km=98_600, preco=10_900, registos=1,
         origem='Nacional', revisoes=False, combustivel='Gasolina', caixa='Manual',
         cv=82, cc=1199, segmento='SUV/TT', portas=5, lugares=5, cor='Cinzento Shark',
         matricula='16-NA-05', destaque=True,
         equipamento=['Airbump laterais', 'Barras de tejadilho', 'Ecrã táctil de 7"', 'Navegação',
                      'Painel de instrumentos digital', 'Bluetooth'],
         descricao='O C4 Cactus original, com os Airbump nas portas e barras de tejadilho. '
                   'Interior simples e luminoso, com o ecrã táctil ao centro.',
         fotos=fotos('655151409_17890932234442544_7561644839724660292', '654241641_17890932192442544_1073599932086025225',
                     '655060660_17890932201442544_4484610339020265443', '655228718_17890932180442544_1793683519589364791',
                     '655648918_17890932243442544_640406302812981172', '654965143_17890932330442544_4923797086503250034',
                     '654361546_17890932351442544_8870224379821865803', '654603335_17890932246442544_2325944947335170965',
                     '652681688_17890932255442544_7780716889408184564', '654859514_17890932264442544_2735916650985878816',
                     '655869997_17890932318442544_4220257244859983290', '655203527_17890932333442544_375678314419524014',
                     '654098719_17890932342442544_8197033486638141722')),
    dict(ref='NA006', marca='Peugeot', modelo='508 SW', versao='1.6 BlueHDi Active',
         construcao=2016, mes='09', ano=2016, km=172_900, preco=12_900, registos=2,
         origem='Importado', revisoes=True, combustivel='Gasóleo', caixa='Manual',
         cv=120, cc=1560, segmento='Carrinha', portas=5, lugares=5, cor='Azul Encre',
         matricula='16-NA-06', destaque=True,
         equipamento=['Tecto panorâmico', 'Navegação', 'Climatização automática',
                      'Sensores de estacionamento', 'Cruise control', 'Jantes de liga leve'],
         descricao='Carrinha grande de estrada, com tecto panorâmico em vidro. '
                   'Muito espaço atrás e na bagageira.',
         fotos=fotos('754046446_17910684570442544_9091127544984752621', '752169308_17910684615442544_4273095996496342051',
                     '753247486_17910684552442544_1406395069356738915', '753125291_17910684582442544_8453532670577515467',
                     '752189402_17910684561442544_1811752443018789737', '753540953_17910684591442544_730264695794401946',
                     '754579823_17910684600442544_7871372437670446937', '751915170_17910684618442544_7005632521502532606',
                     '751870923_17910684627442544_4369480426781526650')),
    dict(ref='NA007', marca='Peugeot', modelo='308 SW', versao='1.6 BlueHDi Active',
         construcao=2016, mes='03', ano=2016, km=164_300, preco=11_900, registos=2,
         origem='Nacional', revisoes=True, combustivel='Gasóleo', caixa='Manual',
         cv=120, cc=1560, segmento='Carrinha', portas=5, lugares=5, cor='Cinzento Alumínio',
         matricula='16-NA-07', destaque=False,
         equipamento=['i-Cockpit com ecrã táctil', 'Ajuda ao estacionamento', 'Ar condicionado automático',
                      'Cruise control', 'Bluetooth', 'Jantes de liga leve'],
         descricao='A mesma carrinha 308 SW, numa versão anterior e mais em conta. '
                   'Faróis com luz diurna LED e jantes pretas.',
         fotos=fotos('670655501_17895165738442544_2973681375945229800', '669766710_17895165648442544_1488953683926589922',
                     '670318843_17895165729442544_8350256839887791645', '670402718_17895165720442544_5646115986202200600',
                     '670657269_17895165657442544_4046846059845290873', '670284380_17895165666442544_8679328941119770552',
                     '657711124_17895165693442544_7127931397219445306', '670161684_17895165681442544_2788804611175100191',
                     '674427748_17895165684442544_5235879030655545086', '670685561_17895165798442544_8941031877791018104',
                     '670617501_17895165801442544_4685370822368919750', '670769945_17895165771442544_2337031751978149525',
                     '670437769_17895165783442544_1880918836830500047')),
    dict(ref='NA008', marca='Renault', modelo='Mégane Sport Tourer', versao='1.5 dCi Dynamique S',
         construcao=2015, mes='11', ano=2015, km=176_300, preco=8_400, registos=2,
         origem='Importado', revisoes=False, combustivel='Gasóleo', caixa='Manual',
         cv=110, cc=1461, segmento='Carrinha', portas=5, lugares=5, cor='Cinzento Cassiopée',
         matricula='15-NA-08', destaque=False, estado='reservada',
         equipamento=['Cartão mãos-livres', 'Navegação', 'Ar condicionado automático',
                      'Cruise control', 'Luzes diurnas LED', 'Jantes de liga leve'],
         descricao='Carrinha económica, com arranque por cartão mãos-livres e jantes pretas. '
                   'Gasta pouco e tem mala para a família.',
         fotos=fotos('684835085_17900628474442544_1723348022419993394', '703035471_17900628405442544_5969688486386585634',
                     '684696990_17900628420442544_6925849879705569247', '704167427_17900628423442544_8811483771300933453',
                     '692555068_17900628462442544_698428710379325183', '692555068_17900628471442544_8146820024002223388',
                     '684820510_17900628441442544_3154613264835950028', '703480638_17900628516442544_7971165623148547631',
                     '703924449_17900628525442544_9149969071877691121', '684869051_17900628543442544_1965621860411516665')),
    dict(ref='NA009', marca='Opel', modelo='Meriva', versao='1.6 CDTI Innovation',
         construcao=2015, mes='07', ano=2015, km=151_200, preco=8_900, registos=1,
         origem='Nacional', revisoes=True, combustivel='Gasóleo', caixa='Manual',
         cv=110, cc=1598, segmento='Monovolume', portas=5, lugares=5, cor='Prata Sovereign',
         matricula='15-NA-09', destaque=False,
         equipamento=['Portas traseiras de abertura inversa', 'Navegação', 'Ar condicionado automático',
                      'Cruise control', 'Bluetooth', 'Jantes de liga leve'],
         descricao='Monovolume compacto com as portas traseiras de abertura ao contrário, '
                   'que facilitam a entrada atrás. Posição de condução alta.',
         fotos=fotos('762655923_17913061224442544_3642592700469673894', '767070075_17913061242442544_7347290270066454889',
                     '764531516_17913061206442544_3363064848371727828', '765159141_17913061233442544_2361620617325056477',
                     '766320733_17913061158442544_2511935246691506718', '768083679_17913061179442544_3607504219214640625',
                     '766027709_17913061191442544_5270333933491608522', '768199146_17913061317442544_3825414538602241467',
                     '767068075_17913061146442544_6578952392318391979', '766661609_17913061320442544_5262830793958093570')),
    dict(ref='NA010', marca='Peugeot', modelo='5008', versao='1.6 HDi Allure CMP 7L',
         construcao=2013, mes='06', ano=2013, km=189_500, preco=8_900, registos=2,
         origem='Importado', revisoes=False, combustivel='Gasóleo', caixa='Automática',
         cv=112, cc=1560, segmento='Monovolume', portas=5, lugares=7, cor='Azul claro metalizado',
         matricula='13-NA-10', destaque=False,
         equipamento=['7 lugares', 'Tecto panorâmico', 'Patilhas no volante', 'Sensores de estacionamento',
                      'Sensor de chuva e luz', 'Ar condicionado automático'],
         descricao='Monovolume de sete lugares com tecto panorâmico e caixa pilotada com '
                   'patilhas no volante. A terceira fila rebate no chão da mala.',
         fotos=fotos('643025592_17888924583442544_5354552966058655944', '641301676_17888924586442544_5003074949746902847',
                     '641466624_17888924607442544_7425305805960237853', '642593185_17888924637442544_7776676973570332403',
                     '641255158_17888924661442544_4225027196153669632', '642590604_17888924694442544_410047609946696530',
                     '641686901_17888924715442544_2939944543919578337', '628458838_17888924670442544_3716333610272798022',
                     '641302652_17888924706442544_3153545894590507029', '645643782_17888924745442544_4454001127025154472')),
    # ---- vendidas: ficam com a ficha, marcadas, e aparecem em /vendidos/
    dict(ref='NA011', marca='Alfa Romeo', modelo='MiTo', versao='1.3 JTDm Distinctive',
         construcao=2014, mes='02', ano=2014, km=142_000, preco=6_900, registos=2,
         origem='Nacional', revisoes=False, combustivel='Gasóleo', caixa='Manual',
         cv=85, cc=1248, segmento='Utilitário', portas=3, lugares=4, cor='Vermelho Alfa',
         matricula='14-NA-11', destaque=False, estado='vendida', data_venda='2026-07-18',
         equipamento=['Jantes de liga leve pretas', 'Ar condicionado', 'Bluetooth'],
         descricao='Três portas, vermelho Alfa e jantes pretas.',
         fotos=fotos('702251121_122287200254191273_2017775736867040156')),
    dict(ref='NA012', marca='BMW', modelo='Série 3', versao='320d',
         construcao=2011, mes='05', ano=2011, km=231_000, preco=9_900, registos=3,
         origem='Importado', revisoes=False, combustivel='Gasóleo', caixa='Manual',
         cv=184, cc=1995, segmento='Berlina', portas=4, lugares=5, cor='Preto Sapphire',
         matricula='11-NA-12', destaque=False, estado='vendida', data_venda='2026-06-27',
         equipamento=['Jantes de liga leve', 'Climatização automática', 'Cruise control'],
         descricao='Berlina Série 3 da geração E90, em preto.',
         fotos=fotos('703455936_122287199762191273_8178850013525665846')),
    dict(ref='NA013', marca='Renault', modelo='Espace', versao='2.0 dCi Dynamique',
         construcao=2012, mes='03', ano=2012, km=198_000, preco=7_500, registos=2,
         origem='Importado', revisoes=False, combustivel='Gasóleo', caixa='Manual',
         cv=150, cc=1995, segmento='Monovolume', portas=5, lugares=7, cor='Verde claro metalizado',
         matricula='12-NA-13', destaque=False, estado='vendida', data_venda='2026-05-29',
         equipamento=['7 lugares', 'Ar condicionado automático', 'Cartão mãos-livres'],
         descricao='Monovolume de sete lugares da última fase do Espace IV.',
         fotos=fotos('703763072_122287200008191273_8447009756817268429')),
]


def slugificar(*partes):
    t = ' '.join(str(p) for p in partes)
    t = unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
    return '-'.join(''.join(ch if ch.isalnum() else ' ' for ch in t).split())


def main():
    for f in DESTINO.glob('*.json'):
        f.unlink()

    for ordem, d in enumerate(VIATURAS, 1):
        for foto in d['fotos']:
            if not (ORIGINAIS / foto).exists():
                raise SystemExit(f'{d["ref"]}: não existe {foto}')
        slug = slugificar(d['marca'], d['modelo'], d['versao'], d['ano'])
        ficha = {
            'slug': slug,
            'referencia': d['ref'],
            'titulo': f'{d["marca"]} {d["modelo"]} {d["versao"]}',
            'marca': d['marca'],
            'modelo': d['modelo'],
            'versao': d['versao'],
            'matricula': d['matricula'],
            'estado': d.get('estado', 'disponivel'),
            'data_venda': d.get('data_venda', ''),
            'destaque': d['destaque'],
            'oculta': False,
            'demonstracao': True,
            'preco': d['preco'],
            'negociavel': False,
            'aceita_retoma': True,
            'ano_construcao': d['construcao'],
            'mes_matricula': d['mes'],
            'ano_matricula': d['ano'],
            'registos_anteriores': d['registos'],
            'quilometros': d['km'],
            'origem': d['origem'],
            'livro_revisoes': d['revisoes'],
            'garantia_usado': GARANTIA,
            'garantia_fabrica': 'Não aplicável',
            'combustivel': d['combustivel'],
            'caixa': d['caixa'],
            'potencia_cv': d['cv'],
            'cilindrada_cc': d['cc'],
            'segmento': d['segmento'],
            'portas': d['portas'],
            'lugares': d['lugares'],
            'cor': d['cor'],
            'equipamento': d['equipamento'],
            'descricao': d['descricao'],
            'ordem': ordem,
            'fotos_origem': d['fotos'],
        }
        (DESTINO / f'{slug}.json').write_text(
            json.dumps(ficha, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'  {d["ref"]}  {slug}  ({len(d["fotos"])} fotografias)')


if __name__ == '__main__':
    main()
