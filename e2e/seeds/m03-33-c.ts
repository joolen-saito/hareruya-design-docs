/**
 * M03-33 セール用高額商品価格変更CSV登録の画面シード（その3。形式・対象外・メッセージ・タグの形・混在・2回取込）。正本: cases/M03-33_seed_data.tsv
 * 作り方は seeds/m03-33-b.ts と同じ（グッズ商品CSV登録で商品を作り、商品規格登録編集画面で正本の状態にする。商品コードには実行ごとの印）。
 * 補い（正本の外）:
 * - 取込ファイルは画面の雛形の見出し行（列名）の下に、シード表のデータ行（「空」は空の値）を入れる。シード表にデータ行が無い 024 の販売価格以外の列・039・041・042 は、
 *   同じ機能の他のケースと同じ「価格1200・700、セール1、帯URL空、スマレジ連携0」にし、039 のタグ(ID)は 999 にした（シード表は「タグID 999を指定」）。
 * - 商品タグ「取込前タグだけ」「タグID 1だけ」は、グッズ商品CSVのタグ(ID)に 1 を入れて作る（共有のタグは書き換えない。seeds/m03-33-b.ts の TAGS で在ることを確かめる）。
 * - 024 のファイルは Shift_JIS（見出し行も Shift_JIS に変換）。
 * - 057 は商品コードに実行の印を付けた存在しない値（商品・商品規格が0件）。
 * 作らない: MULTI-007・008（1商品に規格2つ）・TARGETS-044（同じ商品コードの商品2件）。
 */
import { Browser } from "@playwright/test";
import { csvLine } from "../lib/csv";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { createHighPriceGoods, expectNoSameNameHistory } from "./m03-32";
import { dataRowInSeed, expectInSeed, M0333_ADMIN, templateHeader, writeRuntime } from "./m03-33";
import { readState } from "./m03-33-b";

const URL_BASE = "https://replace-dev.hareruyamtg.com:8443";
const 空 = (row: string): string => row.replace(/空/g, "");
const csvRow = (header: string[], row: string): string => `${csvLine(header)}\n${row}\n`;

/** Shift_JIS のバイト列（デコーダの表を逆引きして作る） */
let sjisMap: Map<string, number[]> | null = null;
export function sjisBytes(text: string): Buffer {
  if (!sjisMap) {
    sjisMap = new Map();
    const d = new TextDecoder("shift_jis");
    for (let a = 0x81; a <= 0xfc; a++) for (let b = 0x40; b <= 0xfc; b++) {
      const ch = d.decode(Buffer.from([a, b]));
      if (ch.length === 1 && ch !== "�" && !sjisMap.has(ch)) sjisMap.set(ch, [a, b]);
    }
  }
  const out: number[] = [];
  for (const ch of text) {
    if (ch.charCodeAt(0) < 0x80) out.push(ch.charCodeAt(0));
    else { const b = sjisMap.get(ch); if (!b) throw new Error(`Shift_JIS に変換できない文字: ${ch}`); out.push(...b); }
  }
  return Buffer.from(out);
}

type 作り = {
  /** 取込ファイル名と、見出し行・商品コード（印つき）から作る中身 */
  file: string; make: (header: string[], code: string) => string | Buffer;
  タグ?: string; 高額商品コードなし?: boolean;
};

async function singleProduct(browser: Browser, seedId: string, n: string, notes: Notes, o: 作り): Promise<void> {
  const st = readState(seedId);
  const code = rc(st.code);
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const header = await templateHeader(page, seedId);
    writeRuntime(o.file, o.make(header, code));
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seedId, o.file);
    await createHighPriceGoods(page, seedId, {
      商品コード: code, 商品名: `M0333-${n}`, ...(o.タグ ? { タグ: o.タグ } : {}),
      CSV: { 基準価格: st.基準, 販売価格: st.販売, 買取価格: st.買取 },
      規格: { 高額商品コード: o.高額商品コードなし ? "" : code, セール: st.セール, 基準価格: st.基準, 販売価格: st.販売, 買取価格: st.買取 },
    }, { 商品ID: `〔商品ID-M0333-${n}〕`, 商品規格ID: `〔商品規格ID-M0333-${n}〕` }, notes);
    reportSeedIssue(seedId, `同名取込履歴0件: 画面のCSVインポート履歴に ${o.file} の行が無いことを確かめた。取込ファイルは画面の雛形の見出し行（${header.length}列）の下にデータ行を入れた`);
  });
}

const NEED = ["S-M03-33-ADM"];
const NEED_TAG = ["S-M03-33-ADM", "S-M03-33-TAGS"];
const 価格行 = (code: string, 帯 = ""): string => `${code},1200,700,1,${帯},,0`;

defineSeed("S-M03-33-FORMAT-PRODUCTS-024", { needs: NEED }, async ({ browser, seed, notes }) => {
  expectInSeed(seed.シードID, ["shift_jis-024.csv=SJIS-001-024,1200,700,1,https://replace-dev.hareruyamtg.com:8443/帯,空,0をUTF-8以外で保存"]);
  await singleProduct(browser, seed.シードID, "024", notes, {
    file: "shift_jis-024.csv",
    make: (h, code) => sjisBytes(csvRow(h, 価格行(code, `${URL_BASE}/帯`))),
  });
  reportSeedIssue(seed.シードID, "shift_jis-024.csv: 見出し行・データ行とも Shift_JIS で保存した（正本は「UTF-8以外で保存」）");
});

