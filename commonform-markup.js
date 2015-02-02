var isString = function(x) {
  return typeof x === 'string';
};

var SUBJECT_OBJECT_MAP = {};
SUBJECT_OBJECT_MAP.use = 'term';
SUBJECT_OBJECT_MAP.definition = 'term';
SUBJECT_OBJECT_MAP.reference = 'summary';
SUBJECT_OBJECT_MAP.field = 'field';

var Scanner = function(input) {
  this.string = input;
  this.tail = input;
  this.offset = 0;
};

Scanner.prototype.eos = function() {
  return this.tail === '';
};

Scanner.prototype.scan = function(re) {
  var match = this.tail.match(re);
  if (match && match.index === 0) {
    var string = match[0];
    this.tail = this.tail.substring(string.length);
    this.offset += string.length;
    return match;
  }
  return '';
};

Scanner.prototype.scanUntil = function(re) {
  var match;
  var index = this.tail.search(re);
  if (index === -1) {
    match = this.tail;
    this.tail = '';
  } else if (index === 0) {
    match = '';
  } else {
    match = this.tail.substring(0, index);
    this.tail = this.tail.substring(index);
  }
  this.offset += match.length;
  return match;
};

var VALID_PROPERTY_CHARS = '[ !#-;=?-@A-Z\\^-`a-z|-~]';

exports.parseMarkup = (function() {
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
    return {content: content};
  };
})();

exports.toMarkup = (function() {
  var forObject = function(item) {
    var key = Object.keys(item)[0];
    var value = item[key];
    switch (key) {
      case 'use': {
        return '<' + value + '>';
      } case 'definition': {
        return '""' + value + '""';
      } case 'field': {
        return '[' + value + ']';
      } case 'reference': {
        return '{' + value + '}';
      } default: {
        throw new Error('Invalid form content');
      }
    }
  };

  return function(form) {
    return form.content.reduce(function(buffer, element) {
      if (isString(element)) {
        return buffer + element;
      } else {
        return buffer + forObject(element);
      }
    }, '');
  };
})();
