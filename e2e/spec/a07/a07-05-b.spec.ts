/**
 * A07-05 ネット買取注文の査定終了処理（MTGバイヤーの API の PUT /api/admin/buyOrder/{受注ID}.json）の追加ケース。
 * 正本: cases/A07-05_test_cases.tsv。書いたケース: 022・023・024・033・034・035・047・048・050（DB で結果を確かめるもの）。
 * 書いていないケース: 021・044・045（商品規格のFoil区分を E2E で指定できない）、025〜028・036〜039・042・043・058〜068（既存の明細・申込時買取価格・実在庫・個別入力商品を
 * 番号を指定して置く準備が大きい）、040（現行の買取の表に税額・ポイントの項目が無い）、053〜057（MTGバイヤーの画面の連携）。
 *
 * 手順の送り方は spec/a07/a07-05.spec.ts と同じ（本文を付けず、order_status と order_details をアドレスのクエリに付けて PUT。
 * 開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送る）。クエリを読まない場合は ECCUBE_HARERUYA-4371 に寄る。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く } from "../../pages/admin/a07_api";
import { A0705管理者 } from "../../seeds/a07-05";
import { 明細を読む } from "../../db/a07_06";
import { 個別入力商品を読む } from "../../db/a07_07";
import { 受注を読む, 履歴を読む } from "../../db/a07_05b";
import "../../seeds/a07-05-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータスと本文を読んだ（エビデンスの画面には応答を表で出した）";
const L = (ctx: CaseCtx, ラベル: string, n: string) => ctx.notes.get(`〔${ラベル}-A0705-${n}〕`);
type 明細 = Record<string, string | number>;

function クエリ(order_status: number, 明細: 明細[]): string {
  const p = new URLSearchParams();
  p.append("order_status", String(order_status));
  明細.forEach((d, i) => { for (const [k, v] of Object.entries(d)) p.append(`order_details[${i}][${k}]`, String(v)); });
  return p.toString();
}

type 場 = { 番号: string; 受注: string; 規格: string; 商品: string; 管理者: string };
type 定め<B> = {
  order_status: number;
  明細: (c: 場, 前: B) => 明細[];
  /** 送る前の DB の値 */
  前: (c: 場) => B;
  /** 送ったあとの DB の値を画面に出す表 */
  後を出す: (c: 場, 前: B) => unknown;
  期待: (c: 場, 前: B, r: 応答) => void;
};

