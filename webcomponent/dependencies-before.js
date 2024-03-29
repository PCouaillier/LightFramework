(function () {
    if (('registerElement' in document
            && 'import' in document.createElement('link')
            && 'content' in document.createElement('template')) === false)
    {
        let e = document.createElement('script');
        e.src = '/bower_components/webcomponentsjs/webcomponents-lite.js';
        document.body.appendChild(e);
    }
})();

Array.prototype.mapReduce = function (map, reduce, filter, initialVal) {
//                          function (map, reduce, initialVal) {
    if (initialVal === undefined) {
        initialVal = filter;
        filter = undefined;
    }
    return this.reduce((acc, a, originalArray) =>
        {
            let b = map(a);
            if (filter === undefined || filter(b)) {
                return reduce(acc, b, originalArray);
            }
            return acc
        },
        initialVal
    );
};

(() => {
    Array.prototype.mapFilter = function (map, filter) {
        return this.mapReduce(map, (acc, a) => acc.push(a), filter, []);
    };

    let applyArrayFunc = (aClass) => {
        aClass.prototype.map = Array.prototype.map;
        aClass.prototype.filter = Array.prototype.filter;
        aClass.prototype.reduce = Array.prototype.reduce;
        aClass.prototype.mapFilter = Array.prototype.mapFilter;
        aClass.prototype.includes = Array.prototype.includes;
    };
    if (HTMLCollection) applyArrayFunc(HTMLCollection);
    if (NodeList) applyArrayFunc(NodeList);
})();

const define = (() => {
    /** @type {{dependencies: {name: string, dependencies: string[], func: function}[], doneDependencies: {require: null, exports: {}}} */
    const amd = {
        dependencies: [],
        doneDependencies: {'require': null, 'exports': {}},
    };

    const define = (name, dependencies, func) => {
        if (dependencies.every(a => amd.doneDependencies[a] !== undefined)) {
            let exports = {};
            func.apply(func, [undefined, exports].concat(dependencies.map(a => amd.doneDependencies[a])));
            amd.doneDependencies[name] = exports;
        } else {
            amd.dependencies.push({ name, dependencies, func });
        }
        while (true) {
            const dependencyIndex = amd.dependencies.findIndex(a => a.dependencies.every(a => amd.doneDependencies[a] !== undefined));
            if (dependencyIndex === -1) {
                break;
            }
            const dependency = amd.dependencies.splice(dependencyIndex, 1)[0];
            const exports = {};
            dependency.func.apply(this, [undefined, exports].concat(dependency.dependencies.map(a => amd.doneDependencies[a])));
            amd.doneDependencies[dependency.name] = exports;
        }
    };

    return define;
})();
