var content = '';
var xhrcheck = 0;
const filenames = 
["hip_65.txt",
"tycho2_100.txt",
"tycho2_100_helper.txt",
"tycho2_100-110.txt",
"tycho2_100-110_helper.txt",
"brights.txt",
"starname.json",
"messier.json",
"rec.json",
"ngc.txt",
"constellation.json",
"constellation_boundaries.txt",
"additional_objects.txt"];

function loadFile(filename) {
    var url_load = "https://peteworden.github.io/Soleil/data/" + filename;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url_load);
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            xhrcheck++;
            const fileBaseName = filename.split('.')[0];
            
            // JSONファイルの場合はパースしてから文字列化
            if (filename.endsWith('.json')) {
                try {
                    const jsonData = JSON.parse(xhr.responseText);
                    content += `${fileBaseName}::::${JSON.stringify(jsonData)}||||`;
                } catch (error) {
                    console.error(`Failed to parse JSON from ${filename}:`, error);
                }
            } else {
                // JSON以外はそのまま追加
                content += `${fileBaseName}::::${xhr.responseText}||||`;
            }
            
            // 全ファイルの読み込みが完了したらBlobを作成
            if (xhrcheck === filenames.length) {
                console.log("All files loaded:", xhrcheck);
                const blob = new Blob([content], { type: "text/plain" });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'allInOne.txt';
                link.click();
            }
            return 0;
        }
    };
}

for (var i=0; i<filenames.length; i++) {
    loadFile(filenames[i]);
}
