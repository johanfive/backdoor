const backdoor = require("backdoorthen");

// On form submit
const formData = { firstName: 'Peter', lastName: 'Parker' };

// Send first & last name payload, backend creates user then responds with username
const createUser = ({ firstName, lastName }) => Promise.resolve({
  userName: `${firstName.charAt(0)}${lastName}`.toLowerCase()
});

// Function you're actively working on relies on the backend's response
const apiResponseHandler = apiResponse => console.log(apiResponse.userName);

// ...and you don't want to actually create a real user everytime you run your code
// You can use backdoor to bypass making an actual request to the backend,
// and just return mocked data instead
const mockedApiResponse = { userName: 'fakeuser' };

// ...all the while maintaining the ability to actually make a call to the backend when you want to
const withBackdoor = thenable => backdoor({
  actualThenable: thenable,
  // The value backdoor should assess to decide whether real or mocked data should be returned
  input: formData.firstName,
  resolvedValue: mockedApiResponse,
  config: { enabledInProd: true } // Because runKit sets NODE_ENV to "production" by default
});

// Submit the form:
// Same as running createUser(formData) directly, because the firstName input field isn't 'backdoor'
withBackdoor(createUser)(formData)
  .then(apiResponseHandler); // pparker (no perceptible delay with this example)

// Fill out the firstName input field with 'backdoor' and submit the form
formData.firstName = 'backdoor';
withBackdoor(createUser)(formData)
  .then(apiResponseHandler); // fakeuser (5s delay perceptible)
