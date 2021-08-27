import EventEmitter from '/observer/node_modules/mr-eventemitter/src/index.js';

/**
 * Provides ability to subscribe and emit events in sync manner. Each subscribtion (on, once) returns EventHandler that simplifies callbacks management.
 * @external EventEmitter
 * @see {@link https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventEmitter}
 */

/**
 * Constructed by EventEmitter and provides easy ability to manage event.
 * @external EventHandler
 * @see {@link https://github.com/Maksims/mr-EventEmitter/blob/main/API.md#EventHandler}
 */

/**
 * @class
 * @name Observer
 * @augments EventEmitter
 * @classdesc Observer that provides sync events when data is changed. For data-centric application this allows to build more flat architecture where different logical parts can subscribe to observer and do not need to interact between each other, by that decoupling logic, improving modularity. Data can be any complexity JSON, and provides specific path or simple query for partial paths using wildcard notation for subscribing to changes.
 * @param {object|array} [data] - Object or an Array for initial data. Defaults to { };
 * @property {object|array} data Data that observer is modifying. This data should not be modified by application logic.
 * @example
 * let planet = new Observer({ age: 4.543, population: 7.594 });
 *
 * // get data
 * element.textContent = planet.get('population');
 *
 * // know when data changes
 * planet.on('population:set', function (path, value) {
 *     element.textContent = value;
 * });
 *
 * // set data
 * planet.set('population', 7.595); // triggers "population:set" event
 * @example
 * // more complex example for data
 * let planets = new Observer({
 *     earth: {
 *         age: 4.543,
 *         population: 7.594
 *     },
 *     mars: {
 *         age: 4.603,
 *         population: 0
 *     }
 * });
 *
 * // know when any planet population changes
 * // using a wildcard notation to match multiple paths
 * planets.on('*.population:set', function (path, population) {
 *     const planet = path[0];
 *     elements[planet].textContent = population;
 * });
 *
 * // set data
 * planets.set('earth.population', 7.595); // triggers "*.population:set" event
 * @example
 * // list of tasks
 * let todos = new Observer([{
 *     text: 'buy a milk',
 *     complete: true
 * }, {
 *     text: 'walk a dog'
 * }]);
 *
 * // subscribe for a new tasks
 * todos.on('insert', (path, value, index) => {
 *     if (path.length) return;
 *     console.log(`new task "${value.text}" been added at position ${index}`);
 * });
 *
 * // subscribe for a task completion state changes
 * todos.on('*.complete:set', (path, value) => {
 *     console.log(`task "${todos.get(path[0] + '.text')}" has been marked "${(!value ? 'not ' : '') + 'complete'}"`);
 * });
 *
 * // add another task
 * todos.insert('', { text: 'fix a fence' });
 *
 * // complete a task
 * todos.set('1.complete', true);
 */
class Observer extends EventEmitter {
    constructor(data) {
        super();

        this.data = data || { };
        this._pathCache = new Map();
        this._eventsCache = new Map();
    }

    /**
     * @event
     * @name Observer#[path:]set
     * @description Fired when value have been set/changed on a path. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any changes.
     * @param {Array.<string|number>} path - Path to the value changed as a mutable array of strings or numbers. Do not modify this array.
     * @param {*} value - New value.
     * @param {*} old - Old value.
     * @example
     * // specific path
     * obj.on('earth.population:set', function (path, value, old) {
     *     element.textContent = value;
     * });
     * @example
     * // using wildcard with partial path, which will match any changes
     * // where second level property name is `population`
     * obj.on('*.population:set', function (path, value, old) {
     *     const planet = path[0];
     *     elements[planet].textContent = value;
     * });
     * @example
     * const obj = new Observer({ position: { x: 0, y: 0, z: 0 } });
     *
     * // using wildcard to match any axis change of a position object
     * obj.on('position.*:set', function (path, value, old) {
     *     const axis = path[1];
     *     setAxis(axis, value);
     * });
     * @example
     * obj.on('set', function (path, value, old) {
     *     // any change of data will trigger this event
     * });
     */

