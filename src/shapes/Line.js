/// <reference path="../utils.js" />

// function to draw line
function drawLine(e) {
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    state.drawAllObjects();
    if (first) {
        
        first = false;
        p1 = [-1 + 2*canvasX/canvas.width, -1 + 2*(canvas.height-canvasY)/canvas.height];

    } else {

        first = true;
        p2 = [-1 + 2*canvasX/canvas.width, -1 + 2*(canvas.height-canvasY)/canvas.height];

        state.add(new Line(p1[0], p1[1], p2[0], p2[1])); 
    }
    
    state.drawAllObjects();
}

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
            [this.x1, this.y1],
            [this.x2, this.y2]
        ];

        return vertices;
    }

    changeColor(newcolorHex) {
        this.colorHex = newcolorHex;
    }

    draw() {
        renderLine(this.vertices, this.colorHex);
    }
}

function renderLine(vertices, colorHex) {
    
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
    gl.bufferData(gl.ARRAY_BUFFER, flatten([toGLSL(colorHex),toGLSL(colorHex)]), gl.STATIC_DRAW);

    let vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, flatten(vertices).length/2);
}

function toGLSL(hex){
    var color;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        color = hex.substring(1).split('');
        if(color.length == 3){
            color = [color[0], color[0], color[1], color[1], color[2], color[2]];
        }
        color = '0x' + color.join('');
        return [((color>>16)&255)/255, ((color>>8)&255)/255, (color&255)/255, 1];
    }
    throw new Error('Bad Hex');
}