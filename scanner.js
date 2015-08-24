var Scanner = module.exports = function(input) {
  this.string = input;
  this.tail = input;
  this.offset = 0;
};

Scanner.prototype.eos = function() {
  return this.tail === '';
};

Scanner.prototype.scan = function(re) {
  var match = this.tail.match(re);
  if (match && match.index === 0) {
    var string = match[0];
    this.tail = this.tail.substring(string.length);
    this.offset += string.length;
    return match;
  }
  return '';
};

Scanner.prototype.scanUntil = function(re) {
  var match;
  var index = this.tail.search(re);
  switch (index) {
    case -1:
      match = this.tail;
      this.tail = '';
      break;
    case 0:
      match = '';
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
  }
  this.offset += match.length;
  return match;
};
