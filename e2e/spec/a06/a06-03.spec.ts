/**
 * A06-03 店頭買取受注詳細更新（MTGBuyer の API の PUT /api/admin/otcBuyOrder/{受注ID}.json）。正本: cases/A06-03_test_cases.tsv
 * 書いたケース: 005・007・008・026・027・029・031・041・043・057・065〜071。
 * 書いていないケース: 058〜062（経理チームメールアドレス＝全員が使う共有の設定を書き換える。判断待ち）ほか、実施不可にしたもの（記録 review/af_questions_kochi.md）。
 *
 * 「ブラウザの開発者ツールから要求を送る」「Network で確かめる」は、テストのブラウザから API サーバーへ要求を送り、応答をページに出して読む形にした
 * （pages/admin/a06_mtgbuyer_api.ts）。有効なトークンは、事前準備の「有効なjwt-tokenを発行する」のとおり、管理者のログイン API で受け取る。
 */
import { 査定IDの受注ID } from "../../db/a06";
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 送る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0603_ADM } from "../../seeds/a06-03";
import { 受注の全体を読む, 注文詳細を読む, 個別入力を読む, 実在庫を読む, 実在庫履歴を読む, 履歴を読む } from "../../db/a06_03";
import "../../seeds/a06-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const L = (ctx: CaseCtx, ラベル: string, n: string) => ctx.notes.get(`〔${ラベル}-A0603-${n}〕`);

async function 有効なトークン(page: Page): Promise<string> {
  supplement("管理者の名前・ログインIDは、実行をまたいで使い回す決まった印つきの値で作り、ケースの値もその値として読んだ。有効なトークンは、手順1の前に管理者のログイン API へ管理者のログインID・パスワードを送って受け取った（値は記録しない）");
  return トークンを受け取る(page, A0603_ADM.loginId, A0603_ADM.password);
}

type 明細 = Record<string, string | number>;
const 規格の明細 = (規格: string, name: string, quantity: number, price: number, sell_price: number, section_id: string): 明細 => ({ product_class_id: Number(規格), name, quantity, price, sell_price, section_id: Number(section_id) });
const 本文 = (order_status: number, smaregi: number | null, order_details: 明細[], flg: string | boolean = "true") => ({ order_status, qualified_invoice_issuer_confirmation_flg: flg, smaregi_transaction_id: smaregi, order_details });

type 場 = { 番号: string; 受注: string; 規格: string; 商品コード: string; 部門: string };
const 場を作る = (ctx: CaseCtx, 番号: string): 場 => ({ 番号, 受注: (ctx.notes.has(`〔受注ID-A0603-${番号}〕`) ? L(ctx, "受注ID", 番号) : ctx.notes.has(`〔査定ID-A0603-${番号}〕`) ? 査定IDの受注ID(L(ctx, "査定ID", 番号)) ?? "" : ""), 規格: ctx.notes.has(`〔商品規格ID-A0603-${番号}〕`) ? L(ctx, "商品規格ID", 番号) : "", 商品コード: `A0603-${番号}`, 部門: ctx.notes.get("〔部門ID-A0603-共有〕") });

