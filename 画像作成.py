import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
import tkinter as tk
import tkinter.ttk as ttk
import math
from math import floor, sin, cos, tan, atan, pi, log10
from PIL import ImageTk

starsfile = open("StarsNewHIP_to6_5.txt")
stars = starsfile.readlines()
linesfile = open("Lines_light.txt")
lines = linesfile.readlines()
constsfile = open("ConstellationListENG.txt", encoding='UTF-8')
consts = constsfile.readlines()
conposfile = open("ConstellationPositionNew.txt")
conpos = conposfile.readlines()
boundsfile = open("boundary_light.txt")
bounds = boundsfile.readlines()

def SeikyoHoui(RA, Dec, Q): #deg
    RA *= pi/180
    Dec *= pi/180
    
    cen = list(map(float, conpos[Q-1].split()))
    RAcen = cen[0] * pi/180
    Deccen = cen[1] * pi/180
    
    a = sin(Deccen)*cos(Dec)*cos(RA-RAcen) - cos(Deccen)*sin(Dec)
    b =             cos(Dec)*sin(RA-RAcen)
    c = cos(Deccen)*cos(Dec)*cos(RA-RAcen) + sin(Deccen)*sin(Dec)
    
    Dec_prime = atan(c / (a**2 + b**2)**0.5) #rad
    x = (Dec_prime * 180/pi - 90) * b / cos(Dec_prime)
    y = (Dec_prime * 180/pi - 90) * a / cos(Dec_prime)
    return x, y

def show(Q, LineUmu):
    fig = plt.figure(figsize=(5, 5))
    ax = fig.add_subplot(aspect=1)
    fig.subplots_adjust(wspace=0, hspace=0)

    ax.axes.xaxis.set_visible(False)
    ax.axes.yaxis.set_visible(False)

    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)

    ax.tick_params('x', length=0, which='major')
    ax.tick_params('y', length=0, which='major')

    if Q in [58, 85]: #はちぶんぎ、こぐま
        Rm = 0
        RM = 360
        Dm = 90
        DM = -90
        for bound in bounds:
            b = list(map(float, bound.split()))
            if b[0] == Q:
                DM = max(DM, max(float(b[2]), float(b[4])))
                Dm = min(Dm, min(float(b[2]), float(b[4])))
            if b[0] > Q:
                break
        
    if Q in [16, 14, 1, 62, 67, 17, 71, 64, 83]: #ほかの0hにまたがる星座の番号
    #極を含む2座以外で0hと12hを両方含む星座はない
        Rm = 0
        RM = 0
        Dm = 90
        DM = -90
        for bound in bounds:
            b = list(map(float, bound.split()))
            if b[0] == Q:
                if float(b[1]) > 180:
                    Rm = min(Rm, min(float(b[1]-360), float(b[3])-360))
                    DM = max(DM, max(float(b[2]), float(b[4])))
                    Dm = min(Dm, min(float(b[2]), float(b[4])))
                else:
                    RM = max(RM, max(float(b[1]), float(b[3])))
                    DM = max(DM, max(float(b[2]), float(b[4])))
                    Dm = min(Dm, min(float(b[2]), float(b[4])))
            if b[0] > Q:
                break
            
    else:
        Rm = 360
        RM = 0
        Dm = 90
        DM = -90
        for bound in bounds:
            b = list(map(float, bound.split()))
            if b[0] == Q:
                RM = max(RM, max(float(b[1]), float(b[3])))
                Rm = min(Rm, min(float(b[1]), float(b[3])))
                DM = max(DM, max(float(b[2]), float(b[4])))
                Dm = min(Dm, min(float(b[2]), float(b[4])))
            if b[0] > Q:
                break

    ConstSize = float(consts[Q-1].split(",")[4])
    size0 = 100 * 350 / ConstSize
    sizeDif = 15 * 350 / ConstSize

    if Q in [58, 16, 14, 1, 62, 67, 17, 71, 64, 83, 85]:
        Xs = []
        Ys = []
        sizes = []
        for star in range(8874):
            data = stars[star].split()
            RA = float(data[0])
            Dec = float(data[1])
            if RA <= RM + 5:
                if Dec >= Dm - 5 and Dec <= DM + 5:
                    x, y = SeikyoHoui(RA, Dec, Q)
                    Xs.append(x)
                    Ys.append(y)
                    sizes.append(round(size0 - sizeDif * float(data[2])))
            else:
                break
        for star in range(8874):
            data = stars[8873-star].split()
            RA = float(data[0])
            Dec = float(data[1])
            if RA - 360 >= Rm - 5:
                if Dec >= Dm - 5 and Dec <= DM + 5:
                    x, y = SeikyoHoui(RA, Dec, Q)
                    Xs.append(x)
                    Ys.append(y)
                    sizes.append(round(size0 - sizeDif * float(data[2])))
            else:
                break
        ax.scatter(Xs, Ys, c='black', s=sizes)
                
    else:
        Xs = []
        Ys = []
        sizes = []
        for star in stars:
            data = star.split()
            RA = float(data[0])
            Dec = float(data[1])
            if RA >= Rm - 5:
                if RA <= RM + 5:
                    if Dec >= Dm - 5 and Dec <= DM + 5:
                        x, y = SeikyoHoui(RA, Dec, Q)
                        Xs.append(x)
                        Ys.append(y)
                        sizes.append(round(size0 - sizeDif * float(data[2])))
                else:
                    break
        ax.scatter(Xs, Ys, c='black', s=sizes)
                
    fig.savefig("img_noline_{0}.png".format(Q))

    for line in lines:
        [num, RA1, Dec1, RA2, Dec2] = list(map(float, line.split()))
        if num == Q:
            x1, y1 = SeikyoHoui(RA1, Dec1, Q)
            x2, y2 = SeikyoHoui(RA2, Dec2, Q)
            ax.plot([x1, x2], [y1, y2], c='red', lw=2)

    fig.savefig("img_{0}.png".format(Q))

    fig.clf()
    plt.close()

for i in range(1, 90):
    show(i, 0)

starsfile.close()
linesfile.close()
constsfile.close()
boundsfile.close()
