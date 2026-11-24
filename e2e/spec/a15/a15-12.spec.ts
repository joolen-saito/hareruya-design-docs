/**
 * A15-12 デッキ情報参照（デッキビルダーの API の GET /api/deck/{デッキID}）。正本: cases/A15-12_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-12_progress_2026-11-24_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-17 と同じ）。アクセストークンは、シードの会員でログインの API から
 * 受け取る（署名鍵は使わない。署名不正のトークンは署名の部分を置き換えて作る）。限定公開デッキの閲覧用トークンは、新しいアプリの要求の項目 display_token で送る。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { カードの属性, カードタイプの番号, 保存済みデッキを読む, 色の番号, 選手の公開情報, デッキタグの番号 } from "../../db/a15_12";
import { キャンペーンタグの番号 } from "../../db/a15_17";
import { デッキ情報を参照する, 応答 } from "../../pages/api/a15_12_deck_info";
import { ログインする, 署名を1文字変える } from "../../pages/api/a15_17_deck_import";
import { カード定義, カードの実番号, キャンペーン, デッキタグ乙, デッキタグ甲, 他者, 所有者 } from "../../seeds/a15-12";
import "../../seeds/a15-12";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからデッキ情報参照 API（GET /api/deck/{デッキID}）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む";
const メールの補い = "ログインの要求のメールアドレスは、シード表の値の @ の前に「-E2E」を付けた値、パスワードは会員登録の規則（12文字以上）に合わせて末尾に「E2E」を付けた値（シードで登録・使い回した試験会員）にした";
const 閲覧トークンの補い = "限定公開デッキの閲覧用トークンは、新しいアプリの要求の項目 display_token で送った";
const 番号の補い = "シード表の固定の番号（カード・タグ）は、画面が振った番号に読み替えた（DB を名前で引いて読んだ値）";
const MSG = "Deck is not found";

type 誰 = typeof 所有者;
type 形 = { 誰?: 誰; 改ざん?: boolean; 閲覧用?: string; 末尾?: string; 番号?: string };

const j = (r: 応答): Record<string, unknown> => (r.json ?? {});
const 要約 = (r: 応答) => `応答 HTTP ${r.ステータス}・処理結果コード ${JSON.stringify(j(r).code)}・メッセージ ${JSON.stringify(j(r).message)}・本文の先頭 ${r.本文.slice(0, 400)}`;
const デッキID = (ctx: CaseCtx, 末尾: string) => ctx.notes.get(`〔デッキID-A1512-${末尾}〕`);

async function ログインして控える(ctx: CaseCtx, 誰: 誰): Promise<string> {
  supplement(メールの補い);
  const { token, 応答 } = await ログインする(ctx.page, 誰.メール, 誰.パスワード);
  note(`ログイン: POST /api/user/login・応答 HTTP ${応答.ステータス}（アクセストークンは記録しない）`);
  if (!token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
  return token;
}

/** 手順を正本の並びで実行して、デッキ情報参照の応答を返す（手順の形: 素＝1開く・2要求・3確認／ログイン＝1開く・2ログイン・3要求・4確認／改ざん＝1開く・2ログイン・3改ざん・4要求・5確認） */
async function 流す(ctx: CaseCtx, f: 形): Promise<応答> {
  const { step } = ctx;
  const 末尾 = f.末尾;
  const id = f.番号 ?? デッキID(ctx, 末尾 ?? "");
  let token: string | undefined;
  let r!: 応答;
  const 要求 = async (): Promise<void> => {
    if (f.閲覧用 !== undefined) supplement(閲覧トークンの補い);
    r = await デッキ情報を参照する(ctx.page, id, { token, 閲覧用トークン: f.閲覧用 });
    note(`デッキ情報参照: GET /api/deck/${id}${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}${f.閲覧用 !== undefined ? `・閲覧用トークン ${f.閲覧用}` : ""}・${要約(r)}`);
  };
  await step(1, async () => { supplement(開発者ツールの代わり); });
  if (!f.誰) {
    await step(2, 要求);
    await step(3, async () => { note(要約(r)); });
  } else if (!f.改ざん) {
    await step(2, async () => { token = await ログインして控える(ctx, f.誰!); });
    await step(3, 要求);
    await step(4, async () => { note(要約(r)); });
  } else {
    await step(2, async () => { token = await ログインして控える(ctx, f.誰!); });
    await step(3, async () => { token = 署名を1文字変える(token!); note("控えたアクセストークンの署名の末尾1文字を変えた"); });
    await step(4, 要求);
    await step(5, async () => { note(要約(r)); });
  }
  return r;
}


