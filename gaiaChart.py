r""" 下のライブラリを必要に応じてインストールしてください。コマンドの例は以下です。
エラーが出たら聞いてくれたら答えられるかもしれないし答えられないかもしれません。

VSCodeの場合:調べてターミナルかPower Shellでpip install matplotlib astroquery datetime
matplotlibをインストールするとnumpyもインストールされるが、されなかったらnumpyも (pip install numpy)
右上の右三角で実行。うまくいかない場合はその右のvからRun Code

Windows, pipの場合:Windows PowerShellでPS C:\Users\~~~~~>の右にpip install matplotlib astroquery datetime
matplotlibをインストールするとnumpyもインストールされるが、されなかったらnumpyも (pip install numpy)
installのあとに--userが必要な場合あり

Google Colabでは実行できないみたいです（Tkinterが使えないらしい）
"""

import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from astroquery.gaia import Gaia
from astroquery.jplhorizons import Horizons
import numpy as np
import tkinter as tk
import tkinter.ttk as ttk
import tkinter.messagebox as mb
import datetime
import traceback
import webbrowser

def _destroyWindow():
    root.quit()
    root.destroy()

root = tk.Tk()
root.title('Gaia Archive Chart')
root.geometry("1300x650+0+0")
root.configure(bg="black")
root.withdraw()
root.protocol('WM_DELETE_WINDOW', _destroyWindow)

def show_message(event):
    root2 = tk.Tk()
    root2.title('ごあんない')
    root2.configure(bg="black")
    message = 'Gaia Archiveのデータを用いて詳細な星図を作成します。\n\n'\
        '座標などを自分で設定する場合は、5つの枠に有効な値を入力してからGOボタンを押してください。\n'\
        '星が多すぎる場合は少しずつ表示されるので、新しく表示されるごとに同じボタンを繰り返し押してください。\n\n'\
        '座標は「hh mm」、「hh mm ss」、度の小数などが有効です。\n\n'\
        'a, b, cは等級から星のサイズを計算する式「a*(限界等級-等級)^b+c」に現れる変数です。\n\n'\
        'プリセットを利用するときは、プリセットのラジオボタンを選択してから希望の天体をクリックし、\n'\
        '「カスタム」の下の座標などが変わることを確認してください。\n'\
        '見たい天体がすでに選ばれている場合も、プログラムを立ち上げた直後以外は必ず一度候補の一覧を開き、\n'\
        'クリックで選択して、座標の設定が変わったことを確認してください。\n\n'\
        '太陽系天体を中心にしたいときは、太陽系天体のラジオボタンを選択してから、\n'\
        '枠に天体の英語名や小惑星番号など（一部日本語も対応）を入力し、OKボタンを押して座標が変わることを確認してください。\n'\
        'セットされるとメッセージが表示されますが、それがセットしたかった天体と違った場合は\n'\
        '小惑星番号で入力してみたり小惑星名で入力してみたりしてください。\n'\
        'Barycenterありとなしがあった場合はなしを選んでください。\n'\
        '天体名の設定についてはhttps://ssd.jpl.nasa.gov/horizons/app.html#/のTarget Bodyの設定画面を参考にしてください。\n'\
        '時刻は世界時で、「yyyy-mm-dd hh:mm」、ユリウス日などが有効です。\n\n'\
        '日本語に対応している天体は「冥王星」「海王星」「天王星」「土星」です。\n'\
        '周期彗星を入力すると回帰ごとのリストが出てくるので左端の列の番号を入力してください。\n'\
        '入力例：「ceres」「halley」「31416」(<-小惑星Peteworden)「hayabusa」(<-探査機)「17656」(<-小惑星Hayabusa)「Uranus」\n\n'\
        '例外処理などはあんまりがんばってないのでいじめないであげてください。\n\n'\
        '恒星データ：Gaia Archive (European Space Agency)\n'\
        '太陽系天体のデータ：Horizons System (Jet Propulsion Laboratory)\n\n'\
        '作者より　2024/9/17'
    message_label = tk.Label(root2, text=message, fg='white', bg='black')
    message_label.pack()

