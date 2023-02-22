/// <reference path="utils.js" />
/// <reference path="shape.js" />
/// <reference path="shapes/Square.js" />
/// <reference path="shapes/Rectangle.js" />
/// <reference path="shapes/Line.js" />
/// <reference path="polygon.js" />

const VERTEX_SELECTION_TOLERANCE = 7.5;


const shapeTypes = {
    "square": Square,
    "rectangle": Rectangle,
    "line": Line
}

class Webcad {
    /** @type {number} */ lastId = 1;

    /**@type {Shape[]} */ objects = [];

    /**@type {number} */ selectedObjectId = null;

    /**@type {boolean} */ isDrawing = false;

    /** @type {HTMLCanvasElement} */ canvas;
    /** @type {WebGLRenderingContext} */ gl;
    vBuffer; cBuffer;

    /**@type {HTMLCanvasElement} */ hitCanvas;
    /**@type {WebGLRenderingContext} */ hitGl;
    hvBuffer; hcBuffer;

    /** @type {HTMLDivElement} */ rightSidebar;

    /**
     * Create a new Webcad app
     * @param {HTMLCanvasElement} canvas 
     * @param {HTMLCanvasElement} hitCanvas
     * @param {HTMLDivElement} rightSidebar
     */
    constructor(canvas, hitCanvas, rightSidebar) {
        this.rightSidebar = rightSidebar;

        this.initializeWebGL(canvas, hitCanvas)
    }

    /**
     * Set mode (cursor, draw square, rectangle, etc.)
     * @param {string} mode
     * @param {MouseEvent} e
     */
    setMode(mode, e) {
        /** @type {typeof Shape} */
        let shapeType = shapeTypes[mode];

        /** @type {{label, type, onValueChange, default}[]} */
        let createAttrs;
        switch (mode) {
            case "polygon":
                drawPolygon(e);
                break;
            case "cursor":
                this.rightSidebar.innerHTML = "";

                this.canvas.style.cursor = "default";
                this.canvas.onmousedown = undefined;
                this.canvas.onmousemove = undefined;
                this.canvas.onmouseup = undefined;

                this.canvas.onmousedown = (e) => {
                    let prevMousePos = { x: e.clientX - this.canvas.offsetLeft, y: this.canvas.height - (e.clientY - this.canvas.offsetTop) };

                    const pixels = this.readHitPixel(e.clientX, e.clientY);
                    console.log(pixels);
                    this.selectedObjectId = pixels[2];
                    this.render();
                    
                    const obj = this.getObjectById(this.selectedObjectId);
                    if (!obj) {
                        this.canvas.onmousemove = undefined;
                        this.canvas.onmouseup = undefined;
                        this.rightSidebar.innerHTML = "";
                        return;
                    };
                    
                    this.rightSidebar.innerHTML = "";
                    if (pixels[0] == 0) {    // 0: translasi
                        let attrs = obj.getSidebarAttrs();
                        this.setSidebarAttrs(attrs);
                        this.render();

                        this.canvas.onmousemove = (e) => {
                            const currMousePos = {
                                x: e.clientX - this.canvas.offsetLeft,
                                y: this.canvas.height - (e.clientY - this.canvas.offsetTop)
                            };
                            
                            obj.translate(currMousePos.x - prevMousePos.x, currMousePos.y - prevMousePos.y);
                            this.render();

                            prevMousePos = currMousePos;
                        } 
                    } else if (pixels[0] == 1) {    // 1: geser titik sudut
                        let attrs = obj.getVertexSidebarAttrs(prevMousePos.x, prevMousePos.y, VERTEX_SELECTION_TOLERANCE);
                        this.setSidebarAttrs(attrs);
                        this.render();

                        this.canvas.onmousemove = (e) => {
                            const currMousePos = {
                                x: e.clientX - this.canvas.offsetLeft,
                                y: this.canvas.height - (e.clientY - this.canvas.offsetTop)
                            };
    
                            obj.moveVertex(prevMousePos.x, prevMousePos.y, VERTEX_SELECTION_TOLERANCE*2, currMousePos.x - prevMousePos.x, currMousePos.y - prevMousePos.y);
                            this.render();

                            prevMousePos = currMousePos;
                        }
                    }

                    this.canvas.onmouseup = (e) => {
                        this.canvas.style.cursor = "default";
                        this.canvas.onmousemove = (e) => {
                            const pixels = this.readHitPixel(e.clientX, e.clientY);
                            if (pixels[0] == 1) {
                                this.canvas.style.cursor = "pointer";
                            } else {
                                this.canvas.style.cursor = "default";
                            }
                        };

                        this.render();
                    }
                };

                break;
                
            default:
                this.selectedObjectId = null

                this.canvas.onclick = undefined;
                this.canvas.onmousedown = (e) => shapeType.onCreate(e, this);
                this.canvas.style.cursor = "crosshair";

                this.rightSidebar.innerHTML = "";
                createAttrs = shapeType.getCreateAttrs();
                this.setSidebarAttrs(createAttrs);

                this.render();
                break;
        }
    }

