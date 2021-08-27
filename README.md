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

ES8+ module: https://cdn.jsdelivr.net/npm/mr-observer@1.0/dist/mr-observer.min.js  
ES5 version: https://cdn.jsdelivr.net/npm/mr-observer@1.0/dist/mr-observer.es5.min.js

#### Example

```js
let earth = new Observer({ age: 4.543, population: 7.594 });

earth.on('population:set', function (path, value) {
    element.textContent = value;
});

earth.set('population', 7.595);
// fires "population:set" event
```


## :scroll: [API Documentation](API.md)

## Usage

#### Creating:

Creating Observer (object):
```js
let obj = new Observer({ position: { x: 4, y: 2 } });
```

Creating Observer (array):
```js
let planets = new Observer([ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune' ]);
```

#### Get:

Data provided to Observer should not be modified by application logic, it is not cloned either as it is a choice for a developer. Accessing data is possible through `.data` property or `get` method. Where `get` method is more safe approach, as it will handle undefined paths well:

```js
let obj = new Observer({ position: { x: 4, y: 2 } });
console.log(obj.get('position.x')); // 4
console.log(obj.get('position.z')); // undefined
console.log(obj.get('hello.world')); // undefined
```

```js
console.log(planets.get(8)); // undefined, sorry Pluto
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

If root is an array, index can be used:
```js
planets.set(2, 'Earth');
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
obj.on('unset', function (path) {
    console.log(`"${path.join('.')}" has been unset`);
});

obj.set('position', { z: 64 });
```


#### Patch:

Patch is used to partially update data, it will not unset values if they are missing in provided data. But can still trigger "unset" event when object is replaced with non-object value. If patching an array, `insert` event can be triggered when new values added.

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
obj.on('unset', function (path) {
    console.log(`"${path.join('.')}" has been unset`);
});

obj.patch('position', 64);
// data now is: { position: 64 };
```


#### Unset:

By specific path:
```js
obj.unset('position.y');
```

Reset root to an empty object:
```js
obj.unset();
```

It is possible to clear (sets to an empty object) an observer without firing "unset" events, this will also unsubscribe all events:
```js
obj.clear();
```


#### Insert:

When working with arrays, insert, move and remove methods to be used for better control over data.

Insert to an array:
```js
const planets = new Observer({
    earth: {
        satellites: [ ]
    }
});
planets.insert('earth.satellites', 'moon');
```

Observer as an array:
```js
const primes = new Observer([ 2, 5, 7 ]);
primes.insert('', 11); // inserts to the end
```

Insert at a specific index:
```js
const primes = new Observer([ 2, 5, 7 ]);
// we forgot prime number 3 which should be second in a list
primes.insert('', 3, 1);
```

Using negative index to insert from the end:
```js
let planets = new Observer([ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'uranus', 'neptune' ]);
// we forgot saturn!
// insert to the third index from the end
planets.insert('', 'saturn', -3);
```


#### Move:
Moving items within array. It will trigger `move` event for affected items first, and then for the moved one.

```js
let planets = new Observer([ 'earth', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune' ]);
// earth should be third!
// move it from index 0 to index 2
planets.move('', 0, 2);
```

Move from the end to the beginning:
```js
items.move('', -1, 0);
```


#### Remove:
Removing items can trigger `move` event for affected items, and then for the removed one will trigger `remove` event.

Remove from the end:
```js
let planets = new Observer([ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto' ]);
// Sorry pluto!
planets.remove('', -1);
```

Remove at a specific index:
```js
const primes = new Observer([ 2, 3, 4, 5, 7, 11 ]);
// 4 is not a prime!
primes.remove('', 2);
```


#### Subscribing to changes:

This library is using [mr-EventEmitter](https://github.com/Maksims/mr-EventEmitter/) for events management.

Set event by a specific path
```js
let obj = new Observer({ });

obj.on('hello:set', function (path, value) {
    console.log(`"hello" has been changed to "${value}"`);
});

// this will fire "hello:set" event
obj.set('hello', 'world');
```

Set event without path (matches any set):
```js
let obj = new Observer({ });

// this will be executed 3 times
// with these paths: 'position.x', 'position.y', 'position'
obj.on('set', function (path, value) {
    console.log(`"${path.join('.')}" has been changed to "${value}"`);
});

obj.set('position', { x: 4, y: 2 });
```

Set event using wildcard notation:
```js
let planets = new Observer({ });

// it will match with any first level property name, where second level property name is `name`
planets.on('*.name:set', function (path, value) {
    console.log(`Planet "${path[0]}" name has been changed to "${value}"`);
});

planets.set('earth', { name: 'Earth' });
planets.set('mars', { name: 'Mars' });
```

Second example:
```js
let obj = new Observer({
    position: { x: 0, y: 0, z: 0 }
});

// it will match path with `position` as first level property and any second level property name
obj.on('position.*:set', function (path, value) {
    console.log(`Axis "${path[1]}" has been changed to "${value}"`);
});

obj.patch('position', { x: 0, y: 4, z: 8 });
obj.set('position.x', 32);
```

Single trigger of change:
```js
let obj = new Observer({ });

// will trigger only once
obj.once('hello:set', function (path, value) {
    console.log(`"hello" has been changed to "${value}"`);
});

// both will fire "hello:set" event
obj.set('hello', 'world');
obj.set('hello', 'space');
```

Unset event is similar to Set event, with path or without:
```js
let obj = new Observer({ hello: 'world' });

obj.on('hello:unset', function (path, valueOld) {
    console.log(`"hello" has been unset`);
});

// this will fire "hello:unset" event
obj.unset('hello');
```

Array events: `insert`, `move` and `remove` do not include index in a path:
```js
let obj = new Observer({
    planets: [ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto' ]
});

obj.on('planets:remove', function(path, value, index) {
    // path is [ 'planets' ]
    console.log(`"${value}" has been removed from ${path.join('.')} at index ${index}`);
});

// Sorry pluto!
obj.remove('planets', -1);
```

Subscribe to `insert` events on array:
```js
let obj = new Observer({
    planets: [ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune' ]
});

obj.on('planets:insert', function(path, value, index) {
    console.log(`"${value}" has been added to ${path.join('.')} at index ${index}`);
});

obj.insert('planets', 'planet nine');
```

Values and objects provided in events are actual for the duration of the event, and should not be stored or modified (if storing is desired then it should be cloned):
```js
let obj = new Observer({ });

let position = null;
obj.on('position:set', function (path, value) {
    value.z = 64; // not good
    position = value; // not good
});

obj.set('position', { x: 4, y: 2 });
```


#### Removing events:

Remove event by [EventHandler](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler):
```js
let obj = new Observer({ hello: 'world' });

let evt = obj.on('hello:set', function (path, value) {
    console.log(`hello ${value}`);
});

obj.set('hello', 'earth');
obj.set('hello', 'space');
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
