"""
Gaia Archive Chart - Streamlit版
Gaia Archiveのデータを用いて詳細な星図を作成するWebアプリケーション

使い方:
    streamlit run gaia_st.py

必要なライブラリ:
    pip install streamlit matplotlib astroquery numpy
"""

import streamlit as st
import streamlit.components.v1 as components
import matplotlib.pyplot as plt
from astroquery.gaia import Gaia
from astroquery.jplhorizons import Horizons
import numpy as np
from datetime import datetime, timedelta, timezone
import json
import os
import io

# ページ設定
st.set_page_config(
    page_title="Pete's Gaia Star Chart",
    page_icon="⭐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Google Analyticsの埋め込み関数
def inject_ga():
    # 自分の測定IDに書き換えてください
    GA_ID = "G-195DTNNGE6"
    
    ga_code = f"""
    <script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){{dataLayer.push(arguments);}}
        gtag('js', new Date());
        gtag('config', '{GA_ID}');
    </script>
    """
    
    # iframeとしてHTMLを埋め込む（height=0で隠す）
    components.html(ga_code, height=0, width=0)

# 実行
inject_ga()

# 言語辞書
TEXTS = {
    "ja": {
        "sidebar_title": "⭐ Pete's Gaia Star Chart",
        "mode_select": "モード選択",
        "mode_custom": "座標を指定",
        "mode_preset": "天体を選択",
        "mode_solar": "太陽系天体",
        "coordinate": "中心座標",
        "ra_input": "R.A. (度 or \"hh mm ss\")",
        "dec_input": "Dec. (度 or \"±dd mm ss\")",
        "set_coord": "座標を設定",
        "coord_set": "座標を設定しました",
        "coord_invalid": "座標の形式が無効です",
        "select_object": "天体を選択",
        "apply_preset": "プリセットを適用",
        "preset_set": "を設定しました",
        "messier_num": "メシエ番号 (1-110)",
        "set_messier": "メシエ天体を設定",
        "solar_settings": "太陽系天体設定",
        "object_name": "天体名",
        "time_ut": "時刻 (UT)",
        "input_example": "**入力例:** Saturn, Uranus, Neptune, Pluto, Ceres, Vesta, 彗星名など",
        "get_coord": "座標を取得",
        "fetching_horizons": "Horizonsから座標を取得中...",
        "coord_obtained": "の座標を取得しました",
        "error": "エラー",
        "detailed_settings": "詳細設定",
        "ra_width": "赤経の幅 (度)",
        "dec_width": "赤緯の幅 (度)",
        "mag_limit": "限界等級",
        "mag_limit_recommended": "(推奨: 15-18)",
        "estimated_stars": "推定星数: 約 {count} 星",
        "star_size_coeff": "星サイズパラメータ",
        "size_formula": "サイズ = a × (限界等級 - 等級)^b + c",
        "main_title": "🌟 Pete's Gaia Star Chart",
        "fov": "視野",
        "draw_chart": "🎨 星図を描画",
        "redraw_chart": "🔄 再描画（データ再取得）",
        "settings_changed": "データの再取得が必要です。",
        "can_filter": "既存データから表示できます。",
        "apply_view": "📍 表示を適用",
        "stop_fetch": "⏹️ 停止",
        "fetch_cancelled": "キャンセルしました。",
        "confirm_ok": "✅ OK（取得開始）",
        "confirm_cancel": "❌ キャンセル",
        "warning_many_stars": "約 {count} 星が見込まれます。取得に時間がかかる可能性があります。",
        "fetching_gaia": "Gaia Archiveからデータを取得中...",
        "stars_obtained": "✅ {count} 星を取得しました",
        "data_error": "データ取得エラー",
        "star_data": "📊 星データ ({count} 個)",
        "footer_star": "恒星データ",
        "footer_solar": "太陽系天体データ",
        "language": "言語 / Language",
        "wifi_recommended": "📶 Wi-Fi環境での利用をおすすめします。",
        "save_image": "💾 画像を保存",
    },
    "en": {
        "sidebar_title": "⭐ Pete's Gaia Star Chart",
        "mode_select": "Mode",
        "mode_custom": "Specify coordinates",
        "mode_preset": "Select object",
        "mode_solar": "Solar system",
        "coordinate": "Center Coordinate",
        "ra_input": "R.A. (deg or \"hh mm ss\")",
        "dec_input": "Dec. (deg or \"±dd mm ss\")",
        "set_coord": "Set coordinates",
        "coord_set": "Coordinates set",
        "coord_invalid": "Invalid coordinate format",
        "select_object": "Select object",
        "apply_preset": "Apply preset",
        "preset_set": " set",
        "messier_num": "Messier number (1-110)",
        "set_messier": "Set Messier object",
        "solar_settings": "Solar System Object",
        "object_name": "Object name",
        "time_ut": "Time (UT)",
        "input_example": "**Examples:** Saturn, Uranus, Neptune, Pluto, Ceres, Vesta, comet names, etc.",
        "get_coord": "Get coordinates",
        "fetching_horizons": "Fetching from Horizons...",
        "coord_obtained": " coordinates obtained",
        "error": "Error",
        "detailed_settings": "Detailed Settings",
        "ra_width": "R.A. Width (deg)",
        "dec_width": "Dec. Width (deg)",
        "mag_limit": "Limiting Mag.",
        "mag_limit_recommended": "(recommended: 15-18)",
        "estimated_stars": "Estimated: about {count} stars",
        "star_size_coeff": "Star Size Parameters",
        "size_formula": "Size = a × (limit mag - mag)^b + c",
        "main_title": "🌟 Pete's Gaia Star Chart",
        "fov": "Field of View",
        "draw_chart": "🎨 Draw star chart",
        "redraw_chart": "🔄 Redraw (refetch data)",
        "settings_changed": "Data refetch required.",
        "can_filter": "Can display from existing data.",
        "apply_view": "📍 Apply view",
        "stop_fetch": "⏹️ Stop",
        "fetch_cancelled": "Cancelled.",
        "confirm_ok": "✅ OK (Start fetch)",
        "confirm_cancel": "❌ Cancel",
        "warning_many_stars": "Estimated {count} stars. Fetching may take a while.",
        "fetching_gaia": "Fetching data from Gaia Archive...",
        "stars_obtained": "✅ {count} stars obtained",
        "data_error": "Data fetch error",
        "star_data": "📊 Star Data ({count} stars)",
        "footer_star": "Star data",
        "footer_solar": "Solar system data",
        "language": "言語 / Language",
        "wifi_recommended": "📶 Wi-Fi recommended",
        "save_image": "💾 Save image",
    }
}

# 言語設定の初期化
if 'lang' not in st.session_state:
    st.session_state.lang = "ja"

def t(key):
    """テキストを取得"""
    return TEXTS[st.session_state.lang].get(key, key)

# カスタムCSS
st.markdown("""
<style>
    .stApp {
        background-color: #0a0a0a;
    }
    .stSidebar {
        background-color: #1a1a1a;
    }
    h1, h2, h3, p, label {
        color: white !important;
    }
    .star-info {
        background-color: #1a1a1a;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #333;
    }
    /* ボタンのスタイル（控えめな色） */
    .stButton > button {
        background-color: #2d3748;
        color: #e2e8f0;
        border: 1px solid #4a5568;
    }
    .stButton > button:hover {
        background-color: #4a5568;
        border-color: #718096;
    }
    .stDownloadButton > button {
        background-color: #2d3748;
        color: #e2e8f0;
        border: 1px solid #4a5568;
    }
    .stDownloadButton > button:hover {
        background-color: #4a5568;
        border-color: #718096;
    }
    /* Metricの文字色を明るく */
    [data-testid="stMetricLabel"] {
        color: #ffffff !important;
    }
    [data-testid="stMetricValue"] {
        color: #ffffff !important;
    }
</style>
""", unsafe_allow_html=True)

# セッション状態の初期化
if 'ra' not in st.session_state:
    st.session_state.ra = np.empty(0)
    st.session_state.dec = np.empty(0)
    st.session_state.mag = np.empty(0)
    st.session_state.distance = np.empty(0)
    st.session_state.designation = np.empty(0)
    st.session_state.star_number = 0
    st.session_state.density = np.empty((0, 0))
    st.session_state.fig = None
    st.session_state.time_ut = datetime.now(timezone(timedelta(hours=0))).strftime('%Y-%m-%d %H:%M:%S')
    # 最後に描画したときの設定（表示用）
    st.session_state.last_ra_center = None
    st.session_state.last_dec_center = None
    st.session_state.last_ra_width = None
    st.session_state.last_dec_width = None
    st.session_state.last_mag_limit = None
    # データ取得時の設定（フィルタリング判定用）
    st.session_state.data_ra_center = None
    st.session_state.data_dec_center = None
    st.session_state.data_ra_width = None
    st.session_state.data_dec_width = None
    st.session_state.data_mag_limit = None
    # 処理中フラグ
    st.session_state.is_fetching = False
    st.session_state.cancel_requested = False
    # 確認待ちフラグ
    st.session_state.awaiting_confirmation = False

# 座標設定の初期化（モード変更しても保持される）
if 'ra_center' not in st.session_state:
    st.session_state.ra_center = "16 41 42"
    st.session_state.dec_center = "+36 27.7"
    st.session_state.ra_width = 0.2
    st.session_state.dec_width = 0.15
    st.session_state.mag_limit = 17.0

def load_density():
    """恒星密度データを読み込む"""
    density_path = os.path.join(os.path.dirname(__file__), 'density.txt')
    if os.path.exists(density_path):
        with open(density_path, 'r') as f:
            return np.array([list(map(float, line.split(',')[:-1])) for line in f.readlines()])
    return np.empty((0, 0))

def estimate_star_number(rc, dc, rw, dw, mag_limit, density):
    """推定星数を計算"""
    if len(density) == 0:
        return 0
    rc = parse_ra_to_deg(rc)
    dc = parse_dec_to_deg(dc)
    ra_index = int(rc) % 360
    dec_index = int(dc + 90)
    if dec_index < 0 or dec_index >= len(density):
        return 0
    if mag_limit < 11.5:
        star_number = density[dec_index, ra_index] * rw * dw * np.cos(dc * np.pi / 180) * 2.7 ** (mag_limit - 11.5)
    elif mag_limit < 16:
        star_number = density[dec_index, ra_index] * rw * dw * np.cos(dc * np.pi / 180) * 2.3 ** (mag_limit - 11.5)
    else:
        star_number = density[dec_index, ra_index] * rw * dw * np.cos(dc * np.pi / 180) * 2.0 ** (mag_limit - 11.5)
    return star_number

def parse_ra_to_deg(ra_str):
    """赤経文字列をパース"""
    if type(ra_str) == float:
        return ra_str
    ra_split = ra_str.split()
    if len(ra_split) == 1:
        return float(ra_split[0])
    elif len(ra_split) == 2:
        return 15 * float(ra_split[0]) + float(ra_split[1]) / 4
    elif len(ra_split) == 3:
        return 15 * float(ra_split[0]) + float(ra_split[1]) / 4 + float(ra_split[2]) / 240
    return 0

def parse_dec_to_deg(dec_str):
    """赤緯文字列をパース"""
    if type(dec_str) == float:
        return dec_str
    dec_split = dec_str.split()
    if len(dec_split) == 1:
        return float(dec_split[0])
    elif len(dec_split) == 2:
        if dec_str[0] != '-':
            return float(dec_split[0]) + float(dec_split[1]) / 60
        else:
            return float(dec_split[0]) - float(dec_split[1]) / 60
    elif len(dec_split) == 3:
        if dec_str[0] != '-':
            return float(dec_split[0]) + float(dec_split[1]) / 60 + float(dec_split[2]) / 3600
        else:
            return float(dec_split[0]) - float(dec_split[1]) / 60 - float(dec_split[2]) / 3600
    return 0

def parse_ra_to_hms(ra_deg):
    if type(ra_deg) == str:
        ra_deg = parse_ra_to_deg(ra_deg)
    h = int(ra_deg / 15)
    m = int((ra_deg % 15) * 4)
    s = int(((ra_deg % 15) * 4 - m) * 60)
    if s == 60:
        s = 0
        m += 1
    if m == 60:
        m = 0
        h += 1
    if h == 24:
        h = 0
    return f"{h}h {m}m {s}s"

def parse_dec_to_dms(dec_deg):
    if type(dec_deg) == str:
        dec_deg = parse_dec_to_deg(dec_deg)
    sign = "+" if dec_deg >= 0 else "-"
    abs_dec_deg = abs(dec_deg)
    d = int(abs_dec_deg)
    m = int((abs_dec_deg % 1) * 60)
    s = int(((abs_dec_deg % 1) * 60 - m) * 60)
    if s == 60:
        s = 0
        m += 1
    if m == 60:
        m = 0
        d += 1
    return f"{sign}{d}° {m}' {s}\""

def fetch_gaia_data(ra_center, dec_center, ra_width, dec_width, mag_limit):
    ra_center = parse_ra_to_deg(ra_center)
    dec_center = parse_dec_to_deg(dec_center)
    """Gaia Archiveからデータを取得"""
    query = f"""
    SELECT DESIGNATION, ra, dec, phot_g_mean_mag, parallax
    FROM gaiadr3.gaia_source 
    WHERE 1=CONTAINS(POINT('ICRS', ra, dec), BOX('ICRS', {ra_center}, {dec_center}, {ra_width}, {dec_width}))
    AND phot_g_mean_mag < {mag_limit}
    """
    job = Gaia.launch_job_async(query)
    result = job.get_results()
    return result

def topdigitsint(x, n = 2):
    """上位2桁に丸める"""
    digits = len(str(int(round(x))))
    if digits <= n:
        return int(round(x))
    else:
        return int(round(x, -digits+n))

def create_star_chart(ra_center, dec_center, ra_width, dec_width, mag_limit, a, b, c, ra, dec, mag):
    """星図を作成"""
    fig, ax = plt.subplots(figsize=(12, 8), facecolor='black')
    ax.set_facecolor('black')
    
    # 軸の設定
    ax.set_xlabel('Right Ascension (deg)', color='white')
    ax.set_ylabel('Declination (deg)', color='white')
    ax.spines['bottom'].set_color('white')
    ax.spines['top'].set_color('white')
    ax.spines['right'].set_color('white')
    ax.spines['left'].set_color('white')
    ax.tick_params(colors='white', which='both')
    ax.grid(True, alpha=0.3)
    
    # 範囲設定
    ra_center = parse_ra_to_deg(ra_center)
    dec_center = parse_dec_to_deg(dec_center)
    ax.set_xlim(ra_center + ra_width/2, ra_center - ra_width/2)
    ax.set_ylim(dec_center - dec_width/2, dec_center + dec_width/2)
    ax.set_aspect(1/np.cos(np.radians(dec_center)))
    
    # 星をプロット
    if len(ra) > 0:
        sizes = a * (mag_limit - mag) ** b + c
        ax.scatter(ra, dec, s=sizes, c='white', alpha=0.8)
    
    # 中心を赤く表示
    ax.scatter(ra_center, dec_center, s=10, c='red', marker='+')
    
    plt.tight_layout()
    return fig

def get_horizons_position(planet_name, epoch):
    """太陽系天体の位置を取得"""
    if planet_name.lower() in ['pluto', '冥王星']:
        planet_name = 134340
    elif planet_name.lower() in ['neptune', '海王星']:
        planet_name = 899
    elif planet_name.lower() in ['uranus', '天王星']:
        planet_name = 799
    elif planet_name.lower() in ['saturn', '土星']:
        planet_name = 699
    
    print(planet_name, epoch)
    ans = Horizons(id=planet_name, location='500', epochs=f"'{epoch}'").ephemerides()
    return ans['RA'][0], ans['DEC'][0], ans['targetname'][0]

# サイドバー
st.sidebar.title(t("sidebar_title"))

# 言語切り替え（JP/EN）
selected_lang = st.sidebar.radio(
    "",  # ラベルなし
    ["JP", "EN"],
    index=0 if st.session_state.lang == "ja" else 1,
    horizontal=True,
    label_visibility="collapsed"
)
new_lang = "ja" if selected_lang == "JP" else "en"
if new_lang != st.session_state.lang:
    st.session_state.lang = new_lang
    st.rerun()

# st.sidebar.markdown("---")

# 入力モード選択
mode_options = [t("mode_custom"), t("mode_preset"), t("mode_solar")]
mode = st.sidebar.radio(t("mode_select"), mode_options, index=0)

# 各モードのUI（ボタンを押したときのみ座標を更新）
if mode == t("mode_custom"):
    st.sidebar.subheader(t("coordinate"))
    ra_input = st.sidebar.text_input(t("ra_input"), str(st.session_state.ra_center))
    dec_input = st.sidebar.text_input(t("dec_input"), str(st.session_state.dec_center))
    
    if st.sidebar.button(t("set_coord"), type="primary", key="set_custom"):
        try:
            st.session_state.ra_center = parse_ra_to_deg(ra_input)
            st.session_state.dec_center = parse_dec_to_deg(dec_input)
            st.sidebar.success(t("coord_set"))
        except:
            st.sidebar.error(t("coord_invalid"))

elif mode == t("mode_preset"):
    preset = st.sidebar.selectbox(
        t("select_object"),
        ["M 13", "ω Cen", "Pleiades", "T CrB"]
    )
    
    presets = {
        "M 13": (16.695 * 15, 36.4614, 0.2, 0.2, 16),
        "ω Cen": (13.4464 * 15, -47.4794, 0.4, 0.3, 15),
        "Pleiades": (3.7833 * 15, 24.1167, 1, 1, 14),
        "T CrB": (15.9862 * 15, 25.9175, 1, 1, 14)
    }
    
    if st.sidebar.button(t("apply_preset"), type="primary", key="set_preset"):
        ra, dec, rw, dw, ml = presets[preset]
        st.session_state.ra_center = ra
        st.session_state.dec_center = dec
        st.session_state.ra_width = rw
        st.session_state.dec_width = dw
        st.session_state.mag_limit = ml
        st.sidebar.success(f"{preset}{t('preset_set')}")
    
    # メシエ天体入力
    # st.sidebar.markdown("---")
    messier_num = st.sidebar.number_input(t("messier_num"), min_value=1, max_value=110, value=13)
    if st.sidebar.button(t("set_messier"), type="primary", key="set_messier"):
        messier_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'messier.json')
        if os.path.exists(messier_path):
            with open(messier_path, 'r', encoding='utf-8') as f:
                messier_data = json.load(f)
            for item in messier_data:
                if item['name'] == f"M{messier_num}":
                    st.session_state.ra_center = round(float(item['ra'].split(' ')[0]) * 15 + float(item['ra'].split(' ')[1]) * 0.25, 4)
                    st.session_state.dec_center = round(abs(float(item['dec'].split(' ')[0])) + float(item['dec'].split(' ')[1]) / 60, 4) * (-1 if item['dec'][0] == '-' else 1)
                    st.sidebar.success(f"{item['name']}{t('preset_set')}")
                    break

