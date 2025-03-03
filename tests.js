// Description: This file contains the tests for the URL pattern matching algorithm.

/**
 * Regex for URL pattern matching with 7 groups:
 * 1. Protocol (optional)
 * 2. Domain
 * 3. Path (optional)
 * 4. Filename (optional)
 * 5. Extension (optional)
 * 6. Query (optional)
 * 7. Hash (optional)
 */
const regexpUrl = new RegExp(
  /((?:https?)|\*):\/\/((?:(?!(?:\/|#|\?|&)).)+)(?:(\/(?:(?:(?:(?!(?:#|\?|&)).)+\/))?))?(?:((?:(?!(?:\.|$|\?|#)).)+))?(?:(\.(?:(?!(?:\?|$|#)).)+))?(?:(\?(?:(?!(?:$|#)).)+))?(?:(#.+))?/
);

// Escape special characters in a string
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Compose the regex with supported URL patterns
// The regex will be used to access data from chrome.storage.local
const composeRegexp = (url) => {
  if (!url || typeof url !== "string" || !regexpUrl.test(url)) {
    throw new Error("Invalid url");
  }

  const [
    _,
    protocolGroup,
    domainGroup,
    pathGroup,
    filenameGroup,
    extensionGroup,
    queryGroup,
    hashGroup,
  ] = url.match(regexpUrl);

  // ################### DOMAIN VALIDATION ###################
  // Set up and validate the domain data before doing anything else, as it is the only required group.

  // Validate domain wildcard position and following character
  const validNextChars = [".", "/", "", undefined];
  if (domainGroup.includes("*") && domainGroup.lastIndexOf("*") !== 0) {
    throw new Error(
      "Invalid domain, wildcard must be the first or only character"
    );
  } else if (!validNextChars.includes(domainGroup[1])) {
    throw new Error(
      "Invalid domain, wildcard must be followed by a a dot '.', slash '/' or nothing"
    );
  }

  let host, port;

  const portIndex = domainGroup.indexOf(":");
  // Check if domain includes port
  if (portIndex !== -1) {
    // Domain includes port, extract hostname and port
    host = domainGroup.slice(0, portIndex);
    port = domainGroup.slice(portIndex);
  } else {
    // Domain does not include port, extract hostname only
    host = domainGroup;
  }

  // The hostname must have at least 2 parts (e.g. domain.com) to be valid,
  // except for localhost and the domain wildcard '*' which can have a single part
  const hostnameParts = host.split(".");
  const validSinglePartHosts = ["localhost", "*"];
  if (
    hostnameParts.length < 2 &&
    !validSinglePartHosts.includes(hostnameParts[0])
  ) {
    throw new Error(`Invalid domain: ${domainGroup}`);
  }

  /**
   * ################### REGEX COMPOSITION ###################
   * Compose the regex based on the URL parts
   * The regex will be used to access data from chrome.storage.local
   * Here follows a sample regex using the hostname *.domain.com.br as an example:
   * ^(?:(?:https?):\/\/)?(?:[^\.]*)\.domain\.com\.br$
   */

  // Protocol
  let protocol =
    protocolGroup === "*"
      ? /(?:(?:https?):\/\/)?/
      : new RegExp(`${protocolGroup}://`);

  // Domain
  const domainWildcard = /(?:[^\/]*)\/?/;
  const [subdomain, ...tlds] = hostnameParts;
  let domain = new RegExp(
    `${escapeRegExp(subdomain)}\\.${escapeRegExp(tlds.join("."))}`
  );
  if (subdomain === "*") {
    if (tlds.length < 1) {
      domain = domainWildcard;
    } else {
      domain = new RegExp(`(?:[^.]*)\\.${escapeRegExp(tlds.join("."))}`);
    }
  }

  // Port
  let portRegex = "";
  if (port) {
    portRegex = new RegExp(`${escapeRegExp(port)}`);
  }

  // TODO: Path, filename, extension, query, and hash groups

  // Compose the regex
  console.log("Protocol: ", protocol.source);
  console.log("Domain: ", domain.source);
  const composer = (...regexps) => regexps.map((r) => r.source).join("");
  const regex = composer(protocol, domain, portRegex);

  return new RegExp(`^${regex}$`);
};

const testData = [
  "https://sub.domain.com.br",
  "domain.com.br",
  "sub.domain.com.br",
  "sub.domain.com",
  "domain",
  "domain.com",
  "domain.com/",
  "domain.com.br.rj",
  "domain.com.br.*",
  "http://domain.com",
  "https://domain.com",
  "file:///path/to/file.html",
];

let url = `*://\*.domain.com.br/nested/path/index.html?query=string&query2=string2#hash`;

const regex = composeRegexp(url);
console.log("Regex: ", regex);

const success = [];
const fail = [];

testData.forEach((url) => {
  try {
    if (regex.test(url)) {
      success.push(url);
      return;
    }
    fail.push(url);
  } catch (error) {
    fail.push(url);
  }
});

console.log(
  `${success.length} successful tests:`,
  JSON.stringify(success, null, 2)
);
console.log(`${fail.length} failed tests:`, JSON.stringify(fail, null, 2));
