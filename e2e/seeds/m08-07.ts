/**
 * M08-07 メール送信履歴（メール配信履歴画面）のシード。流せる見込みのケース（実施不可でないもの＋仕分け直し recheck2）。正本: cases/M08-07_seed_data.tsv
 *
 * 型: 会員はフロントの新規会員登録（seeds/m08-05-07-common.ts）→ 管理画面の会員一覧で会員IDを控える →
 * 会員検索一覧でその会員だけを選び「その他」→「メール一括送信」でメールを送ってメール履歴を作る（宛先は E2E の会員の example.test のアドレスだけ）→
 * 処理日（送信日時）とテンプレートは画面で指定できないので、E2E の会員のメール履歴に DB で書く（正本の作り方どおり。db/m08_05_07.ts）。
 *
 * シードでの解釈（正本の外の補い。記録 review/M08-07_progress_2026-11-11_dev.md にも書く）:
 * - メールテンプレート（テンプレートA・B、017 のテンプレート、CB018〜021 のテンプレートA・B）: 全員が使うメールテンプレートの一覧に試験用のテンプレートを
 *   足さない（テンプレートの登録はサーバーにテンプレートのファイルも作る）。開発環境に既にあるテンプレートの ID の小さい2件を、テンプレートA・Bとして読み替える。
 *   テンプレートの名前・件名は書き換えないので、期待結果の「現在のテンプレートA件名」などは、そのテンプレートのいまの件名で読み替える（条件付き）。
 * - 会員のメールアドレスは、@ の前に実行の印を付けた。氏名の「M0807-015-」などはシード表どおり。
 * - 受信箱の「0件にする」（MAIL-016・017）: 受け口のメールは消さない（ほかの方の試験のメールも入っているため）。ケースの手順の前に受け口の番号を控え、そのあとに届いたものを数える。
 * - S-M08-07-ABSENT: 会員ID 999999 の会員・メール履歴が無いことを DB の参照で確かめるだけ（ほかの方のデータは消さない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { メールテンプレート, メール履歴, メール履歴の数, メール履歴を設定する, 会員があるか, 既存のメールテンプレート } from "../db/m08_05_07";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 会員にメールを送る } from "../pages/admin/m08_05_07";
import { 会員を作る, 作った会員, 控える, 試験管理者を用意する } from "./m08-05-07-common";

export const M0807_ADMIN: Account = { loginId: rcFixed("m0807_admin").toLowerCase(), password: "Passw0rd!M0807" };

defineSeed("S-M08-07-ADM", async ({ browser }) => { await 試験管理者を用意する(browser, rcFixed("M08-07試験管理者"), M0807_ADMIN); });

/** テンプレートA・Bの読み替え（開発環境に既にあるテンプレートの ID の小さい2件） */
export function テンプレートAB(): { A: メールテンプレート; B: メールテンプレート } {
  const t = 既存のメールテンプレート(2);
  if (t.length < 2) throw new Error("開発環境のメールテンプレートが2件より少ない");
  return { A: t[0], B: t[1] };
}
const テンプレートの補い = (): string => {
  const { A, B } = テンプレートAB();
  return `メールテンプレートは足さず、開発環境に既にあるテンプレートで読み替えた（テンプレートA＝ID ${A.ID}「${A.名前}」・件名「${A.件名}」、テンプレートB＝ID ${B.ID}「${B.名前}」・件名「${B.件名}」）`;
};

defineSeed("S-M08-07-TEMPLATES", async ({ notes, seed }) => {
  const { A, B } = テンプレートAB();
  控える(notes, seed.シードID, "〔テンプレートID-M0807-共有A〕", A.ID);
  控える(notes, seed.シードID, "〔テンプレートID-M0807-共有B〕", B.ID);
  reportSeedIssue(seed.シードID, テンプレートの補い());
});