elif mode == t("mode_solar"):
    st.sidebar.subheader(t("solar_settings"))
    planet_name = st.sidebar.text_input(t("object_name"), "Pluto")
    
    # 現在時刻をデフォルトに
    time_input = st.sidebar.text_input(t("time_ut"), st.session_state.time_ut, key="time_ut")
    
    st.sidebar.markdown(t("input_example"))
    
    if st.sidebar.button(t("get_coord"), type="primary", key="set_horizons"):
        try:
            with st.spinner(t("fetching_horizons")):
                ra, dec, target = get_horizons_position(planet_name, st.session_state.time_ut)
                st.session_state.ra_center = float(ra)
                st.session_state.dec_center = float(dec)
                st.sidebar.success(f"{target}{t('coord_obtained')}")
        except Exception as e:
            st.sidebar.error(f"{t('error')}: {str(e)}")

# 詳細設定
# st.sidebar.markdown("---")
st.sidebar.subheader(t("detailed_settings"))

# keyパラメータを使ってst.session_stateと連携
st.sidebar.number_input(t("ra_width"), min_value=0.01, max_value=10.0, step=0.1, key="ra_width")
st.sidebar.number_input(t("dec_width"), min_value=0.01, max_value=10.0, step=0.1, key="dec_width")
st.sidebar.number_input(f"{t('mag_limit')} {t('mag_limit_recommended')}", min_value=5.0, max_value=22.0, step=0.5, key="mag_limit")

