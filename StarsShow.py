#ソレイユ（Soleil）
#Since 2021/8
#programmed by ぴーとうぉーでん@Peteworden31416
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import tkinter as tk
import tkinter.messagebox as mb
import tkinter.ttk as ttk
from math import floor, sin, cos, tan, pi, log10, atan, atan2, asin, acos, exp, log, sqrt
import datetime
import time
import linecache
import requests
import json

eps = 0.4090926 #黄道傾斜角
sine = sin(eps)
cose = cos(eps)

##########[T        a            e          ω          i          Ω         M0           da         de         dω       di         dΩ      , H   , G   ]
Sun     = ['Sun']
Marcury = [2451545.0,  0.387099, 0.205636,  29.127030,  7.004979,  48.330766, 174.792527,  0.000000,  0.000019,  0.285818, -0.005947, -0.125341]
Venus   = [2451545.0,  0.723336, 0.006777,  54.922625,  3.394676,  76.679843,  50.376632,  0.000004, -0.000041,  0.280377, -0.000789, -0.277694]
Earth   = [2451545.0,  1.000003, 0.016711, 102.937682, -0.000015,   0       ,  -2.473110,  0.000006, -0.000044,  0.323274, -0.012947,  0       ]
Mars    = [2451545.0,  1.523710, 0.093394, 286.496832,  1.849691,  49.559539,  19.390198,  0.000018,  0.000079,  0.736984, -0.008131, -0.292573]
Jupiter = [2451545.0,  5.202887, 0.048386, 274.254571,  1.304397, 100.473909,  19.667961, -0.000116, -0.000133,  0.007836, -0.001837,  0.204691]
Saturn  = [2451545.0,  9.536676, 0.053862, -21.063546,  2.485992, 113.662424, 317.355366, -0.001251, -0.000510, -0.130294,  0.001936, -0.288678]
Uranus  = [2451545.0, 19.189165, 0.047257,  96.937351,  0.772638,  74.016925, 142.283828, -0.001962, -0.000044,  0.365647, -0.002429,  0.042406]
Neptune = [2451545.0, 30.069923, 0.008590, 273.180537,  1.770043, 131.784226, 259.915208,  0.000263,  0.000051, -0.317328,  0.000354, -0.005087]
Moon    = ['Moon']
Ceres   = [2459396.5,  2.76566 , 0.07839 ,  73.738268, 10.588196,  80.267638, 247.549972,  0       ,  0       ,  0       ,  0       ,  0       , 3.53, 0.12]
Vesta   = [2459396.5,  2.36166 , 0.08835 , 151.015603,  7.141541, 103.806059, 311.692061,  0       ,  0       ,  0       ,  0       ,  0       , 3.31, 0.32]