function 流す<B>(番号: string, d: 定め<B>) {
  return async (ctx: CaseCtx): Promise<void> => {
    const c: 場 = { 番号, 受注: L(ctx, "受注ID", 番号), 規格: ctx.notes.get(`〔商品規格ID-A0705-${番号}〕`), 商品: ctx.notes.get(`〔商品ID-A0705-${番号}〕`), 管理者: ctx.notes.get("〔管理者会員ID-A0705-共有〕") };
    const 前 = d.前(c);
    let r!: 応答; let 表: unknown = null;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    await ctx.step(2, async () => {
      supplement("試験管理者の有効な認証トークンは、試験管理者のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「HS256で署名したトークン」の読み替え。値は記録しない）");
      const token = await 管理者のトークン(A0705管理者.account.loginId, A0705管理者.account.password);
      const q = クエリ(d.order_status, d.明細(c, 前));
      note(`本文を付けず、クエリ ${decodeURIComponent(q)} を付けて PUT した`);
      r = await 送る(ctx.page, "PUT", `/api/admin/buyOrder/${c.受注}.json?${q}`, { トークン: token });
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`);
    });
    await ctx.step(3, async () => {
      表 = d.後を出す(c, 前);
      note(`DB を確認した: ${JSON.stringify(表).slice(0, 600)}`);
      await 応答を画面に出す(ctx.page, `受注 ${c.受注} の DB の確認`, r, 表);
    });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, `HTTP ステータス（応答 ${r.本文.slice(0, 120)}）`).toBeLessThan(300);
      d.期待(c, 前, r);
    });
  };
}
const 商品の明細 = (c: 場) => 明細を読む(c.受注).filter((m) => m.商品ID === c.商品);

caseTest("IT-A07-05-022", 流す("022", {
  order_status: 1,
  前: (c) => 商品の明細(c),
  明細: (c, 前) => {
    const 既 = 前[0];
    supplement("既存の明細と同じ条件で更新される確かめにするため、既存の明細の言語・状態・Foil区分（DB の値）を同じ値で送った（シード表の言語ID 1・状態ID 1・Foil区分ID 0 を、申込みで決まった明細の値に読み替え）");
    return [{ product_class_id: c.規格, name: "A07-05既存明細更新", quantity: 3, price: 1200, ...(既.言語ID ? { language_id: 既.言語ID } : {}), ...(既.状態ID ? { condition_id: 既.状態ID } : {}), ...(既.フォイル ? { foil_flg: 既.フォイル } : {}) }];
  },
  後を出す: (c) => 商品の明細(c),
  期待: (c) => {
    const rows = 商品の明細(c);
    expect.soft(rows.length, "同一条件の買取注文詳細が重複して登録されず1件のまま").toBe(1);
    expect.soft(rows[0]?.枚数, "既存の買取注文詳細の数量が 3 に更新された").toBe("3");
    expect.soft(rows[0]?.査定金額, "既存の買取注文詳細の価格が 1200 に更新された").toBe("1200");
  },
}));

caseTest("IT-A07-05-023", 流す("023", {
  order_status: 1,
  前: (c) => 商品の明細(c).length,
  明細: (c) => [{ product_class_id: c.規格, name: "新規カード商品", quantity: 2, price: 900 }],
  後を出す: (c) => 商品の明細(c),
  期待: (c, 前) => {
    expect.soft(前, "送る前は、受注内の当該商品規格の買取注文詳細が0件").toBe(0);
    const rows = 商品の明細(c);
    expect.soft(rows.length, "当該商品規格の買取注文詳細が1件登録された").toBe(1);
    expect.soft(rows[0]?.枚数, "数量が 2").toBe("2");
    expect.soft(rows[0]?.査定金額, "価格が 900").toBe("900");
  },
}));

caseTest("IT-A07-05-024", 流す("024", {
  order_status: 1,
  前: (c) => 個別入力商品を読む(c.受注).filter((x) => x.名前 === "新規個別商品").length,
  明細: () => [{ name: "新規個別商品", quantity: 2, price: 700 }],
  後を出す: (c) => 個別入力商品を読む(c.受注),
  期待: (c, 前) => {
    expect.soft(前, "送る前は、名称「新規個別商品」の個別入力商品が0件").toBe(0);
    const rows = 個別入力商品を読む(c.受注).filter((x) => x.名前 === "新規個別商品");
    expect.soft(rows.length, "名称「新規個別商品」の個別入力商品が1件登録された").toBe(1);
    expect.soft(rows[0]?.枚数, "数量が 2").toBe("2");
    expect.soft(rows[0]?.金額, "価格が 700").toBe("700");
  },
}));

caseTest("IT-A07-05-033", 流す("033", {
  order_status: 2,
  前: (c) => 受注を読む(c.受注),
  明細: () => [{ name: "A07-05-033個別", quantity: 1, price: 2000 }],
  後を出す: (c) => 受注を読む(c.受注),
  期待: (c, 前) => {
    const 後 = 受注を読む(c.受注);
    expect.soft(後?.状況ID, "ステータスが 2").toBe("2");
    expect.soft(後?.合計金額, "合計金額が 2000").toBe("2000");
    expect.soft(後?.担当ID, "更新者が試験管理者の管理者会員ID").toBe(c.管理者);
    expect.soft((後?.更新日時 ?? "") > (前?.更新日時 ?? "9"), `更新日が送信前（${前?.更新日時}）から更新された（${後?.更新日時}）`).toBe(true);
  },
}));

caseTest("IT-A07-05-034", 流す("034", {
  order_status: 2,
  前: (c) => 履歴を読む(c.受注),
  明細: (c) => [{ product_class_id: c.規格, name: "A07-05-034明細", quantity: 1, price: 1000 }],
  後を出す: (c) => 履歴を読む(c.受注),
  期待: (c, 前) => {
    const 後 = 履歴を読む(c.受注);
    expect.soft(後.length, `ステータス履歴が1件追加された（送る前 ${前.length} 件）`).toBe(前.length + 1);
    const 新 = 後.filter((h) => !前.some((x) => x.ID === h.ID));
    expect.soft(新[0]?.状況ID, "追加された履歴のステータスIDが 2").toBe("2");
    expect.soft(新[0]?.担当ID, "追加された履歴の更新担当者が試験管理者の管理者会員ID").toBe(c.管理者);
  },
}));

caseTest("IT-A07-05-035", 流す("035", {
  order_status: 1,
  前: (c) => 履歴を読む(c.受注),
  明細: (c) => [{ product_class_id: c.規格, name: "A07-05-035明細", quantity: 1, price: 1000 }],
  後を出す: (c) => 履歴を読む(c.受注),
  期待: (c, 前) => {
    expect.soft(前.length, "送る前のステータス履歴は申込時の1件").toBe(1);
    expect.soft(履歴を読む(c.受注).length, "ステータス履歴が1件のまま増加しない").toBe(1);
  },
}));

caseTest("IT-A07-05-047", 流す("047", {
  order_status: 1,
  前: (c) => 商品の明細(c).length,
  明細: (c) => [{ product_class_id: c.規格, name: "A0705-047-CARD", quantity: 1, price: 1000, language_id: 1, condition_id: 1, purchase_category: 0 }],
  後を出す: (c) => 商品の明細(c),
  期待: (c) => {
    const rows = 商品の明細(c);
    expect.soft(rows.length, "買取注文詳細が1件登録された").toBe(1);
    expect.soft(rows[0]?.買取カテゴリ, "買取カテゴリが整数 0").toBe("0");
  },
}));
caseTest("IT-A07-05-048", 流す("048", {
  order_status: 1,
  前: (c) => 商品の明細(c).length,
  明細: (c) => [{ product_class_id: c.規格, name: "A0705-048-CARD", quantity: 1, price: 1000, language_id: 1, condition_id: 1, purchase_category: 1 }],
  後を出す: (c) => 商品の明細(c),
  期待: (c) => {
    const rows = 商品の明細(c);
    expect.soft(rows.length, "買取注文詳細が1件登録された").toBe(1);
    expect.soft(rows[0]?.買取カテゴリ, "買取カテゴリが整数 1").toBe("1");
  },
}));

caseTest("IT-A07-05-050", 流す("050", {
  order_status: 1,
  前: (c) => 商品の明細(c).length,
  明細: (c) => [{ product_class_id: c.規格, name: "A0705-050カード", quantity: 1, price: 900, language_id: 1, foil_flg: 0, condition_id: 1 }],
  後を出す: (c) => 商品の明細(c),
  期待: (c, 前) => {
    expect.soft(前, "送る前は、同一商品の買取注文詳細が0件").toBe(0);
    const rows = 商品の明細(c);
    expect.soft(rows.length, "買取注文詳細が登録された").toBeGreaterThan(0);
    expect.soft(rows.flatMap((m) => m.申込時).length, "登録された買取注文詳細に、引き継がれた申込時買取価格が0件").toBe(0);
  },
}));
