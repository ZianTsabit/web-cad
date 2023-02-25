/// <reference path="../utils.js" />
/// <reference path="../shape.js" />

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
     * Square angle in radian
     * @type {number}
     */
    angle = 0;

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
        super(id, webcad, "square");

        this.setAllVertexColor(Square.defaultColor);
    }

    recalculateVertices() {
        const x = this.position.x;
        const y = this.position.y;

        const halfWidth = this.width/2;

        const cos = Math.cos(this.angle * Math.PI / 180);
        const sin = Math.sin(this.angle * Math.PI / 180);

        this.vertices[0] = [
            x + halfWidth*cos - halfWidth*sin,
            y + halfWidth*sin + halfWidth*cos
        ];
        this.vertices[1] = [
            x - halfWidth*cos - halfWidth*sin,
            y - halfWidth*sin + halfWidth*cos   
        ];
        this.vertices[2] = [
            x + halfWidth*cos + halfWidth*sin,
            y + halfWidth*sin - halfWidth*cos
        ];
        this.vertices[3] = [
            x - halfWidth*cos + halfWidth*sin,
            y - halfWidth*sin - halfWidth*cos
        ];
    }

    /**Always use this method to set square position */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;

        this.recalculateVertices();
    }

    setAngle(angle) {
        this.angle = angle;

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

        let xModifier = 1;
        let yModifier = 1;
        switch (selectedVertexIdx) {
            case 0:
                xModifier = -1;
                break;
            case 2:
                xModifier = -1;
                yModifier = -1;
                break;
            case 3:
                yModifier = -1;
                break;
        }
        let finalDiff = (diffX*xModifier + diffY*yModifier)/2;
        this.setWidth(this.width + finalDiff);
        this.setPosition(this.position.x + xModifier*finalDiff/2, this.position.y + yModifier*finalDiff/2);
    }

    /**
     * Returs list of what you can do to this shape
     * @returns {{label, type, onValueChange, default, id}[]}
     */
        getSidebarAttrs() {
            return [
                {
                    label: "Width: ",
                    type: "number",
                    onValueChange: (e) => {
                        this.setWidth(e.target.value);
                    },
                    default: this.width,
                    id: "square-width"
                },
                {
                    label: "Angle: ",
                    type: "number",
                    onValueChange: (e) => {
                        this.setAngle(e.target.value);
                    },
                    default: this.angle,
                    id: "square-angle"
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
        return [{   label: "Square Color: ",
                type: "color",
                onValueChange: (e) => { Square.setDefaultColor(e.target.value) },
                default: Square.defaultColor
        }];
    }
    
    /**
     * 
     * @param {string} hex 
     */
    static setDefaultColor(hex) {
        Square.defaultColor = hex;
    }

    /**
     * When creating a new shape
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onCreate(e, webcad) {
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
