# mr-Observer

Observer is a wrapper over JSON data, that provides an interface to know when data is changed, with a focus on performance and memory efficiency.

For data-centric design, this provides a modular and robust pattern for applications with various data-dependent parts: ui, real-time render, history undo/redo, real-time collaboration, and more. This pattern has been used for years in [PlayCanvas Editor](https://playcanvas.com/) providing fast iteration and ease of development in a complex environment.

This library it has two build targets: ES5 (ECMA2009) and ES8+ (modern JS), to maximize [browser support](#Browser) without sacraficing benefits of modern JS for majority of users. And can be used with ECMA Modules in Node.js.

[![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](LICENSE)


## :rocket: Install


#### Node.js

Install:
```bash
npm install mr-observer
```

In Node.js:
```js
import Observer from 'mr-observer';
```


#### Browser

```html
<script type='module' src='mr-observer.min.js'></script>
<script nomodule src='mr-observer.es5.min.js'></script>
```
Use built files from `dist` directory for browser. It will load ES8+ version if it is supported ([~94%](https://caniuse.com/?search=ES8)), otherwise it will load ES5 (ECMA2009) version that supports pretty much [every](https://caniuse.com/?search=ES5) platform.

#### CDN ([jsDelivr](https://www.jsdelivr.com/))

You can use a public CDN for the library:

ES8+ module: https://cdn.jsdelivr.net/npm/mr-observer@0.1/dist/mr-observer.min.js  
ES5 version: https://cdn.jsdelivr.net/npm/mr-observer@0.1/dist/mr-observer.es5.min.js

#### Example

```js
let earth = new Observer({ age: 4.543, population: 7.594 });

earth.on('population:set', function (value) {
    element.textContent = value;
});

earth.set('population', 7.595);
// fires "population:set" event
```


## :scroll: [API Documentation](API.md)

## Usage

#### Creating:

Creating Observer:
```js
let data = { position: { x: 4, y: 2 } };
let obj = new Observer(data);
```

#### Get:

Data provided to Observer should not be modified by application logic, it is not cloned either as it is a choice for a developer. Accessing data is possible through `.data` property or `get` method. Where `get` method is more safe approach, as it will handle undefined paths well:

```js
let obj = new Observer({ position: { x: 4, y: 2 } });
console.log(obj.get('position.x')); // 4
console.log(obj.get('position.z')); // undefined
console.log(obj.get('hello.world')); // undefined
```

Returned values should NOT be modified by an application logic:
```js
let obj = new Observer({ position: { x: 4, y: 2 } });
let position = obj.get('position');
position.z = 10; // not good
obj.data.position.z = 10; // not good
obj.set('position.z', 10); // good
```

#### Set:

Set is used to change data, which can fire "set" and "unset" events.

By specific path:
```js
obj.set('position.y', 64);
```

Set root of the data:
```js
obj.set({ hello: 'world' });
```

Set will not create missing objects along the path:
```js
let obj = new Observer({ });
obj.set('hello.world', true);
// `hello` is undefined, so this will not change data
```

Set can fire "unset" events:
```js
let obj = new Observer({ position: { x: 4, y: 2 } });

// this will trigger twice: `position.x` and `position.y`
obj.on('*:unset', function (path) {
    console.log(`"${path}" has been unset`);
});

obj.set('position', { z: 64 });
```


#### Patch:

Patch is used to partially update data, it will not unset values if they are missing in provided data. But can still trigger "unset" event when object is replaced with non-object value.

It can be used same way as `set` method.

```js
let obj = new Observer({ position: { x: 4, y: 2 } });
obj.patch('position', { z: 64 });
// data now is: { position: { x: 4, y: 2, z: 64 } };
```

Case where "unset" event can still occur:
```js
let obj = new Observer({ position: { x: 4, y: 2 } });

// this will trigger twice: `position.x` and `position.y`
obj.on('*:unset', function (path) {
    console.log(`"${path}" has been unset`);
});

obj.patch('position', 64);
// data now is: { position: 64 };
```


#### Unset:

By specific path:
```js
obj.unset('position.y');
```

Reset root to empty empty object:
```js
obj.unset();
```

It is possible to clear (sets to an empty object) an observer without firing "unset" events, this will also unsubscribe all events:
```js
obj.clear();
```



#### Subscribing to changes:

This library is using [mr-EventEmitter](https://github.com/Maksims/mr-EventEmitter/) for events management.

Set event by specific path
```js
let obj = new Observer({ });

obj.on('hello:set', function (value) {
    console.log(`"hello" has been changed to "${value}"`);
});

// this will fire "hello:set" event
obj.set('hello', 'world');
```

Set event without path:
```js
let obj = new Observer({ });

// this will be executed 3 times
// with these paths: 'position.x', 'position.y', 'position'
obj.on('*:set', function (path, value) {
    console.log(`"${path}" has been changed to "${value}"`);
});

obj.set('position', { x: 4, y: 2 });
```

Single trigger of change:
```js
let obj = new Observer({ });

// will trigger only once
obj.once('hello:set', function (value) {
    console.log(`"hello" has been changed to "${value}"`);
});

// both will fire "hello:set" event
obj.set('hello', 'world');
obj.set('hello', 'space');
```

Unset event is similar to Set event, with path or without:
```js
let obj = new Observer({ hello: 'world' });

obj.on('hello:unset', function (value) {
    console.log(`"hello" has been unset`);
});

// this will fire "hello:unset" event
obj.unset('hello');
```

Values and objects provided in events are actual for the duration of the event, and should not be stored or modified (if storing is desired then it should be cloned):
```js
let obj = new Observer({ });

let position = null;
obj.on('position:set', function (value) {
    value.z = 64; // not good
    position = value; // not good
});

obj.set('position', { x: 4, y: 2 });
```


#### Removing events:

Remove event by [EventHandler](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler):
```js
let obj = new Observer({ hello: 'world' });

let evt = obj.on('hello:set', function (value) {
    console.log(`hello ${value}`);
});

obj.set('hello', 'earth');
obj.set('hello', 'space');
obj.set('hello', 'black hole');
evt.off(); // remove event
obj.set('hello', 'another dimension'); // this will not be logged
```

It is possible to remove all events, by specific path or using regular expression. For more details refer to [EventEmitter API](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md)

## Building

Builds single file into two ES5 and ES8+ versions using Babel and Terser.  
Source file: `src/index.js`  
Built versions ES5 (`dist/mr-observer.es5.min.js`) and ES8+ (`dist/mr-observer.min.js`):

```bash
npm install
npm run build
```
