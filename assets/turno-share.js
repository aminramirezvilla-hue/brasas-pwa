(function () {
  var KEY = "brasas-existencias-v1";
  var KIND = "brasas-turno";
  var PHONE = "527471557796";

  function persist() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function state() {
    var data = persist();
    return data && data.state ? data.state : null;
  }

  function buildFile(s) {
    return {
      kind: KIND,
      version: 1,
      exportedAt: new Date().toISOString(),
      sucursal: s.restaurant ? s.restaurant.sucursal : "",
      encargado: s.restaurant ? s.restaurant.encargado : "",
      turno: s.restaurant ? s.restaurant.turno : "",
      payload: {
        restaurant: s.restaurant,
        ingredients: s.ingredients || [],
        movements: s.movements || [],
        checklists: s.checklists || {},
        incidents: s.incidents || [],
        setupDone: !!s.setupDone,
      },
    };
  }

  function fileName() {
    return "turno-brasas-" + new Date().toISOString().slice(0, 10) + ".json";
  }

  async function enviar() {
    var s = state();
    if (!s || !s.ingredients) {
      alert("No hay turno guardado en este celular.");
      return;
    }
    var json = JSON.stringify(buildFile(s), null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var name = fileName();
    var file = new File([blob], name, { type: "application/json" });
    var text =
      "Turno A las Brasas · " +
      ((s.restaurant && s.restaurant.encargado) || "encargado") +
      "\nAbre Acta → Cargar turno y elige este archivo.";
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file], text: text }))) {
        await navigator.share({ files: [file], title: "Turno A las Brasas", text: text });
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    window.open(
      "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text + "\n\nEl archivo se descargó. Adjúntalo en este chat."),
      "_blank",
    );
  }

  function cargarFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result || ""));
        if (!data || data.kind !== KIND || !data.payload || !data.payload.ingredients) {
          alert("Ese archivo no es un turno de A las Brasas.");
          return;
        }
        var ok = window.confirm(
          "¿Cargar el turno de " +
            (data.encargado || "encargado") +
            "? Esto reemplaza los registros de este celular.",
        );
        if (!ok) return;
        var current = persist() || { state: {}, version: 0 };
        current.state = Object.assign({}, current.state || {}, data.payload);
        current.version = current.version || 0;
        localStorage.setItem(KEY, JSON.stringify(current));
        window.location.reload();
      } catch (e) {
        alert("No se pudo leer el archivo.");
      }
    };
    reader.readAsText(file);
  }

  function onActa() {
    var hash = location.hash || "";
    return hash.indexOf("expediente") !== -1;
  }

  function box() {
    return document.getElementById("brasas-turno-box");
  }

  function mount() {
    if (!onActa()) {
      var old = box();
      if (old) old.remove();
      return;
    }
    if (box()) return;
    var main = document.querySelector("main");
    if (!main) return;
    var wrap = document.createElement("div");
    wrap.id = "brasas-turno-box";
    wrap.style.cssText = "margin:0 0 1.25rem;padding:1rem;border-radius:12px;background:#261f1a;color:#f7f1e6;box-shadow:0 0 0 1px rgb(255 255 255 / 0.16)";
    wrap.innerHTML =
      '<p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#c41e1e">Entre celulares</p>' +
      '<p style="margin:.5rem 0 0;font-size:16px;color:#c9bfb3">El encargado envía el archivo del turno. El administrador lo carga aquí y ve las mismas existencias.</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
      '<button type="button" id="brasas-turno-send" style="min-height:48px;padding:0 16px;border:0;border-radius:10px;background:#c41e1e;color:#fff7f2;font:600 15px Barlow,system-ui,sans-serif">Enviar turno</button>' +
      '<button type="button" id="brasas-turno-load" style="min-height:48px;padding:0 16px;border:0;border-radius:10px;background:#322a24;color:#f7f1e6;font:600 15px Barlow,system-ui,sans-serif">Cargar turno</button>' +
      '<input id="brasas-turno-file" type="file" accept="application/json,.json" style="display:none" />' +
      "</div>";
    main.insertBefore(wrap, main.firstChild);
    wrap.querySelector("#brasas-turno-send").addEventListener("click", function () {
      enviar();
    });
    wrap.querySelector("#brasas-turno-load").addEventListener("click", function () {
      wrap.querySelector("#brasas-turno-file").click();
    });
    wrap.querySelector("#brasas-turno-file").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      ev.target.value = "";
      cargarFile(file);
    });
  }

  setInterval(mount, 600);
  window.addEventListener("hashchange", mount);
})();
