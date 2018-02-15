import Injector from './injector';
import StateBox from './stateBox';
import ControllerInformation from './controllerInformation';
import ControllerOptions from './controllerOptions';

declare global {

    type ReduceCallback<T> = (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T;
    type ReduceCallbackWithInit<T, U> = (previousValue: T, currentValue: T, currentIndex: number, initValue: U) => U;
    type MapCallback<T, U> = (value: T, index: number, array: T[]) => U;

    interface ExtendFromArray<T> {
        /**
         * Calls a defined callback function on each element of an array, and returns an array that contains the results.
         * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
         */
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];

        /**
         * Returns the elements of an array that meet the condition specified in a callback function.
         * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
         */
        filter<S extends T>(callbackfn: (value: T, index: number, array: T[]) => value is S): S[];

        /**
         * Returns the elements of an array that meet the condition specified in a callback function.
         * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
         */
        filter(callbackfn: (value: T, index: number, array: T[]) => any): T[];

        /**
         * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
         * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
         * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
         */
        reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T;

        /**
         * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
         * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
         * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
         */
        reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
    }

    interface MyFuncArray<T> {

        // noinspection JSUnusedLocalSymbols
        mapReduce<U, V>(map: MapCallback<T, U>, reduce: ReduceCallback<U>, filter: (arg: U) => boolean, initialVal: V): V;
        // noinspection JSUnusedLocalSymbols
        mapReduce<U, V>(map: MapCallback<T, U>, reduce: ReduceCallbackWithInit<U, V>, filter: (arg: U) => boolean, initialVal: V): V;

        // noinspection JSUnusedLocalSymbols
        mapReduce<U, V>(map: MapCallback<T, U>, reduce: ReduceCallback<U>, initialVal: V): V;
        // noinspection JSUnusedLocalSymbols
        mapReduce<U, V>(map: MapCallback<T, U>, reduce: ReduceCallbackWithInit<U, V>, initialVal: V): V;

        // noinspection JSUnusedLocalSymbols
        mapFilter<U>(map: MapCallback<T, U>, filter: (val: U) => boolean): U[];
        // noinspection JSUnusedLocalSymbols
        filterMap<U>(map: MapCallback<T, U>, filter: (val: T) => boolean): U[];
    }

    interface Array<T> extends MyFuncArray<T>
        {  }

    interface HTMLCollection extends MyFuncArray<Node>, ExtendFromArray<Node>
        {  }

    interface NodeList extends MyFuncArray<Node>, ExtendFromArray<Node>
        {  }
}

export class Framework {
    private _name: string|undefined;
    private _injector: Injector;
    private _scopeInjector: Injector;
    private _currentElem: Promise<any>;
    private _controllers: {[name: string]: ControllerInformation};
    private _parentScope: Framework|undefined;

    constructor() {
        this._injector = new Injector();
        this._scopeInjector = new Injector();
        this._currentElem = Promise.resolve();
        this._controllers = {};
        this._parentScope = undefined;
    }

    get controllers(): {[name: string]: ControllerInformation} {
        return this._controllers;
    }

    addService(name: string, callback: (f: Framework)=>any) {
        this._injector.addService(name, callback)
    }

    addScoped(name: string, callback: (f: Framework)=>any) {
        this._scopeInjector.addScoped(name, callback)
    }

    addConst(name: string, constValue: any) {
        this._injector.addConst(name, constValue);
    }

    _getInjector<T>(name: string): StateBox<T>|undefined {
        console.log(this._name, name);
        let res = this._scopeInjector.get(name) as StateBox<T>|undefined;
        if (res !== undefined) return res;

        if (this._parentScope === undefined) return undefined;
        return this._parentScope._getInjector(name);
    }

    /**
     * Instantiate the named element form all known dependencies
     *
     * @param {string} name
     * @return {T | null | undefined}
     */
    inject<T>(name: string): T|null|undefined {
        let res = this._scopeInjector.get<T>(name);
        if (res !== undefined) return res.call(this);
        if (this._parentScope !== undefined) {
            let stateCall = this._parentScope._getInjector<T>(name);
            if (stateCall !== undefined) {
                this._forceAddScope(name, stateCall.copy());
                return this.inject(name);
            }
        }
        return this._injector.inject(name, this);
    }

