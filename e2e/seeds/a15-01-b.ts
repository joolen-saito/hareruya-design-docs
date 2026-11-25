/**
 * A15-01 ログインの「以降の認可」（デッキ情報参照 GET /api/deck/{id}）のケース 013・016・018・020 のシード。正本: cases/A15-01_seed_data.tsv
 * 会員の作り方は seeds/a15-01.ts と同じ（フロントの新規会員登録・MTG Companion登録名を入れて選手を作る・メールの前半に実行の印）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-01_progress_2026-11-24_dev.md にも書く）:
 * - 「プレイヤーを持たない会員」: シード表のとおり、会員登録で同時に作られた選手を DB で取り除く。行は消さず、E2E の選手の行に
 *   削除の印（削除日時）を立てる（lib/db_write.ts。A15-05 の「対応するプレイヤー=0件」と同じ作り）。
 * - MTG Companion登録名: シード表の「A1501-013B-PLAYER」などは、登録名の欄が英数字だけを受け付けるので、姓「Shiken」・
 *   名「A1501013B」などにした（seeds/a15-01.ts と同じ）。デッキのプレイヤーの検索も、この名で探し、ID が最大の行
 *   （いま作った会員の選手）を選ぶ。選んだプレイヤーIDが、控えた選手IDと同じことを確かめる。
 * - 「登録済みの任意のフォーマット・アーキタイプ」: このファイルが実行ごとに1度、印つきの名前で登録するフォーマット・アーキタイプを使う
 *   （共有のマスタは書き換えない。2026-11-14 依頼者決定の「印付きで作ってよい」の範囲）。選択欄は名前でなく番号で選ぶ。
 * - 限定公開トークン「A1501-016-VIEW」などは画面で指定できないので、E2E のデッキの行にだけ DB で書く（シード表のとおり）。
 *   アプリは登録したデッキを一時保存（キャッシュ）からも読むので、閲覧用トークンが書き換わって見えないことがある。
 *   このケース群は、どちらのトークンとも一致しない「…-WRONG」を送るので、期待結果に効かない。
 * - デッキ名は、シード表の値のまま入れる（ケースはデッキIDで送り、応答のデッキ名を見るため）。
 */
import { Browser, Locator, Page, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 会員を読む, 選手を削除済みにする } from "../db/a15_01";
import { A1501デッキを読む, A1501閲覧用トークンを書く } from "../db/a15_01_deck";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { adminUrl, withAdminSession } from "../lib/session";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { アーキタイプを登録する, フォーマットを登録する } from "../pages/admin/a15_14_metagame";
import { デッキ編集画面 } from "../pages/admin/m15_05_deck_edit";
import { A1501のメール, 会員を作る, 印の注記 } from "./a15-01";

type Issue = (m: string) => void;

/** 実行ごとに1度だけ登録するフォーマット・アーキタイプ（この実行の中だけで持つ） */
let 型の約束: Promise<{ フォーマット: string; アーキタイプ: string }> | null = null;

async function 型を用意する(page: Page, issue: Issue): Promise<{ フォーマット: string; アーキタイプ: string }> {
  if (!型の約束) {
    型の約束 = (async () => {
      const 名 = rc("結合試験A1501デッキ用");
      const フォーマット = await フォーマットを登録する(page, { 名日: `${名}フォーマット`, 名英: `A1501-Deck-${RUN_MARK} Format`, 並び順: "9000", メタ日数: "7" }, issue);
      const アーキタイプ = await アーキタイプを登録する(page, { 名日: `${名}アーキタイプ`, 名英: `A1501-Deck-${RUN_MARK} Archetype`, フォーマット番号: フォーマット }, issue);
      issue(`「登録済みの任意のフォーマット・アーキタイプ」は、この実行で1度だけ登録した印つきの名前のもの（フォーマット ${フォーマット}・アーキタイプ ${アーキタイプ}）を使った`);
      return { フォーマット, アーキタイプ };
    })();
    型の約束.catch(() => { 型の約束 = null; });
  }
  return 型の約束;
}

