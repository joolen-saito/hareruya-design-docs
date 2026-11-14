/**
 * M05-23 出荷指示：納品書印刷（英語）の画面操作。出荷指示リスト編集で受注を選び、「納品書印刷（英語）」で開いた新しい窓の英語の納品書を読む。
 * 受注の選択・印刷の要求への受注の追加は M05-21・M05-22 の部品（StandbySlipPage）、英語の納品書の読み取りは M05-10 の部品（英語の納品書を読む）を使う。
 * ここには M05-23 だけが使う操作を足す。正本: cases/M05-23_test_cases.tsv
 */
import { expect, Page } from "@playwright/test";
import { StandbySlipPage } from "./m05_22_standby_slips";

export class StandbySlipEnPage extends StandbySlipPage {
  /** 「納品書印刷（英語）」を押し、開いた新しい窓を返す（空の窓を開いてからフォームを送る作りなので、移り先まで待つ） */
  async 英語の納品書印刷を押す(): Promise<Page> {
    await this.page.waitForLoadState("load");
    const button = this.page.locator("#printDeliverySlipsEn");
    await expect(button, "納品書印刷（英語）ボタン").toBeVisible();
    const [popup] = await Promise.all([this.page.waitForEvent("popup", { timeout: 60_000 }), button.click()]);
    await popup.waitForLoadState("load");
    await popup.waitForURL(/\/standby\/\d+(\/print\/delivery\/en|\/edit)/, { timeout: 60_000 }).catch(() => undefined);
    await popup.waitForLoadState("load");
    return popup;
  }
}

/** 英語の納品書の窓の本文（改行をそろえた文）。消費税・登録番号などが出ていないかを見るのに使う */
export async function 窓の本文(popup: Page): Promise<string> {
  return ((await popup.locator("body").innerText().catch(() => "")) ?? "").replace(/[ \t]+/g, " ");
}
