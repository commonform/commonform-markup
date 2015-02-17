var Immutable = require('immutable');
var emptyList = Immutable.List();

// Given an immutable, nested form and a depth, return the last sub-form
// at that depth within the form.
var lastAtDepth = function recurse(context, depth, keyArray) {
  if (depth === 0) {
    return keyArray;
  } else {
    var lastFormIndex = context.get('content')
      .findLastIndex(function(element) {
        return Immutable.Map.isMap(element) &&
          element.has('form');
      });
    if (lastFormIndex === -1) {
      throw new Error('No form at the given depth');
    }
    var additionalKeys = ['content', lastFormIndex, 'form'];
    return recurse(
      context.getIn(additionalKeys),
      depth - 1,
      keyArray.concat(additionalKeys)
    );
  }
};

module.exports = function(context, depth) {
  return lastAtDepth(context, depth, emptyList);
};
