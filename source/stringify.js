var constants = require('./constants');

module.exports = (function() {
  var forObject = function(item, depth) {
    depth = depth || 0;
    var key = Object.keys(item)[0];
    var value = item[key];
    var indent = indentation(depth);
    switch (key) {
      case 'use':
        return '<' + value + '>';
      case 'definition':
        return '""' + value + '""';
      case 'blank':
        return '[' + value + ']';
      case 'reference':
        return '{' + value + '}';
      default:
        if (item.hasOwnProperty('form')) {
          var form = item.form;
          return indent +
            (item.hasOwnProperty('heading') ? item.heading + ' ' : '') +
            (form.hasOwnProperty('conspicuous') ? '!!' : '\\\\') +
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
    return form.content
      .reduce(function(buffer, element, index, array) {
        if (
          (index > 0 && array[index - 1].hasOwnProperty('form')) ||
          (element.hasOwnProperty('form'))
        ) {
          buffer = buffer + '\n\n';
        }
        if (typeof element === 'string') {
          return buffer + element;
        } else {
          return buffer + forObject(element, depth);
        }
      }, '');
  };

  return function(form) {
    return (form.hasOwnProperty('conspicuous') ? '!! ' : '') +
      formToMarkup(form, 0);
  };
})();
