/* jshint node: true, mocha: true */
var expect = require('chai').expect;
var markup = require('..');

describe('line parsing', function() {
  it('parses a simple sub-form', function() {
    var input = 'Warranties \\\\ <Vendor> warrants its <Services>';
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          summary: 'Warranties',
          form: {
            content: [
              {use: 'Vendor'}, ' warrants its ', {use: 'Services'}
            ]
          }
        }]
      });
  });

  it('ignores comment lines', function() {
    var input = 'Warranties \\\\ <Vendor> warrants its <Services>\n' +
      '  # This is a comment!';
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          summary: 'Warranties',
          form: {
            content: [
              {use: 'Vendor'}, ' warrants its ', {use: 'Services'}
            ]
          }
        }]
      });
  });

  it('parses a sub-form without a summary', function() {
    var input = '\\\\ <Vendor> warrants its <Services>';
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          form: {
            content: [
              {use: 'Vendor'}, ' warrants its ', {use: 'Services'}
            ]
          }
        }]
      });
  });

  it('concatenates subsequent content', function() {
    var input = [
      'Warranties \\\\ <Vendor> warrants its <Services>',
      'will be performed',
    ].join('\n');
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          summary: 'Warranties',
          form: {
            content: [
              {use: 'Vendor'}, ' warrants its ', {use: 'Services'},
              'will be performed'
            ]
          }
        }]
      });
  });

  it('identifies contiguous sub-forms', function() {
    var input = [
      'Warranties \\\\ First',
      'Another \\\\ Second'
    ].join('\n');
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [
          {summary: 'Warranties', form: {content: ['First']}},
          {summary: 'Another', form: {content: ['Second']}}
        ]
      });
  });

  it('throws an error for relvative over-indentation', function() {
    expect(function() {
      markup.parseLines([
        'First',
        '        Over-indented'
      ].join('\n'));
    }).to.throw('Line 2 indented too far');
  });

  it('throws an error for over-indentation of line 1', function() {
    expect(function() {
      markup.parseLines([
        '    First',
        'Second'
      ].join('\n'));
    }).to.throw('Line 1 indented too far');
  });

  it('throws an error re sub-form w/o summary', function() {
    var input = [
      'Summary \\\\ Text content',
      '    continues on second line'
    ].join('\n');
    expect(function() {
      markup.parseLines(input);
    }).to.throw('Line 2 missing summary');
  });

  it('nested sub-forms', function() {
    var input = [
      'First \\\\ Level 1',
      '    Second \\\\ Level 2'
    ].join('\n');
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          summary: 'First',
          form: {
            content: [
              'Level 1',
              {summary: 'Second', form: {content: ['Level 2']}}
            ]
          }
        }]
      });
  });

  it('concatenates strings split across lines', function() {
    var input = [
      'Summary \\\\ Text content',
      'continues on second line'
    ].join('\n');
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          summary: 'Summary',
          form: {content: ['Text content continues on second line']}
        }]
      });
  });

  it('text only', function() {
    var input = [
      'Text content',
      'continues on second line'
    ].join('\n');
    expect(markup.parseLines(input).toJS())
      .to.eql({content: ['Text content continues on second line']});
  });

  it('conspicuous provisions', function() {
    var input = [
      'Limitation of Liability !! This is important'
    ].join('\n');
    expect(markup.parseLines(input).toJS())
      .to.eql({
        content: [{
          summary: 'Limitation of Liability',
          form: {
            conspicuous: 'true',
            content: ['This is important']
          }
        }]
      });
  });
});
