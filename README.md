# Backdoor 🚪 [![Try backdoorthen on RunKit](https://badge.runkitcdn.com/backdoorthen.svg)](https://npm.runkit.com/backdoorthen)

Promises to make working with `Promises` great again 😱
...by dynamically choosing whether a function that returns a promise should actually be called,
or bypassed in favor of returning mocked data.

It's especially convenient for working on functions that are lower in the promise chain.

## Example
Say you're working on this piece of code:
```js
const formData = {
  firstName: 'Bob',
  familyName: 'Loblaw'
};
createUser(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```
You've already refined your `createUser` promise to perfection,
now your focus is on `doMoreAsyncThings`.

You know you'll have to run that one a few times before getting it right, and you don't want to actually create a new user every time you do.

Still, you have a demo scheduled with your PM tomorrow, and you want to be able to show that `createUser` actually works.

While switching back and forth between different feature branches is an option, it's kinda nice if you can avoid it.

`Backdoor` allows you to easily say: "If the firstName is 'backdoor', don't actually create a user named 'backdoor' and just return a hardcoded `{ username: bobLoblaw }` object. Anything else, actually do create a user with the input data".

Here's how it could look like:
```js
const createUserWithBackdoor = backdoor({
  actualThenable: createUser,
  input: formData.firstName,
  resolvedValue: { userName: 'bobLoblaw' },
  rejectedValue: { error: 'kaboom' }
});

createUserWithBackdoor()
  .then(doMoreAsyncThings)
  .catch(handleError);
```

## Installation
```sh
npm i -D backdoorthen
```
## Usage
```js
const backdoor = require('backdoorthen');
```
or
```js
import backdoor from 'backdoorthen';
```
## Default behaviour
Although flexible, `backdoor` is built with `string` inputs in mind.
```
INPUT                    PROMISE
___________________________________________
"backdoor"            -> resolves slow (5s)
"backdoor-fast"       -> resolves fast (1s)
"backdoor-error"      -> rejects slow  (5s)
"backdoor-error-fast" -> rejects fast  (1s)
```
## Override logic
`backdoor`'s params object accepts an object on its `config` key.

You can control the `delay` it takes the promise to return the mocked data via the `config.fast` and the `config.slow` properties:
```js
const backdooredProm = backdoor({
  // ...omitted for brevity,
  config: {
    fast: 800, // ms
    slow: 8000, // ms
  }
});
backdooredProm().then(...);
```
If you'd rather type `backdoor+fast` instead of `backdoor-fast` to make the fake promise resolve quickly, you can define the `separator` character like so:
```js
const backdooredProm = backdoor({
  // ...omitted for brevity,
  config: { separator: '+' }
});
backdooredProm().then(...);
```
And finally, if your use-case does not rely on strings or if you'd rather implement your own logic, you can define an `assessor` function that must have the following signature:
```js
const assessor = input => ({
  isBackdoor: boolean,
  doResolve: boolean,
  isFast: boolean
});
```
which you would then pass as a property of the config object:
```js
const backdooredProm = backdoor({
  // ...omitted for brevity,
  config: { assessor: yourTailoredAssessor }
});
backdooredProm().then(...);
```

`isBackdoor`:
+ **true**:  skip the actual promise and return mocked data
+ **false**: return the actual promise

`doResolve`:
+ **true**:  the fake promise will resolve with the mocked response/result
+ **false**: the fake promise will reject with the mocked error

`isFast`: wait x ms before fulfilling the promise
+ **true**:  wait 5000ms by default (override with config.fast)
+ **false**: wait 1000ms by default (override with config.slow)

`(!)` Note:
+ For readability's sake this readme uses the words `promise` and `thenable` interchangeably.
+ For accuracy's sake: promise here really is `a function that returns a promise`.

## Recommended use
Create a `withBackdoor` function that takes the original thenable as its argument:
```js
const withBackdoor = thenable => backdoor({
  actualThenable: thenable,
  input: formData.firstName,
  resolvedValue: { userName: 'bobLoblaw' },
  rejectedValue: { error: 'kaboom' }
});
```
This allows you to do:
```js
withBackdoor(createUser)(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```
which is *so close* to what your code would look like if you hadn't backdoored your promise.

That makes it very easy to remove backdoor once you're ready for your final commit:
```js
createUser(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```

### Try it live, no need to commit 😉
Click that **`>_ Try on RunKit`** button 👉