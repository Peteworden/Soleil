# 2025/09/03

import numpy as np
import matplotlib.pyplot as plt

##########################変数設定ここから##########################

# 出力ファイル名
file_name = "3dAsterism.png"

# https://heasarc.gsfc.nasa.gov/db-perl/W3Browse/w3table.pl?tablehead=name%3Dhipnewcat&Action=More+Options
# name, ra, dec, parallax, hip_magだけにチェックを入れ、一番下から3行目のOutput formatでpure textを選択し、start search
# Query Termsで領域などを指定
# 「a .. b」:aからb 度で指定する場合は小数点必須
# 例：ra:75. .. 90. dec:-10. .. 10. hip_mag<3.0
# 下を参考に貼り付けて、不要な星を取り除く
asterism_base = """
|HIP 24436|05 14 32.2713|-08 12 05.903|    3.78| 0.1930|
|HIP 27989|05 55 10.2892|+07 24 25.332|    6.55| 0.4997|
|HIP 25336|05 25 07.8680|+06 20 59.044|   12.92| 1.5493|
|HIP 26311|05 36 12.8125|-01 12 06.902|    1.65| 1.6235|
|HIP 26727|05 40 45.5248|-01 56 33.283|    4.43| 1.6812|
|HIP 27366|05 47 45.3880|-09 40 10.567|    5.04| 2.0065|
|HIP 25930|05 32 00.3997|-00 17 56.736|    4.71| 2.1361|
"""

# 星座線 何番目の星と何番目の星を結ぶか
asterism_lines = np.array([
    [0, 6], [6, 2], [2, 1], [1, 4], [4, 5], [5, 0], [6, 3], [3, 4]
])

ra_range = [75, 90]
dec_range = [-10, 10]
dist_range = [0.05, 0.7] # [距離(kpc)の最小値より小さい値, 距離の最大値ぐらい]

# 回転角度(rad)
# azmだけ時計回りに回し、altだけ上から見る
azm = 0.35
alt = 0.15

# 遠近法の設定
# focal_lengthを小さくすると遠近感が強くなる
# z_offsetはカメラの距離のようなもので、小さくすると遠近感が強くなる
# z_showをtrueにすると表示される黄色い数字は計算の最後にz_offsetを足している。この数字が正になるようにz_offsetを調整する
focal_length = 0.03
z_offset = 0.5
z_show = False

text_dx = -0.0004
text_dy = 0.0002

asterism_line_width = 1.0
asterism_line_alpha = 0.5
asterism_line_style = "-"
distance_line_width = 1.0
distance_line_alpha = 0.5
distance_line_style = "--"
flame_line_width = 1.0
flame_line_alpha = 0.5
flame_line_style = "-"

distance_text_size = 10

show_flame = True
show_earth = True
asterism_star_color = "red"
distance_star_color = "white"

def mag_to_size(mag):
    return 10 ** (-0.3 * (mag - 4))

##########################変数設定ここまで##########################

# center = np.array([(ra_range[0] + ra_range[1]) / 2, (dec_range[0] + dec_range[1]) / 2])
center = np.array([80, 0])

def ra_deg(ra):
    ra = list(map(float, ra.split(' ')))
    return ra[0] * 15 + ra[1] * 0.25 + ra[2] / 240
def dec_deg(dec):
    dec_sign = 1 if dec[0] == '+' else -1
    dec = list(map(float, dec.split(' ')))
    dec_abs = abs(dec[0]) + dec[1] / 60 + dec[2] / 3600
    return dec_sign * dec_abs

# ra, dec, distance, mag, color
asterism = np.empty((0, 4))
for line in asterism_base.split('\n'):
    if line.strip() == '':
        continue
    line = line.split('|')
    asterism = np.append(asterism, np.array([[ra_deg(line[2]), dec_deg(line[3]), 1.0 / float(line[4]), float(line[5])]]), axis=0)
print(asterism)

# x: dec方向
# y: -ra方向
# z: dist方向
def xyz_centerize(ra, dec, dist):
    ra_rad = ra * np.pi / 180
    dec_rad = dec * np.pi / 180
    center_rad = np.radians(center)
    x = dist * np.cos(dec_rad) * np.cos(ra_rad - center_rad[0])
    y = dist * np.cos(dec_rad) * np.sin(ra_rad - center_rad[0])
    z = dist * np.sin(dec_rad)
    # y軸周りにcenter_rad[1]回転
    z = z * np.cos(center_rad[1]) - x * np.sin(center_rad[1])
    x = z * np.sin(center_rad[1]) + x * np.cos(center_rad[1])
    return np.array([z, -y, x])

def rotation(xyz):
    x = xyz[0]
    y = xyz[1]
    z = xyz[2] - (dist_range[0] + dist_range[1]) / 2
    # y軸周りにalt回転
    z = z * np.cos(alt) - x * np.sin(alt)
    x = z * np.sin(alt) + x * np.cos(alt)
    # x軸まわりにazm回転
    y = y * np.cos(azm) - z * np.sin(azm)
    z = y * np.sin(azm) + z * np.cos(azm)
    return np.array([x, y, z+z_offset])

def perspective_projection(xyz, focal_length=focal_length):
    if xyz[2] <= 0:  # カメラの後ろにある場合は非表示
        return None

    scale = focal_length / (focal_length + xyz[2])
    x_2d = xyz[0] * scale
    y_2d = xyz[1] * scale
    return np.array([y_2d, x_2d, scale])

# 実際の絶対等級+5
def absmag(mag, dist):
    return mag + 5 - 5 * np.log10(dist*1000) + 5

