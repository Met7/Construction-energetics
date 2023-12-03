import { loadFile } from "./data-handler.js";

const studiesData = await loadFile('studies');

function getStudyCitation(author, year) {
  if (!(author in studiesData) || !(year in studiesData[author])) {
    console.log("Helpers: study for (" + author + ", " + year + ") not found.");
    return "";
  }
  return studiesData[author];
}

function formatEnergy(energy) {
  if (typeof(energy) != 'number') // energy.isNaN()
    return energy;
  return energy.toFixed(1) + "kJ";
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

// case insensitive; this may change.
// usually used to compare strings in FE with those in JSON.
function strEq(str1, str2) {
  return !str1.localeCompare(str2, undefined, { sensitivity: 'accent' });
}


export {
  formatEnergy,
  getStudyCitation,
  materialDensity,
  strEq
};
