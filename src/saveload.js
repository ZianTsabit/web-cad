/// <reference path="webcad.js" />

/**
 * Save canvas
 */
function save() {
    /** @type {Webcad} */ const webcadRef = webcad

    // Remove circular dependencies, then convert objects to string
    webcadRef.objects.forEach(object => delete object.webcad);
    const objectsStr = JSON.stringify(webcadRef.objects);
    webcadRef.objects.forEach(object => object.webcad = webcadRef);
    console.log(objectsStr);
    
    // Create download element
    const downloadElement = document.createElement('a');
    downloadElement.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(objectsStr));
    downloadElement.setAttribute('download', 'webcad-save');
    downloadElement.style.display = 'none';
    document.body.appendChild(downloadElement);

    // Click and remove download element
    downloadElement.click();
    document.body.removeChild(downloadElement);
}

/**
 * Load canvas
 */
function load() {
    // Confirmation
    const confirmation = confirm("Do you want to continue? Existing objects will be discarded");
    if (!confirmation) {
        return;
    }

    // Create upload element
    const uploadElement = document.createElement('input');
    uploadElement.type = "file";
    uploadElement.accept = "application/json";
    uploadElement.style.display = 'none';
    document.body.appendChild(uploadElement);

    // Set onchange listener, then click the element
    uploadElement.onchange = fileUploaded;
    uploadElement.click();

    // Remove from body
    document.body.removeChild(uploadElement);
}

/**
 * Handle when a file has been uploaded
 * @param {Event} e 
 */
function fileUploaded(e) {
    // Check whether files empty
    /** @type {FileList} */
    const files = e.target.files
    if (files.length == 0) {
        return;
    }

    // Create file reader
    /** @type  {Webcad} */ const webcadRef = webcad
    const file = files[0];
    const reader = new FileReader();

    // Setting file reader on load
    reader.onload = (e) => {
        /** @type {Shape[]} */ const parsedObjects = []
        /** @type {Shape[]} */ const rawObjects = JSON.parse(e.target.result);
        
        // For each object, parse it to have appropriate methods
        let lastId = 1;
        rawObjects.forEach(rawObject => {
            const parsedObject = new shapeTypes[rawObject.type](rawObject.id, webcadRef);
            Object.assign(parsedObject, rawObject);

            parsedObjects.push(parsedObject);
            lastId = Math.max(parsedObject.id, lastId);
        });

        webcadRef.objects = parsedObjects;
        webcadRef.lastId = lastId + 1;
        webcadRef.render();
    }
    
    // Begin reading
    reader.readAsText(file)
}
