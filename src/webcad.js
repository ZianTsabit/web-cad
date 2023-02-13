/// <reference path="utils.js" />

class Webcad {
    /**@type {Shape[]} */
    objects = [];

    /**@type {Shape} */
    selectedObject = null;

    /**@type {boolean} */
    isDrawing = false;

    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {WebGLRenderingContext} */
    gl;

    /**@type {HTMLCanvasElement} */
    hitCanvas;
    /**@type {WebGLRenderingContext} */
    hitContext;

    vBuffer;
    cBuffer;

    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @param {HTMLCanvasElement} hitCanvas
     */
    constructor(canvas, hitCanvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');

        this.hitCanvas = hitCanvas;
        this.hitContext = hitCanvas.getContext('webgl', { preserveDrawingBuffer: true });

        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.gl.clearColor(1, 1, 1, 1);
        
        let program = initShader(this.gl, vertexShaderSrc, fragmentShaderSrc);
        if(!program) {
            alert("Shader program loading failed!");
        }

        this.gl.useProgram(program);

        this.vBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);

        let vPosition = this.gl.getAttribLocation(program, "vPosition");
        this.gl.vertexAttribPointer(vPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPosition);

        this.cBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);

        let vColor = this.gl.getAttribLocation(program, "vColor");
        this.gl.vertexAttribPointer(vColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vColor);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        canvas.addEventListener('mousedown', (e) => {
            const square = new Square(this.objects[this.objects.length-1].id + 1, this);
            square.setPosition(e.clientX-canvas.offsetLeft, canvas.height - (e.clientY-canvas.offsetTop));
            square.setWidth(150);
            this.addObject(square);
        });
    }

    render() {
        /** @type {{id, index, count, mode}[]} */
        let renderList = [];
        let vertices = [];
        let colors = [];

        this.objects.forEach((object) => {
            let objectVertices = object.getVertices();

            let re = {
                id: object.id,
                index: vertices.length/2,
                count: objectVertices.length/2,
                mode: object.getDrawingMode()
            };
            renderList.push(re);

            objectVertices.forEach((x) => {
                vertices.push(x);
            });
            for (let i = 0; i < re.count; i++) {
                colors.push(1, 1, 0, 1);
            }
        });

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(vertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(colors), this.gl.STATIC_DRAW);

        // console.log(vertices);
        // console.log(colors);

        requestAnimationFrame(() => {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            renderList.forEach((re) => {
                this.gl.drawArrays(re.mode, re.index, re.count);
            });
        });
    }

    addObject(object) {
        this.objects.push(object);

        this.render();
    }
}

class Shape {
    /**@type {Number} */
    id;

    /**@type {Webcad} */
    webcad;

    /**@type {boolean} */
    isDrawing = true;

    /**
     * 
     * @param {Number} id
     * @param {Webcad} webcad
     */
    constructor(id, webcad) {
        this.id = id;
        this.webcad = webcad;
    }

    /**
     * @returns {Float32Array}
     */
    getVertices() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * @returns {number}
     */
    getDrawingMode() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * On mouse down
     * @param {MouseEvent} e 
     */
    onMouseDown(e) {
        console.log('Not yet implemented, override it!');
    }

    /**
     * When object is selected and mouse is moving
     * @param {MouseEvent} e 
     */
    onMouseMove(e) {
        console.log('Not yet implemented, override it!');
    }

    /**
     * When object is selected and mouse is up
     * @param {MouseEvent} e 
     */
    onMouseUp(e) {
        console.log('Not yet implemented, override it!');
    }
}

class Square extends Shape {
    /**
     * Position in pixel, origin is lower left
     * @type {{x, y}} */
    position = {x: 0, y: 0};

    /**
     * Square width in pixel
     * @type {number}
     */
    width = 0;

    /**
     * Vertices in pixel, origin is lower left
     * @type {number[]}
     */
    vertices = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
    ]

    /**
     * 
     * @param {number} id 
     * @param {Webcad} webcad 
     */
    constructor(id, webcad) {
        super(id, webcad);
    }

    recalculateVertices() {
        const x = this.position.x;
        const y = this.position.y;

        this.vertices[0] = [x - this.width/2, y + this.width/2];
        this.vertices[1] = [x + this.width/2, y + this.width/2];
        this.vertices[2] = [x - this.width/2, y - this.width/2];
        this.vertices[3] = [x + this.width/2, y - this.width/2];
    }

    /**Always use this method to set square position */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;

        this.recalculateVertices();
    }

    /**Always use this method to set square width */
    setWidth(width) {
        this.width = width;

        this.recalculateVertices();
    }

    getVertices() {
        return flatten(this.vertices.map((el) => {
            return [
                -1 + 2*el[0]/this.webcad.canvas.width,
                -1 + 2*el[1]/this.webcad.canvas.height
            ]
        }));
    }

    getDrawingMode() {
        return this.webcad.gl.TRIANGLE_STRIP;
    }
}

const vertexShaderSrc = `
precision mediump float;

attribute vec4 vPosition;
attribute vec4 vColor;
varying vec4 fColor;


void main() {
    fColor = vColor;
    gl_Position = vPosition;
}
`
const fragmentShaderSrc = `
precision mediump float;

varying vec4 fColor;

void main() {
    gl_FragColor = fColor;
}
`