    /**
     * force add new dependency. Used for instantiation hierarchy
     * @param {string} name
     * @param {StateBox<T>} box
     * @private
     */
    _forceAddScope<T>(name: string, box: StateBox<T>) {
        this._scopeInjector.forceAdd(name, box);
    }

    /**
     * Instantiate a new Framework with an owned scope but linked to his parent.
     * @returns Framework
     * @param name scope identifier for debug purpose
     */
    newScope(name?: string): Framework {
        let f = new Framework();
        f._name = name;
        f._injector = this._injector;
        f._scopeInjector = new Injector();
        f._parentScope = this;
        f._controllers = this._controllers;
        return f;
    }

    /**
     * used to instantiate a new class and resolve its dependencies
     * @param injects
     * @param func
     * @returns {*}
     */
    cla(injects: string[], func: Function): Promise<any> {
        this._currentElem = Promise.resolve(Reflect.construct(func, injects.map(a => this.inject(a))));
        return this._currentElem;
    }

    /**
     * used to instantiate a new class only one all its dependencies has been loaded
     * @param paramInjects string[]
     * @param func
     * @returns {*}
     */
    classWait<T>(paramInjects: string[], func: Function): Promise<T> {
        let promisesIds: number[] = [];
        let promises: Promise<any>[] = [];
        let injects: any[] = paramInjects.map((elemName, i) => {
            let elem = this.inject(elemName);
            if (elem instanceof Promise) {
                promisesIds.push(i);
                promises.push(elem);
            }
            return elem;
        });

        this._currentElem = Promise.all(promises)
            .then(res => {
                for (let i = res.length - 1; 0 <= i; i--) {
                    injects[promisesIds[i]] = res[i];
                }
                return Promise.resolve(Reflect.construct(func, injects));
            });

        return this._currentElem;
    }

    static setView(element: HTMLElement, toBindElem: Node): any {
        for (let i = element.children.length - 1; 0 <= i; i--) {
            if (element.firstElementChild !== null) {
                element.removeChild(element.firstElementChild);
            }
        }
        element.appendChild(toBindElem);
    }

    /**
     * test if element is undefined or null
     *
     * @param a
     * @return {boolean}
     */
    static isUndef (a: any): boolean {
        return a === undefined || a === null;
    }

    /**
     * if val is defined return val else return orVal
     *
     * @param {T} val
     * @param {U} orVal
     * @return {T | U}
     */
    static or<T, U> (val: T, orVal: U): T|U {
        return Framework.isUndef(val) ? orVal : val ;
    }

    /**
     * if val is defined apply map(val)
     *
     * @param {T | null | undefined} val
     * @param {(a: T) => U} map
     * @return {U | null | undefined}
     */
    static nullMap<T, U>(val: T|null|undefined, map: (a: T)=>U): U|null|undefined {
        if (val === undefined)  return undefined;
        if (val === null)       return null;
        return map(val);
    }

    getCallChain(): Promise<any> {
        return this._currentElem;
    };

    /**
     * addController(
     *      ['d1', 'd2', 'd3'],
     *      { view: 'MyView', name: 'ForcedName' },
     *      class NotDefinitiveName {
     *          ...
     *
     * addController(
     *      { view: 'MyView', name: 'ForcedName' },
     *      ['d1', 'd2', 'd3'],
     *      class NotDefinitiveName {
     *          ...
     *
     * addController(
     *      class MyControllerName {
     *          ...
     *
     * @param arg1 class|Array|Object
     * @param arg2 class|Array|Object|undefined
     * @param arg3 class|undefined
     */
    addController(arg1: string[]|ControllerOptions|Function|ObjectConstructor, arg2?: string[]|ControllerOptions|Function|ObjectConstructor, arg3?: ObjectConstructor) {
        if (arg3 !== undefined) {
            let options: ControllerOptions;
            if (arg1 instanceof Array) {
                options = arg2 as ControllerOptions;
                options.dependencies = arg1;
            } else {
                options = arg1 as ControllerOptions;
                options.dependencies = arg2 as string[];
            }
            this._addController_fallback(arg3, options);
        } else if (arg2 !== undefined) {
            if (arg1 instanceof Array) {
                this._addController_fallback(arg2 as Function|ObjectConstructor, {dependencies: arg1});
            } else {
                this._addController_fallback(arg2 as Function|ObjectConstructor, arg1 as ControllerOptions);
            }
        } else {
            this._addController_fallback(arg1 as Function|ObjectConstructor, {});
        }
    }

