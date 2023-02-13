/// <reference path="utils.js" />

vertices = [];
colors = [];

/**
 * @param {MouseEvent} e 
 */

var n = 3;

var last_n = 1;
 
function changeN() {
    n = document.getElementById('n-polygon').value;
}

function drawPolygon(e) {
    /**@type {HTMLCanvasElement}} */
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    if (last_n < n) {
        console.log(last_n);
        p = [-1 + 2*canvasX/canvas.width, -1 + 2*(canvas.height-canvasY)/canvas.height];
        vertices.push(p);
        colors.push([0,0,0,1]);
        last_n++;
    }
    else {
        console.log(last_n);
        p = [-1 + 2*canvasX/canvas.width, -1 + 2*(canvas.height-canvasY)/canvas.height];
        vertices.push(p);
        colors.push([0,0,0,1]);

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
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);

        vertices = [];
        colors = [];
        last_n = 1;
    }
}