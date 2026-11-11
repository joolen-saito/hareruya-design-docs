/**
 * M05-22 出荷指示：納品書印刷（日本語）の画面操作。出荷指示リスト編集で受注を選び、「納品書印刷（日本語）」で開いた新しい窓の納品書を読む部品は
 * M05-09 のもの（pages/admin/m05_09_delivery_slips.ts の SlipStandbyPage・納品書を読む）を使う。ここには M05-22 だけが使う操作を足す。
 * 正本: cases/M05-22_test_cases.tsv
 *
 * 開発者ツールでの送信内容の書き換えの代わり: 画面は「納品書印刷（日本語）」を押すと、スクリプトがフォームの送り先を入れて jQuery で送信する
 * （@admin/ShippingStandby/edit.twig）。jQuery の送信はフォームの submit 関数を呼ぶので、submit の出来事には頼らず、関数を差し替えて書き換える。
 */
import { Page } from "@playwright/test";
import { SlipStandbyPage } from "./m05_09_delivery_slips";

export class StandbySlipPage extends SlipStandbyPage {
  /** 納品書印刷の要求の「選択済みの受注ID」を書き換える（選んだ受注の選択欄の名前 order_ids[受注ID] を、押す前に新しい受注IDへ変える） */
  async 選択した受注IDを書き換える(元の受注ID: string, 新しい受注ID: string): Promise<void> {
    await this.page.evaluate(([from, to]) => {
      const box = document.querySelector(`#form_bulk input[name="order_ids[${from}]"]`) as HTMLInputElement | null;
      if (!box) throw new Error(`受注ID ${from} の選択欄が無い`);
      box.name = `order_ids[${to}]`;
    }, [元の受注ID, 新しい受注ID]);
  }

  /** 納品書印刷の送り先（出荷指示リストID）を、送信の直前に書き換える（フォームの submit 関数を差し替える） */
  async 送り先を書き換える(元のID: string, 新しいID: string): Promise<void> {
    await this.page.evaluate(([from, to]) => {
      const f = document.querySelector("#form_bulk") as HTMLFormElement | null;
      if (!f) throw new Error("出荷指示リスト編集の送信用のフォームが無い");
      const native = HTMLFormElement.prototype.submit;
      const rewrite = () => { f.action = f.action.replace(`/standby/${from}/print/delivery/`, `/standby/${to}/print/delivery/`); };
      (f as HTMLFormElement & { submit: () => void }).submit = function (this: HTMLFormElement) { rewrite(); native.call(this); };
      f.addEventListener("submit", rewrite, true);
    }, [元のID, 新しいID]);
  }

  /** 納品書の窓に出た画面メッセージ（警告・エラー・お知らせの枠の文） */
  static async 窓のメッセージ(popup: Page): Promise<string[]> {
    return (await popup.locator(".alert, .c-alert, .toast, [role='alert']").allInnerTexts().catch(() => [] as string[]))
      .map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
}
