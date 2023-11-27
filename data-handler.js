const folder = "./data/"

async function loadFile(dataKey) {
  const filePath = folder + dataKey + '.json';
  console.log("Loading JSON data from: " + filePath);

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error('Error loading JSON: ' + response.status);
    }
    const data = await response.json();

    // Process the data and store it in an array
    const dataArray = data[dataKey];
    //console.log(data);
    return dataArray;
    
    // Continue working with the array as needed
  } catch (error) {
    console.error(error);
  }
}

export { loadFile };
