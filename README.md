# turkiye-mcp

Yapay zeka asistanlarına (Claude, Cursor ve diğer MCP istemcileri) **Türkiye'ye özgü güncel veri ve hesaplamalar** kazandıran bir [MCP](https://modelcontextprotocol.io) sunucusu.

Dil modelleri asgari ücreti, bayram tarihlerini ya da dünkü dolar kurunu genellikle bilmez veya yanlış bilir. `turkiye-mcp` bu bilgileri resmi kaynaklardan alır.

> *An MCP server providing Turkey-specific data to AI assistants: Central Bank (TCMB) exchange rates, public holidays and business-day calculations.*

## Araçlar

| Araç | Ne yapar | Kaynak |
|---|---|---|
| `doviz_kurlari` | Güncel ya da geçmiş tarihli TCMB kurları. Tatil günleri için önceki bülteni döner. | [TCMB](https://www.tcmb.gov.tr/kurlar/today.xml) |
| `resmi_tatiller` | Bir yılın resmi ve dini tatilleri; arifeler yarım gün olarak işaretli. | 2429 sayılı Kanun, Diyanet takvimi |
| `is_gunu_ekle` | "Tebliğden itibaren 10 iş günü" gibi süreleri hafta sonu ve bayramları atlayarak hesaplar. | — |

### Örnek sorular

- "Geçen ayın son iş günündeki euro kuru neydi?"
- "Bugünden itibaren 15 iş günü sonrası hangi tarihe denk geliyor?"
- "2027'de Kurban Bayramı hangi günlere denk geliyor, köprü yapmak için kaç gün izin almam lazım?"

## Kurulum

Node.js 20 veya üzeri gerekir.

```bash
git clone https://github.com/fefezey/turkiye-mcp.git
cd turkiye-mcp
npm install
npm run build
```

### Claude Code

```bash
claude mcp add turkiye -- node /tam/yol/turkiye-mcp/dist/index.js
```

### Claude Desktop

`claude_desktop_config.json` dosyasına ekleyin:

```json
{
  "mcpServers": {
    "turkiye": {
      "command": "node",
      "args": ["/tam/yol/turkiye-mcp/dist/index.js"]
    }
  }
}
```

npm'de yayımlandıktan sonra `npx -y turkiye-mcp` ile kurulumsuz çalıştırılabilecek.

## Geliştirme

```bash
npm run dev       # TypeScript izleme modu
npm test          # testler (ağ erişimi gerektirmez)
npm run inspect   # MCP Inspector ile araçları elle dene
```

Proje yapısı:

```
src/
  index.ts      stdio giriş noktası
  server.ts     araç tanımları
  tcmb.ts       TCMB kur bülteni indirme ve ayrıştırma
  tatiller.ts   resmi tatiller ve iş günü hesabı
  tarih.ts      UTC tabanlı tarih yardımcıları
```

## Yol haritası

Katkılara açık. Her madde ayrı bir PR olabilir:

- [ ] TCKN, VKN ve IBAN doğrulama
- [ ] İl, ilçe ve mahalle verisi
- [ ] KDV ve stopaj hesaplayıcı
- [ ] Asgari ücret net/brüt hesabı (yıllara göre parametreler)
- [ ] Kıdem tazminatı tavanı
- [ ] Resmi Gazete günlük özeti
- [ ] 2028 ve sonrası için dini bayram tarihleri
- [ ] npm'de yayımlama

## Katkı

1. Bir issue açın ya da yol haritasından bir madde seçin.
2. Yeni araç için `src/` altına modül, `test/` altına test ekleyin.
3. Testler ağ erişimi gerektirmemeli; dış kaynakları `test/fixtures/` ile taklit edin.
4. Resmi veri eklerken kaynağı kod yorumunda belirtin.

## Sorumluluk reddi

Veriler resmi kaynaklardan alınır ancak hukuki veya mali kararlarda tek başına esas alınmamalıdır. Dini bayram tarihleri Diyanet takvimine göre elle girilir; yeni yıllar eklenirken diyanet.gov.tr üzerinden doğrulanmalıdır.

## Lisans

MIT
