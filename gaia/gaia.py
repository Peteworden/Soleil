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

#Gaia DR3 3045141437891827072

import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from astroquery.gaia import Gaia
from astroquery.jplhorizons import Horizons
import numpy as np
import tkinter as tk
import tkinter.ttk as ttk
import tkinter.messagebox as mb
import tkinter.filedialog as fd
from datetime import datetime, timedelta, timezone
import traceback
import sys
import os

def show_message(event):
    root2 = tk.Tk()
    root2.title('ごあんない')
    root2.configure(bg="black")
    message = 'Gaia Archiveのデータを用いて詳細な星図を作成します。\n\n'\
        '座標などを自分で設定する場合は、5つの枠に有効な値を入力してからDRAWボタンを押してください。\n'\
        '星が多すぎる場合は少しずつ表示されるので、新しく表示されるごとに同じボタンを繰り返し押してください。\n\n'\
        '座標は「hh mm」、「hh mm ss」、度の小数などが有効です。\n\n'\
        'a, b, cは等級から星のサイズを計算する式「a*(限界等級-等級)^b+c」に現れる変数です。\n\n'\
        'プリセットを利用するときは、プリセットのラジオボタンを選択してから希望の天体をクリックし、\n'\
        '「カスタム」の下の座標などが変わることを確認してください。\n'\
        '見たい天体がすでに選ばれている場合も、プログラムを立ち上げた直後以外は必ず一度候補の一覧を開き、\n'\
        'クリックで選択して、座標の設定が変わったことを確認してください。\n\n'\
        '時刻は世界時で、「yyyy-mm-dd hh:mm」、ユリウス日などが有効です。\n\n'\
        '例外処理などはあんまりがんばってないのでいじめないであげてください。\n\n'\
        '恒星データ：Gaia Archive (European Space Agency)\n'\
        '太陽系天体のデータ：Horizons System (Jet Propulsion Laboratory)\n\n'\
        '作者より'
    message_label = tk.Label(root2, text=message, fg='white', bg='black')
    message_label.pack()

