const NAME_TO_DOMAIN: Record<string, string> = {
  amazon:           "amazon.in",
  flipkart:         "flipkart.com",
  croma:            "croma.com",
  "reliance digital": "reliancedigital.in",
  "tata cliq":      "tatacliq.com",
  myntra:           "myntra.com",
  nykaa:            "nykaa.com",
  meesho:           "meesho.com",
  snapdeal:         "snapdeal.com",
  zepto:            "zepto.com",
  blinkit:          "blinkit.com",
  jiomart:          "jiomart.com",
  "vijay sales":    "vijaysales.com",
  shopclues:        "shopclues.com",
  paytm:            "paytmmall.com",
  ipshopy:          "ipshopy.com",
  "manglam world":  "manglamworld.com",
  toyoos:           "toyoos.com",
  desertcart:       "desertcart.in",
  lifelong:         "lifelongonline.com",
  samsung:          "samsung.com",
  apple:            "apple.com",
  boat:             "boat-lifestyle.com",
  "mi store":       "mi.com",
  xiaomi:           "mi.com",
};

export function getStoreIconUrl(merchantName: string, productUrl: string): string {
  // Direct store URL — extract domain and use favicon service
  if (productUrl && !productUrl.includes("google.com")) {
    try {
      const { hostname } = new URL(productUrl);
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch { /* fall through */ }
  }

  // Map from merchant name
  const lower = merchantName.toLowerCase();
  for (const [key, domain] of Object.entries(NAME_TO_DOMAIN)) {
    if (lower.includes(key)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    }
  }

  // Best-effort guess from name
  const slug = lower.replace(/[^a-z0-9]/g, "");
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=32`;
}