planets    = [   Sun, Marcury,  Venus,   Mars, Jupiter, Saturn,   Uranus,  Neptune, Moon,   Ceres,   Vesta]
JPNplanets = ['太陽',  '水星', '金星', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta']

OriginalNumOfPlanets = len(planets) ##addplanetsheetで使う

ff = open('ExtraPlanet.txt')
FF = ff.read()
if FF != "":
    data = FF.split() #名前の単語数、Name,T,a,e,...,H,G,Year,Month,Day,Hour
    name = data[1]
    for i in range(2, int(data[0])+1):
        name += ' ' + data[i]
    JPNplanets.append(name)
    New = []
    for a in range(int(data[0])+1, len(data)-4):
        New.append(float(data[a]))
    planets.append(New) #この辺Extraが1つの想定になってる
ff.close()

Max_mW = 5
Max_m = 10
mag_0W = 5.8
mag_0 = 10.8   #0等星の大きさ
stepW = 1
step =  1    #1等級の大きさの差

rgW = 30
rg = 2.5     #視野の縦横/2

StarNum1_3 = 1594    #Tychoにない星はヒッパルコスからspl1-3_lightにもってきてこの変数をその行数に変える、StarsOnlyも忘れずに！！

f2 = open('supplement_1-3_light.txt') ###これだけ linecache.getline を使う
F2 = f2.readlines()

fHelp = open("TychoSearchHelper.txt")
FHelp = fHelp.readlines()

fff = open('StarsNewHIP_to6_5.txt')
FFF = fff.readlines() #8874個の星

def Eq_Ec(RA, Dec):  #deg
    d = Dec * pi/180
    r = RA * pi/180
    a = cos(d) * cos(r)
    b = sin(d) * sine + cos(d) * sin(r) * cose
    c = sin(d) * cose - cos(d) * sin(r) * sine
    EcLon = (atan2(b, a) * 180/pi) % 360
    EcLat = atan(c / sqrt(a**2 + b**2)) * 180/pi
    return EcLon, EcLat  #deg

def search(a): #はじめて赤経がaを超える行数（1始まり!!!）を返す
    st = int(FHelp[floor(a * 10)])
    go = int(FHelp[floor(a * 10) + 1]) - 1
    if float(linecache.getline('StarsNew-Tycho-to10.txt', go).split()[0]) < a:
        n = go + 1
    else:
        for n in range(st, go+1):
            if float(linecache.getline('StarsNew-Tycho-to10.txt', n).split()[0]) >= a:
                break

    return n

def search2(a): #はじめて赤経がaを超える行数（0始まり）を返す
    if float(F2[StarNum1_3-1].split()[0]) < a:
        n =  StarNum1_3
    else:
        for n in range(0, StarNum1_3):
            if float(F2[n].split()[0]) >= a:
                break
    return n
                
def searchW(a): #はじめて赤経がaを超える行数（0始まり）を返す
    if float(FFF[8873].split()[0]) < a:
        n = 8874
    else:
        for n in range(0, 8874):
            if float(FFF[n].split()[0]) >= a:
                break
    return n
    
def check(event):
    plt.close()
    ButtonText.set('エラー')

    def DrawStarsW(start, end, a):
        RAs = []
        Decs = []
        sizes = []
        for i in range(start, end):
            sd = list(map(float, FFF[i].split()))
            if sd[2] <= Max_mW and abs(sd[1] - piccenDec) <= rgW:
                RAs.append(sd[0] + a)
                Decs.append(sd[1])
                sizes.append(round((mag_0W - stepW*sd[2])**2))
        axW.scatter(RAs, Decs, c=starclr, s=sizes)

    def DrawStarsHIPforNarrow(start, end, a):
        RAs = []
        Decs = []
        sizes = []
        for i in range(start, end):
            sd = list(map(float, FFF[i].split()))
            if sd[2] <= Max_m and abs(sd[1] - piccenDec) <= rg:
                RAs.append(sd[0] + a)
                Decs.append(sd[1])
                sizes.append(round((mag_0 - step*sd[2])**2))
        ax.scatter(RAs, Decs, c=starclr, s=sizes)
    
    def DrawStars(start, end, a):
        RAs = []
        Decs = []
        sizes = []
        for i in range(start, end):
            [RA, Dec, mag] = list(map(float, linecache.getline('StarsNew-Tycho-to10.txt', i).split()))
            if mag <= Max_m and abs(Dec - piccenDec) <= rg:
                RAs.append(RA + a)
                Decs.append(Dec)
                sizes.append(round((mag_0 - step*mag)**2))
        ax.scatter(RAs, Decs, c=starclr, s=sizes)

    def DrawStars2(start, end, a):
        RAs = []
        Decs = []
        sizes = []
        for i in range(start, end):
            sd = list(map(float, F2[i].split()))
            if sd[2] <= Max_m and abs(sd[1] - piccenDec) <= rg:
                RAs.append(sd[0] + a)
                Decs.append(sd[1])
                sizes.append(round((mag_0 - step*sd[2])**2))
        ax.scatter(RAs, Decs, c=starclr, s=sizes)

    def RAadjust(RA, piccenRA):
        return piccenRA + (RA - piccenRA + 180) % 360 - 180

    def calc(planet, JD, X, Y, Z):
        e = planet[2]
        if e <= 0.99:                                   #0<=e<=0.99 --> Ellipse
            return cal_Ellipse(planet, JD, X, Y, Z)
        elif e <= 1.01:                                 #0.99<e<=1.01 --> Parabola
            return cal_Parabola(planet, JD, X, Y, Z)
        else:                                           #e>1.01 --> Hyperbola
            return  cal_Hyperbola(planet, JD, X, Y, Z)

    #時刻
    strYear = YearBox.get()
    strMonth = MonthBox.get()
    strDay = DayBox.get()
    strHour = HourBox.get()
    
    Year = int(strYear)
    Month = int(strMonth)
    Day = int(strDay)
    Hour = float(strHour)

    if Month <= 2:
        Month += 12
        Year -= 1

    JD = floor(365.25*Year) + floor(Year/400) - floor(Year/100) + floor(30.59*(Month-2)) + Day + Hour/24 + 1721088.5 + 0.0008 - 0.375
    time_str = strYear + '年 ' + strMonth + '月 ' + strDay + '日 ' + strHour + '時 (日本標準時）'

    #地表ならその位置と恒星時
    lat_obs = 0 #VAl2.get()がFalseのとき用
    theta = 0
    if Val2.get():
        lat_obs = float(lat_Box.get()) * pi/180
        lon_obs = float(lon_Box.get()) * pi/180
        if lat_combo.get() == '南緯':
            lat_obs *= -1
        if lat_combo.get() == '西経':    
            lon_obs *= -1
        t = (JD - 2451545.0) / 36525
        theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs #rad

    #いろんな天体の位置
    Xlist = []
    Ylist = []
    Zlist = []
    RAlist = []
    Declist = []
    Distlist = []
    Vlist = [0] * 20

    X, Y, Z, alpha, delta, dist = cal_Ellipse(Earth, JD, 0, 0, 0)
    RA_Sun = (alpha + 180) % 360
    Dec_Sun = - delta
    Xlist.append(X)
    Ylist.append(Y)
    Zlist.append(Z)
    RAlist.append(RA_Sun)
    Declist.append(Dec_Sun)
    Distlist.append(dist)
    
    for planet in planets:
        if planet == Sun:
            pass
        elif planet == Moon:
            RA_Moon, Dec_Moon, dist_Moon, Ms, ws, lon, lat = calculate_Moon(JD, lat_obs, theta)
            Xlist.append(0)
            Ylist.append(0)
            Zlist.append(0)
            RAlist.append(RA_Moon)
            Declist.append(Dec_Moon)
            Distlist.append(dist_Moon)
        else:
            x, y, z, alpha, delta, dist = calc(planet, JD, X, Y, Z)
            Xlist.append(x)
            Ylist.append(y)
            Zlist.append(z)
            RAlist.append(alpha)
            Declist.append(delta)
            Distlist.append(dist)

    #選ばれた天体について
    Name = combobox.get()
    Selected_number = JPNplanets.index(Name)
    alpha_center = RAlist[Selected_number]
    delta_center = Declist[Selected_number]
    dist_center = Distlist[Selected_number]

    piccenRA = (alpha_center + float(shift_RA_Box.get())) % 360
    piccenDec = delta_center + float(shift_Dec_Box.get())

    #赤道座標系、黄道座標系、距離
    if EqEcCombo.get() == '赤道座標系':
        alpha_h = floor(alpha_center / 15)
        alpha_m = round((alpha_center - 15 * alpha_h) * 4, 1)
        alpha_str = '赤経  ' + str(alpha_h) + 'h ' + str('{:.1f}'.format(alpha_m)) + 'm\n'

        delta_d = int(delta_center)
        delta_m = round(abs(delta_center - delta_d) * 60)
        if delta_center >= 0:
            delta_str = '赤緯  ' + '+' + str(delta_d) + '°' + str('{:.1f}'.format(delta_m)) + "'\n"
        else:
            delta_str = '赤緯  ' + '-' + str(abs(delta_d)) + '°' + str('{:.1f}'.format(delta_m)) + "'\n"
    else:
        EcLon, EcLat = Eq_Ec(alpha_center, delta_center)
        alpha_str = '黄経  ' + str('{:.1f}'.format(round(EcLon))) + '°\n'
        if EcLat > 0:
            delta_str = '黄緯  ' + '+' + str('{:.1f}'.format(round(EcLat, 2))) + "°\n"
        else:
            delta_str = '黄緯  ' + str('{:.1f}'.format(round(EcLat, 2))) + "°\n"

    if Name == '月':
        dist_str = '地心距離  ' + str(round(dist_center, -3)/10000) + '万km'
    else:
        dist_str = '地心距離  ' + str('{:.2f}'.format(round(dist_center, 2))) + 'au'

    Astr = ''
    hstr = ''
    if Val2.get():
        Dec_rad = delta_center * pi/180
        RA_rad = alpha_center * pi/180
        A = (atan2(-cos(Dec_rad) * sin(theta - RA_rad), sin(Dec_rad) * cos(lat_obs) - cos(Dec_rad) * sin(lat_obs) * cos(theta - RA_rad)) * 180/pi) % 360
        direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北']
        direc = direcs[floor((A + 11.25) / 22.5)]
        h = asin(sin(Dec_rad) * sin(lat_obs) + cos(Dec_rad) * cos(lat_obs) * cos(theta - RA_rad)) * 180/pi
        Astr = '\n\n方位角  ' + str('{:.1f}'.format(round(A, 1))) + '°(' + direc + ')\n'
        hstr = '高度  ' + str('{:.1f}'.format(round(h, 1))) + '°\n\n'

    #星座判定
    boundary = open('boundary_light.txt')
    ConstListFile = open('ConstellationList.txt', encoding='UTF-8')
    ConstList = ConstListFile.readlines()
    A = [0] * 89
    #B = [84, 15, 13, 0, 61, 66, 16, 70, 63, 82, 57] #0hにまたがる星座の番号-1

    for line in boundary.readlines():
        data = line.split()
        Dec1 = float(data[2])
        Dec2 = float(data[4])

        #地軸に垂直な平面で切ってかつらむきみたいにする
        #その横長の帯の中で赤緯線が星座の境界線を何回横切るのか
    
        if Dec1 <= delta_center < Dec2 or Dec2 <= delta_center < Dec1:
            RA1 = float(data[1])
            RA2 = float(data[3])
            if alpha_center >= (RA2 - RA1) / (Dec2 - Dec1) * (delta_center - Dec1) + RA1:
                No = int(data[0])
                A[No-1] = (A[No-1] + 1) % 2
            
    for i in range(0, 89):
        if A[i] == 1:
            Const = ConstList[i].strip()
            
    boundary.close()
    ConstListFile.close()

    #ダークモード
    if darkmode.get() == '白地に黒の星':
        backclr = 'white'
        starclr = 'black'
        textclr = 'blue'
        consttextclr = 'black'
        frameclr = 'black' #axWの真ん中の小さい四角
        screenblack = 0
    else:
        backclr = '#000033'
        starclr = 'white'
        textclr = 'yellow'
        consttextclr = 'white'
        frameclr = 'white'
        screenblack = 1

    if screenblack == 0:
        fig = plt.figure('結果', figsize=(13, 6))
    else:
        fig = plt.figure('結果', figsize=(13, 6), facecolor="black")
    fig.subplots_adjust(left=0.07, right=0.75)

    #広い方
    axW = fig.add_subplot(121, aspect=1)
    
    axW.set_xlim(piccenRA+rgW, piccenRA-rgW)
    ticksW = np.arange(10*floor((piccenRA+rgW)/10), piccenRA-rgW, -10, dtype=int)
    axW.set_xticks(ticksW)
    tickstrW = []
    for i in range(len(ticksW)):
        tickstrW.append(str(ticksW[i]))
        tick = ticksW[i]
        if tick >= 360:
            tickstrW[i] = str(int(tick - 360))
        if tick < 0:
            tickstrW[i] = str(int(tick + 360))
    axW.set_xticklabels(tickstrW)
    
    axW.set_ylim(piccenDec-rgW, piccenDec+rgW)
    
    axW.set_facecolor(backclr)
    if screenblack == 1:
        axW.tick_params(axis='x', colors='white')
        axW.tick_params(axis='y', colors='white')
        axW.spines['bottom'].set_color('white')
        axW.spines['top'].set_color('white')
        axW.spines['left'].set_color('white')
        axW.spines['right'].set_color('white')

    #星座線
    LineFile = open('Lines_light.txt')
    LineList = LineFile.readlines()
    
    for line in LineList:
        data = line.split()
        RA1 = float(data[1])
        Dec1 = float(data[2])
        RA2 = float(data[3])
        Dec2 = float(data[4])
        if piccenRA - rgW < 0:
            if min(RA1, RA2) < piccenRA + rgW and max(RA1, RA2) > piccenRA - rgW:
                if min(Dec1, Dec2) < piccenDec + rgW and max(Dec1, Dec2) > piccenDec - rgW:
                    axW.plot([RA1, RA2], [Dec1, Dec2], c='red', lw=1, zorder=0)
            if min(RA1, RA2) - 360 < piccenRA + rgW and max(RA1, RA2) - 360 > piccenRA - rgW:
                if min(Dec1, Dec2) < piccenDec + rgW and max(Dec1, Dec2) > piccenDec - rgW:
                    axW.plot([RA1-360, RA2-360], [Dec1, Dec2], c='red', lw=1, zorder=0)

        if piccenRA + rgW > 360:
            if min(RA1, RA2) < piccenRA + rgW and max(RA1, RA2) > piccenRA - rgW:
                if min(Dec1, Dec2) < piccenDec + rgW and max(Dec1, Dec2) > piccenDec - rgW:
                    axW.plot([RA1, RA2], [Dec1, Dec2], c='red', lw=1, zorder=0)
            if min(RA1, RA2) + 360 < piccenRA + rgW and max(RA1, RA2) + 360 > piccenRA - rgW:
                if min(Dec1, Dec2) < piccenDec + rgW and max(Dec1, Dec2) > piccenDec - rgW:
                    axW.plot([RA1+360, RA2+360], [Dec1, Dec2], c='red', lw=1, zorder=0)

        else:
            if min(RA1, RA2) < piccenRA + rgW and max(RA1, RA2) > piccenRA - rgW:
                if min(Dec1, Dec2) < piccenDec + rgW and max(Dec1, Dec2) > piccenDec - rgW:
                    axW.plot([RA1, RA2], [Dec1, Dec2], c='red', lw=1, zorder=0)

    LineFile.close()

    #星座名（星図）
    ConstPos = open('ConstellationPositionNew.txt')
    i = 0
    for line in ConstPos.readlines():
        data = line.split()
        RA = float(data[0])
        Dec = float(data[1])
        if abs(Dec - piccenDec) < rgW and abs(RAadjust(RA, piccenRA) - piccenRA) < rgW:
            ConstName = ConstList[i].strip()
            axW.text(RAadjust(RA, piccenRA), Dec, ConstName, size=10, c=consttextclr, ha="center", va="center", fontname='MS Gothic')
        i += 1
    ConstPos.close()

    #恒星
    if piccenRA - rgW < 0:
        DrawStarsW(0, searchW(piccenRA + rgW), 0)
        DrawStarsW(searchW(piccenRA - rgW + 360), 8874, -360)
        
    elif piccenRA + rgW >= 360:
        DrawStarsW(searchW(piccenRA - rgW), 8874, 0)
        DrawStarsW(0, searchW(piccenRA + rgW - 360), 360)
                    
    else:
        DrawStarsW(searchW(piccenRA - rgW), searchW(piccenRA + rgW), 0)

    #枠内なら明るさを計算して表示
    Vtext = ''
    for n in range(len(planets)):
        if abs(RAadjust(RAlist[n], piccenRA) -   piccenRA) <= rgW  and abs(Declist[n] - piccenDec) <= rgW:
            x = Xlist[n]
            y = Ylist[n]
            z = Zlist[n]
            dist = Distlist[n]
            if n == 0: #Sun
                Vlist[0] = -26.7
                if Selected_number == 0:
                    Vtext = '\n\n-26.7 等'
            elif n == 1: #Marcury
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                V = -0.613 + 0.06328*i - 0.0016336 * i**2 + 0.000033644 * i**3 - 3.4565*10**(-7) * i**4 +1.6893*10**(-9) * i**5 - 3.0334*10**(-12) * i**6+ 5 * log10(dist * sqrt(PS_2))
                Vlist[1] = V
                if Selected_number == 1:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
            elif n == 2: #Venus
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                if i <= 163.7:
                    V = -4.384 - 0.001044 * i + 0.0003687 * i**2 - 2.814*10**(-6) * i**3 + 8.938*10**(-9) * i**4 + 5 * log10(dist * sqrt(PS_2))
                else:
                    V = -4.384 + 240.44228 - 2.81914 * i + 0.00839034 * i**2 + 5 * log10(dist * sqrt(PS_2))
                if Selected_number == 2:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
                Vlist[2] = V
            elif n == 3: #Mars
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                if i <= 50:
                    V = -1.601 + 0.002267 * i - 0.0001302 * i**2 + 5 * log10(dist * sqrt(PS_2))
                elif 50 < i <= 120:
                    V = -1.601 + 1.234 - 0.02573 * i + 0.0003445 * i**2 + 5 * log10(dist * sqrt(PS_2))
                else:
                    V = 1
                if Selected_number == 3:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
                Vlist[3] = V
            elif n == 4: #Jupiter
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                if i <= 12:
                    V = -9.395 - 0.00037 * i + 0.000616 * i**2 + 5 * log10(dist * sqrt(PS_2))
                else:
                    V = -9.395 - 0.033 - 2.5*log10(1 - 1.507*(i/180) - 0.363*(i/180)**2 - 0.062*(i/180)**3 + 2.809*(i/180)**4 - 1.876*(i/180)**5) + 5 * log10(dist * sqrt(PS_2))
                if Selected_number == 4:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
                Vlist[4] = V
            elif n == 5: #Saturn
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                if i <= 6.5:
                    V = -8.914 + 1.825*sin(15*pi/180) + 0.026 * i - 0.378*sin(15*pi/180) + exp(-2.25*i) + 5 * log10(dist * sqrt(PS_2)) #勝手にリングの傾きβ=15°とした
                elif 6 < i < 150:
                    V = -8.914 + 0.026 + 0.0002446 * i + 0.0002672 * i**2 - 1.505*10**(-6) * i**3 + 4.767*10**(-9) * i**4 + 5 * log10(dist * sqrt(PS_2))
                else:
                    V = 0.6
                if Selected_number == 5:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
                Vlist[5] = V
            elif n == 6: #Uranus
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                if i < 3.1:
                    V = -7.110 + 0.00009617 * i**2 + 0.0001045 * i**2+ 5 * log10(dist * sqrt(PS_2))
                else:
                    V = 5.6
                if Selected_number == 6:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
                Vlist[6] = V
            elif n == 7: #Neptune
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                i = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2))) * 180/ pi
                if i < 133:
                    V = -7.00 + 0.007944 * i**3 + 0.00009617 * i**2+ 5 * log10(dist * sqrt(PS_2))
                else:
                    V = 7.8
                if Selected_number == 7:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
                Vlist[7] = V
            elif len(planets[n]) == 14 and planets[n][13] != 100.0: #ちゃんとしたH,GがPlanetに入っているとき
                planet = planets[n]
                H = planet[12]
                G = planet[13]
                PS_2 = x**2 + y**2 + z**2
                ES_2 = X**2 + Y**2 + Z**2
                a = acos((PS_2 + dist**2 - ES_2) / (2 * dist * sqrt(PS_2)))
                phi1 = exp(-3.33 * (tan(a/2))**0.63)
                phi2 = exp(-1.87 * (tan(a/2))**1.22)
                V = H - 2.5 * log10((1-G) * phi1 + G * phi2) + 5 * log10(dist * sqrt(PS_2))
                Vlist[n] = V
                if Selected_number == n:
                    Vtext = '\n\n' + str(round(V,1)) + ' 等'
            else:
                Vlist[n] = 10 #n=8（月）を含む
            
            if n == 0:
                axW.scatter(RAadjust(RA_Sun, piccenRA), Dec_Sun, c='yellow', s=160)
                axW.text(RAadjust(RA_Sun-1, piccenRA), Dec_Sun+1, '太陽', c=textclr, fontname='MS Gothic')
                
            elif n == 8:
                rs = RA_Sun * pi/180
                ds = Dec_Sun * pi/180
                rm = RA_Moon * pi/180
                dm = Dec_Moon * pi/180
                lons = Ms + 0.017 * sin(Ms + 0.017 * sin(Ms)) + ws #- 0.0002437 * (JD - 2451545.0) / 365.25
                k = (1 - cos(lons - lon) * cos(lat)) / 2
                P = 180 - atan2(cos(ds) * sin(rm - rs), -sin(dm) * cos(ds) * cos(rm - rs) + cos(dm) * sin(ds)) * 180/pi
                cirW = patches.Circle((RAadjust(RA_Moon, piccenRA), Dec_Moon), 1.5, fc='#ffff33')
                axW.add_patch(cirW)
                if k < 0.5:
                    eliW = patches.Ellipse((RAadjust(RA_Moon, piccenRA), Dec_Moon), 3, 3*(1-2*k), angle=-P, fc='0.3')
                    axW.add_patch(eliW)
                    halfW = patches.Wedge((RAadjust(RA_Moon, piccenRA), Dec_Moon), 1.5, theta1=-P, theta2=-P+180, fc='0.3')
                    axW.add_patch(halfW)
                else:
                    halfW = patches.Wedge((RAadjust(RA_Moon, piccenRA), Dec_Moon), 1.5, theta1=-P, theta2=-P+180, fc='0.3')
                    axW.add_patch(halfW)
                    eliW = patches.Ellipse((RAadjust(RA_Moon, piccenRA), Dec_Moon), 3, 3*(1-2*k), angle=-P, fc='#ffff33')
                    axW.add_patch(eliW)
                axW.text(RAadjust(RA_Moon-1, piccenRA), Dec_Moon+1, '月', c=textclr, fontname='MS Gothic')
                
            else:
                if mag_0W - stepW * Vlist[n] < 1:   #サイズ
                    size = 1
                else:
                    size = round((mag_0W - stepW*Vlist[n])**2)

                axW.scatter(RAadjust(RAlist[n], piccenRA), Declist[n], c='red', s=size) #天体をプロット
                axW.text(RAadjust(RAlist[n], piccenRA), Declist[n], JPNplanets[n], c=textclr, fontname='MS Gothic')

    if Val3.get() and Selected_number != 0 and Selected_number != 8:
        planet = planets[Selected_number]
        RAs = []
        Decs = []
        for iv in np.arange(float(moveW_on_Box1.get()), float(moveW_on_Box2.get())+0.001, float(moveW_on_Box1.get())):
            X, Y, Z, a, b, c = cal_Ellipse(Earth, JD+iv, 0, 0, 0)
            x, y, z, RA, Dec, dist = calc(planet, JD+iv, X, Y, Z)
            RAs.append(RAadjust(RA, piccenRA))
            Decs.append(Dec)
            
            X, Y, Z, a, b, c = cal_Ellipse(Earth, JD-iv, 0, 0, 0)
            x, y, z, RA, Dec, dist = calc(planet, JD-iv, X, Y, Z)
            RAs.append(RAadjust(RA, piccenRA))
            Decs.append(Dec)
            
        axW.scatter(RAs, Decs, c='#00FF00', s=1)

    #狭い方の枠
    axW.plot([piccenRA + rg, piccenRA + rg], [piccenDec + rg, piccenDec - rg], c=frameclr, lw=1)
    axW.plot([piccenRA + rg, piccenRA - rg], [piccenDec - rg, piccenDec - rg], c=frameclr, lw=1)
    axW.plot([piccenRA - rg, piccenRA - rg], [piccenDec - rg, piccenDec + rg], c=frameclr, lw=1)
    axW.plot([piccenRA - rg, piccenRA + rg], [piccenDec + rg, piccenDec + rg], c=frameclr, lw=1)

    #狭い方
    ax = fig.add_subplot(122, aspect=1)
    
    ax.set_xlim(piccenRA+rg, piccenRA-rg)
    ticks = np.arange(floor(piccenRA+rg), piccenRA-rg, -1, dtype=int)
    ax.set_xticks(ticks)
    tickstr = []
    for i in range(len(ticks)):
        tickstr.append(str(ticks[i]))
        tick = ticks[i]
        if tick >= 360:
            tickstr[i] = str(int(tick - 360))
        if tick < 0:
            tickstr[i] = str(int(tick + 360))
    ax.set_xticklabels(tickstr)

    ax.set_ylim(piccenDec-rg, piccenDec+rg)
    
    ax.set_facecolor(backclr)
    if screenblack == 1:
        ax.tick_params(axis='x', colors='white')
        ax.tick_params(axis='y', colors='white')
        ax.spines['bottom'].set_color('white')
        ax.spines['top'].set_color('white')
        ax.spines['left'].set_color('white')
        ax.spines['right'].set_color('white')
    
    Max_m = float(MaxM_Box.get())

    if piccenRA - rg < 0:   #恒星
        DrawStarsHIPforNarrow(0, searchW(piccenRA + rg), 0)
        DrawStarsHIPforNarrow(searchW(piccenRA - rg + 360), 8874, -360)
        
        DrawStars(1, search(piccenRA + rg), 0)
        DrawStars(search(piccenRA - rg + 360), 326882, -360)
        
        DrawStars2(0, search2(piccenRA + rg), 0)
        DrawStars2(search2(piccenRA - rg + 360), StarNum1_3, -360)

        
    elif piccenRA + rg >= 360:
        DrawStarsHIPforNarrow(searchW(piccenRA - rg), 8874, 0)
        DrawStarsHIPforNarrow(0, searchW(piccenRA - rg + 360), 360)
        
        DrawStars(search(piccenRA - rg), 326882, 0)
        DrawStars(1, search(piccenRA + rg - 360), 360)
        
        DrawStars2(search2(piccenRA - rg), StarNum1_3, 0)
        DrawStars2(0, search2(piccenRA + rg - 360), 360)
                    
    else:
        DrawStarsHIPforNarrow(searchW(piccenRA - rg), searchW(piccenRA + rg), 0)
        DrawStars(search(piccenRA - rg), search(piccenRA + rg), 0)
        DrawStars2(search2(piccenRA - rg), search2(piccenRA + rg), 0)
            
    for n in range(len(planets)):
        if n == 0:
            if abs(RAadjust(RA_Sun, piccenRA) -   piccenRA) <= rgW  and abs(Dec_Sun - piccenDec) <= rgW:
                R = 0.267 / Distlist[0]
                SUNcir = patches.Circle((RAadjust(RA_Sun, piccenRA), Dec_Sun), R, fc='yellow')
                ax.add_patch(SUNcir)
                ax.text(RAadjust(RA_Sun-0.2, piccenRA), Dec_Sun+0.2, '太陽', c=textclr, fontname='MS Gothic')
        elif n == 8:
            if abs(RAadjust(RA_Moon, piccenRA) -   piccenRA) <= rgW  and abs(Dec_Moon - piccenDec) <= rgW:
                r = 0.259 / (dist_Moon / 384400)
                cir = patches.Circle((RAadjust(RA_Moon, piccenRA), Dec_Moon), r, fc='#ffff33')
                ax.add_patch(cir)
                if k < 0.5:
                    eli = patches.Ellipse((RAadjust(RA_Moon, piccenRA), Dec_Moon), 2*r, 2*r*(1-2*k), angle=-P, fc='0.3')
                    ax.add_patch(eli)
                    half = patches.Wedge((RAadjust(RA_Moon, piccenRA), Dec_Moon), r, theta1=-P, theta2=-P+180, fc='0.3')
                    ax.add_patch(half)
                else:
                    half = patches.Wedge((RAadjust(RA_Moon, piccenRA), Dec_Moon), r, theta1=-P, theta2=-P+180, fc='0.3')
                    ax.add_patch(half)
                    eli = patches.Ellipse((RAadjust(RA_Moon, piccenRA), Dec_Moon), 2*r, 2*r*(1-2*k), angle=-P, fc='#ffff33')
                    ax.add_patch(eli)
                ax.text(RAadjust(RA_Moon-0.2, piccenRA), Dec_Moon+0.2, '月', c=textclr, fontname='MS Gothic')
        else:
            if abs(RAadjust(RAlist[n], piccenRA) -   piccenRA) <= rgW  and abs(Declist[n] - piccenDec) <= rgW:
                if mag_0 - step*Vlist[n] < 1:   #サイズ
                    size = 1
                else:
                    size = round((mag_0 - step*Vlist[n])**2)
                ax.scatter(RAadjust(RAlist[n], piccenRA), Declist[n], c='red', s=size) #天体をプロット
                ax.text(RAadjust(RAlist[n], piccenRA), Declist[n], JPNplanets[n], c=textclr, fontname='MS Gothic')

    if Val3.get() and Selected_number != 0 and Selected_number != 8:
        planet = planets[Selected_number]
        RAs = []
        Decs = []
        for iv in np.arange(float(move_on_Box1.get()), float(move_on_Box2.get())+0.001, float(move_on_Box1.get())):
            X, Y, Z, a, b, c = cal_Ellipse(Earth, JD+iv, 0, 0, 0)
            x, y, z, RA, Dec, dist = calc(planet, JD+iv, X, Y, Z)
            RAs.append(RAadjust(RA, piccenRA))
            Decs.append(Dec)

            X, Y, Z, a, b, c = cal_Ellipse(Earth, JD-iv, 0, 0, 0)
            x, y, z, RA, Dec, dist = calc(planet, JD-iv, X, Y, Z)
            RAs.append(RAadjust(RA, piccenRA))
            Decs.append(Dec)
            
        ax.scatter(RAs, Decs, c='#00FF00', s=1)
                
    text = time_str + '\n\n' + Name + '\n\n' + alpha_str + delta_str + '    (J2000.0)\n\n' + dist_str + '\n\n' + Const + '座' + Vtext + Astr + hstr
    if screenblack == 0:
        fig.text(ax.get_position().x1 + 0.02, ax.get_position().y0 + 0.2, text, fontname='MS Gothic')
    else:
        fig.text(ax.get_position().x1 + 0.02, ax.get_position().y0 + 0.2, text, fontname='MS Gothic', color='white')

    ButtonText.set('表示')

    f2.close()
    fHelp.close()
    
    fig.show()

    if SaveOrNot.get():
        if Hour - floor(Hour) != 0:
            strHour = str(int(Hour)).zfill(2) + '_' + strHour.split('.')[1]
        filename = strYear.zfill(4) + strMonth.zfill(2) + strDay.zfill(2) + strHour + Name.replace(' ', '').replace('/', '') + ".png"
        fig.savefig(filename)
        