/** 選択欄を、選択肢の値（番号）で選ぶ（選択肢が出るまで待つ） */
async function 値で選ぶ(sel: Locator, 値: string, 何: string): Promise<void> {
  await expect(sel.locator(`option[value="${値}"]`), `${何}: 選択肢の値 ${値}`).toHaveCount(1, { timeout: 30_000 });
  await sel.selectOption({ value: 値 });
}

type デッキの定め = { デッキ名: string; 公開範囲: "非公開" | "限定公開"; 選手の検索語: string; 選手ID: string };

/** 管理画面のデッキ新規登録で、ユーザーデッキを1件登録し、デッキIDを返す */
async function デッキを登録する(browser: Browser, seedId: string, d: デッキの定め, issue: Issue): Promise<string> {
  let id = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 型 = await 型を用意する(page, issue);
    await page.goto(adminUrl("/deck/new"));
    const e = new デッキ編集画面(page);
    await e.読み込みを待つ();
    await e.デッキ名.fill(d.デッキ名);
    await chooseByLabel(e.デッキ種別, "user");
    await 値で選ぶ(e.フォーマット, 型.フォーマット, `${seedId} のデッキのフォーマット`);
    const res = page.waitForResponse((r) => r.url().includes("/deck/archetype_card_image/"), { timeout: 5_000 }).catch(() => null);
    await 値で選ぶ(e.アーキタイプ, 型.アーキタイプ, `${seedId} のデッキのアーキタイプ`);
    await res;
    await chooseByLabel(e.公開状態, d.公開範囲);
    const 選んだ = await e.プレイヤーを選ぶ(d.選手の検索語);
    if (選んだ !== d.選手ID) throw new Error(`${seedId}: プレイヤー検索で選んだプレイヤーID ${選んだ} が、控えた選手ID ${d.選手ID} と違う`);
    await e.送信する(e.新規登録ボタン);
    for (const w of await expectSaved(page, `${seedId} のデッキ「${d.デッキ名}」の登録`)) issue(`デッキ「${d.デッキ名}」の登録時の警告「${w}」`);
    id = e.デッキID();
  });
  const r = A1501デッキを読む(id);
  if (!r || r.選手ID !== d.選手ID || r.公開範囲 !== d.公開範囲 || r.種別 !== "user" || r.デッキ名 !== d.デッキ名) {
    throw new Error(`${seedId}: 登録したデッキ ${id} が定めと違う（${JSON.stringify(r)}）`);
  }
  return id;
}

/** 選手のある会員を作り、会員ID・選手ID・デッキユーザーIDを控える。選手の名（MTG Companion登録名の名）を返す */
async function 持ち主を作る(ctx: SeedCtx, 呼び名: string, 選手の呼び名: string, メール: string, パスワード: string): Promise<string> {
  const 名 = `A1501${呼び名}`;
  await 会員を作る(ctx, { メール, パスワード, 名, 選手: true, 呼び名, 選手の呼び名 });
  return 名;
}

/** 「プレイヤーを持たない会員」: 会員登録で同時にできた選手を、E2E の選手の行に削除の印を立てて取り除く */
async function 選手の無い会員を作る(ctx: SeedCtx, 呼び名: string, メール: string, パスワード: string): Promise<void> {
  await 会員を作る(ctx, { メール, パスワード, 名: `A1501${呼び名}`, 選手: true, 呼び名, 選手の呼び名: false });
  const 実メール = A1501のメール(メール);
  const m = 会員を読む(実メール);
  if (!m || !m.選手ID) throw new Error(`${ctx.seed.シードID}: 会員 ${実メール} の選手が読めない`);
  選手を削除済みにする(ctx.seed.シードID, m.選手ID, 実メール);
  if (会員を読む(実メール)?.選手ID) throw new Error(`${ctx.seed.シードID}: 会員 ${実メール} の選手を取り除けていない`);
}

const 選手の無い注記 = "「対応するプレイヤーは未登録」は、会員登録で同時にできた選手を、E2E の選手の行に削除の印を立てて取り除いて作った（シード表の「DBへ直接設定して取り除く」。行は消さない・lib/db_write.ts）";
const 名の注記 = "MTG Companion登録名は、登録名の欄が英数字だけを受け付けるので、シード表の「A1501-…-PLAYER」の代わりに姓「Shiken」・名「A1501…」にした。デッキのプレイヤー検索もこの名で探し、選んだプレイヤーIDが控えた選手IDと同じことを確かめた";

