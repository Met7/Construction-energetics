// Select all the elements we will need
const jobContainer = document.querySelector('#job-container');
const addButton = document.querySelector('#add-job-button');
const materialSelects = document.querySelectorAll('.material-select');
const extractionSelects = document.querySelectorAll('.extraction-select');
const transportationSelects = document.querySelectorAll('.transportation-select');
const distanceInputs = document.querySelectorAll('.distance-input');
const energyDisplays = document.querySelectorAll('.energy-display');

// Define the energy calculation function
function calculateEnergy(material, quantity, extraction, distance) {
  const ENERGY_CONSTANT = {
    Timber: 1,
    Dirt: 0.5,
    Marble: 5,
    Granite: 15
  };
  const MASS_CONSTANT = {
    Timber: 500,
    Dirt: 1200,
    Marble: 2700,
    Granite: 2700
  };
  const energy = quantity * ENERGY_CONSTANT[material] * 1000;
  const mass = quantity * MASS_CONSTANT[material];
  const energyFromTransport = mass * distance * 10;
  return energy + energyFromTransport;
}

// Define the function to update the options for the later stages based on the selected material
function updateOptions(materialSelect, extractionSelect) {
  const selectedMaterial = materialSelect.value;
  const extractionOptions = {
    Timber: ['stone axe', 'bronze axe', 'iron axe', 'iron saw'],
    Dirt: ['stone pick', 'bronze pick', 'bronze chisel', 'iron chisel'],
    Marble: ['bronze pick', 'iron pick'],
    Granite: ['iron pick']
  };
  // Clear the previous options
  extractionSelect.innerHTML = '';
  // Add the new options
  extractionOptions[selectedMaterial].forEach(option => {
    const newOption = document.createElement('option');
    newOption.value = option;
    newOption.text = option;
    extractionSelect.appendChild(newOption);
  });
}

// Define the function to update the energy display for a job
function updateEnergy(jobIndex) {
  const materialSelect = materialSelects[jobIndex];
  const quantityInput = materialSelect.nextElementSibling;
  const extractionSelect = extractionSelects[jobIndex];
  const transportationSelect = transportationSelects[jobIndex];
  const distanceInput = distanceInputs[jobIndex];
  const energyDisplay = energyDisplays[jobIndex];
  const material = materialSelect.value;
  const quantity = Number(quantityInput.value);
  const extraction = extractionSelect.value;
  const distance = Number(distanceInput.value);
  const energy = calculateEnergy(material, quantity, extraction, distance);
  energyDisplay.textContent = energy.toLocaleString() + ' kJ';
}

// Add event listeners to update the options for the later stages when the material is selected
materialSelects.forEach((materialSelect, index) => {
  const extractionSelect = extractionSelects[index];
  updateOptions(materialSelect, extractionSelect);
  materialSelect.addEventListener('change', () => {
    updateOptions(materialSelect, extractionSelect);
    updateEnergy(index);
  });
});

// Add event listeners to update the energy display for a job when any value is changed
jobContainer.addEventListener('change', event => {
  const jobIndex = [...materialSelects].findIndex(select => select === event.target || select.nextElementSibling === event.target);
  updateEnergy(jobIndex);
});

// add button event listener
addButton.addEventListener('click', function() {
  // create a new job element and append it to the job container
  var newJob = createJobElement();
  jobContainer.appendChild(newJob);
});

// create job element function
function createJobElement() {
  // create job element and set class
  var jobElement = document.createElement('div');
  jobElement.classList.add('job');

  // create stages container and append it to job element
  var stagesContainer = document.createElement('div');
  stagesContainer.classList.add('stages-container');
  jobElement.appendChild(stagesContainer);

  // create first stage and append it to stages container
  var firstStage = createFirstStageElement();
  stagesContainer.appendChild(firstStage);

  // create total energy display element and append it to job element
  var totalEnergyDisplay = createTotalEnergyDisplayElement();
  jobElement.appendChild(totalEnergyDisplay);

  return jobElement;
}

// create first stage element function
function createFirstStageElement() {
  // create first stage element and set class
  var firstStageElement = document.createElement('div');
  firstStageElement.classList.add('stage');

  // create material select element and append it to first stage element
  var materialSelect = createMaterialSelectElement();
  firstStageElement.appendChild(materialSelect);

  // create quantity input element and append it to first stage element
  var quantityInput = createQuantityInputElement();
  firstStageElement.appendChild(quantityInput);

  // add event listener to material select element
  materialSelect.addEventListener('change', function() {
    // remove existing extraction, transportation, and processing stages (if any)
    removeStagesAfter(firstStageElement);

    // create extraction stage element and append it to stages container
    var extractionStage = createExtractionStageElement(materialSelect.value);
    firstStageElement.parentNode.appendChild(extractionStage);

    // create transportation stage element and append it to stages container
    var transportationStage = createTransportationStageElement();
    firstStageElement.parentNode.appendChild(transportationStage);

    // create processing stage element and append it to stages container
    var processingStage = createProcessingStageElement();
    firstStageElement.parentNode.appendChild(processingStage);
  });

  return firstStageElement;
}

// create total energy display element function
function createTotalEnergyDisplayElement() {
  // create total energy display element and set class
  var totalEnergyDisplayElement = document.createElement('div');
  totalEnergyDisplayElement.classList.add('total-energy-display');
  totalEnergyDisplayElement.textContent = 'Total energy: 0 kJ';

  return totalEnergyDisplayElement;
}

// remove stages after function
function removeStagesAfter(stageElement) {
  var stagesContainer = stageElement.parentNode;
  var stages = stagesContainer.children;

  for (var i = stages.length - 1; i >= 0; i--) {
    if (stages[i] !== stageElement) {
      stagesContainer.removeChild(stages[i]);
    } else {
      break;
    }
  }
}

function createMaterialSelectElement(stageIndex) {
  const materialSelect = document.createElement("select");
  const materialOptions = [
    { value: "Timber", text: "Timber" },
    { value: "Dirt", text: "Dirt" },
    { value: "Marble", text: "Marble" },
    { value: "Granite", text: "Granite" },
  ];
  materialOptions.forEach((option) => {
    const materialOption = document.createElement("option");
    materialOption.value = option.value;
    materialOption.textContent = option.text;
    materialSelect.appendChild(materialOption);
  });

  materialSelect.addEventListener("change", () => {
    const stageContainer = document.getElementById(`stage-${stageIndex}`);
    const extractionSelect = stageContainer.querySelector(".extraction-select");
    const transportSelect = stageContainer.querySelector(".transport-select");
    if (materialSelect.value === "Timber") {
      createOptions(extractionSelect, ["Stone Axe", "Bronze Axe", "Iron Axe"]);
    } else if (materialSelect.value === "Dirt") {
      createOptions(extractionSelect, ["Shovel", "Excavator"]);
    } else if (materialSelect.value === "Marble") {
      createOptions(extractionSelect, ["Pickaxe", "Diamond Saw"]);
    } else if (materialSelect.value === "Granite") {
      createOptions(extractionSelect, ["Drill", "Explosives"]);
    }

    extractionSelect.disabled = false;
    transportSelect.disabled = true;
    transportSelect.selectedIndex = 0;
  });

  return materialSelect;
}