# ローカル変数に代入（以降のコードで使用）
ra_center = st.session_state.ra_center
dec_center = st.session_state.dec_center
ra_width = st.session_state.ra_width
dec_width = st.session_state.dec_width
mag_limit = st.session_state.mag_limit

# 推定星数を表示
if len(st.session_state.density) == 0:
    st.session_state.density = load_density()

estimated = estimate_star_number(ra_center, dec_center, ra_width, dec_width, mag_limit, st.session_state.density)
if estimated > 0:
    st.sidebar.info(t("estimated_stars").format(count=f"{topdigitsint(estimated)}"))

st.sidebar.subheader(t("star_size_coeff"))
col1, col2, col3 = st.sidebar.columns(3) # 均等分割
a = col1.number_input("a", min_value=0.1, max_value=10.0, value=2.0, step=0.1)
b = col2.number_input("b", min_value=0.1, max_value=5.0, value=2.0, step=0.1)
c = col3.number_input("c", min_value=0.0, max_value=5.0, value=0.5, step=0.1)

st.sidebar.caption(t("size_formula"))

# メインエリア
st.title(t("main_title"))
# st.caption(t("wifi_recommended"))

# 設定が変わったかチェック
settings_changed = (
    st.session_state.last_ra_center is not None and
    (st.session_state.last_ra_center != ra_center or
     st.session_state.last_dec_center != dec_center or
     st.session_state.last_ra_width != ra_width or
     st.session_state.last_dec_width != dec_width or
     st.session_state.last_mag_limit != mag_limit)
)

