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
let define = (name, dependencies, func) => {
    if (dependencies.every(a => doneDependencies[a] !== undefined)) {
        func.apply(this, dependencies.map(a => doneDependencies[a]));
        doneDependencies[name] = doneDependencies.exports;
        doneDependencies.exports = {};
    } else {
        dependencies.push({name: name, dependencies: dependencies, func: func});
    }
};
