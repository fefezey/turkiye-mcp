import { XMLParser } from "fast-xml-parser";
import { bugun, gunEkle, tarihOku } from "./tarih.js";

const TCMB_KURLAR = "https://www.tcmb.gov.tr/kurlar";

/** Hafta sonu ve uzun bayram tatillerinde bülten yayımlanmaz; en fazla bu kadar gün geriye bakılır. */
const GERIYE_BAKMA_GUNU = 10;

export interface Kur {
  kod: string;
  isim: string;
  birim: number;
  dovizAlis: number | null;
  dovizSatis: number | null;
  efektifAlis: number | null;
  efektifSatis: number | null;
}

export interface KurBulteni {
  /** Bültenin yayımlandığı gün (istenen gün tatilse daha önceki bir gün olabilir). */
  tarih: string;
  bultenNo: string;
  kaynak: string;
  kurlar: Kur[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (ad) => ad === "Currency",
});

function sayi(deger: unknown): number | null {
  if (typeof deger !== "string" || deger.trim() === "") return null;
  const n = Number(deger);
  return Number.isFinite(n) ? n : null;
}

/** "05.11.2026" -> "2026-11-05" */
function tcmbTarihiniCevir(tarih: string): string {
  const [gun, ay, yil] = tarih.split(".");
  return `${yil}-${ay}-${gun}`;
}

export function kurXmlCozumle(xml: string, kaynak = ""): KurBulteni {
  const kok = parser.parse(xml)?.Tarih_Date;
  if (!kok || !Array.isArray(kok.Currency)) {
    throw new Error("TCMB yanıtı beklenen biçimde değil.");
  }

  return {
    tarih: tcmbTarihiniCevir(String(kok.Tarih)),
    bultenNo: String(kok.Bulten_No ?? ""),
    kaynak,
    kurlar: kok.Currency.map(
      (c: Record<string, unknown>): Kur => ({
        kod: String(c.Kod ?? c.CurrencyCode),
        isim: String(c.Isim ?? "").trim(),
        birim: sayi(c.Unit) ?? 1,
        dovizAlis: sayi(c.ForexBuying),
        dovizSatis: sayi(c.ForexSelling),
        efektifAlis: sayi(c.BanknoteBuying),
        efektifSatis: sayi(c.BanknoteSelling),
      }),
    ),
  };
}

/** Tarih verilmezse güncel bülten, verilirse o günün arşiv adresi. */
export function kurUrl(tarih?: string): string {
  if (!tarih) return `${TCMB_KURLAR}/today.xml`;
  const [yil, ay, gun] = tarih.split("-");
  return `${TCMB_KURLAR}/${yil}${ay}/${gun}${ay}${yil}.xml`;
}

export async function kurlariGetir(
  secenekler: { tarih?: string; kodlar?: string[] } = {},
  fetchFn: typeof fetch = fetch,
): Promise<KurBulteni> {
  const { tarih, kodlar } = secenekler;
  if (tarih) {
    tarihOku(tarih);
    if (tarih > bugun()) throw new Error("Gelecek tarihli kur sorgulanamaz.");
  }

  const bulten = tarih ? await arsivdenGetir(tarih, fetchFn) : await indir(kurUrl(), fetchFn);
  if (!bulten) throw new Error("TCMB kur bülteni alınamadı.");

  if (kodlar?.length) {
    const istenen = new Set(kodlar.map((k) => k.toUpperCase()));
    bulten.kurlar = bulten.kurlar.filter((k) => istenen.has(k.kod));
  }
  return bulten;
}

async function arsivdenGetir(tarih: string, fetchFn: typeof fetch): Promise<KurBulteni | null> {
  for (let i = 0; i <= GERIYE_BAKMA_GUNU; i++) {
    const bulten = await indir(kurUrl(gunEkle(tarih, -i)), fetchFn);
    if (bulten) return bulten;
  }
  throw new Error(`${tarih} ve önceki ${GERIYE_BAKMA_GUNU} gün için TCMB bülteni bulunamadı.`);
}

/** Bülten yoksa (404) null döner. */
async function indir(url: string, fetchFn: typeof fetch): Promise<KurBulteni | null> {
  const yanit = await fetchFn(url, { signal: AbortSignal.timeout(10_000) });
  if (yanit.status === 404) return null;
  if (!yanit.ok) throw new Error(`TCMB isteği başarısız: HTTP ${yanit.status} (${url})`);
  return kurXmlCozumle(await yanit.text(), url);
}
