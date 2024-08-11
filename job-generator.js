import * as htmlHelpers from "./helpers/html-helpers.js"; 
import * as helpers from "./helpers/helpers.js";
import * as materialsHelpers from "./helpers/materials-helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createStage, setCloneStageFunction, setEnergyChangeFunction, setStageMaterial, setStageUnit, setStageAmount, saveStage, loadStage } from "./stage-generator.js";

// event for manual triggering
const event = new CustomEvent("change", { "detail": "MaterialCategory manual trigger" });

const materialsData = await loadFile('materials');
//console.log(materialsData);

var jobCount = 1;
const columnCount = 3;

// --------------------------------------
// ---------------------------- MATERIALS

function fillMaterialSelect(jobElement, materialSelect, materialCategory) {
 if (materialCategory == htmlHelpers.defaultSelectText)
   return;

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
    let isUnitInput = eventInput.classList.contains("unit-select"); // unit or amount input
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

let stageTemplates = await loadFile('stages');
//console.log(stageTemplates);

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
    const energy = helpers.unformatEnergy(mhLabel.innerText);
    totalJobEnergy += energy;
  }
  
  jobElement.querySelector(".job-mh-label").innerText = helpers.formatEnergy(totalJobEnergy);
  onEnergyChange();
}

function onStageEnergyChanged(stageElement) {
  recalculateJobEnergy(htmlHelpers.getAncestorElement(stageElement, "job"));
}

let onEnergyChange;
function setJobEnergyChangeFunction(energyChangeFunction) {
  onEnergyChange = energyChangeFunction;
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
  jobSave["collapsed"] = jobElement.querySelector(".collapsible-content").classList.contains('open') ? 0 : 1;
  
  //console.log("Saved job to local storage.");
  return jobSave;
}

function loadJob(jobElement, jobSave) {
  //const jobSave = JSON.parse(localStorage.getItem("save"));
  //console.log(jobSave);
  const jobTable = jobElement.querySelector(".job-table");
  // create stages, the following events will fill their selects.
  let firstStageElement = null;
  for (let stageData of jobSave["stages"]) {
    //console.log(stageData);
    const stageElement = addStage(jobTable, stageTemplates[stageData["stage"]])
    if (!firstStageElement) // store the first stage for later use
      firstStageElement = stageElement;
    loadStage(stageElement, stageData/*, stageTemplates[stageData["stage"]]*/); // in stage-generator
  }
  
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
  
  // load the stage data
  let stageElement = firstStageElement;
  for (let stageData of jobSave["stages"]) {
    loadStage(stageElement, stageData/*, stageTemplates[stageData["stage"]]*/); // in stage-generator
    const tr = stageElement.parentElement.parentElement;
    const nextTr = tr.nextSibling;
    if (nextTr != null) // this will fail for the last; cycle is driven by the corresponding saved stages.
      stageElement = nextTr.childNodes[0].childNodes[0];
  }
  
  
  const content = jobElement.querySelector(".collapsible-content");
  if (jobSave["collapsed"])
    content.classList.remove("open");
  else
    content.classList.add("open");
}

// --------------------------------------
// ------------------------------- STAGES

function addStage(jobTable, stageTemplate) {
  const stage = createStage(stageTemplate);
  const td = htmlHelpers.createTd(stage);
  td.colSpan = columnCount;
  jobTable.appendChild(htmlHelpers.createTr(td));
	return stage;
}

function cloneStage(originalStageElement, stageName) {
  const stage = createStage(stageTemplates[stageName]);
  const td = htmlHelpers.createTd(stage);
  td.colSpan = columnCount;
  const stageTr = originalStageElement.parentElement.parentElement;
  stageTr.after(htmlHelpers.createTr(td));
  
  const jobElement = htmlHelpers.getAncestorElement(stage, "job-table");
  const materialCategory = htmlHelpers.getSelectText(jobElement.querySelector(".material-category-select"));
  const material = htmlHelpers.getSelectText(jobElement.querySelector(".material-select"));
  setStageMaterial(stage, materialCategory, material);
}

function createDefaultStages(jobTable, stageTemplates) {
  //let i = 0;
  for (const stageTemplate of Object.values(stageTemplates)) {
    //i++;
    //if (i == 1) continue; // skip first
    //if (i == 3) break; // skip 2+
    addStage(jobTable, stageTemplate)
  }
}

// --------------------------------------
// --------------------------------- JOBS

function createJob(jobId, loading = false) {
  // Element structure
  let jobDiv = htmlHelpers.createElement("div", "job");
  jobDiv.classList.add("panel");
  jobDiv.id = `job-${jobId}`;
  
  // Job header row
  const jobHeader = htmlHelpers.createElement("div", ["job-header", "collapsible"]);
  const jobNameLabel = htmlHelpers.createElement("h2", "job-name", "Task");
  const input = htmlHelpers.createElement("input", "job-name-input");
  input.placeholder = "Task name ..."
  input.value = "";
  input.addEventListener('click', (e) => { e.stopPropagation(); }); // prevent collapsing of the parent div
  jobHeader.appendChild(jobNameLabel);
  jobHeader.appendChild(input);
  
  const headerRightSide = htmlHelpers.createElement("div", "job-header-right-side");
  
  const mhLabel = htmlHelpers.createElement("p", "job-mh-label", "0 MH");
  headerRightSide.appendChild(mhLabel);
  
  let buttonUp = htmlHelpers.createElement("button", ["icon-button", "icon-button-small-arrow-up-white"], "");
  buttonUp.title = "Move up";
  buttonUp.addEventListener("click", (e) => {
    e.stopPropagation();
    sortUpFunction(jobDiv);
  });
  let buttonDown = htmlHelpers.createElement("button", ["icon-button", "icon-button-small-arrow-down-white"], "");
  buttonDown.title = "Move down";
  buttonDown.addEventListener("click", (e) => {
    e.stopPropagation();
    sortDownFunction(jobDiv);
  });
  headerRightSide.appendChild(buttonUp);
  headerRightSide.appendChild(buttonDown);
  
  jobHeader.appendChild(headerRightSide);
  
  jobDiv.appendChild(jobHeader);
  
  // Job body
  const jobBody = htmlHelpers.createElement("div", ["stage-list", "collapsible-content", "open"]);
  const jobTable = htmlHelpers.createElement("table", ["job-table"]);

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
  if (!loading)
	createDefaultStages(jobTable, stageTemplates);
  
  jobBody.appendChild(jobTable);
  jobDiv.appendChild(jobBody);
  
  // Needs to be done after the content is instantiated
  htmlHelpers.makeCollapsible(jobHeader);
  
  return jobDiv;
}

// --------------------------------------
// -------------------------------- SETUP

function setup() {
    setCloneStageFunction(cloneStage);
    setEnergyChangeFunction(onStageEnergyChanged);
}
setup();

let sortUpFunction, sortDownFunction;
function setSortFunctions(up, down) {
  sortUpFunction = up;
  sortDownFunction = down;
}

export { 
  createJob,
  saveJob,
  loadJob,
  setJobEnergyChangeFunction,
  setSortFunctions
};
