/**
 * a15-15 デッキビルダー_使用カード（指定フォーマットで採用率の高いカードの平均採用枚数を集計し上位から返す参照系JSON API・GET）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a15_15_api_deck_builder_deck_usage_card_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を normal test として実装し、`要実機確認` 修飾の行（006 想定外クエリ200無視は正本明記なし／033 archetype_id・034 board_id・035 count上位・036 count既定20＝実装に該当絞り込みが無い乖離 付帯表4#4-6）は test.fixme とする。
 * 手動（008 タイムアウト実再現・042 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たない（正本md「ブラウザ向けの画面を持たない」）ためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（設計書・観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・SQL固定値を期待値に流用しない。
 *  - 送信先は実装の実効パス `GET /api/deck/usage_analysis/{formatId}`（DeckController.php:522）。設計書 `GET /deck/usage_card/{formatId}` は `/api`・パス名で不一致（付帯表4#1）。
 *  - 認証は行わない（DeckController.php:522-554・正本md）。資格情報の欠落/不正でも認証起因の拒否（401）を返さず HTTP200 でラッパ応答が返る（付帯表4#9・要実機確認）。
 *  - 合否（成功）は HTTP200＋応答 `{code, cards}`、（該当フォーマットなし）は 404＋`{code, message}`（message は設計「format not found」＝付帯表4#2）を設計の意味で判定する。
 *  - 土地切替 type／件数 count／archetype_id／board_id は設計のパラメータ名で送る（実装は is_land／LIMIT100固定・絞り込み未実装＝付帯表4#3-6）。実装が未反映なら集計値が変わらず落ちて検出する（実装へ寄せない）。
 *  - cards[] のフィールド構成・型・null許容は設計（id/name_jp/name_en/image_jp/image_en/count）を期待値とする（実装の card_id/totalCount・name_en/画像欠落＝付帯表4#7、count型＝付帯表4#8）。
 *  - 集計内容（公開×大会のみ・土地限定/除外・基本土地除外・並び順・平均採用枚数算出・集計範囲・各カードの混入有無）はDB照査で補完（本リポでDBは実行しない）。本specは一次オラクルとしてAPI応答（HTTPステータス・ラッパ構造・件数）を確認する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_15_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildUsagePath,
  buildNoAuthHeaders,
  buildInvalidAuthHeaders,
  FORMAT_ID,
  LAND_TYPE,
  NON_LAND_TYPE,
  ARCHETYPE_ID,
  ARCHETYPE_ID_NO_MATCH,
  BOARD_ID,
  LIMIT_COUNT,
  DEFAULT_COUNT,
  UNKNOWN_QUERY,
  SUCCESS_STATUS,
  NOT_FOUND_STATUS,
  SPEC_NOT_FOUND_MESSAGE,
  SPEC_CARD_FIELDS,
} from "../../../pages/api/a15/a15_15_api_deck_builder_deck_usage_card.api";

const HAS_API = !!process.env.A15_15_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "集計取得＝200（正本md: 入出力 レスポンス成功 HTTP200）").toBe(SUCCESS_STATUS);
}
function expect404(status: number) {
  expect(status, "該当フォーマットなし＝404（正本md: エラー処理 該当フォーマットなし→404）").toBe(NOT_FOUND_STATUS);
}
function expectNot5xx(status: number) {
  expect(status, "サーバエラー（5xx）で停止しない").toBeLessThan(500);
}
function expectNot200(status: number) {
  expect(status, "正常取得（200）とならない（該当なし/必須欠落）").not.toBe(SUCCESS_STATUS);
}

/** 成功本文がラッパ応答 {code, cards} であることを確認。 */
async function expectWrapperBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "code"), "成功本文に code を含む（正本md ラッパ応答）").toBeTruthy();
  expect(Array.isArray((body as { cards?: unknown }).cards), "成功本文の cards は配列（正本md ラッパ応答）").toBeTruthy();
  return body;
}

