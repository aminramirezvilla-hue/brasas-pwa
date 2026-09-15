(function () {
  var KEY = "brasas-existencias-v1";
  var CATS = [
    ["cortes", "CORTES"],
    ["pollo", "POLLO"],
    ["embutidos", "EMBUTIDOS"],
    ["snacks", "PAPAS Y SNACKS"],
    ["lacteos", "LACTEOS"],
    ["despensa", "DESPENSA"],
    ["salsas", "SALSAS Y SAZON"],
    ["bebidas", "BEBIDAS"],
    ["empaque", "EMPAQUE"],
    ["limpieza", "LIMPIEZA"],
  ];
  var TURNO = { matutino: "Matutino", vespertino: "Vespertino", nocturno: "Nocturno" };
  var L = 36;
  var R = 576;

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
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + "  " + p(d.getHours()) + ":" + p(d.getMinutes());
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
  function clip(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "." : s;
  }
  function buildPdf(st) {
    var rest = st.restaurant || {};
    var ings = st.ingredients || [];
    var falta = ings.filter(function (i) { return i.status === "falta"; });
    var bajo = ings.filter(function (i) { return i.status === "bajo"; });
    var hay = ings.filter(function (i) { return i.status === "hay"; });
    var pages = [];
    var ops = [];
    var y = 0;
    function newPage() { ops = []; y = 748; pages.push(ops); }
    function need(h) { if (y - h < 52) newPage(); }
    function fill(x, yy, w, h, rgb) { ops.push({ op: "rect", x: x, y: yy, w: w, h: h, rgb: rgb }); }
    function strokeLine(yy) { ops.push({ op: "line", y: yy, rgb: [0.77, 0.12, 0.12] }); }
    function text(size, str, x, yy, bold, rgb) {
      ops.push({ op: "text", size: size, text: str, x: x, y: yy, bold: !!bold, rgb: rgb || [0.09, 0.08, 0.07] });
    }
    newPage();
    text(18, "A LAS BRASAS", L, y, true, [0.77, 0.12, 0.12]); y -= 20;
    text(13, "Acta de compras y existencias", L, y, true); y -= 16;
    text(10, (rest.name || "A las Brasas") + "  |  " + (rest.sucursal || "Chilpancingo, Guerrero"), L, y); y -= 13;
    text(10, (rest.address || "") + (rest.phone ? "  |  WhatsApp " + rest.phone : ""), L, y); y -= 13;
    text(10, "Encargado: " + (rest.encargado || "-") + "   |   Turno: " + (TURNO[rest.turno] || rest.turno || "-"), L, y); y -= 13;
    text(10, "Emitido: " + nowLabel(), L, y); y -= 14;
    strokeLine(y); y -= 18;
    text(11, "Resumen del turno", L, y, true); y -= 16;
    var chips = [
      ["FALTA  " + falta.length, [0.77, 0.12, 0.12]],
      ["BAJO  " + bajo.length, [0.71, 0.33, 0.04]],
      ["HAY  " + hay.length, [0.13, 0.45, 0.22]],
      ["TOTAL  " + ings.length, [0.09, 0.08, 0.07]],
    ];
    var cx = L;
    chips.forEach(function (c) { fill(cx, y - 4, 86, 18, c[1]); text(9, c[0], cx + 8, y + 2, true, [1, 1, 1]); cx += 94; });
    y -= 28;
    function headerBar(yy, rgb, cols) {
      fill(L, yy - 5, R - L, 18, rgb);
      cols.forEach(function (c) { text(8, c[0], c[1], yy + 1, true, [1, 1, 1]); });
    }
    function zebra(i, rgb) { if (i % 2 === 0) fill(L, y - 4, R - L, 16, rgb); }
    need(70);
    text(12, "1. PEDIR AHORA  -  se acabaron", L, y, true); y -= 14;
    text(9, "Comprar antes de ofrecer el platillo. No hay existencia.", L, y); y -= 16;
    headerBar(y, [0.77, 0.12, 0.12], [["INSUMO", L + 8], ["UNIDAD", 330], ["ACCION", 470]]);
    y -= 20;
    if (!falta.length) { text(10, "Ningun insumo en Falta.", L + 8, y); y -= 16; }
    else {
      falta.forEach(function (ing, i) {
        need(20); zebra(i, [0.99, 0.91, 0.91]);
        text(10, clip(ing.name, 36), L + 8, y);
        text(9, clip(ing.unitLabel || "", 22), 330, y);
        text(9, "COMPRAR", 470, y, true, [0.77, 0.12, 0.12]);
        y -= 16;
      });
    }
    y -= 10; need(70);
    text(12, "2. PEDIR HOY  -  inventario bajo", L, y, true); y -= 14;
    text(9, "Todavia hay. Compras ve cuanto queda y cuanto falta para el minimo.", L, y); y -= 16;
    headerBar(y, [0.71, 0.33, 0.04], [["INSUMO", L + 8], ["HAY", 268], ["MINIMO", 328], ["UNIDAD", 400], ["REPONER", 500]]);
    y -= 20;
    if (!bajo.length) { text(10, "Ningun insumo en Bajo.", L + 8, y); y -= 16; }
    else {
      bajo.forEach(function (ing, i) {
        need(20); zebra(i, [1, 0.96, 0.88]);
        var have = Number(ing.stock) || 0;
        var min = Number(ing.min) || 0;
        var needQty = Math.max(0, Math.round((min - have) * 100) / 100);
        var repo = needQty > 0 ? fmt(needQty) : "revisar";
        text(10, clip(ing.name, 28), L + 8, y);
        text(10, fmt(have), 268, y);
        text(10, fmt(min), 328, y);
        text(9, clip(ing.unitLabel || "", 18), 400, y);
        text(10, repo, 500, y, true, [0.71, 0.33, 0.04]);
        y -= 16;
      });
    }
    y -= 10; need(40);
    text(12, "3. INVENTARIO POR RUBRO", L, y, true); y -= 18;
    CATS.forEach(function (cat) {
      var rows = ings.filter(function (i) { return i.category === cat[0]; });
      if (!rows.length) return;
      need(50);
      text(11, cat[1], L, y, true); y -= 16;
      headerBar(y, [0.09, 0.08, 0.07], [["INSUMO", L + 8], ["ESTADO", 250], ["HAY", 320], ["MINIMO", 380], ["UNIDAD", 450]]);
      y -= 20;
      rows.forEach(function (ing) {
        need(20);
        var st = ing.status === "falta" ? "FALTA" : ing.status === "bajo" ? "BAJO" : ing.status === "hay" ? "HAY" : "S/D";
        var rgb = ing.status === "falta" ? [0.99, 0.91, 0.91] : ing.status === "bajo" ? [1, 0.96, 0.88] : [0.96, 0.95, 0.93];
        var ink = ing.status === "falta" ? [0.77, 0.12, 0.12] : ing.status === "bajo" ? [0.71, 0.33, 0.04] : [0.13, 0.45, 0.22];
        fill(L, y - 4, R - L, 16, rgb);
        text(10, clip(ing.name, 28), L + 8, y);
        text(9, st, 250, y, true, ink);
        text(10, fmt(ing.stock), 320, y);
        text(10, fmt(ing.min), 380, y);
        text(9, clip(ing.unitLabel || "", 20), 450, y);
        y -= 16;
      });
      y -= 10;
    });
    need(28);
    text(8, "Documento operativo de A las Brasas para administracion y compras del turno.", L, y); y -= 11;
    text(8, "No sustituye kardex contable ni bitacora sanitaria NOM-251.", L, y);
    return pagesToPdf(pages);
  }
  function pagesToPdf(pages) {
    var objs = [];
    function addObj(body) { objs.push(body); return objs.length; }
    var fontId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    var boldId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    var contentIds = [];
    pages.forEach(function (pageOps, pi) {
      var stream = "";
      pageOps.forEach(function (L) {
        if (L.op === "rect") {
          stream += L.rgb[0] + " " + L.rgb[1] + " " + L.rgb[2] + " rg\n";
          stream += L.x + " " + L.y + " " + L.w + " " + L.h + " re f\n";
        } else if (L.op === "line") {
          stream += L.rgb[0] + " " + L.rgb[1] + " " + L.rgb[2] + " RG 1.2 w\n";
          stream += "36 " + L.y + " m 576 " + L.y + " l S\n";
        }
      });
      stream += "BT\n";
      pageOps.forEach(function (L) {
        if (L.op === "text") {
          var font = L.bold ? "F2" : "F1";
          var rgb = L.rgb || [0, 0, 0];
          stream += rgb[0] + " " + rgb[1] + " " + rgb[2] + " rg\n";
          stream += "/" + font + " " + L.size + " Tf\n";
          stream += "1 0 0 1 " + L.x + " " + L.y + " Tm (" + enc(L.text) + ") Tj\n";
        }
      });
      stream += "ET\n";
      stream += "BT /F1 8 Tf 0.4 0.4 0.4 rg 1 0 0 1 36 28 Tm (A las Brasas  -  acta de compras) Tj 1 0 0 1 500 28 Tm (Pag. " + (pi + 1) + "/" + pages.length + ") Tj ET\n";
      contentIds.push(addObj("<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream"));
    });
    var pagesId = addObj("PLACEHOLDER");
    var pageIds = pages.map(function (_, i) {
      return addObj("<< /Type /Page /Parent " + pagesId + " 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 " + fontId + " 0 R /F2 " + boldId + " 0 R >> >> /Contents " + contentIds[i] + " 0 R >>");
    });
    objs[pagesId - 1] = "<< /Type /Pages /Kids [" + pageIds.map(function (id) { return id + " 0 R"; }).join(" ") + "] /Count " + pageIds.length + " >>";
    var catalogId = addObj("<< /Type /Catalog /Pages " + pagesId + " 0 R >>");
    var out = "%PDF-1.4\n";
    var xref = [0];
    objs.forEach(function (body, idx) { xref.push(out.length); out += idx + 1 + " 0 obj\n" + body + "\nendobj\n"; });
    var startxref = out.length;
    out += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
    xref.slice(1).forEach(function (pos) { out += String(pos).padStart(10, "0") + " 00000 n \n"; });
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
  window.brasasBuildActaPdf = buildPdf;
  function onActa() { return /#\/expediente/.test(location.hash || ""); }
  function syncBtn() {
    var btn = document.getElementById("brasas-acta-pdf");
    if (!onActa()) { if (btn) btn.remove(); return; }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "brasas-acta-pdf";
      btn.type = "button";
      btn.textContent = "PDF para compras";
      btn.style.cssText = "position:fixed;left:12px;right:12px;bottom:92px;z-index:45;min-height:56px;border:0;border-radius:12px;background:#f7f1e6;color:#171411;font:600 16px Barlow,system-ui,sans-serif";
      btn.addEventListener("click", downloadPdf);
      document.body.appendChild(btn);
    }
  }
  setInterval(syncBtn, 700);
  window.addEventListener("hashchange", syncBtn);
})();
