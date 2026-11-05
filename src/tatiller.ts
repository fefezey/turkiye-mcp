import { gunAdi, gunEkle, haftaSonuMu, tarihOku } from "./tarih.js";

export type TatilTuru = "milli" | "dini";

export interface Tatil {
  tarih: string;
  gun: string;
  ad: string;
  tur: TatilTuru;
  /** Arife ve 28 Ekim: 13:00'ten itibaren yarım gün tatil. */
  yarimGun: boolean;
}

// 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun.
const SABIT_TATILLER: ReadonlyArray<[ayGun: string, ad: string]> = [
  ["01-01", "Yılbaşı"],
  ["04-23", "Ulusal Egemenlik ve Çocuk Bayramı"],
  ["05-01", "Emek ve Dayanışma Günü"],
  ["05-19", "Atatürk'ü Anma, Gençlik ve Spor Bayramı"],
  ["07-15", "Demokrasi ve Millî Birlik Günü"],
  ["08-30", "Zafer Bayramı"],
  ["10-29", "Cumhuriyet Bayramı"],
];

// Dini bayramların 1. günü, Diyanet İşleri Başkanlığı takvimine göre.
// Yeni yıl eklerken kaynağı diyanet.gov.tr üzerinden doğrulayın.
const DINI_BAYRAMLAR: Readonly<Record<number, { ramazan: string; kurban: string }>> = {
  2024: { ramazan: "2024-04-10", kurban: "2024-06-16" },
  2025: { ramazan: "2025-03-30", kurban: "2025-06-06" },
  2026: { ramazan: "2026-03-20", kurban: "2026-05-27" },
  2027: { ramazan: "2027-03-09", kurban: "2027-05-16" },
};

export const DESTEKLENEN_YILLAR = Object.keys(DINI_BAYRAMLAR).map(Number);

function tatil(tarih: string, ad: string, tur: TatilTuru, yarimGun = false): Tatil {
  return { tarih, gun: gunAdi(tarih), ad, tur, yarimGun };
}

export function resmiTatiller(yil: number): Tatil[] {
  const dini = DINI_BAYRAMLAR[yil];
  if (!dini) {
    throw new Error(
      `${yil} yılı için dini bayram verisi yok. Desteklenen yıllar: ${DESTEKLENEN_YILLAR.join(", ")}`,
    );
  }

  const liste: Tatil[] = SABIT_TATILLER.map(([ayGun, ad]) => tatil(`${yil}-${ayGun}`, ad, "milli"));
  liste.push(tatil(`${yil}-10-28`, "Cumhuriyet Bayramı Arifesi", "milli", true));

  liste.push(tatil(gunEkle(dini.ramazan, -1), "Ramazan Bayramı Arifesi", "dini", true));
  for (let i = 0; i < 3; i++) {
    liste.push(tatil(gunEkle(dini.ramazan, i), `Ramazan Bayramı ${i + 1}. Gün`, "dini"));
  }

  liste.push(tatil(gunEkle(dini.kurban, -1), "Kurban Bayramı Arifesi", "dini", true));
  for (let i = 0; i < 4; i++) {
    liste.push(tatil(gunEkle(dini.kurban, i), `Kurban Bayramı ${i + 1}. Gün`, "dini"));
  }

  return liste.sort((a, b) => a.tarih.localeCompare(b.tarih));
}

/** O güne denk gelen tatiller (aynı güne iki tatil düşebilir, ör. 19 Mayıs 2027). */
export function tarihtekiTatiller(tarih: string): Tatil[] {
  const yil = tarihOku(tarih).getUTCFullYear();
  return resmiTatiller(yil).filter((t) => t.tarih === tarih);
}

export function isGunuMu(tarih: string): boolean {
  if (haftaSonuMu(tarih)) return false;
  return !tarihtekiTatiller(tarih).some((t) => !t.yarimGun);
}

export interface IsGunuSonucu {
  baslangic: string;
  isGunuSayisi: number;
  sonuc: string;
  sonucGunu: string;
  /** Aradaki tam gün tatiller (hafta sonuna denk gelenler hariç). */
  atlananTatiller: Tatil[];
  /** Sayıma iş günü olarak dahil edilen yarım günler. */
  yarimGunler: Tatil[];
}

/**
 * Başlangıç tarihinden sonraki `isGunuSayisi` kadar iş gününü sayar.
 * Cumartesi ve Pazar tatil kabul edilir; yarım gün tatiller iş günü sayılır.
 */
export function isGunuEkle(baslangic: string, isGunuSayisi: number): IsGunuSonucu {
  if (!Number.isInteger(isGunuSayisi) || isGunuSayisi < 1) {
    throw new Error("İş günü sayısı pozitif bir tam sayı olmalı.");
  }

  const atlananTatiller: Tatil[] = [];
  const yarimGunler: Tatil[] = [];
  let tarih = baslangic;
  let sayilan = 0;

  while (sayilan < isGunuSayisi) {
    tarih = gunEkle(tarih, 1);
    if (haftaSonuMu(tarih)) continue;

    const tatiller = tarihtekiTatiller(tarih);
    if (tatiller.some((t) => !t.yarimGun)) {
      atlananTatiller.push(...tatiller);
      continue;
    }
    yarimGunler.push(...tatiller);
    sayilan++;
  }

  return {
    baslangic,
    isGunuSayisi,
    sonuc: tarih,
    sonucGunu: gunAdi(tarih),
    atlananTatiller,
    yarimGunler,
  };
}