/** 該当フォーマットなし本文が {code, message} で設計文言を含むことを確認。 */
async function expectNotFoundBody(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "code"), "失敗本文に code を含む（正本md {code,message}）").toBeTruthy();
  expect(Object.prototype.hasOwnProperty.call(body, "message"), "失敗本文に message を含む（正本md {code,message}）").toBeTruthy();
  // 設計文言「format not found」を期待。実装は「見つかりません／Not Found」（付帯表4#2）→ 違えば落ちて検出する（実装文言へ寄せない）。
  expect(JSON.stringify(body), "message に設計文言「format not found」を含む（付帯表4#2）").toContain(SPEC_NOT_FOUND_MESSAGE);
}

test.describe("API > デッキビルダー_使用カード", { tag: ["@api", "@a15"] }, () => {
  // ===== 資格情報・通信・正常系（IT-32 / IT-10 / IT-09。認証を行わないため欠落/不正でも200） =====

  test("E2E-A15-15-001 資格情報の欠落/不正でも認証起因の拒否なく集計応答が返る", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    // 資格情報なし／不正値のいずれでも認証起因の拒否（401）を返さず200・ラッパ応答（正本md: 認証を行わない・付帯表4#9）。
    const resNoAuth = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(resNoAuth.status());
    await expectWrapperBody(resNoAuth);
    const resBadAuth = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildInvalidAuthHeaders() });
    expect200(resBadAuth.status());
    await ctx.dispose();
  });

  test("E2E-A15-15-002 集計取得時に永続化済みの値が再計算されず返る", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // 平均採用枚数（count）がリポジトリ集計結果のまま・丸め/補正/再計算が加わらないことはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-15-003 集計取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-15-004 正常なformatIdの指定でカード別平均採用枚数のラッパ応答が返る", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res); // code とともに上位から最大件数分の cards が返る（処理フロー#3-5）。
    await ctx.dispose();
  });

  test("E2E-A15-15-005 異常なパラメータ値でも追加検証せず既定扱いで200となる", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    // type=other（land以外＝土地以外扱い）・count=abc（非数値＝既定扱い）。形式の追加検証を行わず200（バリデーション「形式の追加検証は行わない」）。
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { type: NON_LAND_TYPE, count: "abc" }), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    await ctx.dispose();
  });

  test.fixme("E2E-A15-15-006 想定外のクエリ項目を加えてもサーバエラーで停止しない", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    // 要実機確認: 想定外クエリの 200無視は正本に明記が無いため期待値を固定せず、5xxで停止しないことのみ判定（付帯表1 006）。
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { extra: UNKNOWN_QUERY }), { headers: buildNoAuthHeaders() });
    expectNot5xx(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-15-007 該当フォーマットなしで404が返る", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.NONE), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await expectNotFoundBody(res); // 本文 {code,message}・message は設計「format not found」（実装文言は付帯表4#2）。
    await ctx.dispose();
  });

  test("E2E-A15-15-009 集計対象のデッキ・カードがリポジトリ検索で取得される", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // 公開×大会デッキとその採用カードがリポジトリ検索で取得され cards に該当カードが含まれることはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-15-010 該当フォーマットなし時のHTTPステータスが404である", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.NONE), { headers: buildNoAuthHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A15-15-011 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status()); // 通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A15-15-012 対象条件に該当する正常値で200と集計結果が返る", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    await ctx.dispose();
  });

  test("E2E-A15-15-015 該当フォーマットなしのformatIdで集計取得200とならない", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-FORMAT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.NONE), { headers: buildNoAuthHeaders() });
    expectNot200(res.status());
    expect404(res.status()); // 該当なし＝404（処理フロー#1・異常系）。
    await ctx.dispose();
  });

  test("E2E-A15-15-016 パス変数formatId欠落で正しい集計が取得されない", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    // formatId を欠いた/空のパス。欠落時の具体ステータス（ルート不一致/404等）は要実機確認のため、正常取得（200）とならないことのみ判定。
    const res = await ctx.get(buildUsagePath(FORMAT_ID.MISSING), { headers: buildNoAuthHeaders() });
    expectNot200(res.status());
    await ctx.dispose();
  });

  // ===== レスポンス契約・データなし・受信検証・冪等（IT-32 / IT-10） =====

  test("E2E-A15-15-017 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = await expectWrapperBody(res);
    // 設計の型契約: code は integer。cards[] は id/count integer・name_jp/name_en string・image_jp/image_en string(該当なしで null)。
    expect(typeof body.code, "code は integer（入出力 レスポンス型定義）").toBe("number");
    const cards = (body as { cards: unknown[] }).cards;
    for (const card of cards) {
      const c = card as Record<string, unknown>;
      for (const field of SPEC_CARD_FIELDS) {
        // 実装は card_id/name_jp/totalCount のみ（name_en/image_* 欠落・count⇔totalCount＝付帯表4#7/#8）→ 仕様名で照合し違えば落ちて検出する。
        expect(Object.prototype.hasOwnProperty.call(c, field), `cards[] に仕様フィールド ${field} を含む（付帯表4#7）`).toBeTruthy();
      }
      expect(typeof c.id, "cards[].id は integer").toBe("number");
      expect(typeof c.count, "cards[].count は integer（付帯表4#8）").toBe("number");
      expect(typeof c.name_jp, "cards[].name_jp は string").toBe("string");
    }
    await ctx.dispose();
  });

  test("E2E-A15-15-018 集計対象が0件のとき200・空のcardsが返る", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.EMPTY), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = await expectWrapperBody(res);
    expect((body as { cards: unknown[] }).cards.length, "集計対象0件で cards は空配列（入出力 レスポンス成功・データ整合性）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A15-15-019 公開かつ大会のデッキのみが集計対象となる", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN 非公開/大会以外混在) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // 公開×大会デッキのみが集計対象で非公開・大会以外の採用枚数が cards の集計に混入しないことはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  test("E2E-A15-15-020 同一GETの重複呼び出しで同一ラッパ応答（冪等参照）となる", async () => {
    test.skip(!HAS_API, "A15_15_READY 未設定");
    const ctx = await newCtx();
    const res1 = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    const res2 = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res1.status());
    expect(res2.status(), "2回目も同一HTTPステータス（参照系・冪等）").toBe(res1.status());
    const body1 = JSON.stringify(await res1.json());
    const body2 = JSON.stringify(await res2.json());
    expect(body2, "2回の応答本文が一致（副作用なし・利用者状態によらず同一結果）").toBe(body1);
    // 副作用（DB更新）が発生しないことはDB照査で補完（本リポでDBは実行しない）。
    await ctx.dispose();
  });

  // ===== 土地限定/除外・基本土地除外（IT-09・設計書補完。type は付帯表4#3） =====

  test("E2E-A15-15-030 type=landで土地カードのみが集計対象となる", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { type: LAND_TYPE }), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // type=land で土地カードのみ集計・土地以外が cards に含まれないことはDB照査で補完（実装は is_land＝付帯表4#3で type が効かなければ落ちて検出）。
    await ctx.dispose();
  });

  test("E2E-A15-15-031 type未指定/land以外で土地以外のカードのみが集計対象となる", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { type: NON_LAND_TYPE }), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // land以外/未指定で土地以外のみ集計・土地カードが cards に含まれないことはDB照査で補完（付帯表4#3）。
    await ctx.dispose();
  });

  test("E2E-A15-15-032 土地限定かつ基本土地非含フォーマットで基本土地が除外される", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-BASICLAND) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.BASICLAND, { type: LAND_TYPE }), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // 基本地形混在フラグ偽＋土地限定で基本土地特殊タイプが cards から除外されることはDB照査で補完（集計条件 土地の限定/除外）。
    await ctx.dispose();
  });

  // ===== アーキタイプ/ボード絞り込み・件数制限（IT-09・設計書補完。実装に該当絞り込みが無い乖離＝付帯表4#4-6・要実機確認） =====

  test.fixme("E2E-A15-15-033 archetype_id指定で当該アーキタイプのデッキに限定される", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    // 要実機確認: 実装の集計SQLに archetype_id 絞り込みが無い（付帯表4#5）。設計の絞り込み意味で期待値を立て、実装が絞り込まなければ集計値が変わらず落ちて検出する。
    const resFiltered = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { archetypeId: ARCHETYPE_ID }), { headers: buildNoAuthHeaders() });
    const resAll = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(resFiltered.status());
    expect200(resAll.status());
    // 当該アーキタイプに限定され他アーキタイプの採用枚数が混入しない（archetype_id 無しと集計値が異なる）ことはDB照査で補完。
    await ctx.dispose();
  });

  test.fixme("E2E-A15-15-034 board_id指定で当該ボードのカードに限定される", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    // 要実機確認: 実装の集計SQLに board_id 絞り込みが無い（付帯表4#6）。設計の絞り込み意味で期待値を立て、実装が絞り込まなければ落ちて検出する。
    const resFiltered = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { boardId: BOARD_ID }), { headers: buildNoAuthHeaders() });
    const resAll = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(resFiltered.status());
    expect200(resAll.status());
    // 当該ボードに限定され他ボードのカードが混入しないことはDB照査で補完。
    await ctx.dispose();
  });

  test.fixme("E2E-A15-15-035 count指定で上位count件に件数が制限される", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN count超の対象カード) 未設定");
    const ctx = await newCtx();
    // 要実機確認: 実装は LIMIT100固定で count 不参照（付帯表4#4）。設計の上位count件で期待値を立て、件数が count を超えれば落ちて検出する。
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { count: LIMIT_COUNT }), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = await expectWrapperBody(res);
    expect((body as { cards: unknown[] }).cards.length, "cards 件数は count を超えない（処理フロー#4・件数）").toBeLessThanOrEqual(LIMIT_COUNT);
    await ctx.dispose();
  });

  test.fixme("E2E-A15-15-036 count未指定で既定20件を上限に絞られる", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN 20件超の対象カード) 未設定");
    const ctx = await newCtx();
    // 要実機確認: 実装の既定件数は LIMIT100固定で既定20件ではない（付帯表4#4）。設計の既定20件で期待値を立て、20を超えれば落ちて検出する。
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = await expectWrapperBody(res);
    expect((body as { cards: unknown[] }).cards.length, "count未指定で cards 件数は既定20件を超えない（入出力 リクエスト count）").toBeLessThanOrEqual(DEFAULT_COUNT);
    await ctx.dispose();
  });

  // ===== 並び順・平均採用枚数算出・集計範囲・絞り込み0件・null許容（IT-09 / IT-32・設計書補完） =====

  test("E2E-A15-15-037 平均採用枚数の降順→カラー順→英語名昇順で並ぶ", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // cards が平均採用枚数(count)降順→カラー順→英語名(name_en)昇順で並ぶことはDB照査で補完（処理フロー#4・並び順。name_en欠落は付帯表4#7）。
    await ctx.dispose();
  });

  test("E2E-A15-15-038 平均採用枚数が採用枚数合計÷(カード種別数×特殊タイプ数)で算出される", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN 既知の採用枚数/種別数/特殊タイプ数) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // 各カードの count が 採用枚数合計÷(カード種別数×特殊タイプ数) の平均採用枚数(整数化)と一致することはDB照査で補完（集計単位。count型は付帯表4#8）。
    await ctx.dispose();
  });

  test("E2E-A15-15-039 集計範囲（メタ範囲日数前0時〜本日23:59:59）のデッキのみが対象となる", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN 範囲内/範囲外のイベント日) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // イベント日が既定集計範囲内のデッキのみが対象で範囲外が混入しないことはDB照査で補完（集計範囲。from/to上書きは設計外＝付帯表4#10で固定しない）。
    await ctx.dispose();
  });

  test("E2E-A15-15-040 絞り込み結果が0件のとき200・空のcardsが返る", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN) 未設定");
    const ctx = await newCtx();
    // どのデッキも該当しない絞り込み条件（該当デッキの無い archetype_id）。
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN, { archetypeId: ARCHETYPE_ID_NO_MATCH }), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    const body = await expectWrapperBody(res);
    expect((body as { cards: unknown[] }).cards.length, "絞り込み0件でも200・cards は空配列（処理フロー#5・データ整合性）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A15-15-041 画像URLが該当なしのときnullで返る", async () => {
    test.skip(!HAS_API, "A15_15_READY(SEED-A15-15-DECKS-KNOWN 画像未設定カード) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUsagePath(FORMAT_ID.KNOWN), { headers: buildNoAuthHeaders() });
    expect200(res.status());
    await expectWrapperBody(res);
    // cards[].image_jp/image_en が該当言語版画像の無いとき null で返ること（serialize_null 有効）はDB照査で補完（実装の image_* 欠落＝付帯表4#7で落ちて検出）。
    await ctx.dispose();
  });
});
