(function () {
  var PHONE = "527471557796";
  var KEY = "brasas-existencias-v1";

  function ingredients() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return (parsed && parsed.state && parsed.state.ingredients) || [];
    } catch (e) {
      return [];
    }
  }

  function groups() {
    var all = ingredients();
    return {
      falta: all.filter(function (i) { return i.status === "falta"; }),
      bajo: all.filter(function (i) { return i.status === "bajo"; }),
    };
  }

  function fmtQty(n) {
    var num = Number(n);
    if (!isFinite(num)) return "0";
    if (Math.round(num) === num) return String(num);
    return String(Math.round(num * 100) / 100);
  }

  function lineFalta(i) {
    return "• " + i.name + " — 0 " + (i.unitLabel || "") + " (FALTA)";
  }

  function lineBajo(i) {
    var unit = i.unitLabel || "";
    var hay = fmtQty(i.stock);
    var extra = i.min > 0 ? " · mín " + fmtQty(i.min) + " " + unit : "";
    return "• " + i.name + " — hay " + hay + " " + unit + extra;
  }

  function buildHref() {
    var g = groups();
    if (!g.falta.length && !g.bajo.length) return "";
    var parts = ["Pedido A las Brasas"];
    if (g.falta.length) {
      parts.push("", "FALTA:");
      g.falta.forEach(function (i) { parts.push(lineFalta(i)); });
    }
    if (g.bajo.length) {
      parts.push("", "BAJO (existencia actual):");
      g.bajo.forEach(function (i) { parts.push(lineBajo(i)); });
    }
    return "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(parts.join("\n"));
  }

  document.addEventListener(
    "click",
    function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var a = t.closest("a[href*='wa.me']");
      if (!a) return;
      var next = buildHref();
      if (!next) return;
      a.setAttribute("href", next);
    },
    true,
  );

  function syncFab() {
    var href = buildHref();
    var g = groups();
    var fab = document.getElementById("brasas-wa-fab");
    var onlyBajo = g.bajo.length && !g.falta.length;
    if (!onlyBajo || !href) {
      if (fab) fab.remove();
      return;
    }
    if (!fab) {
      fab = document.createElement("a");
      fab.id = "brasas-wa-fab";
      fab.target = "_blank";
      fab.rel = "noreferrer";
      fab.textContent = "Pedir bajos por WhatsApp";
      fab.style.cssText =
        "position:fixed;left:12px;right:12px;bottom:92px;z-index:40;min-height:56px;display:flex;align-items:center;justify-content:center;background:#f0a12a;color:#1c1204;font:600 16px Barlow,system-ui,sans-serif;border-radius:12px;text-decoration:none";
      document.body.appendChild(fab);
    }
    fab.href = href;
  }

  setInterval(syncFab, 700);
  window.addEventListener("storage", syncFab);
})();
