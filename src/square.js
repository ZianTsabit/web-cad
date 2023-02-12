/// <reference path="utils.js" />

let first = true;

let p1, p2;

let vBuffer, cBuffer;

/**
* Menggambar persegi
* @param {MouseEvent} e 
*/    
function drawSquare(e) {
    /**@type {HTMLCanvasElement}} */
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    if (first) {
        first = false;
        
        p1 = [-1 + 2*canvasX/canvas.width, -1 + 2*(canvas.height-canvasY)/canvas.height];
    } else {
        first = true;

        p2 = [-1 + 2*canvasX/canvas.width, -1 + 2*(canvas.height-canvasY)/canvas.height];

        let vertices = [
            p1,
            [p2[0], p1[1]],
            [p1[0], p2[1]],
            p2
        ];

        let colors = [
            [1, 0, 0, 1],
            [0, 1, 0, 1],
            [0, 0, 1, 1],
            [1, 1, 1, 1]
        ]

        const gl = canvas.getContext("webgl");

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);

        let program = initShader(gl, vertexShaderSrc, fragmentShaderSrc);
        gl.useProgram(program);

        // Vertex
        vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        let vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        // Color
        cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
        var vColor = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
    }
}

const vertexShaderSrc = `precision mediump float;

attribute vec4 vPosition;
attribute vec4 vColor;
varying vec4 fColor;


void main() {
    fColor = vColor;
    gl_Position = vPosition;
}
`
const fragmentShaderSrc = `precision mediump float;

varying vec4 fColor;

void main() {
    gl_FragColor = fColor;
}
`