class GaiaChartApp:
    def __init__(self, root):
        root.withdraw()
        self.root = root
        self.root.geometry("1300x650+0+0")
        self.root.configure(bg="black")
        self.root.title('Gaia Archive Chart')
        self.fig = None
        self.ax = None
        self.canvas = None
        self.button_config = {
            'bg': 'black',
            'fg': 'white',
            'font': ('Arial', 10),
            'width': 10,
            'height': 1
        }
        self.preset_var = tk.StringVar(self.root)
        self.preset_var.set('M 13')
        self.presets = ['M 13', 'ω Cen', 'プレアデス星団', 'アンドロメダ銀河', 'T CrB']
        self.horizons_btn_text = tk.StringVar(self.root)
        self.horizons_btn_text.set('Set')
        self.submitText = tk.StringVar(self.root)
        self.submitText.set('DRAW')
        self.star_number_text = tk.StringVar(self.root)
        self.star_number_text.set('0 stars')

        # ラジオボタンの変数を追加
        self.radio_var = tk.IntVar()
        self.radio_var.set(0)  # デフォルトでカスタムを選択

        self.ra = np.empty(0)
        self.dec = np.empty(0)
        self.mag = np.empty(0)
        self.distance = np.empty(0)
        self.designation = np.empty(0)
        self.dec_next_list = []
        self.dec_done = 0
        self.done_flag = False
        self.star_number = 0
        self.star_number_estimate = 0
        self.star_number_once = 10000
        self.density = np.empty((0, 0))

        self.ra_center = 270.0
        self.ra_width = 1.0
        self.dec_center = -30.0
        self.dec_width = 1.0
        self.mag_limit = 13
        self.time = '2025-01-01 00:00'

        self.a = 2.0
        self.b = 1.6
        self.c = 0.5

        self.sync_radio_var = tk.IntVar()
        self.sync_radio_var.set(0)

        self.create_ui()

        self.root.deiconify()

    def create_ui(self):
        self.root.update_idletasks()

        main_frame = tk.Frame(self.root, bg='black')
        main_frame.pack(side=tk.LEFT, fill=tk.Y, padx=10, pady=10)

        indent = 10

        # カスタム
        custom_frame = tk.Frame(main_frame, bg='black')
        custom_frame.pack(fill=tk.X, pady=5)
        radio1 = tk.Radiobutton(custom_frame, value=0, variable=self.radio_var, text='カスタム', fg='white', bg='black', selectcolor='red')
        radio1.grid(row=0, column=0, columnspan=2, sticky=tk.W, padx=5)
        # R.A.
        label = tk.Label(custom_frame, text='R.A.', fg='white', bg='black')
        label.grid(row=1, column=0, sticky=tk.N, padx=indent)
        ra_box = tk.Entry(custom_frame, width=10)
        ra_box.grid(row=1, column=1, sticky=tk.N, padx=indent)
        ra_box.insert(0, str(self.ra_center))
        # Dec.
        label = tk.Label(custom_frame, text='Dec.', fg='white', bg='black')
        label.grid(row=2, column=0, sticky=tk.N, padx=indent)
        dec_box = tk.Entry(custom_frame, width=10)
        dec_box.grid(row=2, column=1, sticky=tk.N, padx=indent)
        dec_box.insert(0, str(self.dec_center))

        # プリセット
        preset_frame = tk.Frame(main_frame, bg='black')
        preset_frame.pack(fill=tk.X, pady=5)
        radio2 = tk.Radiobutton(preset_frame, value=1, variable=self.radio_var, text='プリセット', fg='white', bg='black', selectcolor='red')
        radio2.pack(anchor=tk.W, padx=5)
        preset_combo = ttk.Combobox(preset_frame, textvariable=self.preset_var, values=self.presets, state="readonly")
        preset_combo.bind('<<ComboboxSelected>>', self.preset_combo_select)
        preset_combo.pack(anchor=tk.N, padx=indent)

        # Planet/Asteroid
        horizons_frame = tk.Frame(main_frame, bg='black')
        horizons_frame.pack(fill=tk.X, pady=5)  
        radio3 = tk.Radiobutton(horizons_frame, value=2, variable=self.radio_var, text='太陽系天体', fg='white', bg='black', selectcolor='red')
        radio3.grid(row=0, column=0, columnspan=2, sticky=tk.W, padx=5)
        # Planet/Asteroid name
        label = tk.Label(horizons_frame, text='天体名', fg='white', bg='black')
        label.grid(row=1, column=0, sticky=tk.N, padx=indent)
        planet_box = tk.Entry(horizons_frame, width=10)
        planet_box.grid(row=1, column=1, sticky=tk.N, padx=indent)
        planet_box.insert(0, 'Pluto')
        planet_hint_btn = tk.Button(horizons_frame, text='hint', command=self.open_planet_hint, width=6)
        planet_hint_btn.grid(row=1, column=2, sticky=tk.N, padx=indent)
        # Time
        label = tk.Label(horizons_frame, text='Time (UT)', fg='white', bg='black')
        label.grid(row=2, column=0, sticky=tk.N, padx=indent)
        time_box = tk.Entry(horizons_frame, width=18)
        time_box.grid(row=2, column=1, sticky=tk.N, padx=indent)
        current_time_btn = tk.Button(horizons_frame, text='now', command=self.set_current_time, width=6)
        current_time_btn.grid(row=2, column=2, sticky=tk.N, padx=indent)
        # Set Button
        btn = tk.Button(horizons_frame, textvariable=self.horizons_btn_text, command=self.set_horizons, width=10)
        btn.grid(row=3, column=0, columnspan=2, sticky=tk.N, padx=indent, pady=5)

        # 詳細
        detail_frame = tk.Frame(main_frame, bg='black')
        detail_frame.pack(fill=tk.X, pady=5)
        # R.A. Width
        label = tk.Label(detail_frame, text='R.A. Width', fg='white', bg='black')
        label.grid(row=0, column=0, sticky=tk.N, padx=indent)
        ra_width_box = tk.Entry(detail_frame, width=10)
        ra_width_box.grid(row=0, column=1, sticky=tk.N, padx=indent)
        ra_width_box.insert(0, str(self.ra_width))
        # Dec. Width
        label = tk.Label(detail_frame, text='Dec. Width', fg='white', bg='black')
        label.grid(row=1, column=0, sticky=tk.N, padx=indent)
        dec_width_box = tk.Entry(detail_frame, width=10)
        dec_width_box.grid(row=1, column=1, sticky=tk.N, padx=indent)
        dec_width_box.insert(0, str(self.dec_width))
        # Mag. Limit
        label = tk.Label(detail_frame, text='Mag. Limit (recommended: 15-18)', fg='white', bg='black')
        label.grid(row=2, column=0, columnspan=2, sticky=tk.N, padx=indent)
        mag_box = tk.Entry(detail_frame, width=10)
        mag_box.grid(row=3, column=0, columnspan=2, sticky=tk.N, padx=indent)
        mag_box.insert(0, str(self.mag_limit))
        # a, b, c
        label = tk.Label(detail_frame, text='a', fg='white', bg='black')
        label.grid(row=4, column=0, sticky=tk.N, padx=indent)
        a_box = tk.Entry(detail_frame, width=5)
        a_box.grid(row=4, column=1, sticky=tk.N, padx=indent)
        a_box.insert(0, str(self.a))
        label = tk.Label(detail_frame, text='b', fg='white', bg='black')
        label.grid(row=5, column=0, sticky=tk.N, padx=indent)
        b_box = tk.Entry(detail_frame, width=5)
        b_box.grid(row=5, column=1, sticky=tk.N, padx=indent)
        b_box.insert(0, str(self.b))
        label = tk.Label(detail_frame, text='c', fg='white', bg='black')
        label.grid(row=6, column=0, sticky=tk.N, padx=indent)
        c_box = tk.Entry(detail_frame, width=5)
        c_box.grid(row=6, column=1, sticky=tk.N, padx=indent)
        c_box.insert(0, str(self.c))

        # 属性の設定
        setattr(self, 'ra_box', ra_box)
        setattr(self, 'dec_box', dec_box)
        setattr(self, 'ra_width_box', ra_width_box)
        setattr(self, 'dec_width_box', dec_width_box)
        setattr(self, 'mag_box', mag_box)
        setattr(self, 'a_box', a_box)
        setattr(self, 'b_box', b_box)
        setattr(self, 'c_box', c_box)
        setattr(self, 'planet_box', planet_box)
        setattr(self, 'time_box', time_box)
        self.set_current_time()

        submit_frame = tk.Frame(main_frame, bg='black')
        submit_frame.pack(fill=tk.X, pady=5)
        sync_radio1 = tk.Radiobutton(submit_frame, value=0, variable=self.sync_radio_var, text='少しずつ（やや速い）', fg='white', bg='black', selectcolor='red')
        sync_radio1.grid(row=0, column=0, columnspan=2, sticky=tk.W, padx=5)
        sync_radio2 = tk.Radiobutton(submit_frame, value=1, variable=self.sync_radio_var, text='一気に（遅いことも）', fg='white', bg='black', selectcolor='red')
        sync_radio2.grid(row=1, column=0, columnspan=2, sticky=tk.W, padx=5)
        self.submit_btn = tk.Button(submit_frame, textvariable=self.submitText, command=self.start_drawing, width=10, height=3, bg='orange', fg='black')
        self.submit_btn.grid(row=2, column=0, columnspan=2, sticky=tk.N, padx=10, pady=10)

        star_number_label = tk.Label(main_frame, textvariable=self.star_number_text, fg='white', bg='black')
        star_number_label.pack(anchor=tk.N, pady=10)

        self.save_btn = tk.Button(main_frame, text='Save', command=self.save_image, width=10)
        self.save_btn.pack(anchor=tk.N, pady=10)
        self.save_btn.config(state=tk.DISABLED)

        self.canvas_frame = tk.Frame(self.root, bg='black')
        self.canvas_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        # カーソル座標表示用のラベル
        self.cursor_coord_text = tk.StringVar()
        cursor_label = tk.Label(self.canvas_frame, textvariable=self.cursor_coord_text, 
                              fg='white', bg='black', font=('Arial', 12))
        cursor_label.pack(anchor=tk.N, pady=5)

        self.root.update()

    # 入力値の取得
    def get_input(self):
        try:
            ra_center = self.ra_box.get()
            dec_center = self.dec_box.get()
            print(ra_center, dec_center)

            try:
                ra_center_split = ra_center.split()
                if len(ra_center_split) == 1:
                    ra_center = float(ra_center_split[0])
                elif len(ra_center_split) == 2:
                    ra_center = 15 * float(ra_center_split[0]) + float(ra_center_split[1]) / 4
                elif len(ra_center_split) == 3:
                    ra_center = 15 * float(ra_center_split[0]) + float(ra_center_split[1]) / 4 + float(ra_center_split[2]) / 240
            except ValueError:
                mb.showerror('エラー', '赤経が無効です')
                return None

            try:
                dec_center_split = dec_center.split()
                if len(dec_center_split) == 1:
                    dec_center = float(dec_center_split[0])
                elif len(dec_center_split) == 2:
                    if dec_center[0] != '-':
                        dec_center = float(dec_center_split[0]) + float(dec_center_split[1]) / 60
                    else:
                        dec_center = float(dec_center_split[0]) - float(dec_center_split[1]) / 60
                elif len(dec_center_split) == 3:
                    if dec_center[0] != '-':
                        dec_center = float(dec_center_split[0]) + float(dec_center_split[1]) / 60 + float(dec_center_split[2]) / 3600
                    else:
                        dec_center = float(dec_center_split[0]) - float(dec_center_split[1]) / 60 - float(dec_center_split[2]) / 3600
            except ValueError:
                mb.showerror('エラー', '赤緯が無効です')
                return None
            
            ra_width = float(self.ra_width_box.get())
            dec_width = float(self.dec_width_box.get())
            mag_limit = float(self.mag_box.get())
            a = float(self.a_box.get())
            b = float(self.b_box.get())
            c = float(self.c_box.get())
            time = self.time_box.get()
            print(ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c, time)
            return [ra_center, ra_width, dec_center, dec_width, mag_limit, a, b, c, time]
        except Exception as e:
            mb.showerror('エラー', f'入力値に誤りがあります。\n{traceback.format_exception_only(type(e), e)[0].rstrip("\n")}')
            return None

    # selfの値を画面に反映
    def set_values(self):
        self.ra_box.delete(0, tk.END)
        self.dec_box.delete(0, tk.END)
        self.ra_width_box.delete(0, tk.END)
        self.dec_width_box.delete(0, tk.END)
        self.mag_box.delete(0, tk.END)
        self.a_box.delete(0, tk.END)
        self.b_box.delete(0, tk.END)
        self.c_box.delete(0, tk.END)

        self.ra_box.insert(tk.END, str(self.ra_center))
        self.ra_width_box.insert(tk.END, str(self.ra_width))
        self.dec_box.insert(tk.END, str(self.dec_center))
        self.dec_width_box.insert(tk.END, str(self.dec_width))
        self.mag_box.insert(tk.END, str(self.mag_limit))
        self.a_box.insert(tk.END, str(self.a))
        self.b_box.insert(tk.END, str(self.b))
        self.c_box.insert(tk.END, str(self.c))

    def start_drawing(self):
        pre_result = [self.ra_center, self.ra_width, self.dec_center, self.dec_width, self.mag_limit, self.a, self.b, self.c, self.time]
        result = self.get_input()
        if result is None:
            print('result is None')
            return

        changed = (result != pre_result)
        if self.done_flag and not changed:
            print('done_flag and not changed')
            return
        elif changed or self.canvas is None: # 設定が変わった、または最初の描画
            print('new drawing')
            estimate_star_number = self.estimate_star_number(result[0], result[2], result[1], result[3], result[4])
            print('estimate_star_number', estimate_star_number)
            if estimate_star_number > 3000:
                answer = mb.askyesno('警告', f"およそ{int(round(estimate_star_number/1000)*1000)}個の星があると推測されます。\n時間がかかるかもしれませんが、続けますか？")
                if not answer:
                    return
            [self.ra_center, self.ra_width, self.dec_center, self.dec_width, self.mag_limit, self.a, self.b, self.c, self.time] = result
            self.designation = []
            self.ra = []
            self.dec = []
            self.mag = []
            self.distance = []
            self.star_number = 0
            self.star_number_estimate = estimate_star_number

            self.dec_done = self.dec_center + self.dec_width / 2 # 一番上
            self.dec_next_list = [self.dec_center - self.dec_width / 2]
            print("estimate", self.star_number_estimate)
            print("dec_next_list", self.dec_next_list)
            self.done_flag = False
            self.star_number_text.set(f'{self.star_number} stars')
            self.submit_btn.config(state=tk.DISABLED)
            self.save_btn.config(state=tk.DISABLED)
            self.root.update()
        else: # 設定の変更はないがまだ全部描けていない
            print('not changed')

        if self.fig is not None: # 前の図があれば閉じる
            print('close fig: ', self.fig.number)
            if hasattr(self, 'canvas'):
                self.canvas.get_tk_widget().destroy()
            # Figureを閉じる
            plt.close(self.fig)
            # 参照をクリア
            self.fig = None
            self.ax = None
            self.canvas = None
        self.fig = plt.figure('結果', figsize=(11, 6.5), facecolor="black")
        self.fig.subplots_adjust(left=0.1, right=0.95, top=0.95, bottom=0.1)
        self.ax = self.fig.add_subplot(111)
        self.ax.set_facecolor('black')
        self.ax.set_xlabel('Right Ascension (deg)')
        self.ax.set_ylabel('Declination (deg)')

        self.ax.spines['bottom'].set_color('white')
        self.ax.spines['top'].set_color('white') 
        self.ax.spines['right'].set_color('white')
        self.ax.spines['left'].set_color('white')
        self.ax.xaxis.label.set_color('white')
        self.ax.yaxis.label.set_color('white')
        self.ax.tick_params(colors='white', which='both')
        self.ax.grid(True)

        self.ax.set_xlim(self.ra_center+self.ra_width/2, self.ra_center-self.ra_width/2)
        self.ax.set_ylim(self.dec_center-self.dec_width/2, self.dec_center+self.dec_width/2)
        self.ax.set_aspect(1/np.cos(np.radians(self.dec_center)))

        # キャンバスを先に作成
        self.canvas = FigureCanvasTkAgg(self.fig, master=self.canvas_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        self.fig.canvas.mpl_connect("motion_notify_event", self.show_star_info)
        self.fig.canvas.mpl_connect("motion_notify_event", self.show_cursor_position)

        print('make fig:', self.fig, self.fig.number)

        if len(self.dec_next_list) > 0: # まだ描画すべきエリアがあれば描画
            self.plot_stars()
            self.submitText.set('描画中...')
            self.root.update()  # すぐ反映
            
            # 描画後にキャンバスを更新
            self.canvas.draw()
            
            if self.done_flag: # 全部描画した
                self.submitText.set('DRAW')
            else:
                self.submitText.set('REST\nor\nNEW DRAW') # まだ描画すべきエリアがある
            self.star_number_text.set(f'{self.star_number} stars') # 星の数を表示
            self.submit_btn.config(state=tk.NORMAL)
            self.save_btn.config(state=tk.NORMAL)
            self.root.update()

    def plot_stars(self):
        print('plot_stars')
        self.submitText.set('fetching data...')
        self.root.update()

        def query_maker(ra_center, dec_center, ra_width, dec_width, mag_limit):
            return f"""
            SELECT designation, ra, dec, phot_g_mean_mag, parallax
            FROM gaiadr3.gaia_source 
            WHERE 1=CONTAINS(POINT('ICRS', ra, dec), BOX('ICRS', {ra_center}, {dec_center}, {ra_width}, {dec_width}))
            AND phot_g_mean_mag < {mag_limit}
            """

        progress_window = tk.Toplevel(self.root)
        progress_window.title("データ取得中")
        progress_window.geometry("300x100")
        progress_window.transient(self.root)
        progress_window.grab_set()
        
        # 中央に配置
        progress_window.update_idletasks()
        width = progress_window.winfo_width()
        height = progress_window.winfo_height()
        x = (progress_window.winfo_screenwidth() // 2) - (width // 2)
        y = (progress_window.winfo_screenheight() // 2) - (height // 2)
        progress_window.geometry(f'{width}x{height}+{x}+{y}')

        self.progress_label = tk.Label(progress_window, text="でたらめプログレスバー。Gaiaデータベースからデータを取得中...")
        self.progress_label.pack(pady=10)
        
        # プログレスバーの作成（確定モードに変更）
        progress_bar = ttk.Progressbar(progress_window, mode='determinate', length=200)
        progress_bar.pack(pady=10)
        progress_bar['value'] = 0  # 初期値を0に設定
        
        # ウィンドウを表示
        progress_window.update()

        try:
            new_star_number = 2000
            if self.sync_radio_var.get() == 0:
                while new_star_number == 2000:
                    query = query_maker(self.ra_center, (self.dec_done + self.dec_next_list[-1]) / 2, self.ra_width, self.dec_done-self.dec_next_list[-1], self.mag_limit)
                    print(query)
                    job = Gaia.launch_job(query)
                    result = job.get_results()
                    new_designation = result['DESIGNATION'].data
                    new_star_number = len(new_designation)
                    if new_star_number == 2000:
                        self.progress_label.config(text="時間かかるかも...")
                        self.dec_next_list.append((self.dec_done + self.dec_next_list[-1]) / 2)
                    else:
                        self.dec_done = self.dec_next_list.pop()
            else:
                query = query_maker(self.ra_center, (self.dec_done + self.dec_next_list[0]) / 2, self.ra_width, self.dec_done-self.dec_next_list[0], self.mag_limit)
                job = Gaia.launch_job_async(query)
                result = job.get_results()
                new_designation = result['DESIGNATION'].data
                new_star_number = len(new_designation)
                self.dec_done = self.dec_next_list[0]
                self.dec_next_list = []
            self.root.update()
                
            # 完了時に100%に設定
            progress_bar['value'] = 100
        finally:
            progress_window.destroy()

        def top2digitsint(x):
            digits = len(str(int(round(x))))
            if digits <= 2:
                return int(round(x))
            else:
                return int(round(x, -digits+2))

        new_ra = result['ra'].data
        new_dec = result['dec'].data
        new_mag = result['phot_g_mean_mag'].data
        new_parallax = result['parallax'].data
        new_distance = np.array([])
        for i in range(new_star_number):
            if new_designation[i][:-19:] == "4120379796005671808":
                print('4120379796005671808', new_ra[i], new_dec[i], new_mag[i])
            elif i < 10:
                print(f"{i:02d} {new_designation[i]} {new_ra[i]} {new_dec[i]} {new_mag[i]}")
            if np.isfinite(new_parallax[i]) and new_parallax[i] > 0:
                new_distance = np.append(new_distance, f"{top2digitsint(3261.57 / new_parallax[i])} ly")
            else:
                new_distance = np.append(new_distance, '--')
        # new_distance = np.where(np.logical_and(np.isfinite(new_parallax), new_parallax > 0), f"{top2digitsint(3261.57 / new_parallax)} 光年", '--')

        if len(self.designation) == 0:
            self.designation = new_designation
            self.ra = new_ra
            self.dec = new_dec
            self.mag = new_mag
            self.distance = new_distance
        else:
            self.designation = np.append(self.designation, new_designation)
            self.ra = np.append(self.ra, new_ra)
            self.dec = np.append(self.dec, new_dec)
            self.mag = np.append(self.mag, new_mag)
            self.distance = np.append(self.distance, new_distance)
        self.ax.scatter(self.ra, self.dec, s=self.a*(self.mag_limit-self.mag)**self.b+self.c, c='white')
        self.ax.scatter(self.ra_center, self.dec_center, s=3, c='red') # 中心の星を赤く表示
        self.star_number = len(self.ra)
        self.done_flag = len(self.dec_next_list) == 0
    
    def show_cursor_position(self, event):
        if event.inaxes:
            ra = event.xdata
            dec = event.ydata
            ra_str = f"{ra:.4f}"
            dec_str = f"{dec:.4f}"
            self.cursor_coord_text.set(f"R.A.: {ra_str}°, Dec.: {dec_str}° (J2000.0)")

    def show_star_info(self, event):
        if hasattr(self, "annotation"):
            self.annotation.remove()
            del self.annotation

        if event.inaxes != self.ax:
            return

        # カーソル位置
        x, y = event.xdata, event.ydata
        if x is None or y is None:
            return

        # 星との距離を計算
        dists = np.sqrt((self.ra - x)**2 + (self.dec - y)**2)
        min_idx = np.argmin(dists)
        min_dist = dists[min_idx]

        # しきい値（座標単位で0.02程度、調整可）
        if min_dist < 0.02:
            info = f"Gaia DR3: {self.designation[min_idx]}\nRA: {self.ra[min_idx]:.5f}\nDec: {self.dec[min_idx]:.5f}\nGmag: {self.mag[min_idx]:.2f}\nDistance: {self.distance[min_idx]}"
            self.annotation = self.ax.annotate(
                info,
                (self.ra[min_idx], self.dec[min_idx]),
                xytext=(10, 10),
                textcoords='offset points',
                color='yellow',
                bbox=dict(boxstyle="round,pad=0.3", fc="black", ec="yellow", lw=1),
                fontsize=10
            )
            self.fig.canvas.draw_idle()

    def set_horizons(self):
        self.horizons_btn_text.set('Setting...')
        self.radio_var.set(2)
        self.root.update()
        planet_name = self.planet_box.get()
        epoch = self.time_box.get()
        if planet_name in ['Pluto', 'pluto', '冥王星']:
            planet_name = 134340
        elif planet_name in ['Neptune', 'neptune', '海王星']:
            planet_name = 899
        elif planet_name in ['Uranus', 'uranus', '天王星']:
            planet_name = 799
        elif planet_name in ['Saturn', 'saturn', '土星']:
            planet_name = 699
        try:
            ans = Horizons(id=planet_name, location='500', epochs=f"'{epoch}'").ephemerides()
            self.ra_center = str(ans['RA'][0])
            self.dec_center = str(ans['DEC'][0])
            self.set_values()
            self.horizons_btn_text.set('Set')
            mb.showinfo('セットしたよ', '次の天体をセットしました：' + ans['targetname'][0] + '\n' + '時刻：' + epoch + '(世界時)')
        except ValueError as e:
            print('ValueError:', e)
            mb.showerror('エラー', '天体の一覧が表示されたときは名前の欄に左端の列の数字を入力してください\n' + str(traceback.format_exception_only(type(e), e)[0].rstrip('\n')))
        except:
            print('Unexpected error:', traceback.format_exc())
            self.asteroid_btn_text.set('Set')
            mb.showerror('エラー', '天体の一覧が表示されたときは名前の欄に左端の列の数字を入力してください\n' + str(traceback.format_exception_only(type(e), e)[0].rstrip('\n')))

    def change_time(self):
        self.time = self.time_box.get()
        self.set_horizons()

    def set_current_time(self):
        self.time_box.delete(0, tk.END)
        self.time_box.insert(tk.END, datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M:%S'))

    def preset_combo_select(self, event):
        name = self.preset_var.get()
        self.radio_var.set(1)
        if name == 'M 13':
            self.ra_center = 16.695 * 15
            self.ra_width = 0.2
            self.dec_center = 36.4614
            self.dec_width = 0.2
            self.mag_limit = 16
            self.set_values()
        elif name == 'ω Cen':
            self.ra_center = 13.4464 * 15
            self.ra_width = 0.4
            self.dec_center = -47.4794
            self.dec_width = 0.3
            self.mag_limit = 15
            self.set_values()
        elif name == 'プレアデス星団':
            self.ra_center = 3.7833 * 15
            self.ra_width = 1
            self.dec_center = 24.1167
            self.dec_width = 1
            self.mag_limit = 14
            self.set_values()
        elif name == 'T CrB':
            self.ra_center = 15.9862 * 15
            self.ra_width = 1
            self.dec_center = 25.9175
            self.dec_width = 1
            self.mag_limit = 14
            self.set_values()
    
    def save_image(self):
        if self.radio_var.get() == 0:
            defaultextension = f"ra{str(self.ra_center).replace('.', '_')}_dec{str(self.dec_center).replace('.', '_')}_mag{str(self.mag_limit).replace('.', '_')}.png"
        elif self.radio_var.get() == 1:
            defaultextension = f"{self.preset_var.get()}_mag{str(self.mag_limit).replace('.', '_')}.png"
        else:
            defaultextension = f"{self.planet_box.get()}_mag{str(self.mag_limit).replace('.', '_')}.png"

        file_path = fd.asksaveasfilename(
            defaultextension=defaultextension,
            filetypes=[("PNG画像", "*.png"), ("JPEG画像", "*.jpg"), ("PDFファイル", "*.pdf"), ("すべてのファイル", "*.*")]
        )
        if file_path:
            self.fig.savefig(file_path, facecolor=self.fig.get_facecolor())
    
    def open_planet_hint(self):
        root_planet_hint = tk.Tk()
        root_planet_hint.title('Object name hint')
        root_planet_hint.geometry("800x500+400+100")
        root_planet_hint.configure(bg="black")
        planet_hint_label = tk.Message(
            root_planet_hint,
            text="""
                ＜例＞\n
                天体名：Saturn, Uranus, Neptune, Neptune, Pluto, 土星, 天王星, 海王星, 冥王星, Ceres, Vesta, Pallas, ...\n
                小惑星番号：1 (=Ceres), 2 (=Vesta), 3 (=Pallas), 17656 (=Hayabusa), 134340 (=Pluto), ... (この書き方はたまに違う天体を指します)\n
                特別な番号：699 (=Saturn), 799 (=Uranus), 899 (=Neptune), ...\n
                彗星、探査機：Hayabusa (<-探査機), halley, C/2025 N1 (これは小文字だとエラー), ...\n
                setボタンを押すとエラーが出ていくつか候補が表示されたときは指示通りに番号を入力してください。
                周期彗星の場合は回帰ごとに区別します。Barycenterありとなしがあった場合はなしがおすすめです。
                詳しくは https://ssd.jpl.nasa.gov/horizons/app.html#/ のTarget Bodyの設定画面を参考にしてください。\n'
                名前を入力してsetボタンを押したら、ポップアップが出て座標が変わることを確認してください。
            """,
            fg='white',
            bg='black',
            width=600,
            justify=tk.LEFT,
            font=('Arial', 10)
        )
        planet_hint_label.pack()
        root_planet_hint.mainloop()
    
    def load_density(self):
        with open(os.path.join(os.path.dirname(__file__), 'density.txt'), 'r') as f:
            self.density = np.array([list(map(float, line.split(',')[:-1])) for line in f.readlines()])
    
    def estimate_star_number(self, rc, dc, rw, dw, mag_limit):
        if len(self.density) == 0:
            self.load_density()
        ra_index = int(rc)
        dec_index = int(dc + 90)
        star_number = self.density[dec_index, ra_index] * rw * dw * np.cos(dc * np.pi / 180) * 2.7 ** (mag_limit - 11.5)
        return star_number

def _destroyWindow():
    root.quit()
    root.destroy()
    sys.exit(0)

if __name__ == '__main__':
    root = tk.Tk()
    root.withdraw()
    
    # ウィンドウを閉じたときの処理を設定
    root.protocol('WM_DELETE_WINDOW', _destroyWindow)
    
    try:
        app = GaiaChartApp(root)
        root.deiconify()
        root.mainloop()
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        root.quit()
        root.destroy()
        sys.exit(1)