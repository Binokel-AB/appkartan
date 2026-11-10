// Roller och beslut: allt innehåll står i data/roller.json. Att byta person är en rad där.
(async function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const main = document.getElementById("rMain");
  let R;
  try {
    const r = await fetch("data/roller.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    R = await r.json();
  } catch (e) {
    main.innerHTML = '<div class="card err">Sidan kunde inte läsa uppgifterna. Ladda om sidan.</div>';
    return;
  }
  main.innerHTML = `
    <section class="sec">
      <p class="lead">${esc(R.ingress)}</p>
      <div class="roles">${R.roller.map((r) => `
        <article class="role r-${esc(r.id)}">
          <header><h2>${esc(r.namn)}</h2><span class="who">${esc(r.person)}</span></header>
          <p>${esc(r.kort)}</p>
          <ul>${r.godkanner.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
        </article>`).join("")}</div>
    </section>
    <section class="sec">
      <h2>Så går en ändring till</h2>
      <ol class="flow">${R.flode.map((f) => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join("")}</ol>
    </section>
    <section class="sec">
      <h2>Så tar en ny person över en roll</h2>
      <ul class="open">${R.ta_over.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <p class="small">Uppdaterad ${esc(R.uppdaterad)}.</p>
    </section>`;
})();
