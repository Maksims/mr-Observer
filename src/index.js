import EventEmitter from 'mr-eventemitter';

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
 * @classdesc Observer that provides sync events when data is changed. For data-centric application this allows to build more flat architecture where different logical parts can subscribe to observer and do not need to interact between each other, by that decoupling logic, improving modularity.
 * @param {object} [data] - Object for initial data. Defaults to { };
 * @property {object} data Data that obsserver is modifying. This data should not be modified by application logic.
 * @example
 * let earth = new Observer({ age: 4.543, population: 7.594 });
 *
 * element.textContent = earth.get('population');
 *
 * earth.on('population:set', function (value) {
 *     element.textContent = value;
 * });
 *
 * earth.set('population', 7.595); // triggers "population:set" event
 */
class Observer extends EventEmitter {
    constructor(data) {
        super();

        this.data = data || { };
        this.pathCache = new Map();
    }

    /**
     * @event
     * @name Observer#[path]:set
     * @description Fired when value have been set/changed on a specified path.
     * @param {*} value - New value.
     * @param {*} old - Old value.
     * @example
     * obj.on('population:set', function (value) {
     *     element.textContent = value;
     * });
     */

    /**
     * @event
     * @name Observer#*:set
     * @description Fired when any value have been set/changed.
     * @param {string} path - Path of value changed.
     * @param {*} value - New value.
     * @param {*} old - Old value.
     * @example
     * obj.on('*:set', function (path, value, old) {
     *     console.log(`"${path}" has been changed to: "${value}", from "${old}"`);
     * });
     */

    /**
     * @event
     * @name Observer#[path]:unset
     * @description Fired when value have been unset on a specified path.
     * @param {*} old - Old value.
     * @example
     * obj.on('population:unset', function (old) {
     *     console.log("'population' has been unset");
     * });
     */

    /**
     * @event
     * @name Observer#*:unset
     * @description Fired when any value have been unset.
     * @param {string} path - Path of value unset.
     * @param {*} old - Old value.
     * @example
     * obj.on('*:unset', function (path, old) {
     *     console.log(`"${path}" has been unset`);
     * });
     */

    /**
     * @function
     * @name Observer#set
     * @description Set data by path. If in process of setting existing object values will be unset, it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.
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
     * @description Patch data by path. In process of setting, it will not unset values that are not provided in patch data. But still can trigger unset events if object is changed to something else, so it will emit `unset` events with related paths. New and modified values will trigger `set` events with related paths.
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
                this.emit(path + ':set', data, current);
                this.emit('*:set', path, data, current);
            }
        } else if (dataIsObject) {
            node[parts[parts.length - 1]] = data;
            this._checkSet(path, data, current);
        } else if (current !== data) {
            node[parts[parts.length - 1]] = data;
            this.emit(path + ':set', data, current);
            this.emit('*:set', path, data, current);
        }
    }

    /**
     * @function
     * @name Observer#unset
     * @description Unset data by path. It will emit `unset` events with related paths. If path is not provided, it will reset root of data to empty object.
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
     * @description Get data by path. Returns raw data based on path. If path is not provided will return root data of observer. This data should not be modified by application logic, and is subject to change by obseerver functions.
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
        this.pathCache.clear();
        this.off();
    }

    /**
     * @function
     * @private
     * @name Observer#_makePathParts
     * @description Returns list of strings based on provided path. Uses caching to reduce calls of `split('.')`.
     * @param {string} path - Path as a string.
     * @returns {string[]} List of strings based on provided path.
     */
    _makePathParts(path) {
        let parts = this.pathCache.get(path);
        if (! parts) {
            parts = path.split('.');
            this.pathCache.set(path, parts);
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
            this.emit(path + ':set', data, old);
            this.emit('*:set', path, data, old);
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
            this.emit(path + ':unset', old);
            this.emit('*:unset', path, old);
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
                        this.emit(pathDeeper + ':set', data[key], current);
                        this.emit('*:set', pathDeeper, data[key], current);
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