    /**
     * Add a new object and draw
     * @param {Shape} object 
     */
    addObject(object) {
        this.objects.push(object);

        this.render();
    }

    /**
     * Set right sidebar attributes
     * @param {{label, type, onValueChange, default}[]} createAttrs 
     */
    setSidebarAttrs(createAttrs) {
        createAttrs.forEach((attr) => {
            let label = document.createElement("label")
            label.innerHTML = attr.label;
            this.rightSidebar.appendChild(label);

            let input = document.createElement("input");
            switch (attr.type) {
                case "number":
                    input.setAttribute("type", "number");
                    break;
                case "color":
                    input.setAttribute("type", "color");
                    break;
                case "angle":
                    input.setAttribute("type", "number");
                    break;
            }

            if (attr.default) { input.value = attr.default };
            input.onchange = (e) => {
                attr.onValueChange(e);
                this.render();
            }

            this.rightSidebar.appendChild(input);
            this.rightSidebar.appendChild(document.createElement("br"));
        });
    }

    /**
     * (Re)render canvas
     */
    render() {
        /** @type {{id, index, count, mode}[]} */
        let renderList = [];
        let vertices = [];
        let colors = [];

        let hitRenderList = [];
        let hitVertices = [];
        let hitColors = [];

        this.objects.forEach((object) => {
            // Each object add to render list
            let objectVertices = object.getVertices();
            let objectVerticesColors = object.getVerticesColors();

            let re = {
                id: object.id,
                index: vertices.length/2,
                count: objectVertices.length/2,
                mode: object.getDrawingMode()
            };
            renderList.push(re);
            hitRenderList.push(re);

            objectVertices.forEach((x) => {
                hitVertices.push(x);
                vertices.push(x);
            });

            objectVerticesColors.forEach((x) => {
                colors.push(x);
            });
            for (let i = 0; i < re.count; i++) {
                hitColors.push(0, 0, re.id * 1.0/255, 1);
            }
            // End of each object add to render list

            // Selected object: vertices selector and boundary drawing
            if (this.selectedObjectId == re.id) {
                
                if(re.mode == this.gl.LINES) {
                    
                    for (let i = 0; i < objectVertices.length; i +=2) {
                        let obv = objectVertices;
                        this.drawVerticesIndicator(obv[i], obv[i+1], [1/255, 0, this.selectedObjectId/255, 255], VERTEX_SELECTION_TOLERANCE*2/this.canvas.width, vertices, colors, hitVertices, hitColors, renderList, hitRenderList);
                    }

                    let leftMost = objectVertices[0];
                    let rightMost = objectVertices[0];
                    let topMost = objectVertices[1];
                    let bottomMost = objectVertices[1];
                    for (let i = 0; i < objectVertices.length; i += 2) {
                        if (objectVertices[i] < leftMost) {
                            leftMost = objectVertices[i];
                        }
                        if (objectVertices[i] > rightMost) {
                            rightMost = objectVertices[i];
                        }
                        if (objectVertices[i+1] < bottomMost) {
                            bottomMost = objectVertices[i+1];
                        }
                        if (objectVertices[i+1] > topMost) {
                            topMost = objectVertices[i+1];
                        }
                    }

                    let re = {
                        id: 0,
                        index: vertices.length/2,
                        count: 4*4,
                        mode: this.gl.LINES
                    }
                    renderList.push(re)

                    for (let i = 0; i < re.count; i++) {
                        colors.push(0, 0, 0, 1)
                    }
                    
                }else{

                    // Draw boundary
                    for (let i = 0; i < objectVertices.length; i +=2) {
                        let obv = objectVertices;
                        this.drawVerticesIndicator(obv[i], obv[i+1], [1/255, 0, this.selectedObjectId/255, 255], VERTEX_SELECTION_TOLERANCE*2/this.canvas.width, vertices, colors, hitVertices, hitColors, renderList, hitRenderList);
                    }

                    let leftMost = objectVertices[0];
                    let rightMost = objectVertices[0];
                    let topMost = objectVertices[1];
                    let bottomMost = objectVertices[1];
                    for (let i = 0; i < objectVertices.length; i += 2) {
                        if (objectVertices[i] < leftMost) {
                            leftMost = objectVertices[i];
                        }
                        if (objectVertices[i] > rightMost) {
                            rightMost = objectVertices[i];
                        }
                        if (objectVertices[i+1] < bottomMost) {
                            bottomMost = objectVertices[i+1];
                        }
                        if (objectVertices[i+1] > topMost) {
                            topMost = objectVertices[i+1];
                        }
                    }

                    let re = {
                        id: 0,
                        index: vertices.length/2,
                        count: 4*4,
                        mode: this.gl.LINES
                    }
                    renderList.push(re)

                    let offset = 15 / this.canvas.width;
                    vertices.push(leftMost-offset, topMost+offset, leftMost+2*offset, topMost+offset, leftMost-offset, topMost+offset, leftMost-offset, topMost-2*offset)
                    vertices.push(rightMost+offset, topMost+offset, rightMost-2*offset, topMost+offset, rightMost+offset, topMost+offset, rightMost+offset, topMost-2*offset)
                    vertices.push(leftMost-offset, bottomMost-offset, leftMost+2*offset, bottomMost-offset, leftMost-offset, bottomMost-offset, leftMost-offset, bottomMost+2*offset)
                    vertices.push(rightMost+offset, bottomMost-offset, rightMost-2*offset, bottomMost-offset, rightMost+offset, bottomMost-offset, rightMost+offset, bottomMost+2*offset)
                    for (let i = 0; i < re.count; i++) {
                        colors.push(0, 0, 0, 1)
                    }
                }
            }
            // End of selected object boundary drawing

        });

        // Front canvas
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(vertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(colors), this.gl.STATIC_DRAW);

        // Hit canvas
        this.hitGl.bindBuffer(this.hitGl.ARRAY_BUFFER, this.hvBuffer);
        this.hitGl.bufferData(this.hitGl.ARRAY_BUFFER, flatten(vertices), this.hitGl.STATIC_DRAW);

        this.hitGl.bindBuffer(this.hitGl.ARRAY_BUFFER, this.hcBuffer);
        this.hitGl.bufferData(this.hitGl.ARRAY_BUFFER, flatten(hitColors), this.hitGl.STATIC_DRAW);;

        requestAnimationFrame(() => {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.hitGl.clear(this.hitGl.COLOR_BUFFER_BIT);

            renderList.forEach((re) => {
                this.gl.drawArrays(re.mode, re.index, re.count);
            });

            hitRenderList.forEach((re) => {
                this.hitGl.drawArrays(re.mode, re.index, re.count);
            });
        });
    }

