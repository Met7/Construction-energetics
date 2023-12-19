import * as helpers from "./helpers/helpers.js"; 
import * as htmlHelpers from "./helpers/html-helpers.js"; 
import * as materialsHelpers from "./helpers/materials-helpers.js"; 
import * as studiesHelpers from "./helpers/studies-helpers.js";
import * as technologiesHelpers from "./helpers/technologies-helpers.js"; 
import { loadFile } from "./data-handler.js";

// event for manual triggering
const event = new CustomEvent("change", { "detail": "Material manual trigger" });

let jobMaterials; // keep info about selected material per job

// --------------------------------------
// ------------------------- HTML HELPERS

// stageElement is expected to be the main stage parent that contains the data-stage attribute
function getStageName(stageElement) {
  return stageElement.getAttribute("data-stage");
}

function getJobElement(element) {
  return htmlHelpers.getAncestorElement(element, "job");
}

function getStageElement(element) {
  return htmlHelpers.getAncestorElement(element, "stage");
}

// collect custom stage parameters
function getExtraParameters(stageElement, valuesOnly = false) {
  let params = [];
  const inputElements = stageElement.getElementsByClassName("custom-input");
  for (let inputElement of inputElements) {
    let value;
    if (inputElement.nodeName  == "INPUT")
      value = inputElement.value;
    else if (inputElement.nodeName  == "SELECT")
      value = htmlHelpers.getSelectValue(inputElement);
    if (value) {
      if (valuesOnly)
        params.push(value)
      else
        params.push({"formula": inputElement.getAttribute("data-formula"), "value": value});
    }
  }
  return params;
}

// collect custom stage parameters
function setExtraParameters(stageElement, values) {
  const inputElements = stageElement.getElementsByClassName("custom-input");
  let i = 0;
  for (const inputElement of inputElements) {
    if (i == inputElements.length)
      break;
    if (inputElement.nodeName  == "INPUT")
      inputElement.value = values[i];
    else if (inputElement.nodeName  == "SELECT")
      htmlHelpers.setSelectedByText(inputElement, values[i]);
    i++;
  }
}


// --------------------------------------
// ---------------------- TECHNOLOGY DATA

const technologyData = await technologiesHelpers.loadTechnologies();
//console.log(technologyData);

// --------------------------------------
// ------------------------------- ENERGY

// called by job to pass callback function
let onEnergyChange;
function setEnergyChangeFunction(energyChangeFunction) {
  onEnergyChange = energyChangeFunction;
}

function getStageMhElement(element) {
  return getStageElement(element).querySelector(".stage-mh-label");
}

// Stage MH total - value in the header
function setStageMh(stageElement, mhAmount) {
  getStageMhElement(stageElement).innerHTML = helpers.formatEnergy(mhAmount);
  onEnergyChange(stageElement);
}

// --------------------------------------
// ------------------------- CREATE STAGE


