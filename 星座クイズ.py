import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
import tkinter as tk
import tkinter.ttk as ttk
import math
from math import floor, sin, cos, tan, atan, pi, log10
import tkinter.messagebox as mb
import linecache
import random
import time
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

def start(event):
    global count, all, score, yet, NextTime, correctList, answerList, ox
    count = 0

    if AllE.get().isdecimal and int(AllE.get()) >= 1 and int(AllE.get()) <= 89:
        all = int(AllE.get())
    else:
        mb.showerror('', '問題数は1以上89以下で')
        return
    
    score = 0
    correctList = []
    answerList = []
    ox = []

    AnsType = AnsTypeCombo.get()
    LineUmu = LineUmuCombo.get()
    
    title.destroy()
    AnsTypeCombo.destroy()
    LineUmuCombo.destroy()
    AllL.destroy()
    AllE.destroy()
    StB.destroy()

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

    def show():
        global yet, Q, count, NextTime, canvas, seigoL

        if count > 0:
            canvas.destroy()
            seigoL.destroy()

        Q = random.choice(yet)
        yet.remove(Q)

        count += 1

        if time.time() - NextTime < 1:
            time.sleep(1 - (time.time() - NextTime))
            
        canvas = tk.Canvas(root, width=500, height=500)
        canvas.place(x=0, y=0)

        if LineUmu == '星座線あり':
            img = ImageTk.PhotoImage(file='img_{}.png'.format(Q))
        else:
            img = ImageTk.PhotoImage(file='img_noline_{}.png'.format(Q))
        canvas.create_image(0, 0, anchor='nw', image=img)
        
        CountShow.set('第' + str(count) + '問')
        
        root.update()
        root.deiconify()
        root.mainloop()

    def review(event):
        global all, correctList, answerList, ox
        text = '解答　正解　正誤'
        for i in range(all):
            text += '\n' + answerList[i] + '  ' + correctList[i] + '  ' + ox[i]
        mb.showinfo('Review', text)

    def home(event):
        global resultL, ReviewB, HomeB, title, AnsTypeCombo, LineUmuCombo, AllL, AllE, StB, yet

        resultL.destroy()
        ReviewB.destroy()
        HomeB.destroy()
        
        title = tk.Label(root, text='星座クイズ', height=1, width=10, font=("MS Gothic", 40, 'bold'), bg='white')
        title.place(x=100, y=100)

        AnsTypeList = ['日本語', '略号', '学名']
        AnsTypeCombo = ttk.Combobox(root, textvariable=tk.StringVar(), values=AnsTypeList, height=2, width=10, font=("MS Gothic", 15))
        AnsTypeCombo.set('日本語')
        AnsTypeCombo.place(x=80, y=250)

        LineUmuList = ['星座線あり', '星座線なし']
        LineUmuCombo = ttk.Combobox(root, textvariable=tk.StringVar(), values=LineUmuList, height=2, width=10, font=("MS Gothic", 15))
        LineUmuCombo.set('星座線あり')
        LineUmuCombo.place(x=280, y=250)

        AllL = tk.Label(root, text='問題数 :    問', font=("MS Gothic", 20), bg='white')
        AllL.place(x=100, y=300)

        AllE = tk.Entry(root, width=3, font=("MS Gothic", 20))
        AllE.insert(tk.END, '5')
        AllE.place(x=220, y=305)

        StB = tk.Button(root, text='START→', height=2, width=10, font=("MS Gothic", 40))
        StB.bind('<1>', start)
        StB.place(x=100, y=400)

        yet = list(range(1, 90))

    def finish():
        global all, score, correctList, answerList, ox, canvas, seigoL, resultL, ReviewB, HomeB

        canvas.destroy()
        seigoL.destroy()
        CountShowL.destroy()
        InE.destroy()
        NextB.destroy()
        
        result = '終わり！\n' + str(all) + '問中' + str(score) + '問正解です'
        resultL = tk.Label(root, text=result, anchor=tk.CENTER, font=("MS Gothic", 30), bg='white')
        resultL.place(x=100, y=100)

        ReviewB = tk.Button(root, text='Review', font=("MS Gothic", 20), width=8, height=2)
        ReviewB.bind('<1>', review)
        ReviewB.place(x=200, y=350)
        
        HomeB = tk.Button(root, text='HOME', font=("MS Gothic", 20), width=8, height=2)
        HomeB.bind('<1>', home)
        HomeB.place(x=200, y=500)

    def NextSub(count):
        global all
        if count < all:
            InE.delete(0, tk.END)
            show()
        else:
            time.sleep(1)
            finish()
    
    def Next(event):
        global yet, Q, count, score, seigo, seigoL, NextTime, correctList, answerList, ox
        
        NextTime = time.time()
        
        ans = InE.get()
        answerList.append(ans)
        
        if AnsType == '日本語':
            correct = consts[Q-1].split(",")[3]
        elif AnsType == '略号':
            correct = consts[Q-1].split(",")[1]
        else:
            correct = consts[Q-1].split(",")[2]
        correctList.append(correct)
        
        if ans == correct:
            seigoL = tk.Label(root, text='正解！', anchor=tk.CENTER, font=("MS Gothic", 30), bg='white')
            seigoL.place(x=200, y=500)
            score += 1
            ox.append('O')
        else:
            seigoL = tk.Label(root, text="残念！　正解は " + correct + " 座でした。\nあなたの答えは " + ans + " 座", anchor=tk.CENTER, font=("MS Gothic", 18), bg='white')
            seigoL.place(x=30, y=500)
            ox.append('X')
            
        root.after(1, NextSub, count)
        root.mainloop()

    CountShow = tk.StringVar()
    CountShow.set('第' + str(count) + '問')
    CountShowL = tk.Label(root, textvariable=CountShow, font=("MS Gothic", 15, 'bold'), bg='white')
    CountShowL.place(x=10, y=580)
    
    InE = tk.Entry(root, width=20, font=("MS Gothic", 20))
    InE.place(x=100, y=580)
    
    NextB = tk.Button(root, text="NEXT", width=5, height=2)
    NextB.bind('<1>', Next)
    NextB.place(x=400, y=580)
    
    yet = list(range(1, 90)) #[1, 2, 3, ..., 89]

    NextTime = time.time() - 100
    show()

