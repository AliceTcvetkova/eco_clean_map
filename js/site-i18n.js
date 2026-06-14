(function () {
  var STORAGE_KEY = "site-lang";
  var DEFAULT_LANG = "en";

  function getLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "ru" ? "ru" : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function setLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang === "ru" ? "ru" : DEFAULT_LANG);
    } catch (e) {
      /* ignore */
    }
  }

  function mergeDict(partsKey) {
    var merged = {};
    var parts = window[partsKey];
    if (!parts) return merged;
    parts.forEach(function (part) {
      Object.keys(part).forEach(function (key) {
        merged[key] = part[key];
      });
    });
    return merged;
  }

  var textDict = {};
  var attrDict = {};
  var snapshots = [];
  var attrSnapshots = [];

  function refreshDicts() {
    textDict = mergeDict("SITE_I18N_RU_PARTS");
    attrDict = window.SITE_I18N_RU_ATTRS || {};
  }

  function shouldSkipNode(node) {
    var parent = node.parentElement;
    if (!parent) return true;
    var tag = parent.tagName;
    return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT";
  }

  function captureSnapshots() {
    if (snapshots.length) return;
    refreshDicts();
    var walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (shouldSkipNode(node)) continue;
      snapshots.push({ node: node, original: node.nodeValue });
    }
    document.querySelectorAll("[alt],[aria-label],[title]").forEach(function (el) {
      ["alt", "aria-label", "title"].forEach(function (attr) {
        var val = el.getAttribute(attr);
        if (!val) return;
        attrSnapshots.push({ el: el, attr: attr, original: val });
      });
    });
    var titleEl = document.querySelector("title");
    if (titleEl) {
      attrSnapshots.push({ el: titleEl, attr: "text", original: titleEl.textContent });
    }
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      attrSnapshots.push({ el: metaDesc, attr: "content", original: metaDesc.getAttribute("content") });
    }
  }

  function translateTextValue(original, dict) {
    var trimmed = original.trim();
    if (!trimmed) return original;
    if (dict[trimmed]) {
      var lead = original.match(/^\s*/)[0];
      var trail = original.match(/\s*$/)[0];
      return lead + dict[trimmed] + trail;
    }
    if (dict[original]) return dict[original];
    return original;
  }

  function applyTextNodes(dict) {
    snapshots.forEach(function (item) {
      if (!item.node.isConnected) return;
      item.node.nodeValue = translateTextValue(item.original, dict);
    });
  }

  function applyAttrs(dict) {
    attrSnapshots.forEach(function (item) {
      if (!item.el.isConnected) return;
      if (item.attr === "text") {
        item.el.textContent = dict[item.original] || item.original;
        return;
      }
      if (item.attr === "content") {
        item.el.setAttribute("content", dict[item.original] || item.original);
        return;
      }
      item.el.setAttribute(item.attr, dict[item.original] || item.original);
    });
  }

  function walkDynamicRoots(dict) {
    var roots = document.querySelectorAll("[data-locus-compose], [data-locus-body], [data-locus-choices]");
    roots.forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        if (shouldSkipNode(node)) continue;
        var trimmed = node.nodeValue.trim();
        if (trimmed && dict[trimmed]) {
          var lead = node.nodeValue.match(/^\s*/)[0];
          var trail = node.nodeValue.match(/\s*$/)[0];
          node.nodeValue = lead + dict[trimmed] + trail;
        }
      }
    });
  }

  function applyLang(lang) {
    captureSnapshots();
    refreshDicts();
    document.documentElement.lang = lang === "ru" ? "ru" : "en";

    if (lang === "ru") {
      applyTextNodes(textDict);
      applyAttrs(attrDict);
      walkDynamicRoots(textDict);
    } else {
      snapshots.forEach(function (item) {
        if (item.node.isConnected) item.node.nodeValue = item.original;
      });
      attrSnapshots.forEach(function (item) {
        if (!item.el.isConnected) return;
        if (item.attr === "text") item.el.textContent = item.original;
        else if (item.attr === "content") item.el.setAttribute("content", item.original);
        else item.el.setAttribute(item.attr, item.original);
      });
    }

    var switchBtn = document.querySelector("[data-lang-switch]");
    if (switchBtn) {
      switchBtn.textContent = lang === "ru" ? "EN" : "RU";
      switchBtn.setAttribute(
        "aria-label",
        lang === "ru" ? "Switch to English" : "Переключить на русский"
      );
    }

    document.dispatchEvent(new CustomEvent("site:langchange", { detail: { lang: lang } }));
  }

  function injectLangSwitch() {
    if (document.querySelector("[data-lang-switch]")) return;
    var nav = document.querySelector(".site-header__nav");
    var minimal = document.querySelector(".site-header--minimal");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.langSwitch = "";
    btn.addEventListener("click", function () {
      var next = getLang() === "ru" ? "en" : "ru";
      setLang(next);
      applyLang(next);
    });
    if (nav) {
      btn.className = "site-header__lang";
      nav.appendChild(btn);
    } else if (minimal) {
      btn.className = "site-header__lang site-header__lang--minimal";
      minimal.appendChild(btn);
    }
  }

  window.SiteI18n = {
    getLang: getLang,
    setLang: setLang,
    applyLang: applyLang,
    t: function (enText) {
      if (getLang() !== "ru") return enText;
      refreshDicts();
      return textDict[enText] || enText;
    },
    refreshDynamic: function () {
      if (getLang() === "ru") {
        refreshDicts();
        walkDynamicRoots(textDict);
      }
    }
  };

  injectLangSwitch();
  applyLang(getLang());
})();
