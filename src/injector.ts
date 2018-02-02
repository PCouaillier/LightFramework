export default class Injector {
    private injector: {[key: string]: (Framework)=>any};
    constructor() {
        this.injector = {};
    }

    addService<T>(name: string, callback: (Framework)=>T) {
        this.injector[name] = callback;
    }

    addScoped<T>(name: string, callback: (Framework)=>T) {
        this.injector[name] = (env) => {
            const a = callback(env);
            this.injector[name] = () => a;
            return a;
        };
    }

    addConst<T>(name: string, value: T) {
        this.injector[name.toUpperCase()] = () => value;
    }

    inject<T>(name: string): (Framework)=>T {
        return this.injector[name];
    }
}