/** 会員（持ち主）・デッキを作って控える */
async function 持ち主とデッキ(ctx: SeedCtx, v: { 呼び名: string; 選手の呼び名: string; メール: string; パスワード: string; デッキ名: string; 公開範囲: "非公開" | "限定公開"; デッキの呼び名: string; 閲覧用トークン?: string }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(ctx.seed.シードID, m);
  const 名 = await 持ち主を作る(ctx, v.呼び名, v.選手の呼び名, v.メール, v.パスワード);
  const 選手ID = ctx.notes.get(`〔プレイヤーID-A1501-${v.選手の呼び名}〕`);
  const デッキID = await デッキを登録する(ctx.browser, ctx.seed.シードID, { デッキ名: v.デッキ名, 公開範囲: v.公開範囲, 選手の検索語: 名, 選手ID }, issue);
  ctx.notes.set(`〔デッキID-A1501-${v.デッキの呼び名}〕`, デッキID);
  if (v.閲覧用トークン) {
    A1501閲覧用トークンを書く(ctx.seed.シードID, デッキID, A1501のメール(v.メール), v.閲覧用トークン);
    issue(`限定公開トークン「${v.閲覧用トークン}」は画面で指定できないので、E2E のデッキの行にだけ DB で書いた（lib/db_write.ts）。アプリがデッキを一時保存から読むときは、登録時に振られたトークンのまま見えることがある（このケースは一致しないトークンを送るので結果に効かない）`);
  }
}

defineSeed("S-A15-01-DECKAUTHZ-013", async (ctx) => {
  await 選手の無い会員を作る(ctx, "013A", "login.a1501-013@example.test", "LoginA1501-013!");
  await 持ち主とデッキ(ctx, { 呼び名: "013B", 選手の呼び名: "013", メール: "owner.a1501-013@example.test", パスワード: "LoginA1501-013!", デッキ名: "A1501-013-PRIVATE", 公開範囲: "非公開", デッキの呼び名: "013" });
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。${選手の無い注記}。${名の注記}`);
});

for (const n of ["016", "018"] as const) {
  defineSeed(`S-A15-01-DECKAUTHZ-${n}`, async (ctx) => {
    await 持ち主とデッキ(ctx, { 呼び名: n, 選手の呼び名: n, メール: `owner.a1501-${n}@example.test`, パスワード: `LoginA1501-${n}!`, デッキ名: `A1501-${n}-LIMITED`, 公開範囲: "限定公開", デッキの呼び名: n, 閲覧用トークン: `A1501-${n}-VIEW` });
    reportSeedIssue(ctx.seed.シードID, `${印の注記}。${名の注記}`);
  });
}

// 014・015・017: 持ち主の非公開デッキ（閲覧用トークンなし）。014=jwt-token なし／015=署名不正のトークン／017=持ち主本人のトークン（2026-11-26 に足した）
for (const n of ["014", "015", "017"] as const) {
  defineSeed(`S-A15-01-DECKAUTHZ-${n}`, async (ctx) => {
    await 持ち主とデッキ(ctx, { 呼び名: n, 選手の呼び名: n, メール: `owner.a1501-${n}@example.test`, パスワード: `LoginA1501-${n}!`, デッキ名: `A1501-${n}-PRIVATE`, 公開範囲: "非公開", デッキの呼び名: n });
    reportSeedIssue(ctx.seed.シードID, `${印の注記}。${名の注記}`);
  });
}

defineSeed("S-A15-01-CBDECKAUTHZ-020", async (ctx) => {
  await 選手の無い会員を作る(ctx, "CB020A", "cba1501-020a@example.test", "Passw0rd-CBA1501020");
  await 持ち主とデッキ(ctx, { 呼び名: "CB020B", 選手の呼び名: "CB020", メール: "cba1501-020b@example.test", パスワード: "Passw0rd-CBA1501020", デッキ名: "A1501-CB020-PRIVATE", 公開範囲: "非公開", デッキの呼び名: "CB020" });
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。${選手の無い注記}。${名の注記}`);
});