    /**
     * @event
     * @name Observer#[path:]unset
     * @description Fired when value have been unset on a path. Same rules apply as for `set` event when defining path.
     * @param {Array.<string|number>} path - Path to the value changed as a mutable array of strings or numbers. Do not modify this array.
     * @param {*} old - Old value.
     * @example
     * obj.on('earth.population:unset', function (path, old) {
     *     console.log(`'earth.population' has been unset`);
     * });
     * @example
     * obj.on('*:unset', function (path) {
     *     console.log(`planet '${path[0]}' has been unset`);
     * });
     * @example
     * obj.on('unset', function (path) {
     *     console.log(`'${path.join('.')}' has been unset`);
     * });
     */

    /**
     * @event
     * @name Observer#[path:]insert
     * @description Fired when value have been inserted on a path. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any inserts.
     * @param {Array.<string|number>} path - Path to the value changed as a mutable array of strings or numbers. Do not modify this array.
     * @param {*} value - New value.
     * @param {number} index - Index at which value was inserted.
     * @example
     * // specific path
     * obj.on('saturn.satellites:insert', function (path, value, index) {
     *     console.log(`satelite "${value}" has been added to saturn at position ${index}`);
     * });
     * @example
     * // using wildcard with partial path, which will match any changes
     * // where second level property name is `satellites`
     * obj.on('*.satellites:insert', function (path, value, index) {
     *     console.log(`satellite "${value}" of planet "${path[0]}", has been inserted at ${index}`);
     * });
     * @example
     * obj.on('insert', function (path, value, index) {
     *     // any insert of data will trigger this event
     * });
     */

    /**
     * @event
     * @name Observer#[path:]move
     * @description Fired when value have been moved in an array. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any changes.
     * @param {Array.<string|number>} path - Path to the value changed as a mutable array of strings or numbers. Do not modify this array.
     * @param {*} value - Value item moved.
     * @param {number} from - Index from which value was moved.
     * @param {number} to - Index to which value was moved.
     * @example
     * // specific path
     * obj.on('saturn.satellites:move', function (path, value, from, to) {
     *
     * });
     * @example
     * // using wildcard with partial path, which will match any changes
     * // where second level property name is `satellites`
     * obj.on('*.satellites:move', function (path, value, from, to) {
     *     console.log(`satellite "${value}" of planet "${path[0]}", has been moved from ${from} to ${to}`);
     * });
     * @example
     * obj.on('move', function (path, value, from, to) {
     *     // any move of data will trigger this event
     * });
     */

    /**
     * @event
     * @name Observer#[path:]remove
     * @description Fired when value have been removed from an array. Path can be a specific or using a wildcard notation for broader matches. Also path can be omitted completely to match event for any changes.
     * @param {Array.<string|number>} path - Path to the value changed as a mutable array of strings or numbers. Do not modify this array.
     * @param {*} value - Old value.
     * @param {number} index - Index from which value was removed.
     * @example
     * // specific path
     * obj.on('planets:remove', function (path, value, index) {
     *     // oh Pluto!
     * });
     * @example
     * // using wildcard with partial path, which will match any changes
     * // where second level property name is `satellites`
     * obj.on('*.satellites:remove', function (path, value, index) {
     *     console.log(`satellite "${value}" of planet "${path[0]}", has been removed from ${index} position`);
     * });
     * @example
     * obj.on('remove', function (path, value, index) {
     *     // any remove of data will trigger this event
     * });
     */

    /**
     * @function
     * @name Observer#set
     * @description Set data by a specific path. If in process of setting existing object values will be unset, it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths. If set is against an array and index is higher then length of an array, it will insert null's until set value and trigger `insert` events.
     * @param {string|number} [path] - Path in data to be set to. If path is not provided, it will set the root of observer.
     * @param {*} data - Data to be set.
     * @example
     * obj.set('position.x', 42);
     * obj.set('position', { x: 4, y: 2 });
     */
    set(path, data) {
        if (data === undefined) {
            data = path;
            path = '';
        }

        if (path === '' && (typeof(data) !== 'object' || ! (data instanceof Object)))
            return;

        const parts = this._makePathParts(path);

        let node = this.data;
        for(let i = 0; i < (parts.length - 1); i++) {
            node = node[parts[i]];

            if (node === undefined)
                return;
        }

        if (typeof(node) !== 'object' || ! (node instanceof Object))
            return;

        let nodeLength = -1;
        let old;
        if (path === '') {
            old = this.data;
            this.data = data;
        } else {
            if (Array.isArray(node))
                nodeLength = node.length;

            old = node[parts[parts.length - 1]];
            node[parts[parts.length - 1]] = data;
        }

        this._checkUnset(path, old, data);
        this._checkSet(path, data, old);

        if (nodeLength !== -1) {
            let arrayPath = parts.slice(0, -1).join('.');

            let i = nodeLength;
            while(i++ < node.length) {
                this._emitWildcard(arrayPath, 'insert', node[i - 1], i - 1);
            }
        }
    }

