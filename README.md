# Lambda state

This is a state management and JSON logging library for AWS lambda. It provides access to work with a singleton
object for the lifecycle of your lambda function. To install it:

```bash
npm install --save github:mblink/lambda-state#0.0.1
```

To use it:

```js
const State = require('lambda-state');
```

## API

The following methods are available:

|Function|Description|Params|Return|
|---|---|---|---|
|`State.init`|Initializes a new singleton state. This should be called at the beginning of your lambda handler.|n/a|`Promise`|
|`State.debug`|Add a `debug` level log line to the state.|<ul><li>`message`: string</li><li>`aux`: object</li></ul>|`(...args) => Promise`|
|`State.info`|Add an `info` level log line to the state.|<ul><li>`message`: string</li><li>`aux`: object</li></ul>|`(...args) => Promise`|
|`State.warn`|Add a `warn` level log line to the state.|<ul><li>`message`: string</li><li>`aux`: object</li></ul>|`(...args) => Promise`|
|`State.error`|Add an `error` level log line to the state.|<ul><li>`message`: string</li><li>`aux`: object</li></ul>|`(...args) => Promise`|
|`State.finalize`|Print a log line given the current state and call the lambda callback based on the level of the state.|The lambda callback|void|

## Use with promises

The logging methods (`debug`, `info`, `warn`, and `error`) are designed to be used with promises. Since they return
functions, they are meant to be passed directly to `.then` without using anonymous function syntax.


The function that they return will pass all arguments it receives to `Promise.resolve`, so any functions downstream
that you've chained with `.then` will receive the arguments from upstream. Here's a simple example:

```js
const log = msg => console.log(msg);

State.init()
  .then(() => 'message')
  .then(State.info('This will appear in my state', { key: 'value' }))
  .then(log)
  .then(() => State.finalize(() => { console.log('finished'); }));
```

The logs from this code will look like this:

```
message
{"time":"2017-08-10T20:51:13.459Z","trace":[{"level":"info","message":"Log line","time":"2017-08-10T20:51:13.460Z","aux":{"key":"value"}}],"level":"info"}
finished
```

## Error handling

To ensure that errors are handled safely in your promise chain, you can call `.catch` before finalizing your state.
We can modify our example above to catch errors:

```js
const throwError = () => { throw new Error('error'); };

State.init()
  .then(State.info('This will appear in my state', { key: 'value' }))
  .then(throwError)
  .catch(e => State.error(e.name || 'Unknown error', { error: e.toString() })())
  .then(() => State.finalize(() => { console.log('finished'); }));
```

By calling `.catch` before finalizing our state, we get an `error` level log line in the JSON log line:

```
{"time":"2017-08-10T20:55:07.800Z","trace":[{"level":"info","message":"This will appear in my state","time":"2017-08-10T20:55:07.800Z","aux":{"key":"value"}},{"level":"error","message":"Error","time":"2017-08-10T20:55:07.801Z","aux":{"error":"Error: error"}}],"level":"error"}
finished
```
