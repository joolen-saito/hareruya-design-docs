主張: `matrix_UKA-01/README.md:31` の因子Hは、本店・支店をまとめる理由として「店舗で変わるのは入庫先と戻しリストの棚番号」であり、UKA-01内の表示・期待値は変わらないとしている。
実際: `excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html:1118` は「書類確認画面では、合意書と買取証明書を表示し、印刷できる」とする。`front-application/MTGBuyer/Screen/Document/AgreementDocument.xaml.cs:60` と `CertificateDocument.xaml.cs:59` は、両帳票の住所に `user.ShopAddr` を設定する。UKA-01内にも、端末利用者の所属店舗によって変わる出力がある。
判定: 事実の誤り
修正案: 因子Hの統合根拠を訂正し、買取店舗とは別に端末利用者の所属店舗による帳票住所の期待値を扱う。
