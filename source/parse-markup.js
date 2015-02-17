var Immutable = require('immutable');
var Scanner = require('./scanner');
var VALID_PROPERTY_CHARS = '[ !#-;=?-@A-Z\\^-`a-z|-~]';

module.exports = (function() {
  var TAG_RE = new RegExp(
    '<(' + VALID_PROPERTY_CHARS + '+)>|' +
    '""(' + VALID_PROPERTY_CHARS + '+)""|' +
    '{(' + VALID_PROPERTY_CHARS + '+)}|' +
    '\\[(' + VALID_PROPERTY_CHARS + '+)\\]'
  );

  var firstMatchGroup = function(match) {
    for (var x = 1; x < match.length; x++) {
      if (match[x]) {
        return match[x];
      }
    }
  };

  var objectForMatch = (function() {
    var LEAD_CHAR_NOUN = {
      '"': 'definition',
      '<': 'use',
      '{': 'reference',
      '[': 'field'
    };

    return function(match) {
      var value = firstMatchGroup(match);
      var key = LEAD_CHAR_NOUN[match[0][0]];
      var object = {};
      object[key] = value;
      return object;
    };
  })();

  return function(input) {
    var content = [];
    var scanner = new Scanner(input);
    while (!scanner.eos()) {
      var value = scanner.scanUntil(TAG_RE);
      if (value) {
        content.push(value);
      }
      var match = scanner.scan(TAG_RE);
      if (!match) {
        break;
      }
      content.push(objectForMatch(match));
    }
    return Immutable.fromJS({content: content});
  };
})();