function createStage(stageData) {
  console.log("Creating a stage - " + stageData.stageName);
  //console.log(stageData);
  
  let stageDiv = htmlHelpers.createElement('div', 'stage');
  stageDiv.setAttribute("data-stage", stageData.stageName);
  
  const columnCount = 4;
  // create the table
  let stageTable = htmlHelpers.createElement('table', 'stage-table');
  stageTable.classList.add(`stage-${stageData.stageName}`);
	
  // header row
  let columns = [htmlHelpers.createElement("p", 'stage-mh-label', helpers.formatEnergy(0))];
  let row = htmlHelpers.createTableRow("STAGE: " + stageData.stageName, columns, columnCount, [1, 3], true);
  stageTable.appendChild(row);
  
  // Stage-specific inputs
  for (const input of Object.values(stageData.inputs)) {
    let inputElement;
    if (input.type == 'select') {
      const inputElement = htmlHelpers.createSelect('custom-input');
      htmlHelpers.createOptions(inputElement, input.options); 
      inputElement.selectedIndex = stageData.selectedIndex;
    }
    else if (input.type == 'number') {
      inputElement = htmlHelpers.createElement("input", 'custom-input');
      inputElement.type = 'number';
      inputElement.min = 0;
      inputElement.value = input.defaultValue;
      inputElement.setAttribute("data-formula", input.formula);
    } else
      throw('stage-generator::createStage: Unknown input type - ' + input.type);
    
    row = htmlHelpers.createTableRow(input.label + ":", [inputElement], columnCount, [1, 3]);
    stageTable.appendChild(row);
  }
  
  // Approach select
  let approachSelect = htmlHelpers.createSelect('approach-select');
  row = htmlHelpers.createTableRow("Approach: ", [approachSelect], columnCount, [1, 3]);
  stageTable.appendChild(row);
  
  // Tool select
  let toolSelect = htmlHelpers.createSelect('tool-select');
  row = htmlHelpers.createTableRow("Tool: ", [toolSelect], columnCount, [1, 3]);
  stageTable.appendChild(row);
  
  // Study select
  let studySelect = htmlHelpers.createSelect('study-select');
  studySelect.addEventListener("change", () => {
    chooseStageStudy(
      stageTable,
      htmlHelpers.getSelectText(studySelect),
      htmlHelpers.getSelectData(studySelect, "author"),
      htmlHelpers.getSelectData(studySelect, "year"),
      htmlHelpers.getSelectData(studySelect, "unit"),
      htmlHelpers.getSelectValue(studySelect),
      extractConversions(studySelect)
    );
  });
  row = htmlHelpers.createTableRow("Study: ", [studySelect], columnCount, [1, 3]);
  stageTable.appendChild(row);
  
  // Approach and tool select events
  approachSelect.addEventListener("change", () => {
    chooseStageApproach(stageData.stageName, toolSelect, htmlHelpers.getSelectText(approachSelect));
  });
  toolSelect.addEventListener("change", () => {
    chooseStageTool(stageData.stageName, studySelect, htmlHelpers.getSelectText(approachSelect), htmlHelpers.getSelectText(toolSelect));
  });
  
  // output fields
  const defaultText = "N/A";
  stageTable.appendChild(htmlHelpers.createTableRow("Citation: ", [htmlHelpers.createElement("p", "citation", defaultText)], columnCount, [1, 3]));
  stageTable.appendChild(htmlHelpers.createTableRow("Study work speed: ", [htmlHelpers.createElement("p", "study-speed", defaultText)], columnCount, [1, 3]));
  const conversionFactorInput = htmlHelpers.createElement("input", "unit-conversion");
  conversionFactorInput.addEventListener("change", () => {
    console.log("Conversion input changed");
    updateMh(stageTable, conversionFactorInput.value);
  });
  stageTable.appendChild(htmlHelpers.createTableRow("Unit conversion factor:", [
    conversionFactorInput, 
    htmlHelpers.createElement("label", "", "Converted speed:"), 
    htmlHelpers.createElement("p", "total-speed", defaultText)
  ], columnCount));
  
  stageDiv.appendChild(stageTable);
 
  return stageDiv;
}

// --------------------------------------
// ------------------------------- EVENTS

function getApplicableTechnologies(stageName, materialCategory, material, approach = "", tool = "") {
  console.log("Get applicable tech for: " + stageName + ", " + materialCategory + ", " + material + ", " + approach + ", " + tool);
  //console.log(technologyData);
  if (!(stageName in technologyData)) {
    console.log("getApplicableTechnologies: Stage not found - quitting");
    return [];
  }
  
  const technologiesForStage = technologyData[stageName];
  
  //console.log("Tech for stage: ");
  //console.log(technologiesForStage);
  let technologies = technologiesForStage.filter(
    (tech) => helpers.strEq(tech.material_category, materialCategory) 
              && (tech.material == "*" || helpers.strEq(tech.material, material))
  ) // TODO support lists
  //console.log("Tech before approach: ");
  //console.log(technologies);
  
  // TODO support * and lists
  if (approach)
    technologies = technologies.filter((tech) => helpers.strEq(tech.approach, approach));
  if (tool)
    technologies = technologies.filter((tech) => helpers.strEq(tech.tool, tool));
  
  return technologies;
}