# 星図の上に表示する情報（最後に描画した設定を使用）
if st.session_state.last_ra_center is not None:
    display_ra = st.session_state.last_ra_center
    display_dec = st.session_state.last_dec_center
    display_ra_width = st.session_state.last_ra_width
    display_dec_width = st.session_state.last_dec_width
    display_mag_limit = st.session_state.last_mag_limit
else:
    # まだ描画していない場合は現在の設定を表示
    display_ra = ra_center
    display_dec = dec_center
    display_ra_width = ra_width
    display_dec_width = dec_width
    display_mag_limit = mag_limit

# 現在の設定を表示（2行に分けて見切れを防止）
row1 = st.columns(2)
row1[0].metric("R.A. (J2000.0)", f"{parse_ra_to_hms(display_ra)}")
row1[1].metric("Dec. (J2000.0)", f"{parse_dec_to_dms(display_dec)}")

row2 = st.columns(2)
row2[0].metric(t("fov"), f"{display_ra_width:.2f}° × {display_dec_width:.2f}°")
row2[1].metric(t("mag_limit"), f"{display_mag_limit:.2f} mag")

# 既存データの範囲内かどうかを判定
def is_within_existing_data():
    """現在の設定が既存データの範囲内かどうかを判定"""
    if st.session_state.data_ra_center is None:
        return False
    
    # 既存データの範囲
    data_ra = parse_ra_to_deg(st.session_state.data_ra_center)
    data_dec = parse_dec_to_deg(st.session_state.data_dec_center)
    data_ra_min = data_ra - st.session_state.data_ra_width / 2
    data_ra_max = data_ra + st.session_state.data_ra_width / 2
    data_dec_min = data_dec - st.session_state.data_dec_width / 2
    data_dec_max = data_dec + st.session_state.data_dec_width / 2
    data_mag = st.session_state.data_mag_limit
    
    # 現在の設定の範囲
    setting_ra = parse_ra_to_deg(ra_center)
    setting_dec = parse_dec_to_deg(dec_center)
    setting_ra_min = setting_ra - ra_width / 2
    setting_ra_max = setting_ra + ra_width / 2
    setting_dec_min = setting_dec - dec_width / 2
    setting_dec_max = setting_dec + dec_width / 2
    
    # 現在の設定が既存データの範囲内かつ限界等級が同じか明るい場合はTrue
    return (setting_ra_min >= data_ra_min and 
            setting_ra_max <= data_ra_max and 
            setting_dec_min >= data_dec_min and 
            setting_dec_max <= data_dec_max and 
            mag_limit <= data_mag)

