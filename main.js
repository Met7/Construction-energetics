import * as htmlHelpers from "./helpers/html-helpers.js";
import * as helpers from "./helpers/helpers.js";
import { createJob, saveJob, loadJob, setJobEnergyChangeFunction, setSortFunctions } from "./job-generator.js";

var jobId = 1;

// --------------------------------------
// ------------------------------- ENERGY

function recalculateTotalEnergy() {
  let totalEnergy = 0;
  const jobList = document.getElementById("jobs-container");
  const jobElements = jobList.getElementsByClassName("job");
  for (let jobElement of jobElements) {
    const mhLabel = jobElement.querySelector(".job-mh-label");
    const energy = helpers.unformatEnergy(mhLabel.innerText);
    totalEnergy += energy;
  }
  
  document.getElementById("total-mh-label").innerText = helpers.formatEnergy(totalEnergy);
}

// --------------------------------------
// ---------------------------- SAVE/LOAD

let projects;

function checkProjectIndex(index, caller) {
  if (index < 0 || index >= projects.length)
    throw("main::" + caller + ": bad index " + index);
}

function saveToStorage() {
  localStorage.setItem("projects", JSON.stringify(projects));
  console.log("Saved projects to local storage.");
}

function saveProject(index = -1, name = "") {
  let projectSave = {};
  projectSave["jobs"] = [];
  const jobElements = getJobElements(document.querySelector("#jobs-container"));
  let sortIndex = 0;
  for (let jobElement of jobElements) {
    let jobData = saveJob(jobElement);
    jobData["sortIndex"] = sortIndex++;
    projectSave["jobs"].push(jobData);
    //console.log(jobData);
  }
  
  if (index == -1) { // new save
    index = projects.length;
    projects.push({ "name" : name, "data" : "" });
  }
  
  projects[index].data = projectSave;
  
  saveToStorage();
  printProjects();
}

function openProject(index) {
  checkProjectIndex(index, "openProject");
  let projectData = projects[index].data;
  const jobsContainer = document.querySelector("#jobs-container");
  clearAllJobs(jobsContainer);
  jobId = 1;
  // reverse sort, prepending will put it back in order
  projectData.jobs.sort((job1, job2) => job1.sortIndex < job2.sortIndex ? 1 : -1);
  for (const jobData of projectData.jobs) {
    const jobElement = createJob(jobId++, true);
    jobsContainer.prepend(jobElement);
    loadJob(jobElement, jobData);
  }

  console.log("Loaded project from local storage.");
}

// --------------------------------------
// ------------------------- PROJECT LIST

function deleteProject(index) {
  checkProjectIndex(index, "deleteProject");
  projects[index] = projects[projects.length - 1];
  projects.pop();
  console.log("Deleted project from local storage.");
  saveToStorage();
  printProjects();
}

function downloadProject(index) {
  console.log("attempting download id " + index);
  checkProjectIndex(index, "downloadProject");
  const dataContent = encodeURIComponent(JSON.stringify(projects[index], null, 2))
  var dataHeader = "data:text/json;charset=utf-8,";
  var dlAnchorElement = document.getElementById('downloadAnchorElem');
  dlAnchorElement.setAttribute("href", dataHeader + dataContent);
  dlAnchorElement.setAttribute("download", projects[index].name + ".json");
  dlAnchorElement.click();
}

function uploadProject(uploadProjectInput) {
  const files = uploadProjectInput.files;
  if (files.length == 0)
    return;
  
  const fileReader = new FileReader();
  fileReader.onload = function(file) { 
    const uploadedProject = JSON.parse(file.target.result);
    console.log("uploaded file - " + uploadedProject.name);
    // TODO add file validity check
    projects.push(uploadedProject);  
    saveToStorage();
    printProjects();
  }

  fileReader.readAsText(files.item(0));
}