    /**
     * @function
     * @name Observer#unset
     * @description Unset data by a specific path. It will emit `unset` events with related paths. If path is not provided, it will reset root of data to empty object. If unset of an array item, it will additionally trigger `move` and `remove` events if necessary.
     * @param {string|number} [path] - Path in data to be unset. If path is not provided, it will set root of observer to empty object.
     * @example
     * obj.unset('position.z');
     */
    unset(path = '') {
        if (path === undefined) {
            let old = this.data;
            this.data = { };
            this._checkUnset(path, old, this.data);
            return;
        }

        const parts = this._makePathParts(path);

        let node = this.data;
        for(let i = 0; i < (parts.length - 1); i++) {
            node = node[parts[i]];

            if (node === undefined)
                return;
        }

        let old = node[parts[parts.length - 1]];
        if (old === undefined)
            return;

        this._checkUnset(path, old);

        if (Array.isArray(node)) {
            if (! node.length)
                return;

            const index = parts[parts.length - 1];
            const data = node[index];
            node.splice(index, 1);

            let arrayPath = parts.slice(0, -1).join('.');

            if (index < node.length) {
                let i = node.length;
                while(i-- > index) {
                    this._emitWildcard(arrayPath, 'move', node[i], i + 1, i);
                }
            }

            this._emitWildcard(arrayPath, 'remove', data, index);
        } else {
            delete node[parts[parts.length - 1]];
        }
    }

    /**
     * @function
     * @name Observer#patch
     * @description Patch data by a specific path. In process of setting, it will not unset values that are not provided in patch data. But still can trigger unset events if object is changed to something else, so it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.
     * @param {string|number} [path] - Path in data to be patched. If path is not provided, it will patch the root of observer.
     * @param {*} data - Data for patching.
     * @example
     * let obj = new Observer({ position: { x: 4, y: 2 } });
     * obj.patch('position', { z: 7 });
     * // will become { position: { x: 4, y: 2, z: 7 } }
     */
    patch(path, data) {
        if (data === undefined) {
            data = path;
            path = '';
        }

        if (path === '' && (typeof(data) !== 'object' || ! (data instanceof Object)))
            return;

        const parts = this._makePathParts(path);

        let node = this.data;
        for(let i = 0; i < (parts.length - 1); i++) {
            node = node[parts[i]];

            if (node === undefined)
                return;
        }

        if (typeof(node) !== 'object' || ! (node instanceof Object))
            return;

        let current;

        if (path === '') {
            current = this.data;
        } else {
            current = node[parts[parts.length - 1]];
        }

        let currentIsObject = (typeof(current) === 'object' && current instanceof Object);
        let dataIsObject = (typeof(data) === 'object' && data instanceof Object);

        if (currentIsObject) {
            if (dataIsObject) {
                this._patchNode(path, current, data);
            } else {
                node[parts[parts.length - 1]] = data;
                this._checkUnset(path, current, data);
                this._emitWildcard(path, 'set', data, current);
            }
        } else if (dataIsObject) {
            node[parts[parts.length - 1]] = data;
            this._checkSet(path, data, current);
        } else if (current !== data) {
            node[parts[parts.length - 1]] = data;
            this._emitWildcard(path, 'set', data, current);
        }
    }

