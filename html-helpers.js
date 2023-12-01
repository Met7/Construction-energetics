
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
// -------------------------------- SELECT

// takes an array and fills the select.
// The array is either
// plain - fill the select with the values as text
// array - 0 is text, 1 is value
// object - "text" key for text, "value" is optional. Other keys will be stored as "data", key prepended by "data-".
function createOptions(selectElement, options) {
  //console.log("Options: ");
  //console.log(options);

  if (!Array.isArray(options))
    throw("createOptions: passed options not an array");
  
  selectElement.innerHTML = "";
  
  if (options.length == 0) {
    return;
  }
    
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
        if (key == "value")
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
  return getSelected(input).text;
}

function getSelectValue(input) {
  return getSelected(input).value;
}

function getSelectData(input) {
  return getSelected(input).getAttribute('data')
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

function createTableRow(label, columns, totalColumns, isHeader = false) {
  if (!Array.isArray(columns)) throw("createTableRow: columns not an array. Got " + typeof(columns) + " instead");

  let row = createElement('tr', (isHeader ? 'stage-header' : ''));
  if (label) {
    row.appendChild(createLabelTd('', label));
    totalColumns--;
  }
  
  for (const column of columns) {
    row.appendChild(createTd(column));
    totalColumns--;
  }
  
  for (let i = 0; i < totalColumns; i++)
    row.appendChild(document.createElement('td'));
  
  return row;
}


export {
  createElement,
  createOptions,
  getSelectText,
  getSelected,
  getSelectValue,
  getSelectData,
  createTd,
  createTr,
  createLabelTd,
  createTableRow
};
