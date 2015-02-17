/* jshint mocha: true */
var Immutable = require('immutable');
var expect = require('chai').expect;
var lastAtDepth = require('../source/last-at-depth');

describe('lastAtDepth', function() {
  it('is a function', function() {
    expect(lastAtDepth)
      .to.be.a('function');
  });

  it('finds the last sub-form in a content array', function() {
    expect(lastAtDepth(Immutable.fromJS({
      content: [
        {form: {content: ['A']}},
        'Some text',
        {form: {content: ['B']}}
      ]
    }), 1).toJS())
      .to.eql(['content', 2, 'form']);
  });
});
