function createOptions(selectElement, options) {
  //alert(selectElement.innerHTML);
  selectElement.innerHTML = "";
  options.forEach((option) => {
    const selectOption = document.createElement("option");
    const text = option[0];
    const value = option[1]; // numeric value hidden behind the option
    selectOption.value = text.toLowerCase().replace(" ", "-");
    selectOption.textContent = text;
    selectOption.setAttribute("data", value); // hidden attribute
    selectElement.appendChild(selectOption);
  });
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

function formatEnergy(energy) {
  if (typeof(energy) != 'number') // energy.isNaN()
    return energy;
  return energy.toFixed(1) + "kJ";
}

function createElement(tag, css = '', text = '') {
  let element = document.createElement(tag);
  element.textContent = text;
  if (typeof(css) != 'undefined' && css != '')
    element.classList.add(css);
  return element;
}

export {
  createOptions,
  createElement,
  formatEnergy,
  materialDensity
};
