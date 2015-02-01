/* jshint node: true, mocha: true */
var expect = require('chai').expect;
var semver = require('semver');
var library = require('..');

var commonjs = require('../package.json');
var bower = require('../bower.json');

var itIsTheSame = function(property) {
  it(property + ' is the same for NPM and Bower', function() {
    expect(commonjs[property]).to.eql(bower[property]);
  });
};

var itMatchesModule = function(property) {
  it(property + ' is the same for NPM on export', function() {
    expect(library[property]).to.eql(commonjs[property]);
  });
};

describe('Packaging', function() {
  it('version is a valid semantic version', function() {
    expect(semver.valid(commonjs.version))
      .to.not.eql(null);
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
