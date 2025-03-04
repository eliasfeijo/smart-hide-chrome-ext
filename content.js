var elementsToHide = [];
// Normal hide element
var clickedElement = null;
var selectedElementToHide = null;
// Smart hide element
var originalElement = null;
var selectedElement = null;
var previousSelectedElements = [];
var isPreview = false;
var originalDisplay = null;
// Menu drag
var mousePosition;
var offset = [0, 0];
var div;
var isMouseDown = false;

document.addEventListener(
  "contextmenu",
  (event) => {
    console.log("Event: ", event);
    clickedElement = event.target;
    selectedElementToHide = getElementData(event.target);
  },
  true
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Received message: ", request);
  switch (request) {
    case "smartHideElement":
      smartHideElement();
      break;
    case "getElementToHide":
      if (selectedElementToHide) {
        console.log("Sending selected element: ", selectedElementToHide);
        sendResponse({ element: selectedElementToHide });
        selectedElementToHide = null;
      } else {
        console.log("No element selected to hide");
        sendResponse({ element: null });
      }
      break;
    default:
      break;
  }
});

function smartHideElement() {
  console.log("Smart hide element: ", clickedElement);
  clickedElement.classList.add("context-menu-clicked-element");
  openMenu();
}

function openMenu() {
  // Create the menu
  var menu = document.createElement("div");
  menu.id = "__smart-hide-menu";
  menu.innerHTML = `
    <div class="__title">
      <h1>Smart Hide</h1>
      <button id="__btn-close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
      </button>
    </div>
    <div class="__content">
      <div class="__inputs">
        <div class="__top-btns">
          <button id="__btn-select-outer">Select parent</button>
          <button id="__btn-undo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499" />
            </svg>
            Undo
          </button>
        </div>
        <div class="__input-checkbox">
          <input type="checkbox" id="__checkbox-preview" />
          <label for="__checkbox-preview">Preview</label>
        </div>
      </div>
      <button id="__btn-hide-element">Hide element</button>
    </div>
  `;
  document.body.appendChild(menu);

  // Set the initial values
  originalElement = clickedElement;
  selectedElement = originalElement;
  previousSelectedElements = [];
  isPreview = false;
  originalDisplay = selectedElement.style.display;

  // position menu in the center of the screen
  menu.style.left = window.innerWidth / 2 - menu.offsetWidth / 2 + "px";
  menu.style.top = window.innerHeight / 2 - menu.offsetHeight / 2 + "px";

  var restoreDefaults = function () {
    originalElement = null;
    selectedElement = null;
    previousSelectedElements = [];
    isPreview = false;
    originalDisplay = null;
  };

  // Get the input elements
  var selectOuter = document.getElementById("__btn-select-outer");
  var undo = document.getElementById("__btn-undo");
  var hideElement = document.getElementById("__btn-hide-element");
  var preview = document.getElementById("__checkbox-preview");
  var close = document.getElementById("__btn-close");

  // Add the event listeners
  selectedElement.classList.add("context-menu-clicked-element");
  selectOuter.addEventListener("click", function () {
    if (selectedElement === document.body) {
      return;
    }
    selectedElement.classList.remove("context-menu-clicked-element");
    if (isPreview) {
      selectedElement.style.display = originalDisplay;
    }
    previousSelectedElements.push(selectedElement);
    selectedElement = selectedElement.parentElement;
    selectedElement.classList.add("context-menu-clicked-element");
    originalDisplay = selectedElement.style.display;
    if (isPreview) {
      selectedElement.style.display = "none";
    }
  });
  undo.addEventListener("click", function () {
    if (previousSelectedElements.length === 0) {
      return;
    }
    selectedElement.classList.remove("context-menu-clicked-element");
    if (isPreview) {
      selectedElement.style.display = originalDisplay;
    }
    selectedElement = previousSelectedElements.pop();
    if (!selectedElement) {
      selectedElement = originalElement;
    }
    selectedElement.classList.add("context-menu-clicked-element");
    originalDisplay = selectedElement.style.display;
    if (isPreview) {
      selectedElement.style.display = "none";
    }
  });
  preview.addEventListener("change", function () {
    if (preview.checked) {
      selectedElement.style.display = "none";
      isPreview = true;
    } else {
      selectedElement.style.display = originalDisplay;
      isPreview = false;
    }
  });
  hideElement.addEventListener("click", function () {
    selectedElement.classList.remove("context-menu-clicked-element");
    selectedElement.style.display = "none";
    restoreDefaults();
    menu.remove();
    storeSelectedElementToHide();
  });
  close.addEventListener("click", function () {
    selectedElement.classList.remove("context-menu-clicked-element");
    selectedElement.style.display = originalDisplay;
    restoreDefaults();
    menu.remove();
  });

  // Add the drag event listeners
  var titleElement = document.querySelector("#__smart-hide-menu .__title");
  titleElement.addEventListener("mousedown", function (e) {
    isMouseDown = true;
    offset = [menu.offsetLeft - e.clientX, menu.offsetTop - e.clientY];
  });
  document.addEventListener("mouseup", function () {
    isMouseDown = false;
  });
  document.addEventListener("mousemove", function (event) {
    event.preventDefault();
    if (isMouseDown) {
      mousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
      menu.style.left = mousePosition.x + offset[0] + "px";
      menu.style.top = mousePosition.y + offset[1] + "px";
    }
  });
}

function storeSelectedElementToHide() {
  // Store the element to hide
  const url = new URL(window.location.href);
  chrome.storage.local.set({
    [url.hostname]: {
      [url.pathname]: {
        [selectedElementToHide.fullSelector]: selectedElementToHide,
      },
    },
  });
}

function getElementData(element) {
  let parent = undefined;
  if (element.parentElement) {
    parent = getElementData(element.parentElement);
  }
  return {
    selector: getElementSelector(element),
    fullSelector: getElementFullSelector(element),
    parent,
  };
}

function getElementSelector(element) {
  let selector = element.tagName.toLowerCase();
  if (element.id) {
    selector += "#" + element.id;
  } else if (element.className) {
    selector += "." + element.className.trim().replace(/\s+/g, ".");
  }
  return selector;
}

function getElementFullSelector(element) {
  let selector = getElementSelector(element);
  let parent = element.parentElement;
  while (parent) {
    selector = getElementSelector(parent) + " > " + selector;
    if (parent.id) {
      // If the parent has an ID, it's unique enough
      break;
    }
    parent = parent.parentElement;
  }
  return selector;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("Storage changed: ", namespace, changes);
  document
    .querySelectorAll(".__smart-hide-hidden-element")
    .forEach((element) => {
      element.classList.remove("__smart-hide-hidden-element");
    });
  getElementsToHide();
});

function getElementsToHide() {
  const url = new URL(window.location.href);
  chrome.storage.local.get(url.hostname, (data) => {
    console.log("Stored data: ", data);
    if (data) {
      const elements = data[url.pathname] || {};
      console.log("Elements to hide: ", elements);
      elementsToHide = elements;
    }
  });
}

function hideElements() {
  if (!elementsToHide) {
    return;
  }
  for (const fullSelector in elementsToHide) {
    const element = document.querySelector(fullSelector);
    if (element) {
      element.classList.add("__smart-hide-hidden-element");
    }
  }
}

getElementsToHide();
// Hide elements every second
setInterval(hideElements, 1000);
