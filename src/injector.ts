import Framework from "./framework";

export default class Injector {
    private injector: {[key: string]: (f: Framework)=>any};
    constructor() {
        this.injector = {};
    }

    addService<T>(name: string, callback: (f: Framework)=>T) {
        this.injector[name] = callback;
    }

    addScoped<T>(name: string, callback: (f: Framework)=>T) {
        this.injector[name] = (env) => {
            const a = callback(env);
            this.injector[name] = () => a;
            return a;
        };
    }

    addConst<T>(name: string, value: T) {
        this.injector[name.toUpperCase()] = () => value;
    }

    inject<T>(name: string): (f: Framework)=>T {
        return this.injector[name];
    }
}
