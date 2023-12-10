import { loadFile } from "../data-handler.js";

const materialsData = await loadFile('materials', "../data/");

// customConversions - "conversions" object that is directly at a specific study. It has priority.
// returns -1 if the conversion was not resolved
function convertQuantity(materialCategory, material, sourceUnit, targetUnit, Quantity, customConversions) {
  let conversionFactor = 0;

  if (targetUnit == sourceUnit) // nothing to do
    conversionFactor = 1;
  
  // a direct custom conversion (in tech)
  else if (targetUnit in customConversions)
    conversionFactor = customConversions[targetUnit];

  else { // look in materials
    // first, safety checks
    if (!(materialCategory in materialsData) || !(material in materialsData[materialCategory][data]))
      throw("materials-helper::convertQuantity: material not found (" + materialCategory + ", " + material + ")");
    material = materialsData[materialCategory][data][material];
    if (!(conversions in material))
      throw("materials-helper::convertQuantity: Wrong JSON format - (" + materialCategory + ", " + material + ") missing \"conversions\".");
    
    // Try to find a conversion using materials data.
    // Priority: 1) chain conversion using a conversion from tech and material 2) material conversion 3) material category level conversion
    
    
    if (targetUnit in material[conversions]) // specific for material
      conversionFactor = material[conversions][targetUnit];
    else {
      if (!(conversions in materialsData[materialCategory]))
        throw("materials-helper::convertQuantity: Wrong JSON format - (" + materialCategory + ") missing \"conversions\".");
      if (targetUnit in materialsData[materialCategory][conversions]) // average for material category
        conversionFactor = materialsData[materialCategory][conversions][targetUnit];
    }
  }
  if (conversionFactor)
    return Quantity * conversionFactor;
  return -1;
}


export {
  convertQuantity
};
