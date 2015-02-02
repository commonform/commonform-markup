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
  switch (index) {
    case -1:
      match = this.tail;
      this.tail = '';
      break;
    case 0:
      match = '';
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
  }
  this.offset += match.length;
  return match;
};

var VALID_PROPERTY_CHARS = '[ !#-;=?-@A-Z\\^-`a-z|-~]';

var parseMarkup = exports.parseMarkup = (function() {
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

var lastSubForm = function(form) {
  var content = form.content;
  // Iterate the form's content in reverse. Return the first sub-form.
  for (var i = content.length - 1; i >= 0; i--) {
    var element = content[i];
    if (element.hasOwnProperty('summary')) {
      return element;
    }
  }
  throw new Error('No such form');
};

// Return the last sub-form at the given depth.
var lastAtDepth = function(context, depth) {
  return depth === 0 ?
    context.form.content :
    lastAtDepth(lastSubForm(context.form), depth - 1);
};

var pushContent = function(destination, source) {
  var length = destination.length;
  if (
    length > 0 &&
    source.length > 0 &&
    isString(destination[length - 1]) &&
    isString(source[0])
  ) {
    destination[length - 1] = destination[length - 1] +
      ' ' + source.shift();
  }
  source.forEach(function(element) {
    destination.push(element);
  });
};

var TAB_WIDTH = 4;
var LINE_RE = /^( *)(.+)$/;
var ALL_SPACE = /^\s*$/;
var CONTIGUOUS_SPACE = / {2,}/g;
var SUMMARY_SEP = /(\\\\|\!\!)/;

exports.parseLines = function(input) {
  return input.split('\n')

    // Tokenize lines with indentation attributes, discarding blanks.
    .reduce(function(tokens, line, number) {
      number = number + 1;
      if (ALL_SPACE.test(line)) {
        return tokens;
      } else {
        var match = LINE_RE.exec(line);
        var depth = Math.floor(match[1].length / TAB_WIDTH);
        var string = match[2].replace(CONTIGUOUS_SPACE, ' ');

        tokens.push({line: number, depth: depth, string: string});
        return tokens;
      }
    }, [])

    // Detect summaries and parse markup.
    .map(function(element) {
      var string = element.string;
      delete element.string;
      var match = SUMMARY_SEP.exec(string);
      if (match) {
        var summary = string.slice(0, match.index);
        var content = string.slice(match.index + match[1].length);
        if (match[1] === '!!') {
          element.conspicuous = 'true';
        }
        element.summary = summary.trim();
        element.form = parseMarkup(content.trim());
      } else {
        element.content = parseMarkup(string).content;
      }
      return element;
    })

    // Check indentation
    .map(function(element, i, array) {
      if (i === 0) {
        if (element.depth > 0) {
          throw new Error('Line 1 indented too far');
        }
      } else {
        var last = array[i - 1];
        if (element.depth > last.depth &&
            element.depth - last.depth > 1) {
          throw new Error('Line ' + element.line + ' indented too far');
        }
      }
      return element;
    })

    // Build form objects
    .reduce(function(form, element) {
      var parent;
      if (element.summary) {
        parent = lastAtDepth(form, element.depth);
        var object = {
          summary: element.summary,
          form: element.form
        };
        if (element.conspicuous) {
          object.form.conspicuous = 'true';
        }
        parent.push(object);
      } else {
        try {
          parent = lastAtDepth(form, element.depth + 1);
        } catch (e) {
          if (element.depth === 0) {
            parent = lastAtDepth(form, 0);
          } else {
            var line = element.line;
            throw new Error('Line ' + line + ' missing summary');
          }
        }
        pushContent(parent, element.content);
      }
      return form;
    }, {form: {content: []}})

    .form;
};

exports.toMarkup = (function() {
  var forObject = function(item) {
    var key = Object.keys(item)[0];
    var value = item[key];
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
        // TODO: Implement sub-form output
        throw new Error('Invalid form content');
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