    /**
     * Store data to instantiate a component controller
     * @param controller
     * @param options
     * @private
     */
    _addController_fallback (controller: ObjectConstructor|Function, options: ControllerOptions) {
        if (Framework.isUndef(options)) options = {};
        let name = options.name || getClassName(controller);
        this._controllers[name] = {
            dependencies: options.dependencies || [],
            controller: controller,
            view: options.view
        };
    }

    /**
     *
     * @param {NodeSelector} document
     */
    initControllers(document: NodeSelector) {
        const getParentController: (element: HTMLElement) => HTMLElement|null = (element: HTMLElement) => {
            if (element.getAttribute('data-controller') !== null) {
                return element;
            } else if (element.parentElement !== null) {
                return getParentController(element.parentElement)
            } else {
                return null;
            }
        };

        let controllers = (document.querySelectorAll('[data-controller]') as NodeListOf<HTMLElement>)
            .map((controller: HTMLElement) => {
                let controllerIsComponent = 'data-is' in controller.dataset;
                let componentsInside = controller.querySelectorAll('[data-is]');
                let associatedControllers = componentsInside.map(a => ({
                    element: a,
                    controller: getParentController(a as HTMLElement)
                }));
                let ownedComponents = associatedControllers.filterMap(a => a.element, a => a.controller === controller);
                return {
                    controller: controller,
                    components: controllerIsComponent ? [controller] : ownedComponents,
                    priority: controllerIsComponent ? 0 : associatedControllers.length - ownedComponents.length
                };
            });

        let createdControllers: {element: HTMLElement, components: HTMLElement[] }[] = [];

        for (let i = controllers.length;0<i;--i) {
            let controller = controllers.reduce((acc, val)=> acc === null || acc === undefined || acc.priority < val.priority ? val : acc);
            let createdController = this._initController(controller.controller.getAttribute('data-is') as string, controller.controller, controller.components as HTMLElement[]);
            createdControllers.push(createdController);
        }

        for (let i = createdControllers.length;0<i;) {
            let controller = createdControllers[--i];
            let controllerInformation = this._controllers[controller.element.getAttribute('data-controller') as string];
            // create a controller and give it a new scope for each "scope" dependency
            Reflect.construct(  controllerInformation.controller,
                                controllerInformation.dependencies
                                        .map(a => a === 'Framework' || a === 'scope' ?
                                                        this.newScope() :
                                                        (
                                                            a === 'components' ?
                                                                controller.components :
                                                                this.inject(a)
                                                        )
                                        )
            );
        }
    }

    _initController(controllerName: string, controllerElement: HTMLElement, components: HTMLElement[]): { element: HTMLElement, components: HTMLElement[] } {
        let newComponents: HTMLElement[] = components.map(element => {
            let values = element.dataset;
            if (values.is) {
                let newElement = document.createElement(values.is as string);
                Object.keys(values).forEach(property => {
                    newElement.setAttribute('data-'+property, values[property] as string);
                });
                if (element.parentElement) {
                    element.parentElement.insertBefore(newElement, element);
                    element.parentElement.removeChild(element);
                }
                return newElement;
            }
            // fallback value (dead code) to satisfy compiler
            return element;
        });
        return {element: controllerElement, components: newComponents };
    }
}

/**
 * Return the name of the class. Also work with named functions
 *
 * @param {Function} classConstructor
 * @return {string}
 */
function getClassName(classConstructor: Function): string {
    return ((/^(class|function) ?([0-9a-zA-Z_]*)/).exec(classConstructor.toString()) as string[])[2];
}

export const Root = new Framework();
