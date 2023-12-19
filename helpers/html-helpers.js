
const emptySelectText = "Choose...";

// --------------------------------------
// ------------------------------ GENERIC

function createElement(tag, cssClass = '', text = '') {
  let element = document.createElement(tag);
  element.textContent = text;
  if (typeof(cssClass) != 'undefined' && cssClass != '')
    element.classList.add(cssClass);
  return element;
}

// --------------------------------------
// ------------------------------- LOOKUP

// incl. the element itself.
function getAncestorElement(element, className) {
  while (!element.classList.contains(className)) {
    element = element.parentElement;
    if (!element)
      throw("html-helpers::getAncestorElement: element not found.");
  }
  return element;
}


// --------------------------------------
// ------------------------------- INPUTS

function emptyInput(input, defaultValue = "") {
  let initSelect = false;

  if (input.nodeName == "SELECT" && input.options.length && input.options[0].value == -1)
    initSelect = true;
  
  input.innerHTML = defaultValue;
  input.value = defaultValue;
  if (initSelect = true)
    createSelectEmptyOption(input);
}

function resetInput(input, defaultValue = "") {
  if (input.nodeName == "INPUT")
    input.value = defaultValue;
  else if (input.nodeName = "SELECT")
    input.selectedIndex = 0;
}

function resetLabel(label, defaultValue = "N/A") {
  if (label.nodeName != "P"  && label.nodeName != "LABEL")
    throw("html-helpers::resetLabel: wrong element type.");
  label.innerHTML = defaultValue;
}

// --------------------------------------
// -------------------------------- SELECT

function createSelect(cssClass = '', useEmptyOption = true) {
  let select = createElement("select", cssClass);
  if (typeof(cssClass) != 'undefined' && cssClass != '')
    select.classList.add(cssClass);
  if (useEmptyOption)
    createSelectEmptyOption(select);
  return select;
}

function createSelectEmptyOption(select, defaultText = emptySelectText) {
    const selectOption = document.createElement("option");
    selectOption.textContent = defaultText;
    selectOption.value = -1;
    select.appendChild(selectOption);
}

function isEmptyOption(optionText) {
  return optionText == emptySelectText;
}

// takes an array and fills the select.
// The array is either
// plain - fill the select with the values as text
// array - 0 is text, 1 is value
// object - "text" key for text, "value" is optional. Other keys will be stored as "data", key prepended by "data-".
function createOptions(selectElement, options, useDefaultEmpty = true, defaultText = emptySelectText) {
  //console.log("Options: ");
  //console.log(options);

  if (!Array.isArray(options))
    throw("createOptions: passed options not an array");
  
  selectElement.innerHTML = "";
  
  if (options.length == 0)
    return;
  
  if (useDefaultEmpty)
    createSelectEmptyOption(selectElement, defaultText);
  
  options.forEach((option) => {
    const selectOption = document.createElement("option");
    if (Array.isArray(option)) { // array of [text, value]
      if (option.length != 2)
        throw('createOptions: wrong option array length (got ' + options.length + ' and it should be 2)');
      selectOption.textContent = option[0];
      selectOption.value = option[1];
    }
    else if (typeof(option) === 'object') { // object of {text, optionally value, data records}
      if (!("text" in option))
        throw('createOptions: option missing "text" key');
      for (const key of Object.keys(option)) {
        if (key == "text")
          selectOption.textContent = option["text"];
        else if (key == "value")
          selectOption.value = option["value"];
        else
          selectOption.setAttribute("data-" + key, option[key]);
      }
    }
    else // simple option, just text
      selectOption.textContent = option;

    selectElement.appendChild(selectOption);
  });
}

function getSelected(input) {
  if (input.type != 'select-one') throw ('getSelected: Input not a select');
  return input.options[input.selectedIndex];
}

function getSelectText(input) {
  const option = getSelected(input);
  if (!option)
    return '';
  return option.text;
}

function getSelectValue(input) {
  const option = getSelected(input);
  if (!option)
    return '';
  return option.value;
}

function getSelectData(input, dataKey = "") {
  dataKey = dataKey ? "data-" + dataKey : "data";
  const option = getSelected(input);
  if (!option)
    return '';
  return option.getAttribute(dataKey)
}

function setSelectedByText(select, text) {
  for (let index = 0; index < select.options.length; index++)
    if (select.options[index].text == text) {
      select.selectedIndex = index;
      return;
    }
}

// --------------------------------------
// -------------------------------- TABLE

function createTr(content, cssClass = '') {
  const tr = document.createElement("tr");
  tr.appendChild(content);
  if (typeof(cssClass) != 'undefined' && cssClass != '')
    tr.classList.add(cssClass);
  return tr;
}

function createTd(content, cssClass = '') {
  const td = document.createElement("td");
  td.appendChild(content);
  if (typeof(cssClass) != 'undefined' && cssClass != '')
    td.classList.add(cssClass);
  return td;
}

function createLabelTd(css, text, tdCss) {
  let cell = createElement('td', tdCss); 
  let label = createElement('label', css, text);
  cell.appendChild(label);
  return cell;
}

function createTableRow(label, columns, totalColumns, colspans = [], isHeader = false) {
  if (!Array.isArray(columns)) throw("createTableRow: columns not an array. Got " + typeof(columns) + " instead");

  let row = createElement('tr', (isHeader ? 'stage-header' : ''));
  let i = 0;
  
  // Intial label
  if (label) {
    const td = createLabelTd('', label);
    row.appendChild(td);
    if (colspans.length > i && colspans[i] > 1) {
      if (totalColumns < colspans[i])
        throw("createTableRow: colspan too large");
      td.colSpan = colspans[i];
      totalColumns -= colspans[i];
    } else
      totalColumns--;
    i++;
  }
  
  // Next columns
  for (const column of columns) {
    const td = createTd(column)
    row.appendChild(td);
    if (colspans.length > i && colspans[i] > 1) {
      if (totalColumns < colspans[i])
        throw("createTableRow: colspan too large");
      td.colSpan = colspans[i];
      totalColumns -= colspans[i];
    } else
      totalColumns--;
    i++;
  }
  
  // Fill the rest
  if (totalColumns > 0) {
    const td = document.createElement("td");
    row.appendChild(td);
    td.colSpan = totalColumns;
  }
  
  return row;
}

// --------------------------------------
// -------------------------------- OTHER

function createLink(text, ref, cssClass = '') {
  const link = document.createElement("a");
  link.href = ref;
  if (typeof(cssClass) != 'undefined' && cssClass != '')
    link.classList.add(cssClass);
  return link;
}



export {
  createElement,
  getAncestorElement,
  emptyInput,
  resetInput,
  resetLabel,
  createSelect,
  createOptions,
  isEmptyOption,
  getSelectText,
  getSelected,
  getSelectValue,
  getSelectData,
  setSelectedByText,
  createTd,
  createTr,
  createLabelTd,
  createTableRow
};
