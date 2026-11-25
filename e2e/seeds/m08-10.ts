/**
 * M08-10 オンライン本人確認の画面シード。正本: cases/M08-10_seed_data.tsv
 *
 * 作ったシード: 管理者（ADM-VIEW・QH-ADM）・本人確認ステータス（STATUS・QH-STATUS）・会員（BASE-READ・EMPTY-EXPIRY-READ・BASE-014〜017・REQUEST-020・REPEAT-026・CBNOPLAYER-028・QH-MEMBER-024）。
 * 会員は、フロントの新規会員登録で作り（本登録のメールは手元の受け口で読む）、管理画面の会員編集画面のオンライン本人確認で確認済にし、
 * 必要ならフロントで住所2を書き換えて本人確認ステータスを未確認へ戻す（身分証有効期限は残る）。メールアドレスの前半には実行の印を付ける。
 *
 * 作らないシード（これらを使うケースは実装していない）:
 * - 身分証画像を持つ会員（ALL-IMAGES-READ・FACE-MISSING-READ・MIX-025）: 画像の情報を DB で足し、同じキーの試験画像を本人確認画像の保管先へ入れる作りで、保管先へ入れる手段が無い。
 * - 本人確認画像を閲覧できない管理者（ADM-NOVIEW）: 閲覧できない権限を新しく作る必要がある。
 * - 買取情報を持つ会員（L-CUST-023・RH-CUST-027）: フロントのネット買取の申込みと、買取依頼日の DB 書き換え（023）が要る。
 * - CBNOSTATUS-029: 本人確認ステータスのマスタ（全員が使う共有の表）の1件を消す手順。
 *
 * シードでの解釈:
 * - 管理者の権限は、会員管理を操作でき本人確認画像も閲覧できる「システム管理者」にした（権限の細かい指定はシード表に無い）。
 * - 本人確認ステータスの4状態（STATUS）はマスタに既にあるので足さず、名前を参照で確かめる。
 * - 身分証有効期限の入力は「2027-04-30」の形（画面の日付欄。画面の表記は 2027/04/30）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 会員の保存内容 } from "../db/m08_04";
import { 選手情報の番号, 本人確認ステータスの名前 } from "../db/m08_10";
import { Notes } from "../lib/notes";
import { Account, hideDebugToolbar } from "../lib/session";
import { BASE_URL } from "../config/env";
import { ensureM08Admin } from "../pages/admin/m08_common";
import { ChangePage, 会員としてログインする } from "../pages/front/f06_18_change";
import { フロントで会員登録する } from "../pages/front/m08_member";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { SeedCtx } from "../lib/seeds";
import { M08PW, mailOf, 会員IDを探す, 管理画面で会員を整える, 呼び名を控える } from "./m08-common";

export const M0810_VIEW: Account = { loginId: "m0810_view", password: "Passw0rd!M0810V" };
export const M0810_QH_ADMIN: Account = { loginId: "m0810qh_admin", password: "Passw0rd-M0810QH" };

defineSeed("S-M08-10-ADM-VIEW", async ({ browser }) => {
  await ensureM08Admin(browser, "M08-10閲覧管理者", M0810_VIEW);
  reportCurrentSeedIssue("権限は、会員管理を操作でき本人確認画像も閲覧できる「システム管理者」にした（権限の細かい指定はシード表に無い）");
});
defineSeed("S-M08-10-QH-ADM", async ({ browser }) => {
  await ensureM08Admin(browser, "M08-10連鎖管理者", M0810_QH_ADMIN);
  reportCurrentSeedIssue("権限は、会員管理を操作でき本人確認画像も閲覧できる「システム管理者」にした（権限の細かい指定はシード表に無い）");
});

function ステータスを確かめる(): void {
  const have = 本人確認ステータスの名前();
  const miss = ["未確認", "確認中", "オンライン本人確認済み", "簡易書留確認済み"].filter((n) => !have.includes(n));
  if (miss.length) throw new Error(`本人確認ステータスのマスタに ${miss.join("・")} が無い（共有の表なので足さない）`);
  reportCurrentSeedIssue("本人確認ステータスの4状態は既存のマスタにあるものを使う（足さない）");
}
defineSeed("S-M08-10-STATUS", async () => { ステータスを確かめる(); });
defineSeed("S-M08-10-QH-STATUS", async () => { ステータスを確かめる(); });

type 会員の作り方 = {
  前半: string; 姓: string; 名: string; セイ: string; メイ: string; 電話: string; 登録時の住所2: string; パスワード?: string;
  /** 確認済にして入れる身分証有効期限（undefined なら確認済にしない） */
  期限?: string;
  /** フロントで住所2をこの値に書き換える（本人確認ステータスが未確認に戻る） */
  変更後の住所2?: string;
  海外用郵便番号?: string;
  /** 登録時の追加（QH: 性別・会社名・MTG登録名・住所） */
  追加?: { 住所1?: string; 住所2?: string };
};

