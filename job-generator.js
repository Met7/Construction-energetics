import * as helpers from "./helpers.js"; 

// 1m limestone 30.3mh/m -> 8.2MJ
// 1MD = 2.160kJ
// 1MH = 270kJ
// Dressing 57mh / m -> 15.4kJ
// Carry: 20kg*5km/h = 10t/m/270kJ = 27kJ/1t/m

// event for manual triggering
const event = new CustomEvent("change", { "detail": "Material manual trigger" });

var jobCount = 1;

// ----------------- MATERIAL SELECT EVENT

function addMaterialSelectEvent(jobId) {
  //alert(jobId);
  const materialSelect = document.querySelector(`#materials-${jobId}`);
  materialSelect.addEventListener("change", () => {
    const extractionSelect = document.querySelector(`#extraction-technology-${jobId}`);
    const processingSelect = document.querySelector(`#processing-${jobId}`);
    const puttingInPlaceSelect = document.querySelector(`#placement-${jobId}`);
    
    processingSelect.disabled = false;
    if (materialSelect.value === "timber") {
      createOptions(extractionSelect, [["Stone Axe (x50)", 50], ["Bronze Axe (x40)", 40], ["Bronze saw (x20)", 20], ["Iron Axe (x30)", 30], ["Iron Saw (x15)", 15]]);
      createOptions(processingSelect, [["Stone Axe (x50)", 50], ["Bronze Axe (x40)", 40], ["Iron Axe  (x30)", 30]]);
    } else if (materialSelect.value === "dirt") {
      createOptions(extractionSelect, [["Wooden shovel (x30)", 30], ["Iron shovel (x20)", 20]]);
      createOptions(processingSelect, [["N/A", 0]]);
      processingSelect.disabled = true;
    } else if (materialSelect.value === "limestone") {
    createOptions(extractionSelect, [["Channeling - copper chisel (x350)", 350], ["Channeling - iron chisel (x150)", 150], ["Diamond cable saw (x10)", 10]]);
      createOptions(processingSelect, [["Copper chisel (x500)", 500], ["Bronze chisel (x400)", 400], ["Iron chisel (x300)", 300]]);
    } else if (materialSelect.value === "granite") {
      createOptions(extractionSelect, [["Channeling - copper chisel (N/A)", "N/A"], ["Channeling - iron chisel", 150]]);
      createOptions(processingSelect, [["Copper chisel (N/A)", "N/A"], ["Bronze chisel (x400)", 400], ["Iron chisel (x300)", 300], ["Stone mallet (x400)", 400]]);
    } else alert("addMaterialSelectEvent - unknown value");

    extractionSelect.disabled = false;
    
    calculateJobEnergy(jobId);
  });

    //return materialSelect;
}

function updateTotal() {
  var total = 0;
  for (i = 1; i <= jobCount; i++) {
    total += parseFloat(document.querySelector(`#total-energy-${i}`).textContent);
  }
  document.querySelector("#total-energy-label").textContent = "Total: " + total.toFixed(1) + "kJ";
}

// ----------------- ADD JOB BUTTON


function createJobHeader(jobId) {
  const element = helpers.createElement('h2', 'job-header', `Job #${jobId}`);
  return element;
}

function createMaterialSelect(jobId) {
  const element = document.createElement('select');
  //element.textContent = stage + ' ' + jobId;
  //element.classList.add('job-header');
  return element;
}

// --------------------------------------
// --------------------------- STAGE DATA

