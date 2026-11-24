/**
 * A15-03 ユーザー情報参照（デッキビルダーの API の GET /api/user）のシード。正本: cases/A15-03_seed_data.tsv
 * 作り方は A15-01・A15-05 と同じ（フロントの新規会員登録・MTG Companion登録名を入れて選手を作る・メールの前半に実行の印）。
 * 画面で指定できない値（ニックネーム・プロフィール・デッキユーザーID）と「対応するプレイヤー=0件」だけ、E2E の会員の選手の行に DB で書く
 * （db/a15_03.ts・db/a15_01.ts・lib/db_write.ts。依頼者決定 2026-11-10）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-03_progress_2026-11-24_dev.md にも書く）:
 * - 会員のメールアドレスは、シード表の「a1503-001@example.com」の @ の前に実行の印を付け、ドメインを E2E の試験会員の
 *   「@example.test」にした（前の実行の会員と重ならないように。DB への書き足しの持ち主の確かめも試験会員のドメインで行う）。
 * - 会員のパスワードはシード表が「入力チェックを通る値」とだけ定めるので、試験用の値（A1503_PASSWORD）で登録した。
 * - 「テスト用認証データ作成機構で有効な jwt-token を発行」は、シードでその会員のメールアドレスとパスワードでログインの API を呼んで
 *   受け取る（署名鍵は使わない。A15-05 と同じ）。トークンの値は記録に残さず、この実行の中だけで持つ（認証トークンの入れ物）。
 * - 「対応するプレイヤー=0件の会員の署名が正しい jwt-token」は、選手のある会員として登録してトークンを受け取ってから、その選手を
 *   削除済みにして作った（ログインの API は選手の無い会員にトークンを出さない作りのため。選手の行は消さない。A15-05 と同じ）。
 * - デッキユーザーID（A1503001 など）は決め打ちの値のまま書く（デッキユーザーIDは重複してよい列で、このケース群はトークンの会員の
 *   選手を読むため、前の実行の選手に同じ値があっても結果に効かない）。
 * - S-A15-03-ENV（試験用署名鍵）は、共有の開発環境では設定済みの値をそのまま使う（シード表の ≪共有の設定≫ のとおり。何もしない）。
 */
import { request } from "@playwright/test";
import { API_BASE_URL } from "../config/env";
import { 会員を読む, 選手を削除済みにする } from "../db/a15_01";
import { A1503選手に書く, A1503の値 } from "../db/a15_03";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { A1501のメール, 会員を作る, 印の注記 } from "./a15-01";

/** 試験会員のパスワード（シード表は「入力チェックを通る値」とだけ定める） */
export const A1503_PASSWORD = "Passw0rd!A1503";

/** 認証トークンの入れ物（呼び名 → トークン。この実行の中だけ。記録には残さない） */
export const A1503のトークン = new Map<string, string>();

/** シード表のメールアドレス（@example.com）を、E2E の試験会員のメールアドレス（実行の印つき・@example.test）にする */
export const A1503のメール = (シード表のメール: string): string => A1501のメール(シード表のメール.replace(/@example\.com$/, "@example.test"));

/** 会員のメールアドレスとパスワードでログインの API を呼び、認証トークンを受け取る */
async function トークンを受け取る(メール: string): Promise<string> {
  const api = await request.newContext({ baseURL: API_BASE_URL, ignoreHTTPSErrors: true });
  try {
    const r = await api.post("/api/user/login", { data: { id: メール, password: A1503_PASSWORD }, failOnStatusCode: false, timeout: 60_000 });
    if (r.status() !== 200) throw new Error(`ログインの API が失敗した（応答 ${r.status()}）: ${(await r.text()).slice(0, 300)}`);
    const t = ((await r.json()) as { access_token?: string }).access_token;
    if (!t) throw new Error("ログインの API の応答に認証トークンが無い");
    return t;
  } finally { await api.dispose(); }
}

type 定め = {
  シード表のメール: string; 呼び名: string;
  /** 書く値（省略すると書かない） */
  値?: A1503の値;
  /** 認証トークンを受け取るか */
  トークン?: boolean;
  /** 「対応するプレイヤー=0件」（トークンを受け取ってから選手を削除済みにする） */
  選手を無くす?: boolean;
};

