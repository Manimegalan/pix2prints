/* ═══════════════════════════════════════════════════════════════════════════
   Pix2Prints — central configuration
   ---------------------------------------------------------------------------
   Ported from the original plain-JS `window.PIX2PRINTS` global into an ES
   module. Both the Catalog page and the Editor page import the single
   default export below.

   Adding a product is a config change only — no page component change is
   required.
   ═══════════════════════════════════════════════════════════════════════════ */
const PIX2PRINTS = {

  /* ── App config — swappable per environment at deploy time ──────────────
     The upload endpoint must be an https:// URL: a page served over HTTPS
     cannot POST to an http:// endpoint (mixed content is blocked).          */
  app: {
    uploadEndpoint: "https://api.example.com/uploads",
    dpi: 300,

    /* Currency symbol prefixed to every product price. */
    currency: "₹",

    /* Default images shown in each product card's carousel. A product may
       override these with its own `images: [...]` array. Used for display
       only — not part of the print/export pipeline. */
    carouselImages: [
      "https://m.media-amazon.com/images/I/61Wk67xls6L._AC_UF894,1000_QL80_.jpg",
      "https://abhishekid.com/cdn/shop/files/Fridge_magnet_showing_both_sides_202608052036.jpg"
    ]
  },

  /* ── Filter buckets, in display order. "all" is prepended automatically. ─ */
  categories: [
    { id: "magnets",   label: "Magnets"   },
    { id: "keychains", label: "Keychains" },
    { id: "acrylic",   label: "Acrylic"   },
    { id: "other",     label: "Other"     }
  ],

  /* ── Product catalog. Array order = display order. ────────────────────────
     shape: "circle" -> diameterMm ;  "rect" -> widthMm × heightMm
     quantity: 1, or 2 for a front+back product (rect only). Two photos are
     printed side by side on one sheet, then the print is folded in half so
     one becomes the front and the other the back of the finished item.
     Each half = widthMm / quantity wide at full heightMm.
     price: number in the currency above (display only).                     */
  products: [
    {
      slug: "round-magnet-58",
      name: "Round Magnet / Badge",
      subtitle: "Big size",
      category: "magnets",
      shape: "circle",
      diameterMm: 58,
      quantity: 1,
      price: 199,
      badge: "Bestseller",
      preview: "assets/previews/round-magnet-58.svg",
      description: "Our largest button. Great on fridges, bags and pin boards."
    },
    {
      slug: "round-magnet-44",
      name: "Round Magnet / Badge",
      subtitle: "Small size",
      category: "magnets",
      shape: "circle",
      diameterMm: 44,
      quantity: 1,
      price: 149,
      preview: "assets/previews/round-magnet-44.svg",
      description: "The classic compact badge for giveaways and events."
    },
    {
      slug: "round-keychain-44",
      name: "Round Keychain",
      subtitle: "Standard size",
      category: "keychains",
      shape: "circle",
      diameterMm: 44,
      quantity: 1,
      price: 179,
      preview: "assets/previews/round-keychain-44.svg",
      description: "A pocket-sized round keyring you can carry every day."
    },
    {
      slug: "square-magnet-50",
      name: "Square Magnet",
      subtitle: "Standard size",
      category: "magnets",
      shape: "rect",
      widthMm: 50,
      heightMm: 50,
      quantity: 1,
      price: 169,
      preview: "assets/previews/square-magnet-50.svg",
      description: "A crisp square magnet for photos and artwork."
    },
    {
      slug: "acrylic-magnet-70x95",
      name: "Acrylic Magnet",
      subtitle: "Premium finish",
      category: "acrylic",
      shape: "rect",
      widthMm: 70,
      heightMm: 95,
      quantity: 1,
      price: 349,
      preview: "assets/previews/acrylic-magnet-70x95.svg",
      description: "Glossy portrait acrylic with real depth and shine."
    },
    {
      /* Locked decision: Acrylic Keychain is filed under "keychains". */
      slug: "acrylic-keychain-30x44",
      name: "Acrylic Keychain",
      subtitle: "Front & back photo",
      category: "keychains",
      shape: "rect",
      widthMm: 30,
      heightMm: 44,
      quantity: 2,
      price: 299,
      preview: "assets/previews/acrylic-keychain-30x44.svg",
      description: "One keychain, two photos — front and back after folding."
    },
    {
      slug: "polaroid-70",
      name: "Polaroid",
      subtitle: "Classic style",
      category: "other",
      shape: "rect",
      widthMm: 70,
      heightMm: 70,
      quantity: 1,
      price: 189,
      preview: "assets/previews/polaroid-70.svg",
      description: "A square instant-photo look for a retro keepsake."
    },
    {
      slug: "mirror-opener-58",
      name: "Mirror & Opener",
      subtitle: "Dual function",
      category: "other",
      shape: "circle",
      diameterMm: 58,
      quantity: 1,
      price: 249,
      preview: "assets/previews/mirror-opener-58.svg",
      description: "A pocket mirror on one side, bottle opener on the other."
    }
  ]
};

export default PIX2PRINTS;
