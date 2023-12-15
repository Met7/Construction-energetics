function formatEnergy(energy) {
  if (typeof(energy) != 'number') // energy.isNaN()
    return energy;
  return Number(energy.toFixed(2)) + " Mh";
}

function formatUnit(unit) {
  if (unit == "m2")
    return "m<sup>2</sup>";
  if (unit == "m3")
    return "m<sup>3</sup>";
  return unit;
}

// case insensitive; this may change.
// usually used to compare strings in FE with those in JSON.
function strEq(str1, str2) {
  return !str1.localeCompare(str2, undefined, { sensitivity: 'accent' });
}

export {
  formatEnergy,
  formatUnit,
  strEq
};