designation = np.empty(0)
ra = np.empty(0)
dec = np.empty(0)
mag = np.empty(0)

ra_center = 0
ra_width = 0
dec_center = 0
dec_width = 0
mag_limit = 0

a = 2.0
b = 1.6
c = 0.5

time = 0

dec_done = 0
dec_next_list = []

star_number = 0

done_flag = True

def plot_stars(ra_center, ra_width, dec_max, mag_limit, ax):
    global a, b, c
    global designation, ra, dec, mag
    global dec_next_list
    dec_min = dec_next_list[-1]
    while True:
        query = f"""
        SELECT designation, ra, dec, phot_g_mean_mag 
        FROM gaiadr3.gaia_source 
        WHERE 1=CONTAINS(POINT('ICRS', ra, dec), BOX('ICRS', {ra_center}, {(dec_max + dec_min) / 2}, {ra_width}, {dec_max-dec_min}))
        AND phot_g_mean_mag < {mag_limit}
        """
        job = Gaia.launch_job(query)
        result = job.get_results()
        if len(result['ra']) >= 2000:
            dec_min = dec_max - (dec_max - dec_min) / 2
            dec_next_list.append(dec_min)
        else:
            print(result)
            designation = np.concatenate((designation, result['DESIGNATION'].data))
            ra = np.concatenate((ra, result['ra'].data))
            dec = np.concatenate((dec, result['dec'].data))
            mag = np.concatenate((mag, result['phot_g_mean_mag'].data))
            ax.scatter(ra, dec, s=a*(mag_limit-mag)**b+c, c='white')
            ax.scatter(ra_center, dec_center, s=2.5, c='red')
            if len(result['DESIGNATION'].data) <= 30:
                print()
                for i in range(len(result['DESIGNATION'])):
                    print(result['DESIGNATION'].data[i], result['ra'].data[i], result['dec'].data[i], result['phot_g_mean_mag'].data[i])
            return ax, len(result['ra'].data)

def get_input():
    try:
        ra_center = raBox.get()
        dec_center = decBox.get()

        if len(ra_center.split()) == 1:
            ra_center = float(ra_center)
        elif len(ra_center.split()) == 2:
            ra_center = 15 * float(ra_center.split()[0]) + float(ra_center.split()[1]) / 4
        elif len(ra_center.split()) == 3:
            ra_center = 15 * float(ra_center.split()[0]) + float(ra_center.split()[1]) / 4 + float(ra_center.split()[2]) / 240
        else:
            mb.showerror('エラー', '赤経が無効です')
            return 0

        if len(dec_center.split()) == 1:
            dec_center = float(dec_center)
        elif len(dec_center.split()) == 2:
            if dec_center[0] != '-':
                dec_center = float(dec_center.split()[0]) + float(dec_center.split()[1]) / 60
            else:
                dec_center = float(dec_center.split()[0]) - float(dec_center.split()[1]) / 60
        elif len(dec_center.split()) == 3:
            if dec_center[0] != '-':
                dec_center = float(dec_center.split()[0]) + float(dec_center.split()[1]) / 60 + float(dec_center.split()[2]) / 3600
            else:
                dec_center = float(dec_center.split()[0]) - float(dec_center.split()[1]) / 60 - float(dec_center.split()[2]) / 3600
        else:
            mb.showerror('エラー', '赤緯が無効です')
            return 0
        
        ra_width = float(raWidthBox.get())
        dec_width = float(decWidthBox.get())
        mag_limit = float(magBox.get())
        a = float(a_box.get())
        b = float(b_box.get())
        c = float(c_box.get())
        time = time_box.get()

        chart_btn.config(state=tk.NORMAL)

        return [ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c, time]
    
    except:
        return 0
    
