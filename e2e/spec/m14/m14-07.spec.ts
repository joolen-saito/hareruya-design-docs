/**
 * M14-07 カードセット管理(画像ダウンロード)。正本: cases/M14-07_test_cases.tsv（003・004 は spec/m14/m14-06.spec.ts）
 * 画像の実体は、既存のカードが使っている画像URLへの読み替え（seeds/m14-07.ts）。ZIP は OS の unzip で展開して中のファイルを調べる。
 * 実装しないケース: 005・006・027・032・034（カードセット未選択のダウンロードは、共有の全データの「カードセット未設定のカード」が対象になり、件数を制御できない）
 */
import { Download, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 画像のデッドリンク, カード名英の詳細IDs, 日本語, 英語 } from "../../db/m14_07";
import { CardsetListPage, ダウンロードの結果 } from "../../pages/admin/m14_06_cardset_list";
import { 展開結果, ZIPを展開する } from "../../pages/admin/m14_07_zip";
import { M1407_ADMIN } from "../../seeds/m14-06";
import { カード名 } from "../../seeds/m14-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 詳細 = (番号: string): string => {
  const d = カード名英の詳細IDs(カード名(番号));
  if (d.length !== 1) throw new Error(`カード「${番号}」の詳細が ${d.length} 件（1件のはず）`);
  return d[0];
};
const 略称 = (s: string) => rc(s);
const 注記_固定の番号 = "カード詳細IDは、正本の固定の番号ではなく、シードで画面が振った番号（カード名(英)に付けた番号で引く）で確かめた。";
const 注記_画像 = "画像の実体は既存のカードが使っている画像URLへの読み替え。";

/** 表示件数と並び順（リリース日降順）を設定して一覧を整える */
async function 一覧を整える(L: CardsetListPage, 件数: number): Promise<void> {
  await L.件数を選ぶ(件数);
  await L.並び順を選ぶ("リリース日（降順）");
}

/** 1ページ目から順に探して、控えたIDのカードセットの選択にチェックを付ける。すべて同じページに並んでいる必要がある。見つけたページ番号を返す */
async function セットを選ぶ(L: CardsetListPage, ids: string[], 件数 = 100): Promise<number> {
  await 一覧を整える(L, 件数);
  const n = await L.行を探す(() => L.行(ids[0]), "先頭から");
  if (n === null) throw new Error(`カードセット ${ids[0]} の行が一覧に見つからない`);
  for (const id of ids) {
    if ((await L.行(id).count()) !== 1) throw new Error(`カードセット ${id} が、${ids[0]} と同じページ（${n}ページ目）に並んでいない（流し直す）`);
  }
  for (const id of ids) await L.行(id).locator('input[name="cardsetIds[]"]').check();
  return n;
}

async function ZIPを受け取る(d: ダウンロードの結果): Promise<展開結果> {
  const dl: Download | undefined = d.ダウンロード;
  if (!d.ダウンロードした || !dl) throw new Error(`card_image.zip がダウンロードされなかった（エラー: ${d.エラー.join(" ")}）`);
  return ZIPを展開する(dl);
}
const 内容 = (z: 展開結果, f: string): string => createHash("sha256").update(readFileSync(join(z.dir, f))).digest("hex");
const 並べる = (a: string[]) => [...a].sort();

// ---------------------------------------------------------------------------
// ZIP の中身
// ---------------------------------------------------------------------------
caseTest("IT-M14-07-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-001A〕"), b = notes.get("〔カードセットID-M1407-001B〕");
  const 詳細A = 詳細("714101001"), 詳細B = 詳細("714102001");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した。略称は「FIN-BF-001」と、他のケースの「FIN」と区別した略称（印つき）。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル, "展開したファイル（セットの略称のフォルダごとに、そのセットのカード画像）").toEqual(並べる([`download/${略称("FIN-BF-001")}/F${詳細A}.jpg`, `download/${略称("FIN-001B")}/${詳細B}.jpg`]));
  });
});

