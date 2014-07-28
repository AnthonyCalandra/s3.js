function TokenQueue() {
  this.list = new LinkedList();
  this.length = 0;
}

TokenQueue.prototype.enqueue = function(e) {
  this.list.addToTail(e);
  this.length++;
};

TokenQueue.prototype.peek = function() {
  if (this.length > 0) {
    return this.list.get(0);
  } else {
    return null;
  }
};

TokenQueue.prototype.dequeue = function() {
  if (this.length > 0) {
    this.length--;
    return this.list.removeHead();
  } else {
    return null;
  }
};

TokenQueue.prototype.isEmpty = function() {
  return this.length === 0;
};

TokenQueue.prototype.size = function() {
  return this.length;
};

var LinkedList = require("./linkedlist.js");
module.exports = TokenQueue;
