/**
 * A15-04 他ユーザー情報参照（デッキビルダーの API）のシード。正本: cases/A15-04_seed_data.tsv
 *
 * 型: 選手はフロントの新規会員登録で作る（pages/front/member_entry.ts。仮会員なら本登録のメールのURLで本会員にする。メールの前半に実行の印）。
 * 画面で指定できない値（ニックネーム・プロフィール・ポイント残高・DCIナンバー・更新日時）だけ、E2E の会員の選手の行に DB で書く
 * （db/a15_04.ts・lib/db_write.ts。依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-04_progress_2026-11-14_dev.md にも書く）:
 * - 会員のメールアドレスは、シード表の値の @ の前に実行の印を付けた（前の実行の会員と重ならないように）。
 * - デッキユーザーID・選手番号（プレイヤーID）・会員ID（顧客ID）は、シード表の画面（マイページのマイデッキのリンク・管理画面のデッキ管理の
 *   プレイヤー検索・会員一覧）で控える代わりに、登録した会員のメールアドレスで DB を参照して控えた（同じ値。画面の読み取りを省いた）。
 * - 「デッキユーザーID 1504010Z などに一致する選手は0件」: ほかの方のデータは消さないので、0件であることを DB の参照で確かめるだけにする。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { デッキユーザーIDの選手の数, 会員の選手, 選手に書く, 選手に書く値 } from "../db/a15_04";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar } from "../lib/session";
import { registerFrontMember } from "../pages/front/member_entry";
import { markedMail } from "./f06-member";

/** 試験会員のパスワード（シード表は「有効な値」）。認証トークンを発行するケース（007・015）のログインにも使う */
export const A1504_PASSWORD = "Passw0rd!A1504";

/** 会員のメールアドレス（シード表の値の @ の前に実行の印） */
export const A1504のメール = (シード表のメール: string): string => markedMail(シード表のメール.replace(/@example\.test$/, ""));

type 選手の定め = {
  /** シード表のメールアドレス */
  メール: string;
  /** MTG Companion登録名(名) */
  MTG名: string;
  /** 控える呼び名（〔…〕を除いた中身の末尾。例 "001A"）。顧客IDも控えるときは 会員の呼び名 を渡す */
  呼び名: string;
  会員の呼び名?: string;
  値: 選手に書く値;
};

/** 会員を登録し（本会員にする）、選手の番号・デッキユーザーID（・会員ID）を控え、画面で指定できない値を DB で書く */
async function 選手を作る({ browser, seed, notes }: SeedCtx, d: 選手の定め): Promise<void> {
  const メール = A1504のメール(d.メール);
  await 会員を登録する(browser, メール, d.MTG名);
  let p = 会員の選手(メール);
  for (let i = 0; !p && i < 6; i++) { await new Promise((r) => setTimeout(r, 5_000)); p = 会員の選手(メール); }
  if (!p) throw new Error(`${seed.シードID}: 登録した会員 ${メール} の選手が DB に無い`);
  if (!p.デッキユーザーID) throw new Error(`${seed.シードID}: 会員 ${メール} の選手にデッキユーザーIDが付いていない`);
  notes.set(`〔プレイヤーID-A1504-${d.呼び名}〕`, p.選手ID);
  notes.set(`〔デッキユーザーID-A1504-${d.呼び名}〕`, p.デッキユーザーID);
  if (d.会員の呼び名) notes.set(`〔顧客ID-A1504-${d.会員の呼び名}〕`, p.会員ID);
  選手に書く(seed.シードID, p.選手ID, メール, d.値);
}

async function 会員を登録する(browser: Browser, メール: string, MTG名: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: "試験", 名: "デッキ利用者", セイ: "シケン", メイ: "デッキリヨウシャ", メール, パスワード: A1504_PASSWORD, MTG名 });
  } finally { await context.close(); }
}

/** 一致する選手が0件であるべきデッキユーザーID。ほかの方のデータは消さないので、あれば止める */
function 一致する選手が無い(シードID: string, デッキユーザーID: string): void {
  const n = デッキユーザーIDの選手の数(デッキユーザーID);
  if (n > 0) throw new Error(`${シードID}: デッキユーザーID「${デッキユーザーID}」に一致する選手が ${n} 件ある（ほかの方のデータなので消さずに止める）`);
  reportSeedIssue(シードID, `デッキユーザーID「${デッキユーザーID}」に一致する選手が0件であることを DB の参照で確かめた（消す・書き換えるはしていない）`);
}

const 書いた注記 = "ニックネーム・プロフィールなど画面で指定できない値は、登録した E2E の会員の選手の行にだけ DB で書いた（lib/db_write.ts）。選手番号・デッキユーザーID・会員IDは、画面の代わりに登録した会員のメールアドレスで DB を参照して控えた";
const 一人 = (n: string, nick: string | null, prof: string | null, 追加: 選手に書く値 = {}): 選手の定め =>
  ({ メール: `a1504-${n}-a@example.test`, MTG名: `A1504-${n}-A`, 呼び名: n, 値: { ニックネーム: nick, プロフィール: prof, ...追加 } });

