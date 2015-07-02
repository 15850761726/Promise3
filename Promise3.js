var Promise = (function() {
  function Promise(callback) {
    var self = this
    self.callbacks = []
    self.status = 'pending'

    var resolve = function(value) {
      if (self.status != 'pending') {
        return
      }
      self.status = 'resolved'
      self.data = value

      for (var i = 0; i < self.callbacks.length; i++) {
        self.callbacks[i].resolver(value)
      }
    }

    var reject = function(reason) {
      if (self.status != 'pending') {
        return
      }
      self.status = 'rejected'
      self.data = reason

      for (var i = 0; i < self.callbacks.length; i++) {
        self.callbacks[i].rejector(reason)
      }
    }

    setTimeout(function() {
      callback(resolve, reject)
    })
  }

  Promise.prototype.isPromise = true

  Promise.prototype.then = function(resolver, rejector) {
    var self = this;

    if (self.status == 'resolved') {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            var value = resolver(self.data)
            if(value.isPromise) {
              return value.then(resolve, reject)
            } else {
              return resolve(value)
            }
          } catch(e) {
            return reject(e)
          }
        })
      })
    }

    if (self.status == 'rejected') {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            var value = rejector(self.data)
            if (value.isPromise) {
              return value.then(resolve, reject)
            } else {
              return resolve(value)
            }
          } catch(e) {
            return reject(e)
          }
        })
      })
    }

    if (self.status == 'pending') {
      return new Promise(function(resolve, reject) {
        self.callbacks.push({
          resolver: function(value) {
            try {
              var value = resolver(value)
              if (value.isPromise) {
                return value.then(resolve, reject)
              } else {
                return resolve(value)
              }
            } catch(e) {
              return reject(e)
            }
          },
          rejector: function(reason) {
            try {
              var value = rejector(reason)
              if (value.isPromise) {
                return value.then(resolve, reject)
              } else {
                return resolve(value)
              }
            } catch(e) {
              return reject(e)
            }
          }
        })
      })
    }
  }

  Promise.prototype.done = function(onResolved) {
    return this.then(onResolved, null);
  };

  Promise.prototype.catch = Promise.prototype.fail = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.delay = function(duration) {
    return this.then(function(value) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve(value)
        }, duration)
      })
    }, function(reason) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject(reason)
        }, duration)
      })
    })
  }

  Promise.all = function(promises) {
    return new Promise(function(resolve, reject) {
      var resolvedCounter = 0;
      var rejectedCounter = 0;
      var promiseNum = promises.length;
      var resolvedValues = new Array(promiseNum);
      for (var i = 0; i < promiseNum; i++) {
        (function() {
          var index = i;
          promises[i].then(function(value) {
            resolvedCounter++;
            resolvedValues[index] = value;
            if (resolvedCounter == promiseNum) {
              resolve(resolvedValues);
            }
            return value;
          }, function(reason) {
            rejectedCounter++;
            return reason;
          });
        })();
      }
    });
  };

  Promise.race = function(promises) {
    return new Promise(function(resolve, reject) {
      for (var i = 0; i < promises.length; i++) {
        promises[i].then(function(value) {
          resolve(value);
          return value;
        });
      }
    });
  };

  Promise.resolve = function(value) {
    return new Promise(function(resolve) {
      resolve(value)
    })
  }

  Promise.reject = function(reason) {
    return new Promise(function(resolve, reject) {
      reject(reason)
    })
  }

  return Promise;
})()
