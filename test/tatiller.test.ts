import { describe, expect, it } from "vitest";
import { isGunuEkle, isGunuMu, resmiTatiller } from "../src/tatiller.js";

describe("resmiTatiller", () => {
  it("2026 yılı için sabit ve dini tatilleri içerir", () => {
    const tarihler = resmiTatiller(2026).map((t) => `${t.tarih} ${t.ad}`);
    expect(tarihler).toContain("2026-01-01 Yılbaşı");
    expect(tarihler).toContain("2026-03-19 Ramazan Bayramı Arifesi");
    expect(tarihler).toContain("2026-03-22 Ramazan Bayramı 3. Gün");
    expect(tarihler).toContain("2026-05-26 Kurban Bayramı Arifesi");
    expect(tarihler).toContain("2026-05-30 Kurban Bayramı 4. Gün");
    expect(tarihler).toContain("2026-10-29 Cumhuriyet Bayramı");
  });

  it("arifeleri ve 28 Ekim'i yarım gün işaretler", () => {
    const yarimGunler = resmiTatiller(2026).filter((t) => t.yarimGun).map((t) => t.tarih);
    expect(yarimGunler).toEqual(["2026-03-19", "2026-05-26", "2026-10-28"]);
  });

  it("tarihe göre sıralıdır ve gün adını verir", () => {
    const liste = resmiTatiller(2026);
    const tarihler = liste.map((t) => t.tarih);
    expect(tarihler).toEqual([...tarihler].sort());
    expect(liste[0]).toMatchObject({ tarih: "2026-01-01", gun: "Perşembe" });
  });

  it("aynı güne düşen tatillerin ikisini de listeler (19 Mayıs 2027)", () => {
    const ondokuzMayis = resmiTatiller(2027).filter((t) => t.tarih === "2027-05-19");
    expect(ondokuzMayis.map((t) => t.ad)).toEqual(
      expect.arrayContaining(["Atatürk'ü Anma, Gençlik ve Spor Bayramı", "Kurban Bayramı 4. Gün"]),
    );
  });

  it("desteklenmeyen yılda açıklayıcı hata verir", () => {
    expect(() => resmiTatiller(2040)).toThrow(/Desteklenen yıllar/);
  });
});

describe("isGunuMu", () => {
  it("hafta sonu, tam gün tatil ve yarım günü ayırt eder", () => {
    expect(isGunuMu("2026-11-05")).toBe(true); // Perşembe
    expect(isGunuMu("2026-11-07")).toBe(false); // Cumartesi
    expect(isGunuMu("2026-10-29")).toBe(false); // Cumhuriyet Bayramı
    expect(isGunuMu("2026-10-28")).toBe(true); // yarım gün
  });
});

describe("isGunuEkle", () => {
  it("hafta sonunu atlar", () => {
    // Cuma + 1 iş günü = Pazartesi
    expect(isGunuEkle("2026-11-06", 1).sonuc).toBe("2026-11-09");
  });

  it("bayramı atlar ve atlananları raporlar", () => {
    // Kurban Bayramı 2026: arife 26 Mayıs Salı, bayram 27-30 Mayıs
    const sonuc = isGunuEkle("2026-05-25", 3);
    expect(sonuc.sonuc).toBe("2026-06-02");
    expect(sonuc.sonucGunu).toBe("Salı");
    expect(sonuc.atlananTatiller.map((t) => t.tarih)).toEqual(["2026-05-27", "2026-05-28", "2026-05-29"]);
    expect(sonuc.yarimGunler.map((t) => t.ad)).toEqual(["Kurban Bayramı Arifesi"]);
  });

  it("yıl sınırını geçer", () => {
    // 31 Aralık 2026 Perşembe; 1 Ocak Cuma tatil, ardından hafta sonu
    expect(isGunuEkle("2026-12-31", 1).sonuc).toBe("2027-01-04");
  });

  it("geçersiz sayıyı reddeder", () => {
    expect(() => isGunuEkle("2026-11-05", 0)).toThrow();
  });
});
