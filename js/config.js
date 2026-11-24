// Site settings in one place. Fill an empty value and the feature turns on, no other edits needed.
window.BABA_CONFIG = {
  price: 250,               // deck price in ILS
  shipping: 0,              // shipping fee in ILS: 0 = "כולל משלוח", null = not shown (Vered 22.11: 250 incl. shipping)
  maxQty: 5,

  payUrl: "",               // Grow payment page link. Empty = pay with Bit / PayBox below
  bitPhone: "058-5515948",  // Bit / PayBox number
  bitName: "אלון ג'ייקוב",
  waPhone: "972509333025",  // WhatsApp number that receives orders (international format)

  metaPixelId: "",          // Meta Pixel ID (digits only). Empty = pixel not loaded
  ga4Id: "G-T3BDKWD4XH"               // Google Analytics 4 ID (G-XXXXXXX). Empty = GA4 not loaded
};
