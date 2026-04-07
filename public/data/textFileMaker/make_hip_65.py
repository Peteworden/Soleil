import os
file_path = os.path.abspath(__file__)
current_directory_path = os.path.dirname(file_path)
parent_directory_path = os.path.dirname(current_directory_path)
hip_path = os.path.join(parent_directory_path, 'hip_65.txt')

with open(hip_path, 'r', encoding='utf-8') as f:
    content = f.read().split(',')
text = [0] * len(content)
for i in range(0, len(content), 4):
    text[i] = int(float(content[i]) * 100)
    text[i+1] = int(float(content[i+1]) * 100)
    text[i+2] = int(float(content[i+2]) * 10)
    if content[i+3] == 'nodata':
        text[i+3] = 90
    else:
        text[i+3] = int(float(content[i+3]) * 10)
text = ','.join(list(map(str, text)))
with open(os.path.join(parent_directory_path, 'hip_65_test.txt'), 'w', encoding='utf-8') as nf:
    nf.write(text)