const 共有の会員: Record<"A" | "B", 作った会員 | null> = { A: null, B: null };
defineSeed("S-M08-07-CUSTOMERS", async ({ browser, notes, seed }) => {
  for (const k of ["A", "B"] as const) {
    if (!共有の会員[k]) {
      共有の会員[k] = await 会員を作る(browser, { 前半: `m0807-cust-${k.toLowerCase()}`, 姓: "履歴試験", 名: `会員${k}`, セイ: "リレキシケン", メイ: "カイイン", パスワード: `Passw0rd!M0807${k.toLowerCase()}` });
    }
    控える(notes, seed.シードID, `〔会員ID-M0807-共有${k}〕`, 共有の会員[k]!.会員ID);
  }
});
export function 共有の会員の(k: "A" | "B"): 作った会員 {
  const m = 共有の会員[k];
  if (!m) throw new Error(`S-M08-07-CUSTOMERS の会員${k} をまだ作っていない`);
  return m;
}

type 送る履歴 = { 件名: string; 本文: string; 処理日: string; テンプレート: "A" | "B" | null };

/** 会員にメールを1通ずつ送ってメール履歴を作り、処理日とテンプレートを DB でそろえる */
async function 履歴を作る(browser: Browser, seedId: string, m: 作った会員, rows: 送る履歴[]): Promise<void> {
  const { A, B } = テンプレートAB();
  for (const r of rows) {
    const before = new Set(メール履歴(m.会員ID).map((h) => h.履歴ID));
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await 会員にメールを送る(page, m.メール, m.会員ID, r.件名, r.本文, `${seedId}: 「${r.件名}」のメール一括送信`);
    });
    const added = メール履歴(m.会員ID).filter((h) => !before.has(h.履歴ID));
    if (added.length !== 1) throw new Error(`${seedId}: 「${r.件名}」を送ったが、足されたメール履歴が ${added.length} 件（1件のはず）`);
    メール履歴を設定する(`${seedId}: 「${r.件名}」の処理日とテンプレート`, added[0].履歴ID, { 処理日: r.処理日, テンプレートID: r.テンプレート === "A" ? A.ID : r.テンプレート === "B" ? B.ID : null });
  }
}

defineSeed("S-M08-07-HISTORIES", { needs: ["S-M08-07-CUSTOMERS", "S-M08-07-TEMPLATES"] }, async ({ browser, seed }) => {
  const a = 共有の会員の("A"), b = 共有の会員の("B");
  if (メール履歴の数(a.会員ID) === 4 && メール履歴の数(b.会員ID) === 1) return; // 同じ起動の中で作り済み
  if (メール履歴の数(a.会員ID) || メール履歴の数(b.会員ID)) throw new Error(`${seed.シードID}: 会員A・Bに作りかけのメール履歴がある`);
  await 履歴を作る(browser, seed.シードID, a, [
    { 件名: "送信時件名A-2", 本文: "本文A-2", 処理日: "2026-09-03", テンプレート: "A" },
    { 件名: "送信時件名B-1", 本文: "本文B-1", 処理日: "2026-09-02", テンプレート: "B" },
    { 件名: "送信時件名A-1", 本文: "本文A-1", 処理日: "2026-09-01", テンプレート: "A" },
    { 件名: "テンプレート未指定履歴", 本文: "テンプレート未指定本文", 処理日: "2026-08-31", テンプレート: null },
  ]);
  await 履歴を作る(browser, seed.シードID, b, [{ 件名: "別会員件名", 本文: "別会員本文", 処理日: "2026-09-04", テンプレート: "A" }]);
  reportSeedIssue(seed.シードID, `メール履歴はメール一括送信で E2E の会員A・Bに送って作り、処理日とテンプレートを DB で書いた（正本の作り方どおり）。${テンプレートの補い()}`);
});

defineSeed("S-M08-07-ABSENT", async ({ seed }) => {
  if (会員があるか("999999") || メール履歴の数("999999")) throw new Error(`${seed.シードID}: 会員ID 999999 の会員かメール履歴がある（ほかの方のデータなので消さずに止める）`);
  reportSeedIssue(seed.シードID, "会員ID 999999 の会員とメール履歴は、消さずに無いことを DB の参照で確かめた");
});

