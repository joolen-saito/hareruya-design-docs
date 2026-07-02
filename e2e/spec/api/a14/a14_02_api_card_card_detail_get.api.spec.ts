/**
 * a14-02 カード詳細取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a14_02_api_card_card_detail_get_e2e_cases.md（付帯表1 E2E可否）に対応。
 *
 * 重要（付帯表4#1）: 設計書の入口 `GET /cardDetails/{id}` は ec-cube-enterprise の App 名前空間に未実装で実効パスの
 *   file:line 根拠が確定できない。付帯表1 では全API/統合ケースに `要実機確認` 修飾子が付く。よって本specは
 *   「E2E自動化(API/統合)（要実機確認）」を全件 test.fixme（理由付き）で残す（実装テストは0件）。
 *   手動（030 タイムアウト実再現／031 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 *   E2E自動化(UI) は0件（本APIはブラウザ向け画面を持たない／正本md）。
 *
 * 期待結果は仕様（正本md a14-02・観点表）由来（オラクル独立性）。
 *  - 送信先は設計書由来 `GET /cardDetails/{id}`（実効パス・認可方式・404本文形は実機確認で確定＝付帯表4#1/#2/#3）。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - foilFlg/promotionFlg は仕様 boolean を期待（実装 getter は int＝付帯表4#4）／除外指定プロパティ非混入を期待（付帯表4#5）。
 *  - 日時 ISO8601・camelCase は仕様（付帯表4#6）／設計未記載プロパティ（frameFlg 等）はオラクル化しない（付帯表4#7）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A14_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  CARD_DETAIL_GET_PATH_BASE,
  buildCardDetailPath,
  buildNoAuthHeaders,
  UNKNOWN_QUERY_PARAMS,
  KNOWN_DETAIL_ID,
  RELATED_DETAIL_ID,
  NONE_DETAIL_ID,
  ZERO_DETAIL_ID,
  NEGATIVE_DETAIL_ID,
  NON_NUMERIC_DETAIL_ID,
  EXPECTED_FLAVOR_JP,
  EXPECTED_CARD_NO,
  NOT_FOUND_MESSAGE,
  INTEGER_FIELDS,
  STRING_FIELDS,
  BOOLEAN_FIELDS,
  RELATED_OBJECT_FIELDS,
  RELATED_ARRAY_FIELDS,
  EXCLUDED_FIELDS,
  CardDetailGetSuccessBody,
  CardDetailGetErrorBody,
} from "../../../pages/api/a14/a14_02_api_card_card_detail_get.api";

const HAS_API = !!process.env.A14_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（正本md 入出力 レスポンス(成功)）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404 Not Found（正本md 入出力 レスポンス(失敗)）").toBe(404);
}
function expectNot200(status: number) {
  // 仕様で固定される404は該当なし時のみ。id≦0/非数値/負値の具体ステータスは要実機確認のため「正常取得200とならない」のみ判定。
  expect(status, "不正パラメータは正常取得200とならない（具体ステータスは要実機確認）").not.toBe(200);
}

test.describe("API > カード詳細取得(GET参照系)", { tag: ["@api", "@a14"] }, () => {
  // 全件 test.fixme: 当該エンドポイント `/cardDetails/{id}` が ec-cube-enterprise に未実装（付帯表4#1）。
  // 実効パス・認可方式・404本文形を実機確認で確定後に test へ昇格する。

  test.fixme(
    "E2E-A14-02-001 正常なカード詳細IDの指定で200とカード詳細情報JSONが返る（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as CardDetailGetSuccessBody;
      expect("id" in body, "カード詳細情報JSON（id を含む）が返る").toBeTruthy();
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-002 正常取得時に取得時点の値が再計算されず返る（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as CardDetailGetSuccessBody;
      // 取得時点の値がそのまま返る（業務ルール「計算処理を行わない」）。値照合は env 期待値（未設定なら要実機確認）。
      if (EXPECTED_FLAVOR_JP !== undefined) expect(String(body.flavorJp), "flavorJp 一致").toBe(EXPECTED_FLAVOR_JP);
      if (EXPECTED_CARD_NO !== undefined) expect(String(body.cardNo), "cardNo 一致").toBe(EXPECTED_CARD_NO);
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-003 正常取得時のHTTPステータスが200である（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-004 指定したカード詳細IDに対応するカード詳細を取得する（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as CardDetailGetSuccessBody;
      // 応答の id が指定IDと一致（処理フロー#2「当該IDのカード詳細を取得」）。
      expect(String(body.id), "応答の id が指定カード詳細IDと一致").toBe(String(KNOWN_DETAIL_ID));
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-005 認証済クライアントからの呼び出しで応答が処理結果と一致する（要実機確認: 認可方式未確定／付帯表4#2）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-API-AUTH) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID), { headers: buildNoAuthHeaders() });
      expect200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-008 異常な資格情報での呼び出しが許可されず正常取得とならない（要実機確認: 認可方式未確定／付帯表4#2）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-API-AUTH 無効/欠落資格情報) 未設定");
      const ctx = await newCtx();
      // 無効・欠落した資格情報では正常取得200を返さない（拒否時の具体ステータス401/403等は要実機確認＝付帯表4#2）。
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID), { headers: buildNoAuthHeaders() });
      expectNot200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-006 成功レスポンスが仕様のフィールド構成・型契約と一致する（要実機確認: エンドポイント未実装／付帯表4#1,#4,#7）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      // integer群／string群／boolean群（foilFlg/promotionFlg）（正本md 入出力 レスポンス(成功)）。
      // foilFlg は仕様 boolean（実装 getter int＝付帯表4#4）。設計未記載プロパティ（frameFlg 等）はオラクル化しない（付帯表4#7）。
      for (const f of INTEGER_FIELDS) {
        expect(Number.isInteger(body[f]), `${f} は integer`).toBeTruthy();
      }
      // backCardDetailId は integer または未設定時 null。
      expect(
        Number.isInteger(body.backCardDetailId) || body.backCardDetailId === null,
        "backCardDetailId は integer（未設定時 null）"
      ).toBeTruthy();
      for (const f of STRING_FIELDS) {
        expect(typeof body[f], `${f} は string`).toBe("string");
      }
      for (const f of BOOLEAN_FIELDS) {
        expect(typeof body[f], `${f} は boolean（実装 int は付帯表4#4で検出）`).toBe("boolean");
      }
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-007 パス変数（id）欠落で正しいカード詳細が取得されない（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY 未設定");
      const ctx = await newCtx();
      // id を欠いたパス（ベースのみ）では正しいカード詳細情報（200）を返さない（具体ステータス＝ルート不一致/404等は要実機確認）。
      const res = await ctx.get(CARD_DETAIL_GET_PATH_BASE);
      expectNot200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-010 該当するカード詳細が無い場合に404 Not Found が返る（要実機確認: エンドポイント未実装／付帯表4#1,#3）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-NONE) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(NONE_DETAIL_ID));
      expect404(res.status());
      const body = (await res.json()) as CardDetailGetErrorBody;
      // 404本文は {code, message}・message は仕様「Not Found」（本文形は実機確認＝付帯表4#3。期待値を実装へ寄せない）。
      expect(typeof body.code, "code を持つ").toBe("number");
      expect(body.message, "message=Not Found（仕様由来）").toBe(NOT_FOUND_MESSAGE);
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-011 異常なパラメータ値（id≦0）で正しいカード詳細が取得されない（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY 未設定");
      const ctx = await newCtx();
      const resZero = await ctx.get(buildCardDetailPath(ZERO_DETAIL_ID));
      expectNot200(resZero.status());
      const resNeg = await ctx.get(buildCardDetailPath(NEGATIVE_DETAIL_ID));
      expectNot200(resNeg.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-012 非数値（型不正）のカード詳細IDで正しいカード詳細が取得されない（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(NON_NUMERIC_DETAIL_ID));
      expectNot200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-013 指定カード詳細IDに一致する単一レコードのみが返る（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as CardDetailGetSuccessBody;
      // 主キーで一意に取得した当該IDのカード詳細のみが返る（処理フロー#2）。
      expect(String(body.id), "返却が指定IDに一致（無関係レコードでない）").toBe(String(KNOWN_DETAIL_ID));
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-014 想定外のクエリ項目を加えてもサーバエラーで停止しない（要実機確認: 無視可否未定・エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      // 判定はサーバエラー(5xx)で停止しないことのみ（無視可否=200/同一内容は要実機確認）。
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID), { params: UNKNOWN_QUERY_PARAMS });
      expect(res.status(), "5xx で停止しない").toBeLessThan(500);
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-015 エラー発生時に仕様のエラー応答（404 Not Found）が返る（要実機確認: エンドポイント未実装／付帯表4#1,#3）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-NONE) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(NONE_DETAIL_ID));
      expect404(res.status());
      const body = (await res.json()) as CardDetailGetErrorBody;
      expect(typeof body.code, "code を持つ").toBe("number");
      expect(body.message, "message=Not Found（仕様由来）").toBe(NOT_FOUND_MESSAGE);
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-016 異常（該当なし）時のHTTPステータスが仕様の404と一致する（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-NONE) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(NONE_DETAIL_ID));
      expect404(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-017 正常通信で200応答が返る（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-018 対象条件に該当する正常値で200とカード詳細情報が返る（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as CardDetailGetSuccessBody;
      expect("id" in body, "正常取得でカード詳細情報が返る").toBeTruthy();
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-019 異常系（不正値）受信時に正しいカード詳細が取得されない（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(NON_NUMERIC_DETAIL_ID));
      expectNot200(res.status());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-020 同一GETの重複呼び出しで同一レスポンス（冪等参照）となる（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res1 = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      const res2 = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      // 参照系のため2回で同一のHTTPステータス・本文（副作用「無し（参照のみ）」）。
      expect(res1.status(), "2回の呼び出しで同一ステータス").toBe(res2.status());
      expect(await res1.text(), "2回の呼び出しで同一本文").toBe(await res2.text());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-040 関連オブジェクト（rarity/cardset/illustrator/promotion/cardLayout/cardImages）が応答に含まれる（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN 関連紐づき) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(RELATED_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      // cardLayout/rarity/cardset/illustrator/promotion は object（未設定時 null）・cardImages は array（未設定時 空配列）。
      for (const f of RELATED_OBJECT_FIELDS) {
        expect(
          typeof body[f] === "object" || body[f] === null,
          `${f} は object（未設定時 null）`
        ).toBeTruthy();
      }
      for (const f of RELATED_ARRAY_FIELDS) {
        expect(Array.isArray(body[f]), `${f} は array（未設定時 空配列）`).toBeTruthy();
      }
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-041 除外指定プロパティが応答に含まれない（要実機確認: エンドポイント未実装・除外設定の所在未確認／付帯表4#1,#5）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      // cardLayoutId/promotionId/card/productSubs が含まれないこと（混入は付帯表4#5で検出）。
      for (const f of EXCLUDED_FIELDS) {
        expect(f in body, `除外指定プロパティ ${f} が応答に含まれない`).toBeFalsy();
      }
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-042 参照のみで副作用が無い（再取得でカード詳細マスタ不変）（要実機確認: エンドポイント未実装／付帯表4#1）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const before = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      const after = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      // API前後で当該カード詳細マスタの値が不変（副作用「無し（参照のみ）」・データ整合性「更新しない」）。
      expect(await before.text(), "API前後で値が不変").toBe(await after.text());
      await ctx.dispose();
    }
  );

  test.fixme(
    "E2E-A14-02-043 プロパティがcamelCase・日時がISO8601で返る（要実機確認: エンドポイント未実装・日時書式未確認／付帯表4#1,#6）",
    async () => {
      test.skip(!HAS_API, "A14_02_READY(SEED-A14-02-DETAIL-KNOWN) 未設定");
      const ctx = await newCtx();
      const res = await ctx.get(buildCardDetailPath(KNOWN_DETAIL_ID));
      expect200(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      // updateDate/createDate は ISO8601 形式の文字列・プロパティは camelCase（日時書式は実機確認＝付帯表4#6）。
      const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(typeof body.updateDate === "string" && iso8601.test(body.updateDate as string), "updateDate は ISO8601 文字列").toBeTruthy();
      expect(typeof body.createDate === "string" && iso8601.test(body.createDate as string), "createDate は ISO8601 文字列").toBeTruthy();
      await ctx.dispose();
    }
  );
});
