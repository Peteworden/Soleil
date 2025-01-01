import csv
import json

name_csv_path: str = "data/IAU_Star_Names.csv"
HIP_csv_path: str = "data/HIP_catalog.csv"

with open(name_csv_path, 'r') as name_csv:
    reader = csv.DictReader(name_csv)
    name = [row for row in reader]

with open(HIP_csv_path, 'r') as HIP_csv:
    reader = csv.DictReader(HIP_csv)
    HIP = [row for row in reader]

data: list = []


def binary_search(arr: list, target: int):
    left: int = 0
    right: int = len(arr) - 1
    while left <= right:
        mid: int = (left + right) // 2
        if int(arr[mid]['hip_number']) == target:
            return mid
        elif int(arr[mid]['hip_number']) > target:
            right = mid - 1
        else:
            left = mid + 1
    return -1


def hms2hm(hms: list[float]):
    h: int = int(hms[0])
    m: float = hms[1] + hms[2] / 60
    m = round(m, 1)
    if m >= 60:
        h += 1
        m -= 60
    if h > 24:
        h -= 24
    return str(h) + ' ' + str(m)


def dms2dm(dms: list[str]):
    d: int = int(dms[0])
    m: float = int(dms[1]) + float(dms[2]) / 60
    m = round(m, 1)
    if dms[0][0] == "-":
        if m >= 60:
            d -= 1
            m -= 60
        if d == 0:
            return '-' + str(d) + ' ' + str(m)
        else:
            return str(d) + ' ' + str(m)
    else:
        if m >= 60:
            d += 1
            m -= 60
        return str(d) + ' ' + str(m)


for i in range(len(name)):
    if name[i]['Japanese Name'] == '':
        continue
    row: int = binary_search(HIP, int(name[i]['HIP']))
    if row < 0:
        continue
    ra: str = hms2hm(list(map(float, HIP[row]['ra'].split(' '))))
    dec: str = dms2dm(list(HIP[row]['dec'].split(' ')))
    mag: int = round(float(HIP[row]['vmag']))
    if mag < 1:
        mag = 1
    d: dict = {'name': name[i]['Japanese Name'], 'ra': ra, 'dec': dec, 'tier': mag}
    data.append(d)

# print(data)

starname_json_path: str = 'data/starname.json'

with open(starname_json_path, 'w') as starname_json:
    json.dump(data, starname_json, indent=4, ensure_ascii=False)