function setStageMaterial(stageElement, materialCategory, material) {
  const stageName = getStageName(stageElement);
  console.log("Set material for: " + stageName);
  const technologies = getApplicableTechnologies(stageName, materialCategory, material);
  
  const approachSelect = stageElement.querySelector(".approach-select");
  //let options = [{ label: "Choose", data: "0" }];
  let options = [];
  for (const tech of technologies) {
    options.push(tech.approach);
  }
  options = [...new Set(options)];
  htmlHelpers.createOptions(approachSelect, options);
  
  htmlHelpers.emptyInput(stageElement.querySelector(".tool-select"));
  htmlHelpers.emptyInput(stageElement.querySelector(".study-select"));
  //const toolSelect = stageElement.querySelector(".tool-select");
  //htmlHelpers.createOptions(toolSelect, []);
}


function chooseStageApproach(stageName, toolSelect, approach) {
  console.log("ChooseStageApproach for : " + stageName + ", approach: " + approach);
  
  if (htmlHelpers.isEmptyOption(approach)) {  
    htmlHelpers.emptyInput(toolSelect);
    toolSelect.dispatchEvent(new Event('change'));
    return;
  }
  
  const [materialCategory, material, unit] = getJobProperties(toolSelect);
  const technologies = getApplicableTechnologies(stageName, materialCategory, material, approach);
  let options = [];
  for (const tech of technologies)
    options.push(tech.tool);
  
  htmlHelpers.createOptions(toolSelect, options);
}


function chooseStageTool(stageName, studySelect, approach, tool) {
  console.log("ChooseStageTool for : " + stageName + ", approach: " + approach + ", tool: " + tool);
  
  if (htmlHelpers.isEmptyOption(tool)) {  
    htmlHelpers.emptyInput(studySelect);
    studySelect.dispatchEvent(new Event('change'));
    return;
  }
  
  const [materialCategory, material, unit] = getJobProperties(studySelect);
  const technologies = getApplicableTechnologies(stageName, materialCategory, material, approach, tool);

  //console.log(technologies);
  
  let options = [];
  for (const tech of technologies) {
    let optionsData = {
      "text": tech.author + " " + tech.year,
      "value": tech.speed,
      "author": tech.author,
      "year": tech.year,
      "unit": tech.unit
      // TODO conversion factor
    };
    //console.log("Checking conversions for select entry. Job unit> " + unit + ", tech unit:" + tech.unit);
    //if (tech.unit != unit && ("conversions" in tech)) {
    if ("conversions" in tech) {
      for (const conversionUnit of Object.keys(tech["conversions"]))
        optionsData["conversion-" + conversionUnit] = tech["conversions"][conversionUnit];
    }
    options.push(optionsData);
  }
  htmlHelpers.createOptions(studySelect, options);
}


// stageElement is some ancestor of the affected elements in the stage.
function chooseStageStudy(stageElement, approach, author, year, techUnit, speed, conversions) {
  console.log("chooseStageStudy for " + approach + ", " + author + ", " + year + ", " + techUnit + ", " + speed + ".");

  clearStage(stageElement, true);
  
  if (speed == -1) { // unsetting the study
    setStageMh(stageElement, 0);
    return;
  }

  let [materialCategory, material, jobUnit, jobAmount] = getJobProperties(stageElement);
  
  const citationP = stageElement.querySelector(".citation");
  const studySpeedP = stageElement.querySelector(".study-speed");
  
  citationP.innerHTML = studiesHelpers.getStudyCitation(author, year);
  studySpeedP.innerHTML = helpers.formatNumber(speed) + " " + helpers.formatUnit(techUnit) + "/h"; // TODO update unit by stage (extra input)
  
  setStageUnit(stageElement, materialCategory, material, jobUnit, jobAmount, techUnit, conversions, speed);
}


