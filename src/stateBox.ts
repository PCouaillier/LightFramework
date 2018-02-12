import {Framework} from "./framework";

type InjectLambda<T> = (framework: Framework) => T;

interface Callable<T> {
    call: InjectLambda<T>;
}

export default class StateBox<T> implements Callable<T> {
    private _callback : InjectLambda<T>;
    public value : undefined|T;

    constructor(callback: InjectLambda<T>, value?: T) {
        this._callback = callback;
        this.value = value;
    }
    public call(framework?: Framework): T {
        if (this.value === undefined) {
            this.value = this._callback(framework as Framework);
        }
        return this.value;
    }
    public copy(): StateBox<T> {
        return new StateBox<T>(this._callback, this.value);
    }
}
