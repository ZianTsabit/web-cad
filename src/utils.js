/**
 * Melakukan kompilasi shader, linking, dan mengembalikan suatu program
 * @param {WebGLRenderingContext} gl
 * @param {string} vertexShaderSrc
 * @param {string} fragmentShaderSrc
 * @returns {WebGLProgram}
 */
function initShader(gl, vertexShaderSrc, fragmentShaderSrc) {
    let vertexShader;
    let fragmentShader;

    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSrc);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert("Kompilasi vertex shader gagal: " + gl.getShaderInfoLog(vertexShader));
        return null;
    }

    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSrc);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert("Kompilasi fragment shader gagal: " + gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Proses link program shader gagal: " + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

/**
 * Meratakan array JavaScript biasa ke Float32Array
 * @param {Array} arr 
 * @returns {Float32Array}
 */
function flatten(arr)
{
    let n = arr.length;
    let nested = false;

    if (Array.isArray(arr[0])) {
        nested = true;
        n = n * arr[0].length;
    }

    let result = new Float32Array(n);
    if (nested) {
        let current = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr[i].length; j++) {
                result[current] = arr[i][j];
                current++;
            }
        }
    } else {
        for (let i = 0; i < arr.length; i++) {
            result[i] = arr[i];
        }
    }

    return result;
}
