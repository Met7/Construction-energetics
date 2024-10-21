import * as helpers from "./helpers/helpers.js"; 
import * as htmlHelpers from "./helpers/html-helpers.js"; 
import * as materialsHelpers from "./helpers/materials-helpers.js"; 
import * as studiesHelpers from "./helpers/studies-helpers.js";
import * as technologiesHelpers from "./helpers/technologies-helpers.js"; 
                   
const defaultTechTooltip = "No study selected";                   
const worksForAllText = "Any";
const usesNothingText = "None";
const manualTechText = "Set Manually";
const unspecifiedText = "Unspecified";

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

function createExtraParameterInput(stageElement, name) {
  //console.log("Creating custom input, name: " + name);
  let inputElement;
  inputElement = htmlHelpers.createElement("input", 'custom-input');
  inputElement.type = 'number';
  inputElement.min = 0;
  inputElement.value = 0;
  inputElement.setAttribute("data-name", name);
  
  inputElement.addEventListener("change", () => {
    //console.log("Custom input changed");
    updateMh(stageElement);
  });
  
  const columnCount = stageElement.getAttribute("data-column-count");
  let row = htmlHelpers.createTableRow(name + ":", [inputElement], columnCount, [1, 4]);
  row.classList.add("custom-input-row");
  stageElement.insertBefore(row, stageElement.getElementsByClassName("work-rate-row")[0]);
}

// collect custom stage parameters
function getExtraParameters(stageElement, valuesOnly = false) {
  let params = [];
  const inputElements = stageElement.getElementsByClassName("custom-input");
  for (let inputElement of inputElements) {
    let value;
    if (inputElement.nodeName == "INPUT")
      value = inputElement.value;
    else if (inputElement.nodeName == "SELECT") // not used atm
      value = htmlHelpers.getSelectValue(inputElement);
    if (value) {
      if (valuesOnly)
        params.push(value)
      else
        params.push({"name": inputElement.getAttribute("data-name"), "value": value});
    }
  }
  return params;
}