// ---- 001〜004 ----
caseTest("IT-A15-12-001", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "001" });
  await ctx.expected(async () => { expect(j(r).deck_name, "応答のデッキ名").toBe("A1512-001-SAVED"); });
});
caseTest("IT-A15-12-002", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "002" });
  await ctx.expected(async () => {
    expect.soft(j(r).deck_name, "応答のデッキ名（下書き）").toBe("A1512-002-DRAFT");
    expect.soft(j(r).deck_name, "応答のデッキ名が保存済みのデッキ名ではない").not.toBe("A1512-002-SAVED");
  });
});
caseTest("IT-A15-12-003", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "003" });
  supplement(番号の補い);
  await ctx.expected(async () => {
    expect.soft(String(j(r).format_id), "フォーマットの識別子").toBe(ctx.notes.get("〔フォーマットID-A1512-共有B〕"));
    expect.soft(j(r).format_name_jp, "フォーマットの日本語名").toBe("A1512フォーマットβ");
    expect.soft(j(r).format_name_en, "フォーマットの英語名").toBe("A1512 Format Beta");
    expect.soft(String(j(r).archetype_id), "アーキタイプの識別子").toBe(ctx.notes.get("〔アーキタイプID-A1512-共有B〕"));
    expect.soft(j(r).archetype_name_jp, "アーキタイプの日本語名").toBe("A1512アーキタイプβ");
    expect.soft(j(r).archetype_name_en, "アーキタイプの英語名").toBe("A1512 Archetype Beta");
    expect.soft(String(j(r).card_id), "代表カードのカードID（シード表の1512923）").toBe(カードの実番号("1512923"));
    expect.soft(j(r).card_image, "代表カードの画像URL").toBe("img/goods/a1512-card3-latest.jpg");
  });
});
caseTest("IT-A15-12-004", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "004" });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(200); });
});
// ---- 005〜009 ----
caseTest("IT-A15-12-005", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "005", 誰: 所有者, 改ざん: true });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(200); });
});
caseTest("IT-A15-12-006", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "006", 誰: 所有者 });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(200); });
});
caseTest("IT-A15-12-007", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "007", 誰: 他者 });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
caseTest("IT-A15-12-008", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "008" });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
caseTest("IT-A15-12-009", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "009", 誰: 所有者, 改ざん: true });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
// ---- 010〜015 ----
caseTest("IT-A15-12-010", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "010", 閲覧用: "A1512-010-VIEW" });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(200); });
});
caseTest("IT-A15-12-011", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "011", 誰: 所有者 });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(200); });
});
caseTest("IT-A15-12-013", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "013" });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
caseTest("IT-A15-12-014", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "014", 誰: 他者, 閲覧用: "A1512-014-WRONG" });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
caseTest("IT-A15-12-015", async (ctx) => {
  const r = await 流す(ctx, { 番号: "91512015" });
  await ctx.expected(async () => { expect(r.ステータス, "HTTP ステータス").toBe(404); });
});
// ---- 016 ----
caseTest("IT-A15-12-016", async (ctx) => {
  const { step } = ctx;
  let token = "";
  let a!: 応答, b!: 応答;
  await step(1, async () => { supplement(開発者ツールの代わり); });
  await step(2, async () => { token = await ログインして控える(ctx, 他者); });
  await step(3, async () => { a = await デッキ情報を参照する(ctx.page, デッキID(ctx, "016"), { token }); });
  await step(4, async () => { note(`存在する非公開デッキの応答: ${要約(a)}`); });
  await step(5, async () => { b = await デッキ情報を参照する(ctx.page, "91512016", { token }); });
  await step(6, async () => { note(`存在しないデッキID 91512016 の応答: ${要約(b)}`); });
  await ctx.expected(async () => {
    expect.soft(b.ステータス, "HTTP ステータス（91512016）").toBe(a.ステータス);
    expect.soft(j(b).code, "処理結果コード（91512016）").toBe(j(a).code);
    expect.soft(j(b).message, "メッセージ（91512016）").toBe(j(a).message);
    expect.soft(j(a).message, "メッセージ").toBe(MSG);
  });
});
// ---- 017〜020 ----
caseTest("IT-A15-12-017", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "017", 誰: 他者 });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
caseTest("IT-A15-12-018", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "018", 誰: 所有者 });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).deck_name, "応答のデッキ名（下書き）").toBe("A1512-018-DRAFT");
  });
});
caseTest("IT-A15-12-019", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "019", 閲覧用: "A1512-019-WRONG" });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j(r).message, "応答のメッセージ").toBe(MSG);
  });
});
caseTest("IT-A15-12-020", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "020", 閲覧用: "A1512-020-VIEW" });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).deck_name, "応答のデッキ名（下書き）").toBe("A1512-020-DRAFT");
  });
});
// ---- 021〜029 ----
const 同じ時刻 = (実際: unknown, 期待: string) => Date.parse(String(実際)) === Date.parse(期待);
caseTest("IT-A15-12-021", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "021" });
  supplement("作成日時・更新日時は、日本時間（+09:00）の値として DB に書き、応答の日時を同じ時刻として照合した");
  await ctx.expected(async () => {
    expect.soft(j(r).deck_name, "デッキ名").toBe("A1512-021-DECK");
    expect.soft(j(r).deck_type, "デッキ種別（ユーザーデッキを表す値）").toBe("user");
    expect.soft(j(r).scope_id, "公開範囲").toBe(1);
    expect.soft(Number(j(r).deck_private_flag) === 0 || j(r).deck_private_flag === false, `非公開フラグが偽（実際 ${JSON.stringify(j(r).deck_private_flag)}）`).toBe(true);
    expect.soft(同じ時刻(j(r).create_date, "2026-06-01T10:20:30+09:00"), `作成日時が 2026-06-01 10:20:30（実際 ${JSON.stringify(j(r).create_date)}）`).toBe(true);
    expect.soft(同じ時刻(j(r).update_date, "2026-06-10T11:22:33+09:00"), `更新日時が 2026-06-10 11:22:33（実際 ${JSON.stringify(j(r).update_date)}）`).toBe(true);
  });
});
caseTest("IT-A15-12-022", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "022" });
  supplement(番号の補い);
  await ctx.expected(async () => {
    expect.soft(String(j(r).format_id), "フォーマットの識別子").toBe(ctx.notes.get("〔フォーマットID-A1512-共有A〕"));
    expect.soft(j(r).format_name_jp, "フォーマットの日本語名").toBe("A1512フォーマットα");
    expect.soft(j(r).format_name_en, "フォーマットの英語名").toBe("A1512 Format Alpha");
    expect.soft(String(j(r).archetype_id), "アーキタイプの識別子").toBe(ctx.notes.get("〔アーキタイプID-A1512-共有A〕"));
    expect.soft(j(r).archetype_name_jp, "アーキタイプの日本語名").toBe("A1512アーキタイプα");
    expect.soft(j(r).archetype_name_en, "アーキタイプの英語名").toBe("A1512 Archetype Alpha");
    expect.soft(String(j(r).card_id), "代表カードのカードID（シード表の1512924）").toBe(カードの実番号("1512924"));
    expect.soft(j(r).card_image, "代表カードの画像URL").toBe("img/goods/a1512-card4-latest.jpg");
  });
});
caseTest("IT-A15-12-023", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "023" });
  supplement("デッキ利用者ID は8文字までの列でシード表の値（a1512-user-a・12文字）が入らないので、所有プレイヤーの画面の登録で振られた値と照合した");
  const 公開 = 選手の公開情報(ctx.notes.get("〔プレイヤーID-A1512-共有A〕"));
  await ctx.expected(async () => {
    expect.soft(公開?.デッキ利用者ID ?? "", "所有プレイヤーのデッキ利用者ID（DB の値が空でない）").not.toBe("");
    expect.soft(j(r).deck_user_id, "所有プレイヤーのデッキ利用者ID").toBe(公開?.デッキ利用者ID);
    expect.soft(j(r).nickname, "所有プレイヤーのニックネーム").toBe("A1512所有者");
  });
});
caseTest("IT-A15-12-024", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "024" });
  await ctx.expected(async () => {
    expect.soft(j(r).event_name_jp, "大会名（日本語）").toBe("A1512-024-大会");
    expect.soft(j(r).event_name_en, "大会名（英語）").toBe("A1512-024-Open");
    expect.soft(String(j(r).event_date ?? "").slice(0, 10), "大会日付").toBe("2026-05-05");
    expect.soft(j(r).player_name, "プレイヤー名").toBe("A1512-024-選手");
    expect.soft(j(r).result, "成績").toBe("A1512-024-優勝");
    expect.soft(j(r).ranking, "順位").toBe(1);
    expect.soft(j(r).source_url, "出典URL").toBe("https://replace-dev.hareruyamtg.com:8443/source/a1512-024");
  });
});
caseTest("IT-A15-12-025", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "025" });
  const 値なし = (v: unknown) => v === null || v === undefined || v === "";
  await ctx.expected(async () => {
    for (const [k, 名] of [["event_name_jp", "大会名（日本語）"], ["event_name_en", "大会名（英語）"], ["event_date", "大会日付"], ["player_name", "プレイヤー名"], ["result", "成績"], ["ranking", "順位"], ["source_url", "出典URL"]] as const) {
      expect.soft(値なし(j(r)[k]), `${名}が値を持たない（実際 ${JSON.stringify(j(r)[k])}）`).toBe(true);
    }
  });
});
caseTest("IT-A15-12-026", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "026", 誰: 所有者 });
  await ctx.expected(async () => { expect(j(r).display_token, "限定公開トークン").toBe("A1512-026-VIEW"); });
});
caseTest("IT-A15-12-027", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "027" });
  supplement(番号の補い);
  await ctx.expected(async () => {
    const tags = (j(r).deck_tags ?? []) as { id: number; name_jp: string; name_en: string }[];
    expect.soft(tags.length, "デッキタグの件数").toBe(2);
    expect.soft(tags.map((t) => `${t.id}|${t.name_jp}|${t.name_en}`).sort(), "デッキタグ（識別子・日本語名・英語名）")
      .toEqual([`${デッキタグの番号(デッキタグ甲.名日)}|${デッキタグ甲.名日}|${デッキタグ甲.名英}`, `${デッキタグの番号(デッキタグ乙.名日)}|${デッキタグ乙.名日}|${デッキタグ乙.名英}`].sort());
  });
});
caseTest("IT-A15-12-028", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "028" });
  await ctx.expected(async () => { expect(Object.keys(j(r)), "応答の項目にデッキタグが含まれない").not.toContain("deck_tags"); });
});
caseTest("IT-A15-12-029", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "029" });
  supplement(番号の補い);
  await ctx.expected(async () => {
    const tags = (j(r).campaign_tags ?? []) as { id: number; name_jp: string; name_en: string; is_during: unknown }[];
    expect.soft(tags.length, "キャンペーンタグの件数").toBe(3);
    expect.soft(tags.map((t) => `${t.id}|${t.name_jp}|${t.name_en}`).sort(), "キャンペーンタグ（識別子・日本語名・英語名。順不同）")
      .toEqual(キャンペーン.map((c) => `${キャンペーンタグの番号(c.名日)}|${c.名日}|${c.名英}`).sort());
    for (const t of tags) expect.soft([0, 1, 2].includes(Number(t.is_during)) && Number.isInteger(t.is_during), `「${t.name_jp}」の開催状態が0・1・2のいずれかの整数（実際 ${JSON.stringify(t.is_during)}）`).toBe(true);
  });
});
// ---- 030〜032 ----
type カード要素 = Record<string, unknown>;
const 要素 = (r: 応答, 名英: string): カード要素 | undefined => ((j(r).cards ?? []) as カード要素[]).find((c) => c.name_en === 名英);
caseTest("IT-A15-12-030", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "030" });
  supplement(番号の補い);
  supplement("カードタイプ・色は応答では番号の並びなので、「クリーチャー」「呪文」「赤」「青」の番号（DB を名前で引いた値）と照合した");
  await ctx.expected(async () => {
    const cards = (j(r).cards ?? []) as カード要素[];
    expect.soft(cards.length, "採用カードの件数").toBe(2);
    const 期待 = [
      { 表: "1512921", ja: "img/goods/a1512-card1-ja.jpg", en: "img/goods/a1512-card1-en.jpg", 型: "クリーチャー", 色: "赤", マナ: 3, 枚: 4, ボード: 1 },
      { 表: "1512922", ja: "img/goods/a1512-card2-ja.jpg", en: "img/goods/a1512-card2-en.jpg", 型: "呪文", 色: "青", マナ: 5, 枚: 2, ボード: 2 },
    ];
    for (const e of 期待) {
      const c = 要素(r, カード定義[e.表].名英);
      expect.soft(c !== undefined, `カード ${e.表}（${カード定義[e.表].名英}）の要素がある`).toBe(true);
      if (!c) continue;
      expect.soft(String(c.id), `${e.表} の識別子`).toBe(カードの実番号(e.表));
      expect.soft(c.name_jp, `${e.表} の日本語名`).toBe(カード定義[e.表].名日);
      expect.soft(c.name_en, `${e.表} の英語名`).toBe(カード定義[e.表].名英);
      expect.soft(c.image_jp, `${e.表} の日本語画像`).toBe(e.ja);
      expect.soft(c.image_en, `${e.表} の英語画像`).toBe(e.en);
      expect.soft(c.cardtypes, `${e.表} のカードタイプ（${e.型}）`).toEqual([Number(カードタイプの番号(e.型))]);
      expect.soft(c.colors, `${e.表} の色（${e.色}）`).toEqual([Number(色の番号(e.色))]);
      expect.soft(c.mana_value, `${e.表} のマナ総量`).toBe(e.マナ);
      expect.soft(c.count, `${e.表} の枚数`).toBe(e.枚);
      expect.soft(c.board_id, `${e.表} のボード区分`).toBe(e.ボード);
    }
  });
});
caseTest("IT-A15-12-031", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "031" });
  supplement("不明カード可否の項目名は正本に無い。応答の項目 is_unknown（新しいアプリで不明カードの行に付く項目）があるかを確かめた");
  await ctx.expected(async () => {
    const a = 要素(r, カード定義["1512921"].名英), b = 要素(r, カード定義["1512922"].名英);
    expect.soft(a !== undefined && b !== undefined, "採用カード2枚の要素がある").toBe(true);
    expect.soft(a?.is_sticker, "カード1512921のステッカー可否（可）").toBe(1);
    expect.soft(a?.is_attraction, "カード1512921のアトラクション可否（可でない値）").toBe(0);
    expect.soft(b?.is_attraction, "カード1512922のアトラクション可否（可）").toBe(1);
    expect.soft(b?.is_sticker, "カード1512922のステッカー可否（可でない値）").toBe(0);
    expect.soft(a !== undefined && "is_unknown" in a, "カード1512921の要素に不明カード可否の項目が含まれる").toBe(true);
    expect.soft(b !== undefined && "is_unknown" in b, "カード1512922の要素に不明カード可否の項目が含まれる").toBe(true);
  });
});
caseTest("IT-A15-12-032", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "032A" });
  await ctx.expected(async () => {
    expect.soft(j(r).deck_name, "応答のデッキ名（1件のデッキ情報）").toBe("A1512-032-ONE");
    expect.soft(r.本文.includes("A1512-032-OTHER"), "応答にデッキ名「A1512-032-OTHER」が含まれない").toBe(false);
    for (const k of ["total_count", "page", "per_page", "cache_key", "decks"]) expect.soft(Object.keys(j(r)), `応答に件数・ページ位置の項目 ${k} が含まれない`).not.toContain(k);
  });
});
// ---- 033 ----
caseTest("IT-A15-12-033", async (ctx) => {
  const { step } = ctx;
  const id = デッキID(ctx, "033");
  let 前 = null as ReturnType<typeof 保存済みデッキを読む>, 後 = null as ReturnType<typeof 保存済みデッキを読む>;
  let 下書き前 = "", 下書き後 = "";
  let r!: 応答;
  await step(1, async () => { supplement(開発者ツールの代わり); });
  await step(2, async () => {
    前 = 保存済みデッキを読む(id);
    supplement("一時保存の下書きは DB にない（一時保存先に入っている）ので、下書きのデッキ名は、デッキ情報参照 API の応答（下書きがあれば下書きを返す）で控えた");
    下書き前 = String(j(await デッキ情報を参照する(ctx.page, id)).deck_name ?? "");
    note(`参照前: 保存済み ${JSON.stringify(前)}・下書きのデッキ名 ${下書き前}`);
  });
  await step(3, async () => { r = await デッキ情報を参照する(ctx.page, id); });
  await step(4, async () => { note(要約(r)); });
  await step(5, async () => {
    後 = 保存済みデッキを読む(id);
    下書き後 = String(j(await デッキ情報を参照する(ctx.page, id)).deck_name ?? "");
    note(`参照後: 保存済み ${JSON.stringify(後)}・下書きのデッキ名 ${下書き後}`);
  });
  await ctx.expected(async () => {
    expect.soft(後?.デッキ名, "デッキ名").toBe("A1512-033-SAVED");
    expect.soft(後?.更新日時, "更新日時").toBe("2026-07-07 07:07:07");
    expect.soft(後?.採用カード件数, "採用カード件数").toBe(0);
    expect.soft(下書き後, "下書きのデッキ名").toBe("A1512-033-DRAFT");
    expect.soft(後, "参照の前後で保存済みデッキが変わらない").toEqual(前);
    expect.soft(下書き後, "参照の前後で下書きが変わらない").toBe(下書き前);
  });
});
// ---- 034〜041 ----
caseTest("IT-A15-12-034", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "034" });
  await ctx.expected(async () => {
    expect.soft(j(r).code, "処理結果コード").toBe(200);
    expect.soft(j(r).message, "メッセージ").toBe("Get deck success");
    expect.soft(j(r).deck_name, "デッキ名").toBe("A1512-034-PUBLIC");
  });
});
caseTest("IT-A15-12-035", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "035", 誰: 所有者 });
  await ctx.expected(async () => { expect(j(r).scope_id, "応答の公開範囲").toBe(2); });
});
caseTest("IT-A15-12-036", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "036", 閲覧用: "A1512-036-VIEW" });
  await ctx.expected(async () => { expect(j(r).scope_id, "応答の公開範囲").toBe(3); });
});
caseTest("IT-A15-12-037", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "037", 誰: 所有者 });
  await ctx.expected(async () => { expect(j(r).deck_private_flag === 1 || j(r).deck_private_flag === true, `応答の非公開フラグが真（実際 ${JSON.stringify(j(r).deck_private_flag)}）`).toBe(true); });
});
caseTest("IT-A15-12-038", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "038" });
  await ctx.expected(async () => {
    expect.soft(j(r).nickname === null || j(r).nickname === undefined || j(r).nickname === "", `所有プレイヤーにニックネームの値が含まれない（実際 ${JSON.stringify(j(r).nickname)}）`).toBe(true);
    expect.soft(r.本文.includes("A1512所有者"), "「A1512所有者」が応答のどこにも現れない").toBe(false);
  });
});
caseTest("IT-A15-12-039", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "039" });
  supplement("不明カード可否の項目名は正本に無い。応答の項目 is_unknown（新しいアプリで不明カードの行に付く項目）で確かめた");
  await ctx.expected(async () => {
    const c = 要素(r, カード定義["15120391"].名英);
    expect.soft(c !== undefined, "採用カード15120391の要素がある").toBe(true);
    expect.soft(c?.is_unknown, "採用カード15120391の不明カード可否（可を表す値）").toBe(1);
  });
});
caseTest("IT-A15-12-040", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "040" });
  supplement("不明カード可否の項目名は正本に無い。応答の項目 is_unknown（新しいアプリで不明カードの行に付く項目）で確かめた");
  await ctx.expected(async () => {
    const c = 要素(r, カード定義["15120401"].名英);
    expect.soft(c !== undefined, "採用カード15120401の要素がある").toBe(true);
    expect.soft(c?.is_unknown, "採用カード15120401の不明カード可否（不可を表す値）").toBe(0);
  });
});
caseTest("IT-A15-12-041", async (ctx) => {
  const r = await 流す(ctx, { 末尾: "CB041", 誰: 所有者 });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j(r).deck_name, "応答のデッキ名（下書き）").toBe("A1512-CB041-DRAFT");
    expect.soft(j(r).format_name_jp, "マスタから補完されたフォーマットの日本語名").toBe("A1512フォーマットα");
    expect.soft(j(r).format_name_en, "フォーマットの英語名").toBe("A1512 Format Alpha");
    expect.soft(j(r).archetype_name_jp, "アーキタイプの日本語名").toBe("A1512アーキタイプα");
    expect.soft(j(r).archetype_name_en, "アーキタイプの英語名").toBe("A1512 Archetype Alpha");
  });
});