def addplanetsheet(event):
    def addplanet(event):
        Name = name_box.get()
        
        s_eles = []
        s_time = []
        
        for i in range(0, 6):
            try:
                float(boxes[i].get())
            except:
                mb.showerror('軌道要素には数字を入力してください')
                break
            s_eles.append(boxes[i].get())
            
        if boxes[6].get() != '':
            try:
                float(boxes[6].get())
            except:
                mb.showerror('H には数字を入力してください')
            s_eles.append(boxes[6].get())

            try:
                float(boxes[7].get())
            except:
                mb.showerror('G には数字を入力してください')
            s_eles.append(boxes[7].get())
        else:
            s_eles.append('0') #H
            s_eles.append('100') #G、ありえない値

        if TimeBoxes[0].get().isdecimal() == False: mb.showerror('', '年 は整数で指定してください')
        else: Year2 = int(TimeBoxes[0].get())

        if TimeBoxes[1].get().isdecimal() == False: mb.showerror('', '月 は1から12の整数で指定してください')
        elif int(TimeBoxes[1].get()) < 1 or int(TimeBoxes[1].get()) > 12: mb.showerror('', '月 は1から12の整数で指定してください')
        else: Month2 = int(TimeBoxes[1].get())

        if TimeBoxes[2].get().isdecimal() == False: mb.showerror('', '日 は0以上の整数で指定してください')
        else: Day2 = int(TimeBoxes[2].get())

        try:
            Hour2 = float(TimeBoxes[3].get())
        except:
            mb.showerror('', '時刻の設定が数値になっていません')

        if Month2 <= 2:
            Month2 += 12
            Year2 -= 1
        T = str(floor(365.25*Year2) + floor(Year2/400) - floor(Year2/100) + floor(30.59*(Month2-2)) + Day2 + Hour2/24 + 1721088.5)

        ff = open('ExtraPlanet.txt', 'w')
        ff.write(str(len(Name.split())) + ' ' + Name + ' ' + T + ' ' + s_eles[0] + ' ' + s_eles[1] + ' ' + s_eles[2] + ' ' + s_eles[3] + ' ' + s_eles[4] + ' ' + s_eles[5] + ' 0 0 0 0 0 ' + s_eles[6] + ' ' + s_eles[7] + ' ' + TimeBoxes[0].get() + ' ' + TimeBoxes[1].get() + ' ' + TimeBoxes[2].get() + ' ' + TimeBoxes[3].get())
        ff.close()

        New = [float(T), float(s_eles[0]), float(s_eles[1]), float(s_eles[2]), float(s_eles[3]), float(s_eles[4]), float(s_eles[5]), 0, 0, 0, 0, 0, float(s_eles[6]), float(s_eles[7])]
        comboText.set(Name)
        
        if len(JPNplanets) > OriginalNumOfPlanets:
            JPNplanets.pop(-1)
            planets.pop(-1)
        JPNplanets.append(Name)
        planets.append(New)

        combobox = ttk.Combobox(root, textvariable=comboText, values=JPNplanets, width=12)
        combobox.place(x=150, y=130)

        root2.destroy()
        
    def SBDBset(R):
        r = json.loads(R)
        
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
                    
        name_box.delete(0, tk.END)
        name_box.insert(tk.END, name)
        
        ele = r['orbit']['elements']
        e = round(float(ele[0]['value']), 5)

        for k in range(0, 8):
            boxes[k].delete(0, tk.END)

        if e <= 0.99:
            a = round(float(ele[1]['value']), 5)
            peri = round(float(ele[5]['value']), 6)
            i = round(float(ele[3]['value']), 6)
            node = round(float(ele[4]['value']), 6)
            M0 = round(float(ele[6]['value']), 6)
            
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
                    
                    for k in range(0, 8):
                        boxes[k].insert(tk.END, str(eles[k]))

                else:
                    eles = [a, e, peri, i, node, M0]
                    for k in range(0, 6):
                        boxes[k].insert(tk.END, str(eles[k]))
            
            else:
                eles = [a, e, peri, i, node, M0]
                for k in range(0, 6):
                    boxes[k].insert(tk.END, str(eles[k]))

        else:
            q = round(float(ele[2]['value']), 5)
            peri = round(float(ele[5]['value']), 6)
            i = round(float(ele[3]['value']), 6)
            node = round(float(ele[4]['value']), 6)

            eles = [q, e, peri, i, node, 0]

            for k in range(0, 6):
                boxes[k].insert(tk.END, str(eles[k]))

        epoch = float(r['orbit']['epoch'])
        if e > 0.99:
            epoch = round(float(ele[7]['value']), 6) # epoch --> tp（近日点通過）
        A = floor(epoch + 68569.5)
        B = floor(A / 36524.25)
        C = A - floor(36524.25 * B + 0.75)
        E = floor((C + 1) / 365.25025)
        F = C - floor(365.25 * E) + 31
        G = floor(F / 30.59)
        D = F - floor(30.59 * G)
        H = floor(G / 11)
        M = G - 12 * H + 2
        Y = 100 * (B -49) + E + H
        Hr = int((epoch + 0.5 - floor(epoch + 0.5)) * 24)
        if M == 12 and D == 32:
            Y += 1
            M = 1
            D = 1
        
        for i in range(0, 4):
            TimeBoxes[i].delete(0, tk.END)
            
        TimeBoxes[0].insert(tk.END, str(Y))
        TimeBoxes[1].insert(tk.END, str(M))
        TimeBoxes[2].insert(tk.END, str(D))
        TimeBoxes[3].insert(tk.END, str(Hr))
    
    def SBDB(event):
        try:
            URL = 'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + name_box.get() + '&full-prec=true&phys-par=true'
            R = requests.get(URL).text
            r = json.loads(R)
            if 'code' in r:
                if r['code'] == '300':
                    def MultiChoice(event):
                        choiceBtn = str(event.widget["text"])
                        
                        try:
                            pdes = choicePdeses[choiceNames.index(choiceBtn)]
                            URL = 'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + pdes + '&full-prec=true&phys-par=true'
                            R = requests.get(URL).text
                            SBDBset(R)
                            
                        except requests.ConnectionError:
                            mb.showerror('', 'インターネットに接続されていません')
                            
                        multi.destroy()
                        #MultiChoiceの定義おわり
                            
                    multi = tk.Tk()
                    
                    rown = 0
                    choiceBs = []
                    choiceNames = []
                    choicePdeses = []
                    for obj in range(len(r['list'])):
                        choiceNames.append(r['list'][obj]['name'])
                        choicePdeses.append(r['list'][obj]['pdes'])
                        
                        choiceBs.append(tk.Button(multi, text=choiceNames[obj], width=40))
                        choiceBs[obj].bind('<1>', MultiChoice)
                        choiceBs[obj].grid(row=rown, column=0)
                        rown += 1

                    multi.title('Matched ' + str(len(r['list'])) + ' records')
                    multi.mainloop()
                    
                elif r['code'] == '400':
                    mb.showerror('error', 'Bad Request')
                elif r['code'] == '405':
                    mb.showerror('error', 'Method Not Allowed')
                elif r['code'] == '500':
                    mb.showerror('error', 'Internal Server Error')
                elif r['code'] == '503':
                    mb.showerror('error', 'Service Unavailable')
                elif r['message'] == 'specified object was not found':
                    mb.showerror('Not found', 'Specified object was not found')
                else:
                    mb.showerror('info', 'Another error')
            else:
                SBDBset(R)
	            
        except requests.ConnectionError:
            mb.showerror('', 'インターネットに接続されていません')
    
    root2 = tk.Tk()
    root2.title('天体変更')
    root2.geometry('350x450')

    name_label = tk.Label(root2, text='名前', width=10)
    name_label.grid(row=0, column=0)
    name_box =tk.Entry(root2)
    name_box.grid(row=0, column=1)

    search_btn = tk.Button(root2, text='Search', width=8)
    search_btn.bind('<1>', SBDB)
    search_btn.grid(row=1, column=0, columnspan=2)

    LabelText = ['軌道長半径a (au)（またはq）', '離心率e', '近日点因数ω (°)', '軌道傾斜i (°)', '昇交点黄経Ω (°)', '元期平均近点離角M0 (°)', '標準等級H', 'G']
    labels = []
    boxes = []
    for i in range(0, 8):
        labels.append(tk.Label(root2, text=LabelText[i]))
        labels[i].grid(row=i+2, column=0)
        boxes.append(tk.Entry(root2, width=12))
        boxes[i].grid(row=i+2, column=1)
    

    Label_TT = tk.Label(root2, text='元期 (TT)')
    Label_TT.grid(row=10, column=0, columnspan=2)

    TimeText = ['年', '月', '日', '時']
    TimeLabels = []
    TimeBoxes = []
    for i in range(0, 4):
        TimeLabels.append(tk.Label(root2, text=TimeText[i]))
        TimeLabels[i].grid(row=i+11, column=0)
        TimeBoxes.append(tk.Entry(root2, width=12))
        TimeBoxes[i].grid(row=i+11, column=1)

    #すでにExtraPlanetに入っていたらそれを入れる        
    ff = open('ExtraPlanet.txt')
    data = ff.read().split()
    if data != []:
        namelen = int(data[0])
        name = data[1]
        for i in range(2, namelen+1):
            name += ' ' + data[i]
        name_box.insert(tk.END, name)
        
        for i in range(0, 6):
            boxes[i].insert(tk.END, data[i+namelen+2])

        if float(data[14+namelen]) != 100:
            boxes[6].insert(tk.END, data[13+namelen])
            boxes[7].insert(tk.END, data[14+namelen])
        
        for i in range(0, 4):
            TimeBoxes[i].insert(tk.END, data[i+namelen+15])
    
    button = tk.Button(root2, text='OK', width=8, height=3)
    button.bind('<1>', addplanet)
    button.grid(row=15, column=0, columnspan=2)

    root2.mainloop()
    root.mainloop()
    ff.close()
    
