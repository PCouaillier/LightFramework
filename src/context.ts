declare global {
    interface Document { _currentScript?: HTMLScriptElement | SVGScriptElement | null; }
}
export default class Context {
    private doc: Document;

    constructor() {
        let a = (document.currentScript || document._currentScript);
        if (a === null || a === undefined) throw 'error: currentScript unavailable.';
        this.doc = a.ownerDocument;
    }

    import(id: string) {
        let d = this.doc.getElementById(id);
        if(d) return document.importNode((d as HTMLTemplateElement).content, true);
        else return null;
    }
}
