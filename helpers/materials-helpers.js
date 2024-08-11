import { loadFile } from "../data-handler.js";

const materialsData = await loadFile('materials');

const supportedUnits = ["t", "m3", "m2", "unit"];
const defaultUnit = "m3";

function reverseConversionRatio(ratio) {
  if (ratio == 0)
    throw("Materials helper: conversion ratio is zero");
  return 1.0 / ratio; // TODO maybe .toFixed(2)
}

function getSupportedUnits() {
  return supportedUnits;
}

/*
function getAllConversions(sourceUnit, conversions) {
  const newConversions = [];
  for (const conversionUnit of Object.keys(conversions)) {
    newConversions.push({
      "from": sourceUnit,
      "to": conversionUnit,
      "ratio": conversions[conversionUnit]
    });
    // reverse
    newConversions.push({
      "from": conversionUnit,
      "to": sourceUnit,
      "ratio": reverseConversionRatio(conversions[conversionUnit])
    });
  }
}*/


function getConversionFactorFromConversions(sourceUnit, targetUnit, converionsSourceUnit, conversions) {
  if (sourceUnit == converionsSourceUnit && (targetUnit in conversions))
    return conversions[targetUnit];
  if (targetUnit == converionsSourceUnit && (sourceUnit in conversions))
    return reverseConversionRatio(conversions[sourceUnit]);
  
  console.log("Conversion: failed to match conversion");
  return -1;
}


function getConversionFactor(materialCategory, material, sourceUnit, targetUnit, customSourceUnit, customConversions) {
  //console.log("getConversionFactor: sourceUnit: " + sourceUnit + "; targetUnit: " + targetUnit + "; customSourceUnit: " + customSourceUnit + "; customConverions: >");
  //console.log(customConversions);
  let conversionFactor;

  if (targetUnit == sourceUnit) { // nothing to do
    console.log("Conversion: not needed");
    return 1;
  }

  // a direct custom conversion (in tech)
  if ((conversionFactor = getConversionFactorFromConversions(sourceUnit, targetUnit, customSourceUnit, customConversions)) != -1) {
    console.log("Conversion: tech - " + conversionFactor);
    return conversionFactor;
  }

  // look in materials
  // first, safety checks
  if (!(materialCategory in materialsData) || !(material in materialsData[materialCategory]["data"]))
    throw("materials-helper::getConversionFactor: material not found (" + materialCategory + ", " + material + ")");
  
  // material
  if (!("conversions" in materialsData[materialCategory]["data"][material]))
    throw("materials-helper::getConversionFactor: Wrong JSON format - (" + materialCategory + ", " + material + ") missing \"conversions\".");
  if ((conversionFactor = getConversionFactorFromConversions(sourceUnit, targetUnit, defaultUnit, materialsData[materialCategory]["data"][material]["conversions"])) != -1) {
    console.log("Conversion: material - " + conversionFactor);
    return conversionFactor;
  }
  
  // material category
  if (!("conversions" in materialsData[materialCategory]))
    throw("materials-helper::getConversionFactor: Wrong JSON format - (" + materialCategory + ") missing \"conversions\".");
  if ((conversionFactor = getConversionFactorFromConversions(sourceUnit, targetUnit, defaultUnit, materialsData[materialCategory]["conversions"])) != -1) {
    console.log("Conversion: material category - " + conversionFactor);
    return conversionFactor;
  }
      
  console.log("Conversion: none found");
  return -1;
}


// customConversions - "conversions" object that is directly at a specific study. It has priority.
// customSourceUnit, customConversions - the unit of the chosen tech and conversions it offers
// returns -1 if the conversion was not resolved
function convertQuantity(materialCategory, material, sourceUnit, targetUnit, quantity, customSourceUnit, customConversions) {
  let conversionFactor = getConversionFactor(materialCategory, material, sourceUnit, targetUnit, quantity, customSourceUnit, customConversions);
  
  if (conversionFactor == 0)
    throw("Materials-helper::convertQuantity: conversion factor is zero");
  
  if (conversionFactor == -1)
    return -1;
  
  return quantity * conversionFactor;
}


export {
  getSupportedUnits,
  getConversionFactor,
  convertQuantity
};
