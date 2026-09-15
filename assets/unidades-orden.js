(function () {
  var KEY = "brasas-existencias-v1";
  var FLAG = "brasas-unidades-orden-v1";
  if (localStorage.getItem(FLAG) === "1") return;

  var raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(FLAG, "1");
    return;
  }

  try {
    var data = JSON.parse(raw);
    var st = data.state || data;
    var spec = {
      bon: { min: 8, max: 30, dailyUse: 10 },
      pfr: { min: 10, max: 40, dailyUse: 12 },
      pga: { min: 8, max: 30, dailyUse: 8 },
    };
    (st.ingredients || []).forEach(function (ing) {
      var s = spec[ing.id];
      if (!s) return;
      ing.unit = "orden";
      ing.unitLabel = "orden";
      ing.min = s.min;
      ing.max = s.max;
      ing.dailyUse = s.dailyUse;
      ing.stock = 0;
      ing.status = "falta";
    });

    var saleQty = {
      "r-pfr": { pfr: 1 },
      "r-pga": { pga: 1 },
      "r-bo-6": { bon: 1 },
      "r-bo-12": { bon: 2 },
      "r-bo-kg": { bon: 3 },
    };
    (st.recipes || []).forEach(function (r) {
      var map = saleQty[r.id];
      (r.lines || []).forEach(function (line) {
        if (map && map[line.ingredientId] != null) {
          line.qty = map[line.ingredientId];
          return;
        }
        if ((line.ingredientId === "pfr" || line.ingredientId === "pga") && line.qty < 1) {
          line.qty = 1;
        }
      });
    });

    localStorage.setItem(KEY, JSON.stringify(data));
    localStorage.setItem(FLAG, "1");
  } catch (e) {}
})();
