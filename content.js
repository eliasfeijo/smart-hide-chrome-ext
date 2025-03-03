var selectedElementToHide = null;

document.addEventListener(
  "contextmenu",
  (event) => {
    console.log("Event: ", event);
    selectedElementToHide = getElementData(event.target);
    // selectedElementToHide.classList.add("context-menu-clicked-element");
  },
  true
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Received message: ", request);
  if (request == "getElementToHide") {
    console.log("Sending selected element: ", selectedElementToHide);
    sendResponse({ element: selectedElementToHide });
  }
});

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
    selector += "." + element.className.replace(/\s+/g, ".");
  }
  return selector;
}

function getElementFullSelector(element) {
  let selector = getElementSelector(element);
  let parent = element.parentElement;
  while (parent) {
    selector = getElementSelector(parent) + " > " + selector;
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
      for (const selector in elements) {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.add("hide");
        }
      }
    }
  });
}
