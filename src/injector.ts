import {Framework} from "./framework";

type InjectLambda<T> = (framework: Framework) => T;

export default class Injector {
    private injector: {[key: string]: InjectLambda<any>};

    constructor() {
        this.injector = {};
    }

    addService<T>(name: string, callback: InjectLambda<T>) {
        this.injector[name] = callback;
    }

    addScoped<T>(name: string, callback: InjectLambda<T>) {
        this.injector[name] = (env) => {
            const a = callback(env);
            this.injector[name] = () => a;
            return a;
        };
    }

    addConst<T>(name: string, value: T) {
        this.injector[name.toUpperCase()] = () => value;
    }

    inject<T>(name: string): InjectLambda<T> {
        return this.injector[name] as InjectLambda<T>;
    }
}