type 送る定め = { 受注ID?: (c: 場) => string; トークン: "有効" | "なし" | "不正"; 本文: (c: 場) => unknown };
/** 手順1: API へ PUT を送る。手順2: 応答（DB を見るケースでは DB）を確かめる */
function 流す<B>(番号: string, d: 送る定め & { 前?: (c: 場) => B; 後を出す?: (c: 場, 前: B | undefined) => unknown; 期待: (c: 場, 前: B | undefined, r: 応答) => void }) {
  return async (ctx: CaseCtx): Promise<void> => {
    const c = 場を作る(ctx, 番号);
    const 前 = d.前?.(c);
    let r!: 応答;
    await ctx.step(1, async () => {
      const token = d.トークン === "有効" ? await 有効なトークン(ctx.page) : d.トークン === "不正" ? "invalid.jwt.token" : undefined;
      const id = d.受注ID ? d.受注ID(c) : c.受注;
      r = await 送る(ctx.page, "店頭買取受注詳細更新 API", { 方式: "PUT", パス: `/api/admin/otcBuyOrder/${id}.json`, json: d.本文(c), トークン: token });
    });
    await ctx.step(2, async () => {
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`);
      if (d.後を出す) {
        const 表 = d.後を出す(c, 前);
        note(`DB を確認した: ${JSON.stringify(表).slice(0, 700)}`);
      }
    });
    await ctx.expected(async () => { expect(r, "API の応答を受け取った（以下の確かめの前提）").toBeTruthy(); d.期待(c, 前, r); });
  };
}
const 本文が空 = (r: 応答) => expect.soft(r.本文, "応答の本文が空").toBe("");
const 全体 = (c: 場) => ({ 受注: 受注の全体を読む(c.受注), 注文詳細: 注文詳細を読む(c.受注), 個別: 個別入力を読む(c.受注), 実在庫: 実在庫を読む(c.受注), 実在庫履歴: 実在庫履歴を読む(c.受注), 履歴: 履歴を読む(c.受注) });
const 規格の実在庫 = (c: 場) => 実在庫を読む(c.受注).filter((x) => x.規格ID === c.規格);
const 規格の実在庫履歴 = (c: 場) => 実在庫履歴を読む(c.受注).filter((x) => x.規格ID === c.規格);

caseTest("IT-A06-03-005", 流す("005", {
  トークン: "有効",
  本文: (c) => 本文(1, 6039001, [規格の明細(c.規格, "登録済商品", 2, 500, 700, c.部門)]),
  前: (c) => 個別入力を読む(c.受注).length,
  後を出す: (c) => 全体(c),
  期待: (c, 前, r) => {
    expect.soft(前, "送る前は個別入力商品が0件").toBe(0);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(受注の全体を読む(c.受注)?.ステータスID, "個別入力商品が0件の査定のステータスが入庫待ち（13）になった").toBe("13");
  },
}));
caseTest("IT-A06-03-007", 流す("007", {
  トークン: "有効",
  本文: (c) => 本文(1, 6039001, [規格の明細(c.規格, "端末取引商品", 1, 1000, 1200, c.部門)]),
  後を出す: (c) => 全体(c),
  期待: (c) => { expect.soft(受注の全体を読む(c.受注)?.端末取引ID, "端末取引IDに 6039001 が保存された").toBe("6039001"); },
}));
caseTest("IT-A06-03-008", 流す("008", {
  トークン: "有効",
  本文: (c) => 本文(2, null, [規格の明細(c.規格, "キャンセル商品", 1, 100, 200, c.部門)], "false"),
  後を出す: (c) => 全体(c),
  期待: (c) => { expect.soft(受注の全体を読む(c.受注)?.ステータスID, "ステータスが買取キャンセル（2）になった").toBe("2"); },
}));
caseTest("IT-A06-03-026", 流す("026", {
  トークン: "なし",
  本文: (c) => 本文(10, null, [規格の明細(c.規格, "認証商品A", 1, 100, 200, c.部門)]),
  期待: (_c, _b, r) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); 本文が空(r); },
}));
caseTest("IT-A06-03-027", 流す("027", {
  トークン: "不正",
  本文: (c) => 本文(10, null, [規格の明細(c.規格, "認証商品B", 1, 100, 200, c.部門)]),
  期待: (_c, _b, r) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); 本文が空(r); },
}));
caseTest("IT-A06-03-029", 流す("029", {
  トークン: "有効", 受注ID: () => "699999029",
  本文: (c) => 本文(10, null, [規格の明細(c.規格, "不存在受注商品", 1, 100, 200, c.部門)]),
  期待: (_c, _b, r) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(404); 本文が空(r); },
}));
caseTest("IT-A06-03-031", 流す("031", {
  トークン: "有効",
  本文: (c) => 本文(699999031, null, [規格の明細(c.規格, "状態不存在商品", 1, 100, 200, c.部門)]),
  期待: (_c, _b, r) => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(400);
    expect.soft(r.本文, "errors 配列に「MtbOtcBuyOrderStatusに699999031が見つかりません。」が含まれる").toContain("MtbOtcBuyOrderStatusに699999031が見つかりません。");
  },
}));
caseTest("IT-A06-03-041", 流す("041", {
  トークン: "有効",
  本文: (c) => 本文(10, null, [{ product_class_id: 699998041, name: "規格不存在商品", quantity: 1, price: 100, sell_price: 200, section_id: Number(c.部門) }]),
  期待: (_c, _b, r) => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(400);
    expect.soft(r.本文, "errors 配列に「商品規格IDが存在しません」が含まれる").toContain("商品規格IDが存在しません");
  },
}));
caseTest("IT-A06-03-043", 流す("043", {
  トークン: "有効",
  本文: (c) => 本文(699999043, null, [規格の明細(c.規格, "保存抑止商品", 1, 100, 200, c.部門)]),
  前: (c) => JSON.stringify(全体(c)),
  後を出す: (c) => 全体(c),
  期待: (c, 前, r) => {
    expect.soft(r.ステータス, "HTTP ステータス（入力検証で拒否される）").toBe(400);
    expect.soft(JSON.stringify(全体(c)), "更新前に存在した受注と関連レコードが削除・追加・更新されず、送る前のまま残る").toBe(前);
  },
}));
caseTest("IT-A06-03-057", 流す("057", {
  トークン: "有効",
  本文: (c) => 本文(10, null, [規格の明細(c.規格, "正常明細057", 1, 100, 200, c.部門), 規格の明細(c.規格, "", 1, 100, 200, c.部門)], true),
  前: (c) => JSON.stringify(全体(c)),
  後を出す: (c) => 全体(c),
  期待: (c, 前, r) => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(400);
    expect.soft(JSON.stringify(全体(c)), "1件目の正常明細を含め、更新前に存在した受注と関連レコードが削除・追加・更新されず、送る前のまま残る").toBe(前);
  },
}));

type 前の値 = { 履歴: number };
caseTest("IT-A06-03-065", 流す<前の値>("065", {
  トークン: "有効",
  本文: (c) => 本文(1, 6039065, [規格の明細(c.規格, "A0603CB065商品A", 2, 500, 600, c.部門), { name: "A0603CB065個別商品", quantity: 1, price: 300, sell_price: 400, section_id: Number(c.部門) }], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが未登録在庫あり（12）").toBe("12");
    expect.soft(o?.端末取引ID, "端末取引IDが 6039065").toBe("6039065");
    expect.soft(o?.成立日 !== null, "買取成立日が登録されて空でない").toBe(true);
    expect.soft(o?.合計金額, "合計金額が 1300").toBe("1300");
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数から1件増えた").toBe((前?.履歴 ?? 0) + 1);
    expect.soft(個別入力を読む(c.受注).length, "個別入力商品が1件登録された").toBe(1);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量2の1件").toEqual([2]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量2の1件").toEqual([2]);
  },
}));
caseTest("IT-A06-03-066", 流す<前の値>("066", {
  トークン: "有効",
  本文: (c) => 本文(1, 6039066, [規格の明細(c.規格, "A0603CB066商品A-1", 1, 400, 500, c.部門), 規格の明細(c.規格, "A0603CB066商品A-2", 2, 400, 500, c.部門)], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが入庫待ち（13）").toBe("13");
    expect.soft(o?.端末取引ID, "端末取引IDが 6039066").toBe("6039066");
    expect.soft(o?.成立日 !== null, "買取成立日が登録されて空でない").toBe(true);
    expect.soft(o?.合計金額, "合計金額が 1200").toBe("1200");
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数のまま増えない").toBe(前?.履歴);
    expect.soft(個別入力を読む(c.受注).length, "個別入力商品が0件").toBe(0);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量3の1件").toEqual([3]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量3の1件").toEqual([3]);
  },
}));
caseTest("IT-A06-03-067", 流す<前の値>("067", {
  トークン: "有効",
  本文: (c) => 本文(2, null, [規格の明細(c.規格, "A0603CB067商品A", 1, 100, 200, c.部門)], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが買取キャンセル（2）のまま").toBe("2");
    expect.soft(o?.キャンセル日 !== null, "買取キャンセル日が登録されて空でない").toBe(true);
    expect.soft(o?.合計金額, "合計金額が 100").toBe("100");
    expect.soft(o?.端末取引ID, "端末取引IDが空のまま").toBeNull();
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数のまま増えない").toBe(前?.履歴);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量1の1件").toEqual([1]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量1の1件").toEqual([1]);
  },
}));
caseTest("IT-A06-03-068", 流す<前の値>("068", {
  トークン: "有効",
  本文: (c) => 本文(2, null, [規格の明細(c.規格, "A0603CB068商品A-1", 2, 150, 250, c.部門), 規格の明細(c.規格, "A0603CB068商品A-2", 1, 150, 250, c.部門), { name: "A0603CB068個別商品", quantity: 1, price: 90, sell_price: 190, section_id: Number(c.部門) }], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが買取キャンセル（2）").toBe("2");
    expect.soft(o?.キャンセル日 !== null, "買取キャンセル日が登録されて空でない").toBe(true);
    expect.soft(o?.合計金額, "合計金額が 540").toBe("540");
    expect.soft(o?.端末取引ID, "端末取引IDが空のまま").toBeNull();
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数から1件増えた").toBe((前?.履歴 ?? 0) + 1);
    expect.soft(個別入力を読む(c.受注).length, "個別入力商品が1件登録された").toBe(1);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量3の1件").toEqual([3]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量3の1件").toEqual([3]);
  },
}));
caseTest("IT-A06-03-069", 流す<前の値>("069", {
  トークン: "有効",
  本文: (c) => 本文(2, 6039069, [規格の明細(c.規格, "A0603CB069商品A", 3, 123, 223, c.部門)], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが買取キャンセル（2）").toBe("2");
    expect.soft(o?.キャンセル日 !== null, "買取キャンセル日が登録されて空でない").toBe(true);
    expect.soft(o?.成立日, "買取成立日が空のまま").toBeNull();
    expect.soft(o?.合計金額, "合計金額が 370").toBe("370");
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数から1件増えた").toBe((前?.履歴 ?? 0) + 1);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量3の1件").toEqual([3]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量3の1件").toEqual([3]);
  },
}));
caseTest("IT-A06-03-070", 流す<前の値>("070", {
  トークン: "有効",
  本文: (c) => 本文(8, 6039070, [規格の明細(c.規格, "A0603CB070商品A", 3, 123, 223, c.部門)], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが査定中断（8）").toBe("8");
    expect.soft(o?.合計金額, "合計金額が 370").toBe("370");
    expect.soft(o?.成立日, "買取成立日が空のまま").toBeNull();
    expect.soft(o?.キャンセル日, "買取キャンセル日が空のまま").toBeNull();
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数から1件増えた").toBe((前?.履歴 ?? 0) + 1);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量3の1件").toEqual([3]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量3の1件").toEqual([3]);
  },
}));
caseTest("IT-A06-03-071", 流す<前の値>("071", {
  トークン: "有効",
  本文: (c) => 本文(8, null, [規格の明細(c.規格, "A0603CB071商品A-1", 2, 123, 223, c.部門), 規格の明細(c.規格, "A0603CB071商品A-2", 3, 123, 223, c.部門), { name: "A0603CB071個別商品", quantity: 1, price: 55, sell_price: 155, section_id: Number(c.部門) }], true),
  前: (c) => ({ 履歴: 履歴を読む(c.受注).length }),
  後を出す: (c) => 全体(c),
  期待: (c, 前) => {
    const o = 受注の全体を読む(c.受注);
    expect.soft(o?.ステータスID, "ステータスが査定中断（8）のまま（未登録在庫ありにならない）").toBe("8");
    expect.soft(o?.合計金額, "合計金額が 670").toBe("670");
    expect.soft(o?.端末取引ID, "端末取引IDが空のまま").toBeNull();
    expect.soft(履歴を読む(c.受注).length, "ステータス変更履歴が開始時の件数のまま増えない").toBe(前?.履歴);
    expect.soft(個別入力を読む(c.受注).length, "個別入力商品が1件登録された").toBe(1);
    expect.soft(規格の実在庫(c).map((x) => x.数量), "商品規格の実在庫が数量5の1件").toEqual([5]);
    expect.soft(規格の実在庫履歴(c).map((x) => x.変更後), "実在庫履歴が数量5の1件").toEqual([5]);
  },
}));
