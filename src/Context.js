interface Context {
    import(id: string): Node
}

export default ((()=> {
    function Context() {
        // noinspection JSUnresolvedVariable
        this.doc = (document.currentScript || document._currentScript).ownerDocument;
    }

    Context.prototype.import = function (id) {
        return document.importNode(this.doc.getElementById(id).content, true);
    };
    return Context;
})()) as Context;