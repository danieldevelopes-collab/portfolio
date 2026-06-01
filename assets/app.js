// Tiny, dependency-free enhancements.
// 1. Live filter on the landing grid (useful as the portfolio grows).
(function () {
  const input = document.getElementById("filter");
  if (!input) return;
  const cards = Array.from(document.querySelectorAll(".card[data-search]"));
  const count = document.getElementById("result-count");
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const hit = !q || card.dataset.search.includes(q);
      card.style.display = hit ? "" : "none";
      if (hit) shown++;
    }
    if (count) count.textContent = String(shown);
  };
  input.addEventListener("input", apply);
  // focus filter on "/"
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });
})();
