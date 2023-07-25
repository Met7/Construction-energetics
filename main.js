import { loadFile } from "./data_handler.js";
import { createJob } from "./job-generator.js";


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
  jobsContainer.prepend(createJob(1, data));
}

await test();