defineSeed("S-A15-04-PICK-001", async (ctx) => {
  for (const [x, nick, prof] of [["A", "ニックネームA1504-001-A", "プロフィールA1504-001-A"], ["B", "ニックネームB1504-001-B", "プロフィールB1504-001-B"],
    ["C", "ニックネームC1504-001-C", "プロフィールC1504-001-C"]] as const) {
    await 選手を作る(ctx, { メール: `a1504-001-${x.toLowerCase()}@example.test`, MTG名: `A1504-001-${x}`, 呼び名: `001${x}`, 値: { ニックネーム: nick, プロフィール: prof } });
  }
  reportSeedIssue(ctx.seed.シードID, 書いた注記);
});

defineSeed("S-A15-04-VALUE-003", async (ctx) => {
  await 選手を作る(ctx, 一人("003", "<ニック&'1504-003-N'> 全角ＡＢＣ", "  前後に半角空白あり 1504-003-P  "));
  reportSeedIssue(ctx.seed.シードID, 書いた注記);
});

defineSeed("S-A15-04-SHAPE-004", async (ctx) => {
  await 選手を作る(ctx, 一人("004", "ニックネーム1504-004-A", "プロフィール1504-004-A"));
  reportSeedIssue(ctx.seed.シードID, 書いた注記);
});

defineSeed("S-A15-04-PUBLIC-005", async (ctx) => {
  await 選手を作る(ctx, { ...一人("005", "ニックネーム1504-005-A", "プロフィール1504-005-A", { ポイント: 1504, DCI: "1504005D" }), 会員の呼び名: "005" });
  reportSeedIssue(ctx.seed.シードID, `${書いた注記}。ポイント残高 1504・DCIナンバー 1504005D も選手の行に DB で書いた`);
});

defineSeed("S-A15-04-NULL-006", async (ctx) => {
  // ニックネーム・プロフィールは新規会員登録では設定されず未設定のまま（シード表）。DB には書かない
  await 選手を作る(ctx, { ...一人("006", null, null), 値: {} });
});

defineSeed("S-A15-04-BRANCH-007", async (ctx) => {
  await 選手を作る(ctx, { メール: "a1504-007-a@example.test", MTG名: "A1504-007-A", 呼び名: "007A", 値: { ニックネーム: "ニックネーム1504-007-A", プロフィール: "プロフィール1504-007-A" } });
  await 選手を作る(ctx, { メール: "a1504-007-b@example.test", MTG名: "A1504-007-B", 呼び名: "007B", 会員の呼び名: "007",
    値: { ニックネーム: "ニックネーム1504-007-B", プロフィール: "プロフィール1504-007-B" } });
  reportSeedIssue(ctx.seed.シードID, `${書いた注記}。トークン所有者の認証トークンは、ケースの中でその会員のメールアドレスとパスワードでログインの API を呼んで受け取る`);
});

for (const [id, n] of [["S-A15-04-NOHDR-008", "008"], ["S-A15-04-BADTKN-009", "009"], ["S-A15-04-CODE-014", "014"]] as const) {
  defineSeed(id, async (ctx) => {
    await 選手を作る(ctx, 一人(n, `ニックネーム1504-${n}-A`, `プロフィール1504-${n}-A`));
    reportSeedIssue(ctx.seed.シードID, 書いた注記);
  });
}

for (const [id, n] of [["S-A15-04-NOHIT-010", "010"], ["S-A15-04-ERRMSG-011", "011"], ["S-A15-04-STATUS-012", "012"]] as const) {
  defineSeed(id, async (ctx) => {
    一致する選手が無い(ctx.seed.シードID, `1504${n}Z`);
    await 選手を作る(ctx, 一人(n, `ニックネーム1504-${n}-A`, `プロフィール1504-${n}-A`));
    reportSeedIssue(ctx.seed.シードID, 書いた注記);
  });
}

defineSeed("S-A15-04-READONLY-013", async (ctx) => {
  await 選手を作る(ctx, 一人("013", "ニックネーム1504-013-A", "プロフィール1504-013-A", { 更新日時: "2026-01-01 00:00:00" }));
  reportSeedIssue(ctx.seed.シードID, `${書いた注記}。更新日時 2026-01-01 00:00:00（日本時間）も DB で書いた`);
});

defineSeed("S-A15-04-SELF-015", async (ctx) => {
  await 選手を作る(ctx, { ...一人("015", "ニックネーム1504-015-A", "プロフィール1504-015-A"), 会員の呼び名: "015" });
  reportSeedIssue(ctx.seed.シードID, `${書いた注記}。認証トークンは、ケースの中でその会員のメールアドレスとパスワードでログインの API を呼んで受け取る`);
});

defineSeed("S-A15-04-NICKNULL-016", async (ctx) => {
  // ニックネームは新規会員登録で未設定のまま（書かない）。プロフィールだけ書く
  await 選手を作る(ctx, { メール: "a1504-016@example.test", MTG名: "A1504-016-A", 呼び名: "016", 値: { プロフィール: "プロフィールA1504-016" } });
  reportSeedIssue(ctx.seed.シードID, 書いた注記);
});

defineSeed("S-A15-04-PROFNULL-017", async (ctx) => {
  // プロフィールは新規会員登録で未設定のまま（書かない）。ニックネームだけ書く
  await 選手を作る(ctx, { メール: "a1504-017@example.test", MTG名: "A1504-017-A", 呼び名: "017", 値: { ニックネーム: "ニックネームA1504-017" } });
  reportSeedIssue(ctx.seed.シードID, 書いた注記);
});