let jobData = {
  'stageData': {
    'material': { 
      stageName: 'material',
      unit: 'mass', // TODO remove
      inputs: {
        'base-energy': {
          id: 'base-energy',
          label: 'Material',
          type: 'select',
          valueType: 'energy',
          options: [["Timber (15)", 15], ["Dirt (10)", 10], ["Limestone (40)", 40], ["Granite (60)", 60]],
          selectedIndex: 1
        },
        'mass': {
          id: 'mass',
          label: 'Mass (tons)', 
          type: 'number',
          valueType: 'mass',
          defaultValue: 1
        }
      },
      usesEnergy: false
    },
    'extraction': { 
      stageName: 'extraction',
      unit: 'mass',
      inputs: {
        'technology': {
          id: 'technology',
          label: 'Extraction Technology',
          type: 'select',
          valueType: 'technology',
          // TODO use data from technologies
          options: [["Stone Axe (x50)", 50], ["Bronze Axe (x40)", 40], ["Bronze saw (x20)", 20], ["Iron Axe (x30)", 30], ["Iron Saw (x15)", 15]],
          selectedIndex: 2
        }
      },
      usesEnergy: true,
      formula: { type: 'multiply', params: [
        { id: 'base-energy', source: 'material' },
        { id: 'mass', source: 'material' },
        { id: 'technology', source: 'current-stage' }
      ]}
    },
    'transportation': { 
      stageName: 'transportation',
      unit: 'distance',
      inputs: {
        'technology': {
          id: 'technology',
          label: 'Transportation Method',
          type: 'select',
          valueType: 'technology',
          // TODO use data from technologies
          options: [["Carry (30 kJ/ton/m)", 30], ["Cart (20 kJ/ton/m)", 20], ["Animal-Pulled Cart (5 kJ/ton/m)", 5]],
          selectedIndex: 3
        },
        'distance': {
          id: 'distance',
          label: 'Distance (meters)', 
          type: 'number',
          valueType: 'distance',
          defaultValue: 3
        }
      },
      usesEnergy: true,
      formula: { type: 'multiply', params: [
        { id: 'mass', source: 'material' }, // id corresponds to id in inputs
        { id: 'technology', source: 'current-stage' },
        { id: 'distance', source: 'current-stage' }
      ]}
    },
    'processing': { 
      stageName: 'processing',
      unit: 'energy',
      inputs: {
        'technology': {
          id: 'technology',
          label: 'Processing',
          type: 'select',
          valueType: 'technology',
          // TODO use data from technologies
          options: [["Stone Axe (x50)", 50], ["Bronze Axe (x40)", 40], ["Bronze saw (x20)", 20], ["Iron Axe (x30)", 30], ["Iron Saw (x15)", 15]],
          selectedIndex: 2
        }
      },
      usesEnergy: true,
      formula: { type: 'multiply', params: [
        { id: 'base-energy', source: 'material' },
        { id: 'mass', source: 'material' },
        { id: 'technology', source: 'current-stage' }
      ]}
    },
    'placement': { 
      stageName: 'placement',
      unit: 'distance',
      inputs: {
        'technology': {
          id: 'technology',
          label: 'Placement',
          type: 'select',
          valueType: 'technology',
          // TODO use data from technologies
          options: [["Scaffolding", 50], ["ramp", 40], ["crane", 30]],
          selectedIndex: 3
        },
        'elevation': {
          id: 'elevation',
          label: 'Height (meters)', 
          type: 'number',
          valueType: 'distance',
          defaultValue: 5
        }
      },
      usesEnergy: true,
      formula: { type: 'multiply', params: [
        { id: 'mass', source: 'material' }, // id corresponds to id in inputs
        { id: 'technology', source: 'current-stage' },
        { id: 'elevation', source: 'current-stage' }
      ]}
    }
  }
};


// --------------------------------------
// ------------------------------- ENERGY

function getStageEnergyLabel(jobId, stageName) {
  let job = document.getElementById(`job-${jobId}`);
  let stage = job.querySelector(`.stage-${stageName}`);
  let label = stage.querySelector('.energy-label label');
  return label;
  //return document.getElementById(`job-${jobId}`).querySelector(`.stage-${stageName}`).querySelector('.energy-label label');
}

function calculateStageEnergy(jobId, stageData) {
  if (!stageData.usesEnergy)
    return 0;
  
  let job = document.getElementById(`job-${jobId}`);
  
  let formulaData = {};
  // collect data for the formula
  for (const param of Object.values(stageData.formula.params)) {
    //console.log('Processing param: ' + param.id + ' of ' + param.source);
    let stageName = param.source == 'current-stage' ? stageData.stageName : param.source;
    let stage = job.querySelector('.stage-' + stageName);
    let input = stage.querySelector('.' + param.id); // the html input
    let value;

    if (input.type == 'number') {
      value = input.value;
    } else if (input.type == 'select-one') {
      value = input.options[input.selectedIndex].getAttribute('data')
    } else {
      throw('Unknown param type for a stage formula');
    }
    
    formulaData[param.id] = parseFloat(value);
  }
  
  //console.log('formula data:');
  //console.log(formulaData);
  let result = 1;
  if (stageData.formula.type == 'multiply') {
    stageData.formula.params.forEach((param) => {
      result *= formulaData[param.id];
    });
  }
  return result;
}

function updateStageEnergy(jobId, stageData) {
  if (!stageData.usesEnergy)
    return 0;
  const label = getStageEnergyLabel(jobId, stageData.stageName);
  let newEnergy = calculateStageEnergy(jobId, stageData);
  label.textContent = helpers.formatEnergy(newEnergy);
  return newEnergy;
}

