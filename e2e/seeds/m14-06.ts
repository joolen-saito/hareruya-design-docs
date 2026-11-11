/**
 * M14-06 カードセット管理(一覧) / M14-07 カードセット管理(画像ダウンロード) のシードの作り方（画面操作）。
 * カードセット名・略称・セット名(英)は、実行ごとの印を付ける（略称は欄の上限があるので短い印にならない場合は名称側だけに付ける）。
 */
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ensureCardset } from "../pages/admin/product_masters";
import { ensureAnalysisAdmin } from "./m12-common";
import { join } from "node:path";
import { Browser } from "@playwright/test";
import { Notes } from "../lib/notes";
import { buildCardCsv, downloadCardCsvTemplate, uploadCardCsv } from "../pages/admin/card_csv";
import { CardsetEditPage } from "../pages/admin/m14_06_cardset_list";
import { カードセット総数, セットの詳細IDs } from "../db/m14_06_cardset";
import { プロモの英語名, レアリティの英語名, レイアウトの英語名 } from "../db/m14_04_card";
import { プロモ, レアリティ, レイアウト } from "./m14-04";

const シンボル画像 = join(__dirname, "..", "fixtures", "m14-06", "symbol.png");

export const M1406_ADMIN: Account = { loginId: "m1406_admin", password: "Passw0rd!M1406" };
export const M1407_ADMIN: Account = { loginId: "m1407_admin", password: "Passw0rd!M1407" };

defineSeed("S-M14-06-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-06試験管理者", account: M1406_ADMIN, メール: "m1406_admin@example.test" }); });
defineSeed("S-M14-06-SESSION", async () => { /* 新しいブラウザセッションでログインする（ケースがログインから始める） */ });
defineSeed("S-M14-07-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-07試験管理者", account: M1407_ADMIN, メール: "m1407_admin@example.test" }); });
defineSeed("S-M14-07-SESSION", async () => { /* 新しいブラウザセッションでログインする（ケースがログインから始める） */ });

type 設定 = { リリース日?: string; 特殊セット?: boolean; シンボル?: boolean };

/** カードセットを画面で登録する（名称は印つき。リリース日の既定は今日。opts があれば、登録したあと編集画面で設定する） */
export async function セットを作る(browser: Browser, seedId: string, 日: string, 英: string, 略称: string, opts?: 設定): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const id = await ensureCardset(page, rc(日), rc(英), 略称, (m) => reportSeedIssue(seedId, m));
    if (opts && (opts.リリース日 !== undefined || opts.特殊セット !== undefined || opts.シンボル)) {
      const 警告 = await new CardsetEditPage(page).設定する(id, { リリース日: opts.リリース日, 特殊セット: opts.特殊セット, シンボル画像: opts.シンボル ? シンボル画像 : undefined }, seedId);
      for (const w of 警告) reportSeedIssue(seedId, w);
    }
    return id;
  });
}

/**
 * 一覧が複数ページになるよう、カードセットの総数を n 件以上にする（足りない分だけ、印つきの補充用セットを画面で登録する）。
 * 正本は「12001件を登録」「本シードの11件」だが、一覧は共有で、ほかの試験のカードセットが並ぶ。複数ページの確認に要るのは件数だけなので、この読み替えをする。
 */
export async function 総数を満たす(browser: Browser, seedId: string, n: number): Promise<void> {
  const 足りない = n - カードセット総数();
  for (let i = 1; i <= 足りない; i++) await セットを作る(browser, seedId, `M1406補充${i}`, `Filler${i}`, `FILL-M1406-${i}`);
  if (足りない > 0) reportSeedIssue(seedId, `カードセットの総数を ${n} 件以上にするため、補充用のカードセットを ${足りない} 件、画面で登録した（正本の件数は、共有の一覧では用意できないので読み替えた）`);
}

