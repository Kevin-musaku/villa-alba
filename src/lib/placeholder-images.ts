/**
 * Placeholder imagery only. Every URL here is a stand-in for real photography
 * of Villa Alba and will be replaced through the admin panel (Phase B) once
 * the owner uploads real photos. Do not treat these as final assets.
 */

export type PlaceholderImage = {
  src: string;
  alt: string;
};

export const heroImage: PlaceholderImage = {
  src: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2400&auto=format&fit=crop",
  alt: "Villa in Franciacorta immersa nel verde, con piscina",
};

export const villaRoomImages: Record<
  | "master"
  | "double1"
  | "double2"
  | "twin"
  | "bathrooms"
  | "cucina"
  | "sala_da_pranzo"
  | "soggiorno"
  | "piscina"
  | "esterno",
  PlaceholderImage
> = {
  master: {
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1800&auto=format&fit=crop",
    alt: "Camera matrimoniale indipendente con bagno privato",
  },
  double1: {
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1800&auto=format&fit=crop",
    alt: "Camera matrimoniale luminosa",
  },
  double2: {
    src: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?q=80&w=1800&auto=format&fit=crop",
    alt: "Camera matrimoniale con bagno privato",
  },
  twin: {
    src: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1800&auto=format&fit=crop",
    alt: "Camera con due letti singoli",
  },
  bathrooms: {
    src: "https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=1800&auto=format&fit=crop",
    alt: "Bagno ampio e luminoso",
  },
  cucina: {
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1800&auto=format&fit=crop",
    alt: "Cucina open space attrezzata",
  },
  sala_da_pranzo: {
    src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1800&auto=format&fit=crop",
    alt: "Sala da pranzo",
  },
  soggiorno: {
    src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1800&auto=format&fit=crop",
    alt: "Soggiorno luminoso",
  },
  piscina: {
    src: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?q=80&w=1800&auto=format&fit=crop",
    alt: "Piscina privata",
  },
  esterno: {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1800&auto=format&fit=crop",
    alt: "Giardino e tavolo da pranzo esterno",
  },
};

export const galleryImages: {
  category: "villa" | "vigneti" | "lago" | "cantine";
  image: PlaceholderImage;
}[] = [
  {
    category: "villa",
    image: {
      src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1800&auto=format&fit=crop",
      alt: "Interno della villa",
    },
  },
  {
    category: "villa",
    image: {
      src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1800&auto=format&fit=crop",
      alt: "Camera da letto della villa",
    },
  },
  {
    category: "vigneti",
    image: {
      src: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1800&auto=format&fit=crop",
      alt: "Filari di vigneti in Franciacorta",
    },
  },
  {
    category: "vigneti",
    image: {
      src: "https://images.unsplash.com/photo-1474722883778-792e7990302f?q=80&w=1800&auto=format&fit=crop",
      alt: "Vigneto al tramonto",
    },
  },
  {
    category: "lago",
    image: {
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1800&auto=format&fit=crop",
      alt: "Lago d'Iseo",
    },
  },
  {
    category: "lago",
    image: {
      src: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=1800&auto=format&fit=crop",
      alt: "Riva del lago",
    },
  },
  {
    category: "cantine",
    image: {
      src: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1800&auto=format&fit=crop",
      alt: "Bottiglie di vino in cantina",
    },
  },
  {
    category: "cantine",
    image: {
      src: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=1800&auto=format&fit=crop",
      alt: "Botti in una cantina della Franciacorta",
    },
  },
];
