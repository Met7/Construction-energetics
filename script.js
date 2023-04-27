function calculateJobEnergy(job) {
  const materialSelect = job.querySelector(".material-select");
  const materialOption = materialSelect.options[materialSelect.selectedIndex];
  const material = materialOption.value;
  const materialQuantity = parseFloat(job.querySelector(".material-quantity").value);

  const collectionEnergyLabel = job.querySelector(".collection-energy-label");
  let collectionEnergy = 0;
  switch (material) {
    case "timber":
      collectionEnergy = 50;
      break;
    case "dirt":
      collectionEnergy = 40;
      break;
    case "limestone":
    case "granite":
      collectionEnergy = 500;
      break;
  }
  collectionEnergyLabel.textContent = collectionEnergy;

  const collectionMethodSelect = job.querySelector(".collection-method-select");
  const collectionMethodOption = collectionMethodSelect.options[collectionMethodSelect.selectedIndex];
  const collectionMethodModifier = parseFloat(collectionMethodOption.getAttribute("data-energy-modifier"));
  const collectionMethodEnergy = collectionEnergy * collectionMethodModifier;

  const transportationSelect = job.querySelector(".transportation-select");
  const transportationOption = transportationSelect.options[transportationSelect.selectedIndex];
  const transportationEnergy = parseFloat(transportationOption.getAttribute("data-energy-per-ton-per-meter"));
  const transportationDistance = parseFloat(job.querySelector(".transportation-distance").value);
  const transportationWeight = materialQuantity * 1000;
  const transportationEnergyTotal = transportationEnergy * transportationDistance * transportationWeight;

  const processingSelect = job.querySelector(".processing-select");
  const processingOption = processingSelect.options[processingSelect.selectedIndex];
  const processingEnergyModifier = parseFloat(processingOption.getAttribute("data-energy-modifier"));

  const placingSelect = job.querySelector(".placing-select");
  const placingOption = placingSelect.options[placingSelect.selectedIndex];
  const placingEnergyModifier = parseFloat(placingOption.getAttribute("data-energy-modifier"));

  const totalEnergy = collectionMethodEnergy + transportationEnergyTotal + processingEnergyModifier + placingEnergyModifier;

  job.querySelector(".total-energy").textContent = totalEnergy.toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {
  const jobContainer = document.querySelector(".job-container");
  const addJobButton = document.querySelector("#add-job-button");

  addJobButton.addEventListener("click", () => {
    //const lastJob = jobContainer.querySelector(".job:last-child");
    //const newJob = lastJob.cloneNode(true);
    const newJob = jobContainer.cloneNode(true);
    
    // Get the job number
    const jobNumber = document.querySelectorAll(".job-container").length + 1;

    // Set the job number in the new job container
    newJob.querySelector("h2").textContent = `Job ${jobNumber}`;
    
    // Set the ID of the materials input element
    newJob.querySelector("label[for='materials-1']").setAttribute("for", `materials-${jobNumber}`);
    newJob.querySelector("#materials-1").setAttribute("id", `materials-${jobNumber}`);

    // Set the ID of the quantity input element
    newJob.querySelector("label[for='quantity-1']").setAttribute("for", `quantity-${jobNumber}`);
    newJob.querySelector("#quantity-1").setAttribute("id", `quantity-${jobNumber}`);

    // Set the ID of the total-energy span element
    newJob.querySelector("#total-energy-1").setAttribute("id", `total-energy-${jobNumber}`);

    // Set the total-energy to 0
    newJob.querySelector(`#total-energy-${jobNumber}`).textContent = "0";

    
    // newJob.querySelector(".material-select").selectedIndex = 0;
    // newJob.querySelector(".collection-method-select").selectedIndex = 0;
    // newJob.querySelector(".transportation-select").selectedIndex = 0;
    // newJob.querySelector(".processing-select").selectedIndex = 0;
    // newJob.querySelector(".placing-select").selectedIndex = 0;
    // newJob.querySelector(".total-energy").textContent = "0.00";
    jobContainer.appendChild(newJob);
  });

  jobContainer.addEventListener("input", (event) => {
    if (event.target.matches(".job input, .job select")) {
      const job = event.target.closest(".job");
      calculateJobEnergy(job);
    }
  });

  const firstJob = jobContainer.querySelector(".job");
  calculateJobEnergy(firstJob);
});