/** 収録カードを画面（カードCSVの取り込み）で入れる。画像URLの先に画像の実体は無い（取得できない画像） */
export async function カードを入れる(browser: Browser, seedId: string, 行: { 名: string; セット英名: string }[]): Promise<void> {
  const need = (v: string | null, n: string) => { if (!v) throw new Error(`${seedId}: ${n}の英語名を引けない（マスターのシードが未作成）`); return v; };
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const headers = await downloadCardCsvTemplate(page);
    const csv = buildCardCsv(headers, 行.map((x, i) => ({
      name_jp: x.名, name_en: rc(x.名), cmc: "2", rarity: need(レアリティの英語名(レアリティ), "レアリティ"), layout: need(レイアウトの英語名(レイアウト), "レイアウト"),
      promotion_type: need(プロモの英語名(プロモ), "プロモ種別"), foil: "0", frame: "Normal", image_en: `img/m1406/${rc(x.名)}-${i + 1}.jpg`, set: x.セット英名,
    })));
    await uploadCardCsv(page, csv, "m1406-card.csv", `${seedId} のカードCSV登録`, (m) => reportSeedIssue(seedId, m));
  });
}

const 英字 = "ABCDEFGH";

defineSeed("S-M14-06-LIST-001", async ({ browser, notes, seed }) => {
  const ids: string[] = [];
  for (const [i, [略, 英]] of ([["ALP-001", "Alpha-001"], ["BET-001", "Bravo-001"], ["GAM-001", "Charlie-001"], ["DEL-M1406-001", "Delta-001"]] as const).entries()) {
    ids.push(await セットを作る(browser, seed.シードID, `M1406一覧セット${i + 1}`, 英, 略));
  }
  ["A", "B", "C", "D"].forEach((s, i) => notes.set(`〔カードセットID-M1406-001${s}〕`, ids[i]));
  reportSeedIssue(seed.シードID, "特殊セットフラグ・シンボル画像・リリース日は設定せず、名称・略称だけで登録した（一覧の列を確かめるケースで、その値は確かめない）");
});
defineSeed("S-M14-06-NAV-006", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1406-006〕", await セットを作る(browser, seed.シードID, "遷移確認セット006", "Navigation006", "NAV-006")); });
defineSeed("S-M14-06-NAV-007", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1406-007〕", await セットを作る(browser, seed.シードID, "遷移確認セット007", "Navigation007", "NAV-007")); });
defineSeed("S-M14-06-LIST-030", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1406-030〕", await セットを作る(browser, seed.シードID, "確認ダイアログ用セット030", "Dialog030", "CONFIRM-030")); });
defineSeed("S-M14-07-DIALOG-003", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1407-003〕", await セットを作る(browser, seed.シードID, "M1407セット003", "M1407 Set 003", "M14-07-DIALOG-003")); });
defineSeed("S-M14-07-DIALOG-004", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1407-004〕", await セットを作る(browser, seed.シードID, "M1407セット004", "M1407 Set 004", "M14-07-DIALOG-004")); });

// ---------------------------------------------------------------------------
// 一覧の項目・並び・行操作
// ---------------------------------------------------------------------------
const 印の注記 = "カードセットとカード詳細は本シードのものだけ、という前提は共有の一覧では作れない。この試験のカードセットは実行の印つきの名称で作り、行はそのIDか名称で探す";

defineSeed("S-M14-06-LIST-002", async ({ browser, notes, seed }) => {
  const 値 = [["ALP-002", "Alpha-002", "2026-04-01"], ["BET-002", "Bravo-002", "2026-03-01"], ["GAM-002", "Charlie-002", "2026-02-01"], ["DEL-002", "Delta-002", "2026-01-01"]] as const;
  for (const [i, [略, 英, 日]] of 値.entries()) notes.set(`〔カードセットID-M1406-002${英字[i]}〕`, await セットを作る(browser, seed.シードID, `M1406全件照合セット${i + 1}`, 英, 略, { リリース日: 日, シンボル: true }));
  reportSeedIssue(seed.シードID, "セット名(日)は他と重ならない実行の印つきの名称にした。シンボル画像は試験用の小さな画像。" + 印の注記);
});
defineSeed("S-M14-06-LIST-003", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1406-003〕", await セットを作る(browser, seed.シードID, "M1406特殊セット003", "Special003", "SPC-003", { リリース日: "2026-04-01", 特殊セット: true }));
  for (const [i, 日] of ["2026-03-01", "2026-02-01", "2026-01-01"].entries()) await セットを作る(browser, seed.シードID, `M1406通常セット003-${i + 1}`, `Normal003-${i + 1}`, `NRM-003-${i + 1}`, { リリース日: 日 });
  reportSeedIssue(seed.シードID, 印の注記);
});
for (const n of ["008", "009"]) {
  defineSeed(`S-M14-06-LIST-${n}`, async ({ browser, notes, seed }) => {
    notes.set(`〔カードセットID-M1406-${n}〕`, await セットを作る(browser, seed.シードID, `M1406行操作セット${n}`, `RowOps${n}`, `ROW-${n}`));
    for (const i of [1, 2, 3]) await セットを作る(browser, seed.シードID, `M1406行操作補助${n}-${i}`, `RowOpsSub${n}-${i}`, `ROWS-${n}-${i}`);
    reportSeedIssue(seed.シードID, "4件を今日のリリース日で登録した（1ページ目に置く代わりに、ケースが一覧のページをたどって行を探す）。" + 印の注記);
  });
}
defineSeed("S-M14-06-LIST-010", async ({ browser, notes, seed }) => {
  for (const i of [0, 1, 2, 3]) notes.set(`〔カードセットID-M1406-010${英字[i]}〕`, await セットを作る(browser, seed.シードID, `M1406全選択セット${i + 1}`, `SelectAll${i + 1}`, `SEL-010-${i + 1}`));
  reportSeedIssue(seed.シードID, 印の注記);
});
defineSeed("S-M14-06-LIST-012", async ({ browser, seed }) => {
  for (const [i, [英, 日]] of ([["Alpha-012", "2026-04-01"], ["Bravo-012", "2026-03-01"], ["Charlie-012", "2026-02-01"], ["Delta-012", "2026-01-01"]] as const).entries()) {
    await セットを作る(browser, seed.シードID, `M1406並び順セット${i + 1}`, 英, `ORD-012-${i + 1}`, { リリース日: 日 });
  }
  reportSeedIssue(seed.シードID, "セット名(英)に実行の印を付けた（例 Alpha-012-印）。印は4件で同じなので、英名の並びは正本どおり。" + 印の注記);
});
defineSeed("S-M14-06-LIST-042", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1406-042A〕", await セットを作る(browser, seed.シードID, "M1406特殊セット042", "Special042", "SPC-042", { リリース日: "2026-04-01", 特殊セット: true }));
  notes.set("〔カードセットID-M1406-042B〕", await セットを作る(browser, seed.シードID, "M1406通常セット042", "Normal042", "NRM-042", { リリース日: "2026-03-01", 特殊セット: false }));
  reportSeedIssue(seed.シードID, 印の注記);
});

// ---------------------------------------------------------------------------
// ページング（複数ページになる件数があればよいもの。正本の12001件は共有の一覧では用意しない）
// ---------------------------------------------------------------------------
for (const n of ["015", "016", "017", "018", "020"]) {
  defineSeed(`S-M14-06-LARGE-${n}`, async ({ browser, seed }) => {
    await 総数を満たす(browser, seed.シードID, 11);
    reportSeedIssue(seed.シードID, "12001件の登録は読み替えた。10件表示で2ページ目ができる11件以上があればよいケースなので、カードセットの総数を11件以上にした");
  });
}

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------
/** 一覧の最後のほうのページに出るよう、古いリリース日（年ごとに変える）にする */
const 古い日 = (年: number, 月 = 1) => `${年}-${String(月).padStart(2, "0")}-01`;

defineSeed("S-M14-06-DELETE-FREE-023", async ({ browser, notes, seed }) => {
  notes.set("〔カードセットID-M1406-023〕", await セットを作る(browser, seed.シードID, "M1406削除可能セット023", "Deletable023", "DEL-023"));
  reportSeedIssue(seed.シードID, "収録カードは0件のまま。" + 印の注記);
});
defineSeed("S-M14-06-DELETE-FREE-024", async ({ browser, notes, seed }) => {
  await 総数を満たす(browser, seed.シードID, 11);
  notes.set("〔カードセットID-M1406-024〕", await セットを作る(browser, seed.シードID, "M1406削除可能セット024", "Deletable024", "DEL-024", { リリース日: 古い日(2006) }));
  reportSeedIssue(seed.シードID, "「リリース日降順・10件表示で2ページ目の先頭」は、古いリリース日（2006年）にして一覧の後ろのほうのページに出る形に読み替えた。" + 印の注記);
});
async function 使用中のセット(browser: Browser, notes: Notes, seedId: string, n: string, 日?: string): Promise<void> {
  const id = await セットを作る(browser, seedId, `M1406削除不可セット${n}`, `InUse${n}`, `USE-${n}`, 日 ? { リリース日: 日 } : undefined);
  await カードを入れる(browser, seedId, [{ 名: `M1406収録カード${n}`, セット英名: rc(`InUse${n}`) }]);
  const 詳細 = セットの詳細IDs(id);
  if (詳細.length !== 1) throw new Error(`${seedId}: 収録カードの詳細が ${詳細.length} 件（1件のはず）`);
  notes.set(`〔カードセットID-M1406-${n}〕`, id);
  notes.set(`〔カード詳細ID-M1406-${n}〕`, 詳細[0]);
  reportSeedIssue(seedId, "収録カードは、カードCSVの取り込みで1件登録した（画像URLの先に画像の実体は無い）。" + 印の注記);
}
defineSeed("S-M14-06-DELETE-INUSE-025", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => { await 使用中のセット(browser, notes, seed.シードID, "025"); });
defineSeed("S-M14-06-DELETE-INUSE-026", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 総数を満たす(browser, seed.シードID, 11);
  await 使用中のセット(browser, notes, seed.シードID, "026", 古い日(2007));
});

// ---------------------------------------------------------------------------
// 画像ダウンロード（画像の実体は用意できないので、エラー側・取得できない画像のケースだけ）
// ---------------------------------------------------------------------------
const 実体なし = "画像URLの先に画像の実体は無い（画像の実体は画面から置けないので用意しない）";
for (const n of ["033", "034"]) {
  defineSeed(`S-M14-06-DOWNLOAD-${n}`, { needs: ["S-M14-04-MASTER"] }, async ({ browser, seed }) => {
    await 総数を満たす(browser, seed.シードID, 11);
    const y = n === "033" ? 2003 : 2004;
    await セットを作る(browser, seed.シードID, `M1406複数セットA${n}`, `MultiA${n}`, rc(`SET-A-${n}`), { リリース日: 古い日(y, 2) });
    await セットを作る(browser, seed.シードID, `M1406複数セットB${n}`, `MultiB${n}`, rc(`SET-B-${n}`), { リリース日: 古い日(y, 1) });
    await カードを入れる(browser, seed.シードID, [{ 名: `M1406複数セットのカード${n}`, セット英名: rc(`MultiA${n}`) }]);
    reportSeedIssue(seed.シードID, `SET-A-${n} は画像つきのカード詳細1件、SET-B-${n} はカード詳細0件。略称には実行の印を付けた。2セットが一覧で隣り合って後ろのほうのページに並ぶよう、古いリリース日（${y}年）にした。SET-A の画像は取得できない画像（${実体なし}）。` + 印の注記);
  });
}
defineSeed("S-M14-06-DOWNLOAD-036", { needs: ["S-M14-04-MASTER"] }, async ({ browser, seed }) => {
  await セットを作る(browser, seed.シードID, "M1406デッドリンクセット036", "DeadLink036", rc("SET-A-036"));
  await カードを入れる(browser, seed.シードID, [{ 名: "M1406デッドリンクのカード036", セット英名: rc("DeadLink036") }]);
  reportSeedIssue(seed.シードID, `SET-A-036 に、デッドリンク=false で画像の実体が無い画像を持つカード詳細を1件（正本は3件で、うち2件は取得可能な画像）。取得可能な画像は用意できないので、実体の無い1件だけにした。略称には実行の印を付けた。${実体なし}。` + 印の注記);
});
defineSeed("S-M14-06-ALL-MISSING-041", { needs: ["S-M14-04-MASTER"] }, async ({ browser, seed }) => {
  await セットを作る(browser, seed.シードID, "M1406画像なしセット041", "Missing041", rc("MISS-041"));
  await カードを入れる(browser, seed.シードID, [{ 名: "M1406画像なしのカード041", セット英名: rc("Missing041") }]);
  reportSeedIssue(seed.シードID, `MISS-041 に、プロモーション設定済みで画像のレコードを持つカード詳細を1件。略称には実行の印を付けた。${実体なし}。` + 印の注記);
});
defineSeed("S-M14-06-DOWNLOAD-043", async ({ browser, seed }) => {
  await 総数を満たす(browser, seed.シードID, 11);
  await セットを作る(browser, seed.シードID, "M1406収録カードなしセット043", "NoCards043", rc("M1406-043-A"), { リリース日: 古い日(2005) });
  reportSeedIssue(seed.シードID, "「ほかの10件はより新しいリリース日」は、古いリリース日（2005年）にして一覧の後ろのほうのページに出る形に読み替えた。略称には実行の印を付けた。" + 印の注記);
});