root = tk.Tk()
root.title('設定')
root.geometry("370x600")

#年月日
Label_TT = tk.Label(root, text = "時刻(日本標準時)")
Label_TT.place(x=100, y=10)

now = datetime.datetime.now()

YearBox = tk.Entry(root, width=10)
YearBox.insert(tk.END, str(now.year))
YearBox.place(x=100, y=40)
YearLabel = tk.Label(root, text="年", width=3)
YearLabel.place(x=160, y=40)

MonthBox = tk.Entry(root, width=10)
MonthBox.insert(tk.END, str(now.month))
MonthBox.place(x=100, y=60)
MonthLabel = tk.Label(root, text="月", width=3)
MonthLabel.place(x=160, y=60)

DayBox = tk.Entry(root, width=10)
DayBox.insert(tk.END, str(now.day))
DayBox.place(x=100, y=80)
DayLabel = tk.Label(root, text="日", width=3)
DayLabel.place(x=160, y=80)

HourBox = tk.Entry(root, width=10)
HourBox.insert(tk.END, str('{:.1f}'.format(round(now.hour + now.minute / 60, 1))))
HourBox.place(x=100, y=100)
HourLabel = tk.Label(root, text="時", width=3)
HourLabel.place(x=160, y=100)

def NowTime(event):
    now = datetime.datetime.now()
    
    YearBox.delete(0, tk.END)
    MonthBox.delete(0, tk.END)
    DayBox.delete(0, tk.END)
    HourBox.delete(0, tk.END)
    
    YearBox.insert(tk.END, str(now.year))
    MonthBox.insert(tk.END, str(now.month))
    DayBox.insert(tk.END, str(now.day))
    HourBox.insert(tk.END, str('{:.1f}'.format(round(now.hour + now.minute / 60, 1))))
    
