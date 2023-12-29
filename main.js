import * as htmlHelpers from "./helpers/html-helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createJob, saveJob, loadJob } from "./job-generator.js";

var jobId = 1;

const myButton = document.getElementById('add-job-button');
myButton.addEventListener('click', () => { 
    //console.log("Clicked");
    addJob(document.querySelector("#jobs-container"));
  }
);


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
  for (let jobElement of jobElements) {
    projectSave["jobs"].push(saveJob(jobElement));
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
  jobsContainer.innerHTML = "";
  jobId = 1;
  for (const jobData of projectData.jobs) {
    const jobElement = createJob(jobId++);
    jobsContainer.prepend(jobElement);
    loadJob(jobElement, jobData);
  }

  console.log("Loaded project from local storage.");
}

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
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ "ahoj" : 3 }));
  //const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects[index]));
  const dlAnchorElem = document.getElementById("dl-project-" + index);
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", projects[index].name + ".json");
  dlAnchorElem.click();
  
  // var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ "ahoj" : 3 }));
  // var dlAnchorElem = document.getElementById('downloadAnchorElem');
  // dlAnchorElem.setAttribute("href",     dataStr     );
  // dlAnchorElem.setAttribute("download", "scene.json");
  // dlAnchorElem.click();
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
    let links = [];

    let label = htmlHelpers.createElement("label", "project-name", project.name);
    label.addEventListener("click", () => {
      openProject(indexForIteration);
    });
    columns.push(label);
    
    let button = htmlHelpers.createElement("button", ["icon-button", "icon-button-save"], "");
    button.title = "Save";
    button.addEventListener("click", () => {
      saveProject(indexForIteration);
    });
    links.push(button);
    
    button = htmlHelpers.createElement("button", ["icon-button", "icon-button-download"], "");
    button.title = "Export";
    button.id = "dl-project-" + indexForIteration;
    button.addEventListener("click", () => {
      downloadProject(indexForIteration);
    });
    links.push(button);
    
    button = htmlHelpers.createElement("button", ["icon-button", "icon-button-delete"], "");
    button.title = "Delete";
    button.addEventListener("click", () => {
      deleteProject(indexForIteration);
    });
    links.push(button);
    
    columns.push(links);
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

async function addJob(jobContainer) {
  //throw("JOB");
  let data = await loadFile("Stages");  
  //console.log(data);
  jobContainer.prepend(createJob(jobId++, data));

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

// --------------------------------------
// --------------------------------- MAIN

async function main() {
  if (localStorage.projects)
    projects = JSON.parse(localStorage.getItem("projects"));
  else {
    projects = [];
  }
  printProjects();
  const jobsContainer = document.querySelector("#jobs-container");
  await addJob(jobsContainer);
}

await main();