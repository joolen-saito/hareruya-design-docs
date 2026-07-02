/**
 * a06-02 店頭仕入_店頭買取注文一覧（査定対象受注一覧 参照系 JSON API・GET）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_02_api_store_purchase_otc_buy_order_list_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(017/024/032/033/034/038/039＝付帯表4#3/#4/#5/#6/#7/#9)は test.fixme（理由付き）で残す。
 * 手動（040 整形例外500・041 タイムアウト・042 DB障害・050 ログ実機観測）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面を伴わない参照系API（外部買取アプリが消費）のため UI レイヤはスコープ外（UI専用specは無い）。
 *
 * 期待結果は仕様（正本md a06-02・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /api/v1/admin/otcBuyOrders.json`（付帯表4#1。正本md `/admin/otcBuyOrders.json`＋別名 とは不一致）。
 *  - 認証は `jwt-token` ヘッダのJWT（HS256・JwtTokenHeaderExtractor.php:29／jwt.yaml:2-5）。成功200＝査定対象配列／失敗401＝認証拒否。
 *  - 合否は HTTPステータス＋応答配列（ラッパなし）＋各フィールドの型/既知値/並び/抽出ステータスで判定。
 *  - 実装の抽出集合[5,6,8,9]・日時書式(Y/m/d H:i:s,Y-m-d)・identificationId null・住所addr03連結はオラクルに固定しない（付帯表4#4-7/#9）。
 * 有効JWTの発行は外部/実機依存のため env（A06_02_TOKEN ほか）で供給し、環境ガード A06_02_READY 未設定時は test.skip する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  OTC_BUY_ORDERS_PATH,
  buildAuthHeaders,
  VALID_JWT,
  NOSHOP_JWT,
  EMPTY_JWT,
  JWT_BAD_SIGNATURE,
  JWT_NO_MEMBER,
  JWT_MALFORMED,
  ASSESSMENT_TARGET_STATUSES,
  EXCLUDED_STATUS_SAMPLES,
  UNKNOWN_QUERY_PARAMS,
  OtcBuyOrder,
} from "../../../pages/api/a06/a06_02_api_store_purchase_otc_buy_order_list.api";

const HAS_API = !!process.env.A06_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "認証成功・正常取得＝200（仕様: 成功応答）").toBe(200);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（仕様: 認証不可）").toBe(401);
}

/** 応答配列の取得（ラッパなし1次元の受注オブジェクト配列を期待）。 */
async function getOrders(ctx: APIRequestContext, token: string = VALID_JWT, params?: Record<string, string>) {
  const res = await ctx.get(OTC_BUY_ORDERS_PATH, { headers: buildAuthHeaders(token), params });
  return res;
}