// --------------------------------------
// ------------------------------ OUTPUTS

function extractConversions(selectElement) {
  const allUnits = materialsHelpers.getSupportedUnits();
  let conversions = {};
  for (const unit of allUnits) {
    const conversionFactor = htmlHelpers.getSelectData(selectElement, "conversion-" + unit);
    if (conversionFactor) // TODO what does it return if it is not found?
      conversions[unit] = Number(conversionFactor);
  }
  return conversions;
}

// stageElement is a parent
// This may be called from the chooseStageStudy event, or from the outside when job unit changes.
// The first case already has all the params. In the other the local values need to be fetched.
function setStageUnit(stageElement, materialCategory, material, jobUnit, jobAmount, techUnit = '', techConversions = [], speed = -1) {
  const unitConversionInput = stageElement.querySelector(".unit-conversion");
  let studySelect;
  if (!techUnit || !techConversions)
    studySelect = stageElement.querySelector(".study-select");
  if (!techUnit)
    techUnit = htmlHelpers.getSelectData(studySelect, "unit");
  if (!techUnit) // no tech selected, so nothing else to do
    return;
  if (!techConversions)
    techConversions = htmlHelpers.getSelectData(extractConversions(studySelect), "unit");
  let conversionFactor = materialsHelpers.getConversionFactor(materialCategory, material, techUnit, jobUnit, techUnit, techConversions);
  if (conversionFactor == -1) {
    conversionFactor = 0;
    unitConversionInput.value = '';
  }
  else
    unitConversionInput.value = Number(conversionFactor.toFixed(2));
  updateMh(stageElement, conversionFactor, jobUnit, jobAmount);
}

// only used externally by job. No need to recalculate conversion.
function setStageAmount(stageElement, materialCategory, material, jobUnit, jobAmount) {
  const conversionFactor = stageElement.querySelector(".unit-conversion").value;
  if (conversionFactor)
    updateMh(stageElement, conversionFactor, jobUnit, jobAmount);
}

// Does the MH calculation and prints it.
// Expects that conversion factor is already correct. Receives or fetches job params, reads any extra stage params.
// stageElement is a parent
function updateMh(stageElement, conversionFactor, jobUnit = '', jobAmount = -1, speed = -1) {
  const convertedSpeedP = stageElement.querySelector(".total-speed");
  if (!jobUnit)
    jobUnit = getJobUnit(stageElement);
  if (jobAmount == -1)
    jobAmount = getJobAmount(stageElement);
  if (speed == -1)
    speed = htmlHelpers.getSelectValue(stageElement.querySelector(".study-select"));
  
  const convertedSpeed = speed * conversionFactor;
  convertedSpeedP.innerHTML = helpers.formatNumber(convertedSpeed, false) + " " + helpers.formatUnit(jobUnit) + "/h"; // TODO update unit by stage (extra input)
  
  // stage specific param, such as distance
  for (const extraParam of getExtraParameters(stageElement)) {
    if (!extraParam) {
      console.log("chooseStageStudy: empty extra param");
      continue;
    }
    console.log("chooseStageTool: multiplying jobAmount(" + jobAmount + ") by an extra param " + extraParam.value + " by " + extraParam.formula);
    if (extraParam.formula == "multiply")
      jobAmount *= extraParam.value;
    else if (extraParam.formula == "divide")
      jobAmount /= extraParam.value;
    else
      throw("stage-generator::updateMh: missing formula for extra param");
  }
  
  const totalMh = helpers.formatEnergy(jobAmount * convertedSpeed);
  setStageMh(stageElement, totalMh);
}

// --------------------------------------
// -------------------------- CLEAR STATE

