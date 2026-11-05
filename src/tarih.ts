// Tarihler her yerde "YYYY-MM-DD" biçiminde dolaşır; saat dilimi kaymalarını
// önlemek için tüm hesaplar UTC üzerinden yapılır.

const ISO_TARIH = /^(\d{4})-(\d{2})-(\d{2})$/;

export function tarihGecerliMi(tarih: string): boolean {
  const m = ISO_TARIH.exec(tarih);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === tarih;
}

export function tarihOku(tarih: string): Date {
  if (!tarihGecerliMi(tarih)) {
    throw new Error(`Geçersiz tarih: "${tarih}". Beklenen biçim: YYYY-MM-DD`);
  }
  return new Date(`${tarih}T00:00:00Z`);
}

export function tarihYaz(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function gunEkle(tarih: string, gun: number): string {
  const d = tarihOku(tarih);
  d.setUTCDate(d.getUTCDate() + gun);
  return tarihYaz(d);
}

export function haftaSonuMu(tarih: string): boolean {
  const gun = tarihOku(tarih).getUTCDay();
  return gun === 0 || gun === 6;
}

const GUN_ADLARI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function gunAdi(tarih: string): string {
  return GUN_ADLARI[tarihOku(tarih).getUTCDay()]!;
}

/** Türkiye saatine (UTC+3) göre bugünün tarihi. */
export function bugun(): string {
  return tarihYaz(new Date(Date.now() + 3 * 60 * 60 * 1000));
}