within_data = is_within_existing_data()

# 設定が変わっていて、かつ既存データの範囲外なら再取得が必要
needs_refetch = settings_changed and not within_data

# 星が多い場合の警告しきい値
WARNING_THRESHOLD = 5000

# ボタン表示エリア（st.emptyで動的に更新）
button_placeholder = st.empty()

# 確認待ち状態の場合
if st.session_state.awaiting_confirmation:
    with button_placeholder.container():
        st.warning(t("warning_many_stars").format(count=f"{topdigitsint(estimated)}"))
        col1, col2 = st.columns(2)
        with col1:
            if st.button(t("confirm_ok"), type="primary", use_container_width=True):
                st.session_state.awaiting_confirmation = False
                st.session_state.is_fetching = True
                st.rerun()
        with col2:
            if st.button(t("confirm_cancel"), type="secondary", use_container_width=True):
                st.session_state.awaiting_confirmation = False
                st.rerun()
# 処理中の場合
elif st.session_state.is_fetching:
    with button_placeholder.container():
        # 停止ボタンを表示
        if st.button(t("stop_fetch"), type="secondary", use_container_width=True):
            st.session_state.cancel_requested = True
            st.session_state.is_fetching = False
            st.info(t("fetch_cancelled"))
            st.rerun()
else:
    with button_placeholder.container():
        # 描画ボタンを表示
        if needs_refetch:
            draw_button = st.button(t("redraw_chart"), type="primary", use_container_width=True)
        else:
            draw_button = st.button(t("draw_chart"), type="primary", use_container_width=True)

