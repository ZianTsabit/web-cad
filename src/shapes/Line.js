/// <reference path="../utils.js" />
/// <reference path="../shape.js" />

class Line extends Shape {
    /**
     * Position in pixel, origin is lower left
     * @type {{x, y}} */
    position = {x: 0, y: 0};

    /**
     * line width in pixel
     * @type {number}
     */
    width = 0;

    /**
     * line height in pixel
     * @type {number}
     */
    height = 0;

    /**
     * Vertices in pixel, origin is lower left
     * @type {number[]}
     */
    vertices = [
        [0, 0],
        [0, 0]
    ];

    /** Color of each vertex, in rgba array (0-255) */
    colors = [
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
        super(id, webcad, "line");
        this.setAllVertexColor(Line.defaultColor);
    }

    recalculateVertices() {
        const x1 = this.position.x;
        const y1 = this.position.y;
        
        const x2 = this.position.x + this.width;
        const y2 = this.position.y + this.height;

        this.vertices = [
            [x1, y1],
            [x2, y2]
        ];

    }
    
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        
        this.recalculateVertices();
    }

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
        for(let i = 0; i < 2; i++) {
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
        return this.webcad.gl.LINES;
    }

    moveVertex(pointX, pointY, tolerance, diffX, diffY){
        let selectedVertexIdx = this.getVertexIdx(pointX, pointY, tolerance);

        if (selectedVertexIdx == null) {
            return;
        }

        this.setWidth(this.width + diffX);
        this.setHeight(this.height + diffY);
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
        return [{   
                label: "Line Color: ",
                type: "color",
                onValueChange: (e) => { Line.setDefaultColor(e.target.value) },
                default: Line.defaultColor
        }];
    }

    /**
     * 
     * @param {string} hex 
     */
    static setDefaultColor(hex) {
        Line.defaultColor = hex;
    }

    /**
     * When creating a new shape
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onCreate(e, webcad) {
        const rect = new Line(webcad.lastId++, webcad);
        rect.setPosition(e.clientX - webcad.canvas.offsetLeft, webcad.canvas.height - (e.clientY - webcad.canvas.offsetTop));
        
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
            
            const absDiffX = cursPos.x - initialPos.x;
            const absDiffY = cursPos.y - initialPos.y;
            
            rect.setWidth(absDiffX);
            rect.setHeight(absDiffY);

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


}