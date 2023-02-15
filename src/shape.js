/// <reference path="utils.js" />

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
     * @returns {Float32Array}
     */
    getVerticesColors() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * @returns {number}
     */
    getDrawingMode() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * @returns {{label, type, onValueChange}[]}
     */
    static getCreateAttrs() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * On mouse down
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onMouseDown(e, webcad) {
        console.log('Not yet implemented, override it!');
    }

    /**
     * When object is selected and mouse is moving
     * @param {MouseEvent} e 
     */
    static onMouseMove(e) {
        console.log('Not yet implemented, override it!');
    }

    /**
     * When object is selected and mouse is up
     * @param {MouseEvent} e 
     */
    static onMouseUp(e) {
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
    ];

    /** Color of each vertex, in rgba array (0-255) */
    colors = [
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ];


    /** Hex string
     * @type {string} */
    static defaultColor = "#000000";

    /**
     * 
     * @param {number} id 
     * @param {Webcad} webcad 
     */
    constructor(id, webcad) {
        super(id, webcad);

        this.setAllVertexColor(Square.defaultColor);
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


    setAllVertexColor(hex) {
        const colorArr = hexToRgb(hex);
        for(let i = 0; i < 4; i++) {
            this.colors[i] = [colorArr.r, colorArr.g, colorArr.b, 255];
        }
    }

    getVertices() {
        return flatten(this.vertices.map((el) => {
            return [
                -1 + 2*el[0]/this.webcad.canvas.width,
                -1 + 2*el[1]/this.webcad.canvas.height
            ];
        }));
    }

    getVerticesColors() {
        return flatten(this.colors.map((el) => {
            return [el[0]/255, el[1]/255, el[2]/255, el[3]/255];
        }));
    }

    getDrawingMode() {
        return this.webcad.gl.TRIANGLE_STRIP;
    }

    /**
     * @returns {{label, type, onValueChange}[]}
     */
    static getCreateAttrs() {
        return [
            { label: "Square Color: ", type: "color", onValueChange: (e) => { Square.setDefaultColor(e.target.value) } }
        ]
    }
    
    /**
     * 
     * @param {string} hex 
     */
    static setDefaultColor(hex) {
        Square.defaultColor = hex;
    }

    /**
     * On mouse down
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onMouseDown(e, webcad) {
        const square = new Square(webcad.lastId++, webcad);
        square.setPosition(e.clientX - webcad.canvas.offsetLeft, webcad.canvas.height - (e.clientY - webcad.canvas.offsetTop));
        square.setWidth(0);

        webcad.addObject(square);
        let initialPos = {
            x: square.position.x,
            y: square.position.y
        }

        webcad.canvas.onmousemove = (e) => {
            const cursPos = {
                x: e.clientX - webcad.canvas.offsetLeft,
                y: webcad.canvas.height - (e.clientY - webcad.canvas.offsetTop)
            };
            const leftModifier = cursPos.x > initialPos.x ? 1 : -1;
            const topModifier = cursPos.y > initialPos.y ? 1 : -1;
            
            const finalWidth = Math.max(Math.abs(cursPos.x - initialPos.x), Math.abs(cursPos.y - initialPos.y));
            
            square.setWidth(finalWidth);
            square.setPosition(initialPos.x + finalWidth/2 * leftModifier, initialPos.y + finalWidth/2 * topModifier);

            webcad.render();
        };

        webcad.canvas.onmouseup = (e) => {
            webcad.canvas.onmousemove = undefined;
        };
    }
}
