(function () {
  var KEY = "brasas-existencias-v1";
  var CATS = [
    ["cortes", "Cortes"],
    ["pollo", "Pollo"],
    ["embutidos", "Embutidos"],
    ["snacks", "Papas y snacks"],
    ["lacteos", "Lácteos"],
    ["despensa", "Despensa"],
    ["salsas", "Salsas y sazón"],
    ["bebidas", "Bebidas"],
    ["empaque", "Empaque"],
    ["limpieza", "Limpieza"],
  ];
  var TURNO = { matutino: "Matutino", vespertino: "Vespertino", nocturno: "Nocturno" };

  function state() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return (parsed && parsed.state) || {};
    } catch (e) {
      return {};
    }
  }

  function fmt(n) {
    var x = Number(n);
    if (!isFinite(x)) return "0";
    if (Math.round(x) === x) return String(x);
    return String(Math.round(x * 100) / 100);
  }

  function nowLabel() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function enc(s) {
    s = String(s == null ? "" : s);
    var map = {
      Á: "\xC1", É: "\xC9", Í: "\xCD", Ó: "\xD3", Ú: "\xDA", Ñ: "\xD1", Ü: "\xDC",
      á: "\xE1", é: "\xE9", í: "\xED", ó: "\xF3", ú: "\xFA", ñ: "\xF1", ü: "\xFC",
      "¿": "\xBF", "¡": "\xA1", "°": "\xB0", "·": "\xB7", "\u2014": "-", "\u2013": "-",
    };
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (map[ch]) out += map[ch];
      else if (ch === "\\" || ch === "(" || ch === ")") out += "\\" + ch;
      else if (ch.charCodeAt(0) < 128) out += ch;
      else out += "?";
    }
    return out;
  }

  function buildPdf(st) {
    var rest = st.restaurant || {};
    var ings = st.ingredients || [];
    var falta = ings.filter(function (i) { return i.status === "falta"; });
    var bajo = ings.filter(function (i) { return i.status === "bajo"; });
    var hay = ings.filter(function (i) { return i.status === "hay"; });
    var pages = [];
    var lines = [];
    var y = 0;

    function newPage() {
      lines = [];
      y = 760;
      pages.push(lines);
    }
    function need(h) {
      if (y - h < 48) newPage();
    }
    function add(size, text, x, leading) {
      need(leading || size + 4);
      lines.push({ op: "text", size: size, text: text, x: x || 40, y: y });
      y -= leading || size + 4;
    }
    function rule() {
      need(8);
      lines.push({ op: "rule", y: y + 6 });
      y -= 6;
    }

    newPage();
    add(16, "A LAS BRASAS", 40, 20);
    add(13, "Acta de compras y existencias", 40, 18);
    add(10, (rest.name || "A las Brasas") + "  |  " + (rest.sucursal || "Chilpancingo, Guerrero"), 40, 14);
    add(10, (rest.address || "") + (rest.phone ? "  |  WhatsApp " + rest.phone : ""), 40, 14);
    add(10, "Encargado: " + (rest.encargado || "-") + "  |  Turno: " + (TURNO[rest.turno] || rest.turno || "-"), 40, 14);
    add(10, "Emitido: " + nowLabel(), 40, 18);
    rule();
    add(11, "Resumen del turno", 40, 16);
    add(10, "FALTA (se acabo): " + falta.length + "    BAJO (pedir hoy): " + bajo.length + "    HAY: " + hay.length + "    Total: " + ings.length, 40, 18);

    add(12, "1. PEDIR AHORA  —  insumos en Falta", 40, 18);
    add(9, "Se acabaron. Comprar antes de ofrecer el platillo.", 40, 14);
    if (!falta.length) add(10, "Ningun insumo en Falta.", 40, 16);
    else {
      add(9, "Insumo                               Unidad          Accion", 40, 13);
      rule();
      falta.forEach(function (i) {
        add(10, pad(i.name, 34) + "  " + pad(i.unitLabel || "", 12) + "  COMPRAR", 40, 14);
      });
    }

    add(12, "2. PEDIR HOY  —  insumos en Bajo", 40, 20);
    add(9, "Todavia hay, pero ya estan bajo el minimo. El encargado de compras ve cuanto queda.", 40, 14);
    if (!bajo.length) add(10, "Ningun insumo en Bajo.", 40, 16);
    else {
      add(9, "Insumo                      Hay      Minimo    Unidad       Reponer", 40, 13);
      rule();
      bajo.forEach(function (i) {
        var have = Number(i.stock) || 0;
        var min = Number(i.min) || 0;
        var needQty = Math.max(0, Math.round((min - have) * 100) / 100);
        add(10, pad(i.name, 24) + "  " + pad(fmt(have), 7) + "  " + pad(fmt(min), 8) + "  " + pad(i.unitLabel || "", 10) + "  " + fmt(needQty), 40, 14);
      });
    }

    add(12, "3. INVENTARIO POR RUBRO", 40, 20);
    CATS.forEach(function (cat) {
      var rows = ings.filter(function (i) { return i.category === cat[0]; });
      if (!rows.length) return;
      add(11, cat[1].toUpperCase(), 40, 16);
      add(9, "Insumo                      Estado     Hay      Minimo    Unidad", 40, 13);
      rule();
      rows.forEach(function (i) {
        var stLabel = i.status === "falta" ? "FALTA" : i.status === "bajo" ? "BAJO" : i.status === "hay" ? "HAY" : "S/D";
        add(10, pad(i.name, 24) + "  " + pad(stLabel, 8) + "  " + pad(fmt(i.stock), 7) + "  " + pad(fmt(i.min), 8) + "  " + (i.unitLabel || ""), 40, 13);
      });
      y -= 6;
    });

    add(9, "Documento operativo de A las Brasas. Sirve para compras y administracion del turno.", 40, 16);
    add(9, "No sustituye kardex contable ni bitacora sanitaria.", 40, 14);
    return pagesToPdf(pages);
  }

  function pad(s, n) {
    s = String(s || "");
    if (s.length > n) return s.slice(0, n - 1) + ".";
    while (s.length < n) s += " ";
    return s;
  }

  function pagesToPdf(pages) {
    var objs = [];
    function addObj(body) {
      objs.push(body);
      return objs.length;
    }
    var fontId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    var boldId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    var pageIds = [];
    var contentIds = [];
    pages.forEach(function (pageLines) {
      var stream = "BT\n";
      pageLines.forEach(function (L) {
        if (L.op === "text") {
          var font = L.size >= 12 ? "F2" : "F1";
          stream += "/" + font + " " + L.size + " Tf\n";
          stream += "1 0 0 1 " + L.x + " " + L.y + " Tm (" + enc(L.text) + ") Tj\n";
        }
      });
      stream += "ET\n";
      pageLines.forEach(function (L) {
        if (L.op === "rule") stream += "0.7 0.15 0.15 RG 40 " + L.y + " 532 0.6 re S\n";
      });
      contentIds.push(addObj("<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream"));
    });
    pages.forEach(function () { pageIds.push(null); });
    var pagesId = addObj("PLACEHOLDER");
    pages.forEach(function (_, i) {
      pageIds[i] = addObj(
        "<< /Type /Page /Parent " + pagesId + " 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 " +
          fontId + " 0 R /F2 " + boldId + " 0 R >> >> /Contents " + contentIds[i] + " 0 R >>"
      );
    });
    var kids = pageIds.map(function (id) { return id + " 0 R"; }).join(" ");
    objs[pagesId - 1] = "<< /Type /Pages /Kids [" + kids + "] /Count " + pageIds.length + " >>";
    var catalogId = addObj("<< /Type /Catalog /Pages " + pagesId + " 0 R >>");
    var out = "%PDF-1.4\n";
    var xref = [0];
    objs.forEach(function (body, idx) {
      xref.push(out.length);
      out += idx + 1 + " 0 obj\n" + body + "\nendobj\n";
    });
    var startxref = out.length;
    out += "xref\n0 " + (objs.length + 1) + "\n";
    out += "0000000000 65535 f \n";
    xref.slice(1).forEach(function (pos) {
      out += String(pos).padStart(10, "0") + " 00000 n \n";
    });
    out += "trailer << /Size " + (objs.length + 1) + " /Root " + catalogId + " 0 R >>\nstartxref\n" + startxref + "\n%%EOF";
    return out;
  }

  function downloadPdf() {
    var pdf = buildPdf(state());
    var bytes = new Uint8Array(pdf.length);
    for (var i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 255;
    var blob = new Blob([bytes], { type: "application/pdf" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Acta-compras-A-las-Brasas.pdf";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  function onActa() {
    return /#\/expediente/.test(location.hash || "");
  }

  function syncBtn() {
    var btn = document.getElementById("brasas-acta-pdf");
    if (!onActa()) {
      if (btn) btn.remove();
      return;
    }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "brasas-acta-pdf";
      btn.type = "button";
      btn.textContent = "PDF para compras";
      btn.style.cssText =
        "position:fixed;left:12px;right:12px;bottom:92px;z-index:45;min-height:56px;border:0;border-radius:12px;background:#f7f1e6;color:#171411;font:600 16px Barlow,system-ui,sans-serif";
      btn.addEventListener("click", downloadPdf);
      document.body.appendChild(btn);
    }
  }

  setInterval(syncBtn, 700);
  window.addEventListener("hashchange", syncBtn);
})();
