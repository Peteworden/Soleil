// StarsProgram
// 目的: WebGL2で星を点スプライトとして描画する最小プログラム
// 入力: interleaved配列 [xNdc, yNdc, magnitude]×N （x,yはNDC座標）
// 出力: 加算ブレンドで丸い点を描画（明るい星ほど大きく/濃く）
export class StarsProgram {
    // シェーダのコンパイル/リンク、VAO/VBOの初期化を行う
    constructor(gl) {
        this.vao = null;
        this.vbo = null;
        this.aPositionLoc = -1;
        this.aMagLoc = -1;
        this.uPointScaleLoc = null;
        this.uColorLoc = null;
        this.gl = gl;
        const vertSrc = `#version 300 es\n
            layout(location=0) in vec2 a_position; // NDC (-1..1)
            layout(location=1) in float a_mag;     // magnitude
            uniform float u_pointScale;            // pixels per point at mag=0
            out float v_alpha;
            void main(){
                gl_Position = vec4(a_position, 0.0, 1.0);
                // Simple size curve: brighter (smaller mag) => larger size
                float size = max(1.0, u_pointScale * pow(max(0.0001, 1.0 - clamp(a_mag, 0.0, 15.0)/15.0), 1.6));
                gl_PointSize = size;
                // Alpha based on size as well
                v_alpha = clamp(size / (u_pointScale + 1.0), 0.8, 1.0);
            }
        `;
        const fragSrc = `#version 300 es\n
            precision mediump float;
            in float v_alpha;
            uniform vec3 u_color;
            out vec4 outColor;
            void main(){
                // Circular point sprite with soft edge
                vec2 uv = gl_PointCoord * 2.0 - 1.0;
                float r2 = dot(uv, uv);
                if (r2 > 1.0) discard;
                float alpha = (1.0 - smoothstep(0.7, 1.0, sqrt(r2))) * v_alpha;
                outColor = vec4(u_color, alpha);
            }
        `;
        const vs = this.createShader(this.gl.VERTEX_SHADER, vertSrc);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fragSrc);
        this.program = this.createProgram(vs, fs);
        this.aPositionLoc = 0; // bound via layout(location=0)
        this.aMagLoc = 1; // bound via layout(location=1)
        this.uPointScaleLoc = this.gl.getUniformLocation(this.program, 'u_pointScale');
        this.uColorLoc = this.gl.getUniformLocation(this.program, 'u_color');
        // 頂点配列/バッファの作成とレイアウト設定（位置2要素+等級1要素）
        this.vao = this.gl.createVertexArray();
        this.vbo = this.gl.createBuffer();
        this.gl.bindVertexArray(this.vao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        // Interleaved: vec2 position, float mag
        const stride = (2 + 1) * 4;
        this.gl.enableVertexAttribArray(this.aPositionLoc);
        this.gl.vertexAttribPointer(this.aPositionLoc, 2, this.gl.FLOAT, false, stride, 0);
        this.gl.enableVertexAttribArray(this.aMagLoc);
        this.gl.vertexAttribPointer(this.aMagLoc, 1, this.gl.FLOAT, false, stride, 8);
        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
    // 星データをGPUに送り、加算ブレンドで点群を描画する
    draw(pointsInterleaved, count, pointScalePx, color) {
        const gl = this.gl;
        if (!this.vao || !this.vbo)
            return;
        //描画で使うシェーダプログラムを選択
        gl.useProgram(this.program);
        //頂点属性レイアウト（a_position, a_magなどの割り当て）をまとめて有効化
        gl.bindVertexArray(this.vao);
        //頂点データを入れるVBOを対象にする
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        //インターリーブ済み配列（[xNdc, yNdc, mag, ...]）をGPUに転送
        //DYNAMIC_DRAWはフレーム毎に更新されるということ。差分更新にするとGC/転送コストを削減できる
        gl.bufferData(gl.ARRAY_BUFFER, pointsInterleaved, gl.DYNAMIC_DRAW);
        //加算合成
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        //3D点群の前後関係を深度バッファで遮らない。重ね順はブレンドで表現
        gl.disable(gl.DEPTH_TEST);
        //uPointScale: シェーダ側でgl_PointSize（点サイズ）計算に使うスケール因子
        if (this.uPointScaleLoc)
            gl.uniform1f(this.uPointScaleLoc, pointScalePx);
        //uColor: ベース色。恒星ごとの色分けをシェーダで行わない場合の一括色指定
        if (this.uColorLoc)
            gl.uniform3f(this.uColorLoc, color[0], color[1], color[2]);
        //頂点を点プリミティブとして一括描画。各頂点はVSで位置/サイズを決定、FSで円形の減衰（アルファ）などを描く。
        gl.drawArrays(gl.POINTS, 0, count);
        //頂点属性レイアウト（a_position, a_magなどの割り当て）をまとめて無効化
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
    // シェーダ作成（コンパイルチェック付き）
    createShader(type, src) {
        const shader = this.gl.createShader(type);
        if (!shader)
            throw new Error('Failed to create shader');
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Shader compile error: ' + info);
        }
        return shader;
    }
    // プログラム作成（リンクチェック付き）
    createProgram(vs, fs) {
        const program = this.gl.createProgram();
        if (!program)
            throw new Error('Failed to create program');
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error('Program link error: ' + info);
        }
        this.gl.deleteShader(vs);
        this.gl.deleteShader(fs);
        return program;
    }
}
//# sourceMappingURL=starsProgram.js.map