NowButton = tk.Button(root, text=u'現在時刻')
NowButton.bind("<1>", NowTime)
NowButton.place(x=200, y=10)

PlanetLabel = tk.Label(root, text='天体')
PlanetLabel.place(x=80, y=130)
comboText = tk.StringVar()
comboText.set('月')
combobox = ttk.Combobox(root, textvariable=comboText, values=JPNplanets, width=12)
combobox.place(x=150, y=130)

MaxM_Label =  tk.Label(root, text='限界等級 (等)', width=15)
MaxM_Label.place(x=40, y=160)
MaxM_Box = tk.Entry(root, width=10)
MaxM_Box.insert(tk.END, '10')
MaxM_Box.place(x=150, y=160)

Obs_L = tk.Label(root, text='観測地点')
Obs_L.place(x=120, y=190)

Val1 = tk.BooleanVar()
Val2 = tk.BooleanVar()
Val1.set(True)
Val2.set(False)

def FalseVal1(event):
    Val1.set(False)
def FalseVal2(event):
    Val2.set(False)

Geo_Check = tk.Checkbutton(root, text='地心', variable=Val1, width=5)
Geo_Check.bind('<1>', FalseVal2)
Geo_Check.place(x=20, y=210)

sur_Check = tk.Checkbutton(root, text='地表', variable=Val2, width=5)
sur_Check.bind('<1>', FalseVal1)
sur_Check.place(x=20, y=230)

