# Smart Hide Chrome Extension

## Right click Features

Smart Hide offers three powerful right click options to help you customize your browsing experience:

### 1. **One-Click Hide**

- **What it does**: Instantly hides the selected element from the screen with a single click (may leave a blank space).
- **Use case**: Perfect for quickly removing distracting elements like ads, banners, or pop-ups.

### 3. **One-click Remove**

- **What it does**: Completely removes the selected element from the HTML document (doesn't leave a blank space, but may behave weirdly in some cases, e.g. when removing one or more items from a dynamic list/group of elements).
- **Use case**: Great when you want to free the blank space of a hidden element for other elements to fill in, but I recommend you to try it out and see the behavior for yourself on a few different webpages, just keep removing a random element at a time and refreshing the page, and compare with the simple hide.

### 3. **Smart Hide**

- **What it does**: Provides advanced hiding options, allowing you to select parent elements, preview and customize how elements are hidden.
- **Use case**: Ideal for hiding the outer container of a group of elements.

## Extension Popup Features

### 1. **Reset Data**

- **What it does**: Clears all hidden elements and resets the extension to its default state.
- **Use case**: Useful when you want to start fresh or undo all your hidden elements.

### 2. **Hide Selector**

- **What it does**: Allows you to hide a specific element with the given selector, if valid.
- **Use case**: Handy for hiding elements that are not directly clickable or selectable on the screen.
- **Note**: The selector must be a valid CSS selector, e.g. `#myElement`, `.myClass`, `div`, etc.

## Additional Features

- **Cross-session memory**: Smart Hide remembers your hidden elements across browsing sessions, so you don’t have to hide them again.
- **Lightweight and fast**: Designed to work seamlessly without slowing down your browser.
- **Open-source**: Fully transparent and customizable—feel free to contribute or modify the code to suit your needs!

## Roadmap

- **Reset data for current page**: Add an option to reset hidden elements for the current page only.
- **Export/Import hidden elements**: Allow users to export and import hidden elements to/from a file.
- **URL matching patterns**: Add an option in "Smart Hide" (right click menu) to use URL matching patterns to be able to hide elements on other pages with the same structure, e.g. `https://example.com/content/*` (the wildcard `*` would match any URL after `/content/`).