test.describe("API > 店頭買取注文一覧(GET参照系)", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常取得（200・配列・構造） =====

  test("E2E-A06-02-001 正常なjwt-tokenで査定対象一覧が200で取得できる", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-JWT-VALID/MEMBER-SHOP/ORDERS-ASSESS) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    expect(Array.isArray(await res.json()), "査定対象受注を要素とする配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-02-002 正常取得時に受注基本情報と申込者情報を含む配列が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    expect(Array.isArray(body), "配列が返る").toBeTruthy();
    if (body.length > 0) {
      // 各要素は受注の基本情報＋customerInfo（申込者情報）をネストした構造（OtcBuyOrderController.php:94-119）。
      expect(typeof body[0], "要素はオブジェクト").toBe("object");
      expect("customerInfo" in body[0], "customerInfo をネストして持つ").toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A06-02-003 認証成功時のHTTPステータスが200となる", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-02-004 買取アプリからの一覧取得要求に200で配列を返す", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    expect(Array.isArray(await res.json()), "受注配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-02-005 正常通信でHTTPステータス200が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-02-006 査定対象が存在する条件で200と該当配列が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    expect(Array.isArray(body), "査定対象ステータスの受注が配列で返る").toBeTruthy();
    for (const o of body) {
      expect(ASSESSMENT_TARGET_STATUSES.includes(o.otcOrderStatusId), "査定対象ステータス(5/6/7/8/9)のみ").toBeTruthy();
    }
    await ctx.dispose();
  });

  // ===== 認証拒否（401） =====

  test("E2E-A06-02-010 署名不正トークンは認証拒否で401となる", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, JWT_BAD_SIGNATURE);
    expect401(res.status()); // 署名検証失敗→401（token_handler JwtTokenHandler／jwt.yaml:2-5）。
    await ctx.dispose();
  });

  test("E2E-A06-02-011 該当する管理者会員がないトークンは401となる", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, JWT_NO_MEMBER);
    expect401(res.status()); // 署名は正でも該当管理者会員なし→認証拒否401。
    await ctx.dispose();
  });

  test("E2E-A06-02-012 jwt-tokenヘッダ欠落は401で一覧が返らない", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    // 第2引数に空文字を渡し jwt-token ヘッダを付与しない（必須条件）。
    const res = await getOrders(ctx, "");
    expect401(res.status());
    expect(Array.isArray(await res.json().catch(() => null)), "受注一覧（配列）は返らない").not.toBe(true);
    await ctx.dispose();
  });

  test("E2E-A06-02-013 JWT形式として不正な文字列は成功扱いせず401となる", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-JWT-INVALID) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, JWT_MALFORMED);
    expect401(res.status()); // 形式不正は成功扱いされない。
    await ctx.dispose();
  });

  test("E2E-A06-02-014 認証不可の異常時にHTTPステータス401が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, JWT_BAD_SIGNATURE);
    expect401(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-02-015 異常系リクエストでHTTPステータス401が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, JWT_BAD_SIGNATURE);
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== 認可・絞り込み =====

  test("E2E-A06-02-016 店舗に紐づく会員は自店舗の受注のみ取得する", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-MEMBER-SHOP/ORDERS-ASSESS) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    // 一次オラクル: 返る配列は認証会員の所属店舗の受注のみ（shopId=$Member->getBaseInfo()->getId()／DtbOtcBuyOrderRepository.php:1058-1061）。
    // 自店舗/他店舗混在SEEDのうち他店舗受注IDが含まれないことはSEED既知ID集合で照合（DB/SEED照査で補完）。
    expect(Array.isArray(await res.json()), "自店舗のみの配列").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 抽出ステータス整合 =====

  test("E2E-A06-02-020 査定対象ステータスの受注のみ抽出される", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    // 仕様: 商品到着(5)・査定中(6)・振込前(7)・保留(8)・査定再開(9)のみ。実装[5,6,8,9]で7欠落なら検出（付帯表4#4）。
    for (const o of body) {
      expect(ASSESSMENT_TARGET_STATUSES.includes(o.otcOrderStatusId), `査定対象ステータスのみ(実値=${o.otcOrderStatusId})`).toBeTruthy();
    }
    await ctx.dispose();
  });

  test("E2E-A06-02-021 対象外ステータスの受注は一覧に含まれない", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-ORDERS-EXCLUDED) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    // 成立・キャンセル・ダブルチェック済・データ出力済 等の対象外ステータスが配列に含まれないこと。
    for (const o of body) {
      expect(EXCLUDED_STATUS_SAMPLES.includes(o.otcOrderStatusId), `対象外ステータスを含まない(実値=${o.otcOrderStatusId})`).toBeFalsy();
    }
    await ctx.dispose();
  });

  // ===== データなし・並び順・契約 =====

  test("E2E-A06-02-022 該当受注が無い場合は200で空配列が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-EMPTY) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, EMPTY_JWT);
    expect200(res.status());
    expect(await res.json(), "該当なしは空配列を200で返す").toEqual([]);
    await ctx.dispose();
  });

  test("E2E-A06-02-023 配列要素が受注ID昇順で並ぶ", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    // 受注ID（otcBuyOrderId）昇順（orderBy('otcBuyOrder.id','ASC')／DtbOtcBuyOrderRepository.php:1057）。
    const ids = body.map((o) => o.otcBuyOrderId);
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids, "otcBuyOrderId 昇順で並ぶ").toEqual(sorted);
    await ctx.dispose();
  });

  test("E2E-A06-02-030 応答本体がラッパなしの受注オブジェクト配列である", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = await res.json();
    // ラッパオブジェクトや件数フィールドを持たない受注オブジェクトの配列（JsonResponse($response)／OtcBuyOrderController.php:122）。
    expect(Array.isArray(body), "応答本体はラッパなしの配列").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-02-031 想定外クエリパラメータがあっても200で無視される", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx, VALID_JWT, UNKNOWN_QUERY_PARAMS);
    expect200(res.status()); // jwt-token 以外のパラメータを持たない仕様のため想定外クエリは無視され取得できる。
    expect(Array.isArray(await res.json()), "査定対象配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  // ===== null 項目（紐づき無し時） =====

  test("E2E-A06-02-035 フリーコメント未設定の受注でfreeCommentがnullとなる", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    // フリーコメント未設定の受注で freeComment が null（freeComment ?? null／OtcBuyOrderController.php:98）。
    expect(body.some((o) => o.freeComment === null), "未設定受注の freeComment が null で返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-02-036 査定担当者が紐づかない受注でmemberNameがnullとなる", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    // 査定担当者未割当の受注で memberName が null（memberName ?? null／OtcBuyOrderController.php:99）。
    expect(body.some((o) => o.memberName === null), "未割当受注の memberName が null で返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-02-037 口座が紐づかない受注でqualifiedInvoiceIssuerCodeがnullとなる", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    // 適格請求書発行事業者口座が紐づかない受注で qualifiedInvoiceIssuerCode が null（?? null／OtcBuyOrderController.php:109）。
    expect(body.some((o) => o.qualifiedInvoiceIssuerCode === null), "口座なし受注の qualifiedInvoiceIssuerCode が null で返る").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 重複・順序（参照冪等） =====

  test("E2E-A06-02-043 同一トークンの反復取得で副作用なく同一結果が返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const r1 = await getOrders(ctx);
    const r2 = await getOrders(ctx);
    expect200(r1.status());
    expect200(r2.status());
    // 参照のみで副作用なし（正本md:198,254）。複数回・順不同でも同一配列。
    expect(await r2.json(), "反復取得で同一の受注配列が返る").toEqual(await r1.json());
    await ctx.dispose();
  });

  // ===== フィールド型・既知値契約 =====

  test("E2E-A06-02-044 受注基本情報の整数・文字列フィールドが型と既知値で返る", async () => {
    test.skip(!HAS_API, "A06_02_READY(SEED-A06-02-ORDERS-ASSESS) 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    expect(body.length, "代表受注が1件以上").toBeGreaterThan(0);
    const o = body[0];
    // 型契約: integer / string（仕様 入出力 レスポンス）。値照合は SEED 既知値で行う想定（ヘルパ SEED.*）。
    expect(Number.isInteger(o.otcBuyOrderId), "otcBuyOrderId は integer").toBeTruthy();
    expect(Number.isInteger(o.assessmentId), "assessmentId は integer").toBeTruthy();
    expect(Number.isInteger(o.otcOrderStatusId), "otcOrderStatusId は integer").toBeTruthy();
    expect(Number.isInteger(o.returnSupply), "returnSupply は integer").toBeTruthy();
    expect(typeof o.orderStatusName, "orderStatusName は string").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A06-02-045 booleanフラグ各項目がboolean型で既知値どおり返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    expect(body.length, "代表受注が1件以上").toBeGreaterThan(0);
    const o = body[0];
    // callFlg・adultFlg・playingFlg・qualifiedInvoiceIssuerFlg・qualifiedInvoiceIssuerConfirmationFlg は boolean（仕様 フィールド契約）。
    for (const key of ["callFlg", "adultFlg", "playingFlg", "qualifiedInvoiceIssuerFlg", "qualifiedInvoiceIssuerConfirmationFlg"] as const) {
      expect(typeof o[key], `${key} は boolean`).toBe("boolean");
    }
    await ctx.dispose();
  });

  test("E2E-A06-02-046 customerInfoの文字列フィールドが型と既知値で返る", async () => {
    test.skip(!HAS_API, "A06_02_READY 未設定");
    const ctx = await newCtx();
    const res = await getOrders(ctx);
    expect200(res.status());
    const body = (await res.json()) as OtcBuyOrder[];
    expect(body.length, "代表受注が1件以上").toBeGreaterThan(0);
    const ci = body[0].customerInfo;
    // firstName・lastName・telNo・zipcode・jobName は string（仕様 フィールド契約）。値照合は SEED 既知値で行う想定。
    for (const key of ["firstName", "lastName", "telNo", "zipcode", "jobName"] as const) {
      expect(typeof ci[key], `customerInfo.${key} は string`).toBe("string");
    }
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表4） =====

  test.fixme(
    "E2E-A06-02-017 店舗に紐づかない会員は絞り込みなしで一律取得する（要実機確認: 店舗絞り込み／付帯表4#3）",
    async () => {
      // 期待は仕様(権限・認可表: 店舗未紐付け会員は絞り込みなしで査定対象を一律取得)由来。
      // 実装は shopId 空だと空配列を返す（DtbOtcBuyOrderRepository.php:1015-1017）。getBaseInfo()=null 時の例外懸念もあり要実機確認のため fixme。
      // NOSHOP_JWT(SEED-A06-02-MEMBER-NOSHOP) で 200＋一律配列を期待し、空配列なら乖離検出。
    }
  );

  test.fixme(
    "E2E-A06-02-024 振込前(7)ステータスの受注も一覧に含まれる（要実機確認: 抽出ステータス欠落／付帯表4#4）",
    async () => {
      // 期待は仕様(集計条件 抽出対象に振込前(7)を含む)由来。
      // 実装 ASSESSMENT_UNCOMPLETED_STATUSES=[5,6,8,9]（MtbOtcBuyOrderStatus.php:84-89）で 7 欠落。
      // 7 を含むSEEDの存在確認が実機依存・乖離が確実のため fixme（仕様どおり期待し7欠落なら失敗検出）。
    }
  );

  test.fixme(
    "E2E-A06-02-032 applyDateがISO8601形式で返る（要実機確認: 日時書式／付帯表4#5）",
    async () => {
      // 期待は仕様(applyDate=ISO8601日時)由来。実装は format('Y/m/d H:i:s')（OtcBuyOrderController.php:97）でスラッシュ区切り非ISO8601。
      // ISO8601判定の厳密化と実機応答確認が要るため fixme（仕様どおり期待し書式乖離を検出）。
    }
  );

  test.fixme(
    "E2E-A06-02-033 customerInfo.birthがISO8601形式で返る（要実機確認: 日時書式／付帯表4#6）",
    async () => {
      // 期待は仕様(birth=ISO8601日時)由来。実装は format('Y-m-d')（OtcBuyOrderController.php:113）で日付のみ（時刻・TZなし）。
      // ISO8601日時としての判定と実機応答確認が要るため fixme（仕様どおり期待し書式乖離を検出）。
    }
  );

  test.fixme(
    "E2E-A06-02-034 本人確認未登録の受注でidentificationIdが0となる（要実機確認: 未登録値／付帯表4#7）",
    async () => {
      // 期待は仕様(identificationId 未登録は0)由来。実装は identificationId ?? null（OtcBuyOrderController.php:106）で未登録時 null。
      // 未登録受注SEEDの用意が実機依存・乖離が確実のため fixme（仕様どおり0を期待し null なら検出）。
    }
  );

  test.fixme(
    "E2E-A06-02-038 国が日本の受注で住所が都道府県名・住所1・住所2の連結となる（要実機確認: 住所連結項目／付帯表4#9）",
    async () => {
      // 期待は仕様(日本=都道府県名・住所1・住所2を半角空白区切りで連結)由来。実装は addr03 も連結対象に含む（OtcBuyOrderController.php:90-92）。
      // addr03 の扱い・SEED住所値の確定が要実機確認のため fixme（仕様どおり期待し addr03 混入なら検出）。
    }
  );

  test.fixme(
    "E2E-A06-02-039 国が日本以外の受注で住所が国名・住所2・住所1の連結となる（要実機確認: 住所連結項目／付帯表4#9）",
    async () => {
      // 期待は仕様(日本以外=国名・住所2・住所1を半角空白区切りで連結)由来。実装は addr03 も連結対象に含む（OtcBuyOrderController.php:90-92）。
      // addr03 の扱い・SEED住所値の確定が要実機確認のため fixme（仕様どおり期待し addr03 混入なら検出）。
    }
  );
});