def startDrawing(event):
    global designation, ra, dec, mag
    global ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c, time
    global dec_done, dec_next_list, star_number
    global submitText, star_number_text
    global canvas
    global done_flag

    changed = (get_input() != 0 and [ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c, time] == get_input())

    if done_flag and changed:
        return
    elif not changed:
        [ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c, time] = get_input()
        designation = np.empty(0)
        ra = np.empty(0)
        dec = np.empty(0)
        mag = np.empty(0)
        dec_done = dec_center + dec_width / 2
        dec_next_list = [dec_center - dec_width / 2]
        star_number = 0
        done_flag = False

    plt.close()
    fig = plt.figure('結果', figsize=(11, 6.5), facecolor="black")
    fig.subplots_adjust(left=0.1, right=0.95, top=0.95, bottom=0.1)
    ax = fig.add_subplot(111)
    ax.set_facecolor('black')
    ax.set_xlabel('Right Ascension (deg)')
    ax.set_ylabel('Declination (deg)')
    ax.spines['bottom'].set_color('white')
    ax.spines['top'].set_color('white') 
    ax.spines['right'].set_color('white')
    ax.spines['left'].set_color('white')
    ax.xaxis.label.set_color('white')
    ax.yaxis.label.set_color('white')
    ax.tick_params(colors='white', which='both')
    ax.grid(True)

    ax.set_xlim(ra_center+ra_width/2, ra_center-ra_width/2)
    ax.set_ylim(dec_center-dec_width/2, dec_center+dec_width/2)
    ax.set_aspect(1/np.cos(np.radians(dec_center)))

    if len(dec_next_list) > 0:
        ax, star_number_part = plot_stars(ra_center, ra_width, dec_done, mag_limit, ax)
        star_number += star_number_part
        dec_done = dec_next_list.pop(-1)
        if dec_done == dec_center - dec_width / 2:
            submitText.set('GO')
            done_flag = True
        else:
            submitText.set('MORE\nOR\nGO')
            done_flag = False
        canvas = FigureCanvasTkAgg(fig, master=root)
        canvas.draw()
        canvas.get_tk_widget().place(x=200, y=0)

    star_number_text.set(f'{star_number} stars')

def set_time(now_flag):
    if now_flag:
        now = datetime.datetime.now(datetime.timezone.utc)
        now_text = f'{str(now.year)}-{str(now.month)}-{str(now.day)} {str(now.hour)}:{str(now.minute)}:{str(now.second)}'
        time_box.delete(0, tk.END)
        time_box.insert(tk.END, now_text)

def set_values(rc, rw, dc, dw, ml, a0=2.0, b0=1.6, c0=0.5):
    global ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c
    ra_center = rc
    ra_width = rw
    dec_center = dc
    dec_width = dw
    mag_limit = ml
    a = a0
    b = b0
    c = c0

    raBox.delete(0, tk.END)
    raWidthBox.delete(0, tk.END)
    decBox.delete(0, tk.END)
    decWidthBox.delete(0, tk.END)
    magBox.delete(0, tk.END)
    a_box.delete(0, tk.END)
    b_box.delete(0, tk.END)
    c_box.delete(0, tk.END)

    raBox.insert(tk.END, ra_center)
    raWidthBox.insert(tk.END, str(ra_width))
    decBox.insert(tk.END, dec_center)
    decWidthBox.insert(tk.END, str(dec_width))
    magBox.insert(tk.END, str(mag_limit))
    a_box.insert(tk.END, str(a))
    b_box.insert(tk.END, str(b))
    c_box.insert(tk.END, str(c))

def preset_combo_select(event):
    if radioVar.get() != 1:
        return

    name = preset_combo.get()
    if name == 'M 13':
        set_values('16 41 42', 0.2, '36 27 41', 0.2, 16)
    elif name == 'ω Cen':
        set_values('13 26 47', 0.4, '-47 28 46', 0.3, 15)
    elif name == 'プレアデス星団':
        set_values('3 47.0', 1, '24 7', 1, 14)
    elif name == 'アンドロメダ銀河':
        set_values('0 42 44', 2, '41 16 9', 2, 20, 0, 1, 0.2)
    elif name == 'T CrB':
        set_values('15 59 30.2', 1, '25 55 13', 1, 14)

