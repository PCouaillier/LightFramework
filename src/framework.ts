import Injector from "./injector";

export default class Framework {
    private _injector: Injector;
    private _scopeInjector: Injector;
    private _currentElem: Promise<any>;
    private _controllers: {[key: string]: {dependencies: string[], controller: object|Function, view: any}};
    private _parentScope: Framework|null;

    constructor() {
        this._injector = new Injector();
        this._scopeInjector = this._injector;
        this._currentElem = Promise.resolve();
        this._controllers = {};
        this._parentScope = null;
    }

    addService(name: string, callback: (...any)=>any) {
        this._injector.addService(name, callback)
    }

    addScoped(name: string, callback: (...any)=>any) {
        this._scopeInjector.addScoped(name, callback)
    }

    addConst(name: string, constValue: any) {
        this._injector.addConst(name, constValue);
    }

    inject(name: string) {
        return Framework.or(
            Framework.or(
                Framework.nullMap(this._scopeInjector.inject(name), a=>a(this)),
                Framework.nullMap(this._parentScope, a=>a._inject(name, this))
            ),
            this._injector.inject(name)(this),
        );
    }

    _inject(name: string, originScope: Framework) {
        return Framework.or(
            Framework.nullMap(Framework.nullMap(this._scopeInjector, a=>a.inject(name)), a=>a(originScope)),
            Framework.nullMap(Framework.nullMap(this._parentScope, a=>a._inject(name, originScope)), a=>a(originScope))
        )
    }

    /**
     * Instantiate a new Framework with an owned scope but linked to his parent.
     *
     * @returns Framework
     */
    newScope(): Framework {
        let f = new Framework();
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
    cla(injects: string[], func: object|Function): any {
        this._currentElem = Promise.resolve(Reflect.construct(func, injects.map(a => this.inject(a))));
        return this._currentElem;
    }

    /**
     * used to instantiate a new class only one all its dependencies has been loaded
     * @param injects
     * @param func
     * @returns {*}
     */
    classWait(injects: string[], func: object|Function): any {
        let promisesIds = [];
        let promises = [];

        for (let i = injects.length - 1; 0 <= i; i--) {
            let elem = this.inject(injects[i]);
            injects[i] = elem;
            if (elem instanceof Promise) {
                promisesIds.push(i);
                promises.push(elem);
            }
        }

        this._currentElem = Promise.all(promises)
            .then(res => {
                for (let i = res.length - 1; 0 <= i; i--) {
                    injects[promisesIds[i]] = res[i];
                }
                return Promise.resolve(Reflect.construct(func, injects));
            });

        return this._currentElem;
    }

    static setView(element: HTMLElement, toBindElem): any {
        for (let i = element.children.length - 1; 0 <= i; i--) {
            element.removeChild(element.firstElementChild);
        }
        element.appendChild(toBindElem);
    };

    static isUndef (a: any): boolean {
        return a === undefined || a === null;
    }
    static or<T, U> (val: T, orVal: U): T|U {
        return Framework.isUndef(val) ? orVal : val ;
    }

    static nullMap<T, U>(val: T, map: (a: T)=>U): U|null|undefined {
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
     *      class NotDefiniveName {
     *          ...
     *
     * addController(
     *      { view: 'MyView', name: 'ForcedName' },
     *      ['d1', 'd2', 'd3'],
     *      class NotDefiniveName {
     *          ...
     *
     * addController(
     *      class MyControllerName {
     *          ...
     *
     *
     * @param arg1 class|Array|Object
     * @param arg2 class|Array|Object|undefined
     * @param arg3 class|undefined
     */
    addController(arg1: string[]|ControllerOptions|Function|ObjectConstructor, arg2?: string[]|ControllerOptions|Function|ObjectConstructor, arg3?: ObjectConstructor) {
        if (arg3 !== undefined) {
            let options;
            if (arg1 instanceof Array) {
                options = arg2;
                options.dependencies = arg1;
            } else {
                options = arg1;
                options.dependencies = arg2;
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
}

function getClassName(classConstructor: any): string {
    return /^(class|function) ?([0-9a-zA-Z_]*)/.exec(classConstructor.toString())[2];
}

interface ControllerOptions {
    dependencies?: string[],
    name?: string,
    view?: any
}