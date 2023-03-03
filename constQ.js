function RandomImage(){
var num = Math.floor( Math.random() * 89 ) + 1;

const ryaku = ["And", "Ant", "Aps", "Aql", "Aqr", "Ara", "Ari", "Aur", "Boo", "Cae", "Cam", "Cap", "Car", "Cas", "Cen", "Cep", "Cet", "Cha", "Cir", "CMa", "CMi", "Cnc", "Col", "Com", "CrA", "CrB", "Crt", "Cru", "Crv", "CVn", "Cyg", "Del", "Dor", "Dra", "Equ", "Eri", "For", "Gem", "Gru", "Her", "Hor", "Hya", "Hyi", "Ind", "Lac", "Leo", "Lep", "Lib", "LMi", "Lup", "Lyn", "Lyr", "Men", "Mic", "Mon", "Mus", "Nor", "Oct", "Oph", "Ori", "Pav", "Peg", "Per", "Phe", "Pic", "PsA", "Psc", "Pup", "Pyx", "Ret", "Scl", "Sco", "Sct", "Ser", "Ser", "Sex", "Sge", "Sgr", "Tau", "Tel", "TrA", "Tri", "Tuc", "UMa", "UMi", "Vel", "Vir", "Vol", "Vul"];

const eng = ["Andromeda", "Antlia", "Apus", "Aquila", "Aquarius", "Ara", "Aries", "Auriga", "Bootes", "Caelum", "Camelopardalis", "Capricornus", "Carina", "Cassiopeia", "Centaurus", "Cepheus", "Cetus", "Chamaeleon", "Circinus", "Canis Major", "Canis Minor", "Cancer", "Columba", "Coma Berenices", "Corona Australis", "Corona Borealis", "Crater", "Crux", "Corvus", "Canes Venatici", "Cygnus", "Delphinus", "Dorado", "Draco", "Equuleus", "Eridanus", "Fornax", "Gemini", "Grus", "Hercules", "Horologium", "Hydra", "Hydrus", "Indus", "Lacerta", "Leo", "Lepus", "Libra", "Leo Minor", "Lupus", "Lynx", "Lyra", "Mensa", "Microscopium", "Monoceros", "Musca", "Norma", "Octans", "Ophiuchus", "Orion", "Pavo", "Pegasus", "Perseus", "Phoenix", "Pictor", "Piscis Austrinus", "Pisces", "Puppis", "Pyxis", "Reticulum", "Sculptor", "Scorpius", "Scutum", "Serpens(Caput)", "Serpens(Cauda)", "Sextans", "Sagitta", "Sagittarius", "Taurus", "Telescopium", "Triangulum Australe", "Triangulum", "Tucana", "Ursa Major", "Ursa Minor", "Vela", "Virgo", "Volans", "Vulpecula"];

const jpn = ["アンドロメダ", "ポンプ", "ふうちょう", "わし", "みずがめ", "さいだん", "おひつじ", "ぎょしゃ", "うしかい", "ちょうこくぐ", "きりん", "やぎ", "りゅうこつ", "カシオペヤ", "ケンタウルス", "ケフェウス", "くじら", "カメレオン", "コンパス", "おおいぬ", "こいぬ", "かに", "はと", "かみのけ", "みなみのかんむり", "かんむり", "コップ", "みなみじゅうじ", "からす", "りょうけん", "はくちょう", "いるか", "かじき", "りゅう", "こうま", "エリダヌス", "ろ", "ふたご", "つる", "ヘルクレス", "とけい", "うみへび", "みずへび", "インディアン", "とかげ", "しし", "うさぎ", "てんびん", "こじし", "おおかみ", "やまねこ", "こと", "テーブルさん", "けんびきょう", "いっかくじゅう", "はえ", "じょうぎ", "はちぶんぎ", "へびつかい", "オリオン", "くじゃく", "ペガスス", "ペルセウス", "ほうおう", "がか", "みなみのうお", "うお", "とも", "らしんばん", "レチクル", "ちょうこくしつ", "さそり", "たて", "へび(頭)", "へび(尾)", "ろくぶんぎ", "や", "いて", "おうし", "ぼうえんきょう", "みなみのさんかく", "さんかく", "きょしちょう", "おおぐま", "こぐま", "ほ", "おとめ", "とびうお", "こぎつね"];

document.getElementById('eid_date').innerHTML = ryaku[num-1] + '    ' + eng[num-1] + '    ' + jpn[num-1] + '座';
switch(num){
  case 1:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_1.png">';
    break;
  case 2:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_2.png">';
    break;
  case 3:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_3.png">';
    break;
  case 4:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_4.png">';
    break;
  case 5:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_5.png">';
    break;
  case 6:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_6.png">';
    break;
  case 7:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_7.png">';
    break;
  case 8:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_8.png">';
    break;
  case 9:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_9.png">';
    break;
  case 10:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_10.png">';
    break;
  case 11:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_11.png">';
    break;
  case 12:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_12.png">';
    break;
  case 13:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_13.png">';
    break;
  case 14:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_14.png">';
    break;
  case 15:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_15.png">';
    break;
  case 16:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_16.png">';
    break;
  case 17:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_17.png">';
    break;
  case 18:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_18.png">';
    break;
  case 19:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_19.png">';
    break;
  case 20:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_20.png">';
    break;
  case 21:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_21.png">';
    break;
  case 22:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_22.png">';
    break;
  case 23:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_23.png">';
    break;
  case 24:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_24.png">';
    break;
  case 25:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_25.png">';
    break;
  case 26:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_26.png">';
    break;
  case 27:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_27.png">';
    break;
  case 28:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_28.png">';
    break;
  case 29:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_29.png">';
    break;
  case 30:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_30.png">';
    break;
  case 31:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_31.png">';
    break;
  case 32:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_32.png">';
    break;
  case 33:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_33.png">';
    break;
  case 34:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_34.png">';
    break;
  case 35:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_35.png">';
    break;
  case 36:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_36.png">';
    break;
  case 37:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_37.png">';
    break;
  case 38:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_38.png">';
    break;
  case 39:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_39.png">';
    break;
  case 40:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_40.png">';
    break;
  case 41:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_41.png">';
    break;
  case 42:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_42.png">';
    break;
  case 43:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_43.png">';
    break;
  case 44:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_44.png">';
    break;
  case 45:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_45.png">';
    break;
  case 46:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_46.png">';
    break;
  case 47:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_47.png">';
    break;
  case 48:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_48.png">';
    break;
  case 49:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_49.png">';
    break;
  case 50:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_50.png">';
    break;
  case 51:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_51.png">';
    break;
  case 52:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_52.png">';
    break;
  case 53:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_53.png">';
    break;
  case 54:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_54.png">';
    break;
  case 55:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_55.png">';
    break;
  case 56:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_56.png">';
    break;
  case 57:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_57.png">';
    break;
  case 58:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_58.png">';
    break;
  case 59:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_59.png">';
    break;
  case 60:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_60.png">';
    break;
  case 61:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_61.png">';
    break;
  case 62:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_62.png">';
    break;
  case 63:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_63.png">';
    break;
  case 64:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_64.png">';
    break;
  case 65:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_65.png">';
    break;
  case 66:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_66.png">';
    break;
  case 67:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_67.png">';
    break;
  case 68:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_68.png">';
    break;
  case 69:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_69.png">';
    break;
  case 70:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_70.png">';
    break;
  case 71:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_71.png">';
    break;
  case 72:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_72.png">';
    break;
  case 73:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_73.png">';
    break;
  case 74:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_74.png">';
    break;
  case 75:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_75.png">';
    break;
  case 76:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_76.png">';
    break;
  case 77:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_77.png">';
    break;
  case 78:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_78.png">';
    break;
  case 79:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_79.png">';
    break;
  case 80:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_80.png">';
    break;
  case 81:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_81.png">';
    break;
  case 82:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_82.png">';
    break;
  case 83:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_83.png">';
    break;
  case 84:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_84.png">';
    break;
  case 85:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_85.png">';
    break;
  case 86:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_86.png">';
    break;
  case 87:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_87.png">';
    break;
  case 88:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_88.png">';
    break;
  case 89:
    document.getElementById('eid_image').innerHTML = '<img src="image/img_89.png">';
    break;
}
}
function Seigo(){
const textbox = document.getElementById("kaito");
var ans = textbox.value;
RandomImage();
}