export async function 会員を作る(ctx: SeedCtx, o: 会員の作り方): Promise<{ 会員ID: string; メール: string; パスワード: string }> {
  const { browser, seed, notes } = ctx;
  const メール = mailOf(o.前半);
  const パスワード = o.パスワード ?? M08PW;
  await フロントで会員登録する(browser, {
    姓: o.姓, 名: o.名, セイ: o.セイ, メイ: o.メイ, メール, パスワード, 生年月日: ["1990", "5", "6"], 郵便番号: "100-0001",
    住所1: o.追加?.住所1 ?? "千代田区千代田", 住所2: o.追加?.住所2 ?? o.登録時の住所2, 電話番号: o.電話, 職業: "会社員",
  });
  const 会員ID = await 会員IDを探す(browser, メール);
  // 仮会員のままなら、管理画面で本会員にする（本登録のメールを読めない環境の備え）
  const st = 会員の保存内容(会員ID)?.会員ステータス ?? "";
  if (!String(st).includes("本会員")) {
    await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
      await edit.選ぶ("status", "本会員");
      await edit.登録する();
      if ((await edit.成功メッセージ()) === null) throw new Error(`${seed.シードID}: 会員 ${メール} を本会員にできない: ${(await edit.エラー文()).join(" / ")}`);
    });
  }
  if (o.期限 !== undefined) {
    await 管理画面で会員を整える(browser, 会員ID, async (edit) => { await edit.オンライン本人確認済みにする(o.期限); });
  }
  if (o.変更後の住所2) {
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const page = await context.newPage();
      await 会員としてログインする(page, メール, パスワード);
      const c = new ChangePage(page);
      await c.開いて待つ();
      await c.入れる("address][addr02", o.変更後の住所2);
      await c.変更するを押す();
      if (!c.完了画面である) throw new Error(`${seed.シードID}: 会員情報変更が完了しない（${page.url()}）`);
    } finally { await context.close(); }
  }
  if (o.海外用郵便番号) {
    await 管理画面で会員を整える(browser, 会員ID, async (edit) => {
      await edit.set("abroadPostalCode", o.海外用郵便番号!);
      await edit.登録する();
      if ((await edit.成功メッセージ()) === null) throw new Error(`${seed.シードID}: 海外用郵便番号を入れて登録できない: ${(await edit.エラー文()).join(" / ")}`);
    });
  }
  const 保存 = 会員の保存内容(会員ID);
  const 想定ステータス = o.期限 === undefined ? "未確認" : o.変更後の住所2 ? "未確認" : "オンライン本人確認済み";
  if (保存?.本人確認ステータス !== 想定ステータス) throw new Error(`${seed.シードID}: 会員 ${メール} の本人確認ステータスが「${保存?.本人確認ステータス}」（「${想定ステータス}」のはず）`);
  const 想定期限 = o.期限 ? o.期限 : null;
  if ((保存?.身分証有効期限 ?? null) !== 想定期限) throw new Error(`${seed.シードID}: 会員 ${メール} の身分証有効期限が「${保存?.身分証有効期限 ?? "未設定"}」（「${想定期限 ?? "未設定"}」のはず）`);
  呼び名を控える(seed, notes, 会員ID);
  // 選手ID: 画面に表示されない（正本もそう書く）ので、DBの参照で控える（会員に紐付く選手情報の番号）
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!/^〔選手ID-/.test(l)) continue;
    const v = 選手情報の番号(会員ID);
    if (!v) throw new Error(`${seed.シードID}: 会員ID ${会員ID} の選手情報の番号をDBの参照で控えられない`);
    notes.set(l, v);
  }
  return { 会員ID, メール, パスワード };
}

