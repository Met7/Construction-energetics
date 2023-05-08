// 1m limestone 72MJ
// 1MD 2.160Kj

  // Create the event
  const event = new CustomEvent("change", { "detail": "Material manual trigger" });

// ----------------- MATERIAL SELECT EVENT

function addMaterialSelectEvent(jobId) {
  //alert(jobId);
  const materialSelect = document.querySelector(`#materials-${jobId}`);
  materialSelect.addEventListener("change", () => {
    const extractionSelect = document.querySelector(`#extraction-technology-${jobId}`);
    const processingSelect = document.querySelector(`#processing-${jobId}`);
    const puttingInPlaceSelect = document.querySelector(`#placement-${jobId}`);
    
    processingSelect.disabled = false;
    if (materialSelect.value === "timber") {
      createOptions(extractionSelect, [["Stone Axe", 50], ["Bronze Axe", 40], ["Bronze saw", 20], ["Iron Axe", 30], ["Iron Saw", 15]]);
      createOptions(processingSelect, [["Stone Axe", 50], ["Bronze Axe", 40], ["Iron Axe", 30]]);
    } else if (materialSelect.value === "dirt") {
      createOptions(extractionSelect, [["Wooden shovel", 30], ["Iron shovel", 20]]);
      createOptions(processingSelect, [["N/A"]]);
      processingSelect.disabled = true;
    } else if (materialSelect.value === "limestone") {
    createOptions(extractionSelect, [["Channeling - copper chisel (x350)", 350], ["Channeling - iron chisel (x150)", 150], ["Diamond cable saw (x10)", 10]]);
      createOptions(processingSelect, [["Copper chisel", 50], ["Bronze chisel", 30], ["Iron chisel", 20]]);
    } else if (materialSelect.value === "granite") {
      createOptions(extractionSelect, [["Channeling - copper chisel", "N/a"], ["Channeling - iron chisel", 150]]);
      createOptions(processingSelect, [["Copper chisel", 50], ["Bronze chisel", 30], ["Iron chisel", 20], ["Stone mallet", 30]]);
    } else alert("addMaterialSelectEvent - unknown value");

    extractionSelect.disabled = false;
    
    
    //TODO fill other selects
    //transportSelect.disabled = true;
    //transportSelect.selectedIndex = 0;
  });

    //return materialSelect;
}

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

// ----------------- CALCULATE ENERGY

function calculateJobEnergy(jobId) {
  
  // MATERIAL
  const materialSelect = document.querySelector(`#materials-${jobId}`);
  const materialOption = materialSelect.options[materialSelect.selectedIndex];
  const material = materialOption.value;
  const materialQuantity = parseFloat(document.querySelector(`#quantity-${jobId}`).value);
  
  const materialWeight = materialQuantity * materialDensity(material);

  let extractionEnergy = materialOption.getAttribute("data-base-energy");

  const extractionMethodSelect = document.querySelector(`#extraction-technology-${jobId}`);
  const extractionMethodOption = extractionMethodSelect.options[extractionMethodSelect.selectedIndex];
  const extractionMethodModifier = parseFloat(extractionMethodOption.getAttribute("data-energy-modifier"));
  const extractionMethodEnergy = materialQuantity * extractionEnergy * extractionMethodModifier;

  const extractionEnergyLabel = document.querySelector(`#extraction-energy-label-${jobId}`);
  extractionEnergyLabel.textContent = extractionMethodEnergy + "kJ";

  // TRANSPORTATION
  const transportationSelect = document.querySelector(`#transportation-method-${jobId}`);
  const transportationOption = transportationSelect.options[transportationSelect.selectedIndex];
  const transportationEnergy = parseFloat(transportationOption.getAttribute("data-energy-per-ton-per-meter"));
  const transportationDistance = parseFloat(document.querySelector(`#distance-${jobId}`).value);
  const transportationEnergyTotal = transportationEnergy * transportationDistance * materialWeight;

  const transportationEnergyLabel = document.querySelector(`#transportation-energy-label-${jobId}`);
  transportationEnergyLabel.textContent = transportationEnergyTotal + "kJ";

  // PROCESSING
  const processingSelect = document.querySelector(`#processing-${jobId}`);
  const processingOption = processingSelect.options[processingSelect.selectedIndex];
  const processingEnergyModifier = parseFloat(processingOption.getAttribute("data-energy-modifier"));
  const processingEnergy = processingEnergyModifier * materialQuantity;

  const processingEnergyLabel = document.querySelector(`#processing-energy-label-${jobId}`);
  processingEnergyLabel.textContent = processingEnergy + "kJ";

  // PLACEMENT
  const placingSelect = document.querySelector(`#placement-${jobId}`);
  const placingOption = placingSelect.options[placingSelect.selectedIndex];
  const placingEnergyModifier = parseFloat(placingOption.getAttribute("data-energy-ton-per-meter"));
  const placingEnergy = placingEnergyModifier * materialWeight;

  const placingEnergyLabel = document.querySelector(`#placement-energy-label-${jobId}`);
  placingEnergyLabel.textContent = placingEnergy + "kJ";

  // alert (extractionMethodEnergy);
  // alert (transportationEnergyTotal);
  // alert (processingEnergy);
  // alert (placingEnergy);

  const totalEnergy = extractionMethodEnergy + transportationEnergyTotal + processingEnergy + placingEnergyModifier;

  //const totalEnergy = 10; // TODO temp

  document.querySelector(`#total-energy-${jobId}`).textContent = totalEnergy.toFixed(2);
}

