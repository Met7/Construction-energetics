// Add event listener to add job button
document.getElementById("addJobBtn").addEventListener("click", addJob);

// Function to add a new job container
function addJob() {
  // Get the job container template
  const template = document.getElementById("jobTemplate");
  // Create a new job container by cloning the template
  const newJob = template.content.cloneNode(true);
  // Append the new job container to the end of the job list
  document.getElementById("jobList").appendChild(newJob);

  // Set up event listener for calculate button
  const calculateBtn = newJob.querySelector(".calculateBtn");
  calculateBtn.addEventListener("click", calculateEnergy);
}

// Function to calculate the total energy for the job
function calculateEnergy() {
  // Get the stage 1 material and quantity
  const stage1Material = this.closest(".jobContainer").querySelector(".stage1Material").value;
  const stage1Quantity = parseFloat(this.closest(".jobContainer").querySelector(".stage1Quantity").value);

  // Calculate the base energy for stage 2 based on the stage 1 material
  let stage2BaseEnergy = 0;
  switch (stage1Material) {
    case "timber":
      stage2BaseEnergy = 50;
      break;
    case "dirt":
      stage2BaseEnergy = 40;
      break;
    case "limestone":
    case "granite":
      stage2BaseEnergy = 500;
      break;
    default:
      console.error("Invalid stage 1 material: " + stage1Material);
      return;
  }

  // Get the stage 2 collection technology and calculate the energy modifier
  const stage2CollectionTech = parseFloat(this.closest(".jobContainer").querySelector(".stage2CollectionTech").value);
  const stage2EnergyModifier = stage2BaseEnergy / stage2CollectionTech;

  // Get the stage 3 transportation method and distance
  const stage3TransportMethod = parseFloat(this.closest(".jobContainer").querySelector(".stage3TransportMethod").value);
  const stage3Distance = parseFloat(this.closest(".jobContainer").querySelector(".stage3Distance").value);

  // Calculate the weight based on the material and quantity
  let weight = 0;
  switch (stage1Material) {
    case "timber":
      weight = stage1Quantity * 600;
      break;
    case "dirt":
      weight = stage1Quantity * 1800;
      break;
    case "limestone":
      weight = stage1Quantity * 2700;
      break;
    case "granite":
      weight = stage1Quantity * 2900;
      break;
    default:
      console.error("Invalid stage 1 material: " + stage1Material);
      return;
  }

  // Calculate the energy for stage 3 based on the weight, distance, and transportation method
  const stage3Energy = weight * stage3Distance * stage3TransportMethod;

  // Calculate the total energy for the job
  const totalEnergy = stage1Quantity * stage2EnergyModifier + stage3Energy;

  // Output the total energy to the job container
  const output = this.closest(".jobContainer").querySelector(".output");
  output.textContent = "Total energy: " + totalEnergy.toFixed(2) + " kJ";
}



// // Get the button element
// const addJobBtn = document.getElementById("add-job-btn");

// // Get the job container element
// const jobContainer = document.querySelector(".job-container");

// // Add event listener to button
// addJobBtn.addEventListener("click", function () {
  // // Clone the job container element
  // const newJobContainer = jobContainer.cloneNode(true);

  // // Get the job number
  // const jobNumber = document.querySelectorAll(".job-container").length + 1;

  // // Set the job number in the new job container
  // newJobContainer.querySelector("h2").textContent = `Job ${jobNumber}`;

  // // Set the ID of the materials input element
  // newJobContainer.querySelector("label[for='materials-1']").setAttribute("for", `materials-${jobNumber}`);
  // newJobContainer.querySelector("#materials-1").setAttribute("id", `materials-${jobNumber}`);

  // // Set the ID of the labor input element
  // newJobContainer.querySelector("label[for='labor-1']").setAttribute("for", `labor-${jobNumber}`);
  // newJobContainer.querySelector("#labor-1").setAttribute("id", `labor-${jobNumber}`);

  // // Set the ID of the man-hours span element
  // newJobContainer.querySelector("#man-hours-1").setAttribute("id", `man-hours-${jobNumber}`);

  // // Set the man-hours to 0
  // newJobContainer.querySelector(`#man-hours-${jobNumber}`).textContent = "0";

  // // Append the new job container to the job container element
  // jobContainer.parentNode.appendChild(newJobContainer);
// });