const 期限 = "2027-04-30";
const 結合 = { 姓: "結合", セイ: "ケツゴウ" };

defineSeed("S-M08-10-BASE-READ", async (ctx) => {
  await 会員を作る(ctx, { 前半: "m0810-read", ...結合, 名: "太郎", メイ: "タロウ", 電話: "0300008101", 登録時の住所2: "結合ビル仮", パスワード: "Passw0rd!M0810", 期限, 変更後の住所2: "結合ビル810", 海外用郵便番号: "AB-810" });
});
defineSeed("S-M08-10-EMPTY-EXPIRY-READ", async (ctx) => {
  await 会員を作る(ctx, { 前半: "m0810-empty", ...結合, 名: "未設定", メイ: "ミセッテイ", 電話: "0300008104", 登録時の住所2: "結合ビル810", パスワード: "Passw0rd!M0810" });
});
for (const [k, 名, メイ, 電話] of [["014", "取消", "トリケシ", "0300008014"], ["015", "更新", "コウシン", "0300008015"], ["016", "遷移", "センイ", "0300008016"], ["017", "空欄", "クウラン", "0300008017"]] as const) {
  defineSeed(`S-M08-10-BASE-${k}`, async (ctx) => {
    // 正本の姓名はシード表の文のとおり（014 以外は名が異なる。呼び名で特定するので、姓名の違いはケースに影響しない）
    await 会員を作る(ctx, { 前半: `m0810-${k}`, ...結合, 名, メイ, 電話, 登録時の住所2: "結合ビル仮", パスワード: "Passw0rd!M0810", 期限, 変更後の住所2: "結合ビル810" });
  });
}
defineSeed("S-M08-10-REQUEST-020", async (ctx) => {
  await 会員を作る(ctx, { 前半: "m0810-020", ...結合, 名: "要求", メイ: "ヨウキュウ", 電話: "0300008020", 登録時の住所2: "結合ビル810", パスワード: "Passw0rd!M0810", 期限 });
});
defineSeed("S-M08-10-REPEAT-026", async (ctx) => {
  await 会員を作る(ctx, { 前半: "m0810-026", ...結合, 名: "重ね", メイ: "カサネ", 電話: "0308100026", 登録時の住所2: "結合ビル仮", パスワード: "Passw0rd-M0810026", 期限 });
});
defineSeed("S-M08-10-CBNOPLAYER-028", async (ctx) => {
  await 会員を作る(ctx, { 前半: "cbm0810-028", ...結合, 名: "CB028", メイ: "テスト", 電話: "0308100028", 登録時の住所2: "結合ビル仮", パスワード: "Passw0rd-CBM0810028" });
});
defineSeed("S-M08-10-QH-MEMBER-024", async (ctx) => {
  await 会員を作る(ctx, { 前半: "qh0810-001", 姓: "確認姓001", 名: "確認名001", セイ: "カクニンセイ", メイ: "カクニンメイ", 電話: "0344440001", 登録時の住所2: "確認ビル001", 追加: { 住所1: "千代田区確認町001" }, パスワード: "Passw0rd-QH0810-001" });
});