lat_L = tk.Label(root, text='緯度', width=5)
lat_L.place(x=90, y=230)
NorS = ['北緯', '南緯']
lat_combo = ttk.Combobox(root, textvariable=tk.StringVar(), values=NorS, width=5)
lat_combo.set('北緯')
lat_combo.place(x=140, y=230)
lat_Box = tk.Entry(root, width=7)
lat_Box.insert(tk.END, '40')
lat_Box.place(x=200, y=230)
lat_d = tk.Label(root, text='°', width=2)
lat_d.place(x=230, y=230)

lon_L = tk.Label(root, text='経度', width=5)
lon_L.place(x=90, y=250)
EorW = ['東経', '西経']
lon_combo = ttk.Combobox(root, textvariable=tk.StringVar(), values=EorW, width=5)
lon_combo.set('東経')
lon_combo.place(x=140, y=250)
lon_Box = tk.Entry(root, width=7)
lon_Box.insert(tk.END, '140')
lon_Box.place(x=200, y=250)
lon_d = tk.Label(root, text='°', width=2)
lon_d.place(x=230, y=250)

darkornot = ['黒地に白の星', '白地に黒の星']
darkmode = ttk.Combobox(root, textvariable=tk.StringVar(), values=darkornot, width=15)
darkmode.set('黒地に白の星')
darkmode.place(x=60, y=280)

