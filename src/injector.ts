import {Framework} from './framework';
import StateBox from './stateBox';
import Callable from './callable';

type InjectLambda<T> = (framework: Framework) => T;

export default class Injector {
    private _injector: {[key: string]: Callable<any>};

    constructor() {
        this._injector = {};
    }

    addService<T>(name: string, callback: InjectLambda<T>) {
        this._injector[name] =  {call: callback};
    }

    addScoped<T>(name: string, callback: InjectLambda<T>) {
        this._injector[name] = new StateBox(callback);
    }

    addConst<T>(name: string, value: T) {
        this._injector[name.toUpperCase()] = { call:() => value };
    }

    inject<T>(name: string, env: Framework): T|undefined {
        let box = this._injector[name];
        if (!box) return undefined;
        return this._injector[name].call(env);
    }

    get<T>(name: string): Callable<T>|undefined {
        return this._injector[name];
    }

    forceAdd<T>(name: string, stateBox: StateBox<T>) {
        this._injector[name] = stateBox;
    }
}