    /**
     * @function
     * @name Observer#insert
     * @description Insert data by a specific path. Inserting new data will emit `set` event, if any items were moved in array, they will emit `move` event first.
     * @param {string|number} path - Path in data to be inserted to. If path is empty string or null, it will insert in the root of observer if it is an array.
     * @param {*} data - Data to be set.
     * @param {number} [index] - Index within array to insert to. By default -1 (the end of an array). 0 - will insert in the beginning. Negative values will count from the end of an array.
     * @example
     * const primes = new Observer([ 2, 5, 7 ]);
     * primes.insert('', 11);
     * primes.insert('', 3, 1); // we forgot prime number 3 which should be second in a list
     * @example
     * const planets = new Observer({
     *     saturn: {
     *         satellites: [ ]
     *     }
     * });
     * obj.insert('saturn.satellites', 'rhea');
     * obj.insert('saturn.satellites', 'iapetus');
     * obj.insert('saturn.satellites', 'titan', 0); // insert in the beginning
     */
    insert(path, data, index = -1) {
        let parts;
        let node = this.data;

        if (path !== '' && path !== null) {
            if (Number.isInteger(path))
                path = path.toString();

            parts = this._makePathParts(path);

            for(let i = 0; i < parts.length; i++) {
                node = node[parts[i]];

                if (node === undefined)
                    return;
            }
        }

        if (! Array.isArray(node))
            return;

        // negative index
        if (index < -1) {
            if (index < -node.length) {
                index = 0;
            } else {
                index = node.length + index + 1;
            }
        }

        let movedSince = null;

        if (index === 0) {
            // beginning
            node.unshift(data);
            movedSince = 1;
            index = 0;
        } else if (index === -1 || index >= node.length) {
            // end
            node.push(data);
            index = node.length - 1;
        } else {
            // middle
            node.splice(index, 0, data);
            movedSince = index + 1;
        }

        if (movedSince !== null) {
            let i = node.length;
            while(i-- > movedSince) {
                this._emitWildcard(path, 'move', node[i], i - 1, i);
            }
        }

        this._emitWildcard(path, 'insert', data, index);

        this._checkSet((parts ? (path + '.') : '') + index, data, undefined);
    }

    /**
     * @function
     * @name Observer#move
     * @description Move item by a specific path. Moving item will emit `move` event for affected items in arrays first, and then moved item it self. Indices support negative values, counting will be from the end then.
     * @param {string|number} path - Path in data to be inserted to. If path is empty string or null, it will insert in the root of observer if it is an array.
     * @param {number} from - Index from which item to be moved.
     * @param {number} to - Index to which item to be moved.
     * @example
     * satellites.move('', 1, 3); // from 1 to 3
     * satellites.move('', -1, 0); // from the end to the beginning
     * satellites.move('', 3, -1); // from 3 to the end
     */
    move(path, from, to) {
        let parts;
        let node = this.data;

        if (path !== '' && path !== null) {
            if (Number.isInteger(path))
                path = path.toString();

            parts = this._makePathParts(path);

            for(let i = 0; i < parts.length; i++) {
                node = node[parts[i]];

                if (node === undefined)
                    return;
            }
        }

        if (! Array.isArray(node))
            return;

        // negatives
        //      from
        if (from < 0) {
            if (from < -node.length) {
                from = 0;
            } else {
                from = node.length + from;
            }
        } else if (from >= node.length) {
            from = node.length - 1;
        }
        //      to
        if (to < 0) {
            if (to < -node.length) {
                to = 0;
            } else {
                to = node.length + to;
            }
        } else if (to >= node.length) {
            to = node.length - 1;
        }

        if (from === to) return;

        const data = node[from];
        let movedSince = null;
        let movedTill = null;
        let movedDirection = 0;

        // remove item
        node.splice(from, 1);

        if (to > from) {
            // right
            node.splice(to, 0, data);
            movedSince = from + 1;
            movedTill = to + 1;
            movedDirection = -1;
        } else {
            // left
            node.splice(to, 0, data);
            movedSince = to;
            movedTill = from;
            movedDirection = 1;
        }

        // notify of shifted items in between
        if (movedSince !== null) {
            let i = movedTill;
            while(i-- > movedSince) {
                this._emitWildcard(path, 'move', node[i + movedDirection], i, i + movedDirection);
            }
        }

        this._emitWildcard(path, 'move', data, from, to);
    }