// set custom stage parameter input values
function setExtraParameters(stageElement, values) {
  const inputElements = stageElement.getElementsByClassName("custom-input");
  if (inputElements.length != values.length)
    console.log("setExtraParameters: number of values " + values.length + " != number of inputs " + inputElements.length);
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

function getAdditionalFormulaParameters(studySelect) {
  let data = [];
  const param1 = htmlHelpers.getSelectData(studySelect, "param1");
  if (param1)
    data[0] = param1;
  return data;
}

// button with a tooltip
function createTooltip(cssClass, defaultText) {
  const button = htmlHelpers.createElement("div", "tooltip", "i");
  //const button = htmlHelpers.createElement("button", ["icon-button", "icon-button-info"], "");
  button.classList.add(cssClass);
  const text = htmlHelpers.createElement("span", "tooltip-text");
  text.classList.add("tooltip-left");
  text.innerHTML = defaultText;
  button.appendChild(text);
  return button;
}

function createTechTooltip() {
  const tooltip = createTooltip("study-info-button", defaultTechTooltip);
  tooltip.addEventListener("click", () => {
    const citationElement = tooltip.querySelector(".citation");
    if (citationElement) {
      // some hack to support html in the clipboard
      // const clipboardItem = new ClipboardItem({
        // "text/plain": new Blob([richTextDiv.innerText], { type: "text/plain" }),
        // "text/html": new Blob([richTextDiv.outerHTML], { type: "text/html" }),
      // });
      // navigator.clipboard.write([clipboardItem]);
      navigator.clipboard.writeText(citationElement.innerHTML);
    }
  });
  return tooltip;
}

function updateTechTooltip(tooltip, author, year, pages, note) {
  //console.log("Updating tooltip for " + author + ", " + year + ", " + pages + ", " + note + ".");
  let text;
  if (!author)
    text = defaultTechTooltip;
  else {
    let citation = studiesHelpers.getStudyCitation(author, year);
    if (!citation)
      citation = author + " " + year + ": no citation";
    text = "<span class=\"citation\">" + citation + "</span>";
    text += "<br />Pages: " + pages;
    if (note && note != "undefined")
      text += "<br />" + "Note: " + note;
    text += "<br />(Click to copy citation)";
  }
  const textElement = tooltip.childNodes[1];
  textElement.innerHTML = text;
}

// --------------------------------------
// ---------------------- TECHNOLOGY DATA

const technologyData = await technologiesHelpers.loadTechnologies();
//console.log(technologyData);

function getApplicableTechnologies(stageName, materialCategory, material, approach = "", tool = "") {
  //console.log("Get applicable tech for: " + stageName + ", " + materialCategory + ", " + material + ", " + approach + ", " + tool);
  //console.log(" ------- TODO find out why the manual value is there 3x");
  
  if (material == "")
    return [];

  if (!(stageName in technologyData) && stageName != worksForAllText) {
    console.log("getApplicableTechnologies: Stage not found - quitting");
    return [];
  }

  let technologiesForStage = [...technologyData[stageName]];
  if (worksForAllText in technologyData && stageName != worksForAllText) // techs that work for all stages
    technologiesForStage.push(...technologyData[worksForAllText]);
  
  //console.log("Tech for stage: ");
  //console.log(technologiesForStage);
  // Filter by material category and material
  let technologies = technologiesForStage.filter(
    (tech) => (materialCategory == worksForAllText || (tech.material_category == worksForAllText || helpers.strEq(tech.material_category, materialCategory)))
              && 
              (material == worksForAllText || (tech.material == worksForAllText || helpers.strEq(tech.material, material)))
  ) // TODO support lists
  
  //console.log("Tech before approach: ");
  //console.log(technologies);
  
  // TODO support lists
  if (approach)
    technologies = technologies.filter((tech) => 
      helpers.strEq(tech.approach, approach) || tech.approach == worksForAllText || approach == worksForAllText || tech.approach == unspecifiedText 
    );
  if (tool)
    technologies = technologies.filter((tech) => 
      helpers.strEq(tech.tool, tool) || tech.tool == worksForAllText  || tool == worksForAllText || tech.tool == unspecifiedText
    );
  
  //console.log(technologies);
  return technologies;
}

// --------------------------------------
// ------------------------------- ENERGY

// called by job to pass callback function
let onEnergyChange; // takes 1 param - any descendant element of the parent job works.
function setEnergyChangeFunction(energyChangeFunction) {
  onEnergyChange = energyChangeFunction;
}

function getStageMhElement(element) {
  return getStageElement(element).querySelector(".stage-mh-label");
}

// Stage MH total - value in the header
function setStageMh(stageElement, mhAmount) {
  getStageMhElement(stageElement).innerHTML = helpers.formatEnergy(mhAmount);
  onEnergyChange(stageElement); // in job-generator
}

// --------------------------------------
// ------------------------- CREATE STAGE

function createStage(stageData) {
  //console.log("Creating a stage - " + stageData.stageName);
  //console.log(stageData);
  
  let stageDiv = htmlHelpers.createElement('div', 'stage');
  stageDiv.setAttribute("data-stage", stageData.stageName);
  
  // Stage header
  const stageHeader = htmlHelpers.createElement("div", ["stage-header", "collapsible"]);
  const stageNameLabel = htmlHelpers.createElement("label", "stage-name", "STAGE: " + stageData.stageName);
  let delButton = htmlHelpers.createElement("button", ["icon-button", "icon-button-delete"], "");
  delButton.title = "Remove";
  delButton.addEventListener("click", (e) => {
    e.stopPropagation();
    removeStage(stageDiv);
  });
  const mhLabel = htmlHelpers.createElement("p", "stage-mh-label", helpers.formatEnergy(0));
  
  stageHeader.appendChild(stageNameLabel);
  const headerRightSide = htmlHelpers.createElement("div", "stage-header-right-side");
  headerRightSide.appendChild(mhLabel);
  headerRightSide.appendChild(delButton);
  stageHeader.appendChild(headerRightSide);
  stageDiv.appendChild(stageHeader);
  
  // Stage body
  const stageBody = htmlHelpers.createElement("div", ["stage-list", "collapsible-content", "short"]);  
  
  const columnCount = 5;
  // create the table
  let stageTable = htmlHelpers.createElement('table', 'stage-table');
  stageTable.classList.add(`stage-${stageData.stageName}`);
  stageTable.setAttribute("data-column-count", columnCount);
	
  // creating this early to pass to the custom imput event
  const conversionFactorInput = htmlHelpers.createElement("input", "unit-conversion");
  
  // Approach select
  let approachSelect = htmlHelpers.createSelect('approach-select');
  let row = htmlHelpers.createTableRow("Approach: ", [approachSelect], columnCount, [1, 4]);
  stageTable.appendChild(row);
  
  // Tool select
  let toolSelect = htmlHelpers.createSelect('tool-select');
  row = htmlHelpers.createTableRow("Tool: ", [toolSelect], columnCount, [1, 4]);
  stageTable.appendChild(row);
  
  // Study select
  let infoButton = createTechTooltip();
  let studySelect = htmlHelpers.createSelect('study-select');
  
  studySelect.addEventListener("change", () => { // TODO optimize - get data from the selected option
    let extraInputNames = [];
    const extraName = htmlHelpers.getSelectData(studySelect, "input1_name");
    if (extraName)
      extraInputNames[0] = extraName;
    
    chooseStageStudy(
      stageTable,
      htmlHelpers.getSelectText(studySelect),
      htmlHelpers.getSelectData(studySelect, "unit"),
      htmlHelpers.getSelectValue(studySelect),
      extraInputNames,
      extractConversions(studySelect)
    );
    updateTechTooltip(
      infoButton,
      htmlHelpers.getSelectData(studySelect, "author"),
      htmlHelpers.getSelectData(studySelect, "year"),
      htmlHelpers.getSelectData(studySelect, "pages"),
      "XXX" //htmlHelpers.getSelectData(studySelect, "note")
    );
  });
  
  row = htmlHelpers.createTableRow("Study: ", [studySelect, infoButton], columnCount, [1, 3]);
  row.classList.add("stage-study-row");
  stageTable.appendChild(row);
  
  // Approach and tool select events
  approachSelect.addEventListener("change", () => {
    //clearStage(stageTable, approachSelect);
    chooseStageApproach(stageData.stageName, toolSelect, htmlHelpers.getSelectText(approachSelect));
  });
  toolSelect.addEventListener("change", () => {
    chooseStageTool(stageData.stageName, studySelect, htmlHelpers.getSelectText(approachSelect), htmlHelpers.getSelectText(toolSelect));
  });
  
  // output fields
  row = htmlHelpers.createTableRow("Study work rate: ", [htmlHelpers.createElement("p", "study-speed", htmlHelpers.emptySelectText)], columnCount, [1, 4]);
  row.classList.add("work-rate-row");
  stageTable.appendChild(row);
  conversionFactorInput.addEventListener("change", () => {
    //console.log("Conversion input changed");
    updateMh(stageTable, conversionFactorInput.value);
  });
  const holder = htmlHelpers.createElement("div");
  holder.appendChild(conversionFactorInput);
  holder.appendChild(htmlHelpers.createElement("label", "conversion-unit-label", ""));
  stageTable.appendChild(htmlHelpers.createTableRow("Unit conversion factor:", [
    holder,
    htmlHelpers.createElement("label", "", "Converted rate:"), 
    htmlHelpers.createElement("p", "total-speed", htmlHelpers.emptySelectText)
  ], columnCount));
    
  stageBody.appendChild(stageTable);
  stageDiv.appendChild(stageBody);
  
  htmlHelpers.makeCollapsible(stageHeader); // must be done after the content (stageBody) exists
 
  return stageDiv;
}

// --------------------------------------
// ------------------------------- EVENTS

// specific inputs for some formulas (default has none)
function createFormulaInputs(stageTable, inputs) {
  for (const input of inputs) {
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
    
    inputElement.setAttribute("data-name", input.name);
    
    inputElement.addEventListener("change", () => {
      //console.log("Custom input changed");
      updateMh(stageTable, conversionFactorInput.value);
    });
    
    let row = htmlHelpers.createTableRow(input.label + ":", [inputElement], columnCount, [1, 4]);
    row.classList.add("custom-input-row");
    stageTable.insertBefore(row, stageTable.getElementsByClassName(insertBefore)[0]);
  }
}

function setStageMaterial(stageElement, materialCategory, material) {
  const stageName = getStageName(stageElement);
  //console.log("Set material for: " + stageName);
  const technologies = getApplicableTechnologies(stageName, materialCategory, material);
  
  const approachSelect = stageElement.querySelector(".approach-select");
  //let options = [{ label: "Choose", data: "0" }];
  let options = [];
  for (const tech of technologies) {
    options.push(tech.approach);
  }
  options = [...new Set(options)];
  htmlHelpers.createOptions(approachSelect, options);
  approachSelect.dispatchEvent(new Event('change'));
}


function chooseStageApproach(stageName, toolSelect, approach) {
  //console.log("ChooseStageApproach for : " + stageName + ", approach: " + approach);
  
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
  options = [...new Set(options)];
  
  htmlHelpers.createOptions(toolSelect, options);
}


function chooseStageTool(stageName, studySelect, approach, tool) {
  //console.log("ChooseStageTool for : " + stageName + ", approach: " + approach + ", tool: " + tool);
  
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
    let optionText = tech.author + " " + tech.year;
    if (tech.description)
      optionText += ": " + tech.description;
    if (tech["tech-note"] && tech["tech-note"] != "")
      optionText += " (note: " + tech["tech-note"] + ")";
    optionText += "  [" + tech.approach + " - " + tech.tool + "]";
    let optionsData = {
      "text": optionText,
      "value": tech.rate,
      "id": tech.id,
      "author": tech.author,
      "year": tech.year,
      "pages": tech.pages,
      "note": tech.note,
      "unit": tech.unit
    };
    if (tech.formula) {
      //console.log(tech);
      optionsData["formula"] = tech.formula;
      if (tech.input1_name)
        optionsData["input1_name"] = tech.input1_name;
      if (tech.param1)
        optionsData["param1"] = tech.param1;
      //console.log(optionsData);
    }
    
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
function chooseStageStudy(stageElement, techName, techUnit, speed, extraInputNames, conversions) {
  //console.log("chooseStageStudy for " + techName + ", " + techUnit + ", " + speed + ", " + formula + ".");

  clearStage(stageElement, stageElement.querySelector(".study-select"));
  
  if (speed == -1) { // unsetting the study
    setStageMh(stageElement, 0);
    return; 
  }

  let [materialCategory, material, jobUnit, jobAmount] = getJobProperties(stageElement);
  
  const studySpeedP = stageElement.querySelector(".study-speed");
  
  studySpeedP.innerHTML = helpers.formatNumber(speed) + " h/" + helpers.formatUnit(techUnit); // TODO update unit by stage (extra input)
  
  // special formulas. They are hardcoded here.
  for(const extraInputName of extraInputNames)
    createExtraParameterInput(stageElement, extraInputName);
  
  //console.log("Setting stage unit. material: " + material + ", jobUnit: " + jobUnit + ", jobAmount: " + jobAmount + ", techUnit: " + techUnit + ", speed: " + speed + ", conversion: ");
  //console.log(conversions);
  setStageUnit(stageElement, materialCategory, material, jobUnit, jobAmount, techUnit, conversions, speed);
}

function removeStage(stageElement) {
  const parentElement = stageElement.parentElement.parentElement.parentElement;
  stageElement.parentElement.parentElement.remove();
  onEnergyChange(parentElement);
}

// --------------------------------------
// ------------------------------ OUTPUTS

function extractConversions(selectElement) {
  const allUnits = materialsHelpers.getSupportedUnits();
  let conversions = {};
  for (const unit of allUnits) {
    const conversionFactor = htmlHelpers.getSelectData(selectElement, "conversion-" + unit);
    if (conversionFactor)
      conversions[unit] = Number(conversionFactor);
  }
  return conversions;
}

// stageElement is a parent
// This may be called from the chooseStageStudy event, or from the outside when job unit changes.
// The first case already has all the params. In the other the local values need to be fetched.
function setStageUnit(stageElement, materialCategory, material, jobUnit, jobAmount, techUnit = '', techConversions = [], speed = -1) {
  const unitConversionInput = stageElement.querySelector(".unit-conversion");
  const conversionUnitLabel = stageElement.querySelector(".conversion-unit-label");
  let studySelect;
  if (!techUnit || !techConversions)
    studySelect = stageElement.querySelector(".study-select");
  if (!techUnit)
    techUnit = htmlHelpers.getSelectData(studySelect, "unit");
  if (!techUnit) // no tech selected, so nothing else to do
    return;
  techUnit = techUnit.split("*")[0]; // in case of units such as t*m - we only care about the first.
  if (!techConversions)
    techConversions = htmlHelpers.getSelectData(extractConversions(studySelect), "unit");
  
  let conversionFactor = materialsHelpers.getConversionFactor(materialCategory, material, techUnit, jobUnit, techUnit, techConversions);
  if (conversionFactor == -1) {
    conversionFactor = 0;
    unitConversionInput.value = '';
  }
  else {
    unitConversionInput.value = Number(conversionFactor.toFixed(2));
  }
  
  conversionUnitLabel.innerHTML = helpers.formatUnit(techUnit) + "/" + helpers.formatUnit(jobUnit);
  
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
function updateMh(stageElement, conversionFactor = -1, jobUnit = '', jobAmount = -1, speed = -1) {
  const studySelect = stageElement.querySelector(".study-select");
  
  const convertedSpeedP = stageElement.querySelector(".total-speed");
  if (conversionFactor == -1)
    conversionFactor = stageElement.querySelector(".unit-conversion").value;
  if (!jobUnit)
    jobUnit = getJobUnit(stageElement);
  if (jobAmount == -1)
    jobAmount = getJobAmount(stageElement);
  if (speed == -1)
    speed = htmlHelpers.getSelectValue(studySelect);
  
  const convertedSpeed = speed * conversionFactor;
  convertedSpeedP.innerHTML = helpers.formatNumber(convertedSpeed, false) + " h/" + helpers.formatUnit(jobUnit);
  
  let extraModifier = 1; // modifier of the base value, such as distance
  let extraValue = 0; // additional value independent of the base
  
  // Special formulas, i.e. for speed in some studies
  let formula = htmlHelpers.getSelectData(studySelect, "formula");
  if (formula) {
    const params = getExtraParameters(stageElement);
    if (formula == "Multiply") {
      //console.log("Evaluating Multiply");
      if (params.length != 1) throw new Error("Wrong number of parameters for Multiply. Expected 1, got " + params.length);
      //console.log("Modifier params");
      //console.log("params[name]: " + params[0].name + ", params[value]: " + params[0].value );
      extraModifier = params[0].value;
    }
    else if (formula == "H-1") {
      console.log("Evaluating H-1");
      if (params.length != 1) new Error("Wrong number of parameters for H-1");
      if (params[0].name != "Height") new Error("Wrong parameter for H-1");
      
      extraModifier = params[0].value > 1 ? params[0].value - 1 : 0; // the formula uses height-1
    }
    else if (formula == "Trips and weight") {
      console.log("Evaluating Trips and weight");
	  //console.log(params);
      if (params.length != 1) new Error("Wrong number of parameters for Trips and weight");
      if (params.name != "# of trips") new Error("Wrong parameter for Trips and weight");
	  const extraParams = getAdditionalFormulaParameters(studySelect);
      console.log("extraParam: "+ extraParams[0]);
      extraValue = params[0].value * extraParams[0];
    }
    else
      new Error("Unknown formula");
    // for (const extraParam of getExtraParameters(stageElement)) {
      // if (!extraParam) {
        // //console.log("updateMh: empty extra param");
        // continue;
      // }
    // }
  }
  
  const totalMh = helpers.formatEnergy(jobAmount * convertedSpeed * extraModifier + extraValue);
  console.log("Amount: "+ jobAmount + ", convertedSpeed: " + convertedSpeed + ", extraModifier: " + extraModifier + ", extraValue: " + extraValue + ", Mh: " + totalMh);
  setStageMh(stageElement, totalMh);
}

// --------------------------------------
// -------------------------- CLEAR STATE

// after - only clear inputs after that one
function clearStage(stageElement, after = null) {
  //console.log("clearing stage, in " + stageElement.classList[0] + " after " + (after ? after.classList[0] : "start"));
  //remove custom elements from formulas
  const rows = stageElement.getElementsByClassName("custom-input-row");
  for (const row of rows)
    row.remove();
  
  // reset inputs to default state
  const inputs = stageElement.querySelectorAll("input, select");
  for (const input of inputs) {
    if (after != null) {
      if (input == after)
        after = null;
      continue;
    }
    htmlHelpers.emptyInput(input);
    //console.log("Clearing, skipping " + input.classList[0]);
  }
  
  const outputs = stageElement.querySelectorAll("p");
  for (const output of outputs)
    htmlHelpers.resetLabel(output);
}

// --------------------------------------
// ---------------------------- SAVE/LOAD

// TODO save by value, not text
function saveStage(stageElement) {
  const extra = getExtraParameters(stageElement, true);
  let saveData = {
    "stage": htmlHelpers.getAncestorElement(stageElement, "stage").getAttribute("data-stage"), // ancestor should not be needed, but it will work if code changes.
    "custom-inputs": getExtraParameters(stageElement, true),
    "approach": htmlHelpers.getSelectText(stageElement.querySelector(".approach-select")),
    "tool": htmlHelpers.getSelectText(stageElement.querySelector(".tool-select")),
    "study": htmlHelpers.getSelectData(stageElement.querySelector(".study-select"), "id"),
    "conversion factor": stageElement.querySelector(".unit-conversion").value,
    "collapsed": stageElement.querySelector(".collapsible-content").classList.contains('open') ? 0 : 1
  };
  //console.log(saveData);
  return saveData;
}


function loadStage(stageElement, saveData/*, stageData*/) {
  //console.log("Fetching stage " + ".stage-" + saveData["stage"]);
  //console.log(saveData);
  // stageElement is the stage table
  //const stageElement = ancestorElement.querySelector(".stage-" + saveData["stage"]);
  //clearStage(stageElement);
  
  // Only do the next if the previous is not empty
  if (!htmlHelpers.isEmptyOption(saveData["approach"])) {
    let select = stageElement.querySelector(".approach-select");
    htmlHelpers.setSelectedByText(select, saveData["approach"]);
    select.dispatchEvent(new Event('change'));
    
    if (!htmlHelpers.isEmptyOption(saveData["tool"])) {
      select = stageElement.querySelector(".tool-select");
      htmlHelpers.setSelectedByText(select, saveData["tool"]);
      select.dispatchEvent(new Event('change'));
      
      if (!htmlHelpers.isEmptyOption(saveData["study"])) {
        select = stageElement.querySelector(".study-select");
        htmlHelpers.setSelectedByData(select, "id", saveData["study"]);
        select.dispatchEvent(new Event('change'));
        
        setExtraParameters(stageElement, saveData["custom-inputs"]);
        
        if (!htmlHelpers.isEmptyOption(saveData["conversion factor"])) {
          let input = stageElement.querySelector(".unit-conversion");
          input.value = saveData["conversion factor"];
          input.dispatchEvent(new Event('change'));
        }
      }
    }
  }
  
  const content = stageElement.querySelector(".collapsible-content");
  if (saveData["collapsed"])
    content.classList.remove("open");
  else
    content.classList.add("open");
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