caseTest("IT-M14-07-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-002A〕"), b = notes.get("〔カードセットID-M1407-002B〕");
  const 詳細A = 詳細("714101002"), 詳細B = 詳細("714102002");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル, "展開したファイル（download/JP に日本語画像、download/EN に英語画像）")
      .toEqual(並べる([`download/JP/F${詳細A}.jpg`, `download/EN/F${詳細A}.jpg`, `download/EN/${詳細B}.jpg`]));
  });
});

caseTest("IT-M14-07-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-007〕"), 画像なし = notes.get("〔カード詳細ID-M1407-007〕");
  const 有効 = 詳細("714101007"), 未設定 = 詳細("177261");
  let d1: ダウンロードの結果, d2: ダウンロードの結果, z1: 展開結果 = { ファイル: [], dir: "" }, z2: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。プロモーション未設定のカード詳細は、正本の177261ではなく画面が振った番号。${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d1 = await L.画像ダウンロードを押す("セット別"); z1 = await ZIPを受け取る(d1); });
  await step(4, async () => { await L.open(); });
  await step(5, async () => { await セットを選ぶ(L, [s]); });
  await step(6, async () => { d2 = await L.画像ダウンロードを押す("言語別"); z2 = await ZIPを受け取る(d2); });
  await expected(async () => {
    expect.soft(z1.ファイル, "セット別のZIPのファイル（画像のあるプロモーション設定済みのカードだけ）").toEqual([`download/${略称("FIN-BF-007")}/${有効}.jpg`]);
    expect.soft(z2.ファイル, "言語別のZIPのファイル（画像のあるプロモーション設定済みのカードだけ）").toEqual([`download/JP/${有効}.jpg`]);
    for (const [名, z] of [["セット別", z1], ["言語別", z2]] as const) {
      expect.soft(z.ファイル.filter((f) => f.includes(`${画像なし}.jpg`)), `${名}のZIPにある、画像を持たないカード詳細のファイル`).toEqual([]);
      expect.soft(z.ファイル.filter((f) => f.includes(`${未設定}.jpg`)), `${名}のZIPにある、プロモーション未設定のカード詳細のファイル`).toEqual([]);
    }
  });
});

/** 日本語・英語の内容を、同じカードセットの言語別のZIPから調べる（日本語・英語の画像は内容が違うことも確かめる） */
async function 言語別の内容(L: CardsetListPage, 選ぶ: () => Promise<unknown>, 詳細ID: string, F: string): Promise<{ 日本語: string; 英語: string }> {
  await L.open();
  await 選ぶ();
  const z = await ZIPを受け取る(await L.画像ダウンロードを押す("言語別"));
  return { 日本語: 内容(z, `download/JP/${F}${詳細ID}.jpg`), 英語: 内容(z, `download/EN/${F}${詳細ID}.jpg`) };
}

caseTest("IT-M14-07-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-共有〕");
  const 詳細ID = 詳細("177252");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  let 基準 = { 日本語: "", 英語: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => {
    z = await ZIPを受け取る(d);
    note("画像が日本語か英語かは、同じカードセットの言語別ダウンロードで得た日本語・英語の画像の内容（ハッシュ）と照らして確かめた（取得した画像は既存のカードの画像で、内容を正本の画像と比べられないため）");
    基準 = await 言語別の内容(L, () => セットを選ぶ(L, [s]), 詳細ID, "F");
  });
  await expected(async () => {
    expect.soft(z.ファイル, "セット別のZIPのファイル（F+カード詳細ID の1件だけ。同じカード詳細の英語画像は含まれない）").toEqual([`download/${略称("FIN-BF")}/F${詳細ID}.jpg`]);
    expect.soft(基準.日本語 !== 基準.英語, "日本語画像と英語画像の内容が違う（照らし合わせの前提）").toBe(true);
    if (z.ファイル.length === 1) expect.soft(内容(z, z.ファイル[0]), "F+カード詳細ID.jpg の内容（日本語画像と一致する）").toBe(基準.日本語);
  });
});

