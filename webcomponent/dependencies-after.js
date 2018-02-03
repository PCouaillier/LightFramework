for(let i=dependencies.length;0 < i;--i) {
    let dependency = dependencies.find(a=>a.dependencies.every(a=>doneDependencies[a]!==undefined));
    doneDependencies[dependency.name] = dependency.func.apply(this, dependencies.map(a=>doneDependencies[a]));
}
dependencies = [];
