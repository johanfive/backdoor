![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/johanfive/backdoor)
[![GitHub issues](https://img.shields.io/github/issues/johanfive/backdoor)](https://github.com/johanfive/backdoor/issues)
![GitHub top language](https://img.shields.io/github/languages/top/johanfive/backdoor)

Visit the v2 [demo site here](https://johanfive.github.io/backdoordemo/)
(v3 update to come)


# Backdoor 🚪

Implement `cheat codes` in your apps.

With 1 input, control a `promise`'s *pending time*, whether it *resolves* or *rejects*, and the data it returns.

It's especially convenient for working on functions that are lower in the promise chain.

Implementing this yourself on the fly is not hard work, but it can get messy and time consuming.
`Backdoor` offers a plug-and-play approach that preserves the readability of your code.

#### Example:
You're working on a function called "doMoreAsyncThings" which relies on the output of a "createUser" call:
```js
const createUser = (formData) => axios.post('/user', formData);

createUser(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```
You don't want *createUser* to make an http request to the */user* endpoint every single time you test the changes you make to *doMoreAsyncThings*.

At the same time, it'd be nice if you could maintain your ability to do so without having to update the code yet again...

This is possible by simply adding a `backdoor` to "createUser" (without changing "createUser" itself):
```js
const backdoor = require('backdoorthen');

// unchanged
const createUser = (formData) => axios.post('/user', formData);

const withBackdoor = backdoor({
  // the variable influencing the outcome
  input: formData.firstName,
  // mocked data returned on success
  resolvedValue: { userName: 'pparker' },
  // mocked data returned on error
  rejectedValue: { error: 'kaboom', message: 'oh no' },
  // object to override the library's defaults
  config: { /* omitted for brevity */ }
});

withBackdoor(createUser)(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```

This allows you to control the behaviour of `createUser` just by typing different values in the
`firstName` input field of your form.
If you type "Peter", *createUser* will make a request to the server and actually create a user with
"Peter" as a first name.
If you type "backdoor", *createUser* will not be called, and `doMoreAsyncThings` will fire 5s later
with `{ userName: 'pparker' }` as its argument.

Note:
```js
withBackdoor(createUser)(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```
is *so close* to what your code would look like if you hadn't backdoored your promise. This makes it very easy to remove `backdoor` once you're ready for your final commit:
```js
createUser(formData)
  .then(doMoreAsyncThings)
  .catch(handleError);
```

## params

`input` | `resolvedValue` | `rejectedValue` | `config`

<details>
  <summary>input</summary>

  `input` required

  This is the variable backdoor evaluates to decide the outcome.

  By default a string is expected, and only the following values are recognized as meaningful triggers:
  ```
  INPUT                    PROMISE
  ___________________________________________
  "backdoor"            -> resolves slow (5s)
  "backdoor-fast"       -> resolves fast (1s)
  "backdoor-error"      -> rejects slow  (5s)
  "backdoor-error-fast" -> rejects fast  (1s)
  ```
  If your use case needs to rely on different values or different types entirely,
  you must configure an  `assessor` in `config`.
</details>

<details>
  <summary>resolvedValue</summary>

  `resolvedValue`
  This is anything you want the mocked promise to return when it resolves (settles with success).
</details>

<details>
  <summary>rejectedValue</summary>

  `rejectedValue` 
  This is anything you want the mocked promise to return when it rejects (settles with error).
</details>

### params.config

```js
const backdoor = require('backdoorthen');

const withBackdoor = backdoor({
  // ...params,
  config: { // optional
    fast, // delay in ms before the mocked promise settles
    slow, // delay in ms before the mocked promise settles
    separator, // string character separating keywords in the input (eg: "-" in "backdoor-fast")
    assessor, // function assessing the input to determine whether real or mocked data should be returned
    enabledInProd // boolean driving whether backdoor should continue to work in production (false by default)
  }
});

withBackdoor(thenable)().then().catch();
```

`fast` | `slow` | `separator` | `assessor` | `enabledInProd` (non-boolean values ignored)

```
Name           Required  Type      Default  Notes
________________________________________________________
fast           no        integer   1000     ms
slow           no        integer   5000     ms
separator      no        string    -
assessor       no        function
enabledInProd  no        boolean   false    boolean only
```

<details>
  <summary>fast</summary>

  `fast` default: 1000

  Delay in ms before the mocked promise settles (0 is recognized)
</details>

<details>
  <summary>slow</summary>

  `slow` default: 5000

  Delay in ms before the mocked promise settles (0 is recognized)
</details>

<details>
  <summary>separator</summary>

  `separator` default: "-"

  String character separating the keywords `backdoor` looks for.

  Eg: When the input is "backdoor-error-fast",
  by default backdoor recognizes the "backdoor", "error" and "fast" keywords
  because they're separated by a "-" character.
</details>

<details>
  <summary>assessor</summary>

  `assessor`
  If your use-case does not rely on strings or if you'd rather implement your own logic,
  you can define an `assessor` function that must have the following signature:
  ```js
  const assessor = (input, separator) => ({
    isBackdoor: boolean,
    doResolve: boolean,
    isFast: boolean
  });
  ```
  which you would then pass as a property of the config object:
  ```js
  const withBackdoor = backdoor({
    // ...omitted for brevity,
    config: { assessor: yourTailoredAssessor }
  });
  withBackdoor(thenable)().then(...);
  ```
  Example:
  ```js
  const assessor = digit => ({
    isBackdoor: digit < 5,
    doResolve: digit <= 2,
    isFast: digit === 2 || digit === 4
  });
  ```
`isBackdoor`
+ **true**:  skip the actual promise and return mocked data
+ **false**: return the actual promise

`doResolve`
+ **true**:  the mocked promise will resolve with the mocked response
+ **false**: the mocked promise will reject with the mocked error

`isFast`
+ **true**:  wait 1000ms by default (override with config.fast)
+ **false**: wait 5000ms by default (override with config.slow)
</details>

<details>
  <summary>enabledInProd</summary>

  `enabledInProd` default: `false`

  When set to `true`, backdoor will continue to work in a `production` environment.

  When `false` and in a `production` environment,
  the actual thenable is always executed regardless of the input value.
  
  Only the boolean `true` is valid. Anything else is interpreted as `false`.
</details>

## Installation
```sh
npm i -D backdoorthen
# yes, the name "backdoor" was already taken...
```
## Usage
```js
const backdoor = require('backdoorthen');
```
or
```js
import backdoor from 'backdoorthen';
```

`(!)` Note:
+ For readability's sake this readme sometimes uses the words `promise` and `thenable` interchangeably.
+ For accuracy's sake: this readme uses "promise" as a shortcut for `function that returns a promise`.
