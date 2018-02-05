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

let dependencies = [];
let doneDependencies = {'require': null, 'exports': {}};

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

    applyArrayFunc = (aClass) => {
        aClass.prototype.map = Array.prototype.map;
        aClass.prototype.filter = Array.prototype.filter;
        aClass.prototype.reduce = Array.prototype.reduce;
        aClass.prototype.mapFilter = Array.prototype.mapFilter;
        aClass.prototype.includes = Array.prototype.includes;
    };

    applyArrayFunc(HTMLCollection);
    applyArrayFunc(NodeList);
})();

let define = (name, dependencies, func) => {
    if (dependencies.every(a => doneDependencies[a] !== undefined)) {
        func.apply(this, dependencies.map(a => doneDependencies[a]));
        doneDependencies[name] = doneDependencies.exports;
        doneDependencies.exports = {};
    } else {
        dependencies.push({name: name, dependencies: dependencies, func: func});
    }
};
