/// <reference path="../utils.js" />
/// <reference path="../shape.js" />

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
     * Rectangle angle in radian
     * @type {number}
     */
    angle = 0;

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

        const halfWidth = this.width/2;
        const halfHeight = this.height/2;

        // Set vertices based on width and height
        this.vertices = [
            [x - halfWidth, y + halfHeight],
            [x + halfWidth, y + halfHeight],
            [x - halfWidth, y - halfHeight],
            [x + halfWidth, y - halfHeight]
        ];
        // Rotate vertices
        for(let i = 0; i < this.vertices.length; i++) {
            const p = this.vertices[i];
            const pr = rotate(p[0] - x, p[1] - y, this.angle);
            this.vertices[i] = [pr.x + x, pr.y + y];
        }
    }

    /**
     * Normalize return vertices in (0, 0) center coordinate and 0 degree angle
     */
    normalize() {
        const x = this.position.x;
        const y = this.position.y;

        let normalized = [];
        this.vertices.forEach(el => {
            const xc = el[0] - x;
            const yc= el[1] - y;
            const rotated = rotate(xc, yc, -this.angle);
            normalized.push([rotated.x, rotated.y]);
        })
        return normalized;
    }

    setAngle(angle) {
        this.angle = angle % 360;

        this.recalculateVertices();
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
        const x = this.position.x;
        const y = this.position.y;

        // Normalize all
        const normalized = this.normalize();
        const diffN = rotate(diffX, diffY, -this.angle);
        let selectedVertexIdx = this.getVertexIdx(pointX, pointY, tolerance);

        if (selectedVertexIdx == null) {
            return;
        }
        
        // Calculate projections and modifiers
        const point = normalized[selectedVertexIdx];
        const xModifier = diffN.x * point[0] >= 0 ? 1 : -1;
        const yModifier = diffN.y * point[1] >= 0 ? 1 : -1;

        const move = rotate(diffN.x/2, diffN.y/2, this.angle);

        // Set width and position
        this.setWidth(this.width + xModifier * Math.abs(diffN.x));
        this.setHeight(this.height + yModifier * Math.abs(diffN.y));
        this.setPosition(this.position.x + move.x, this.position.y + move.y);
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
                        if(document.getElementById("rect-lock").checked){
                            this.setHeight(parseFloat(e.target.value) * this.height / this.width);
                            document.getElementById("rect-height").value = this.height;
                        }
                        this.setWidth(parseFloat(e.target.value));
                    },
                    default: this.width,
                    id: "rect-width"
                }, {
                    label: "Height: ",
                    type: "number",
                    onValueChange: (e) => {
                        if(document.getElementById("rect-lock").checked){
                            this.setWidth(parseFloat(e.target.value) * this.width / this.height);
                            document.getElementById("rect-width").value = this.width;
                        }
                        this.setHeight(parseFloat(e.target.value));
                    },
                    default: this.height,
                    id: "rect-height"
                },
                {
                    label: "Lock ratio",
                    type: "checkbox",
                    onValueChange: (e) => { console.log(e.target.value) },
                    default: "lock",
                    id: "rect-lock"
                },
                {
                    label: "Angle: ",
                    type: "number",
                    onValueChange: (e) => {
                        this.setAngle(parseFloat(e.target.value));
                    },
                    default: this.angle,
                    id: "rect-angle"
                }
            ] . concat(super.getSidebarAttrs());;
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
        const normalized = this.normalize();
        const pN = rotate(pointX - this.position.x, pointY - this.position.y, -this.angle);
        for (let i = 0; i < this.vertices.length; i++) {
            const point = normalized[i];
            if (Math.abs(point[0] - pN.x) <= tolerance && Math.abs(point[1] - pN.y) <= tolerance) {
                return i;
            }
        }
        return null;
    }
    
}
