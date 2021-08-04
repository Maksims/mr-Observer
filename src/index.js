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
 * @param {object} [data] - Object for initial data. Defaults to { };
 * @property {object} data Data that obsserver is modifying. This data should not be modified by application logic.
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
     * @param {string[]} path - Path to the value changed as a mutable array of strings. Do not modify this array.
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
     * @param {string[]} path - Path to the value changed as a mutable array of strings. Do not modify this array.
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
     * @function
     * @name Observer#set
     * @description Set data by a specific path. If in process of setting existing object values will be unset, it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.
     * @param {string} [path] - Path in data to be set to. If path is not provided, it will set the root of observer.
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

        let old;
        if (path) {
            old = node[parts[parts.length - 1]];
            node[parts[parts.length - 1]] = data;
        } else {
            old = this.data;
            this.data = data;
        }

        this._checkUnset(path, old, data);
        this._checkSet(path, data, old);
    }

    /**
     * @function
     * @name Observer#patch
     * @description Patch data by a specific path. In process of setting, it will not unset values that are not provided in patch data. But still can trigger unset events if object is changed to something else, so it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.
     * @param {string} [path] - Path in data to be patched. If path is not provided, it will patch the root of observer.
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

        if (path) {
            current = node[parts[parts.length - 1]];
        } else {
            current = this.data;
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
     * @name Observer#unset
     * @description Unset data by a specific path. It will emit `unset` events with related paths. If path is not provided, it will reset root of data to empty object.
     * @param {string} [path] - Path in data to be unset. If path is not provided, it will set root of observer to empty object.
     * @example
     * obj.unset('position.z');
     */
    unset(path = '') {
        if (! path) {
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
        delete node[parts[parts.length - 1]];
    }

    /**
     * @function
     * @name Observer#get
     * @description Get data by a specific path. Returns raw data based on path. If path is not provided will return root data of observer. This data should not be modified by application logic, and is subject to change by obseerver functions.
     * @param {string} [path] - Path of data to be returned.
     * @returns {*} Data based on provided path.
     * @example
     * let x = obj.get('position.x');
     */
    get(path = '') {
        if (! path) return this.data;

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
        const path = name.replace(/:(set|unset)$/, '');
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
     * @param {string} path - Path as a string.
     * @param {string} type - Type of a change: `set` or `unset`.
     * @param {*} value - Value for an event.
     * @param {*} [old] - Old value for an event.
     */
    _emitWildcard(path, type, value, old) {
        const pathParts = this._makePathParts(path);
        this._emitWildcardDeeper(this._eventsCache, '', pathParts, 1, type, value, old);
        this.emit(type, pathParts, value, old);
    }

    /**
     * @function
     * @private
     * @name Observer#_emitWildcardDeeper
     * @description Each node scan against an events cache.
     * @param {object} node - Node in events cache to be scanned.
     * @param {string} path - Constructed event path as a string.
     * @param {string[]} pathParts - Original path as an array of string.
     * @param {number} depth - Depth of a scan.
     * @param {string} type - Type of a change: `set` or `unset`.
     * @param {*} value - Value for an event.
     * @param {*} old - Old value for an event.
     */
    _emitWildcardDeeper(node, path, pathParts, depth, type, value, old) {
        if (node.end && (depth - 1) === pathParts.length) {
            this.emit(path + ':' + type, pathParts, value, old);
        }

        const part = pathParts[pathParts.length - depth];

        // specific
        if (node.has(part)) {
            this._emitWildcardDeeper(node.get(part), (path ? part + '.' + path : part), pathParts, depth + 1, type, value, old);
        }

        // wildcard
        if (node.has('*')) {
            this._emitWildcardDeeper(node.get('*'), (path ? '*.' + path : '*'), pathParts, depth + 1, type, value, old);
        }
    }

    /**
     * @function
     * @private
     * @name Observer#_makePathParts
     * @description Returns list of strings based on provided path. Uses caching to reduce calls of `split('.')`.
     * @param {string} path - Path as a string.
     * @returns {string[]} List of strings based on provided path.
     */
    _makePathParts(path, generateLefts = false) {
        let parts = this._pathCache.get(path);
        if (! parts) {
            parts = path.split('.');
            this._pathCache.set(path, parts);
        }
        return parts;
    }

    /**
     * @function
     * @private
     * @name Observer#_checkSet
     * @description Check if data should generate `set` events based on new and old data.
     * @param {string} path - Path as a string.
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
     * @param {string} path - Path as a string.
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
     * @param {string} path - Path as a string.
     * @param {object} node - Node of current data.
     * @param {*} data - New partial data to be used for patching.
     */
    _patchNode(path, node, data) {
        const dataIsObject = (typeof(data) === 'object' && data instanceof Object);

        if (dataIsObject) {
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
            }
        }
    }
}

if (typeof(module) !== 'undefined')
    module.exports = Observer;

if (typeof(window) !== 'undefined')
    window['Observer'] = Observer;

export default Observer;
