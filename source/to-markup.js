var Immutable = require('immutable');
var constants = require('./constants');

var isString = function(x) {
  return typeof x === 'string';
};

module.exports = (function() {
  var forObject = function(item, depth) {
    depth = depth || 0;
    var key = item.keySeq().first();
    var value = item.get(key);
    var indent = indentation(depth);
    switch (key) {
      case 'use':
        return '<' + value + '>';
      case 'definition':
        return '""' + value + '""';
      case 'field':
        return '[' + value + ']';
      case 'reference':
        return '{' + value + '}';
      default:
        if (item.has('form')) {
          var form = item.get('form');
          return indent +
            (item.has('summary') ? item.get('summary') + ' ' : '') +
            (form.has('conspicuous') ? '!!' : '\\\\') +
            ' ' +
            formToMarkup(form, depth + 1);
        } else {
          throw new Error('Invalid form content');
        }
    }
  };

  var indentation = function(depth) {
    return new Array((constants.TAB_WIDTH * depth) + 1).join(' ');
  };

  var formToMarkup = function formToMarkup(form, depth) {
    return form.get('content')
      .reduce(function(buffer, element, index, array) {
        if (
          (index > 0 && array.hasIn([index - 1, 'form'])) ||
          (Immutable.Map.isMap(element) && element.has('form'))
        ) {
          buffer = buffer + '\n\n';
        }
        if (isString(element)) {
          return buffer + element;
        } else {
          return buffer + forObject(element, depth);
        }
      }, '');
  };

  return function(form) {
    return (form.has('conspicuous') ? '!! ' : '') +
      formToMarkup(form, 0);
  };
})();