EqEc = ['赤道座標系', '黄道座標系']
EqEcCombo = ttk.Combobox(root, textvariable=tk.StringVar(), values=EqEc, width=15)
EqEcCombo.set('赤道座標系')
EqEcCombo.place(x=200, y=280)

move_L = tk.Label(root, text='前後の移動', width=10)
move_L.place(x=100, y=310)

Val3 = tk.BooleanVar()
Val4 = tk.BooleanVar()
Val3.set(True)
Val4.set(False)

def FalseVal3(event):
    Val3.set(False)
def FalseVal4(event):
    Val4.set(False)

move_on = tk.Checkbutton(root, text='あり', variable=Val3, width=5)
move_on.bind('<1>', FalseVal4)
move_on.place(x=20, y=330)

moveW_on_L1 = tk.Label(root, text='広い方：')
moveW_on_L1.place(x=75, y=330)
moveW_on_Box1 = tk.Entry(root, width=4)
moveW_on_Box1.insert(tk.END, '10')
moveW_on_Box1.place(x=132, y=330)
moveW_on_L2 = tk.Label(root, text='日ごとに前後')
moveW_on_L2.place(x=155, y=330)
moveW_on_Box2 = tk.Entry(root, width=4)
moveW_on_Box2.insert(tk.END, '100')
moveW_on_Box2.place(x=230, y=330)
moveW_on_L3 = tk.Label(root, text='日間')
moveW_on_L3.place(x=260, y=330)

move_on_L1 = tk.Label(root, text='狭い方：')
move_on_L1.place(x=75, y=350)
move_on_Box1 = tk.Entry(root, width=4)
move_on_Box1.insert(tk.END, '1')
move_on_Box1.place(x=132, y=350)
move_on_L2 = tk.Label(root, text='日ごとに前後')
move_on_L2.place(x=155, y=350)
move_on_Box2 = tk.Entry(root, width=4)
move_on_Box2.insert(tk.END, '10')
move_on_Box2.place(x=230, y=350)
move_on_L3 = tk.Label(root, text='日間')
move_on_L3.place(x=260, y=350)

move_off = tk.Checkbutton(root, text='なし', variable=Val4, width=5)
move_off.bind('<1>', FalseVal3)
move_off.place(x=20, y=370)

shift_L = tk.Label(root, text='Shift')
shift_L.place(x=150, y=400)
shift_RA_L = tk.Label(root, text='赤経（度）')
shift_RA_L.place(x=20, y=420)
shift_RA_Box = tk.Entry(root, width=4)
shift_RA_Box.insert(tk.END, '0')
shift_RA_Box.place(x=100, y=420)
shift_Dec_L = tk.Label(root, text='赤緯（度）')
shift_Dec_L.place(x=160, y=420)
shift_Dec_Box = tk.Entry(root, width=4)
shift_Dec_Box.insert(tk.END, '0')
shift_Dec_Box.place(x=240, y=420)

SaveOrNot = tk.BooleanVar()
SaveOrNot.set(False)
SaveOrNotBox = tk.Checkbutton(root, text='画像を保存する', variable=SaveOrNot)
SaveOrNotBox.place(x=200, y=450)

###計算のボタン
ButtonText = tk.StringVar()
ButtonText.set('表示')
button1 = tk.Button(root, textvariable=ButtonText, width=20, height=5)
button1.bind("<1>", check)
button1.place(x=30, y=450)

button2 = tk.Button(root, text='天体を変更')
button2.bind('<1>', addplanetsheet)
button2.place(x=200, y=500)


