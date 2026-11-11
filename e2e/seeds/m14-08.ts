/**
 * M14-08 カードセット詳細(登録・編集・削除) のシードの作り方（画面操作）。正本: cases/M14-08_seed_data.tsv
 *
 * 方針（依頼者 2026-11-10）:
 *  - 名称・略称には実行ごとの印を付けた新規のカードセットを画面で登録する（「同じ名称のカードセットが無い」前提は印で満たす）。
 *  - シード表の「DBで既存を退避」「51件・60件だけが存在」は、共有の一覧を書き換えられないので、印つきの1件で確かめる形に読み替える。
 *  - 共有のマスタ（ブロックなど）には試験の値を足さない。
 */
import { Browser } from "@playwright/test";
import { join } from "node:path";
import { SETUP_ADMIN } from "../config/env";
import { writeTestData } from "../db/write_adapter";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { RUN_MARK, rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { カードを登録する } from "../pages/admin/m14_card";
import { CardsetDetailPage } from "../pages/admin/m14_08_cardset_detail";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1408_ADMIN: Account = { loginId: "m1408_admin", password: "Passw0rd!M1408" };
export const M1408L_ADMIN: Account = { loginId: "m1408l_admin", password: "Passw0rd!M1408L" };

const fx = (n: string) => join(__dirname, "..", "fixtures", "m14-08", n);
export const 画像 = { 緑: fx("new-symbol.png"), 青: fx("symbol-032-blue.png"), 赤: fx("symbol-032-red.png"), 追加用: fx("m1408-055-symbol.png") };
const 既定のリリース日 = "2025-09-18";

defineSeed("S-M14-08-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-08試験管理者", account: M1408_ADMIN, メール: "m1408_admin@example.test" }); });
// 新規登録のケースが使う「未登録」の前提。名称に実行ごとの印を付けるので、前の実行のカードセットとは重ならない
for (const id of ["NEW-006", "NEW-007", "NEW-025", "NEW-030", "NEW-050", "CBNEWNOIMG-057", "L-NEW-046"]) defineSeed(`S-M14-08-${id}`, async () => { /* 同じ名称のカードセットは0件（印つきの名称で登録する） */ });
// 文字数の上限を確かめる値（64文字・50文字）は印を付けられない。同じ値のカードセットが既にあっても、名称の重複で止まることは無い
defineSeed("S-M14-08-NEW-011", async () => { /* 同じ名称のカードセットは前の実行が無ければ0件 */ });

type セット指定 = { 日: string; 英: string; 略称: string; リリース日?: string; ブロックID?: string; 特殊セット?: boolean; 画像?: string };

/** カードセットを画面で登録する（名称・略称は印つき）。登録後のカードセットIDを返す */
async function セットを作る(browser: Browser, seedId: string, v: セット指定): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const d = new CardsetDetailPage(page);
    await d.登録画面を開く();
    let ブロック: string | undefined;
    if (v.ブロックID) {
      ブロック = (await d.ブロック名(v.ブロックID)) ?? undefined;
      if (!ブロック) throw new Error(`${seedId}: ブロック選択に値 ${v.ブロックID} の選択肢が無い`);
    }
    await d.入力する({ 名日: rc(v.日), 名英: rc(v.英), 略称: rc(v.略称), リリース日: v.リリース日 ?? 既定のリリース日, ブロック, 特殊セット: v.特殊セット, シンボル画像: v.画像 });
    return d.登録して控える(seedId);
  });
}

let カード通番 = 0;
/** 収録カードを画面で登録する（カード名は印つき）。カードIDを返す */
async function カードを入れる(browser: Browser, seedId: string, 名: string, セット名: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    カード通番++;
    return カードを登録する(page, { カード名日: rc(名), カード名英: `M1408 Card ${RUN_MARK} ${カード通番}`, 点数で見たマナ: "1", 詳細: { カードセット: rc(セット名) } }, seedId, (m) => reportSeedIssue(seedId, m));
  });
}

// 基本の編集前カードセット（リリース日 2025/09/18、収録カードなし、画像なし）
for (const n of ["003", "013", "017", "019", "020", "026", "028", "029"]) {
  defineSeed(`S-M14-08-BASE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔カードセットID-M1408-${n}〕`, await セットを作る(browser, seed.シードID, { 日: `編集前カードセット-${n}`, 英: `Before Card Set-${n}`, 略称: `BEFORE-${n}` }));
  });
}
defineSeed("S-M14-08-BASE-014", { needs: ["S-M14-08-BLOCK"] }, async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1408-014〕", await セットを作る(browser, seed.シードID, { 日: "編集前カードセット-014", 英: "Before Card Set-014", 略称: "BEFORE-014", ブロックID: notes.get("〔カードセットブロックID-M1408-共有〕"), 特殊セット: true }));
});
defineSeed("S-M14-08-LOOKUP-027", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1408-027〕", await セットを作る(browser, seed.シードID, { 日: "URL確認カードセット-027", 英: "URL Check Card Set-027", 略称: "URLCHECK-027" }));
});

