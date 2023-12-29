
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatNumber(number) {
  return numberWithCommas(Number(Number(number).toFixed(2)));
}

function formatEnergy(energy) {
  if (typeof(energy) != 'number') // energy.isNaN()
    return energy;
  return formatNumber(energy) + " MH";
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
  formatNumber,
  formatEnergy,
  formatUnit,
  strEq
};
