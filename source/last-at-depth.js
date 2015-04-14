var get = require('keyarray-get');
var last = require('last-index-matching');

// Given an immutable, nested form and a depth, return the last sub-form
// at that depth within the form.
var lastAtDepth = function recurse(context, depth, keyArray) {
  if (depth === 0) {
    return keyArray;
  } else {
    var lastFormIndex = last(context.content, function(element) {
      return element.hasOwnProperty('form');
    });
    if (lastFormIndex === -1) {
      throw new Error('No form at the given depth');
    }
    var additionalKeys = ['content', lastFormIndex, 'form'];
    return recurse(
      get(context, additionalKeys),
      depth - 1,
      keyArray.concat(additionalKeys)
    );
  }
};

module.exports = function(context, depth) {
  return lastAtDepth(context, depth, []);
};
