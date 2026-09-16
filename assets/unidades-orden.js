(function () {
  var KEY = "brasas-existencias-v1";
  try {
    var raw = localStorage.getItem(KEY);
    if (!raw) return;
    var data = JSON.parse(raw);
    var st = data.state || data;
    var spec = {
      bon: { min: 8, max: 30, dailyUse: 10 },
      pfr: { min: 10, max: 40, dailyUse: 12 },
      pga: { min: 8, max: 30, dailyUse: 8 },
    };
    var changed = false;
    (st.ingredients || []).forEach(function (ing) {
      var s = spec[ing.id];
      if (!s) return;
      var already = ing.unit === "orden" && ing.unitLabel === "orden";
      if (already) return;
      var wasBag = ing.unit === "bolsa" || /bolsa/i.test(ing.unitLabel || "");
      ing.unit = "orden";
      ing.unitLabel = "orden";
      ing.min = s.min;
      ing.max = s.max;
      ing.dailyUse = s.dailyUse;
      if (wasBag) {
        ing.stock = 0;
        ing.status = "falta";
      }
      changed = true;
    });
    if (changed) localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {}
})();
