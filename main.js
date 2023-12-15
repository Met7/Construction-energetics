import { loadFile } from "./data-handler.js";
import { createJob } from "./job-generator.js";

var jobId = 1;

function createOptions(selectElement, options) {
  //alert(selectElement.innerHTML);
  selectElement.innerHTML = "";
  options.forEach((option) => {
    const selectOption = document.createElement("option");
    const text = option[0];
    const energyModifier = option[1]
    selectOption.value = text.toLowerCase().replace(" ", "-");
    selectOption.textContent = text;
    selectOption.setAttribute("data-energy-modifier", energyModifier);
    selectElement.appendChild(selectOption);
  });
}

const myButton = document.getElementById('add-job-button');
myButton.addEventListener('click', test);

async function test() {
  let data = await loadFile("Stages");
  
  // let button = document.createElement("button");
  // button.textContent = "xxx";
  // button.addEventListener("click", () => {
    // alert("tvoje mama");
  // });
  
  // myButton.appendChild(button);
  
  //console.log(data);
  const jobsContainer = document.querySelector("#jobs-container");
  jobsContainer.prepend(createJob(jobId++, data));
}

await test();

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