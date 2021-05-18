var FAST = 1000;
var SLOW = 5000;
var SEPARATOR = '-';

function assess(input, separator) {
  var backdoorChunks = input.split(separator);
  return {
    isBackdoor: backdoorChunks[0] === 'backdoor',
    doResolve: backdoorChunks[1] === undefined || backdoorChunks[1] === 'fast',
    isFast: backdoorChunks[1] === 'fast' || backdoorChunks[2] === 'fast'
  };
}

function backdoor(params, config) {
  var fast = (config && config.fast) ? config.fast : FAST;
  var slow = (config && config.slow) ? config.slow : SLOW;
  var separator = (config && config.separator) ? config.separator : SEPARATOR;

  var decision = params.assess ? params.assess(params.input) : assess(params.input, separator);

  if (process.env.NODE_ENV !== 'production' && decision.isBackdoor) {
    var delay = decision.isFast ? fast : slow;
    return new Promise(function(resolve, reject) {
      return setTimeout(function() {
        return decision.doResolve ? resolve(params.resolvedRes) : reject(params.rejectedRes);
      }, delay);
    })
  }

  return params.actualPromise();
}

module.exports = backdoor;
