chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "hide",
    title: "Hide",
    type: "normal",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "smart-hide",
    title: "Smart Hide",
    type: "normal",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "remove",
    title: "Remove",
    type: "normal",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

async function handleContextMenuClick(item, tab) {
  switch (item.menuItemId) {
    case "hide":
      chrome.tabs.sendMessage(
        tab.id,
        { type: "hideElement" },
        {
          frameId: item.frameId,
        }
      );
      break;
    case "smart-hide":
      chrome.tabs.sendMessage(
        tab.id,
        { type: "smartHideElement" },
        {
          frameId: item.frameId,
        }
      );
      break;
    case "remove":
      chrome.tabs.sendMessage(
        tab.id,
        { type: "removeElement" },
        {
          frameId: item.frameId,
        }
      );
      break;
    default:
      break;
  }
}
