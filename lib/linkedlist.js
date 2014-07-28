function LinkedList() {
  this.length = 0;
  this.head = null;
  this.tail = null;
}

LinkedList.prototype.addToHead = function(e) {
  var newNode = {
    "element": e,
    "next": null,
    "prev": null
  };
  if (this.length === 0) {
    this.head = newNode;
    this.tail = this.head;
  } else {
    this.head.prev = newNode;
    newNode.next = this.head;
    this.head = newNode;
  }

  this.length++;
};

LinkedList.prototype.removeHead = function() {
  if (this.length > 0) {
    var head = this.head.element;
    this.head = this.head.next;
    this.length--;
    return head;
  } else {
    return null;
  }
};

LinkedList.prototype.addToTail = function(e) {
  if (this.length === 0) {
    this.addToHead(e);
    return;
  }

  var newNode = {
    "element": e,
    "next": null,
    "prev": this.tail
  };
  this.tail.next = newNode;
  this.tail = newNode;
  this.length++;
};

LinkedList.prototype.removeTail = function() {
  if (this.length > 0) {
    var tail = this.tail.element;
    this.tail = this.tail.prev;
    this.length--;
    return tail;
  } else {
    return null;
  }
};

LinkedList.prototype.get = function(index) {
  if (index >= this.length || index < 0) {
    return null;
  }

  var e = this.head;
  for (var i = 0; i < index; i++) {
    e = e.next;
  }

  return e.element;
};

LinkedList.prototype.getLength = function() {
  return this.length;
};

function findKey(list, key) {
  var currentNode = list.get(0),
      index = 0;
      
  while (index < list.getLength()) {
    if (currentNode[key] !== undefined) {
      return {
        "val": currentNode[key],
        "index": index
      };
    }

    currentNode = list.get(++index);
  }

  return null;
}

function addKey(list, key, val, index) {
  if (index < 0 || index >= list.getLength()) {
    return false;
  }

  var node = list.get(index);
  if (node !== null) {
    node[key] = val;
    return true;
  }

  return false;
}

module.exports = LinkedList;
module.exports.findKey = findKey;
module.exports.addKey = addKey;
