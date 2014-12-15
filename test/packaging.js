/* jshint node: true */
/* globals describe, it */
(function() {
  'use strict';

  var library = require('../');

  var semver = require('semver');

  var commonjs = require('../package.json');
  var bower = require('../bower.json');

  var itIsTheSame = function(property) {
    it(property + ' is the same for NPM and Bower', function() {
      commonjs[property].should.eql(bower[property]);
    });
  };

  var itMatchesModule = function(property) {
    it(property + ' is the same for NPM on export', function() {
      library[property].should.eql(commonjs[property]);
    });
  };

  describe('Packaging', function() {
    it('version is a valid semantic version', function() {
      semver.valid(commonjs.version).should.not.equal(null);
    });

    [
      'author',
      'description',
      'homepage',
      'keywords',
      'license',
      'name',
      'repository',
      'version'
    ].forEach(function(property) {
      itIsTheSame(property);
    });

    itMatchesModule('version');

    itMatchesModule('name');
  });
})();