/** 1会員・1履歴のシード（015〜021） */
type 単独の定め = { シードID: string; 呼び名: string; 前半: string; 姓: string; パスワード: string; 履歴: 送る履歴; テンプレートの呼び名?: { A?: string; B?: string; そのもの?: string } };
const 単独: 単独の定め[] = [
  { シードID: "S-M08-07-DATE-015", 呼び名: "〔会員ID-M0807-015〕", 前半: "m0807-015-a", 姓: "M0807-015-", パスワード: "Passw0rd!M0807-015", 履歴: { 件名: "M0807-015-件名", 本文: "M0807-015-本文", 処理日: "2026-03-07", テンプレート: null } },
  { シードID: "S-M08-07-MAIL-016", 呼び名: "〔会員ID-M0807-016〕", 前半: "m0807-016-a", 姓: "M0807-016-", パスワード: "Passw0rd!M0807-016", 履歴: { 件名: "M0807-016-件名", 本文: "M0807-016-本文", 処理日: "2026-03-08", テンプレート: null } },
  { シードID: "S-M08-07-MAIL-017", 呼び名: "〔会員ID-M0807-017〕", 前半: "m0807-017-a", 姓: "M0807-017-", パスワード: "Passw0rd!M0807-017", 履歴: { 件名: "M0807-017-件名", 本文: "M0807-017-本文", 処理日: "2026-03-09", テンプレート: "A" }, テンプレートの呼び名: { そのもの: "〔テンプレートID-M0807-017〕" } },
  ...([["018", "CBALLA", "A"], ["019", "CBALLB", "B"], ["020", "CBSELA", "A"], ["021", "CBSELB", "B"]] as const).map(([n, k, t]): 単独の定め => ({
    シードID: `S-M08-07-${k}-${n}`, 呼び名: `〔会員ID-M0807-CB${n}〕`, 前半: `cbm0807-${n}-a`, 姓: `M0807-CB${n}-`, パスワード: `Passw0rd-CBM0807${n}`,
    履歴: { 件名: `M0807-CB${n}-件名`, 本文: `M0807-CB${n}-本文`, 処理日: "2026-03-10", テンプレート: t },
    テンプレートの呼び名: { A: `〔テンプレートID-M0807-CB${n}-A〕`, B: `〔テンプレートID-M0807-CB${n}-B〕` },
  })),
];

async function 単独を作る(browser: Browser, notes: Notes, d: 単独の定め): Promise<void> {
  const m = await 会員を作る(browser, { 前半: d.前半, 姓: d.姓, 名: "会員", セイ: "シケン", メイ: "カイイン", パスワード: d.パスワード });
  控える(notes, d.シードID, d.呼び名, m.会員ID);
  const { A, B } = テンプレートAB();
  if (d.テンプレートの呼び名?.A) 控える(notes, d.シードID, d.テンプレートの呼び名.A, A.ID);
  if (d.テンプレートの呼び名?.B) 控える(notes, d.シードID, d.テンプレートの呼び名.B, B.ID);
  if (d.テンプレートの呼び名?.そのもの) 控える(notes, d.シードID, d.テンプレートの呼び名.そのもの, A.ID);
  await 履歴を作る(browser, d.シードID, m, [d.履歴]);
  if (メール履歴の数(m.会員ID) !== 1) throw new Error(`${d.シードID}: メール履歴が1件でない`);
  reportSeedIssue(d.シードID, `メール履歴はメール一括送信で E2E の会員に送って作り、処理日${d.履歴.テンプレート ? "とテンプレート" : ""}を DB で書いた。会員のメールアドレスの前半に実行の印を付けた` +
    (d.テンプレートの呼び名 ? `。${テンプレートの補い()}` : ""));
}
for (const d of 単独) {
  defineSeed(d.シードID, async ({ browser, notes }) => { await 単独を作る(browser, notes, d); });
}
