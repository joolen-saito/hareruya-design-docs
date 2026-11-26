/**
 * A15-01 ログイン（デッキビルダーの API の POST /api/user/login）のシード。正本: cases/A15-01_seed_data.tsv
 *
 * 型（A15-04 と同じ）: 会員はフロントの新規会員登録で作る（pages/front/member_entry.ts。仮会員なら本登録のメールのURLで本会員にする）。
 * 選手（プレイヤー）が要る会員は MTG Companion登録名を入れて登録する（登録のときに選手ができる）。選手が要らない会員は入れない。
 * 画面で作れない状態（本会員ではない・削除済み）だけ、E2E の会員の行に DB で書く（db/a15_01.ts・lib/db_write.ts。依頼者決定 2026-11-10）。
 *
 * シードでの解釈（正本の外の補い。記録 review/A15-01_progress_2026-11-14_dev.md にも書く）:
 * - 会員のメールアドレスは、シード表の値の @ の前に実行の印を付けた（前の実行の会員と重ならないように）。パスワードはシード表の値のまま。
 * - 「会員固有のソルト・保存パスワードはハッシュ化した値」は、画面の登録でアプリが作る値をそのまま使う（書き換えない）。
 * - S-A15-01-ENV（試験用署名鍵・セッション保存先）は、共有の開発環境では設定済みの値をそのまま使う（シード表の ≪共有の設定≫ のとおり。何もしない）。
 * - 「メールアドレス=absent… の会員は0件」は、ほかの方のデータは消さないので、0件であることを DB の参照で確かめるだけにする。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { 会員を読む, メールの会員の数, 仮会員にする, 削除済みにする, 選手を削除済みにする } from "../db/a15_01";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar } from "../lib/session";
import { registerFrontMember } from "../pages/front/member_entry";
import { markedMail } from "./f06-member";

/** 会員のメールアドレス（シード表の値の @ の前に実行の印） */
export const A1501のメール = (シード表のメール: string): string => markedMail(シード表のメール.replace(/@example\.test$/, ""));

export type 会員の定め = {
  /** シード表のメールアドレス */
  メール: string;
  パスワード: string;
  /** 登録の名前（名）。選手が要るときは MTG Companion登録名(名) にも使う */
  名: string;
  /** 選手（プレイヤー）を作るか */
  選手: boolean;
  /** 控える呼び名の末尾（例 "001" → 〔会員ID-A1501-001〕） */
  呼び名: string;
  /** 呼び名の機能の部分（既定 A1501。A15-02 は A1502） */
  機能?: string;
  /** 会員IDを控える呼び名の頭（既定「会員ID」。A15-05 のシード表は「顧客ID」と書く） */
  会員IDの名?: string;
  /** デッキユーザーIDも控えるか（既定 true。シード表が控えると書かないシードでは false） */
  デッキユーザーIDを控える?: boolean;
  /**
   * 選手ID・デッキユーザーIDを控える呼び名の末尾（既定は 呼び名 と同じ）。false なら選手IDもデッキユーザーIDも控えない
   * （シード表が会員IDだけを控えると書くシード。例 A15-01 の 005・021。009 は会員IDが 009A、選手IDが 009）
   */
  選手の呼び名?: string | false;
};

/** 会員を登録し（本会員にする）、会員ID（・選手ID・デッキユーザーID）を控える。返り値は会員ID（A15-02 も使う） */
export async function 会員を作る({ browser, seed, notes }: SeedCtx, d: 会員の定め): Promise<string> {
  const メール = A1501のメール(d.メール);
  await 登録する(browser, メール, d);
  let m = 会員を読む(メール);
  for (let i = 0; (!m || (d.選手 && !m.選手ID)) && i < 6; i++) { await new Promise((r) => setTimeout(r, 5_000)); m = 会員を読む(メール); }
  if (!m) throw new Error(`${seed.シードID}: 登録した会員 ${メール} が DB に無い`);
  if (d.選手 && !m.選手ID) throw new Error(`${seed.シードID}: 会員 ${メール} の選手が DB に無い（MTG Companion登録名を入れて登録した）`);
  if (!d.選手 && m.選手ID) throw new Error(`${seed.シードID}: 会員 ${メール} に選手ができた（シード表は選手が無い会員）`);
  const k = d.機能 ?? "A1501";
  notes.set(`〔${d.会員IDの名 ?? "会員ID"}-${k}-${d.呼び名}〕`, m.会員ID);
  if (d.選手 && d.選手の呼び名 !== false) {
    const n = d.選手の呼び名 ?? d.呼び名;
    notes.set(`〔プレイヤーID-${k}-${n}〕`, m.選手ID);
    if (m.デッキユーザーID && d.デッキユーザーIDを控える !== false) notes.set(`〔デッキユーザーID-${k}-${n}〕`, m.デッキユーザーID);
  }
  return m.会員ID;
}

async function 登録する(browser: Browser, メール: string, d: 会員の定め): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, {
      姓: "試験", 名: d.名, セイ: "シケン", メイ: "エー", メール, パスワード: d.パスワード,
      ...(d.選手 ? { MTG姓: "Shiken", MTG名: d.名.replace(/[^A-Za-z0-9]/g, "") || "Player" } : {}),
    });
  } finally { await context.close(); }
}

