const defaultFolder = "./data/"

// TODO add browser caching

// Loads a file from givern folder.
// filename - without .json.
// first key in the json file should be the filename. Can be overriden by key.
async function loadFile(filename, folder = defaultFolder, key = '') {
  const filePath = folder + filename + '.json';
  console.log("Loading JSON data from: " + filePath);

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error('Error loading JSON: ' + response.status);
    }
    const data = await response.json();

    if (!key)
      key = filename;
    // Process the data and store it in an array
    const dataArray = data[key];
    //console.log(data);
    return dataArray;
    
    // Continue working with the array as needed
  } catch (error) {
    console.error(error);
  }
}

export { loadFile };
