/** M05-11 受注情報編集のシード（会員登録＋注文だけ、または注文後に1回だけ画面で保存するもの）。型は seeds/m05-11.ts と同じ */
import { 会員IDを一覧から読む, 会員のメモを登録する, OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 購入直後のシード } from "./m05-11";

const 会員ID = (n: string) => `〔会員ID-M0511-${n}〕`;

購入直後のシード("S-M05-11-MEMLINK-111", "111", "m0511-111", {
  後処理: async (page, _no, { m, notes }) => { notes.set(会員ID("111"), await 会員IDを一覧から読む(page, m.メール)); },
});
for (const n of ["122", "156"]) {
  購入直後のシード(`S-M05-11-MEMO-${n}`, n, `m0511-${n}`, {
    後処理: async (page, _no, { m, notes }) => {
      const id = await 会員IDを一覧から読む(page, m.メール);
      notes.set(会員ID(n), id);
      await 会員のメモを登録する(page, id, `会員メモM0511-${n}`);
    },
  });
}

購入直後のシード("S-M05-11-HISTO-136", "136", "m0511-136", {
  姓: "履歴姓136", 住所3: "履歴住所3-136",
  後処理: async (page, no, { 店 }) => {
    const p = new OrderEditPage(page);
    await p.openByOrderNo(no, 店);
    await p.注文者情報を開く();
    await p.注文者姓欄.fill("現在姓136");
    await p.注文者住所3.fill("現在住所3-136");
    await p.受注情報を登録する(() => undefined);
  },
});
購入直後のシード("S-M05-11-HISTS-138", "138", "m0511-138", {
  姓: "履歴配送姓138", 住所3: "履歴配送住所3-138",
  後処理: async (page, no, { 店 }) => {
    const p = new OrderEditPage(page);
    await p.openByOrderNo(no, 店);
    await p.お届け先情報を開く();
    await p.お届け先姓.fill("現在配送姓138");
    await p.お届け先住所3.fill("現在配送住所3-138");
    await p.受注情報を登録する(() => undefined);
  },
});
for (const n of ["142", "198"]) {
  購入直後のシード(`S-M05-11-HISTN-${n}`, n, `m0511-${n}`, {
    後処理: async (page, no, { 店 }) => {
      const p = new OrderEditPage(page);
      await p.openByOrderNo(no, 店);
      await p.note.fill("履歴作成用");
      await p.受注情報を登録する(() => undefined);
    },
  });
}
購入直後のシード("S-M05-11-DPHIST-208", "208", "dpm0511-208", { ドメイン: "example.test" });
購入直後のシード("S-M05-11-DPPLAIN-221", "221", "dpm0511-221", { ドメイン: "example.test" });

// ---- 注文者とお届け先の項目を、注文後に画面で初期値にするシード ----
type 入力 = [string, string][];
function 項目初期値(seedId: string, n: string, 入力: 入力): void {
  購入直後のシード(seedId, n, `m0511-${n}`, {
    後処理: async (page, no, { 店 }) => {
      const p = new OrderEditPage(page);
      await p.openByOrderNo(no, 店);
      if (入力.length > 0) {
        await p.両方に入れる(入力);
        await p.受注情報を登録する(() => undefined);
      }
    },
  });
}
const 住所 = (): 入力 => [["address_addr01", "千代田1"], ["address_addr02", "千代田2"], ["address_addr03", "千代田3"]];
項目初期値("S-M05-11-BASE-061", "061", [["company_name", "試験会社"], ["abroad_postal_code", "12345"]]);
項目初期値("S-M05-11-BASE-063", "063", 住所());
項目初期値("S-M05-11-BASE-065", "065", [["postalCode_postalCode01", "111"], ["postalCode_postalCode02", "2222"], ["abroad_postal_code", "33333"]]);
項目初期値("S-M05-11-BASE-067", "067", [["tel_tel01", "03"], ["tel_tel02", "1234"], ["tel_tel03", "5678"], ["fax_fax01", "03"], ["fax_fax02", "1234"], ["fax_fax03", "5679"]]);
項目初期値("S-M05-11-LIM-112", "112", []);
項目初期値("S-M05-11-LIM-114", "114", [["kana_kana01", "しけんせい"], ["kana_kana02", "しけんめい"]]);
項目初期値("S-M05-11-LIM-116", "116", 住所());
項目初期値("S-M05-11-TELOPT-193", "193", [["tel_tel01", "121"], ["tel_tel02", "1211"], ["tel_tel03", "1212"], ["fax_fax01", "121"], ["fax_fax02", "1213"], ["fax_fax03", "1214"]]);
