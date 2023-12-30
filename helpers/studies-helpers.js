import { loadFile } from "../data-handler.js";

const studiesData = await loadFile('studies');

function getStudyCitation(author, year) {
  if (!(author in studiesData) || !(year in studiesData[author])) {
    console.log("Helpers: study for (" + author + ", " + year + ") not found.");
    return "";
  }
  return studiesData[author][year];
}

export {
  getStudyCitation
};
