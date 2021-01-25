## Classes

<dl>
<dt><a href="#Observer">Observer</a> ⇐ <code><a href="#EventEmitter">EventEmitter</a></code></dt>
<dd><p>Observer that provides sync events when data is changed. For data-centric application this allows to build more flat architecture where different logical parts can subscribe to observer and do not need to interact between each other, by that decoupling logic, improving modularity.</p>
</dd>
<dt><a href="#EventEmitter">EventEmitter</a></dt>
<dd></dd>
<dt><a href="#EventHandler">EventHandler</a></dt>
<dd></dd>
</dl>

<a name="Observer"></a>

## Observer ⇐ [<code>EventEmitter</code>](#EventEmitter)
Observer that provides sync events when data is changed. For data-centric application this allows to build more flat architecture where different logical parts can subscribe to observer and do not need to interact between each other, by that decoupling logic, improving modularity.

**Extends**: [<code>EventEmitter</code>](#EventEmitter)  
#### Properties:

| Name | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Data that obsserver is modifying. This data should not be modified by application logic. |


[new Observer([data])](#new_Observer_new) (constructor)
[.set([path], data)](#Observer+set)
[.patch([path], data)](#Observer+patch)
[.unset([path])](#Observer+unset)
[.get([path])](#Observer+get) ⇒ <code>\*</code>
[.clear()](#Observer+clear)
[.on(name, callback, [scope], [once])](#EventEmitter+on) ⇒ [<code>EventHandler</code>](#EventHandler)
[.once(name, callback, [scope])](#EventEmitter+once) ⇒ [<code>EventHandler</code>](#EventHandler)
[.emit(name, [...args])](#EventEmitter+emit)
[.off([name], [callback], [scope])](#EventEmitter+off)
[[path]:set (value, old)](#Observer+event_[path]_set) (event)
[*:set (path, value, old)](#Observer+event_*_set) (event)
[[path]:unset (old)](#Observer+event_[path]_unset) (event)
[*:unset (path, old)](#Observer+event_*_unset) (event)

<a name="new_Observer_new"></a>

### new Observer([data])

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Object for initial data. Defaults to { }; |

**Example**  
```js
let earth = new Observer({ age: 4.543, population: 7.594 });element.textContent = earth.get('population');earth.on('population:set', function (value) {    element.textContent = value;});earth.set('population', 7.595); // triggers "population:set" event
```
<a name="Observer+set"></a>

### .set([path], data)
Set data by path. If in process of setting existing object values will be unset, it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.


| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> | Path in data to be set to. If path is not provided, it will set the root of observer. |
| data | <code>\*</code> | Data to be set. |

**Example**  
```js
obj.set('position.x', 42);obj.set('position', { x: 4, y: 2 });
```
<a name="Observer+patch"></a>

### .patch([path], data)
Patch data by path. In process of setting, it will not unset values that are not provided in patch data. But still can trigger unset events if object is changed to something else, so it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.


| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> | Path in data to be patched. If path is not provided, it will patch the root of observer. |
| data | <code>\*</code> | Data for patching. |

**Example**  
```js
let obj = new Observer({ position: { x: 4, y: 2 } });obj.patch('position', { z: 7 });// will become { position: { x: 4, y: 2, z: 7 } }
```
<a name="Observer+unset"></a>

### .unset([path])
Unset data by path. It will emit `unset` events with related paths. If path is not provided, it will reset root of data to empty object.


| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> | Path in data to be unset. If path is not provided, it will set root of observer to empty object. |

**Example**  
```js
obj.unset('position.z');
```
<a name="Observer+get"></a>

### .get([path]) ⇒ <code>\*</code>
Get data by path. Returns raw data based on path. If path is not provided will return root data of observer. This data should not be modified by application logic, and is subject to change by obseerver functions.

**Returns**: <code>\*</code> - Data based on provided path.  

| Param | Type | Description |
| --- | --- | --- |
| [path] | <code>string</code> | Path of data to be returned. |

**Example**  
```js
let x = obj.get('position.x');
```
<a name="Observer+clear"></a>

### .clear()
Resets observer, its data to empty object and removes all subscribed events.

<a name="EventEmitter+on"></a>

### .on(name, callback, [scope], [once]) ⇒ [<code>EventHandler</code>](#EventHandler)
Attach an event handler.

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
<a name="Observer+event_[path]_set"></a>

### (event) [path]:set (value, old)
Fired when value have been set/changed on a specified path.


| Param | Type | Description |
| --- | --- | --- |
| value | <code>\*</code> | New value. |
| old | <code>\*</code> | Old value. |

**Example**  
```js
obj.on('population:set', function (value) {    element.textContent = value;});
```
<a name="Observer+event_*_set"></a>

### (event) \*:set (path, value, old)
Fired when any value have been set/changed.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Path of value changed. |
| value | <code>\*</code> | New value. |
| old | <code>\*</code> | Old value. |

**Example**  
```js
obj.on('*:set', function (path, value, old) {    console.log(`"${path}" has been changed to: "${value}", from "${old}"`);});
```
<a name="Observer+event_[path]_unset"></a>

### (event) [path]:unset (old)
Fired when value have been unset on a specified path.


| Param | Type | Description |
| --- | --- | --- |
| old | <code>\*</code> | Old value. |

**Example**  
```js
obj.on('population:unset', function (old) {    console.log("'population' has been unset");});
```
<a name="Observer+event_*_unset"></a>

### (event) \*:unset (path, old)
Fired when any value have been unset.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Path of value unset. |
| old | <code>\*</code> | Old value. |

**Example**  
```js
obj.on('*:unset', function (path, old) {    console.log(`"${path}" has been unset`);});
```
<a name="external_EventEmitter"></a>

## EventEmitter
Provides ability to subscribe and emit events in sync manner. Each subscribtion (on, once) returns EventHandler that simplifies callbacks management.

**See**: [https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventEmitter](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventEmitter)  
<a name="external_EventHandler"></a>

## EventHandler
Constructed by EventEmitter and provides easy ability to manage event.

**See**: [https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler](https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler)  
