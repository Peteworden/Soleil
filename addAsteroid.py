"""
このプログラムの使い方（ネット環境が必要です）
astroqueryというライブラリをインストールしてください

Google Colabの場合
1.新しい行に「%pip install astroquery」と入力して実行します。最後に「Successfully installed astroquery-なんたら」と出たら成功です
2.Google Colabにコピー&ペーストして、左上の右三角を押します
3.下にスクロールして「天体の名前（英語）や小惑星番号など：」というのが表示されていたら、
  枠の中にそれ（Takoyaki、31416など。marga*のようなあいまい検索もできます）を入力してEnter
4-1.出力が1行だったとき
    出力をコピーして、allInOne.txtを開いて「Pluto」を検索。その行の下にPlutoの行と同じように
    出力を貼り付けて保存し、chart.htmlをリロードする。
4-2.「候補が複数あります」と表示されたとき
    お目当てを見つけて名前を把握してから1に戻る。彗星は「C/2023 A3」「1P」の部分のみで検索

4-1と同じようにallInOne.txtの中で「rec」を検索してそのあとの書き方をまねると星団とかもカスタマイズできます
"""


import requests
import json
from math import floor

def JD_to_YMDH(JD): #TT-->JST として変換　TT-->TTのときはJDに-0.3742しておく
    JD += 0.375
    A = floor(JD + 68569.5)
    B = floor(A / 36524.25)
    C = A - floor(36524.25 * B + 0.75)
    E = floor((C + 1) / 365.25025)
    F = C - floor(365.25 * E) + 31
    G = floor(F / 30.59)
    D = F - floor(30.59 * G)
    H = floor(G / 11)
    M = G - 12 * H + 2
    Y = 100 * (B -49) + E + H
    Hr = round((JD + 0.5 - floor(JD + 0.5)) * 24, 1)
    if M == 12 and D == 32:
        Y += 1
        M = 1
        D = 1

    return Y, M, D, Hr

def SBDBset(r):
    name = r['object']['fullname']
    nameSplit = name.split()
    if nameSplit[0].isdecimal():
        name = nameSplit[1]
        if len(nameSplit) > 2:
            for i in range(2, len(nameSplit)):
                if nameSplit[i][0] == '(':
                    break
                else:
                    name += ' ' + nameSplit[i]

    ele = r['orbit']['elements']
    e = round(float(ele[0]['value']), 5)
    if e <= 0.99:
        a    = round(float(ele[1]['value']), 5)
        peri = round(float(ele[5]['value']), 6)
        i    = round(float(ele[3]['value']), 6)
        node = round(float(ele[4]['value']), 6)
        M0   = round(float(ele[6]['value']), 6)

        if r['phys_par'] != []:
            G = 0.15
            H_exist = False
            for par in r['phys_par']:
                if par['name'] == 'H':
                    H = par['value']
                    H_exist = True
                elif par['name'] == 'G':
                    G = par['value']
                    break
            if H_exist:
                eles = [a, e, peri, i, node, M0, H, G]
            else:
                eles = [a, e, peri, i, node, M0, 0, 100]
        else:
            eles = [a, e, peri, i, node, M0, 0, 100]

    else:
        q    = round(float(ele[2]['value']), 5)
        peri = round(float(ele[5]['value']), 6)
        i    = round(float(ele[3]['value']), 6)
        node = round(float(ele[4]['value']), 6)

        eles = [q, e, peri, i, node, 0, 0, 100]

    epoch = float(r['orbit']['epoch'])
    if e > 0.99:
        epoch = round(float(ele[7]['value']), 6) # epoch --> tp（近日点通過）
    [Y, M, D, Hr] = JD_to_YMDH(epoch - 0.3742)
    print(' '.join([str(len(name.split()))] + name.split() + list(map(str, [epoch, eles[0], eles[1], eles[2], eles[3], eles[4], eles[5], 0, 0, 0, 0, 0, eles[6], eles[7], Y, M, D, Hr]))))

def SBDB(inputedName):
    try:
        URL = 'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + inputedName + '&full-prec=true&phys-par=true'
        r = json.loads(requests.get(URL).text)
        if 'code' in r:
            if r['code'] == '300':
                print('候補が複数あります')
                for obj in range(len(r['list'])):
                    print(r['list'][obj]['name'])
            else:
              print('エラー')
        else:
            SBDBset(r)
    except requests.ConnectionError:
        print('インターネットに接続されていません')

SBDB(input("天体の名前（英語）や小惑星番号など："))