    /**
     * Initialize WebGL (program, shader, etc.)
     * @param {HTMLCanvasElement} canvas 
     * @param {HTMLCanvasElement} hitCanvas
     */
    initializeWebGL(canvas, hitCanvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');

        this.hitCanvas = hitCanvas;
        this.hitGl = hitCanvas.getContext('webgl', { preserveDrawingBuffer: true });

        // Front Canvas
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

        // Hit Canvas
        this.hitGl.viewport(0, 0, canvas.width, canvas.height);
        this.hitGl.clearColor(0, 0, 0, 1);
        
        let hitProgram = initShader(this.hitGl, vertexShaderSrc, fragmentShaderSrc);
        if(!hitProgram) {
            alert("Shader program loading failed!");
        }

        this.hitGl.useProgram(hitProgram);

        this.hvBuffer = this.hitGl.createBuffer();
        this.hitGl.bindBuffer(this.hitGl.ARRAY_BUFFER, this.hvBuffer);

        let hvPosition = this.hitGl.getAttribLocation(hitProgram, "vPosition");
        this.hitGl.vertexAttribPointer(hvPosition, 2, this.hitGl.FLOAT, false, 0, 0);
        this.hitGl.enableVertexAttribArray(hvPosition);

        this.hcBuffer = this.hitGl.createBuffer();
        this.hitGl.bindBuffer(this.hitGl.ARRAY_BUFFER, this.hcBuffer);

        let hvColor = this.hitGl.getAttribLocation(hitProgram, "vColor");
        this.hitGl.vertexAttribPointer(hvColor, 4, this.hitGl.FLOAT, false, 0, 0);
        this.hitGl.enableVertexAttribArray(hvColor);

        this.hitGl.clear(this.hitGl.COLOR_BUFFER_BIT);
    }

