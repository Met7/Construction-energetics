import * as helpers from "./helpers/helpers.js"; 
import * as htmlHelpers from "./helpers/html-helpers.js"; 
import * as materialsHelpers from "./helpers/materials-helpers.js"; 
import * as studiesHelpers from "./helpers/studies-helpers.js";
import * as technologiesHelpers from "./helpers/technologies-helpers.js"; 
import { loadFile } from "./data-handler.js";

// 1m limestone 30.3mh/m -> 8.2MJ
// 1MD = 2.160kJ
// 1MH = 270kJ
// Dressing 57mh / m -> 15.4kJ
// Carry: 20kg*5km/h = 10t/m/270kJ = 27kJ/1t/m

// event for manual triggering
const event = new CustomEvent("change", { "detail": "Material manual trigger" });

let jobMaterials; // keep info about selected material per job

//const materialsData = await loadFile('materials');
//console.log(materialsData);


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
function getExtraParameters(stageElement) {
  let params = [];
  const inputElements = stageElement.getElementsByClassName("custom-input");
  for (let inputElement of inputElements) {
    if (inputElement.nodeName  == "INPUT")
      params.push(inputElement.value);
    else if (inputElement.nodeName  == "SELECT")
      params.push(htmlHelpers.getSelectValue(inputElement));
  }
  return params;
}

// --------------------------------------
// ---------------------- TECHNOLOGY DATA

const technologyData = await technologiesHelpers.loadTechnologies();
//console.log(technologyData);

// --------------------------------------
// ------------------------------- ENERGY

function getStageMhElement(element) {
  return getStageElement(element).querySelector(".stage-mh-label");
}

function setStageMh(stageElement, mhAmount) {
  getStageMhElement(stageElement).innerHTML = mhAmount + " MH";
}

// --------------------------------------
// ------------------------- CREATE STAGE


function createStage(jobId, stageData) {
  console.log("Creating a stage - " + stageData.stageName);
  //console.log(stageData);
  
  let stageDiv = htmlHelpers.createElement('div', 'stage');
  stageDiv.setAttribute("data-stage", stageData.stageName);
  
  const columnCount = 3;
  // create the table
  let stageTable = htmlHelpers.createElement('table', 'stage-table');
  stageTable.classList.add(`stage-${stageData.stageName}`);
	
  // header row
  let columns = [htmlHelpers.createElement('p', 'stage-mh-label', '0 MH')];
  let row = htmlHelpers.createTableRow("STAGE: " + stageData.stageName, columns, columnCount, true);  
  stageTable.appendChild(row);
  
  // Stage-specific inputs
  for (const input of Object.values(stageData.inputs)) {
    let inputElement;
    if (input.type == 'select') {
      const inputElement = htmlHelpers.createElement('select', 'custom-input');
      htmlHelpers.createOptions(inputElement, input.options); 
      inputElement.selectedIndex = stageData.selectedIndex;
    }
    else if (input.type == 'number') {
      inputElement = htmlHelpers.createElement('input', 'custom-input');
      inputElement.type = 'number';
      inputElement.min = 0;
      inputElement.value = input.defaultValue;
    } else
      throw('stage-generator::createStage: Unknown input type - ' + input.type);
    
    row = htmlHelpers.createTableRow(input.label + ":", [inputElement], columnCount);
    stageTable.appendChild(row);
  }
  
  // Approach select
  let approachSelect = htmlHelpers.createElement('select', 'approach-select');
  row = htmlHelpers.createTableRow("Approach: ", [approachSelect], columnCount);
  stageTable.appendChild(row);
  
  // Tool select
  let toolSelect = htmlHelpers.createElement('select', 'tool-select');
  toolSelect.addEventListener("change", () => {
    chooseStageTool(
      stageTable,
      htmlHelpers.getSelectText(toolSelect),
      htmlHelpers.getSelectData(toolSelect, "author"),
      htmlHelpers.getSelectData(toolSelect, "year"),
      htmlHelpers.getSelectData(toolSelect, "unit"),
      htmlHelpers.getSelectValue(toolSelect),
      extractConversions(toolSelect)
    );
  });
  row = htmlHelpers.createTableRow("Tool: ", [toolSelect], columnCount);
  stageTable.appendChild(row);
  
  // Approach select event
  approachSelect.addEventListener("change", () => {
    chooseStageApproach(stageData.stageName, toolSelect, htmlHelpers.getSelectText(approachSelect));
  });
  
  // output fields
  stageTable.appendChild(htmlHelpers.createTableRow("Citation: ", [htmlHelpers.createElement('p', 'citation')], columnCount));
  stageTable.appendChild(htmlHelpers.createTableRow("Study unit: ", [htmlHelpers.createElement('p', 'study-unit')], columnCount));
  stageTable.appendChild(htmlHelpers.createTableRow("Study units/h: ", [htmlHelpers.createElement('p', 'study-speed')], columnCount));
  const conversionFactorInput = htmlHelpers.createElement('input', 'unit-conversion');
  conversionFactorInput.addEventListener("change", () => {
    updateMh(stageTable, conversionFactorInput.value);
  });
  stageTable.appendChild(htmlHelpers.createTableRow("Unit conversion factor:", [conversionFactorInput], columnCount));
  stageTable.appendChild(htmlHelpers.createTableRow("Converted units/h: ", [htmlHelpers.createElement('p', 'total-speed')], columnCount));
  stageTable.appendChild(htmlHelpers.createTableRow("Total MH:", [htmlHelpers.createElement('p', 'total-mh')], columnCount));
  
  stageDiv.appendChild(stageTable);
 
  return stageDiv;
}

