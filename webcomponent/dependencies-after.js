for(let i=dependencies.length;0 < i;--i) {
    let dependency = dependencies.find(dependency=>dependency.dependencies.every(a=>doneDependencies[a]!==undefined));
    // noinspection ThisExpressionReferencesGlobalObjectJS
    doneDependencies[dependency.name] = dependency.func.apply(this, dependencies.map(a=>doneDependencies[a]));
}
dependencies = [];

const Framework = doneDependencies['framework'].default;
const Root = doneDependencies['framework'].Root;

Root.initControllers();