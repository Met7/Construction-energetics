import * as helpers from "./helpers/helpers.js"; 
import * as htmlHelpers from "./helpers/html-helpers.js"; 
import * as studiesHelpers from "./helpers/studies-helpers.js"; 
import { loadFile } from "./data-handler.js";

// 1m limestone 30.3mh/m -> 8.2MJ
// 1MD = 2.160kJ
// 1MH = 270kJ
// Dressing 57mh / m -> 15.4kJ
// Carry: 20kg*5km/h = 10t/m/270kJ = 27kJ/1t/m

// event for manual triggering
const event = new CustomEvent("change", { "detail": "Material manual trigger" });

const technologyData = await loadFile('technologies');

let jobMaterials; // keep info about selected material per job

//const materialsData = await loadFile('materials');
//console.log(materialsData);


// --------------------------------------
// ------------------------- HTML HELPERS

// stageElement is expected to be the main stage parent that contains the data-stage attribute
function getStageName(stageElement) {
  return stageElement.getAttribute("data-stage");
}

// --------------------------------------
// ---------------------- TECHNOLOGY DATA

let techData = await loadFile('technologies');
console.log(techData);

// --------------------------------------
// ------------------------------- ENERGY

// function getStageEnergyLabel(jobId, stageName) {
  // let stage = getStageElement(jobId, stageName);
  // return stage.querySelector('.energy-label label');
// }

// function calculateStageEnergy(jobId, stageData) {
  // if (!stageData.usesEnergy)
    // return 0;
  
  // let job = document.getElementById(`job-${jobId}`);
  
  // let formulaData = {};
  // // collect data for the formula
  // for (const param of Object.values(stageData.formula.params)) {
    // //console.log('Processing param: ' + param.id + ' of ' + param.source);
    // let stageName = param.source == 'current-stage' ? stageData.stageName : param.source;
    // let stage = job.querySelector('.stage-' + stageName);
    // let input = stage.querySelector('.' + param.id); // the html input
    // let value;

    // if (input.type == 'number') {
      // value = input.value;
    // } else if (input.type == 'select-one') {
      // value = getSelectData(input);
    // } else {
      // throw('Unknown param type for a stage formula');
    // }
    
    // formulaData[param.id] = parseFloat(value);
  // }
  
  // //console.log('formula data:');
  // //console.log(formulaData);
  // let result = 1;
  // if (stageData.formula.type == 'multiply') {
    // stageData.formula.params.forEach((param) => {
      // result *= formulaData[param.id];
    // });
  // }
  // return result;
// }

// function updateStageEnergy(jobId, stageData) {
  // if (!stageData.usesEnergy)
    // return 0;
  // const label = getStageEnergyLabel(jobId, stageData.stageName);
  // let newEnergy = calculateStageEnergy(jobId, stageData);
  // label.textContent = helpers.formatEnergy(newEnergy);
  // return newEnergy;
// }

// function recalculateJobEnergy(jobId) {
  // let totalJobEnergy = 0;
  // for (const stage of Object.values(jobData))
    // totalJobEnergy += updateStageEnergy(jobId, stage);

  // let job = document.getElementById(`job-${jobId}`);
  // let label = job.querySelector('.job-energy-label');
  // label.textContent = helpers.formatEnergy(totalJobEnergy);
// }

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
  let columns = [htmlHelpers.createElement('td')];
  if (stageData.usesEnergy)
    columns.push(htmlHelpers.createLabelTd('', 'X kJ', 'energy-label'));
  let row = htmlHelpers.createTableRow("STAGE: " + stageData.stageName, columns, columnCount, true);  
  stageTable.appendChild(row);
  
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
      htmlHelpers.getSelectValue(toolSelect)
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
  stageTable.appendChild(htmlHelpers.createTableRow("Unit conversion factor:", [htmlHelpers.createElement('input', 'unit-conversion')], columnCount));
  stageTable.appendChild(htmlHelpers.createTableRow("Total MH:", [htmlHelpers.createElement('p', 'total-mh')], columnCount));
  
  // further inputs
  for (const input of Object.values(stageData.inputs)) {
    let rowColumns = columnCount;
    row = htmlHelpers.createElement('tr', 'job-stage-TODO');
    row.appendChild(htmlHelpers.createLabelTd('quantity-label', input.label + ':'));
    rowColumns--;
    let cell = document.createElement('td');
    
    if (input.type == 'select') {
      const select = htmlHelpers.createElement('select', input.id);
      htmlHelpers.createOptions(select, input.options); 
      select.selectedIndex = stageData.selectedIndex;
      cell.appendChild(select);
    }
    else if (input.type == 'number') {
      const inputElement = htmlHelpers.createElement('input', input.id);
      inputElement.type = 'number';
      inputElement.min = 0;
      inputElement.value = input.defaultValue;
      cell.appendChild(inputElement);
    } else
      throw('Unknown input type for a job stage: ' + input.type);
    
    row.appendChild(cell);
    rowColumns--;
    
    for (let i = 0; i < rowColumns; i++)
      row.appendChild(htmlHelpers.createLabelTd('', 'TODO'));
    stageTable.appendChild(row);
  }
  
  stageDiv.appendChild(stageTable);
 
  return stageDiv;
}

// --------------------------------------
// ------------------------------- EVENTS

function getApplicableTechnologies(stageName, materialCategory, material, approach = "") {
  console.log("Get applicable tech XXX for: " + stageName + ", " + materialCategory + ", " + material + ", " + approach);
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
  
  const [materialCategory, material, unit] =  getJobProperties(toolSelect);
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

// stageElement is some ancestor of the affected elements in the stage.
function chooseStageTool(stageElement, approach, author, year, unit, speed) {
  // TODO
  console.log("chooseStageTool for " + approach + ", " + author + ", " + year + ", " + unit + ", " + speed + ".");
  const citationP = stageElement.querySelector(".citation");
  const studyUnitP = stageElement.querySelector(".study-unit");
  const studySpeedP = stageElement.querySelector(".study-speed");
  const unitConversionInput = stageElement.querySelector(".unit-conversion");
  const totalMhP = stageElement.querySelector(".total-mh");
  citationP.innerText = studiesHelpers.getStudyCitation(author, year);
  studyUnitP.innerText = unit;
  studySpeedP.innerText = speed + " " + unit + "/h";
  unitConversionInput.value = "LLLL";
  totalMhP.innerText = "CCCC";
}

// --------------------------------------
// ---------------------------------- JOB

function getJobElement(element) {
  let i = 0;
  do {
    element = element.parentElement;
    if (!element)
      throw("stage-generator::getJobElement: Job element not found.");
    i++;
  } while (!element.classList.contains("job"));
  return element;
}


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
  return [htmlHelpers.getSelectText(materialCategorySelect), htmlHelpers.getSelectText(materialSelect), htmlHelpers.getSelectText(unitSelect)];
}


function getJobUnit(element) {
  //console.log(element);
  element = getJobElement(element);
  const unitSelect = element.querySelector(".unit-select");
    if (!unitSelect)
        throw("stage-generator::getJobProperties: Unit select not found.");
  return htmlHelpers.getSelectText(unitSelect);
}


function getJobQuantity(element) {
  //console.log(element);
  element = getJobElement(element);
  const quantityInput = element.querySelector(".quantity-input");
  if (!quantityInput)
      throw("stage-generator::getJobQuantity: Quantity input not found.");
  return quantityInput.value;
}


export { createStage, setStageMaterial };