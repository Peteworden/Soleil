/**
 * テキストフォーマット用のユーティリティ関数
 * ギリシャ文字と上付き添え字の表示をサポート
 */
// ギリシャ文字のマッピング
const greekLetters = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'epsilon': 'ε',
    'zeta': 'ζ', 'eta': 'η', 'theta': 'θ', 'iota': 'ι', 'kappa': 'κ',
    'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ', 'omicron': 'ο',
    'pi': 'π', 'rho': 'ρ', 'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ',
    'phi': 'φ', 'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
    // 大文字
    'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ', 'Epsilon': 'Ε',
    'Zeta': 'Ζ', 'Eta': 'Η', 'Theta': 'Θ', 'Iota': 'Ι', 'Kappa': 'Κ',
    'Lambda': 'Λ', 'Mu': 'Μ', 'Nu': 'Ν', 'Xi': 'Ξ', 'Omicron': 'Ο',
    'Pi': 'Π', 'Rho': 'Ρ', 'Sigma': 'Σ', 'Tau': 'Τ', 'Upsilon': 'Υ',
    'Phi': 'Φ', 'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω'
};
const greekAbbrs = {
    'Alp': 'α', 'Bet': 'β', 'Gam': 'γ', 'Del': 'δ', 'Eps': 'ε',
    'Zet': 'ζ', 'Eta': 'η', 'The': 'θ', 'Iot': 'ι', 'Kap': 'κ',
    'Lam': 'λ', 'Mu': 'μ', 'Nu': 'ν', 'Xi': 'ξ', 'Omc': 'ο',
    'Pi': 'π', 'Rho': 'ρ', 'Sig': 'σ', 'Tau': 'τ', 'Ups': 'υ',
    'Phi': 'φ', 'Chi': 'χ', 'Psi': 'ψ', 'Ome': 'ω'
};
// 上付き添え字のマッピング
const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
};
/**
 * テキスト内のギリシャ文字と上付き添え字を適切にフォーマットする
 * @param text フォーマットするテキスト
 * @returns フォーマットされたテキスト
 */
export function formatText(text) {
    if (!text)
        return text;
    let formatted = text;
    // ギリシャ文字の変換
    // パターン: {alpha}, {beta} など
    formatted = formatted.replace(/\{(\w+)\}/g, (match, letter) => {
        const lowerLetter = letter.toLowerCase();
        return greekLetters[lowerLetter] || greekLetters[letter] || match;
    });
    // 上付き添え字の変換
    // パターン: ^1, ^2, ^n など
    formatted = formatted.replace(/\^([0-9+\-=()nixyz])/g, (match, char) => {
        return superscripts[char] || char;
    });
    return formatted;
}
/**
 * ベイヤー記号を適切にフォーマットする
 * @param bayer ベイヤー記号（例: "alpha", "beta1", "gamma2"）
 * @param bayerNum ベイヤー番号（オプション）
 * @returns フォーマットされたベイヤー記号
 */
export function formatBayerDesignation(bayer, bayerNum) {
    if (!bayer)
        return '';
    // 直接ギリシャ文字を取得（formatTextを使わない）
    const greekLetter = greekAbbrs[bayer] || greekLetters[bayer] || bayer;
    // ベイヤー番号がある場合は上付き添え字で追加
    if (bayerNum !== undefined && bayerNum > 0) {
        const numStr = bayerNum.toString();
        const superscriptNum = numStr.split('').map(digit => superscripts[digit] || digit).join('');
        return greekLetter + superscriptNum;
    }
    return greekLetter;
}
/**
 * フレームスティード番号を適切にフォーマットする
 * @param flam フレームスティード番号
 * @returns フォーマットされたフレームスティード番号
 */
export function formatFlamsteedNumber(flam) {
    if (flam === undefined || flam <= 0)
        return '';
    const numStr = flam.toString();
    return numStr.split('').map(digit => superscripts[digit] || digit).join('');
}
/**
 * HTML用にエスケープされたテキストをフォーマットする
 * @param text フォーマットするテキスト
 * @returns HTMLエスケープされたフォーマット済みテキスト
 */
export function formatTextForHTML(text) {
    const formatted = formatText(text);
    // HTMLエスケープ
    return formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
/**
 * Canvas用にテキストをフォーマットする（HTMLエスケープなし）
 * @param text フォーマットするテキスト
 * @returns フォーマットされたテキスト
 */
export function formatTextForCanvas(text) {
    return formatText(text);
}
//# sourceMappingURL=textFormatter.js.map