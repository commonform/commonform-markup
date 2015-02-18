/* jshint node: true, mocha: true */
var expect = require('chai').expect;
var markup = require('..');

describe('line parsing', function() {
  it('parses a simple sub-form', function() {
    var input = 'Warranties \\\\ <Vendor> warrants its <Services>';
    expect(markup.parse(input).toJS())
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
    var input = 'Warranties \\\\ See {Services}\n' +
      '  # This is a comment!';
    expect(markup.parse(input).toJS())
      .to.eql({
        content: [{
          summary: 'Warranties',
          form: {
            content: [
              'See ', {reference: 'Services'}
            ]
          }
        }]
      });
  });

  it('parses a sub-form without a summary', function() {
    var input = '\\\\ <Vendor> warrants its <Services>';
    expect(markup.parse(input).toJS())
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
      'will be performed <Competently>',
    ].join('\n');
    expect(markup.parse(input).toJS())
      .to.eql({
        content: [{
          summary: 'Warranties',
          form: {
            content: [
              {use: 'Vendor'}, ' warrants its ', {use: 'Services'},
              'will be performed ', {use: 'Competently'}
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
    expect(markup.parse(input).toJS())
      .to.eql({
        content: [
          {summary: 'Warranties', form: {content: ['First']}},
          {summary: 'Another', form: {content: ['Second']}}
        ]
      });
  });

  it('throws an error for relvative over-indentation', function() {
    expect(function() {
      markup.parse([
        'First',
        '        Over-indented'
      ].join('\n'));
    }).to.throw('Line 2 indented too far');
  });

  it('throws an error for over-indentation of line 1', function() {
    expect(function() {
      markup.parse([
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
      markup.parse(input);
    }).to.throw('Line 2 missing summary');
  });

  it('nested sub-forms', function() {
    var input = [
      'First \\\\ Level 1',
      '    Second \\\\ Level 2'
    ].join('\n');
    expect(markup.parse(input).toJS())
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

  it('text only', function() {
    var input = [
      'Text content',
      'continues on second line and <Uses>'
    ].join('\n');
    expect(markup.parse(input).toJS())
      .to.eql({
        content: [
          'Text content continues on second line and ',
          {use: 'Uses'}
        ]
      });
  });

  it('conspicuous provisions', function() {
    var input = [
      'Limitation of Liability !! This is important'
    ].join('\n');
    expect(markup.parse(input).toJS())
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

  it('nesting levels', function() {
    var input = [
      'Parent \\\\ Text',
      '    SubForm \\\\ Text',
      'Paragraph <Term>',
    ].join('\n');
    expect(markup.parse(input).toJS())
      .to.eql({
        content: [{
          summary: 'Parent',
          form: {
            content: [
              'Text',
              {
                summary: 'SubForm',
                form: {
                  content: ['Text']
                }
              },
              'Paragraph ',
              {use: 'Term'}
            ]
          }
        }]
      });
  });

  it('correctly concatenates paragraphs', function() {
    var input = [
      'P \\\\ A',
      '    S \\\\ B',
      'C{D}E'
    ].join('\n');
    expect(markup.parse(input).toJS())
      .to.eql({
        content: [
          {
            summary: 'P',
            form: {
              content: [
                'A',
                {
                  summary: 'S',
                  form: {
                    content: ['B']
                  }
                },
                'C',
                {reference: 'D'},
                'E'
              ]
            }
          }
        ]
      });
  });
});
