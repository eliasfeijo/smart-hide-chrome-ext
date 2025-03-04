// Normal hide element
var clickedElement = null;
var selectedElementToHide = null;
// Smart hide element
var originalElement = null;
var selectedElement = null;
var previousSelectedElements = [];
var isPreview = false;
var originalDisplay = null;

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
    <div class="title">
      <h1>Smart Hide</h1>
      <button id="btn-close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
      </button>
    </div>
    <div class="content">
      <div class="inputs">
        <div class="top-btns">
          <button id="btn-select-outer">Select parent</button>
          <button id="btn-undo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499" />
            </svg>
            Undo
          </button>
        </div>
        <div class="input-checkbox">
          <input type="checkbox" id="checkbox-preview" />
          <label for="checkbox-preview">Preview</label>
        </div>
      </div>
      <button id="btn-hide-element">Hide element</button>
    </div>
  `;
  document.body.appendChild(menu);

  // Set the initial values
  originalElement = clickedElement;
  selectedElement = originalElement;
  previousSelectedElements = [];
  isPreview = false;
  originalDisplay = selectedElement.style.display;

  // position the menu on the best side of the selectedElement
  var offset = 10; // small offset gap
  var selectedElementRect = selectedElement.getBoundingClientRect();
  var menuRect = menu.getBoundingClientRect();
  var top = selectedElementRect.bottom + window.scrollY + offset;
  var left =
    selectedElementRect.left + window.scrollX - menuRect.width - offset;

  // Check if the selectedElement is too close to the left side of the screen
  if (selectedElementRect.left - menuRect.width - offset < 0) {
    // If so, position it on the right side
    left = selectedElementRect.right + window.scrollX + offset;
  }

  // Check if the menu fits below the selectedElement
  if (
    selectedElementRect.bottom + menuRect.height + offset >
    window.innerHeight
  ) {
    // If not, position it above the selectedElement
    top = selectedElementRect.top + window.scrollY - menuRect.height - offset;
  }
  menu.style.top = top + "px";
  menu.style.left = left + "px";
  // it should resize the menu if it's out of the window bounds
  menuRect = menu.getBoundingClientRect();
  if (menuRect.top < 0) {
    menu.style.top = "0px";
  }
  if (menuRect.left < 0) {
    menu.style.left = "0";
  }
  if (menuRect.bottom > window.innerHeight) {
    menu.style.height = window.innerHeight - menuRect.top + "px";
  }
  if (menuRect.right > window.innerWidth) {
    menu.style.width = window.innerWidth - menuRect.left + "px";
  }

  var restoreDefaults = function () {
    originalElement = null;
    selectedElement = null;
    previousSelectedElements = [];
    isPreview = false;
    originalDisplay = null;
  };

  // Get the input elements
  var selectOuter = document.getElementById("btn-select-outer");
  var undo = document.getElementById("btn-undo");
  var hideElement = document.getElementById("btn-hide-element");
  var preview = document.getElementById("checkbox-preview");
  var close = document.getElementById("btn-close");

  // Add the event listeners
  selectedElement.classList.add("context-menu-clicked-element");
  selectOuter.addEventListener("click", function () {
    if (selectedElement === document.body || isPreview) {
      return;
    }
    selectedElement.classList.remove("context-menu-clicked-element");
    previousSelectedElements.push(selectedElement);
    selectedElement = selectedElement.parentElement;
    selectedElement.classList.add("context-menu-clicked-element");
    originalDisplay = selectedElement.style.display;
  });
  undo.addEventListener("click", function () {
    if ((previousSelectedElements.length === 0, isPreview)) {
      return;
    }
    selectedElement.classList.remove("context-menu-clicked-element");
    selectedElement = previousSelectedElements.pop();
    if (!selectedElement) {
      selectedElement = originalElement;
    }
    selectedElement.classList.add("context-menu-clicked-element");
    originalDisplay = selectedElement.style.display;
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
  hideElements();
});

function hideElements() {
  const url = new URL(window.location.href);
  chrome.storage.local.get(null, (data) => {
    console.log("Stored data: ", data);
    if (data[url.hostname]) {
      const elements = data[url.hostname][url.pathname] || {};
      console.log("Elements to hide: ", elements);
      for (const fullSelector in elements) {
        const element = document.querySelector(fullSelector);
        if (element) {
          element.classList.add("hide");
        }
      }
    }
  });
}

hideElements();
