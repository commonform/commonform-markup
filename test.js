var markup = require('./')

require('tape').test('commonform-markup-tests', function(tape) {
  require('commonform-markup-tests')
    .forEach(function(test, number) {
      if (test.error) {
        tape.throws(
          function() { markup.parse(test.markup) },
          test.error,
          'No. ' + number + ': ' + test.comment) }
      else {
        tape.deepEqual(
          markup.parse(test.markup),
          test.form,
          'No. ' + number + ': ' + test.comment)
        tape.deepEqual(
          markup.parse(markup.stringify(markup.parse(test.markup))),
          test.form,
          'No. ' + number + ': ' + test.comment) } })
  tape.end() })
