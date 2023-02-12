/// <reference path="utils.js" />

function drawLine() {

    const canvas = document.getElementById('webgl-canvas');

    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported, falling back on experimental-webgl');
        return;
    }

    // Vertex shader program
    
    var vertices = [ 
        1.0, 1.0, 0.0, 
        0.0, 0.0, 0.0,
        -1.0, -1.0, 0.0,
        0.0, 0.0, 0.0, 
    ];

    var vertex_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

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
    gl.drawArrays(gl.LINES, 0, 2);

}