# Backdoor

Backdoor enables your code to either execute a promise, or bypass it entirely and return mocked data based on a given input value.

## Example
Say you're working on this piece of code, and you've already refined your `createUser` promise to perfection.
```js
const formData = {
  firstName: 'Bob',
  familyName: 'Loblaw'
};
createUser(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```
Now your focus is on `doMoreAsyncThings`, you know you're going to have to run that one a few times before you get it right, and you don't want to actually create a new user every time.
Still, you've got a demo scheduled with your PM tomorrow, and you want to be able to show that `createUser` actually works.

While switching back and forth between different feature branches is an option, it's kinda nice if you can avoid it.

`Backdoor` allows you to easily say: "If the firstName is 'Bob', don't actually create a Bob user and just return a hardcoded `{ username: bobLoblaw }` object. Anything else, actually do create a user".

Here's how it'd look like:
```js
const params = {
  actualPromise: () => createUser(formData),
  input: firstName,
  resolvedRes: { userName: 'bobLoblaw' },
  rejectedRes: { error: 'kaboom' }
};
backdoor(params)
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
Although flexible, `backdoor` is built with input strings in mind.
```
INPUT                    PROMISE
___________________________________________
"backdoor"            -> resolves slow (5s)
"backdoor-fast"       -> resolves fast (1s)
"backdoor-error"      -> rejects slow  (5s)
"backdoor-error-fast" -> rejects fast  (1s)
```
## Override logic
The 2nd argument of `backdoor` is a `config` object.

You can control the `delay` it takes the promise to return the mocked data via the `fast` and the `slow` properties:
```js
const config = {
  fast: 800, // ms
  slow: 8000, // ms
};
backdoor(params, config).then(...);
```
If you'd rather type `backdoor+fast` instead of `backdoor-fast` to make the fake promise resolve quickly, you can define the `separator` character like so:
```js
const config = { separator: '+' };
backdoor(params, config).then(...);
```
And finally, if your use case does not rely on strings or if you'd rather implement you're own logic, you can define an `assessor` function that must have the following signature:
```js
const assess = input => ({
  isBackdoor: boolean,
  doResolve: boolean,
  isFast: boolean
});
```
which you would then pass as a property of the params object:
```js
const params = {
  // ...omitted for brevity,
  assess
};
backdoor(params).then(...);
```

`isBackdoor`:
+ **true**: skip the actual promise and return mocked data
+ **false**: return the actual promise and skip the mocked data

`doResolve`:
+ **true**: return a mocked response/result
+ **false**: return a mocked error

`isFast`: wait x ms before fulfilling the promise
+ **true**: wait 5000ms by default
+ **false**: wait 1000ms by default