    /**
     * @function
     * @name Observer#remove
     * @description Remove item by a specific path. Removing item will emit `unset` event for an affected item in arrays first, then `move` event for affected items, and then `remove` for it self. Indices support negative values, counting will be from the end then.
     * @param {string|number} path - Path in data to be inserted to. If path is empty string or null, it will insert in the root of observer if it is an array.
     * @param {number} [index] - Index from which item to be removed. By default removes from the end of an array.
     * @example
     * planets.remove('', 8); // remove 9th item (sad Pluto)
     */
    remove(path, index = -1) {
        let parts;
        let node = this.data;

        if (path !== '' && path !== null) {
            if (Number.isInteger(path))
                path = path.toString();

            parts = this._makePathParts(path);

            for(let i = 0; i < parts.length; i++) {
                node = node[parts[i]];

                if (node === undefined)
                    return;
            }
        }

        if (! Array.isArray(node) || ! node.length)
            return;

        if (index < 0) {
            if (index < -node.length) {
                index = 0;
            } else {
                index = node.length + index;
            }
        } else if (index >= node.length) {
            index = node.length - 1;
        }

        const data = node[index];
        this._checkUnset((path ? path + '.' : '') + index, data);
        node.splice(index, 1);

        if (index < node.length) {
            let i = node.length;
            while(i-- > index) {
                this._emitWildcard(path, 'move', node[i], i + 1, i);
            }
        }

        this._emitWildcard(path, 'remove', data, index);
    }

    /**
     * @function
     * @name Observer#get
     * @description Get data by a specific path. Returns raw data based on path. If path is not provided will return root data of observer. This data should not be modified by application logic, and is subject to change by obseerver functions.
     * @param {string|number} [path] - Path of data to be returned.
     * @returns {*} Data based on provided path.
     * @example
     * let x = obj.get('position.x');
     * @example
     * const planets = new Observer([ 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune' ])
     * let planet = planets.get(2); // earth
     */
    get(path = '') {
        if (path === undefined) return this.data;

        const parts = this._makePathParts(path);

        let node = this.data;
        for(let part of parts) {
            node = node[part];

            if (node === null || node === undefined)
                return node;
        }

        return node;
    }

    /**
     * @function
     * @name Observer#clear
     * @description Resets observer, its data to empty object and removes all subscribed events.
     */
    clear() {
        this.data = { };
        this._pathCache.clear();
        this.off();
    }

    on(name, callback, scope, once = false) {
        const path = name.replace(/:(set|unset|insert|move|remove)$/, '');
        const pathParts = this._makePathParts(path);

        let i = pathParts.length;
        let node = this._eventsCache;
        while(i--) {
            const part = pathParts[i];
            let map;

            if (node.has(part)) {
                map = node.get(part);
            } else {
                map = new Map();
                map.counter = 0;
                map.end = 0;
                node.set(part, map);
            }
            node = map;

            map.counter++
            if (i === 0)
                node.end++;
        }

        const evt = super.on(name, callback, scope, once);

        evt._destroy = evt.destroy;
        evt.destroy = () => {
            let i = pathParts.length;
            let node = this._eventsCache;
            while(i--) {
                const part = pathParts[i];
                let map = node.get(part);
                map.counter--;

                if (! map.counter) {
                    node.delete(part);
                    break;
                }

                node = map;

                if (i === 0)
                    node.end--;
            }

            evt._destroy.call(this);
        };

        return evt;
    }

    /**
     * @function
     * @private
     * @name Observer#_emitWildcard
     * @description Scans cache for event paths and emits related events taking in account wildcards.
     * @param {string|number} path - Path.
     * @param {string} type - Type of a change: `set`, `unset`, `insert`, `move`, `remove`.
     * @param {*} value - Value for an event.
     * @param {*} [old] - Old value for an event.
     */
    _emitWildcard(path, type, value, old, to) {
        const pathParts = this._makePathParts(path);
        this._emitWildcardDeeper(this._eventsCache, '', pathParts, 1, type, value, old, to);
        this.emit(type, pathParts, value, old, to);
    }

    /**
     * @function
     * @private
     * @name Observer#_emitWildcardDeeper
     * @description Each node scan against an events cache.
     * @param {object} node - Node in events cache to be scanned.
     * @param {string} path - Constructed event path as a string.
     * @param {Array.<string|number>} pathParts - Original path as an array of string.
     * @param {number} depth - Depth of a scan.
     * @param {string} type - Type of a change: `set` or `unset`.
     * @param {*} value - Value for an event.
     * @param {*} old - Old value for an event.
     */
    _emitWildcardDeeper(node, path, pathParts, depth, type, value, old, to) {
        if (node.end && (depth - 1) === pathParts.length) {
            this.emit(path + ':' + type, pathParts, value, old, to);
        }

        const part = pathParts[pathParts.length - depth];

        // specific
        if (node.has(part)) {
            this._emitWildcardDeeper(node.get(part), (path ? part + '.' + path : part), pathParts, depth + 1, type, value, old, to);
        }

        // wildcard
        if (node.has('*')) {
            this._emitWildcardDeeper(node.get('*'), (path ? '*.' + path : '*'), pathParts, depth + 1, type, value, old, to);
        }
    }

