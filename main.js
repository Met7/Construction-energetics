import * as htmlHelpers from "./helpers/html-helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createJob, saveJob, loadJob } from "./job-generator.js";

var jobId = 1;

const myButton = document.getElementById('add-job-button');
myButton.addEventListener('click', addJob);


// --------------------------------------
// ---------------------------- SAVE/LOAD

let projects;

// TODO load from storage
// TODO add import/export
// projects = [
  // {"name" : "Project 1", "data" : ""}
// ];

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

  localStorage.setItem("projects", JSON.stringify(projects));
  console.log("Saved project to local storage.");
}

function openProject(index) {
  if (index < 0 || index >= projects.length)
    throw("main::openProject: bad index " + index);
  let projectData = projects[index].data;
  const jobsContainer = document.querySelector("#jobs-container");
  jobsContainer.innerHTML = "";
  jobId = 1;
  for (const jobData of projectData.jobs) {
    const jobElement = createJob(jobId++);
    jobsContainer.prepend(jobElement);
    loadJob(jobElement, jobData);
  }

  //localStorage.setItem("save", JSON.stringify(jobSave));
  console.log("Loaded project from local storage.");
}

function printProjects() {
  const projectTable = document.querySelector("#project-table");
  //const projects = JSON.parse(localStorage.getItem("save"));
  const columnCount = 4;
  let projectIndex = 0;
  for (const project of projects) {
    let links = [];

    let link = htmlHelpers.createElement("a", "", "o");
    link.addEventListener("click", () => {
      openProject(projectIndex);
    });
    links.push(link);
    
    link = htmlHelpers.createElement("a", "", "s");
    link.addEventListener("click", () => {
      saveProject(projectIndex);
    });
    links.push(link);
    
    link = htmlHelpers.createElement("a", "", "x");
    link.addEventListener("click", () => {
      deleteProject(projectIndex);
    });
    links.push(link);
    
    let row = htmlHelpers.createTableRow(project.name, links, columnCount);
    projectTable.appendChild(row);
    projectIndex++;
  }
  
  let columns = [];
  const newProjectInput = htmlHelpers.createElement("input", "new-project-input");
  columns.push(newProjectInput);
  let link = htmlHelpers.createElement("a", "", " save ");
  link.addEventListener("click", () => {
    saveProject(-1, newProjectInput.value);
  });
  columns.push(link);
  let row = htmlHelpers.createTableRow("Save as: ", columns, columnCount);
  projectTable.appendChild(row);
}

// --------------------------------------
// --------------------------------- JOBS

function getJobElements(ancestorElement) {
  return ancestorElement.getElementsByClassName("job");
}

async function addJob(jobContainer) {
  let data = await loadFile("Stages");  
  //console.log(data);
  jobContainer.prepend(createJob(jobId++, data));

  // perform some actions to not do them manually on every refresh
  if (1) {
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