// 収録カードありカードセット。A: 収録カードのあるセット、B: 別のセット（他セットのカード用）
for (const n of ["016", "033", "034"]) {
  defineSeed(`S-M14-08-WITH-CARD-${n}`, async ({ browser, notes, seed }) => {
    const A = await セットを作る(browser, seed.シードID, { 日: `収録カードありセット-${n}`, 英: `Card Included Set-${n}`, 略称: `WITHCARD-${n}` });
    const B = await セットを作る(browser, seed.シードID, { 日: `他セット-${n}`, 英: `Other Set ${n}`, 略称: `OTHER-${n}` });
    notes.set(`〔カードセットID-M1408-${n}A〕`, A); notes.set(`〔カードセットID-M1408-${n}B〕`, B);
    const 名A = n === "033" ? "収録カードA-033" : "収録カードA";
    const 名B = n === "033" ? "他セットカードB-033" : "他セットカードB";
    notes.set(`〔カードID-M1408-${n}A〕`, await カードを入れる(browser, seed.シードID, 名A, `収録カードありセット-${n}`));
    notes.set(`〔カードID-M1408-${n}B〕`, await カードを入れる(browser, seed.シードID, 名B, `他セット-${n}`));
  });
}
for (const n of ["038", "039"]) {
  defineSeed(`S-M14-08-WITH-CARD-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔カードセットID-M1408-${n}〕`, await セットを作る(browser, seed.シードID, { 日: `収録カードありセット-${n}`, 英: `Card Included Set-${n}`, 略称: `WITHCARD-${n}` }));
    notes.set(`〔カードID-M1408-${n}〕`, await カードを入れる(browser, seed.シードID, `収録カードA-${n}`, `収録カードありセット-${n}`));
  });
}

// 画像
defineSeed("S-M14-08-IMAGE-031", async ({ browser, notes, seed }) => {
  const id = await セットを作る(browser, seed.シードID, { 日: "画像編集カードセット-031", 英: "Image Edit Card Set-031", 略称: "IMAGEOLD-031" });
  notes.set("〔カードセットID-M1408-031〕", id);
  writeTestData({
    理由: "M14-08-031: シンボル画像の値を symbol.png-031 にする（画面でアップロードすると保存名を画面が自動で付けるため）",
    sql: "update mtb_cardset set symbol_image = $1 where id = $2", params: ["symbol.png-031", id],
    対象の確かめ: "select name_jp from mtb_cardset where id = $1", 確かめのparams: [id], 印: RUN_MARK, 最大行数: 1,
  });
  reportSeedIssue(seed.シードID, "DBでシンボル画像の値を「symbol.png-031」に設定した（実行の印つきのカードセットだけ）。画像の実体（青色）は配置していない。ケースは値が変わらないことだけを確かめる");
});
defineSeed("S-M14-08-IMAGE-032", async ({ browser, notes, seed }) => {
  const id = await セットを作る(browser, seed.シードID, { 日: "画像編集カードセット-032", 英: "Image Edit Card Set-032", 略称: "IMAGEOLD-032", 画像: 画像.青 });
  notes.set("〔カードセットID-M1408-032〕", id);
  reportSeedIssue(seed.シードID, "保存済みの青色のシンボル画像は、DBで値を指定せず、画面で青色の画像をアップロードして用意した（保存名は画面が付けるので「symbol.png-032」とは違う）。赤色の画像も、ファイル名は symbol-032-red.png で用意した（拡張子が png でないと画面が受け付けない）");
});

// 削除・画像の有無
for (const n of ["035", "036", "040", "041"]) {
  defineSeed(`S-M14-08-DELETE-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔カードセットID-M1408-${n}〕`, await セットを作る(browser, seed.シードID, { 日: `削除確認セット-${n}`, 英: `Delete Check Set-${n}`, 略称: `DELETE-${n}` }));
  });
}
for (const [seedId, n] of [["S-M14-08-NOIMG-051", "051"], ["S-M14-08-NOIMG-052", "052"], ["S-M14-08-DP-NOIMG-055", "055"], ["S-M14-08-DP-BASE-056", "056"]] as const) {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    notes.set(`〔カードセットID-M1408-${n}〕`, await セットを作る(browser, seed.シードID, { 日: `M1408-${n}-A`, 英: `M1408-${n}-A`, 略称: `M1408-${n}-A` }));
  });
}

// 一覧への戻り。正本は「51件・60件だけが存在」にしてから確かめるが、共有の一覧は書き換えられない。印つきの1件で確かめる
defineSeed("S-M14-08-PAGING-037", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1408-037〕", await セットを作る(browser, seed.シードID, { 日: "ページングセット-037-041", 英: "Paging Set 037 041", 略称: "PG037041", リリース日: "1990-01-01" }));
  reportSeedIssue(seed.シードID, "既存のカードセットの退避と51件の登録はせず、リリース日が古い印つきの1件だけを登録した（共有の一覧は書き換えない。降順の一覧では最後のページに出る。ケースがそのページ番号を調べる）");
});
defineSeed("S-M14-08-PAGING-043", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1408-043〕", await セットを作る(browser, seed.シードID, { 日: "一覧復帰対象セット-043", 英: "000-Return Target-043", 略称: "RETURN-043" }));
  reportSeedIssue(seed.シードID, "既存のカードセットの退避と51件の登録はせず、セット英名が「000-」で始まる印つきの1件だけを登録した（セット英名の昇順で先頭近くに出る）");
});
defineSeed("S-M14-08-PAGING-053", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1408-053〕", await セットを作る(browser, seed.シードID, { 日: "M1408-053-060", 英: "M1408-053-060", 略称: "M1408-053-060" }));
  reportSeedIssue(seed.シードID, "既存のカードセットの退避と60件の登録はせず、印つきの1件だけを登録した。一覧の保持ページを残さないため、ケースは新しいログインのセッションで始める");
});