// returns tons per cubic meter
function materialDensity(material) {
  if (material == "timber") {
    return 0.6;
  } else if (material == "dirt") {
    return 1.2;
  } else if (material == "limestone") {
    return 2.0;
  } else if (material == "granite") {
    return 2.7;
  } else alert("materialDensity: unknown material");
}

// ----------------- ADD JOB BUTTON

document.addEventListener("DOMContentLoaded", () => {
  const jobsContainer = document.querySelector("#jobs-container");
  const jobContainer = jobsContainer.querySelector(".job-container");
  const addJobButton = document.querySelector("#add-job-button");

  addJobButton.addEventListener("click", () => {
    //const lastJob = jobContainer.querySelector(".job:last-child");
    //const newJob = lastJob.cloneNode(true);
    const newJob = jobContainer.cloneNode(true);
    
    // Get the job number
    const oldJobNumber = 1;
    const jobNumber = document.querySelectorAll(".job-container").length + 1;

    // Set the job number in the new job container
    newJob.querySelector("h2").textContent = `Job ${jobNumber}`;
    
    // MATERIALS
    newJob.querySelector("label[for='materials-1']").setAttribute("for", `materials-${jobNumber}`);
    newJob.querySelector("#materials-1").setAttribute("id", `materials-${jobNumber}`);

    newJob.querySelector("label[for='quantity-1']").setAttribute("for", `quantity-${jobNumber}`);
    newJob.querySelector("#quantity-1").setAttribute("id", `quantity-${jobNumber}`);

    newJob.querySelector("label[for='extraction-technology-1']").setAttribute("for", `extraction-technology-${jobNumber}`);
    newJob.querySelector("#extraction-technology-1").setAttribute("id", `extraction-technology-${jobNumber}`);
 
    newJob.querySelector("#extraction-energy-label-1").setAttribute("id", `extraction-energy-label-${jobNumber}`);

    // TRANSPORTATION
    newJob.querySelector("label[for='transportation-method-1']").setAttribute("for", `transportation-method-${jobNumber}`);
    newJob.querySelector("#transportation-method-1").setAttribute("id", `transportation-method-${jobNumber}`);

    // Set the ID of the distance input element
    newJob.querySelector("label[for='distance-1']").setAttribute("for", `distance-${jobNumber}`);
    newJob.querySelector("#distance-1").setAttribute("id", `distance-${jobNumber}`);

    newJob.querySelector("#transportation-energy-label-1").setAttribute("id", `transportation-energy-label-${jobNumber}`);

    // PROCESSING
    newJob.querySelector("label[for='processing-1']").setAttribute("for", `processing-${jobNumber}`);
    newJob.querySelector("#processing-1").setAttribute("id", `processing-${jobNumber}`);

    newJob.querySelector("#processing-energy-label-1").setAttribute("id", `processing-energy-label-${jobNumber}`);

    // PLACEMENT
    newJob.querySelector("label[for='placement-1']").setAttribute("for", `placement-${jobNumber}`);
    newJob.querySelector("#placement-1").setAttribute("id", `placement-${jobNumber}`);

    newJob.querySelector("#placement-energy-label-1").setAttribute("id", `placement-energy-label-${jobNumber}`);

    // Set the ID of the total-energy span element
    newJob.querySelector("#total-energy-1").setAttribute("id", `total-energy-${jobNumber}`);

    // Set the total-energy to 0
    newJob.querySelector(`#total-energy-${jobNumber}`).textContent = "0";

    jobsContainer.appendChild(newJob);

    newJob.querySelector(`#materials-${jobNumber}`).selectedIndex = 0;
    newJob.querySelector(`#extraction-technology-${jobNumber}`).selectedIndex = 0;
    newJob.querySelector(`#transportation-method-${jobNumber}`).selectedIndex = 0;
    newJob.querySelector(`#processing-${jobNumber}`).selectedIndex = 0;
    newJob.querySelector(`#placement-${jobNumber}`).selectedIndex = 0;
    newJob.querySelector(`#quantity-${jobNumber}`).textContent = 0;
    newJob.querySelector(`#distance-${jobNumber}`).textContent = 0;
  
    addMaterialSelectEvent(jobNumber);
    document.querySelector(`#materials-${jobNumber}`).dispatchEvent(event);
    calculateJobEnergy(jobNumber);  
    
    newJob.addEventListener("input", (event) => {
      if (event.target.matches(".job input, .job select")) {
        calculateJobEnergy(jobNumber);
      }
    });
  });

  jobContainer.addEventListener("input", (event) => {
    if (event.target.matches(".job input, .job select")) {
      //const job = event.target.closest(".job");
      calculateJobEnergy(1);
    }
  });

  addMaterialSelectEvent(1);

  // Dispatch/Trigger/Fire the event
  document.querySelector("#materials-1").dispatchEvent(event);

  //const firstJob = jobContainer.querySelector(".job");
  //calculateJobEnergy(firstJob);
  calculateJobEnergy(1);
});
