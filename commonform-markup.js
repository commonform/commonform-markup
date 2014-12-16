// commonform-markup.js
// ====================
// Plain-text markup for Common Form forms
//
// License and other information available at:
// https://github.com/commonform/commonform-markup.js
(function() {
  'use strict';

  var moduleName = 'commonform-markup';

  var commonform = function() {
    var exports = {
      name: moduleName,
      version: '0.0.1'
    };

    // Utility Functions and Data
    // --------------------------

    var isString = function(x) {
      return typeof x === 'string';
    };

    var USE = 'use';
    var DEFINITION = 'definition';
    var REFERENCE = 'reference';
    var INSERT = 'insert';

    var SUBJECT_OBJECT_MAP = {};
    SUBJECT_OBJECT_MAP[USE] = 'term';
    SUBJECT_OBJECT_MAP[DEFINITION] = 'term';
    SUBJECT_OBJECT_MAP[REFERENCE] = 'summary';
    SUBJECT_OBJECT_MAP[INSERT] = 'field';

    // ### Regular expression string scanner
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

    // API
    // ---

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
          '"': DEFINITION,
          '<': USE,
          '{': REFERENCE,
          '[': INSERT
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
        return { content: content };
      };
    })();

    exports.toMarkup = (function() {
      var forObject = function(item) {
        var key = Object.keys(item)[0];
        var value = item[key];
        switch (key) {
          case USE: {
            return '<' + value + '>';
          } case DEFINITION: {
            return '""' + value + '""';
          } case INSERT: {
            return '[' + value + ']';
          } case REFERENCE: {
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

    return exports;
  };

  // Universal Module Definition
  // ---------------------------

  // Export for AMD, Node.js, or if all else fails, to a browser global.

  /* globals define, module */
  /* istanbul ignore next */
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(moduleName, [], factory());
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root[moduleName] = factory();
    }
  })(this, commonform);
})();
