const Fuse = require('fuse.js/dist/fuse.common');
const {
  SearchModal
} = require('./modals.js');
const {
  renderSearchModal,
  renderSearchResults,
  stringifyHtml
} = require('./rendering.js');
let fuse;

/**
 * This method allows for recursively looking through a JSON tree and return the path
 * @param obj Object (json blob or child)
 * @param path Current path of the key
 * @param arr Array to store all currently defined paths
 */
function findSearchKeysRecurse(obj, path = '', arr = []) {
  for (let key in obj) {
    let item = obj[key];
    let newPath;

    // Time for some magic: Check if we already have a path (to avoid a dot in front of the path) and if the key is
    // not a number. Then we can concat the current path with the new key.
    if (path.length > 0 && isNaN(parseInt(key))) {
      newPath = `${path}.${key}`;
    // If however the key is a number, we can simply ignore this step and use the current path.
    } else if (!isNaN(parseInt(key))) {
      newPath = path;
    // In all other cases, we probably are dealing with the first entry and simply start with the key
    } else {
      newPath = key;
    }

    // If the item is an object, that means we can dive into that and find more paths!
    if (typeof item == 'object') {
      findSearchKeysRecurse(item, newPath, arr);
    } else {
      // We don't need to add `id` to the search keys
      if (key !== 'id') {
        arr.push(newPath);
      }
    }
  }
  // Make sure we only have unique entries in our array
  return [...new Set(arr)];
}

function flattenNode(node) {
  return [
    node,
    ...(
      node.children
        ? node.children.flatMap(flattenNode)
        : []
    )
  ];
}

function initSearch(database) {
  const documents = flattenNode(database)
    .map((node) => ({
      ...node,
      content: node.content.replace(/[^A-z0-9\.,!]+/g, ' ')
    }));
  fuse = new Fuse(documents, {
    includeMatches: true,
    keys: ['name', 'content']
  });
}

function openSearch() {
  new SearchModal(renderSearchModal()).open();
  const resultList = document.querySelector('.search-modal ul');
  const newInput = document.querySelector('.search-modal input');
  newInput.addEventListener('input', event => {
    resultList.innerHTML =
      stringifyHtml(renderSearchResults(fuse.search(event.target.value)));
  });
  newInput.addEventListener('keydown', event => {
    if ( event.key === "Enter" ) {
      const hoveredSearchResult = resultList.querySelector('a:hover');
      if ( hoveredSearchResult ) return hoveredSearchResult.click();
      const firstSearchResult = resultList.querySelector('a');
      if ( firstSearchResult ) return firstSearchResult.click();
    }
  });
  newInput.focus();
}

module.exports = {
  initSearch,
  findSearchKeysRecurse,
  openSearch
};