/** シード表のメールアドレス（実行の印を付けたもの）の会員が0件であること。あれば止める（ほかの方のデータは消さない） */
function 会員が無い(シードID: string, シード表のメール: string): void {
  const メール = A1501のメール(シード表のメール);
  const n = メールの会員の数(メール);
  if (n > 0) throw new Error(`${シードID}: メールアドレス ${メール} の会員が ${n} 件ある（消さずに止める）`);
  reportSeedIssue(シードID, `メールアドレス ${シード表のメール}（実行の印を付けた ${メール}）の会員が0件であることを DB の参照で確かめた（消す・書き換えるはしていない）`);
}

export const 印の注記 = "会員のメールアドレスは、シード表の値の @ の前に実行の印を付けて登録した（パスワードはシード表の値のまま）。会員ID・選手IDは、画面の代わりに登録した会員のメールアドレスで DB を参照して控えた";

defineSeed("S-A15-01-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では、API の認証の秘密値・署名方式・セッション保存先を書き換えず、設定済みの値をそのまま使った（シード表の ≪共有の設定≫ のとおり）");
});

for (const [id, n] of [["S-A15-01-SUCCESS-001", "001"], ["S-A15-01-TOKEN-002", "002"], ["S-A15-01-COOKIE-003", "003"], ["S-A15-01-NOAUTH-007", "007"], ["S-A15-01-SCHEMA-012", "012"]] as const) {
  defineSeed(id, async (ctx) => {
    // シード表は会員ID・選手IDを控えると書き、デッキユーザーIDは書かない
    await 会員を作る(ctx, { メール: `login.a1501-${n}@example.test`, パスワード: `LoginA1501-${n}!`, 名: `A1501${n}`, 選手: true, 呼び名: n, デッキユーザーIDを控える: false });
    reportSeedIssue(ctx.seed.シードID, 印の注記);
  });
}

defineSeed("S-A15-01-STATUS-005", async (ctx) => {
  const a = await 会員を作る(ctx, { メール: "nonregular.a1501-005@example.test", パスワード: "LoginA1501-005!", 名: "A1501005A", 選手: true, 呼び名: "005A", 選手の呼び名: false });
  仮会員にする(ctx.seed.シードID, a, A1501のメール("nonregular.a1501-005@example.test"));
  const b = await 会員を作る(ctx, { メール: "deleted.a1501-005@example.test", パスワード: "LoginA1501-005!", 名: "A1501005B", 選手: true, 呼び名: "005B", 選手の呼び名: false });
  削除済みにする(ctx.seed.シードID, b, A1501のメール("deleted.a1501-005@example.test"));
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。画面の登録では本会員になるので、「本会員ではない」は E2E の会員の区分を仮会員に、「削除済み」は E2E の会員の削除の印を立てて、DB で作った（lib/db_write.ts）。どちらも選手は作った（パスワードの照合まで進むことを確かめるため）`);
});

defineSeed("S-A15-01-CREDENTIALS-006", async (ctx) => {
  await 会員を作る(ctx, { メール: "login.a1501-006@example.test", パスワード: "LoginA1501-006!", 名: "A1501006", 選手: true, 呼び名: "006", 選手の呼び名: false });
  // 画面の登録では、MTG Companion登録名を入れなくても選手が作られる。シード表は「プレイヤーは未登録」をDBで取り除くと定めるので、E2E の会員の選手にだけ削除の印を立てる
  const メール = A1501のメール("login.a1501-006@example.test");
  const m = 会員を読む(メール);
  if (!m || !m.選手ID) throw new Error(`${ctx.seed.シードID}: 会員 ${メール} の選手が読めない`);
  選手を削除済みにする(ctx.seed.シードID, m.選手ID, メール);
  if (会員を読む(メール)?.選手ID) throw new Error(`${ctx.seed.シードID}: 会員 ${メール} の選手を取り除けていない`);
  会員が無い(ctx.seed.シードID, "absent.a1501-006@example.test");
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。この会員は MTG Companion登録名を入れずに登録したが、画面の登録では選手ができた。シード表の「対応するプレイヤーは未登録」のとおり、この E2E の会員の選手の行にだけ DB で削除の印を立てて取り除いた（行は消さない。lib/db_write.ts）`);
});

defineSeed("S-A15-01-AUTHZ-009", async (ctx) => {
  await 会員を作る(ctx, { メール: "player.a1501-009@example.test", パスワード: "LoginA1501-009!", 名: "A1501009A", 選手: true, 呼び名: "009A", 選手の呼び名: "009" });
  await 会員を作る(ctx, { メール: "login.a1501-009@example.test", パスワード: "LoginA1501-009!", 名: "A1501009B", 選手: false, 呼び名: "009B" });
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。プレイヤーを持たない会員は MTG Companion登録名を入れずに登録した。プレイヤーのニックネーム「A15-01-009プレイヤー」は、このケースが確かめないので書かなかった`);
});

defineSeed("S-A15-01-CBUSER-021", async (ctx) => {
  await 会員を作る(ctx, { メール: "cba1501-021a@example.test", パスワード: "Passw0rd-CBA1501021", 名: "A1501CB021", 選手: true, 呼び名: "CB021", 選手の呼び名: false });
  reportSeedIssue(ctx.seed.シードID, `${印の注記}。署名不正のトークンを作る元の有効なトークンを受け取るため、選手のある会員として登録した（ログインの API は選手の無い会員にトークンを出さない作り）`);
});
