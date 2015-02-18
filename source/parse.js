var Immutable = require('immutable');

var constants = require('./constants');
var lastAtDepth = require('./last-at-depth');
var parseContent = require('./content');

var ALL_SPACE = /^\s*$/;
var COMMENT = /^\s*#.*$/;
var CONTIGUOUS_SPACE = / {2,}/g;
var LINE_RE = /^( *)(.+)$/;
var SUMMARY_SEP = /(\\\\|\!\!)/;

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
        return tokens.push(Immutable.Map({
          line: number,
          depth: depth,
          string: string
        }));
      }
    }, Immutable.List())

    // Detect summaries and parse markup.
    .map(function(element) {
      var string = element.get('string');
      return element.withMutations(function(element) {
        element.delete('string');
        var match = SUMMARY_SEP.exec(string);
        if (match) {
          var summary = string.slice(0, match.index);
          var content = string.slice(match.index + match[1].length);
          if (match[1] === '!!') {
            element.set('conspicuous', 'true');
          }
          summary = summary.trim();
          if (summary.trim().length > 0) {
            element.set('summary', summary);
          }
          element.set('form', parseContent(content.trim()));
        } else {
          element.set('content', parseContent(string).get('content'));
        }
      });
    })

    // Check indentation.
    .map(function(element, i, array) {
      var depth = element.get('depth');
      if (i === 0) {
        if (depth > 0) {
          throw new Error('Line 1 indented too far');
        }
      } else {
        var lastDepth = array.get(i - 1).get('depth');
        if (depth > lastDepth && depth - lastDepth > 1) {
          throw new Error(
            'Line ' + element.get('line') + ' indented too far'
          );
        }
      }
      return element;
    })

    // Build form objects
    .reduce(function(form, element) {
      var contentKeyArray;
      var depth = element.get('depth');
      var newValue;
      var parentKeyArray;
      if (element.has('form')) {
        parentKeyArray = lastAtDepth(form, depth);
        contentKeyArray = parentKeyArray.push('content');
        // Create a new form object without parser-related metadata.
        newValue = Immutable.Map({
          form: element.get('form')
        }).withMutations(function(object) {
          if (element.has('summary')) {
            object.set('summary', element.get('summary'));
          }
          if (element.has('conspicuous')) {
            object.setIn(['form', 'conspicuous'], 'true');
          }
        });
        return form.updateIn(contentKeyArray, function(content) {
          return content.push(newValue);
        });
      } else {
        newValue = element.get('content');
        try {
          parentKeyArray = lastAtDepth(form, depth + 1);
        } catch (e) {
          if (depth === 0) {
            parentKeyArray = lastAtDepth(form, 0);
          } else {
            var line = element.get('line');
            throw new Error('Line ' + line + ' missing summary');
          }
        }
        contentKeyArray = parentKeyArray.push('content');
        return form.updateIn(contentKeyArray, function(content) {
          var last = content.last();
          var head = newValue.first();
          // If the last existing content element is a string and the
          // next content element to be added is a string, concatenate
          // the strings.
          if (
            last &&
            typeof head === 'string' &&
            typeof last === 'string'
          ) {
            return content.withMutations(function(content) {
              var length = content.count();
              content.set(length - 1, last + ' ' + newValue.first());
              content.concat(newValue.slice(1));
            });
          // Otherwise, concatenate the lists.
          } else {
            return content.concat(newValue);
          }
        });
      }
    }, Immutable.fromJS({content: []}));
};