def set_horizons(k):
    if radioVar.get() != 2:
        return
    name = asteroidBox.get()
    epoch = time_box.get()
    if name in ['Pluto', 'pluto', '冥王星']:
        name = 134340
    elif name in ['Neptune', 'neptune', '海王星']:
        name = 899
    elif name in ['Uranus', 'uranus', '天王星']:
        name = 799
    elif name in ['Saturn', 'saturn', '土星']:
        name = 699
    try:
        ans = Horizons(id=name, location='500', epochs=f"'{epoch}'").ephemerides()
        if k == 0:
            set_values(str(ans['RA'][0]), 1, str(ans['DEC'][0]), 1, 15)
        elif k == 1:
            set_values(str(ans['RA'][0]), ra_width, str(ans['DEC'][0]), dec_width, mag_limit, a, b, c)
        asteroidBtnText.set('OK')
        mb.showinfo('セットしたよ', '次の天体をセットしました：' + ans['targetname'][0])
    except ValueError as e:
        asteroidBtnText.set('SET')
        mb.showerror('エラー', '天体の一覧が表示されたときは名前の欄に左端の列の数字を入力してください\n' + str(traceback.format_exception_only(type(e), e)[0].rstrip('\n')))
    except:
        asteroidBtnText.set('SET')

def horizons(event):
    set_horizons(0)

def change_time(event):
    set_horizons(1)

def open_chart(event):
    global ra_center, ra_width, dec_center
    epoch = time_box.get()
    if len(epoch.split()) == 2:
        [epoch0, epoch1] = epoch.split()
        if len(epoch1.split(':')) == 3:
            [h, m, s] = list(map(float, epoch1.split(':')))
            epoch = f'{epoch0}-{h}-{round(m+s/60, 1)}'
        elif len(epoch1.split(':')) == 2:
            [h, m] = list(map(float, epoch1))
            epoch = f'{epoch0}-{h}-{round(m, 1)}'
        webbrowser.open_new(f'https://peteworden.github.io/Soleil/chart.html?RA={ra_center}&Dec={dec_center}&area={max(1.4, ra_width)}&mode=AEP&magkey=13&time={epoch}')

leftColumnX = 100

radioVar = tk.IntVar()
radioVar.set(0)

titleLabel = tk.Label(root, text='Gaia Archive Chart', fg='white', bg='black')
titleLabel.place(x=leftColumnX, y=0, anchor=tk.N)

messageBtn = tk.Button(root, text='help', width=6)
messageBtn.bind('<1>', show_message)
messageBtn.place(x=leftColumnX, y=20, anchor=tk.N)

raLabel = tk.Label(root, text='中心の赤経', fg='white', bg='black')
raLabel.place(x=60, y=70, anchor=tk.N)
raBox = tk.Entry(root, width=10)
raBox.insert(tk.END, '16 41 42')
raBox.place(x=60, y=90, anchor=tk.N)

raWidthLabel = tk.Label(root, text='赤経の幅（°）', fg='white', bg='black')
raWidthLabel.place(x=140, y=70, anchor=tk.N)
raWidthBox = tk.Entry(root, width=10)
raWidthBox.insert(tk.END, '0.2')
raWidthBox.place(x=140, y=90, anchor=tk.N)

decLabel = tk.Label(root, text='中心の赤緯', fg='white', bg='black')
decLabel.place(x=60, y=110, anchor=tk.N)
decBox = tk.Entry(root, width=10)
decBox.insert(tk.END, '36 27 41')
decBox.place(x=60, y=130, anchor=tk.N)

decWidthLabel = tk.Label(root, text='赤緯の幅（°）', fg='white', bg='black')
decWidthLabel.place(x=140, y=110, anchor=tk.N)
decWidthBox = tk.Entry(root, width=10)
decWidthBox.insert(tk.END, '0.2')
decWidthBox.place(x=140, y=130, anchor=tk.N)

