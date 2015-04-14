/* jshint node: true, mocha: true */
var expect = require('chai').expect;
var validate = require('commonform-validate');

var markup = require('..');

describe('stringify', function() {
  var EXAMPLE_MARKUP = 'Subject to the terms and conditions and in ' +
    'reliance upon the representations and warranties herein set ' +
    'forth, the <Company> agrees to sell to each <Underwriter>, ' +
    'and each <Underwriter> agrees, severally and not jointly, ' +
    'to purchase from the <Company>, at the [Purchase Price], ' +
    'the respective principal amounts of the <Securities> set ' +
    'forth opposite each respective <Underwriter>\'s name in ' +
    '{Underwriters Schedule}, except that, if {Price Schedule} ' +
    'provides for the sale of <Securities> pursuant to delayed ' +
    'delivery arrangements, the respective principal amounts of ' +
    '<Securities> to be purchased by the <Underwriters> shall be ' +
    'as set forth in {Underwriters Schedule}, less the respective ' +
    'amounts of <Contract Securities> determined as provided ' +
    'below. <Securities> to be purchased by the <Underwriters> ' +
    'are herein sometimes called the ""Underwriters\' Securities"" ' +
    'and <Securities> to be purchased pursuant to <Delayed ' +
    'Delivery Contracts> as hereinafter provided are herein called ' +
    '""Contract Securities"".';

  var EXAMPLE_PARSED = {
    content: [
      'Subject to the terms and conditions and in reliance upon ' +
      'the representations and warranties herein set forth, the ',
      {use: 'Company'},
      ' agrees to sell to each ',
      {use: 'Underwriter'},
      ', and each ',
      {use: 'Underwriter'},
      ' agrees, severally and not jointly, to purchase from the ',
      {use: 'Company'},
      ', at the ',
      {blank: 'Purchase Price'},
      ', the respective principal amounts of the ',
      {use: 'Securities'},
      ' set forth opposite each respective ',
      {use: 'Underwriter'},
      '\'s name in ',
      {reference: 'Underwriters Schedule'},
      ', except that, if ',
      {reference: 'Price Schedule'},
      ' provides for the sale of ',
      {use: 'Securities'},
      ' pursuant to delayed delivery arrangements, the respective ' +
      'principal amounts of ',
      {use: 'Securities'},
      ' to be purchased by the ',
      {use: 'Underwriters'},
      ' shall be as set forth in ',
      {reference: 'Underwriters Schedule'},
      ', less the respective amounts of ',
      {use: 'Contract Securities'},
      ' determined as provided below. ',
      {use: 'Securities'},
      ' to be purchased by the ',
      {use: 'Underwriters'},
      ' are herein sometimes called the ',
      {definition: 'Underwriters\' Securities'},
      ' and ',
      {use: 'Securities'},
      ' to be purchased pursuant to ',
      {use: 'Delayed Delivery Contracts'},
      ' as hereinafter provided are herein called ',
      {definition: 'Contract Securities'},
      '.']};

  describe('form markup', function() {
    describe('parses', function() {
      var tests = [
        {
          name: 'simple text',
          markup: 'This is a test',
          content: ['This is a test']},
        {
          name: 'term uses',
          markup: 'This <Agreement> is a test',
          content: ['This ', {use: 'Agreement'}, ' is a test']},
        {
          name: 'term definitions',
          markup: 'This ""Agreement"" is a test',
          content: ['This ', {definition: 'Agreement'}, ' is a test']},
        {
          name: 'cross references',
          markup: '{Indemnification} survives termination',
          content: [
            {reference: 'Indemnification'},
            ' survives termination']},
        {
          name: 'blanks',
          markup: '[Company] warrants',
          content: [{blank: 'Company'}, ' warrants']}];

      tests.forEach(function(test) {
        it(test.name, function() {
          var result = markup.parse(test.markup);
          expect(result)
            .to.eql({content: test.content});
          expect(validate.form(result))
            .to.equal(true);
        });
      });

      it('parses a real-world example', function() {
        var result = markup.parse(EXAMPLE_MARKUP);
        expect(result)
          .to.eql(EXAMPLE_PARSED);
        expect(validate.form(result))
          .to.equal(true);
      });
    });

    describe('outputs', function() {
      it('a real world example', function() {
        expect(validate.form(EXAMPLE_PARSED))
          .to.equal(true);
        expect(markup.stringify(EXAMPLE_PARSED))
          .to.eql(EXAMPLE_MARKUP);
      });

      it('throws an error for invalid content', function() {
        expect(function() {
          markup.stringify({
            content: [{invalid: 'input'}]});
        }).to.throw('Invalid form content');
      });

      it('outputs conspicuous forms with bangs', function() {
        expect(markup.stringify({
          conspicuous: 'yes',
          content: [
            {
              heading: 'A',
              form:{
                conspicuous: 'yes',
                content: ['test']}},
            {
              form:{
                content: ['test']}},
            {
              form:{
                conspicuous: 'yes',
                content: ['test']}},
            'continuing']
        })).to.eql([
          '!! ',
          'A !! test',
          '\\\\ test',
          '!! test',
          'continuing'
        ].join('\n\n'));
      });
    });
  });

  describe('nested sub-forms', function() {
    var form = {
      content: [
        {
          heading: 'First',
          form: {content: ['A']}},
        {
          heading: 'Second',
          form: {
            content: [{
              heading: 'Third',
              form: {content: ['A']}}]}}]};

    it('round trips', function() {
      var fromForm = markup.stringify(form);
      expect(markup.parse(fromForm))
        .to.eql(form);
    });
  });
});
