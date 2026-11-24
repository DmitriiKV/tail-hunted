import argparse
import io
import re
import sys
import tokenize
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"node_modules", "__pycache__", ".git", "dist", "venv", ".venv"}
KEEP_PY = re.compile(r"#\s*(noqa|type:|pragma|!)")
JS_LINE = re.compile(r"^\s*//")
JS_JSX_BLOCK = re.compile(r"^\s*\{/\*.*?\*/\}\s*$")
JS_BLOCK_LINE = re.compile(r"^\s*/\*.*\*/\s*$")


def source_files():
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or SKIP_DIRS & set(path.parts):
            continue
        if path.suffix in {".py", ".js", ".jsx", ".css"}:
            yield path


def strip_python(text, drop_docstrings):
    removed = []
    lines = text.splitlines(keepends=True)
    drop = set()

    for tok in tokenize.generate_tokens(io.StringIO(text).readline):
        if tok.type == tokenize.COMMENT and not KEEP_PY.search(tok.string):
            row, col = tok.start
            line = lines[row - 1]
            if line[:col].strip() == "":
                drop.add(row)
            else:
                lines[row - 1] = line[:col].rstrip() + ("\n" if line.endswith("\n") else "")
            removed.append((row, tok.string.strip()))

    if drop_docstrings:
        import ast

        tree = ast.parse(text)
        for node in ast.walk(tree):
            if isinstance(node, (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                body = node.body
                if body and isinstance(body[0], ast.Expr) and isinstance(getattr(body[0], "value", None), ast.Constant) and isinstance(body[0].value.value, str):
                    first = body[0]
                    if len(body) > 1 or isinstance(node, ast.Module):
                        for row in range(first.lineno, first.end_lineno + 1):
                            drop.add(row)
                        removed.append((first.lineno, "docstring"))

    kept = [line for index, line in enumerate(lines, start=1) if index not in drop]
    return "".join(kept), removed


def strip_js(text):
    removed = []
    kept = []
    in_block = False

    for number, line in enumerate(text.splitlines(keepends=True), start=1):
        if in_block:
            removed.append((number, line.strip()))
            if "*/" in line:
                in_block = False
            continue
        if JS_LINE.match(line) or JS_JSX_BLOCK.match(line) or JS_BLOCK_LINE.match(line):
            removed.append((number, line.strip()))
            continue
        stripped = line.strip()
        if stripped.startswith("/*") and "*/" not in stripped:
            in_block = True
            removed.append((number, stripped))
            continue
        kept.append(line)

    return "".join(kept), removed


def strip_css(text):
    removed = re.findall(r"/\*.*?\*/", text, flags=re.S)
    return re.sub(r"/\*.*?\*/\s*", "", text, flags=re.S), [(0, item) for item in removed]


def inline_leftovers(path, text):
    pattern = re.compile(r"[^:'\"]\s//\s+\S") if path.suffix in {".js", ".jsx"} else None
    if not pattern:
        return []
    return [n for n, line in enumerate(text.splitlines(), start=1) if pattern.search(line)]


def main():
    parser = argparse.ArgumentParser(description="Удаляет комментарии из исходников проекта")
    parser.add_argument("--apply", action="store_true", help="записать изменения (по умолчанию только отчёт)")
    parser.add_argument("--docstrings", action="store_true", help="удалить также docstring в Python")
    args = parser.parse_args()

    total = 0
    for path in source_files():
        original = path.read_bytes().decode("utf-8")
        text = original.replace("\r\n", "\n")
        crlf = "\r\n" in original

        if path.suffix == ".py":
            result, removed = strip_python(text, args.docstrings)
        elif path.suffix == ".css":
            result, removed = strip_css(text)
        else:
            result, removed = strip_js(text)

        leftovers = inline_leftovers(path, result)
        if not removed and not leftovers:
            continue

        total += len(removed)
        rel = path.relative_to(ROOT)
        print(f"{rel}: {len(removed)}")
        if leftovers:
            print(f"    проверьте вручную, строки с // внутри кода: {leftovers}")

        if args.apply and removed:
            result = result.replace("\n", "\r\n") if crlf else result
            path.write_bytes(result.encode("utf-8"))

    print(f"\nВсего комментариев: {total}. {'Удалено.' if args.apply else 'Запустите с --apply, чтобы удалить.'}")


if __name__ == "__main__":
    sys.exit(main())