caseTest("IT-M14-07-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-012〕");
  const 詳細ID = 詳細("714101012");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}取得できない日本語画像は実体の無い画像URL。`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル, "ZIPのファイル（取得できない日本語画像の次にある英語画像が、カード詳細ID.jpg として入る）").toEqual([`download/${略称("LANG-FALLBACK-012")}/${詳細ID}.jpg`]);
  });
});

caseTest("IT-M14-07-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-015A〕"), b = notes.get("〔カードセットID-M1407-015B〕");
  const 詳細ID = 詳細("714101015");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した（一覧の並びは、リリース日が新しい EMPTY-LANG-015、VALID-LANG-015 の順）。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル, "ZIPのファイル（カード詳細が0件のセットで終わらず、次のセットの日本語画像が download/JP に入る）").toEqual([`download/JP/${詳細ID}.jpg`]);
  });
});

caseTest("IT-M14-07-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-共有〕"), b = notes.get("〔カードセットID-M1407-016〕");
  const ホイル = 詳細("177252"), 非ホイル = 詳細("177253");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した。${注記_固定の番号}保存先の拡張子は、既存の画像URLのまま（登録された拡張子によらず .jpg になることを確かめる）。${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル.map((f) => f.split("/").pop()).filter((n) => n === `F${ホイル}.jpg`).length, "ホイル相当のカード詳細の F+カード詳細ID.jpg の数").toBeGreaterThan(0);
    expect.soft(z.ファイル.map((f) => f.split("/").pop()).filter((n) => n === `${非ホイル}.jpg`).length, "ホイル相当ではないカード詳細の カード詳細ID.jpg の数").toBeGreaterThan(0);
    expect.soft(z.ファイル.filter((f) => !f.endsWith(".jpg")), "拡張子が .jpg ではないファイル").toEqual([]);
  });
});

caseTest("IT-M14-07-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-017〕");
  const 取得不可 = 詳細("177290"), 取得可 = 詳細("177291");
  const r = { 取得不可: null as boolean | null, 取得可: null as boolean | null };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { r.取得不可 = 画像のデッドリンク(取得不可, 日本語); r.取得可 = 画像のデッドリンク(取得可, 日本語); });
  await expected(async () => {
    expect.soft(r.取得不可, "保存できなかったカード詳細（取得できない画像）のデッドリンク（真）").toBe(true);
    expect.soft(r.取得可, "保存に成功したカード詳細のデッドリンク（偽）").toBe(false);
  });
});

caseTest("IT-M14-07-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-021〕");
  const 応答: { status: number; type: string; disposition: string }[] = [];
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" }, 名前 = "";
  await step(1, async () => {
    note("開発者ツールのネットワーク記録の代わりに、画面の通信の応答（ステータス・ヘッダー）を記録した");
    page.on("response", (r) => {
      if (r.request().method() === "POST" && r.url().includes("/cardset/download")) void r.allHeaders().then((h) => 応答.push({ status: r.status(), type: h["content-type"] ?? "", disposition: h["content-disposition"] ?? "" }));
    });
  });
  await step(2, async () => { await L.open(); });
  await step(3, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(4, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(5, async () => { z = await ZIPを受け取る(d); 名前 = d.ダウンロード!.suggestedFilename(); await page.waitForTimeout(500); });
  await expected(async () => {
    expect.soft(応答.length, "ダウンロードの応答の数").toBeGreaterThan(0);
    const r = 応答[0] ?? { status: 0, type: "", disposition: "" };
    expect.soft(r.status, "HTTPステータス").toBe(200);
    expect.soft(r.type.toLowerCase(), "Content-Type（正本の「aplication/octet-stream;」は application/octet-stream; のこと）").toContain("application/octet-stream");
    expect.soft(r.disposition, "Content-Disposition（card_image.zip のファイル名。UTF-8 のエンコード指定つき）").toMatch(/filename\*=UTF-8''card_image\.zip/i);
    expect.soft(名前, "ダウンロードされたファイル名").toBe("card_image.zip");
    expect.soft(z.ファイル.length, "応答本体の card_image.zip を展開したファイルの数").toBeGreaterThan(0);
  });
});

caseTest("IT-M14-07-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-025〕");
  notes.get("〔画像ID-M1407-025A〕"); notes.get("〔画像ID-M1407-025B〕");
  const 登録済み = 詳細("71410025"), 未登録 = 詳細("71410025U");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル, "展開結果のファイル（選んだカードセットの1件だけ）").toEqual([`download/${略称("M1407-025-A")}/${登録済み}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${未登録}.jpg`)), "カードセット未登録のカード詳細の画像（Non Promotion フォルダを含む、ZIPのどこにも含まれない）").toEqual([]);
  });
});

caseTest("IT-M14-07-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-026〕");
  for (const k of ["026A", "026B", "026C", "026D"]) notes.get(`〔画像ID-M1407-${k}〕`);
  const 登録済み = 詳細("71410026"), 未登録 = 詳細("71410026U");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await expected(async () => {
    expect.soft(z.ファイル, "展開結果のファイル（日本語・英語の2件だけ）").toEqual([`download/EN/${登録済み}.jpg`, `download/JP/${登録済み}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${未登録}.jpg`)), "カードセット未登録のカード詳細の画像（ZIPのどこにも含まれない）").toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ダウンロードされない（エラー）。2ページ目以降のケースは、一覧を10件表示にして、古いリリース日のカードセットが2ページ目以降に並ぶ形に読み替えた
// ---------------------------------------------------------------------------
const 注記_2ページ目 = "共有の一覧は、表示件数を10件・リリース日降順にして、このカードセットが並ぶページ（2ページ目以降）へページをたどって移った（正本の「共有カードセット◯件の後」は、古いリリース日にして読み替えた）。";

/** 2ページ目以降のページを開く（ページ番号を返す） */
async function ページを開く(L: CardsetListPage, id: string): Promise<number> {
  await 一覧を整える(L, 10);
  const n = await L.行を探す(() => L.行(id), "先頭から");
  if (n === null) throw new Error(`カードセット ${id} の行が一覧に見つからない`);
  return n;
}

/** 有効なカードセットと、カードが0件のカードセットを2ページ目で選んで押す型（008〜010） */
function 空のセットを含める(n: string, 履歴: boolean, 確かめ: (r: { ダウンロード: boolean; エラー: string[]; 前: number; 後: number }) => void): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1407_ADMIN);
    const L = new CardsetListPage(page);
    const a = notes.get(`〔カードセットID-M1407-${n}A〕`), b = notes.get(`〔カードセットID-M1407-${n}B〕`);
    const r = { ダウンロード: false, エラー: [] as string[], 前: 0, 後: 0 };
    let k = 1;
    if (履歴) await step(k++, async () => { r.ダウンロード = false; });
    await step(k++, async () => { note(注記_2ページ目 + 注記_固定の番号); await L.open(); r.前 = await ページを開く(L, a); });
    await step(k++, async () => {
      if ((await L.行(b).count()) !== 1) throw new Error("2つのカードセットが同じページに並ばなかった（ページの境目に当たった。流し直す）");
      await L.行(a).locator('input[name="cardsetIds[]"]').check();
      await L.行(b).locator('input[name="cardsetIds[]"]').check();
    });
    await step(k++, async () => { const d = await L.画像ダウンロードを押す("セット別"); r.ダウンロード = d.ダウンロードした; r.エラー = d.エラー; r.後 = await L.現在のページ番号(); });
    if (履歴) await step(k++, async () => { /* ダウンロードの有無は期待結果で確かめる */ expect.soft(r.ダウンロード, "ダウンロードされたファイルの数（ダウンロード履歴）").toBe(false); });
    await expected(async () => { expect.soft(r.前, "押す前に表示していたページ（2ページ目以降）").toBeGreaterThanOrEqual(2); 確かめ(r); });
  };
}
caseTest("IT-M14-07-008", 空のセットを含める("008", true, (r) => { expect.soft(r.ダウンロード, "最初のカードセットの画像を集めた card_image.zip がダウンロードされた").toBe(false); }));
caseTest("IT-M14-07-009", 空のセットを含める("009", false, (r) => { expect.soft(r.後, "エラー後に戻ったページ（押す前と同じ2ページ目以降）").toBe(r.前); }));
caseTest("IT-M14-07-010", 空のセットを含める("010", false, (r) => {
  expect.soft(r.エラー.join(" "), "カードが無い旨のエラーメッセージ（EMPTY-AFTER-010）").toContain("カードがありません");
  expect.soft(r.ダウンロード, "ZIPがダウンロードされた").toBe(false);
}));

/** 画像が取得できないカードセットを2ページ目以降で選んで押す型（022〜024） */
function 画像なしのセット(n: string, 履歴: boolean, 確かめ: (r: { ダウンロード: boolean; エラー: string[]; 前: number; 後: number }) => void): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1407_ADMIN);
    const L = new CardsetListPage(page);
    const id = notes.get(`〔カードセットID-M1407-${n}〕`);
    const r = { ダウンロード: false, エラー: [] as string[], 前: 0, 後: 0 };
    let k = 1;
    if (履歴) await step(k++, async () => { r.ダウンロード = false; });
    await step(k++, async () => { note(注記_2ページ目 + 注記_固定の番号 + "画像は実体の無い画像URL（取得できない画像）。"); await L.open(); r.前 = await ページを開く(L, id); });
    await step(k++, async () => { await L.行(id).locator('input[name="cardsetIds[]"]').check(); });
    await step(k++, async () => { const d = await L.画像ダウンロードを押す("セット別"); r.ダウンロード = d.ダウンロードした; r.エラー = d.エラー; r.後 = await L.現在のページ番号(); });
    if (履歴) await step(k++, async () => { expect.soft(r.ダウンロード, "ダウンロード履歴にある card_image.zip").toBe(false); });
    await expected(async () => { expect.soft(r.前, "押す前に表示していたページ（2ページ目以降）").toBeGreaterThanOrEqual(2); 確かめ(r); });
  };
}
caseTest("IT-M14-07-022", 画像なしのセット("022", true, (r) => { expect.soft(r.ダウンロード, "card_image.zip がダウンロードされた").toBe(false); }));
caseTest("IT-M14-07-023", 画像なしのセット("023", false, (r) => { expect.soft(r.後, "エラー後に戻ったページ（押す前と同じ2ページ目以降）").toBe(r.前); }));
caseTest("IT-M14-07-024", 画像なしのセット("024", false, (r) => { expect.soft(r.エラー.join(" "), "画像が存在しない旨のエラーメッセージ").toContain("ダウンロードできる画像がありません"); }));

// ---------------------------------------------------------------------------
// 言語別・デッドリンク
// ---------------------------------------------------------------------------
caseTest("IT-M14-07-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-028〕");
  const 取得不可 = 詳細("727101028");
  let 値: boolean | null = null;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { 値 = 画像のデッドリンク(取得不可, 英語); });
  await expected(async () => { expect.soft(値, "保存できなかったカード詳細の英語画像のデッドリンク（真）").toBe(true); });
});

caseTest("IT-M14-07-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-029〕");
  const 詳細ID = 詳細("727101029");
  let 値: boolean | null = null;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { 値 = 画像のデッドリンク(詳細ID, 英語); });
  await expected(async () => { expect.soft(値, "保存に成功したカード詳細の英語画像のデッドリンク（偽）").toBe(false); });
});

caseTest("IT-M14-07-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-030〕");
  const r = { ダウンロード: false, エラー: [] as string[], 前: 0, 後: 0 };
  await step(1, async () => { r.ダウンロード = false; });
  await step(2, async () => { await L.open(); });
  await step(3, async () => { note(`カードセットは控えたIDで探した（表示件数は100件・リリース日降順。新しいリリース日にしてあるので1ページ目に並ぶ）。${注記_画像}`); r.前 = await セットを選ぶ(L, [s]); });
  await step(4, async () => { const d = await L.画像ダウンロードを押す("言語別"); r.ダウンロード = d.ダウンロードした; r.エラー = d.エラー; r.後 = await L.現在のページ番号(); });
  await step(5, async () => { expect.soft(r.ダウンロード, "ダウンロード履歴にある card_image.zip").toBe(false); });
  await expected(async () => {
    expect.soft(r.エラー.join(" "), "画像が存在しない旨のエラーメッセージ").toContain("ダウンロードできる画像がありません");
    expect.soft(r.後, "エラー後に表示されているページ（押す前と同じ。1ページ目）").toBe(r.前);
    expect.soft(r.ダウンロード, "card_image.zip がダウンロードされた").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 画像の取得結果とデッドリンク
// ---------------------------------------------------------------------------
caseTest("IT-M14-07-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-031A〕");
  const 詳細ID = 詳細("74110031");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" }, 値: boolean | null = null;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => { 値 = 画像のデッドリンク(詳細ID, 英語); });
  await expected(async () => {
    expect.soft(z.ファイル, "展開結果のファイル（1件だけ）").toEqual([`download/${略称("M1407-CB031-A")}/${詳細ID}.jpg`]);
    expect.soft(値, "カード詳細の英語画像のデッドリンク（偽）").toBe(false);
  });
});

caseTest("IT-M14-07-033", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-033A〕"), b = notes.get("〔カードセットID-M1407-033B〕"), 画像なし = notes.get("〔カード詳細ID-M1407-033〕");
  const 取得可 = 詳細("74110033"), 取得不可 = 詳細("74120033");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  const 値 = { 取得可: null as boolean | null, 取得不可: null as boolean | null };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => { 値.取得可 = 画像のデッドリンク(取得可, 英語); 値.取得不可 = 画像のデッドリンク(取得不可, 英語); });
  await expected(async () => {
    expect.soft(d.エラー, "エラーメッセージ").toEqual([]);
    expect.soft(z.ファイル.filter((f) => f.startsWith("download/EN/")), "download/EN のファイル").toEqual([`download/EN/${取得可}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${取得不可}.jpg`) || f.includes(`${画像なし}.jpg`)), "英語画像の実体がないカード詳細・画像0件のカード詳細のファイル").toEqual([]);
    expect.soft(値.取得可, "カード詳細の英語画像のデッドリンク（偽のまま）").toBe(false);
    expect.soft(値.取得不可, "英語画像の実体がないカード詳細の英語画像のデッドリンク（真）").toBe(true);
  });
});

caseTest("IT-M14-07-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-035A〕");
  const 詳細ID = 詳細("74110035");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  const 値 = { 日本語: null as boolean | null, 英語: null as boolean | null };
  let 基準 = { 日本語: "", 英語: "" };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => {
    値.日本語 = 画像のデッドリンク(詳細ID, 日本語); 値.英語 = 画像のデッドリンク(詳細ID, 英語);
    note("画像が日本語の内容かは、デッドリンクを確かめたあとに、同じカードセットの言語別ダウンロードで得た日本語・英語の画像の内容（ハッシュ）と照らして確かめた");
    基準 = await 言語別の内容(L, () => セットを選ぶ(L, [s]), 詳細ID, "");
  });
  await expected(async () => {
    expect.soft(z.ファイル, "展開結果のファイル（1件だけ）").toEqual([`download/${略称("M1407-CB035-A")}/${詳細ID}.jpg`]);
    expect.soft(基準.日本語 !== 基準.英語, "日本語画像と英語画像の内容が違う（照らし合わせの前提）").toBe(true);
    if (z.ファイル.length === 1) expect.soft(内容(z, z.ファイル[0]), "ファイルの内容（日本語画像と一致する）").toBe(基準.日本語);
    expect.soft(値.日本語, "日本語画像のデッドリンク（偽）").toBe(false);
    expect.soft(値.英語, "英語画像のデッドリンク（真のまま）").toBe(true);
  });
});

caseTest("IT-M14-07-036", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-036A〕"), b = notes.get("〔カードセットID-M1407-036B〕");
  const 設定済み = 詳細("74110036"), 未設定 = 詳細("74120036");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  const 値 = { 設定済み: null as boolean | null, 未設定: null as boolean | null };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => { 値.設定済み = 画像のデッドリンク(設定済み, 日本語); 値.未設定 = 画像のデッドリンク(未設定, 日本語); });
  await expected(async () => {
    expect.soft(d.エラー, "エラーメッセージ").toEqual([]);
    expect.soft(z.ファイル.filter((f) => f.startsWith("download/JP/")), "download/JP のファイル").toEqual([`download/JP/${設定済み}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${未設定}.jpg`)), "プロモーション未設定のカード詳細のファイル").toEqual([]);
    expect.soft(値.設定済み, "プロモーション設定済みのカード詳細の日本語画像のデッドリンク（偽）").toBe(false);
    expect.soft(値.未設定, "プロモーション未設定のカード詳細の日本語画像のデッドリンク（真のまま）").toBe(true);
  });
});

caseTest("IT-M14-07-037", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const a = notes.get("〔カードセットID-M1407-037A〕"), b = notes.get("〔カードセットID-M1407-037B〕");
  const 設定済み = 詳細("74110037"), 未設定 = 詳細("74120037");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" };
  const 値 = { 日本語: null as boolean | null, 英語: null as boolean | null };
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`2つのカードセットは、控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [a, b]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("言語別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => { 値.日本語 = 画像のデッドリンク(設定済み, 日本語); 値.英語 = 画像のデッドリンク(設定済み, 英語); });
  await expected(async () => {
    expect.soft(d.エラー, "エラーメッセージ").toEqual([]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${設定済み}.jpg`)).sort(), "download/JP と download/EN の両方にあるプロモーション設定済みのカード詳細のファイル").toEqual([`download/EN/${設定済み}.jpg`, `download/JP/${設定済み}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${未設定}.jpg`)), "プロモーション未設定のカード詳細のファイル").toEqual([]);
    expect.soft(値.日本語, "日本語画像のデッドリンク（偽のまま）").toBe(false);
    expect.soft(値.英語, "英語画像のデッドリンク（偽のまま）").toBe(false);
  });
});

caseTest("IT-M14-07-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-038A〕");
  const 設定済み = 詳細("74110038"), 未設定 = 詳細("74120038");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" }, 値: boolean | null = null;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => { 値 = 画像のデッドリンク(設定済み, 英語); });
  await expected(async () => {
    expect.soft(z.ファイル.filter((f) => !f.includes(`${未設定}.jpg`)), "展開結果のファイル（プロモーション設定済みの1件だけ）").toEqual([`download/${略称("M1407-CB038-A")}/${設定済み}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${未設定}.jpg`)), "プロモーション未設定のカード詳細のファイル").toEqual([]);
    expect.soft(値, "カード詳細の英語画像のデッドリンク（偽のまま）").toBe(false);
  });
});

caseTest("IT-M14-07-039", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1407_ADMIN);
  const L = new CardsetListPage(page);
  const s = notes.get("〔カードセットID-M1407-039A〕"), 画像なし = notes.get("〔カード詳細ID-M1407-039〕");
  const 詳細ID = 詳細("74110039");
  let d: ダウンロードの結果, z: 展開結果 = { ファイル: [], dir: "" }, 値: boolean | null = null;
  await step(1, async () => { await L.open(); });
  await step(2, async () => { note(`カードセットは控えたIDで探した。${注記_固定の番号}${注記_画像}`); await セットを選ぶ(L, [s]); });
  await step(3, async () => { d = await L.画像ダウンロードを押す("セット別"); });
  await step(4, async () => { z = await ZIPを受け取る(d); });
  await step(5, async () => { 値 = 画像のデッドリンク(詳細ID, 日本語); });
  await expected(async () => {
    expect.soft(z.ファイル, "展開結果のファイル（1件だけ）").toEqual([`download/${略称("M1407-CB039-A")}/${詳細ID}.jpg`]);
    expect.soft(z.ファイル.filter((f) => f.includes(`${画像なし}.jpg`)), "画像0件のカード詳細のファイル").toEqual([]);
    expect.soft(値, "カード詳細の日本語画像のデッドリンク（偽）").toBe(false);
  });
});

