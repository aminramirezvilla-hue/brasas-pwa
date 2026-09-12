(function () {
  var MORE = [
    { href: "#/carta", label: "Carta / men\u00fa" },
    { href: "#/recetas", label: "Recetas" },
    { href: "#/kardex", label: "Kardex" },
    { href: "#/setup", label: "Sucursal" }
  ];

  function mount() {
    if (document.getElementById("brasas-more-btn")) return true;
    var headerRow = document.querySelector("header .mx-auto.flex");
    if (!headerRow) return false;

    var btn = document.createElement("button");
    btn.id = "brasas-more-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "M\u00e1s secciones");
    btn.textContent = "M\u00e1s";

    var sheet = document.createElement("div");
    sheet.id = "brasas-more-sheet";
    sheet.innerHTML =
      '<div class="dim" data-close="1"></div>' +
      '<div class="panel">' +
      "<h3>M\u00e1s secciones</h3>" +
      '<div class="grid-more">' +
      MORE.map(function (item) {
        return '<a href="' + item.href + '">' + item.label + "</a>";
      }).join("") +
      "</div></div>";

    btn.addEventListener("click", function () {
      sheet.classList.add("open");
    });
    sheet.addEventListener("click", function (e) {
      var t = e.target;
      if (t && (t.getAttribute("data-close") || t.tagName === "A")) {
        sheet.classList.remove("open");
      }
    });

    headerRow.appendChild(btn);
    document.body.appendChild(sheet);
    return true;
  }

  function start() {
    var n = 0;
    var id = setInterval(function () {
      n += 1;
      if (mount() || n > 40) clearInterval(id);
    }, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
