var elementsToHide = {};
// Normal hide element
var clickedElement = null;
var selectedElementToHide = null;
// Smart hide element
var originalElement = null;
var selectedElement = null;
var previousSelectedElements = [];
var isPreview = false;
var originalDisplay = null;
var shouldRemove = false;
// Menu drag
var mousePosition;
var offset = [0, 0];
var div;
var isMouseDown = false;

document.addEventListener(
  "contextmenu",
  (event) => {
    console.log("Event: ", event);
    clickedElement = getOuterContainer(event.target);
    selectedElementToHide = getElementData(event.target, false);
  },
  true
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Received message: ", request);
  switch (request.type) {
    case "hideElement":
      if (selectedElementToHide) {
        clickedElement.style.visibility = "none";
        selectedElementToHide = getElementData(clickedElement, true);
        storeSelectedElementToHide();
      } else {
        console.log("No element selected to hide");
      }
      break;
    case "smartHideElement":
      if (request.selector) {
        const element = document.querySelector(request.selector);
        if (!element) {
          sendResponse({ error: "Element not found" });
          return;
        }
        clickedElement = element;
        selectedElementToHide = getElementData(element, false);
      }
      try {
        smartHideElement();
      } catch (error) {
        sendResponse({ error: error.message });
        return;
      }
      sendResponse({ success: true });
      break;
    case "removeElement":
      if (selectedElementToHide) {
        clickedElement.style.visibility = "none";
        selectedElementToHide.shouldRemove = true;
        storeSelectedElementToHide();
      } else {
        console.log("No element selected to remove");
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
      <div id="__btn-close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
      </div>
    </div>
    <div class="__content">
      <div class="__element">
        <input type="text" value="${selectedElementToHide.fullSelector}" readonly id="__input-element" />
      </div>
      <div class="__inputs">
        <div class="__top-btns">
          <div id="__btn-select-outer">Select parent</div>
          <div id="__btn-undo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499" />
            </svg>
            Undo
          </div>
        </div>
        <div class="__input-checkbox">
          <input type="checkbox" id="__checkbox-preview" />
          <label for="__checkbox-preview">Preview</label>
        </div>
        <div class="__input-checkbox">
          <input type="checkbox" id="__checkbox-should-remove" />
          <label for="__checkbox-should-remove">Should remove element</label>
        </div>
      </div>
      <div id="__btn-hide-element">Hide element</div>
    </div>
  `;
  document.body.appendChild(menu);

  // Set the initial values
  originalElement = clickedElement;
  selectedElement = originalElement;
  previousSelectedElements = [];
  isPreview = false;
  originalDisplay = selectedElement.style.display;
  shouldRemove = false;

  // position menu in the center of the screen considering scroll
  menu.style.left =
    window.scrollX + window.innerWidth / 2 - menu.offsetWidth / 2 + "px";
  menu.style.top =
    window.scrollY + window.innerHeight / 2 - menu.offsetHeight / 2 + "px";

  var restoreDefaults = function () {
    originalElement = null;
    selectedElement = null;
    previousSelectedElements = [];
    isPreview = false;
    originalDisplay = null;
    shouldRemove = false;
    isMouseDown = false;
  };

  // Get the input elements
  var elementInput = document.getElementById("__input-element");
  var selectOuter = document.getElementById("__btn-select-outer");
  var undo = document.getElementById("__btn-undo");
  var hideElement = document.getElementById("__btn-hide-element");
  var preview = document.getElementById("__checkbox-preview");
  var shouldRemoveElement = document.getElementById("__checkbox-should-remove");
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
    elementInput.value = getElementFullSelector(selectedElement);
    selectedElement.classList.add("context-menu-clicked-element");
    originalDisplay = selectedElement.style.display;
    if (isPreview) {
      selectedElement.style.visibility = "hidden";
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
    elementInput.value = getElementFullSelector(selectedElement);
    selectedElement.classList.add("context-menu-clicked-element");
    originalDisplay = selectedElement.style.display;
    if (isPreview) {
      selectedElement.style.visibility = "hidden";
    }
  });
  preview.addEventListener("change", function () {
    if (preview.checked) {
      selectedElement.style.visibility = "hidden";
      isPreview = true;
    } else {
      selectedElement.style.display = originalDisplay;
      isPreview = false;
    }
  });
  shouldRemoveElement.addEventListener("change", function () {
    shouldRemove = shouldRemoveElement.checked;
  });
  hideElement.addEventListener("click", function () {
    selectedElement.style.visibility = "hidden";
    selectedElement.classList.remove("context-menu-clicked-element");
    selectedElementToHide = getElementData(selectedElement, false);
    selectedElementToHide.shouldRemove = shouldRemove;
    storeSelectedElementToHide();
    restoreDefaults();
    menu.remove();
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
    event.stopPropagation();
    event.stopImmediatePropagation();
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
        ...elementsToHide,
        [selectedElementToHide.fullSelector]: selectedElementToHide,
      },
    },
  });
}

function getElementData(element, shouldGetOuterContainer) {
  console.log("Element: ", shouldGetOuterContainer, element);
  let container = shouldGetOuterContainer
    ? getOuterContainer(element)
    : element;
  return {
    fullSelector: getElementFullSelector(container),
  };
}

getOuterContainer = (element) => {
  let parent = element.parentElement;
  if (!parent || parent.tagName === "BODY") {
    return element;
  }
  // check if parent size is bigger than the child
  if (
    parent.offsetWidth > element.offsetWidth &&
    parent.offsetHeight > element.offsetHeight
  ) {
    return element;
  }
  return getOuterContainer(parent);
};

function getElementSelector(element, index) {
  let selector = element.tagName.toLowerCase();
  if (element.id) {
    selector += "#" + element.id;
  } else if (element.className) {
    selector += "." + element.className.trim().replace(/\s+/g, ".");
  }
  if (index !== undefined) {
    selector += ":nth-child(" + (index + 1) + ")";
  }
  return selector;
}

function getElementIndex(element) {
  return Array.from(element.parentNode.children || []).indexOf(element);
}

function getElementFullSelector(element) {
  let index = getElementIndex(element);
  let selector = getElementSelector(element, index);
  let parent = element.parentElement;
  while (parent) {
    index = getElementIndex(parent);
    selector = getElementSelector(parent, index) + " > " + selector;
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
  elementsToHide = {};
  document
    .querySelectorAll(".__smart-hide-hidden-element")
    .forEach((element) => {
      element.classList.remove("__smart-hide-hidden-element");
    });
  getElementsToHide();
});

function getElementsToHide() {
  const { hostname, pathname } = window.location;
  chrome.storage.local.get(hostname, (data) => {
    console.log("Stored data: ", data);
    if (data[hostname]) {
      const elements = data[hostname][pathname] || {};
      console.log("Elements to hide: ", elements);
      elementsToHide = elements;
      hideElements();
    }
  });
}

function hideElements() {
  if (!elementsToHide) {
    console.log("No elements to hide");
    return;
  }
  for (const el of Object.values(elementsToHide)) {
    let element = document.querySelector(el.fullSelector);
    if (element) {
      if (el.shouldRemove) {
        element.parentNode.removeChild(element);
        continue;
      }
      element.classList.add("__smart-hide-hidden-element");
    }
  }
}

getElementsToHide();

setTimeout(hideElements, 1000);
