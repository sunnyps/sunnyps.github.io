/*
 * Copyright (C) 2025 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and a disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and a disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

class WebGLStage extends Stage {
    constructor(canvas) {
        super();
        this._canvas = canvas;
        this._complexity = 20; // A safe minimum to prevent hangs
        this._gl = null;
        this._renderScale = 4; // 4x4 = 16x supersampling
        this._program = null;
        this._quadBuffer = null;
    }

    async initialize(benchmark, options) {
        await super.initialize(benchmark, options);

        // Set the canvas drawing buffer size to be larger than its display size.
        // The browser will automatically downsample, giving us high-quality SSAA.
        const displayWidth = this._canvas.clientWidth;
        const displayHeight = this._canvas.clientHeight;
        this._canvas.width = displayWidth * this._renderScale;
        this._canvas.height = displayHeight * this._renderScale;

        const contextAttributes = { antialias: false };
        this._gl = this._canvas.getContext('webgl', contextAttributes);
        if (!this._gl) {
            throw new Error("WebGL not supported");
        }

        const gl = this._gl;

        const vertexSource = await this.loadShaderSource('resources/shaders/fragment-hog.vs');
        const fragmentSource = await this.loadShaderSource('resources/shaders/fragment-hog.fs');
        this._program = this.createShaderProgram(
            this.compileShader(gl.VERTEX_SHADER, vertexSource),
            this.compileShader(gl.FRAGMENT_SHADER, fragmentSource)
        );

        // A full-screen quad
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        this._quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this._startTime = performance.now();
    }

    tune(count) {
        const MIN_COMPLEXITY = 20;
        const MAX_COMPLEXITY = 50000; // Safety cap
        let newComplexity = this._complexity + count;
        this._complexity = Math.max(MIN_COMPLEXITY, Math.min(newComplexity, MAX_COMPLEXITY));
    }

    animate() {
        const gl = this._gl;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(this._program);

        const posAttrLoc = gl.getAttribLocation(this._program, "a_position");
        gl.enableVertexAttribArray(posAttrLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
        gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(gl.getUniformLocation(this._program, "u_time"), performance.now() / 1000);
        gl.uniform2f(gl.getUniformLocation(this._program, "u_resolution"), gl.canvas.width, gl.canvas.height);
        gl.uniform1i(gl.getUniformLocation(this._program, "u_iterations"), Math.round(this.complexity()));

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    complexity() {
        return this._complexity;
    }

    // --- WebGL Helper Functions ---
    async loadShaderSource(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load shader: ${url}`);
        return response.text();
    }

    compileShader(type, source) {
        const gl = this._gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation failed: ${error}`);
        }
        return shader;
    }

    createShaderProgram(vertexShader, fragmentShader) {
        const gl = this._gl;
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Shader program linking failed: ${gl.getProgramInfoLog(program)}`);
        }
        return program;
    }
}

class FragmentHogBenchmark extends Benchmark {
    constructor(options) {
        const canvas = document.getElementById('stage-canvas');
        super(new WebGLStage(canvas), options);
    }
}

window.benchmarkClass = FragmentHogBenchmark;
