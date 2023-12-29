import * as htmlHelpers from "./helpers/html-helpers.js"; 
import * as helpers from "./helpers/helpers.js"; 
import * as materialsHelpers from "./helpers/materials-helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createStage, setEnergyChangeFunction, setStageMaterial, setStageUnit, setStageAmount, saveStage, loadStage } from "./stage-generator.js";

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

// --------------------------------------
// ---------------------------- MATERIALS

function fillMaterialSelect(jobElement, materialSelect, materialCategory) {
  //console.log("filling material select for " + materialCategory);
  htmlHelpers.createOptions(materialSelect, Object.keys(materialsData[materialCategory]["data"]));
  updateStagesMaterial(jobElement, materialCategory, "");
  //console.log("YYY done");
  
  // TODO change event:
  // TODO enable and reset stages
  // TODO confirm dialog
  // TODO maybe put it on a button
}

function createMaterialCategorySelect() {
  const select = htmlHelpers.createSelect('material-category-select');
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

function createMaterialSelect(jobElement, materialCategorySelect) {
  const select = htmlHelpers.createSelect('material-select');
  select.addEventListener("change", () => {
    const materialCategory = htmlHelpers.getSelectText(materialCategorySelect);
    const material = htmlHelpers.getSelectText(select);
    updateStagesMaterial(jobElement, materialCategory, material)
  });
  return select;
}

function updateStagesMaterial(jobElement, materialCategory, material) {
    const stageElements = getStageElements(jobElement);
    for (let stageElement of stageElements) {
      setStageMaterial(stageElement, materialCategory, material);
    }
}


// --------------------------------------
// -------------------------------- UNITS

function createUnitSelect() {
  const select = htmlHelpers.createSelect('unit-select');
  htmlHelpers.createOptions(select, materialsHelpers.getSupportedUnits());
  return select;
}

// To be used both for unit select and amount input.
function setJobQuantityInputEvent(eventInput, jobElement, unitSelect, materialSelect, materialCategorySelect, amountInput) {
  eventInput.addEventListener("change", () => {
    const materialCategory = htmlHelpers.getSelectText(materialCategorySelect);
    const material = htmlHelpers.getSelectText(materialSelect);
    const unit = htmlHelpers.getSelectText(unitSelect);
    const jobAmount = amountInput.value;
    const stageElements = getStageElements(jobElement);
    //console.log("stageElements:");
    //console.log(stageElements);
    let isUnitInput= eventInput.classList.contains("unit-select"); // unit or amount input
    for (let stageElement of stageElements) {
      if (isUnitInput)
        setStageUnit(stageElement, materialCategory, material, unit, jobAmount);
      else
        setStageAmount(stageElement, materialCategory, material, unit, jobAmount);
    }
  });
}

function createAmountInput() {
  const input = htmlHelpers.createElement('input', 'amount-input');
  input.setAttribute("type", "number");
  return input;
}

// --------------------------------------
// ------------------------- HTML HELPERS

// --------------------------------------
// ------------------------------- STAGES

let jobData = await loadFile('stages');
//console.log(jobData);

function getStageElements(ancestorElement) {
  return ancestorElement.getElementsByClassName("stage");
}

// --------------------------------------
// ------------------------------- ENERGY

function recalculateJobEnergy(jobElement) {
  let totalJobEnergy = 0;

  const stageElements = getStageElements(jobElement);
  for (let stageElement of stageElements) {
    const mhLabel = stageElement.querySelector(".stage-mh-label");
    let textNumber = mhLabel.innerText.split(" ")[0];
    textNumber = textNumber.replace(/\,/g, "");
    //console.log("XXX " + textNumber);
    const energy = Number(textNumber);
    totalJobEnergy += energy;
  }
  
  jobElement.querySelector(".job-mh-label").innerText = helpers.formatEnergy(totalJobEnergy);
  //return totalJobEnergy;
}

function onStageEnergyChanged(stageElement) {
  recalculateJobEnergy(htmlHelpers.getAncestorElement(stageElement, "job"));
}

// --------------------------------------
// ------------------------------ TESTING


// --------------------------------------
// ---------------------------- SAVE/LOAD

function saveJob(jobElement) {
  let jobSave = {};
  jobSave["name"] = jobElement.querySelector(".job-name-input").value;
  jobSave["material-category"] = htmlHelpers.getSelectText(jobElement.querySelector(".material-category-select"))
  jobSave["material"] = htmlHelpers.getSelectText(jobElement.querySelector(".material-select"))
  jobSave["unit"] = htmlHelpers.getSelectText(jobElement.querySelector(".unit-select"))
  jobSave["amount"] = jobElement.querySelector(".amount-input").value;
  jobSave["stages"] = [];
  const stageElements = getStageElements(jobElement);
  for (let stageElement of stageElements) {
    jobSave["stages"].push(saveStage(stageElement));
  }
  jobSave["collapsed"] = jobElement.querySelector(".collapsible-content").getAttribute("data-open") == 1 ? 0 : 1
  
  //console.log("Saved job to local storage.");
  return jobSave;
}

function loadJob(jobElement, jobSave) {
  //const jobSave = JSON.parse(localStorage.getItem("save"));
  //console.log(jobSave);
  let input = jobElement.querySelector(".job-name-input");
  input.value = jobSave["name"];
  
  let select = jobElement.querySelector(".material-category-select");
  htmlHelpers.setSelectedByText(select, jobSave["material-category"]);
  select.dispatchEvent(new Event('change'));
  
  select = jobElement.querySelector(".material-select");
  htmlHelpers.setSelectedByText(select, jobSave["material"]);
  select.dispatchEvent(new Event('change'));
  
  select = jobElement.querySelector(".unit-select");
  htmlHelpers.setSelectedByText(select, jobSave["unit"]);
  select.dispatchEvent(new Event('change'));
  
  input = jobElement.querySelector(".amount-input");
  input.value = jobSave["amount"];
  select.dispatchEvent(new Event('change'));
  
  // load stages
  for (let stageData of jobSave["stages"]) {
    //console.log(stageData);
    loadStage(jobElement, stageData, jobData[stageData["stage"]]);
  }
  
  if (jobSave["collapsed"]) {
    //console.log("closing");
    htmlHelpers.collapseContent(jobElement.querySelector(".collapsible-content"));
  }
  //console.log("Loaded job from local storage.");
}

// --------------------------------------
// --------------------------------- JOBS

function createStages(jobTable, jobData, columnCount) {
  let i = 0;
  for (const stageData of Object.values(jobData)) {
    i++;
    //if (i == 1) continue; // skip first
    //if (i == 3) break; // skip 2+
    let stage = createStage(stageData);
    //setStageMaterial(stage, "stone", "limestone"); // TODO Read from selected materia1
    let td = htmlHelpers.createTd(stage);
    td.colSpan = columnCount;
    jobTable.appendChild(htmlHelpers.createTr(td));
  }
}

function createJob(jobId) {
  // Element structure
  let jobDiv = htmlHelpers.createElement("div", "job"); 
  jobDiv.id = `job-${jobId}`;
  
  // Job header row
  const jobHeader = htmlHelpers.createElement("div", ["job-header", "collapsible"]);
  const jobNameLabel = htmlHelpers.createElement("h2", "job-name", "Task");
  const input = htmlHelpers.createElement("input", "job-name-input");
  input.placeholder = "Task name ..."
  input.value = "";
  input.addEventListener('click', (e) => { e.stopPropagation(); }); // prevent collapsing of the parent div
  const mhLabel = htmlHelpers.createElement("p", "job-mh-label", "0 MH");
  jobHeader.appendChild(jobNameLabel);
  jobHeader.appendChild(input);
  jobHeader.appendChild(mhLabel);
  jobDiv.appendChild(jobHeader);
  
  // Job body
  const jobBody = htmlHelpers.createElement("div", ["stage-list", "collapsible-content"]);
  const jobTable = htmlHelpers.createElement("table", ["job-table"]);
  const columnCount = 3;

  // Material(Category) selects
  const materialCategorySelect = createMaterialCategorySelect();
  const materialSelect = createMaterialSelect(jobDiv, materialCategorySelect);
  setMaterialCategorySelectEvent(jobDiv, materialCategorySelect, materialSelect);
  let row = htmlHelpers.createTableRow("Material category:", [materialCategorySelect], columnCount);
  jobTable.appendChild(row); 
  row = htmlHelpers.createTableRow("Material:", [materialSelect], columnCount);
  jobTable.appendChild(row); 
  
  // Unit and amount
  const unitSelect = createUnitSelect();
  row = htmlHelpers.createTableRow("Unit for the material:", [unitSelect], columnCount);
  jobTable.appendChild(row);
  const amountInput = createAmountInput();
  row = htmlHelpers.createTableRow("Target number of units:", [amountInput], columnCount);
  jobTable.appendChild(row);
  // events
  setJobQuantityInputEvent(unitSelect, jobDiv, unitSelect, materialSelect, materialCategorySelect, amountInput);
  setJobQuantityInputEvent(amountInput, jobDiv, unitSelect, materialSelect, materialCategorySelect, amountInput);
  
  // Stages
  createStages(jobTable, jobData, columnCount);
  
  jobBody.appendChild(jobTable);
  jobDiv.appendChild(jobBody);
  
  htmlHelpers.makeCollapsible(jobHeader, 1000); // must be done after the content (jobBody) exists
  
  return jobDiv;
}

// --------------------------------------
// -------------------------------- SETUP

function setup() {
    setEnergyChangeFunction(onStageEnergyChanged);
}
setup();

export { 
  createJob,
  saveJob,
  loadJob
};