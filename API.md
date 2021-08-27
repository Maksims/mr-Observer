## Classes
<dl>
<dt><a href="#Observer">Observer</a> extends <code><a href="#EventEmitter">EventEmitter</a></code></dt>
<dt><a href="#EventEmitter">EventEmitter</a></dt>
<dt><a href="#EventHandler">EventHandler</a></dt>
</dl>
<a name="Observer"></a>

## Observer *extends* [<code>EventEmitter</code>](#EventEmitter)
Observer that provides sync events when data is changed. For data-centric application this allows to build more flat architecture where different logical parts can subscribe to observer and do not need to interact between each other, by that decoupling logic, improving modularity. Data can be any complexity JSON, and provides specific path or simple query for partial paths using wildcard notation for subscribing to changes.

**Extends**: [<code>EventEmitter</code>](#EventEmitter)  
#### Properties:

| Name | Type | Description |
| --- | --- | --- |
| data | <code>object</code> \| <code>array</code> | Data that observer is modifying. This data should not be modified by application logic. |


[new Observer([data])](#new_Observer_new) (constructor)<br />
[.set([path], data)](#Observer+set)<br />
[.unset([path])](#Observer+unset)<br />
[.patch([path], data)](#Observer+patch)<br />
[.insert(path, data, [index])](#Observer+insert)<br />
[.move(path, from, to)](#Observer+move)<br />
[.remove(path, [index])](#Observer+remove)<br />
[.get([path])](#Observer+get) ⇒ <code>\*</code><br />
[.clear()](#Observer+clear)<br />
[.on(name, callback, [scope], [once])](#EventEmitter+on) ⇒ [<code>EventHandler</code>](#EventHandler)<br />
[.once(name, callback, [scope])](#EventEmitter+once) ⇒ [<code>EventHandler</code>](#EventHandler)<br />
[.emit(name, [...args])](#EventEmitter+emit)<br />
[.off([name], [callback], [scope])](#EventEmitter+off)<br />
[[path:]set (path, value, old)](#Observer+event_[path_]set) (event)<br />
[[path:]unset (path, old)](#Observer+event_[path_]unset) (event)<br />
[[path:]insert (path, value, index)](#Observer+event_[path_]insert) (event)<br />
[[path:]move (path, value, from, to)](#Observer+event_[path_]move) (event)<br />
[[path:]remove (path, value, index)](#Observer+event_[path_]remove) (event)<br />

<a name="new_Observer_new"></a>

### new Observer([data])

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> \| <code>array</code> | Object or an Array for initial data. Defaults to { }; |

**Example**  
```js
let planet = new Observer({ age: 4.543, population: 7.594 });// get dataelement.textContent = planet.get('population');// know when data changesplanet.on('population:set', function (path, value) {    element.textContent = value;});// set dataplanet.set('population', 7.595); // triggers "population:set" event
```
**Example**  
```js
// more complex example for datalet planets = new Observer({    earth: {        age: 4.543,        population: 7.594    },    mars: {        age: 4.603,        population: 0    }});// know when any planet population changes// using a wildcard notation to match multiple pathsplanets.on('*.population:set', function (path, population) {    const planet = path[0];    elements[planet].textContent = population;});// set dataplanets.set('earth.population', 7.595); // triggers "*.population:set" event
```
**Example**  
```js
// list of taskslet todos = new Observer([{    text: 'buy a milk',    complete: true}, {    text: 'walk a dog'}]);// subscribe for a new taskstodos.on('insert', (path, value, index) => {    if (path.length) return;    console.log(`new task "${value.text}" been added at position ${index}`);});// subscribe for a task completion state changestodos.on('*.complete:set', (path, value) => {    console.log(`task "${todos.get(path[0] + '.text')}" has been marked "${(!value ? 'not ' : '') + 'complete'}"`);});// add another tasktodos.insert('', { text: 'fix a fence' });// complete a tasktodos.set('1.complete', true);
```
<a name="Observer+set"></a>

### .set([path], data)
Set data by a specific path. If in process of setting existing object values will be unset, it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths. If set is against an array and index is higher then length of an array, it will insert null's until set value and trigger `insert` events.


| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> \| <code>number</code> | Path in data to be set to. If path is not provided, it will set the root of observer. |
| data | <code>\*</code> | Data to be set. |

**Example**  
```js
obj.set('position.x', 42);obj.set('position', { x: 4, y: 2 });
```
<a name="Observer+unset"></a>

### .unset([path])
Unset data by a specific path. It will emit `unset` events with related paths. If path is not provided, it will reset root of data to empty object. If unset of an array item, it will additionally trigger `move` and `remove` events if necessary.


| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> \| <code>number</code> | Path in data to be unset. If path is not provided, it will set root of observer to empty object. |

**Example**  
```js
obj.unset('position.z');
```
<a name="Observer+patch"></a>

### .patch([path], data)
Patch data by a specific path. In process of setting, it will not unset values that are not provided in patch data. But still can trigger unset events if object is changed to something else, so it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.


| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> \| <code>number</code> | Path in data to be patched. If path is not provided, it will patch the root of observer. |
| data | <code>\*</code> | Data for patching. |

**Example**  
```js
let obj = new Observer({ position: { x: 4, y: 2 } });obj.patch('position', { z: 7 });// will become { position: { x: 4, y: 2, z: 7 } }
```
<a name="Observer+insert"></a>

### .insert(path, data, [index])
Insert data by a specific path. Inserting new data will emit `set` event, if any items were moved in array, they will emit `move` event first.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> \| <code>number</code> | Path in data to be inserted to. If path is empty string or null, it will insert in the root of observer if it is an array. |
| data | <code>\*</code> | Data to be set. |
| [index] | <code>number</code> | Index within array to insert to. By default -1 (the end of an array). 0 - will insert in the beginning. Negative values will count from the end of an array. |

**Example**  
```js
const primes = new Observer([ 2, 5, 7 ]);primes.insert('', 11);primes.insert('', 3, 1); // we forgot prime number 3 which should be second in a list
```
**Example**  
```js
const planets = new Observer({    saturn: {        satellites: [ ]    }});obj.insert('saturn.satellites', 'rhea');obj.insert('saturn.satellites', 'iapetus');obj.insert('saturn.satellites', 'titan', 0); // insert in the beginning
```
<a name="Observer+move"></a>

### .move(path, from, to)
Move item by a specific path. Moving item will emit `move` event for affected items in arrays first, and then moved item it self. Indices support negative values, counting will be from the end then.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> \| <code>number</code> | Path in data to be inserted to. If path is empty string or null, it will insert in the root of observer if it is an array. |
| from | <code>number</code> | Index from which item to be moved. |
| to | <code>number</code> | Index to which item to be moved. |

**Example**  
```js
satellites.move('', 1, 3); // from 1 to 3satellites.move('', -1, 0); // from the end to the beginningsatellites.move('', 3, -1); // from 3 to the end
```
<a name="Observer+remove"></a>

### .remove(path, [index])
Remove item by a specific path. Removing item will emit `unset` event for an affected item in arrays first, then `move` event for affected items, and then `remove` for it self. Indices support negative values, counting will be from the end then.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> \| <code>number</code> | Path in data to be inserted to. If path is empty string or null, it will insert in the root of observer if it is an array. |
| [index] | <code>number</code> | Index from which item to be removed. By default removes from the end of an array. |

**Example**  
```js
planets.remove('', 8); // remove 9th item (sad Pluto)
```
<a name="Observer+get"></a>

### .get([path]) ⇒ <code>\*</code>
Get data by a specific path. Returns raw data based on path. If path is not provided will return root data of observer. This data should not be modified by application logic, and is subject to change by obseerver functions.

**Returns**: <code>\*</code> - Data based on provided path.  

| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> \| <code>number</code> | Path of data to be returned. |

**Example**  
```js
let x = obj.get('position.x');
```
**Example**  
```js
const planets = new Observer([ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune' ])let planet = planets.get(2); // earth
```
<a name="Observer+clear"></a>

### .clear()
Resets observer, its data to empty object and removes all subscribed events.

<a name="EventEmitter+on"></a>

### .on(name, callback, [scope], [once]) ⇒ [<code>EventHandler</code>](#EventHandler)
Attach an event handler.

**Overrides**: [<code>on</code>](#EventEmitter+on)  
**Returns**: [<code>EventHandler</code>](#EventHandler) - Object that can be used to manage the event.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the event to bind the callback to. |
| callback | <code>function</code> | Function that is called when event is emitted. |
| [scope] | <code>object</code> | Object to use as 'this' when the event is emitted, defaults to current this. |
| [once] | <code>boolean</code> | Boolean to indicate if this event should emit only once. Defaults to false. |

**Example**  
```js
obj.on('event', function (a, b) {    console.log(a + b);});obj.emit('event', 4, 2);
```
<a name="EventEmitter+once"></a>

### .once(name, callback, [scope]) ⇒ [<code>EventHandler</code>](#EventHandler)
Attach an event handler which will emit only once.

**Returns**: [<code>EventHandler</code>](#EventHandler) - Object that can be used to manage the event.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the event to bind the callback to. |
| callback | <code>function</code> | Function that is called when event is emitted. |
| [scope] | <code>object</code> | Object to use as 'this' when the event is emitted, defaults to current this. |

**Example**  
```js
obj.once('event', function (a) {    console.log(a);});obj.emit('event', 4);obj.emit('event', 2); // will not trigger
```
<a name="EventEmitter+emit"></a>

### .emit(name, [...args])
Emit the event by name and optional list of arguments.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the event to bind the callback to. |
| [...args] | <code>\*</code> | Arguments to be passed to event callbacks. |

**Example**  
```js
obj.emit('event', 'hello', 42);
```
<a name="EventEmitter+off"></a>

### .off([name], [callback], [scope])
Remove event handlers based on provided arguments.


| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>string</code> | Name of the events to remove. If not specified all events will be removed. |
| [callback] | <code>function</code> | Function that is used as callback. If not defined, then all events of specified name will be removed. |
| [scope] | <code>object</code> | Object that is used as a scope for event handlers. If not defined, then all events with matching name and callback function will be removed. |

**Example**  
```js
obj.off(); // removes all eventsobj.off('event'); // removes all events named `event`.obj.off(/input:\w+/); // removes all events with name matching regular expressionobj.off('event', fn); // removes events named `event` with `fn`obj.off('event', fn, obj); // removes events named `event` with `fn` callback and `obj` as a scope.
```
<a name="Observer+event_[path_]set"></a>

### (event) [path:]set (path, value, old)
Fired when value have been set/changed on a path. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any changes.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array.&lt;(string\|number)&gt;</code> | Path to the value changed as a mutable array of strings or numbers. Do not modify this array. |
| value | <code>\*</code> | New value. |
| old | <code>\*</code> | Old value. |

**Example**  
```js
// specific pathobj.on('earth.population:set', function (path, value, old) {    element.textContent = value;});
```
**Example**  
```js
// using wildcard with partial path, which will match any changes// where second level property name is `population`obj.on('*.population:set', function (path, value, old) {    const planet = path[0];    elements[planet].textContent = value;});
```
**Example**  
```js
const obj = new Observer({ position: { x: 0, y: 0, z: 0 } });// using wildcard to match any axis change of a position objectobj.on('position.*:set', function (path, value, old) {    const axis = path[1];    setAxis(axis, value);});
```
**Example**  
```js
obj.on('set', function (path, value, old) {    // any change of data will trigger this event});
```
<a name="Observer+event_[path_]unset"></a>

### (event) [path:]unset (path, old)
Fired when value have been unset on a path. Same rules apply as for `set` event when defining path.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array.&lt;(string\|number)&gt;</code> | Path to the value changed as a mutable array of strings or numbers. Do not modify this array. |
| old | <code>\*</code> | Old value. |

**Example**  
```js
obj.on('earth.population:unset', function (path, old) {    console.log(`'earth.population' has been unset`);});
```
**Example**  
```js
obj.on('*:unset', function (path) {    console.log(`planet '${path[0]}' has been unset`);});
```
**Example**  
```js
obj.on('unset', function (path) {    console.log(`'${path.join('.')}' has been unset`);});
```
<a name="Observer+event_[path_]insert"></a>

### (event) [path:]insert (path, value, index)
Fired when value have been inserted on a path. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any inserts.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array.&lt;(string\|number)&gt;</code> | Path to the value changed as a mutable array of strings or numbers. Do not modify this array. |
| value | <code>\*</code> | New value. |
| index | <code>number</code> | Index at which value was inserted. |

**Example**  
```js
// specific pathobj.on('saturn.satellites:insert', function (path, value, index) {    console.log(`satelite "${value}" has been added to saturn at position ${index}`);});
```
**Example**  
```js
// using wildcard with partial path, which will match any changes// where second level property name is `satellites`obj.on('*.satellites:insert', function (path, value, index) {    console.log(`satellite "${value}" of planet "${path[0]}", has been inserted at ${index}`);});
```
**Example**  
```js
obj.on('insert', function (path, value, index) {    // any insert of data will trigger this event});
```
<a name="Observer+event_[path_]move"></a>

### (event) [path:]move (path, value, from, to)
Fired when value have been moved in an array. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any changes.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array.&lt;(string\|number)&gt;</code> | Path to the value changed as a mutable array of strings or numbers. Do not modify this array. |
| value | <code>\*</code> | Value item moved. |
| from | <code>number</code> | Index from which value was moved. |
| to | <code>number</code> | Index to which value was moved. |

**Example**  
```js
// specific pathobj.on('saturn.satellites:move', function (path, value, from, to) {});
```
**Example**  
```js
// using wildcard with partial path, which will match any changes// where second level property name is `satellites`obj.on('*.satellites:move', function (path, value, from, to) {    console.log(`satellite "${value}" of planet "${path[0]}", has been moved from ${from} to ${to}`);});
```
**Example**  
```js
obj.on('move', function (path, value, from, to) {    // any move of data will trigger this event});
```
<a name="Observer+event_[path_]remove"></a>

### (event) [path:]remove (path, value, index)
Fired when value have been removed from an array. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any changes.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array.&lt;(string\|number)&gt;</code> | Path to the value changed as a mutable array of strings or numbers. Do not modify this array. |
| value | <code>\*</code> | Old value. |
| index | <code>number</code> | Index from which value was removed. |

**Example**  
```js
// specific pathobj.on('planets:remove', function (path, value, index) {    // oh Pluto!});
```
**Example**  
```js
// using wildcard with partial path, which will match any changes// where second level property name is `satellites`obj.on('*.satellites:remove', function (path, value, index) {    console.log(`satellite "${value}" of planet "${path[0]}", has been removed from ${index} position`);});
```
**Example**  
```js
obj.on('remove', function (path, value, index) {    // any remove of data will trigger this event});
```
<a name="external_EventEmitter"></a>

## EventEmitter
Provides ability to subscribe and emit events in sync manner. Each subscribtion (on, once) returns EventHandler that simplifies callbacks management.

**See**: [https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventEmitter](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventEmitter)  
<a name="external_EventHandler"></a>

## EventHandler
Constructed by EventEmitter and provides easy ability to manage event.

**See**: [https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler)  
