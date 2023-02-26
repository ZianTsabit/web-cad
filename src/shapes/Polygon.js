/// <reference path="../utils.js" />
/// <reference path="../shape.js" />

class Polygon extends Shape {
    /**
     * Default number of sides
     * @type {number}
     */
    static defaultSides = 3;

    /**
     * Polygon sides in integer
     * @type {number}
     */
    sides = Polygon.defaultSides;
    
    /**
     * Position in pixel, origin is lower left
     * @type {{x, y}} */
    position = {x: 0, y: 0};

    /**
     * Polygon width in pixel
     * @type {number}
     */
    width = 0;

    /**
     * Polygon height in pixel
     * @type {number}
     */
    height = 0;

    /**
     * Polygon angle in pixel
     * @type {number}
     */
    angle = 0;

    /**
     * Vertices in pixel, origin is lower left
     * @type {number[]}
     */
    vertices = [];

    /** Color of each vertex, in rgba array (0-255) */
    colors = [];

    /** Hex string
     * @type {string} */
    static defaultColor = "#000000";

    /**
     * 
     * @param {number} id 
     * @param {Webcad} webcad 
     */
    constructor(id, webcad) {
        super(id, webcad, "polygon");
        this.setSides(Polygon.defaultSides);
        this.setAllVertexColor(Polygon.defaultColor);
    }

    recalculateVertices() {
        const centerX = this.position.x;
        const centerY = this.position.y;
        
        for (let i = 0; i < this.sides; i++) {
            this.vertices[i] = [
                centerX + this.width/2 * Math.cos(2 * Math.PI * i / this.sides),
                centerY + this.height/2 * Math.sin(2 * Math.PI * i / this.sides)
            ];
        }
        if(this.sides < this.vertices.length){
            let remove_length = this.vertices.length - this.sides;
            this.vertices.splice(this.sides,remove_length);
        }
        // Rotate vertices
        for(let i = 0; i < this.vertices.length; i++) {
            const p = this.vertices[i];
            const pr = rotate(p[0] - centerX, p[1] - centerY, this.angle);
            this.vertices[i] = [pr.x + centerX, pr.y + centerY];
        }  
    }

    setAngle(angle) {
        this.angle = angle % 360;

        this.recalculateVertices();
    }

    /**Always use this method to set polygon position */
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;

        this.recalculateVertices();
    }

    /**Always use this method to set polygon width */
    setWidth(width) {
        this.width = width;

        this.recalculateVertices();
    }
    
    setHeight(height) {
        this.height = height;

        this.recalculateVertices();
    }

    setSides(sides) {
        if (sides > this.sides) {   // Add new vertices with default color
            const colorArr = hexToRgb(Polygon.defaultColor);
            for (; this.sides < sides; this.sides++) {
                this.colors.push([colorArr.r, colorArr.g, colorArr.b, 255]);
            }
        } else {    // Delete last vertices
            for (; this.sides > sides; this.sides--) {
                this.vertices.pop();
                this.colors.pop();
            }
        }

        this.recalculateVertices();
    }

    setAllVertexColor(hex) {
        const colorArr = hexToRgb(hex);
        for(let i = 0; i < this.sides; i++) {
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
        return this.webcad.gl.TRIANGLE_FAN;
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
     * @returns {{label, type, onValueChange, default, id}[]}
     */
    getSidebarAttrs() {
        return [
            {
                label: "Sides: ",
                type: "number",
                onValueChange: (e) => {
                    const sides = parseInt(e.target.value);
                    if (!sides || sides < 3) {
                        e.target.value = 3;
                    } else {
                        this.setSides(sides);
                    }
                },
                default: this.sides,
                id: "poly-sides"
            },
            {
                label: "Width: ",
                type: "number",
                onValueChange: (e) => {
                    if(document.getElementById("poly-lock").checked){
                        this.setHeight(parseFloat(e.target.value) * this.height / this.width);
                        document.getElementById("poly-height").value = this.height;
                    }
                    this.setWidth(parseFloat(e.target.value));
                },
                default: this.width,
                id: "poly-width"
            }, {
                label: "Height: ",
                type: "number",
                onValueChange: (e) => {
                    if(document.getElementById("poly-lock").checked){
                        this.setWidth(parseFloat(e.target.value) * this.width / this.height);
                        document.getElementById("poly-width").value = this.width;
                    }
                    this.setHeight(parseFloat(e.target.value));
                },
                default: this.height,
                id: "poly-height"
            },
            {
                label: "Lock ratio",
                type: "checkbox",
                onValueChange: (e) => { console.log(e.target.value) },
                default: "lock",
                id: "poly-lock"
            },
            {
                label: "Angle: ",
                type: "number",
                onValueChange: (e) => {
                    this.setAngle(parseFloat(e.target.value));
                },
                default: this.angle,
                id: "poly-angle"
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
        return [
            {
                label: "Sides: ",
                type: "number",
                onValueChange: (e) => {
                    const sides = parseInt(e.target.value);
                    if (!sides || sides < 3) {
                        e.target.value = Polygon.defaultSides;
                    } else {
                        Polygon.defaultSides = sides;
                    }
                },
                default: Polygon.defaultSides
            }, {       
                label: "Polygon Color: ",
                type: "color",
                onValueChange: (e) => { Polygon.setDefaultColor(e.target.value) },
                default: Polygon.defaultColor
        }];
    }

    /**
     * 
     * @param {string} hex 
     */
    static setDefaultColor(hex) {
        Polygon.defaultColor = hex;
    }

    /**
     * When creating a new shape
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onCreate(e, webcad) {
        const rect = new Polygon(webcad.lastId++, webcad);
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

    /**
     * turn into convexhull polygon
     */
    toConvexHullPolygon() {
        const convexHull = this.convexHull(this.vertices);
        if (convexHull == null) {
            return;
        }
        
        this.vertices = convexHull;
    }

    convexHull(points) {
        // Check if the array has enough points to create a convex hull
        if (points.length < 3) {
        return null;
        }

        // Find the leftmost point
        let leftmost = points[0];
        for (let i = 1; i < points.length; i++) {
        if (points[i][0] < leftmost[0]) {
            leftmost = points[i];
        }
        }

        // Initialize the hull with the leftmost point
        const hull = [leftmost];
        let current = leftmost;

        // Loop until we reach the leftmost point again
        do {
        let next = points[0];

        // Find the point that creates the smallest angle with the current point
        for (let i = 1; i < points.length; i++) {
            if (points[i] === current) {
            continue;
            }
            
            const angle = getAngle(current, next, points[i]);
            if (angle < 0 || (angle === 0 && getDistance(current, points[i]) > getDistance(current, next))) {
            next = points[i];
            }
        }

        // Add the next point to the hull and make it the new current point
        hull.push(next);
        current = next;
        } while (current !== leftmost);

        return hull;
    }
      
    getAngle(p1, p2, p3) {
        const v1 = [p2[0] - p1[0], p2[1] - p1[1]];
        const v2 = [p3[0] - p2[0], p3[1] - p2[1]];
        const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
        const det = v1[0] * v2[1] - v1[1] * v2[0];
        return Math.atan2(det, dotProduct);
    }
      
    getDistance(p1, p2) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    }
        
}