// --------------------------------------
// ------------------------------- EVENTS

function getApplicableTechnologies(stageName, materialCategory, material, approach = "") {
  console.log("Get applicable tech XXX for: " + stageName + ", " + materialCategory + ", " + material + ", " + approach);
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
  
  if (approach)
    technologies = technologies.filter((tech) => helpers.strEq(tech.approach, approach));
  
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
  
  const toolSelect = stageElement.querySelector(".tool-select");
  htmlHelpers.createOptions(toolSelect, []);
}

function chooseStageApproach(stageName, toolSelect, approach) {
  console.log("ChooseStageApproach for : " + stageName + ", approach: " + approach);
  
  const [materialCategory, material, unit] = getJobProperties(toolSelect);
  const technologies = getApplicableTechnologies(stageName, materialCategory, material, approach);

  //console.log(technologies);
  
  let options = [];
  for (const tech of technologies) {
    let optionsData = {
      "text": tech.tool + " (" + tech.author + " " + tech.year + ")",
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
  htmlHelpers.createOptions(toolSelect, options);
}

function extractConversions(selectElement) {
  const allUnits = materialsHelpers.getSupportedUnits();
  let conversions = {};
  for (const unit of allUnits) {
    const conversionFactor = htmlHelpers.getSelectData(selectElement, "conversion-" + unit);
    //console.log("extractConversions: LF conversion for " + unit + ", found " + conversionFactor);
    if (conversionFactor) { // TODO what does it return if it is not found?
      conversions[unit] = Number(conversionFactor);
      //console.log("extractConversions: found conversion for " + unit + " -> " + conversionFactor);
    }
  }
  return conversions;
}

// stageElement is a parent
function changeJobUnit(stageElement, materialCategory, material, jobUnit, jobAmount, techUnit = '', techConversions = [], speed = -1) {
  const unitConversionInput = stageElement.querySelector(".unit-conversion");
  let techSelect;
  if (!techUnit || !techConversions)
    techSelect = stageElement.querySelector(".tool-select");
  if (!techUnit)
    techUnit = htmlHelpers.getSelectData(techSelect, "unit");
  if (!techConversions)
    techConversions = htmlHelpers.getSelectData(extractConversions(techSelect), "unit");
  const conversionFactor = materialsHelpers.getConversionFactor(materialCategory, material, techUnit, jobUnit, techUnit, techConversions);
  unitConversionInput.value = Number(conversionFactor.toFixed(2));
  updateMh(stageElement, conversionFactor, jobUnit, jobAmount);
}

// stageElement is a parent
function updateMh(stageElement, conversionFactor, jobUnit = '', jobAmount = -1, speed = -1) {
  const convertedSpeedP = stageElement.querySelector(".total-speed");
  const totalMhP = stageElement.querySelector(".total-mh");
  if (!jobUnit)
    jobUnit = getJobUnit(stageElement);
  if (jobAmount == -1)
    jobAmount = getJobAmount(stageElement);
  if (speed == -1)
    speed = htmlHelpers.getSelectValue(stageElement.querySelector(".tool-select"));
  
  const convertedSpeed = speed * conversionFactor;
  convertedSpeedP.innerHTML = Number(convertedSpeed.toFixed(2)) + " " + helpers.formatUnit(jobUnit) + "/h"; // TODO update unit by stage (extra input)
  
  // stage specific param, such as distance
  for (const extraParam of getExtraParameters(stageElement)) {
    if (!extraParam) {
      console.log("chooseStageTool: empty extra param");
      continue;
    }
    console.log("chooseStageTool: multiplying jobAmount(" + jobAmount + ") by an extra param " + extraParam);
    jobAmount *= extraParam;
  }
  
  const totalMh = Number((jobAmount * convertedSpeed).toFixed(2));
  totalMhP.innerText = totalMh;
  setStageMh(stageElement, totalMh);
}

// stageElement is some ancestor of the affected elements in the stage.
function chooseStageTool(stageElement, approach, author, year, techUnit, speed, conversions) {
  console.log("chooseStageTool for " + approach + ", " + author + ", " + year + ", " + techUnit + ", " + speed + ".");
  let [materialCategory, material, jobUnit, jobAmount] = getJobProperties(stageElement);
  
  const citationP = stageElement.querySelector(".citation");
  const studyUnitP = stageElement.querySelector(".study-unit");
  const studySpeedP = stageElement.querySelector(".study-speed");
  
  citationP.innerHTML = studiesHelpers.getStudyCitation(author, year);
  studyUnitP.innerText = techUnit;
  studySpeedP.innerHTML = speed + " " + helpers.formatUnit(techUnit) + "/h"; // TODO update unit by stage (extra input)
  
  changeJobUnit(stageElement, materialCategory, material, jobUnit, jobAmount, techUnit, conversions, speed);
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


export { createStage, setStageMaterial };