    /**
     * @function
     * @private
     * @name Observer#_makePathParts
     * @description Returns list of strings based on provided path. Uses caching to reduce calls of `split('.')`.
     * @param {string|number} path - Path.
     * @returns {Array.<string|number>} List of strings based on provided path.
     */
    _makePathParts(path, generateLefts = false) {
        let parts = this._pathCache.get(path);
        if (! parts) {
            if (path === null || path === '') {
                parts = [ ];
            } else {
                if (Number.isInteger(path))
                    path = path.toString();

                parts = path.split('.');

                let node = this.data;
                for(let i = 0; i < parts.length; i++) {
                    let part = parts[i];

                    if (Array.isArray(node)) {
                        const int = parseInt(part, 10);
                        if (Number.isInteger(int))
                            parts[i] = part = int;
                    }

                    node = node[part];

                    if (node === null || node === undefined)
                        break;
                }
            }
            this._pathCache.set(path, parts);
        }
        return parts;
    }

    /**
     * @function
     * @private
     * @name Observer#_checkSet
     * @description Check if data should generate `set` events based on new and old data.
     * @param {string|number} path - Path.
     * @param {*} data - New data to be set.
     * @param {*} old - Previous data.
     */
    _checkSet(path, data, old) {
        const dataIsObject = (typeof(data) === 'object' && data instanceof Object);
        const oldIsObject = (typeof(old) === 'object' && old instanceof Object);

        if (dataIsObject) {
            for(let key in data) {
                this._checkSet(path + (path ? '.' : '') + key, data[key], oldIsObject ? old[key] : undefined);
            }
        }

        if (data !== old && ((dataIsObject && ! oldIsObject) || (! dataIsObject && oldIsObject) || (! dataIsObject && ! oldIsObject))) {
            this._emitWildcard(path, 'set', data, old);
        }
    }

    /**
     * @function
     * @private
     * @name Observer#_checkUnset
     * @description Check if data should generate `unset` events based on old and new data.
     * @param {string|number} path - Path.
     * @param {*} old - Previous data.
     * @param {*} data - New data.
     */
    _checkUnset(path, old, data) {
        if (typeof(old) === 'object' && old instanceof Object) {
            const dataIsObject = (typeof(data) === 'object' && data instanceof Object);

            for(let key in old) {
                this._checkUnset(path + (path ? '.' : '') + key, old[key], dataIsObject ? data[key] : undefined);
            }
        }

        if (data === undefined) {
            this._emitWildcard(path, 'unset', old);
        }
    }

    /**
     * @function
     * @private
     * @name Observer#_patchNode
     * @description Patch node of data based on path and new data.
     * @param {string|number} path - Path.
     * @param {object} node - Node of current data.
     * @param {*} data - New partial data to be used for patching.
     */
    _patchNode(path, node, data) {
        // update existing data first
        for(let key in node) {
            if (data[key] === undefined)
                continue;

            let current = node[key];
            let currentIsObject = (typeof(current) === 'object' && current instanceof Object);
            let pathDeeper = path + (path ? '.' : '') + key;

            if (currentIsObject) {
                if (typeof(data[key]) === 'object' && data[key] instanceof Object) {
                    this._patchNode(pathDeeper, current, data[key]);
                } else {
                    node[key] = data[key];
                    this._checkUnset(pathDeeper, current, data[key]);
                    this._emitWildcard(pathDeeper, 'set', data[key], current);
                }
            } else {
                node[key] = data[key];
                this._checkSet(pathDeeper, data[key], current);
            }
        }

        // add new data
        for(let key in data) {
            if (node.hasOwnProperty(key))
                continue;

            let value = data[key];
            let pathDeeper = path + (path ? '.' : '') + key;

            node[key] = value;
            this._checkSet(pathDeeper, value, undefined);

            if (Array.isArray(node)) {
                this._emitWildcard(path, 'insert', node[key], parseInt(key, 10));
            }
        }
    }
}

if (typeof(module) !== 'undefined')
    module.exports = Observer;

if (typeof(window) !== 'undefined')
    window['Observer'] = Observer;

export default Observer;
