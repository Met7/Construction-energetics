
const defaultSelectText = "Choose...";
const emptySelectText = "N/A";
const noFilterText = "Show all";

// --------------------------------------
// ------------------------------ GENERIC

function createElement(tag, cssClass = '', text = '') {
  let element = document.createElement(tag);
  element.textContent = text;
  if (typeof(cssClass) != 'undefined' && cssClass != '') {
    if (Array.isArray(cssClass)) {
      for (const item of cssClass)
        element.classList.add(item);
    }
    else
      element.classList.add(cssClass);
  }
  return element;
}

function collapseContent(contentElement, instant = false) {
  //console.log("closing");
  //const savedStyle = contentElement.style.transition;
  //contentElement.style.transition = "";
  contentElement.style.maxHeight = 0;
  contentElement.setAttribute("data-open", 0);
  //contentElement.classList.add("collapsible-content");
  //contentElement.style.transition = savedStyle;
}

function unCollapseContent(contentElement, instant = false) {
  contentElement.style.maxHeight = contentElement.scrollHeight + "px";
  contentElement.setAttribute("data-open", 1);
}

function makeCollapsible(element, initHeight = 2000, startOpen = true) {
  const content = element.nextElementSibling;
  if (startOpen) {
    content.setAttribute("data-open", 1);
    // some reasonable initial maxHeight must be set in order for the first slid in to work.
    // otherwise maxHeight is zero and slide is instant.
    content.style.maxHeight = initHeight + "px";
    //content.classList.add(contentClass);
  }
  else {
    content.setAttribute("data-open", 0);
    content.style.maxHeight = "0px"; //content.scrollHeight + "px";
  }

  element.addEventListener("click", function() {
    element.classList.toggle("active");
    if (content.getAttribute("data-open") == 0)
      unCollapseContent(content);
    else
      collapseContent(content);
  });
  
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
    createSelectDefaultOption(input);
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
    createSelectDefaultOption(select);
  return select;
}

function createSelectDefaultOption(select, isEmpty = true, defaultText = [defaultSelectText, emptySelectText]) {
    const selectOption = document.createElement("option");
    if (isEmpty)
      selectOption.textContent = defaultText[1];
    else
      selectOption.textContent = defaultText[0];
    selectOption.value = -1;
    select.appendChild(selectOption);
}

// only works if the text is the default
function isEmptyOption(optionText) {
  return optionText == "" || optionText == emptySelectText || optionText == defaultSelectText;
}

// takes an array and fills the select.
// The array is either
// plain - fill the select with the values as text
// array - 0 is text, 1 is value
// object - "text" key for text, "value" is optional. Other keys will be stored as "data", key prepended by "data-".
function createOptions(selectElement, options, useDefaultEmpty = true, defaultText = [defaultSelectText, emptySelectText]) {
  //console.log("Options: ");
  //console.log(options);

  if (!Array.isArray(options))
    throw("createOptions: passed options not an array");
  
  selectElement.innerHTML = "";
    
  if (useDefaultEmpty)
    createSelectDefaultOption(selectElement, (options.length == 0), defaultText);
  
  if (options.length == 0)
    return;  
  
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
  if (input.type != 'select-one') throw new Error('getSelected: Input not a select'); 
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

function setSelectedByData(select, dataKey, value) {
  for (let index = 0; index < select.options.length; index++) {
    if (select.options[index].getAttribute("data-" + dataKey) == value) {
      select.selectedIndex = index;
      return;
    }
  }
}

// --------------------------------------
// -------------------------------- TABLE

function createTr(content, cssClass = '') {
  const tr = createElement("tr", cssClass);
  tr.appendChild(content);
  return tr;
}

function createTd(content, cssClass = '') {
  const td = createElement("td", cssClass);
  if (Array.isArray(content)) {
    for (const item of content)
      td.appendChild(item);
  }
  else
    td.appendChild(content);
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
  defaultSelectText,
  emptySelectText,
  noFilterText,
  createElement,
  makeCollapsible,
  collapseContent,
  unCollapseContent,
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
  setSelectedByData,
  createTd,
  createTr,
  createLabelTd,
  createTableRow
};