    /**
     * Draw vertices indicator
     * @param {number} vertexX 
     * @param {number} vertexY 
     * @param {number} size 
     * @param {number[]} hitColor
     * @param {number[]} vertices 
     * @param {number[]} colors 
     * @param {number[]} hitVertices 
     * @param {number[]} hitColors
     * @param {any[]} renderList
     * @param {any[]} hitRenderList
     */
    drawVerticesIndicator(vertexX, vertexY, hitColor, size, vertices, colors, hitVertices, hitColors, renderList, hitRenderList) {
        let re = {
            id: 0,
            index: vertices.length/2,
            count: 4,
            mode: this.gl.TRIANGLE_STRIP
        }
        renderList.push(re);
        hitRenderList.push(re);

        const points = [vertexX-size/2, vertexY+size/2, vertexX+size/2, vertexY+size/2, vertexX-size/2, vertexY-size/2, vertexX+size/2, vertexY-size/2];
        vertices.push(...points);
        hitVertices.push(...points);
        for (let i = 0; i < 4; i++) {
            colors.push(75/255, 75/255, 75/255, 255);
            hitColors.push(...hitColor);
        }
    }

    /**
     * Get an object by its id
     * @param {number} id 
     * @returns {Shape | null}
     */
    getObjectById(id) {
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i].id == id) {
                return this.objects[i];
            }
        }
        return null;
    }

    /**
     * Read pixel value that is hit by cursor
     * @param {number} clientX 
     * @param {number} clientY 
     * @returns {Uint8Array}
     */
    readHitPixel(clientX, clientY) {
        const glMousePos = {
            x: clientX - this.canvas.offsetLeft,
            y: this.canvas.height - (clientY - this.canvas.offsetTop)
        };
        let pixels = new Uint8Array(4);
        this.hitGl.readPixels(glMousePos.x, glMousePos.y, 1, 1, this.hitGl.RGBA, this.hitGl.UNSIGNED_BYTE, pixels);

        return pixels;
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
