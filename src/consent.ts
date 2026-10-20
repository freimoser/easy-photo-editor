/**
 * Google-Analytics-Opt-in-Hook (gleiches Muster wie auf den anderen freimoser-Seiten).
 * Solange GA_ID leer ist, wird nichts geladen und kein Banner gezeigt.
 * Mit ID: Banner erscheint, GA lädt erst nach „Zustimmen“, Entscheidung nur im localStorage.
 */
const GA_ID = "";
const KEY = "epe-consent";

function loadGa(): void {
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  w.gtag("js", new Date());
  w.gtag("config", GA_ID, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

export function initConsent(): void {
  if (!GA_ID) return;
  const v = localStorage.getItem(KEY);
  if (v === "yes") return loadGa();
  if (v === "no") return;
  const bar = document.createElement("div");
  bar.className = "consent";
  bar.innerHTML = `<p>Darf ich anonyme Nutzungsstatistik (Google Analytics) laden? <a href="./datenschutz.html">Datenschutz</a></p><div class="row-actions"><button class="btn primary" data-v="yes" type="button">Zustimmen</button><button class="btn ghost" data-v="no" type="button">Ablehnen</button></div>`;
  bar.addEventListener("click", (e) => {
    const v2 = (e.target as HTMLElement).dataset.v;
    if (!v2) return;
    localStorage.setItem(KEY, v2);
    bar.remove();
    if (v2 === "yes") loadGa();
  });
  document.body.appendChild(bar);
}

(window as unknown as { epeConsentReset: () => void }).epeConsentReset = () => {
  localStorage.removeItem(KEY);
  initConsent();
};
