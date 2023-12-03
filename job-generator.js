import * as htmlHelpers from "./html-helpers.js"; 
import * as helpers from "./helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createStage, setStageMaterial } from "./stage-generator.js";

// 1m limestone 30.3mh/m -> 8.2MJ
// 1MD = 2.160kJ
// 1MH = 270kJ
// Dressing 57mh / m -> 15.4kJ
// Carry: 20kg*5km/h = 10t/m/270kJ = 27kJ/1t/m

// event for manual triggering
const event = new CustomEvent("change", { "detail": "MaterialCategory manual trigger" });

const materialsData = await loadFile('materials');
//console.log(materialsData);

var jobCount = 1;



// TODO use or delete
function updateTotal() {
  var total = 0;
  for (i = 1; i <= jobCount; i++) {
    total += parseFloat(document.querySelector(`#total-energy-${i}`).textContent);
  }
  document.querySelector("#total-energy-label").textContent = "Total: " + total.toFixed(1) + "kJ";
}

// --------------------------------------
// ---------------------- MATERIAL EVENTS

function fillMaterialSelect(jobElement, materialSelect, materialCategory) {
  //console.log("XXX making options for materials");
  
  let subMaterials = [];
  console.log(materialsData[materialCategory]);
  for (const subMaterial of materialsData[materialCategory]) {
    subMaterials.push(subMaterial.name);
  }
  htmlHelpers.createOptions(materialSelect, subMaterials);
  //console.log("YYY done");
  
  // TODO change event:
  // TODO enable and reset stages
  // TODO confirm dialog
}

function createMaterialCategorySelect() {
  const select = htmlHelpers.createElement('select', 'material-category-select');
  htmlHelpers.createOptions(select, Object.keys(materialsData));
  //console.log(Object.keys(materialsData));
  return select;
}

function setMaterialCategorySelectEvent(jobElement, materialCategorySelect, materialSelect) {
  materialCategorySelect.addEventListener("change", () => {
    fillMaterialSelect(jobElement, materialSelect, htmlHelpers.getSelectText(materialCategorySelect));
    // TODO disable stages until material is selected.
    // TODO confirm dialog
  });
}

function creatematerialSelect(jobElement, materialCategorySelect) {
  const select = htmlHelpers.createElement('select', 'material-select');
  select.addEventListener("change", () => {
    const materialCategory = htmlHelpers.getSelectText(materialCategorySelect);
    const subMaterial = htmlHelpers.getSelectText(select);
    const stageElements = getStageElements(jobElement);
    for (let stageElement of stageElements) {
      setStageMaterial(stageElement, materialCategory, subMaterial);
    }
  });
  return select;
}

// --------------------------------------
// ------------------------- HTML HELPERS

function createJobHeader(jobId) {
  const element = htmlHelpers.createElement('h2', 'job-header', `Job #${jobId}`);
  return element;
}

// TODO use or delete all bellow

// function getJobElement(jobId) {
  // return document.getElementById('job-' + jobId);
// }

// function getStageElementInJob(jobElement, stageName) {
  // return jobElement.querySelector('.stage-'  + stageName);
// }

// function getStageElement(jobId, stageName) {
  // const jobElement = getJobElement(jobId);
  // return getStageElementInJob(jobElement, stageName);
// }

// function getStageMaterialCategoryInJob(jobElement) {
  // const stage = getStageElementInJob(jobElement, 'material');
  // const input = stage.querySelector('.base-energy');
  // return htmlHelpers.getSelectData(input);
// }

// function getStageMaterialCategory(jobId) {
  // return getStageMaterialCategoryInJob(getJobElement(jobId));
// }

// function getMaterialCategoryCategory(material) {
  // const materialData = materialsData.find(element => element.name == material)
  // if (typeof(material) == 'undefined')
    // throw('No category for material ' + material);
  // return materialData.category;
// }

// --------------------------------------
// ------------------------------- STAGES

let jobData = await loadFile('stages');
//console.log(jobData);

function getStageElements(ancestorElement) {
  return ancestorElement.getElementsByClassName("stage");
}

// --------------------------------------
// ------------------------------- ENERGY

// function recalculateJobEnergy(jobId) {
  // let totalJobEnergy = 0;
  // for (const stage of Object.values(jobData))
    // totalJobEnergy += updateStageEnergy(jobId, stage);

  // let job = document.getElementById(`job-${jobId}`);
  // let label = job.querySelector('.job-energy-label');
  // label.textContent = helpers.formatEnergy(totalJobEnergy);
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
  const columnCount = 2;
  
  
  // Material(Category) selects
  const materialCategorySelect = createMaterialCategorySelect();
  const materialSelect = creatematerialSelect(jobDiv, materialCategorySelect);
  setMaterialCategorySelectEvent(jobDiv, materialCategorySelect, materialSelect);
  
  // TODO rename submaterial to material
  
  let row = htmlHelpers.createTableRow("MaterialCategory category:", [materialCategorySelect], columnCount);
  jobTable.appendChild(row); 
  
  row = htmlHelpers.createTableRow("MaterialCategory:", [materialSelect], columnCount);
  jobTable.appendChild(row); 

  for (const stageData of Object.values(jobData)) {
    let stage = createStage(jobId, stageData);
    setStageMaterial(stage, "stone", "limestone"); // TODO Read from selected materia1
    let td = htmlHelpers.createTd(stage);
    td.colSpan = columnCount;
    jobTable.appendChild(htmlHelpers.createTr(td));
    break; // TODO remove
  }
  jobDiv.appendChild(jobTable);// TODO consider whether table is needed
    
  const jobEnergyLabel = htmlHelpers.createElement('label', 'job-energy-label', 'E');
  jobDiv.appendChild(jobEnergyLabel);
  
  jobDiv.appendChild(document.createElement('br'));
  jobDiv.appendChild(createJobButton());
  
  return jobDiv;
}


export { createJob };