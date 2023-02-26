/// <reference path="utils.js" />


/**
 * Yang perlu dioverride fungsi turunan:
 * 
 * translate(...)
 * setAngle(...)
 * moveVertext(...)
 * 
 * getVertices(...)
 * getVerticesColor(...)
 * getDrawingMode(...)
 * 
 * getSidebarAttrs(...)
 * getVertexSidebarAttrs(...)
 * 
 * static getCreateAttrs(...)
 * static onCreate(...)
 * 
 */
class Shape {
    /**@type {Number} */ id;
    /**@type {string} */ type;
    /**@type {Webcad} */ webcad;
    /**@type {boolean} */ isDrawing = true;
    /**@type {Number} */ angle = 0;
    /**@type {boolean} */ animateRotation = false;

    /**
     * Create a new abstract shape
     * @param {Number} id
     * @param {Webcad} webcad
     * @param {string} type
     */
    constructor(id, webcad, type) {
        this.id = id;
        this.webcad = webcad;
        this.type = type;
    }

    /**
     * Translate object by diffX and diffY
     * @param {number} diffX 
     * @param {number} diffY 
     */
    translate(diffX, diffY) {
        console.log('Not yet implemented, override it!');
    }

    /**
     * Rotate object by angle
     * @param {number} angle
     * 
     */
    setAngle(angle) {
        console.log('Not yet implemented, override it!');
    }

    /**
     * Vertex at pixel position (pointX, pointY) of current shape is being dragged by user, move it
     * @param {number} pointX 
     * @param {number} pointY 
     * @param {number} tolerance 
     * @param {number} diffX 
     * @param {number} diffY 
     */
    moveVertex(pointX, pointY, tolerance, diffX, diffY){
        console.log('Not yet implemented, override it!');
    }

    /**
     * Get float vertices for rendering (Normalized in -1..1, not in pixel)
     * @returns {Float32Array}
     */
    getVertices() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * Get float vertices' color for rendering (Normalized in 0..1 range, not 0..255)
     * @returns {Float32Array}
     */
    getVerticesColors() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * Get drawing mode for this shape (TRIANGLE_STRIP, TRIANGLE_FAN, LINES, etc.)
     * @returns {number}
     */
    getDrawingMode() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * Returs list of what you can do to this shape
     * @returns {{label, type, onValueChange, default}[]}
     */
    getSidebarAttrs() {
        return [
            {
                label: "Animate Rotation: ",
                type: "checkbox",
                onValueChange: (e) => {
                    if (e.target.checked) {
                        this.animateRotation = true;
                    } else {
                        this.animateRotation = false;
                    }
                },
                default: this.animateRotation
            }
        ];
    }

    /**
     * Return list of what you can do to vertices in this shape (color, etc.)
     * @param {number} poinX Selected vertex's x coordinate
     * @param {number} poinY Selected vertex's y coordinate
     * @param {number} tolerance Vertex selection tolerance
     * @returns {{label, type, onValueChange, default}[]}
     */
    getVertexSidebarAttrs(poinX, poinY, tolerance) {
        console.log('Not yet implemented, override it!');
    }


    /**
     * Return list of attributes on sidebar when creating
     * @returns {{label, type, onValueChange, default}[]}
     */
    static getCreateAttrs() {
        console.log('Not yet implemented, override it!');
    }

    /**
     * Shape creating process
     * @param {MouseEvent} e
     * @param {Webcad} webcad
     */
    static onCreate(e, webcad) {
        console.log('Not yet implemented, override it!');
    }
}
