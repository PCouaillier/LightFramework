import {Framework} from "./framework";

type InjectLambda<T> = (framework: Framework) => T;

interface Callable<T> {
    call: InjectLambda<T>;
}

export default class StateBox<T> implements Callable<T> {
    private _callback : Function;
    private _value : undefined|T;

    constructor(callback: Function, value?: T) {
        this._callback = callback;
        this._value = value;
    }
    public call(env: Framework) {
        if (this._value === undefined) {
            this._value = this._callback(env) as T;
        }
        return this._value;
    }
    public copy(): StateBox<T> {
        return new StateBox<T>(this._callback, this._value);
    }

    public hasValue(): boolean {
        return this._value!==undefined;
    }
}