def cal_Ellipse(planet, JD, X, Y, Z): #[T, a, e, ω, i, Ω, M0]
    T = planet[0]
    a = planet[1] + planet[7] * (JD - T) / 36525
    e = planet[2] + planet[8] * (JD - T) / 36525
    peri = (planet[3] + planet[9] * (JD - T) / 36525) * pi / 180 #ω
    i = (planet[4] + planet[10] * (JD - T) / 36525) * pi / 180
    node = (planet[5] + planet[11] * (JD - T) / 36525) * pi / 180 #Ω
    M0 = planet[6] * pi / 180

    Ax = a *                ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node))
    Bx = a * sqrt(1-e**2) * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node))
    Ay = a *                ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine)
    By = a * sqrt(1-e**2) * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine)
    Az = a *                ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose)
    Bz = a * sqrt(1-e**2) * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose)
    
    n = 0.01720209895 / a**1.5 #平均日日運動(rad)
    M = (M0 + n * (JD - T)) % (2 * pi)
    E = M + e * sin(M)
    if abs(E - M) > 0.000001:
        newE = M + e * sin(E)
        while abs(newE - E) > 0.000001:
            E = newE
            newE = M + e * sin(E)
        E = newE
    
    cE_e = cos(E) - e
    sE = sin(E)
    
    x = Ax * cE_e + Bx * sE
    y = Ay * cE_e + By * sE
    z = Az * cE_e + Bz * sE
    
    alpha = (atan2(y-Y, x-X) * 180/pi) % 360 #deg
    delta = atan((z-Z) / sqrt((x-X)**2 + (y-Y)**2)) * 180/pi#deg

    dist = sqrt((x-X)**2 + (y-Y)**2 + (z-Z)**2)

    return x, y, z, alpha, delta, dist

def cal_Parabola(planet, JD, X, Y, Z): #[tp, q, e, ω, i, Ω, M0=0]
    tp   = planet[0]
    q    = planet[1]
    peri = planet[3] * pi/180 #ω
    i    = planet[4] * pi/180
    node = planet[5] * pi/180 #Ω
    
    Ax =     q * ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node))
    Bx = 2 * q * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node))
    Ay =     q * ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine)
    By = 2 * q * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine)
    Az =     q * ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose)
    Bz = 2 * q * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose)

    b = atan(54.80779386 * q**1.5 / (JD - tp))
    if tan(b / 2) >= 0:
        g = atan(tan(b / 2) ** (1/3))
    else:
        g = -atan((-tan(b / 2)) ** (1/3))
    tanv2 = 2 / tan(2 * g)

    x = Ax * (1 - tanv2**2) + Bx * tanv2
    y = Ay * (1 - tanv2**2) + By * tanv2
    z = Az * (1 - tanv2**2) + Bz * tanv2
    
    alpha = (atan2(y-Y, x-X) * 180/pi) % 360 #deg
    delta = atan((z-Z) / sqrt((x-X)**2 + (y-Y)**2)) * 180/pi#deg

    dist = sqrt((x-X)**2 + (y-Y)**2 + (z-Z)**2)

    return x, y, z, alpha, delta, dist

def cal_Hyperbola(planet, JD, X, Y, Z): #[tp, q, e, ω, i, Ω, M0=0]
    tp   = planet[0]
    q    = planet[1]
    e    = planet[2]
    peri = planet[3] * pi/180 #ω
    i    = planet[4] * pi/180
    node = planet[5] * pi/180 #Ω

    a = q / (1 - e)
    
    Ax = -a/2 * ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node))
    Bx = -a/2 * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node))
    Ay = -a/2 * ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine)
    By = -a/2 * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine)
    Az = -a/2 * ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose)
    Bz = -a/2 * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose)

    mut_tp = 0.01720209895 / (-a)**1.5 * abs(JD - tp)
    
    def f(s):
        return e * (s - 1/s) / 2 - log(s) - mut_tp
    def fp(s): #f_prime
        return e * (1 + 1/s**2) / 2 - 1/s
    
    s = (f(11) - 11 * f(1)) / (f(11) - f(1))
    snew = s - f(s) / fp(s)
    while abs(snew - s) > 0.01:
        s = snew
        snew = s - f(s) / fp(s)
        
    if JD < tp:
        s = 1 / snew
    else:
        s = snew

    x = Ax * (2*e - s - 1/s) + Bx * sqrt(e**2 - 1) * (s - 1/s)
    y = Ay * (2*e - s - 1/s) + By * sqrt(e**2 - 1) * (s - 1/s)
    z = Az * (2*e - s - 1/s) + Bz * sqrt(e**2 - 1) * (s - 1/s)
    
    alpha = (atan2(y-Y, x-X) * 180/pi) % 360 #deg
    delta = atan((z-Z) / sqrt((x-X)**2 + (y-Y)**2)) * 180/pi#deg

    dist = sqrt((x-X)**2 + (y-Y)**2 + (z-Z)**2)
    
    return x, y, z, alpha, delta, dist

def calculate_Moon(JD, lat_obs, theta):
    d = JD - 2451543.5
    Ms = (356.0470 + 0.9856002585 * d) % 360 * pi/180
    Mm = (115.3654 + 13.0649929509 * d) % 360 * pi/180
    Nm = (125.1228 - 0.0529538083 * d) % 360 * pi/180
    ws = (282.9404 + 0.0000470935 * d) * pi/180
    wm = (318.0634 + 0.1643573223 * d) % 360 * pi/180
    e = 0.054900
    a = 60.2666
    i = 5.1454 * pi/180
    D = Mm + wm + Nm - Ms - ws
    F = Mm + wm
    
    E = Mm + e * sin(Mm)
    if abs(E - Mm) > 0.000001:
        newE = Mm + e * sin(E)
        while abs(newE - E) > 0.000001:
            E = newE
            newE = Mm + e * sin(E)
        E = newE
    
    xv = a * (cos(E) - e)
    yv = a * sqrt(1 - e**2) * sin(E)

    v = atan2(yv, xv)
    dist = sqrt(xv**2 + yv**2)
    
    xh = dist * (cos(Nm) * cos(v+wm) - sin(Nm) * sin(v+wm) * cos(i))
    yh = dist * (sin(Nm) * cos(v+wm) + cos(Nm) * sin(v+wm) * cos(i))
    zh = dist * sin(v+wm) * sin(i)
    
    lon = atan2(yh, xh)
    lat = atan2(zh, sqrt(xh**2 + yh**2))
    
    lon +=(- 1.274*sin(Mm - 2*D)
           + 0.658*sin(2*D)
           - 0.186*sin(Ms)
           - 0.059*sin(2*Mm - 2*D)
           - 0.057*sin(Mm - 2*D + Ms)
           + 0.053*sin(Mm + 2*D)
           + 0.046*sin(2*D - Ms)
           + 0.041*sin(Mm - Ms)
           - 0.035*sin(D)
           - 0.031*sin(Mm + Ms)
           - 0.015*sin(2*F - 2*D)
           + 0.011*sin(Mm - 4*D))* pi/180 #rad
    lat += (- 0.173*sin(F - 2*D)
            - 0.055*sin(Mm - F - 2*D)
            - 0.046*sin(Mm + F - 2*D)
            + 0.033*sin(F + 2*D)
            + 0.017*sin(2*Mm + F)) * pi/180 #rad
    dist += -0.58*cos(Mm - 2*D) - 0.46*cos(2*D)

    lon -= 0.0002437 * (JD - 2451545.0) / 365.25 #lon, latはJ2000.0
    
    xe = cos(lat) * cos(lon)
    ye = -sin(lat) * sine + cos(lat) * sin(lon) * cose
    ze = sin(lat) * cose + cos(lat) * sin(lon) * sine

    if Val2.get():
        xe -= cos(lat_obs) * cos(theta) / dist
        ye -= cos(lat_obs) * sin(theta) / dist
        ze -= sin(lat_obs) / dist
        
    alpha = (atan2(ye, xe) * 180/pi) % 360 #deg
    delta = atan2(ze, sqrt(xe**2 + ye**2)) * 180/pi #deg
    dist = dist * 6378.14

    return alpha, delta, dist, Ms, ws, lon, lat #deg, deg, km, rad瞬時, rad瞬時, radJ2000.0, radJ2000.0

root.mainloop()
