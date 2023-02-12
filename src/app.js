/// <reference path="utils.js" />

const canvas = document.getElementById("webgl-canvas");
const gl = canvas.getContext("webgl");

class CurrentState {

    constructor() {
        this.objects = [];
        this.selectedObject = null;
    }

    add(object) {
        this.objects.push(object);
    }

    drawAllObjects() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].draw();
        }
        console.log(this.objects.length);
    }
}

state = new CurrentState();
state.drawAllObjects();