function printProjects() {
  const projectTable = document.querySelector("#project-table");
  projectTable.innerHTML = "";
  
  const columnCount = 2;
  let projectIndex = 0;
  for (const project of projects) {
    // Hack because for unknown reason the index inside events increases at the ++ after it was assigned.
    const indexForIteration = projectIndex;
    
    let columns = [];

    let label = htmlHelpers.createElement("label", "project-name", project.name);
    label.addEventListener("click", () => {
      openProject(indexForIteration);
    });
    columns.push(label);
    
    let buttonHolder = htmlHelpers.createElement("div", "project-list-row-buton-holder", "");
    let button = htmlHelpers.createElement("button", ["icon-button", "icon-button-save"], "");
    button.title = "Save";
    button.addEventListener("click", () => {
      saveProject(indexForIteration);
    });
    buttonHolder.appendChild(button);
    
    button = htmlHelpers.createElement("button", ["icon-button", "icon-button-download"], "");
    button.title = "Export";
    button.id = "dl-project-" + indexForIteration;
    button.addEventListener("click", () => {
      downloadProject(indexForIteration);
    });
    buttonHolder.appendChild(button);
    
    button = htmlHelpers.createElement("button", ["icon-button", "icon-button-delete"], "");
    button.title = "Delete";
    button.addEventListener("click", () => {
      deleteProject(indexForIteration);
    });
    buttonHolder.appendChild(button);
    
    columns.push(buttonHolder);
    let row = htmlHelpers.createTableRow("", columns, columnCount);
    row.classList.add("project-list-row");
    projectTable.appendChild(row);
    projectIndex++;
  }
  
  let columns = [];
  const newProjectInput = htmlHelpers.createElement("input", "new-project-input");
  columns.push(newProjectInput);
  let button = htmlHelpers.createElement("button", "", "Save new");
  button.addEventListener("click", () => {
    saveProject(-1, newProjectInput.value);
  });
  columns.push(button);
  let row = htmlHelpers.createTableRow("", columns, columnCount);
  projectTable.appendChild(row);
  
  columns = [];
  const uploadProjectInput = htmlHelpers.createElement("input", "upload-project-input");
  uploadProjectInput.type = "file";
  columns.push(uploadProjectInput);
  button = htmlHelpers.createElement("button", "", "Import");
  button.addEventListener("click", () => {
    uploadProject(uploadProjectInput);
  });
  columns.push(button);
  row = htmlHelpers.createTableRow("", columns, columnCount);
  projectTable.appendChild(row);
}

// --------------------------------------
// --------------------------------- JOBS

function getJobElements(ancestorElement) {
  return ancestorElement.getElementsByClassName("job");
}

function addJob(jobContainer) {
  jobContainer.prepend(createJob(jobId++));

  // perform some actions to not do them manually on every refresh
  if (0) {
    // select limestone in the one job
    let select = document.querySelector(".material-category-select");
    select.value = "Stone";
    select.dispatchEvent(new Event('change'));
    select = document.querySelector(".material-select");
    select.value = "Limestone";
    select.dispatchEvent(new Event('change'));
    
    // amount
    let input = document.querySelector(".amount-input");
    input.value = 12;

    // select approach and tool
    select = document.querySelector(".approach-select");
    select.value = "Collecting";
    select.dispatchEvent(new Event('change'));

    select = document.querySelector(".tool-select");
    select.value = "1";
    select.dispatchEvent(new Event('change'));
  }
}

function clearAllJobs(jobsContainer) {
  jobsContainer.innerHTML = "";
}

// --------------------------------------
// -------------------------- JOB SORTING

function getJobId(jobDiv) {
  return jobDiv.id.split("-")[1];
}

function swapElements(elem1, elem2) {
  const afterElem2 = elem2.nextElementSibling;
  //console.log(elem2);
  const parent = elem2.parentNode;
  //console.log(parent);
  if (elem1 === afterElem2)
  	parent.insertBefore(elem1, elem2);
  else {
  	elem1.replaceWith(elem2);
  	parent.insertBefore(elem1, afterElem2);
  }
}

function swapJobs(oldJobDiv, otherJobDiv) {
  if (!otherJobDiv) {
    console.log("No sibling to swap with");
    return;
  }
  let oldId = getJobId(oldJobDiv);
  let otherId = getJobId(otherJobDiv);
  console.log("swapping #" + oldId + " with #" + otherId);
  swapElements(oldJobDiv, otherJobDiv);
  // TODO swap the data structure ids
}

function sortJobUp(oldJobDiv) {
  let otherJobDiv = oldJobDiv.previousElementSibling;
  swapJobs(oldJobDiv, otherJobDiv);
}

function sortJobDown(oldJobDiv) {
  let otherJobDiv = oldJobDiv.nextElementSibling;
  swapJobs(oldJobDiv, otherJobDiv);
}

// --------------------------------------
// --------------------------------- MAIN

function main() {
  // init project list data structure
  if (localStorage.projects)
    projects = JSON.parse(localStorage.getItem("projects"));
  else {
    projects = [];
  }
  printProjects();
  
  const jobsContainer = document.querySelector("#jobs-container");
  addJob(jobsContainer);
  
  setJobEnergyChangeFunction(recalculateTotalEnergy);
  setSortFunctions(sortJobUp, sortJobDown);
  
  document.getElementById('add-job-button').addEventListener('click', () => {
    addJob(document.querySelector("#jobs-container"));
  });
  document.getElementById('clear-all-button').addEventListener('click', () => {
    clearAllJobs(jobsContainer);
    addJob(jobsContainer);
  });
}

main();