import Injector from 'injector';

type InjectLambda<T> = (framework: Framework) => T;

export class Framework {
    private _injector: Injector;
    private _scopeInjector: Injector;
    private _currentElem: Promise<any>;
    private _controllers: {[name: string]: ControllerInformation};
    private _parentScope: Framework|null;

    constructor() {
        this._injector = new Injector();
        this._scopeInjector = this._injector;
        this._currentElem = Promise.resolve();
        this._controllers = {};
        this._parentScope = null;
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

    inject<T>(name: string): T|null|undefined {
        return Framework.or(
            Framework.or(
                Framework.nullMap<InjectLambda<T>, T>(this._scopeInjector.inject<T>(name), (injectLambda: InjectLambda<T>) => injectLambda(this)),
                Framework.nullMap<Framework, T|null|undefined>(this._parentScope, (framework: Framework)=>framework._inject<T>(name, this))
            ),
            this._injector.inject<T>(name)(this)
        );
    }

    _inject<T>(name: string, originScope: Framework): T|null|undefined {
        return Framework.or(
            Framework.nullMap(Framework.nullMap(this._scopeInjector, a=>a.inject(name)), (injectLambda: InjectLambda<T>)=>injectLambda(originScope)),
            Framework.nullMap(Framework.nullMap(this._parentScope, a=>a._inject(name, originScope)), (injectLambda: InjectLambda<T>)=>injectLambda(originScope))
        );
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

    static isUndef (a: any): boolean {
        return a === undefined || a === null;
    }

    static or<T, U> (val: T, orVal: U): T|U {
        return Framework.isUndef(val) ? orVal : val ;
    }

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
}

function getClassName(classConstructor: Function): string {
    return (/^(class|function) ?([0-9a-zA-Z_]*)/.exec(classConstructor.toString()) as string[])[2];
}

export interface ControllerInformation {
    dependencies: string[],
    controller: Function,
    view: any
}

export interface ControllerOptions {
    dependencies?: string[],
    name?: string,
    view?: any
}

export const Root = new Framework();