function recalculateJobEnergy(jobId) {
  let totalJobEnergy = 0;
  for (const stage of Object.values(jobData.stageData))
    totalJobEnergy += updateStageEnergy(jobId, stage);

  let job = document.getElementById(`job-${jobId}`);
  let label = job.querySelector('.job-energy-label');
  label.textContent = helpers.formatEnergy(totalJobEnergy);
}

// --------------------------------------
// ------------------------------- STAGES

function createLabelTd(css, text, tdCss) {
  let cell = helpers.createElement('td', tdCss); 
  let label = helpers.createElement('label', css, text);
  cell.appendChild(label);
  return cell;
}

function createStage(jobId, columnCount, stageData) {
  let row = createJobStage(stageData.stageName);
  
  for (const input of Object.values(stageData.inputs)) {
    row.appendChild(createLabelTd('quantity-label', input.label + ':'));
    columnCount--;
    let cell = document.createElement('td');
    
    if (input.type == 'select') {
      const select = helpers.createElement('select', input.id);
      helpers.createOptions(select, input.options);
      select.selectedIndex = stageData.selectedIndex;
      cell.appendChild(select);
    }
    else if (input.type == 'number') {
      const inputElement = helpers.createElement('input', input.id);
      inputElement.type = 'number';
      inputElement.min = 0;
      inputElement.value = input.defaultValue;
      cell.appendChild(inputElement);
    } else
      throw('Unknown input type for a job stage: ' + input.type);
    
    row.appendChild(cell);
    columnCount--;
  }
 
  if (stageData.usesEnergy)
      columnCount--;
  for (let i = 0; i < columnCount; i++)
    row.appendChild(document.createElement('td'));
  
  if (stageData.usesEnergy)
    row.appendChild(createLabelTd('', 'X kJ', 'energy-label'));

  return row;
}

function createJobStage(stageName) {
  const row = helpers.createElement('tr', 'job-stage');
  row.classList.add(`stage-${stageName}`);
  return row;
}

// --------------------------------------
// --------------------------------- JOBS

// for testing
function createJobButton() {
  let button = document.createElement('button');
  button.textContent = 'Calculate energy';
  button.addEventListener('click', () => {
    recalculateJobEnergy(1);
  });
  return button;
}

function createJob(jobId, stages) {
  let jobDiv = helpers.createElement('div', 'job'); 
  jobDiv.id = `job-${jobId}`;
  jobDiv.appendChild(createJobHeader(jobId));
  
  let jobTable = helpers.createElement('table', 'job-table');
  
  const columnCount = 6;

  for (const stageData of Object.values(jobData.stageData)) {
    let stage = createStage(jobId, columnCount, stageData);
    jobTable.appendChild(stage);  
  }
  jobDiv.appendChild(jobTable);
  
  //console.log(stages);
  // stages.forEach((stageName) => {
    // let stage = createJobStage(jobId, stageName);
    // jobDiv.appendChild(stage)
  // });
  
  let jobEnergyLabel = helpers.createElement('label', 'job-energy-label');
  jobEnergyLabel.textContent = 'E';
  jobDiv.appendChild(jobEnergyLabel);
  
  jobDiv.appendChild(document.createElement('br'));
  jobDiv.appendChild(createJobButton());
  
  return jobDiv;
}
/*
document.addEventListener("DOMContentLoaded", () => {
  const jobsContainer = document.querySelector("#jobs-container");
  const jobContainer = jobsContainer.querySelector(".job-container");
  const addJobButton = document.querySelector("#add-job-button");

  addJobButton.addEventListener("click", () => {
    addMaterialSelectEvent(jobNumber);
    document.querySelector(`#materials-${jobNumber}`).dispatchEvent(event);
    calculateJobEnergy(jobNumber);  
    
    newJob.addEventListener("input", (event) => {
      if (event.target.matches(".job input, .job select")) {
        calculateJobEnergy(jobNumber);
      }
    });
  });

  jobContainer.addEventListener("input", (event) => {
    if (event.target.matches(".job input, .job select")) {
      //const job = event.target.closest(".job");
      calculateJobEnergy(1);
    }
  });

  addMaterialSelectEvent(1);

  // Dispatch/Trigger/Fire the event
  document.querySelector("#materials-1").dispatchEvent(event);

  //const firstJob = jobContainer.querySelector(".job");
  //calculateJobEnergy(firstJob);
  calculateJobEnergy(1);
});
*/
export { createJob };