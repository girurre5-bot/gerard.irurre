/* Tiny template runtime for the portfolio pages: {{holes}}, <sc-for>, <sc-if>, on* handlers, setState. */
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) { this.state = Object.assign({}, this.state, patch); render(); }
    renderVals() { return {}; }
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const get = (scope, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  const fill = (str, scope) => str.replace(HOLE, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
  const single = (str) => { const m = str.trim().match(/^\{\{\s*([^}]+?)\s*\}\}$/); return m ? m[1] : null; };

  function walk(node, scope, out) {
    if (node.nodeType === 3) { out.appendChild(document.createTextNode(fill(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      const list = get(scope, single(node.getAttribute('list')) || '') || [];
      const as = node.getAttribute('as') || 'item';
      list.forEach((item, i) => {
        const s = Object.assign(Object.create(scope), { [as]: item, $index: i });
        node.childNodes.forEach((c) => walk(c, s, out));
      });
      return;
    }
    if (tag === 'sc-if') {
      const p = single(node.getAttribute('value') || '');
      const v = p ? get(scope, p) : node.getAttribute('value');
      if (v && v !== 'false') node.childNodes.forEach((c) => walk(c, scope, out));
      return;
    }
    const el = node.namespaceURI === 'http://www.w3.org/1999/xhtml' ? document.createElement(node.localName) : document.createElementNS(node.namespaceURI, node.localName);
    for (const a of Array.from(node.attributes)) {
      if (a.name.startsWith('hint-')) continue;
      const p = single(a.value);
      if (a.name.startsWith('on') && p) {
        const fn = get(scope, p);
        if (typeof fn === 'function') el.addEventListener(a.name.slice(2).toLowerCase(), fn);
        continue;
      }
      el.setAttribute(a.name, fill(a.value, scope));
    }
    const kids = node.content ? node.content.childNodes : node.childNodes;
    kids.forEach((c) => walk(c, scope, el));
    out.appendChild(el);
  }

  let comp, tpl, root;
  function render() {
    const vals = comp.renderVals() || {};
    const frag = document.createDocumentFragment();
    tpl.content.childNodes.forEach((c) => walk(c, vals, frag));
    root.replaceChildren(frag);
  }

  window.addEventListener('DOMContentLoaded', () => {
    tpl = document.getElementById('dc-template');
    root = document.getElementById('dc-root');
    const Klass = window.__DCComponent || DCLogic;
    comp = new Klass({});
    render();
    document.documentElement.classList.add('dc-ready');
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  });
})();
