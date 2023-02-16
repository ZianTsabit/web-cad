/// <reference path="../utils.js" />
/// <reference path="../Shape.js" />

class Rectangle extends Shape {
    /**
     * Position in pixel, origin is lower left
     * @type {{x, y}} */
    position = {x: 0, y: 0};

    /**
     * Rectangle width in pixel
     * @type {number}
     */
    width = 0;

    /**
     * Rectangle height in pixel
     * @type {number}
     */
    height = 0;

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
        super(id, webcad, "rectangle");

        this.setAllVertexColor(Rectangle.defaultColor);
    }

    recalculateVertices() {
        const x = this.position.x;
        const y = this.position.y;

        this.vertices[0] = [x - this.width/2, y + this.height/2];
        this.vertices[1] = [x + this.width/2, y + this.height/2];
        this.vertices[2] = [x - this.width/2, y - this.height/2];
        this.vertices[3] = [x + this.width/2, y - this.height/2];
    }

    /**Always use this method to set rectangle position */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;

        this.recalculateVertices();
    }

    /**Always use this method to set rectangle width */
    setWidth(width) {
        this.width = width;

        this.recalculateVertices();
    }
    
    setHeight(height) {
        this.height = height;

        this.recalculateVertices();
    }

    setAllVertexColor(hex) {
        const colorArr = hexToRgb(hex);
        for(let i = 0; i < 4; i++) {
            this.colors[i] = [colorArr.r, colorArr.g, colorArr.b, 255];
        }
    }

    translate(diffX, diffY) {
        this.setPosition(this.position.x + diffX, this.position.y + diffY);
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

    moveVertex(pointX, pointY, tolerance, diffX, diffY){
        let selectedVertexIdx = this.getVertexIdx(pointX, pointY, tolerance);

        if (selectedVertexIdx == null) {
            return;
        }

        this.setWidth(this.width + diffX);
        this.setHeight(this.height + diffY);
        this.setPosition(this.position.x + diffX/2, this.position.y + diffY/2);
    }

    /**
     * Returs list of what you can do to this shape
     * @returns {{label, type, onValueChange, default}[]}
     */
        getSidebarAttrs() {
            return [
                {
                    label: "Width: ",
                    type: "number",
                    onValueChange: (e) => {
                        this.setWidth(e.target.value);
                    },
                    default: this.width
                }, {
                    label: "Height: ",
                    type: "number",
                    onValueChange: (e) => {
                        this.setHeight(e.target.value);
                    },
                    default: this.width
                }
            ];
        }

    /**
     * Return list of what you can do to vertices in this shape (color, etc.)
     * @returns {{label, type, onValueChange, default}[]}
     */
    getVertexSidebarAttrs(poinX, poinY, tolerance) {
        return [{
            label: "Vertex Color: ",
            type: "color",
            onValueChange: (e) => {
                let i = this.getVertexIdx(poinX, poinY, tolerance);
                if (i == null) return;

                const colorArr = hexToRgb(e.target.value);
                this.colors[i] = [colorArr.r, colorArr.g, colorArr.b, 255];
            }
        }];
    }

    /**
     * @returns {{label, type, onValueChange}[]}
     */
    static getCreateAttrs() {
        return [{   label: "Rectangle Color: ",
                type: "color",
                onValueChange: (e) => { Rectangle.setDefaultColor(e.target.value) },
                default: Rectangle.defaultColor
        }];
    }
    
    /**
     * 
     * @param {string} hex 
     */
    static setDefaultColor(hex) {
        Rectangle.defaultColor = hex;
    }

    /**
     * When creating a new shape
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onCreate(e, webcad) {
        const rect = new Rectangle(webcad.lastId++, webcad);
        rect.setPosition(e.clientX - webcad.canvas.offsetLeft, webcad.canvas.height - (e.clientY - webcad.canvas.offsetTop));
        rect.setWidth(0);

        webcad.addObject(rect);
        let initialPos = {
            x: rect.position.x,
            y: rect.position.y
        }

        webcad.canvas.onmousemove = (e) => {
            const cursPos = {
                x: e.clientX - webcad.canvas.offsetLeft,
                y: webcad.canvas.height - (e.clientY - webcad.canvas.offsetTop)
            };
            const leftModifier = cursPos.x > initialPos.x ? 1 : -1;
            const topModifier = cursPos.y > initialPos.y ? 1 : -1;
            
            //const finalWidth = Math.max(Math.abs(cursPos.x - initialPos.x), Math.abs(cursPos.y - initialPos.y));
            const absDiffX = Math.abs(cursPos.x - initialPos.x);
            const absDiffY = Math.abs(cursPos.y - initialPos.y);
            
            rect.setWidth(absDiffX);
            rect.setHeight(absDiffY);
            rect.setPosition(initialPos.x + absDiffX/2 * leftModifier, initialPos.y + absDiffY/2 * topModifier);

            webcad.render();
        };

        webcad.canvas.onmouseup = (e) => {
            webcad.canvas.onmousemove = undefined;
        };
    }

    /**
     * 
     * @param {number} pointX
     * @param {number} pointY
     * @param {number} tolerance
     * @returns {number | null}
     */
    getVertexIdx(pointX, pointY, tolerance) {
        for (let i = 0; i < this.vertices.length; i++) {
            const point = this.vertices[i];
            if (Math.abs(point[0] - pointX) <= tolerance && Math.abs(point[1] - pointY) <= tolerance) {
                return i;
            }
        }
        return null;
    }
}
