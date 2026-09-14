# himagyo 指数チェックの日次更新

公開画面のグラフは、価格と移動平均、市場内部のETF比率、VIX系、Cboe COR・分散系列の直近60営業日を日次JSONから表示します。単位が異なる系列の比較は初日を100に換算します。SPY保有銘柄ブレッドは取得初日から蓄積しているため、現時点では20日・200日線超比率の棒グラフです。グラフは取得済み値から毎朝再生成されます。

COR1M・COR3M・VIXEQ・DSPXはCboe公式履歴CSVから取得します。SPY保有銘柄の20日・200日線超比率はState Streetの日次保有銘柄とYahooの日足から計算します。SPY保有銘柄を用いた市場内部の代理系列であり、過去日に現在の構成を遡及適用しません。NDX構成銘柄ブレッドは未接続です。同じ市場日でも観測値が更新された場合は公開JSONを更新します。

公開ページは `daily.html`、日次の観測値と判定は `daily-data.json` を読み込みます。`index.html` は指標用語集です。取得・計算コードの正本はローカル作業領域の `projects/20260901_himagyo指標/` にあります。

Windows のタスクスケジューラで平日 08:30（PC のローカル時刻、日本時間を想定）に `run_daily.ps1` を実行します。月曜朝は米国の金曜終値、それ以外は直前の確定済み終値を採用します。米国休場日などで市場日付が前回公開版から進んでいなければ、再公開しません。前年初から当日未満の米国市場系列を `データ/取得/Yahoo株価.py` で取得し、保存された原本を `Yahoo株価_変換.py` で共通CSVに変換した後、`build_daily.py` が前日版を引き継いで日次JSONを生成します。取得・変換・生成に失敗した場合、ランナーは失敗ログを `projects/20260901_himagyo指標/run_logs/` に残し、HTMLの当日版を公開しません。欠測値は `daily-data.json` に明示します。

手動実行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File projects/20260901_himagyo指標/run_daily.ps1 -NoPush
```

定時実行の登録：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File projects/20260901_himagyo指標/schedule_daily.ps1
```

`-NoPush` はデータ取得・候補JSONの生成と検証だけを行い、公開ファイルを変えません。通常実行では `daily-data.json` だけをコミットして `origin/main` に push します。主要価格が4暦日を超えて古い、SPX/NDXの観測日が食い違う、生成結果の `status` が `ok` / `partial` 以外の場合は公開を止めます。`partial` は欠測を明示した有効版です。実行前にローカル `main` と `origin/main` が一致すること、および公開ファイルに未コミット変更がないことを確認します。push に失敗した場合はログを確認し、ローカルに残ったコミットを同期してから再実行してください。

PythonはPJ内 `.venv/Scripts/python.exe` を使用します。仮想環境がない場合は作成して `requests` と `tzdata` をインストールするか、ランナーへ `-Python` で実行ファイルを指定してください。


## TradingViewの追加画像（2026-09-15）

日次ページの「TradingViewで確認する市場指標」に71系列の撮影画像を追加。各画像は撮影時点の静止画で、日次JSONの数値とは独立している。撮影時刻・銘柄・実配信元・画像ハッシュは`tradingview-captures.json`に保存した。画像は原寸表示と元チャートへのリンクを持つ。

取得対象はローカルPJの`tradingview_targets.json`、HTML生成は`build_tradingview_gallery.py`。CTAインジケータはユーザー指定で除外した。本人の非公開インジや、同一の定義を確認できない外部推計は欠測理由を表示する。既存の日次ランナーはこの画像群を更新しない。
