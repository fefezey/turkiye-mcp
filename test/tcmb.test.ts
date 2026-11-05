import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { kurlariGetir, kurUrl, kurXmlCozumle } from "../src/tcmb.js";

const ornekXml = readFileSync(new URL("./fixtures/kurlar.xml", import.meta.url), "utf8");

describe("kurXmlCozumle", () => {
  const bulten = kurXmlCozumle(ornekXml);

  it("bülten tarihini ISO biçimine çevirir", () => {
    expect(bulten.tarih).toBe("2026-11-03");
    expect(bulten.bultenNo).toBe("2026/208");
  });

  it("kurları sayıya çevirir", () => {
    expect(bulten.kurlar[0]).toEqual({
      kod: "USD",
      isim: "ABD DOLARI",
      birim: 1,
      dovizAlis: 41.1234,
      dovizSatis: 41.1975,
      efektifAlis: 41.0946,
      efektifSatis: 41.2593,
    });
  });

  it("birimi 1 olmayan kurları korur", () => {
    expect(bulten.kurlar.find((k) => k.kod === "JPY")?.birim).toBe(100);
  });

  it("boş alanları null yapar ve isimdeki boşlukları kırpar", () => {
    const sdr = bulten.kurlar.find((k) => k.kod === "XDR")!;
    expect(sdr.dovizSatis).toBeNull();
    expect(sdr.efektifAlis).toBeNull();
    expect(sdr.isim).toBe("ÖZEL ÇEKME HAKKI (SDR)");
  });

  it("beklenmeyen yanıtta hata verir", () => {
    expect(() => kurXmlCozumle("<html></html>")).toThrow(/beklenen biçimde/);
  });
});

describe("kurUrl", () => {
  it("güncel ve arşiv adreslerini üretir", () => {
    expect(kurUrl()).toBe("https://www.tcmb.gov.tr/kurlar/today.xml");
    expect(kurUrl("2026-11-03")).toBe("https://www.tcmb.gov.tr/kurlar/202611/03112026.xml");
  });
});

describe("kurlariGetir", () => {
  function sahteFetch(bultenOlanUrl: string) {
    return vi.fn(async (url: string | URL | Request) =>
      String(url) === bultenOlanUrl
        ? new Response(ornekXml, { status: 200 })
        : new Response("", { status: 404 }),
    ) as unknown as typeof fetch;
  }

  it("bülten olmayan günde önceki bültene geri gider", async () => {
    const fetchFn = sahteFetch(kurUrl("2026-11-03"));
    const bulten = await kurlariGetir({ tarih: "2026-11-04" }, fetchFn);
    expect(bulten.tarih).toBe("2026-11-03");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("istenen kodlara göre süzer", async () => {
    const bulten = await kurlariGetir({ kodlar: ["usd"] }, sahteFetch(kurUrl()));
    expect(bulten.kurlar.map((k) => k.kod)).toEqual(["USD"]);
  });

  it("gelecek tarihi reddeder", async () => {
    await expect(kurlariGetir({ tarih: "2999-01-01" }, sahteFetch(""))).rejects.toThrow(/Gelecek/);
  });

  it("sunucu hatasını iletir", async () => {
    const fetchFn = vi.fn(async () => new Response("", { status: 500 })) as unknown as typeof fetch;
    await expect(kurlariGetir({}, fetchFn)).rejects.toThrow(/HTTP 500/);
  });
});
