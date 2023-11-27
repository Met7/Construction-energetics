import * as htmlHelpers from "./html-helpers.js"; 
import * as helpers from "./helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createStage } from "./stage-generator.js";

// 1m limestone 30.3mh/m -> 8.2MJ
// 1MD = 2.160kJ
// 1MH = 270kJ
// Dressing 57mh / m -> 15.4kJ
// Carry: 20kg*5km/h = 10t/m/270kJ = 27kJ/1t/m

// event for manual triggering
const event = new CustomEvent("change", { "detail": "Material manual trigger" });

const materialsData = await loadFile('materials');
//console.log(materialsData);

var jobCount = 1;

// ----------------- MATERIAL SELECT EVENT

function addMaterialSelectEvent(jobId) {
  //alert(jobId);
  const materialSelect = document.querySelector(`#materials-${jobId}`);
  materialSelect.addEventListener("change", () => {
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

// --------------------------------------
// ------------------------- HTML HELPERS

function createJobHeader(jobId) {
  const element = htmlHelpers.createElement('h2', 'job-header', `Job #${jobId}`);
  return element;
}

function createMaterialSelect(jobId) {
  const element = document.createElement('select');
  //element.textContent = stage + ' ' + jobId;
  //element.classList.add('job-header');
  return element;
}

function getSelected(input) {
  if (input.type != 'select-one')
    throw ('Input not a select');
  return input.options[input.selectedIndex];
}

function getSelectValue(input) {
  return getSelected(input).value;
}

function getSelectData(input) {
  return getSelected(input).getAttribute('data')
}

function getJobElement(jobId) {
  return document.getElementById('job-' + jobId);
}

function getStageElementInJob(jobElement, stageName) {
  return jobElement.querySelector('.stage-'  + stageName);
}

function getStageElement(jobId, stageName) {
  const jobElement = getJobElement(jobId);
  return getStageElementInJob(jobElement, stageName);
}

function getStageMaterialInJob(jobElement) {
  const stage = getStageElementInJob(jobElement, 'material');
  const input = stage.querySelector('.base-energy');
  return getSelectData(input);
}

function getStageMaterial(jobId) {
  return getStageMaterialInJob(getJobElement(jobId));
}

function getMaterialCategory(material) {
  const materialData = materialsData.find(element => element.name == material)
  if (typeof(material) == 'undefined')
    throw('No category for material ' + material);
  return materialData.category;
}

// --------------------------------------
// ---------------------- TECHNOLOGY DATA

// let techData = [
  // {
    // 'name': 'Stone extraction',
    // 'stages' : ['extraction'],
    // 'materials': [
      // { 'category': 'stone', 'materials': [] }
    // ],
    // 'unit': 'mass',
    // 'formula': 'material-multiplier', 
    // 'options': [
      // { 'text': 'Channeling - copper chisel', 'value': 350 },
      // { 'text': 'Channeling - iron chisel', 'value': 150 },
      // { 'text': 'Diamond cable saw', 'value': 10 }
    // ]
  // },
  // {
    // 'name': 'Stone processing',
    // 'stages' : ['processing'],
    // 'materials': [
      // { 'category': 'stone', 'materials': [] }
    // ],
    // 'unit': 'mass',
    // 'formula': 'material-multiplier', 
    // 'options': [
      // { 'text': 'Copper chisel', 'value': 300 },
      // { 'text': 'Bronze chisel', 'value': 250 },
      // { 'text': 'Iron chisel', 'value': 180 }
    // ]
  // },
  // {
    // 'name': 'Wood processing',
    // 'stages' : ['extraction', 'processing'],
    // 'materials': [
      // { 'category': 'wood', 'materials': [] }
    // ],
    // 'unit': 'volume',
    // 'formula': 'material-multiplier', 
    // 'options': [
      // { 'text': 'Stone Axe', 'value': 50 },
      // { 'text': 'Bronze Axe', 'value': 40 },
      // { 'text': 'Bronze saw', 'value': 20 },
      // { 'text': 'Iron Axe', 'value': 30 },
      // { 'text': 'Iron Saw', 'value': 15 }
    // ]
  // }
// ]

// --------------------------------------
// --------------------------- STAGE DATA

let jobData = await loadFile('stages');
//console.log(jobData);

// --------------------------------------
// ------------------------------- ENERGY

function getStageEnergyLabel(jobId, stageName) {
  let stage = getStageElement(jobId, stageName);
  return stage.querySelector('.energy-label label');
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
      value = getSelectData(input);
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
  for (const stage of Object.values(jobData))
    totalJobEnergy += updateStageEnergy(jobId, stage);

  let job = document.getElementById(`job-${jobId}`);
  let label = job.querySelector('.job-energy-label');
  label.textContent = helpers.formatEnergy(totalJobEnergy);
}

// --------------------------------------
// ------------------------------- STAGES

// function createLabelTd(css, text, tdCss) {
  // let cell = htmlHelpers.createElement('td', tdCss); 
  // let label = htmlHelpers.createElement('label', css, text);
  // cell.appendChild(label);
  // return cell;
// }

// function createStage(jobId, columnCount, stageData) {
  // let row = createJobStage(stageData.stageName);
  
  // for (const input of Object.values(stageData.inputs)) {
    // row.appendChild(createLabelTd('quantity-label', input.label + ':'));
    // columnCount--;
    // let cell = document.createElement('td');
    
    // if (input.type == 'select') {
      // const select = htmlHelpers.createElement('select', input.id);
      // helpers.createOptions(select, input.options);
      // select.selectedIndex = stageData.selectedIndex;
      // cell.appendChild(select);
    // }
    // else if (input.type == 'number') {
      // const inputElement = htmlHelpers.createElement('input', input.id);
      // inputElement.type = 'number';
      // inputElement.min = 0;
      // inputElement.value = input.defaultValue;
      // cell.appendChild(inputElement);
    // } else
      // throw('Unknown input type for a job stage: ' + input.type);
    
    // row.appendChild(cell);
    // columnCount--;
  // }
 
  // if (stageData.usesEnergy)
      // columnCount--;
  // for (let i = 0; i < columnCount; i++)
    // row.appendChild(document.createElement('td'));
  
  // if (stageData.usesEnergy)
    // row.appendChild(createLabelTd('', 'X kJ', 'energy-label'));

  // return row;
// }

// function createJobStage(stageName) {
  // const row = htmlHelpers.createElement('tr', 'job-stage');
  // row.classList.add(`stage-${stageName}`);
  // return row;
// }

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
  let jobDiv = htmlHelpers.createElement('div', 'job'); 
  jobDiv.id = `job-${jobId}`;
  jobDiv.appendChild(createJobHeader(jobId));
  
  let jobTable = htmlHelpers.createElement('table', 'job-table');
  
  const columnCount = 6;

  for (const stageData of Object.values(jobData)) {
    let stage = createStage(jobId, stageData);
    jobTable.appendChild(stage);  
  }
  jobDiv.appendChild(jobTable);
  
  //console.log(stages);
  // stages.forEach((stageName) => {
    // let stage = createJobStage(jobId, stageName);
    // jobDiv.appendChild(stage)
  // });
  
  let jobEnergyLabel = htmlHelpers.createElement('label', 'job-energy-label');
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