# 描画ボタンが押された場合の処理
if not st.session_state.is_fetching and not st.session_state.awaiting_confirmation and 'draw_button' in dir() and draw_button:
    if within_data and st.session_state.star_number > 0:
        # 既存データの範囲内なら再取得せず、表示設定だけ更新
        st.session_state.last_ra_center = ra_center
        st.session_state.last_dec_center = dec_center
        st.session_state.last_ra_width = ra_width
        st.session_state.last_dec_width = dec_width
        st.session_state.last_mag_limit = mag_limit
        st.rerun()
    else:
        # 星が多い場合は確認を求める
        if estimated > WARNING_THRESHOLD:
            st.session_state.awaiting_confirmation = True
            st.rerun()
        else:
            # 処理開始
            st.session_state.is_fetching = True
            st.session_state.cancel_requested = False
            st.rerun()

# データ取得処理
if st.session_state.is_fetching and not st.session_state.awaiting_confirmation:
    with st.spinner(t("fetching_gaia")):
        try:
            result = fetch_gaia_data(ra_center, dec_center, ra_width, dec_width, mag_limit)
            
            # キャンセルされていたら破棄
            if st.session_state.cancel_requested:
                st.session_state.is_fetching = False
                st.info(t("fetch_cancelled"))
                st.rerun()
            
            designation = result['DESIGNATION'].data
            ra = result['ra'].data
            dec = result['dec'].data
            mag = result['phot_g_mean_mag'].data
            parallax = result['parallax'].data
            
            # 距離を計算
            distance = []
            for i in range(len(designation)):
                if np.isfinite(parallax[i]) and parallax[i] > 0:
                    distance.append(f"{topdigitsint(3261.57 / parallax[i])} ly")
                else:
                    distance.append('--')
            
            # セッション状態に保存（データは上書き）
            st.session_state.ra = ra
            st.session_state.dec = dec
            st.session_state.mag = mag
            st.session_state.distance = np.array(distance)
            st.session_state.designation = designation
            st.session_state.star_number = len(ra)
            
            # データ取得時の設定を保存
            st.session_state.data_ra_center = ra_center
            st.session_state.data_dec_center = dec_center
            st.session_state.data_ra_width = ra_width
            st.session_state.data_dec_width = dec_width
            st.session_state.data_mag_limit = mag_limit
            
            # 表示設定も保存
            st.session_state.last_ra_center = ra_center
            st.session_state.last_dec_center = dec_center
            st.session_state.last_ra_width = ra_width
            st.session_state.last_dec_width = dec_width
            st.session_state.last_mag_limit = mag_limit
            
            st.session_state.is_fetching = False
            st.success(t("stars_obtained").format(count=f"{len(ra):,}"))
            st.rerun()  # 表示を更新
            
        except Exception as e:
            st.session_state.is_fetching = False
            st.error(f"{t('data_error')}: {str(e)}")

