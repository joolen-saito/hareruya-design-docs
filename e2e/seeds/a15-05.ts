/**
 * A15-05 ユーザー情報変更（デッキビルダーの API の PUT /api/user）のシード。正本: cases/A15-05_seed_data.tsv
 * 作り方は A15-01・A15-04 と同じ（フロントの新規会員登録・MTG Companion登録名を入れて選手を作る・メールの前半に実行の印）。
 * 画面で指定できない値（ニックネーム・プロフィール）と「対応するプレイヤー=0件」だけ、E2E の会員の選手の行に DB で書く
 * （db/a15_04.ts・db/a15_01.ts・lib/db_write.ts。依頼者決定 2026-11-10）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-05_progress_2026-11-14_dev.md にも書く）:
 * - 会員のパスワードはシード表に定めが無いので、試験用の値（A1505_PASSWORD）で登録した。
 * - 「有効な認証トークン」は、シードでその会員のメールアドレスとパスワードでログインの API を呼んで受け取る（署名鍵は使わない）。
 *   トークンの値は記録に残さず、この実行の中だけで持つ（認証トークンの入れ物）。
 * - 「対応するプレイヤー=0件の会員の認証トークン」は、選手のある会員として登録してトークンを受け取ってから、その選手を削除済みにして作った
 *   （ログインの API は選手の無い会員にトークンを出さない作りのため。選手の行は消さない）。
 */
import { request } from "@playwright/test";
import { API_BASE_URL } from "../config/env";
import { 選手を削除済みにする } from "../db/a15_01";
import { 選手に書く } from "../db/a15_04";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { A1501のメール, 会員を作る, 印の注記 } from "./a15-01";

/** 試験会員のパスワード（シード表に定めが無い） */
export const A1505_PASSWORD = "Passw0rd!A1505";

/** 認証トークンの入れ物（呼び名 → トークン。この実行の中だけ。記録には残さない） */
export const A1505のトークン = new Map<string, string>();

/** 会員のメールアドレスとパスワードでログインの API を呼び、認証トークンを受け取る */
export async function A1505トークンを受け取る(メール: string): Promise<string> {
  const api = await request.newContext({ baseURL: API_BASE_URL, ignoreHTTPSErrors: true });
  try {
    const r = await api.post("/api/user/login", { data: { id: メール, password: A1505_PASSWORD }, failOnStatusCode: false, timeout: 60_000 });
    if (r.status() !== 200) throw new Error(`ログインの API が失敗した（応答 ${r.status()}）: ${(await r.text()).slice(0, 300)}`);
    const t = ((await r.json()) as { access_token?: string }).access_token;
    if (!t) throw new Error("ログインの API の応答に認証トークンが無い");
    return t;
  } finally { await api.dispose(); }
}

type 定め = { シード表のメール: string; 呼び名: string; ニックネーム?: string; プロフィール?: string; 選手を無くす?: boolean };

async function 作る(ctx: SeedCtx, d: 定め): Promise<void> {
  // シード表は会員IDを「顧客ID」と呼び、デッキユーザーIDを控えると書かない
  await 会員を作る(ctx, { メール: d.シード表のメール, パスワード: A1505_PASSWORD, 名: `A1505${d.呼び名}`, 選手: true, 呼び名: d.呼び名, 機能: "A1505", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
  const メール = A1501のメール(d.シード表のメール);
  const 選手ID = ctx.notes.get(`〔プレイヤーID-A1505-${d.呼び名}〕`);
  if (d.ニックネーム !== undefined || d.プロフィール !== undefined) {
    選手に書く(ctx.seed.シードID, 選手ID, メール, { ニックネーム: d.ニックネーム, プロフィール: d.プロフィール });
  }
  A1505のトークン.set(d.呼び名, await A1505トークンを受け取る(メール));
  if (d.選手を無くす) 選手を削除済みにする(ctx.seed.シードID, 選手ID, メール);
}

const 書いた注記 = `${印の注記}。ニックネーム・プロフィールは画面で指定できないので、登録した E2E の会員の選手の行にだけ DB で書いた（lib/db_write.ts）。会員のパスワードはシード表に定めが無いので試験用の値にし、認証トークンはその会員でログインの API を呼んで受け取った（値は記録しない）`;

for (const n of ["001", "002", "003", "004", "005", "006", "016"]) {
  defineSeed(`S-A15-05-SELF-${n}`, async (ctx) => {
    await 作る(ctx, { シード表のメール: `self.a1505-${n}@example.test`, 呼び名: n === "003" ? "003A" : n, ニックネーム: "変更前ユーザー", プロフィール: "変更前プロフィール" });
    reportSeedIssue(ctx.seed.シードID, 書いた注記);
  });
}

defineSeed("S-A15-05-SELF-008", async (ctx) => {
  await 作る(ctx, { シード表のメール: "self.a1505-008@example.test", 呼び名: "008A", ニックネーム: "変更前ユーザー", プロフィール: "変更前プロフィール" });
  reportSeedIssue(ctx.seed.シードID, 書いた注記);
});

for (const [id, n] of [["S-A15-05-OTHER-003", "003B"], ["S-A15-05-OTHER-008", "008B"]] as const) {
  defineSeed(id, async (ctx) => {
    await 作る(ctx, { シード表のメール: `other.a1505-${n.slice(0, 3)}@example.test`, 呼び名: n, ニックネーム: "他ユーザー", プロフィール: "他プロフィール" });
    reportSeedIssue(ctx.seed.シードID, 書いた注記);
  });
}

for (const [id, n] of [["S-A15-05-GHOST-007", "007"], ["S-A15-05-GHOST-008", "008C"]] as const) {
  defineSeed(id, async (ctx) => {
    await 作る(ctx, { シード表のメール: `ghost.a1505-${n.slice(0, 3)}@example.test`, 呼び名: n, 選手を無くす: true });
    reportSeedIssue(ctx.seed.シードID, `${印の注記}。ログインの API は選手の無い会員に認証トークンを出さないので、選手のある会員として登録してトークンを受け取ってから、その選手を削除済みにして「対応するプレイヤー=0件」を作った（E2E の選手の行にだけ DB で書いた・行は消さない）。トークンの値は記録しない`);
  });
}
