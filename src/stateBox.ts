import {Framework} from "./framework";

type InjectLambda<T> = (framework: Framework) => T;

interface Callable<T> {
    call: InjectLambda<T>;
}

export default class StateBox<T> implements Callable<T> {
    private _callback : InjectLambda<T>;
    public _value : undefined|T;

    constructor(callback: InjectLambda<T>) {
        this._callback = callback;
        this._value = undefined;
    }
    public call(framework?: Framework): T {
        if (this._value === undefined) {
            this._value = this._callback(framework as Framework);
        }
        return this._value;
    }
    public copy(): StateBox<T> {
        let sb = new StateBox<T>(this._callback);
        sb._value = this._value;
        return sb;
    }
}