async function 作る(ctx: SeedCtx, d: 定め): Promise<void> {
  // 会員登録は必ず選手を作る（シード表）。「プレイヤー=0件」は登録のあとで選手を削除済みにして作る
  await 会員を作る(ctx, { メール: d.シード表のメール.replace(/@example\.com$/, "@example.test"), パスワード: A1503_PASSWORD, 名: `A1503${d.呼び名}`, 選手: true, 呼び名: d.呼び名, 機能: "A1503", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false, ...(d.選手を無くす ? { 選手の呼び名: false as const } : {}) });
  const メール = A1503のメール(d.シード表のメール);
  if (d.値) A1503選手に書く(ctx.seed.シードID, ctx.notes.get(`〔プレイヤーID-A1503-${d.呼び名}〕`), メール, d.値);
  if (d.トークン) A1503のトークン.set(d.呼び名, await トークンを受け取る(メール));
  if (d.選手を無くす) {
    const 会員ID = ctx.notes.get(`〔顧客ID-A1503-${d.呼び名}〕`);
    const m = 会員を読む(メール);
    if (!m || m.会員ID !== 会員ID || !m.選手ID) throw new Error(`${ctx.seed.シードID}: 会員 ${メール} の選手が読めない`);
    選手を削除済みにする(ctx.seed.シードID, m.選手ID, メール);
  }
}

const 書いた注記 = `${印の注記}。会員のメールアドレスのドメインは、シード表の @example.com を E2E の試験会員の @example.test にした。ニックネーム・プロフィール・デッキユーザーIDは画面で指定できないので、登録した E2E の会員の選手の行にだけ DB で書いた（lib/db_write.ts）。会員のパスワードはシード表に定めが無いので試験用の値にし、認証トークンはその会員でログインの API を呼んで受け取った（値は記録しない）`;

defineSeed("S-A15-03-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の秘密値・署名方式を書き換えず、設定済みの値をそのまま使った（シード表の ≪共有の設定≫ のとおり）。認証トークンは、各シードで会員のメールアドレスとパスワードでログインの API を呼んで受け取った");
});

const 値 = (n: string | null, p: string | null, d: string | null): A1503の値 => ({ ニックネーム: n, プロフィール: p, デッキユーザーID: d });

for (const [id, n, v, token] of [
  ["S-A15-03-SUCCESS-001", "001", 値("A1503-001-NICK", "A1503-001-PROF", "A1503001"), true],
  ["S-A15-03-VALUES-002", "002", 値("A1503-002-NICK", "A1503-002-PROF", "A1503002"), true],
  ["S-A15-03-NULLALL-004", "004", 値(null, null, null), true],
  ["S-A15-03-NULLPART-005", "005", 値("A1503-005-NICK", null, "A1503005"), true],
  ["S-A15-03-NOHEADER-006", "006", 値("A1503-006-NICK", "A1503-006-PROF", "A1503006"), false],
  ["S-A15-03-BADSIG-007", "007", 値("A1503-007-NICK", "A1503-007-PROF", "A1503007"), true],
  ["S-A15-03-NICKNULL-011", "011", 値(null, "A1503-011-PROF", "A1503011"), true],
  ["S-A15-03-IDNULL-012", "012", 値("A1503-012-NICK", "A1503-012-PROF", null), true],
] as const) {
  defineSeed(id, async (ctx) => {
    await 作る(ctx, { シード表のメール: `a1503-${n}@example.com`, 呼び名: n, 値: v, トークン: token });
    reportSeedIssue(ctx.seed.シードID, 書いた注記);
  });
}

defineSeed("S-A15-03-OWN-003", async (ctx) => {
  await 作る(ctx, { シード表のメール: "a1503-003a@example.com", 呼び名: "003A", 値: 値("A1503-003-NICK-A", "A1503-003-PROF-A", "A1503003"), トークン: true });
  await 作る(ctx, { シード表のメール: "a1503-003b@example.com", 呼び名: "003B", 値: 値("A1503-003-NICK-B", "A1503-003-PROF-B", "B1503003") });
  reportSeedIssue(ctx.seed.シードID, `${書いた注記}。プレイヤーBの認証トークンは受け取らない（シード表のとおり使わない）`);
});

defineSeed("S-A15-03-NOPLAYER-008", async (ctx) => {
  await 作る(ctx, { シード表のメール: "a1503-008@example.com", 呼び名: "008", トークン: true, 選手を無くす: true });
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。会員のメールアドレスのドメインは、シード表の @example.com を E2E の試験会員の @example.test にした。ログインの API は選手の無い会員に認証トークンを出さないので、選手のある会員として登録してトークンを受け取ってから、その選手を削除済みにして「対応するプレイヤー=0件」を作った（E2E の選手の行にだけ DB で書いた・行は消さない。A15-05 と同じ）。トークンの値は記録しない`);
});