vertices = np.array([
    xyz_centerize(ra_range[0], dec_range[0], dist_range[0]),
    xyz_centerize(ra_range[1], dec_range[0], dist_range[0]),
    xyz_centerize(ra_range[1], dec_range[1], dist_range[0]),
    xyz_centerize(ra_range[0], dec_range[1], dist_range[0]),
    xyz_centerize(ra_range[0], dec_range[0], dist_range[1]),
    xyz_centerize(ra_range[1], dec_range[0], dist_range[1]),
    xyz_centerize(ra_range[1], dec_range[1], dist_range[1]),
    xyz_centerize(ra_range[0], dec_range[1], dist_range[1]),
])

back_edges = np.array([
    [vertices[0], vertices[1]],
    [vertices[1], vertices[2]],
    [vertices[2], vertices[3]],
    [vertices[3], vertices[0]],
    [vertices[4], vertices[5]],
    [vertices[5], vertices[6]],
    [vertices[6], vertices[7]],
    [vertices[7], vertices[4]],
    [vertices[0], vertices[4]],
    [vertices[1], vertices[5]],
    [vertices[2], vertices[6]],
    [vertices[3], vertices[7]]
])

fig = plt.figure(figsize=(10, 6), facecolor="black")
ax = fig.add_subplot(111)
plt.rcParams['font.family'] = 'MS Gothic'

earth = xyz_centerize(center[0], center[1], 0)
earth_rot = rotation(earth)
earth_proj = perspective_projection(earth_rot)
if earth_proj is not None:
    ax.scatter(earth_proj[0], earth_proj[1], s=30, color="#00ffff")
    ax.text(earth_proj[0]+text_dx, earth_proj[1]+text_dy, "地球", color='white', fontsize=10)
else:
    print(f"z_offsetを{z_offset-earth_rot[2]}より大きくしてください")

for line in asterism_lines:
    star1 = asterism[line[0]]
    star2 = asterism[line[1]]
    xyz1 = xyz_centerize(star1[0], star1[1], dist_range[0])
    xyz2 = xyz_centerize(star2[0], star2[1], dist_range[0])
    xyz1 = rotation(xyz1)
    xyz2 = rotation(xyz2)
    proj1 = perspective_projection(xyz1)
    proj2 = perspective_projection(xyz2)
    if proj1 is not None and proj2 is not None:
        ax.plot([proj1[0], proj2[0]], [proj1[1], proj2[1]], color="white", linewidth=1.0, alpha=0.5, zorder=1)
    else:
        print(f"z_offsetを{z_offset-min(xyz1[2], xyz2[2])}より大きくしてください")
    xyz1 = xyz_centerize(star1[0], star1[1], star1[2])
    xyz2 = xyz_centerize(star2[0], star2[1], star2[2])
    xyz1 = rotation(xyz1)
    xyz2 = rotation(xyz2)
    proj1 = perspective_projection(xyz1)
    proj2 = perspective_projection(xyz2)
    if proj1 is not None and proj2 is not None:
        ax.plot([proj1[0], proj2[0]], [proj1[1], proj2[1]], color="white", linewidth=asterism_line_width, alpha=asterism_line_alpha, zorder=1)
    else:
        print(f"z_offsetを{z_offset-min(xyz1[2], xyz2[2])}より大きくしてください")

for star in asterism:
    xyz0 = xyz_centerize(star[0], star[1], dist_range[0])
    xyz = xyz_centerize(star[0], star[1], star[2])
    xyz0_rot = rotation(xyz0)
    xyz_rot = rotation(xyz)
    proj0 = perspective_projection(xyz0_rot)
    proj = perspective_projection(xyz_rot)
    
    if proj0 is not None and proj is not None:
        star_size = mag_to_size(star[3])
        star_size_abs = mag_to_size(absmag(star[3], star[2]))
        ax.plot([proj0[0], proj[0]], [proj0[1], proj[1]], color="gray", linewidth=distance_line_width, alpha=distance_line_alpha, linestyle=distance_line_style, zorder=0)
        ax.scatter(proj0[0], proj0[1], s=star_size, color=asterism_star_color, zorder=5)
        ax.scatter(proj[0], proj[1], s=star_size_abs, color=distance_star_color, zorder=5)
        ax.text(proj[0]+text_dx, proj[1]+text_dy, str(int(round(star[2]*3262, 0)))+"光年", color='white', fontsize=distance_text_size)
        if z_show:
            ax.text(proj[0]+text_dx, proj[1]+text_dy, str(round(xyz[2], 2)), color='yellow', fontsize=7)
    else:
        print(f"z_offsetを{z_offset-min(xyz0[2], xyz[2])}より大きくしてください")

if show_flame:
    for line in back_edges:
        xyz1 = rotation(line[0])
        xyz2 = rotation(line[1])
        proj1 = perspective_projection(xyz1)
        proj2 = perspective_projection(xyz2)
        
        if proj1 is not None and proj2 is not None:
            ax.plot([proj1[0], proj2[0]], [proj1[1], proj2[1]], color='gray', linewidth=flame_line_width, alpha=flame_line_alpha, linestyle=flame_line_style, zorder=0)
            if z_show:
                ax.text(proj1[0]+text_dx, proj1[1]+text_dy, str(round(xyz1[2], 2)), color='yellow', fontsize=7)
                ax.text(proj2[0]+text_dx, proj2[1]+text_dy, str(round(xyz2[2], 2)), color='yellow', fontsize=7)
        else:
            print(f"z_offsetを{z_offset-min(xyz1[2], xyz2[2])}より大きくしてください")

fig.text(0.99, 0.01, "改訂版ヒッパルコス星表（F. van Leeuwen, 2007）をもとに作成", color="white", fontsize=10, ha='right', va='bottom')
ax.axis('off')
ax.set_aspect('equal')
plt.tight_layout()
plt.savefig(file_name, facecolor="black", dpi=300)
plt.show()
