import * as htmlHelpers from "./helpers/html-helpers.js"; 
import { loadFile } from "./data-handler.js";
import { createJob } from "./job-generator.js";

var jobId = 1;

const myButton = document.getElementById('add-job-button');
myButton.addEventListener('click', addJob);


// --------------------------------------
// ---------------------------- SAVE/LOAD

let projects;

// TODO load from storage
// TODO add import/export
projects = [ "Project 1" ];

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
    
    let row = htmlHelpers.createTableRow(project, links, columnCount);
    projectTable.appendChild(row);
    projectIndex++;
  }
}

// --------------------------------------
// --------------------------------- JOBS

async function addJob() {
  let data = await loadFile("Stages");  
  //console.log(data);
  const jobsContainer = document.querySelector("#jobs-container");
  jobsContainer.prepend(createJob(jobId++, data));

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
  printProjects();
  await addJob();
}

await main();