"""通販の購入（UTS-01）のマトリクスを作る。本体は scenario_test/user_scenario/tools/build_matrix.py。"""
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.argv = [str(HERE.parent.parent / "tools" / "build_matrix.py"), str(HERE)] + sys.argv[1:]
runpy.run_path(sys.argv[0], run_name="__main__")
