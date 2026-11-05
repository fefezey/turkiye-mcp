import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { tarihGecerliMi } from "./tarih.js";
import { DESTEKLENEN_YILLAR, isGunuEkle, resmiTatiller } from "./tatiller.js";
import { kurlariGetir } from "./tcmb.js";

const tarihSemasi = z
  .string()
  .refine(tarihGecerliMi, { message: "Tarih YYYY-MM-DD biçiminde geçerli bir gün olmalı." });

async function yanitla(is: () => unknown): Promise<CallToolResult> {
  try {
    const sonuc = await is();
    return { content: [{ type: "text", text: JSON.stringify(sonuc, null, 2) }] };
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    return { content: [{ type: "text", text: mesaj }], isError: true };
  }
}

export function sunucuOlustur(): McpServer {
  const sunucu = new McpServer({ name: "turkiye-mcp", version: "0.1.0" });

  sunucu.registerTool(
    "doviz_kurlari",
    {
      title: "TCMB döviz kurları",
      description:
        "TCMB gösterge niteliğindeki döviz kurlarını getirir (döviz/efektif alış-satış, TL cinsinden). " +
        "Tarih verilmezse güncel bülten döner. Hafta sonu veya tatil günü istenirse o günden önceki " +
        "son bülten döner; yanıttaki 'tarih' alanı bültenin gerçek tarihidir. Bazı kurlar 1 değil " +
        "'birim' kadar döviz içindir (ör. 100 JPY).",
      inputSchema: {
        tarih: tarihSemasi.optional().describe("YYYY-MM-DD. Boş bırakılırsa güncel kurlar."),
        kodlar: z
          .array(z.string().length(3))
          .optional()
          .describe("Yalnızca bu döviz kodları, ör. [\"USD\", \"EUR\"]. Boşsa hepsi."),
      },
    },
    ({ tarih, kodlar }) => yanitla(() => kurlariGetir({ tarih, kodlar })),
  );

  sunucu.registerTool(
    "resmi_tatiller",
    {
      title: "Resmi tatiller",
      description:
        "Türkiye'deki resmi ve dini bayramları listeler. Arifeler ve 28 Ekim yarım gün " +
        `(yarimGun: true) olarak işaretlidir. Desteklenen yıllar: ${DESTEKLENEN_YILLAR.join(", ")}.`,
      inputSchema: {
        yil: z.number().int().describe("Ör. 2026"),
      },
    },
    ({ yil }) => yanitla(() => resmiTatiller(yil)),
  );

  sunucu.registerTool(
    "is_gunu_ekle",
    {
      title: "İş günü hesapla",
      description:
        "Bir tarihe iş günü ekler: hafta sonlarını (Cumartesi, Pazar) ve tam gün resmi tatilleri " +
        "atlar. Yarım gün tatiller iş günü sayılır ve ayrıca listelenir. Ör. 'Tebliğden itibaren " +
        "10 iş günü' gibi süre hesapları için.",
      inputSchema: {
        baslangic: tarihSemasi.describe("Sayımın başladığı gün (YYYY-MM-DD); bu gün sayılmaz."),
        isGunuSayisi: z.number().int().min(1).max(1000),
      },
    },
    ({ baslangic, isGunuSayisi }) => yanitla(() => isGunuEkle(baslangic, isGunuSayisi)),
  );

  return sunucu;
}