function clearStage(stageElement, leaveCustom = false) {
  console.log("clearing stage");
  const inputs = stageElement.querySelectorAll("input");
  for (const input of inputs) {
    if (leaveCustom && input.classList.contains("custom-input"))
      continue;
    htmlHelpers.emptyInput(input);
  }
  
  const outputs = stageElement.querySelectorAll("p");
  for (const output of outputs)
    htmlHelpers.resetLabel(output);
}

// --------------------------------------
// ---------------------------- SAVE/LOAD

function saveStage(stageElement) {
  const extra = getExtraParameters(stageElement, true);
  let saveData = {
    "stage": htmlHelpers.getAncestorElement(stageElement, "stage").getAttribute("data-stage"), // ancestor should not be needed, but it will work if code changes.
    "custom-inputs": getExtraParameters(stageElement, true),
    "approach": htmlHelpers.getSelectText(stageElement.querySelector(".approach-select")),
    "tool": htmlHelpers.getSelectText(stageElement.querySelector(".tool-select")),
    "study": htmlHelpers.getSelectText(stageElement.querySelector(".study-select")),
    "conversion factor": stageElement.querySelector(".unit-conversion").value
  };
  //console.log(saveData);
  return saveData;
}


function loadStage(ancestorElement, saveData, stageData) {
  //console.log("Fetching stage " + ".stage-" + saveData["stage"]);
  //console.log(saveData);
  const stageElement = ancestorElement.querySelector(".stage-" + saveData["stage"]);
  clearStage(stageElement);
  
  setExtraParameters(stageElement, saveData["custom-inputs"])
  
  let select = stageElement.querySelector(".approach-select");
  htmlHelpers.setSelectedByText(select, saveData["approach"]);
  select.dispatchEvent(new Event('change'));
  
  select = stageElement.querySelector(".tool-select");
  htmlHelpers.setSelectedByText(select, saveData["tool"]);
  select.dispatchEvent(new Event('change'));
  
  select = stageElement.querySelector(".study-select");
  htmlHelpers.setSelectedByText(select, saveData["study"]);
  select.dispatchEvent(new Event('change'));
  
  let input = stageElement.querySelector(".unit-conversion");
  input.value = saveData["conversion factor"];
  input.dispatchEvent(new Event('change'));
}

// --------------------------------------
// ---------------------------------- JOB


function getJobProperties(element) {
  //console.log(element);
  element = getJobElement(element);
  const materialCategorySelect = element.querySelector(".material-category-select");
  if (!materialCategorySelect)
      throw("stage-generator::getJobProperties: Material category select not found.");
  const materialSelect = element.querySelector(".material-select");
  if (!materialSelect)
      throw("stage-generator::getJobProperties: Material select not found.");
  const unitSelect = element.querySelector(".unit-select");
    if (!unitSelect)
        throw("stage-generator::getJobProperties: Unit select not found.");
  const amountInput = element.querySelector(".amount-input");
    if (!amountInput)
        throw("stage-generator::getJobProperties: Amount input not found.");
  return [htmlHelpers.getSelectText(materialCategorySelect), htmlHelpers.getSelectText(materialSelect), htmlHelpers.getSelectText(unitSelect), amountInput.value];
}

// element param is from stage
function getJobUnit(element) {
  //console.log(element);
  element = getJobElement(element);
  const unitSelect = element.querySelector(".unit-select");
    if (!unitSelect)
        throw("stage-generator::getJobProperties: Unit select not found.");
  return htmlHelpers.getSelectText(unitSelect);
}

// element param is from stage
function getJobAmount(element) {
  //console.log(element);
  element = getJobElement(element);
  const amountInput = element.querySelector(".amount-input");
  if (!amountInput)
      throw("stage-generator::getJobAmount: Amount input not found.");
  return amountInput.value;
}


export {
  setEnergyChangeFunction,
  createStage,
  setStageMaterial,
  setStageUnit,
  setStageAmount,
  saveStage,
  loadStage
};