# 星図を表示（表示設定に基づいてフィルタリング）
if st.session_state.star_number > 0 and st.session_state.last_ra_center is not None:
    # 表示範囲に基づいてフィルタリング
    last_ra = parse_ra_to_deg(st.session_state.last_ra_center)
    last_dec = parse_dec_to_deg(st.session_state.last_dec_center)
    ra_min = last_ra - st.session_state.last_ra_width / 2
    ra_max = last_ra + st.session_state.last_ra_width / 2
    dec_min = last_dec - st.session_state.last_dec_width / 2
    dec_max = last_dec + st.session_state.last_dec_width / 2
    mag_max = st.session_state.last_mag_limit
    
    # フィルタ条件
    mask = (
        (st.session_state.ra >= ra_min) & 
        (st.session_state.ra <= ra_max) & 
        (st.session_state.dec >= dec_min) & 
        (st.session_state.dec <= dec_max) & 
        (st.session_state.mag <= mag_max)
    )
    
    filtered_ra = st.session_state.ra[mask]
    filtered_dec = st.session_state.dec[mask]
    filtered_mag = st.session_state.mag[mask]
    filtered_designation = st.session_state.designation[mask]
    filtered_distance = st.session_state.distance[mask]
    
    fig = create_star_chart(
        st.session_state.last_ra_center, 
        st.session_state.last_dec_center, 
        st.session_state.last_ra_width, 
        st.session_state.last_dec_width, 
        st.session_state.last_mag_limit,
        a, b, c,
        filtered_ra, filtered_dec, filtered_mag
    )
    st.pyplot(fig)
    
    # 画像保存ボタン
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, facecolor='black', bbox_inches='tight')
    buf.seek(0)
    st.download_button(
        label=t("save_image"),
        data=buf,
        file_name="chart.png",
        mime="image/png",
        type="primary"
    )
    plt.close(fig)
    
    # 星のデータテーブル（フィルタリング後のデータ）
    with st.expander(t("star_data").format(count=f"{len(filtered_ra):,}")):
        import pandas as pd
        df = pd.DataFrame({
            'Designation': filtered_designation,
            'R.A. (deg)': filtered_ra,
            'Dec. (deg)': filtered_dec,
            'G mag': filtered_mag,
            'Distance': filtered_distance
        })
        st.dataframe(df, use_container_width=True)

# フッター
st.markdown("---")
st.markdown(f"""
<div style='text-align: center; color: #666;'>
    <p>Gaia Archive Chart - Streamlit ver.</p>
    <p>Author: Peteworden (<a href='https://github.com/Peteworden' target='_blank'>GitHub</a>)</p>
    <p>
        {t("footer_star")}: 
        <a href='https://gea.esac.esa.int/archive/' target='_blank'>Gaia Archive</a>
        (ESA, <a href='https://creativecommons.org/licenses/by-nc/3.0/igo/' target='_blank'>CC BY-NC 3.0 IGO</a>)
    </p>
    <p>{t("footer_solar")}: <a href='https://ssd.jpl.nasa.gov/horizons/' target='_blank'>Horizons System</a> (Jet Propulsion Laboratory)</p>
</div>
""", unsafe_allow_html=True)
