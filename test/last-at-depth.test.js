/* jshint mocha: true */
var expect = require('chai').expect;
var lastAtDepth = require('../source/last-at-depth');

describe('lastAtDepth', function() {
  it('is a function', function() {
    expect(lastAtDepth)
      .to.be.a('function');
  });

  it('finds the last sub-form in a content array', function() {
    expect(
      lastAtDepth({
        content: [
          {form: {content: ['A']}},
          'Some text',
          {form: {content: ['B']}}
        ]
      }, 1)
    ).to.eql(['content', 2, 'form']);
  });
});
