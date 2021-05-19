/**
 * Assess the value of an input variable to determine whether
 * a given thenable should be called or bypassed in favor of returning mocked data instead
 * @param {Object} params The object providing the mocked data, the input to evaluate and a thenable
 * @returns A function that returns promise
 */
function backdoor(params) {
  var fast = 1000;
  var slow = 5000;
  var separator = '-';
  var assess = assessor;
  if (params.config) {
    if (params.config.fast) { fast = params.config.fast; }
    if (params.config.slow) { slow = params.config.slow; }
    if (params.config.separator) { separator = params.config.separator; }
    if (params.config.assessor) { assess = params.config.assessor; }
  }
  var decision = assess(params.input, separator);
  if (process.env.NODE_ENV !== 'production' && decision.isBackdoor) {
    var delay = decision.isFast ? fast : slow;
    return function() {
      return new Promise(function(resolve, reject) {
        return setTimeout(function() {
          return decision.doResolve ? resolve(params.resolvedValue) : reject(params.rejectedValue);
        }, delay);
      });
    };
  }
  return params.actualThenable;
}

function assessor(input, separator) {
  var backdoorChunks = input.toLowerCase().split(separator);
  return {
    isBackdoor: backdoorChunks[0] === 'backdoor',
    doResolve: backdoorChunks[1] === undefined || backdoorChunks[1] === 'fast',
    isFast: backdoorChunks[1] === 'fast' || backdoorChunks[2] === 'fast'
  };
}

module.exports = backdoor;
