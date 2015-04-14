var constants = require('./constants');
var get = require('keyarray-get');
var lastAtDepth = require('./last-at-depth');
var parseContent = require('./content');

var ALL_SPACE = /^\s*$/;
var COMMENT = /^\s*#.*$/;
var CONTIGUOUS_SPACE = / {2,}/g;
var LINE_RE = /^( *)(.+)$/;
var HEADING_SEP = /(\\\\|\!\!)/;

module.exports = function(input) {
  return input.split('\n')

    // Tokenize lines with indentation attributes, discarding blanks.
    .reduce(function(tokens, line, number) {
      number = number + 1;
      if (ALL_SPACE.test(line) || COMMENT.test(line)) {
        return tokens;
      } else {
        var match = LINE_RE.exec(line);
        var depth = Math.floor(match[1].length / constants.TAB_WIDTH);
        var string = match[2].replace(CONTIGUOUS_SPACE, ' ');
        tokens.push({
          line: number,
          depth: depth,
          string: string
        });
        return tokens;
      }
    }, [])

    // Detect summaries and parse markup.
    .map(function(element) {
      var string = element.string;
      delete element.string;
      var match = HEADING_SEP.exec(string);
      if (match) {
        var heading = string.slice(0, match.index);
        var content = string.slice(match.index + match[1].length);
        if (match[1] === '!!') {
          element.conspicuous = 'yes';
        }
        heading = heading.trim();
        if (heading.trim().length > 0) {
          element.heading = heading;
        }
        element.form = parseContent(content.trim());
      } else {
        element.content = parseContent(string).content;
      }
      return element;
    })

    // Check indentation.
    .map(function(element, i, array) {
      var depth = element.depth;
      if (i === 0) {
        if (depth > 0) {
          throw new Error('Line 1 indented too far');
        }
      } else {
        var lastDepth = array[i - 1].depth;
        if (depth > lastDepth && depth - lastDepth > 1) {
          throw new Error(
            'Line ' + element.line + ' indented too far'
          );
        }
      }
      return element;
    })

    // Build form objects
    .reduce(function(form, element) {
      var contentKeyArray;
      var depth = element.depth;
      var newValue;
      var parentKeyArray;
      if (element.hasOwnProperty('form')) {
        parentKeyArray = lastAtDepth(form, depth);
        contentKeyArray = parentKeyArray.concat(['content']);
        // Create a new form object without parser-related metadata.
        newValue = {
          form: element.form
        };
        if (element.hasOwnProperty('heading')) {
          newValue.heading = element.heading;
        }
        if (element.hasOwnProperty('conspicuous')) {
          newValue.form.conspicuous = 'yes';
        }
        get(form, contentKeyArray).push(newValue);
        return form;
      } else {
        newValue = element.content;
        try {
          parentKeyArray = lastAtDepth(form, depth + 1);
        } catch (e) {
          if (depth === 0) {
            parentKeyArray = lastAtDepth(form, 0);
          } else {
            var line = element.line;
            throw new Error('Line ' + line + ' missing heading');
          }
        }
        contentKeyArray = parentKeyArray.concat(['content']);
        var content = get(form, contentKeyArray);
        var last = content[content.length - 1];
        var head = newValue[0];
        var length = content.length;
        // If the last existing content element is a string and the
        // next content element to be added is a string, concatenate
        // the strings.
        if (
          length > 0 &&
          typeof head === 'string' &&
          typeof last === 'string'
        ) {
          content[length - 1] = last + ' ' + head;
          newValue.slice(1).forEach(function(element) {
            content.push(element);
          });
        // Otherwise, concatenate the lists.
        } else {
          newValue.forEach(function(element) {
            content.push(element);
          });
        }
        return form;
      }
    }, {content: []});
};
