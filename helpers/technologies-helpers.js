import { loadFile } from "../data-handler.js";

function mergeTechnologies(tech1, tech2) {
    if (typeof(tech2) !== "object")
      throw("data-handler::loadFolder: not an object");
    for (const stage of Object.keys(tech2)) {
      if (!Array.isArray(tech2[stage]))
        continue;
      if (stage in tech1) {
        if (!Array.isArray(tech1[stage]))
          throw("data-handler::loadFolder: stage not an array");
        tech1[stage] = tech1[stage].concat(tech2[stage]);
      }
      else
        tech1[stage] = tech2[stage];
    }
  return tech1;
}

async function loadTechnologies() {
  const folder = "../data/technologies/";
  const fileList = await loadFile("file-list", folder);
  //console.log(fileList);
  if (!Array.isArray(fileList) || fileList.length == 0)
    throw("data-handler::loadFolder: file list not found or has wrong format");
  
  let tech = await loadFile(fileList.pop(), folder, 'technologies');
  //console.log(tech);
  if (typeof(tech) !== "object")
    throw("data-handler::loadFolder: first tech not an object");
  
  for (const tech2Name of fileList) {
    const tech2 = await loadFile(tech2Name, folder, 'technologies');
    tech = mergeTechnologies(tech, tech2);
  }
  
  return tech;
}

export {
  loadTechnologies
};