magLabel = tk.Label(root, text='限界等級', fg='white', bg='black')
magLabel.place(x=100, y=150, anchor=tk.N)
magBox = tk.Entry(root, width=10)
magBox.insert(tk.END, '16')
magBox.place(x=100, y=170, anchor=tk.N)

a_label = tk.Label(root, text='a', fg='white', bg='black')
a_label.place(x=40, y=190, anchor=tk.N)
a_box = tk.Entry(root, width=7)
a_box.insert(tk.END, '2.0')
a_box.place(x=40, y=210, anchor=tk.N)

b_label = tk.Label(root, text='b', fg='white', bg='black')
b_label.place(x=100, y=190, anchor=tk.N)
b_box = tk.Entry(root, width=7)
b_box.insert(tk.END, '1.6')
b_box.place(x=100, y=210, anchor=tk.N)

c_label = tk.Label(root, text='c', fg='white', bg='black')
c_label.place(x=160, y=190, anchor=tk.N)
c_box = tk.Entry(root, width=7)
c_box.insert(tk.END, '0.5')
c_box.place(x=160, y=210, anchor=tk.N)

radio1 = tk.Radiobutton(root, value=0, variable=radioVar, text='カスタム', fg='white', bg='black', selectcolor='red')
radio1.place(x=10, y=250)

radio2 = tk.Radiobutton(root, value=1, variable=radioVar, text='プリセット', fg='white', bg='black', selectcolor='red')
radio2.place(x=10, y=290)

presets = ['M 13', 'ω Cen', 'プレアデス星団', 'アンドロメダ銀河', 'T CrB']
preset = tk.StringVar()
preset.set(presets[0])
preset_combo = ttk.Combobox(root, textvariable=preset, values=presets, state="readonly")
preset_combo.bind('<<ComboboxSelected>>', preset_combo_select)
preset_combo.place(x=100, y=320, anchor=tk.N)

radio3 = tk.Radiobutton(root, value=2, variable=radioVar, text='太陽系天体', fg='white', bg='black', selectcolor='red')
radio3.place(x=10, y=360)

asteroidBox = tk.Entry(root, width=15)
asteroidBox.insert(tk.END, 'Pluto')
asteroidBox.place(x=80, y=400, anchor=tk.CENTER)
asteroidBtnText = tk.StringVar()
asteroidBtnText.set('SET')
asteroidBtn = tk.Button(root, textvariable=asteroidBtnText, width=4)
asteroidBtn.bind('<1>', horizons)
asteroidBtn.place(x=180, y=400, anchor=tk.CENTER)

timeLabel = tk.Label(root, text='時刻（世界時）', fg='white', bg='black')
timeLabel.place(x=100, y=420, anchor=tk.N)
time_box = tk.Entry(root, width=18)
time_box.place(x=80, y=450, anchor=tk.CENTER)
set_time(True)
time_only_button = tk.Button(root, text='時刻変更', width=6)
time_only_button.bind('<1>', change_time)
time_only_button.place(x=180, y=450, anchor=tk.CENTER)

submitText = tk.StringVar(root)
submitText.set('GO')
submitBtn = tk.Button(root, textvariable=submitText, width=8, height=3)
submitBtn.bind('<1>', startDrawing)
submitBtn.place(x=100, y=480, anchor=tk.N)

star_number_text= tk.StringVar(root)
star_number_text.set('')
star_number_label = tk.Label(root, textvariable=star_number_text, fg='white', bg='black')
star_number_label.place(x=100, y=540, anchor=tk.N)

chart_btn = tk.Button(root, text='ぴーとの星図で見る', width=20)
chart_btn.bind('<1>', open_chart)
chart_btn.place(x=100, y=570, anchor=tk.N)
chart_btn.config(state=tk.DISABLED)

root.update()
root.deiconify()
root.mainloop()