root = tk.Tk()
root.title('星座クイズ')
root.geometry('500x700+0+0')
root.configure(bg='white')

title = tk.Label(root, text='星座クイズ', height=1, width=10, font=("MS Gothic", 40, 'bold'), bg='white')
title.place(x=100, y=100)

AnsTypeList = ['日本語', '略号', '学名']
AnsTypeCombo = ttk.Combobox(root, textvariable=tk.StringVar(), values=AnsTypeList, height=2, width=10, font=("MS Gothic", 15))
AnsTypeCombo.set('日本語')
AnsTypeCombo.place(x=80, y=250)

LineUmuList = ['星座線あり', '星座線なし']
LineUmuCombo = ttk.Combobox(root, textvariable=tk.StringVar(), values=LineUmuList, height=2, width=10, font=("MS Gothic", 15))
LineUmuCombo.set('星座線あり')
LineUmuCombo.place(x=280, y=250)

AllL = tk.Label(root, text='問題数 :    問', font=("MS Gothic", 20), bg='white')
AllL.place(x=100, y=300)

AllE = tk.Entry(root, width=3, font=("MS Gothic", 20))
AllE.insert(tk.END, '5')
AllE.place(x=220, y=305)

StB = tk.Button(root, text='START→', height=2, width=10, font=("MS Gothic", 40))
StB.bind('<1>', start)
StB.place(x=100, y=400)

starsfile.close()
linesfile.close()
constsfile.close()
boundsfile.close()

root.mainloop()
