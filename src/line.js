/// <reference path="utils.js" />

class Line {

    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.colorHex = "#000000";
        this.vertices = this.makeVertices();
    }

    makeVertices() {
        
        let vertices = [
            this.x1, this.y1,
            this.x2, this.y2
        ];
        
        return vertices;
    }

    changeColor(newcolorHex) {
        this.colorHex = newcolorHex;
    }


    draw() {

        drawLine(this.vertices, this.colorHex);

    }

}

function drawLine(vertices, colorHex) {

    const canvas = document.getElementById('webgl-canvas');

    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported, falling back on experimental-webgl');
        return;
    }

    var vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create and compile Shader

    var vertCode =
        'attribute vec2 coordinates;' +
        'void main(void) {' +
        ' gl_Position = vec4(coordinates, 0.0, 1.0);' +
        '}';

    var vertShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertShader, vertCode);

    gl.compileShader(vertShader);

    var fragCode =
        'void main(void) {' +
        ' gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);' +
        '}';

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    var coord = gl.getAttribLocation(shaderProgram, "coordinates");

    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(coord);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, canvas.width, canvas.height);
    console.log(canvas.width, canvas.height);
    
    gl.drawArrays(gl.LINES, 0, vertices.length / 2);

}