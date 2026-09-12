/* Precios de carta 2026-09-11 — solo estos dos platillos */
(function () {
  var MAP = {
    "1/2 kg de arrachera": "$500.00",
    "Tuétanos": "$180.00",
  };

  function apply() {
    var items = document.querySelectorAll("li");
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      var title = li.querySelector("p");
      if (!title) continue;
      var name = (title.textContent || "").trim();
      var next = MAP[name];
      if (!next) continue;
      var price = li.querySelector(".text-banner") || li.querySelectorAll("p")[1];
      if (price) price.textContent = next;
    }
  }

  apply();
  setInterval(apply, 600);
  document.addEventListener("click", function () {
    setTimeout(apply, 200);
  });
})();
