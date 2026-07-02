/**
 * a06-11 店頭仕入_部門一覧取得（公開対象の部門一覧JSONを返すパラメータなし参照系GET API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_11_api_store_purchase_section_list_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specに残すのは「E2E自動化(API/統合)」（実装）と「要実機確認」修飾＝test.fixme（理由付き）のみ。
 * 手動（030 タイムアウト・031 DB障害実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能はブラウザ向け画面を持たず（正本md）UIレイヤ=0のため admin spec は無い。
 *
 * 期待結果は設計書(a06-11)由来（オラクル独立性）:
 *  - 送信先は実装の実効パス `GET /api/v1/admin/sections.json`（SectionController.php:35／eccube.yaml:6,55。設計現行 `/section.json` と差異＝付帯表4#1）。
 *  - 合否はHTTPステータスで判定（正常一覧=200／0件でも空一覧200）。並び順=部門コード昇順（findBy code ASC）。
 *  - 実装の応答ラッパ・命名（部門配列を直接返す）はオラクルにしない（付帯表4#3/#4）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_11_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  SECTIONS_PATH,
  buildAuthHeaders,
  UNEXPECTED_QUERY,
} from "../../../pages/api/a06/a06_11_api_store_purchase_section_list.api";

const HAS_API = !!process.env.A06_11_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}
async function getSections(ctx: APIRequestContext, params?: Record<string, string>) {
  return ctx.get(SECTIONS_PATH, { headers: buildAuthHeaders(), params });
}
function expect200(status: number) {
  expect(status, "正常一覧/0件いずれも 200（設計: 公開対象取得→200・0件は空一覧）").toBe(200);
}

test.describe("API > 店頭仕入_部門一覧取得", { tag: ["@api", "@a06", "@section"] }, () => {
  // ===== 正常取得（E2E自動化(API/統合)） =====

  test("E2E-A06-11-001 公開対象の部門一覧を正常取得しHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY(SEED-A06-11-SECTION/API-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-11-002 取得値を再計算せず取得時点の値で200応答される", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // 業務値の再計算なし（array_map で整形のみ）。値整合はSEED既知値とのDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-11-003 正常取得時のHTTPステータスが仕様の成功応答(200)と一致する", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-11-004 部門マスタから公開対象を取得し200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // mtbSectionRepository->findBy（SectionController.php:38）。
    await ctx.dispose();
  });

  test("E2E-A06-11-005 visible=trueの公開対象のみが取得され200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY(SEED 公開/非公開混在) 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // 非公開(visible=false)は除外。除外整合はSEEDとのDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-11-006 成功応答に仕様のフィールド構成が含まれHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // section_id/name/code。応答ラッパ・命名の実装差異は付帯表4#3/#4。
    await ctx.dispose();
  });

  test("E2E-A06-11-010 公開部門0件でもエラーとせず空一覧でHTTP200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY(SEED 公開部門0件) 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // 0件→空の一覧（失敗ステータスを返さない）。
    await ctx.dispose();
  });

  test("E2E-A06-11-015 正常取得のHTTPステータスが200で返る", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-11-016 正常通信での取得応答がHTTP200で返る", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-11-017 対象条件に該当する正常取得で200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-11-018 参照系GETで副作用なく200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // 副作用「無し（参照のみ）」。DB不変はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-11-040 一覧が部門コード昇順で取得され200が返る", async () => {
    test.skip(!HAS_API, "A06_11_READY(SEED 複数部門) 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // findBy(..., ['code'=>'ASC'])。並び順整合は応答配列のDB照査で補完（移行先並び順は付帯表4#5）。
    await ctx.dispose();
  });

  test("E2E-A06-11-041 参照系のため呼び出してもDB副作用が発生しない", async () => {
    test.skip(!HAS_API, "A06_11_READY 未設定");
    const ctx = await newCtx();
    const res = await getSections(ctx);
    expect200(res.status()); // 本APIはデータを更新しない（参照系）。DB不変はDB照査で補完。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A06-11-007 想定外クエリを加えても処理が継続しHTTP200となる（要実機確認: 想定外パラメータ挙動／付帯表4）",
    async () => {
      // 期待は入出力(パラメータを持たない)由来。想定外クエリで200固定は正本に明記が無く要実機確認のため fixme。
      void UNEXPECTED_QUERY;
    }
  );

  test.fixme(
    "E2E-A06-11-008 無効/欠落した資格情報では許可されず正常取得200を返さない（要実機確認: 認可方式／付帯表4#2）",
    async () => {
      // 期待は観点表(資格情報＝前提が欠落/不正なら正常取得を返さない)由来。
      // 実装は IsGranted('IS_AUTHENTICATED_FULLY')（SectionController.php:25）だが、認可方式の実体と拒否時の具体ステータスが
      // 設計書から確定できず要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-11-009 認証済クライアントから呼び出し可能であることを確認する（要実機確認: 認可方式／付帯表4#2）",
    async () => {
      // 期待は権限・認可(MTGバイヤーから呼び出す)由来（正常側補助）。認可方式の実体が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A06-11-020 認可されないアクセスは正常取得200とならない（要実機確認: 認可方式／付帯表4#2）",
    async () => {
      // 期待は権限・認可(認可されないアクセスは正常取得200とならない)由来。拒否時の具体ステータスが認可方式未確定で要実機確認のため fixme。
    }
  );
});