defineSeed("S-M03-33-VALIDATION-039", { needs: NEED_TAG }, async ({ browser, seed, notes }) => {
  expectInSeed(seed.シードID, ["unknown_tag-039.csvはタグID 999を指定"]);
  await singleProduct(browser, seed.シードID, "039", notes, { file: "unknown_tag-039.csv", タグ: "1", make: (h, code) => csvRow(h, `${code},1200,700,1,,999,0`) });
});

defineSeed("S-M03-33-TARGETS-041", { needs: NEED }, async ({ browser, seed }) => {
  expectInSeed(seed.シードID, ["unknown_product-041.csvは商品コードUNKNOWN-001-041、販売価格1200、買取価格700、セールフラグ1を指定"]);
  const file = "unknown_product-041.csv";
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const header = await templateHeader(page, seed.シードID);
    writeRuntime(file, csvRow(header, 価格行(rc("UNKNOWN-001-041"))));
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seed.シードID, file);
  });
  reportSeedIssue(seed.シードID, "商品コード UNKNOWN-001-041 は、実行の印を付けた存在しない商品コードにした（商品・商品規格は作らない＝0件。ほかの方の同名の商品と混ざらないため）");
});

defineSeed("S-M03-33-TARGETS-042", { needs: NEED }, async ({ browser, seed, notes }) => {
  expectInSeed(seed.シードID, ["no_high_price_code-042.csvは価格1200・700、セール1を指定", "高額商品コードなし"]);
  await singleProduct(browser, seed.シードID, "042", notes, { file: "no_high_price_code-042.csv", 高額商品コードなし: true, make: (h, code) => csvRow(h, 価格行(code)) });
});

function alertSeed(n: string, file: string): void {
  defineSeed(`S-M03-33-ALERT-${n}`, { needs: NEED_TAG }, async ({ browser, seed, notes }) => {
    await singleProduct(browser, seed.シードID, n, notes, {
      file, make: (h, code) => csvRow(h, 空(dataRowInSeed(seed.シードID, file)).replace(`M0333-${n}-A`, code)),
    });
  });
}
alertSeed("055", "m0333-055-on-off.csv");
alertSeed("056", "m0333-056-off-off.csv");

defineSeed("S-M03-33-NOMSG-057", { needs: NEED_TAG }, async ({ browser, seed }) => {
  const file = "m0333-057-unknown.csv";
  const row = 空(dataRowInSeed(seed.シードID, file)).replace("M0333-057-NONE", rc("M0333-057-NONE"));
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const header = await templateHeader(page, seed.シードID);
    writeRuntime(file, csvRow(header, row));
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seed.シードID, file);
  });
  reportSeedIssue(seed.シードID, "商品コード M0333-057-NONE は、実行の印を付けた存在しない商品コードにした（商品規格は作らない＝0件）");
});

function tagFmtSeed(n: string): void {
  const file = `m0333-${n}-tag.csv`;
  defineSeed(`S-M03-33-TAGFMT-${n}`, { needs: NEED_TAG }, async ({ browser, seed, notes }) => {
    await singleProduct(browser, seed.シードID, n, notes, {
      file, タグ: "1",
      make: (h, code) => csvRow(h, 空(dataRowInSeed(seed.シードID, file).replace(/（.*$/, "")).replace(`M0333-${n}-A`, code)),
    });
  });
}
tagFmtSeed("060");
tagFmtSeed("061");

defineSeed("S-M03-33-TWICE-069", { needs: NEED_TAG }, async ({ browser, seed, notes }) => {
  const file = "m0333-069-on-off.csv";
  expectInSeed(seed.シードID, ["M0333-069-A,900,650,0,https://replace-dev.hareruyamtg.com:8443/m0333-069,2,0"]);
  await singleProduct(browser, seed.シードID, "069", notes, { file, make: (h, code) => csvRow(h, `${code},900,650,0,${URL_BASE}/m0333-069,2,0`) });
});

// 066: 2商品（A=セール有効・B=セール無効）。ヘッダ行の次に2行目A・3行目B
defineSeed("S-M03-33-MIX-066", { needs: NEED_TAG }, async ({ browser, seed, notes }) => {
  const file = "m0333-066-mixed.csv";
  expectInSeed(seed.シードID, ["M0333-066-A（基準価格2000・販売価格1500・買取価格500・セール有効）", "M0333-066-B（基準価格2000・販売価格2000・買取価格500・セール無効）",
    "M0333-066-A,9999,700,0,https://replace-dev.hareruyamtg.com:8443/m0333-066-a,2,0", "M0333-066-B,9999,700,0,https://replace-dev.hareruyamtg.com:8443/m0333-066-b,2,0"]);
  const a = rc("M0333-066-A"), b = rc("M0333-066-B");
  await withAdminSession(browser, M0333_ADMIN, async (page) => {
    const header = await templateHeader(page, seed.シードID);
    writeRuntime(file, `${csvLine(header)}\n${a},9999,700,0,${URL_BASE}/m0333-066-a,2,0\n${b},9999,700,0,${URL_BASE}/m0333-066-b,2,0\n`);
    await expectNoSameNameHistory(page, "セール用高額商品価格変更", seed.シードID, file);
    for (const [x, code, 販売, セール] of [["A", a, "1500", true], ["B", b, "2000", false]] as const) {
      await createHighPriceGoods(page, seed.シードID, {
        商品コード: code, 商品名: `M0333-066-${x}`,
        CSV: { 基準価格: "2000", 販売価格: 販売, 買取価格: "500" },
        規格: { 高額商品コード: code, セール, 基準価格: "2000", 販売価格: 販売, 買取価格: "500" },
      }, { 商品ID: `〔商品ID-M0333-066-${x}〕`, 商品規格ID: `〔商品規格ID-M0333-066-${x}〕` }, notes);
    }
  });
});
