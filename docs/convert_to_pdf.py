#!/usr/bin/env python3
import os
import glob
import subprocess
import markdown
import re
import sys
import tempfile
import shutil

DOCS_DIR = "/home/francis/Documentos/GitHub/minimarketFront/docs"
OUTPUT_DIR = os.path.join(DOCS_DIR, "pdf")
TEMP_DIR = "/tmp/md_pdf_build"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
  @page {{
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }}
  body {{
    font-family: 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1e293b;
    margin: 0;
    padding: 0;
  }}
  .doc-header {{
    text-align: center;
    margin-bottom: 22px;
    padding-bottom: 12px;
    border-bottom: 2px solid #1e3a8a;
  }}
  .doc-header-tag {{
    font-size: 10pt;
    color: #475569;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1.2px;
  }}
  .doc-header-sub {{
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 3px;
  }}
  h1 {{
    font-size: 17pt;
    color: #1e3a8a;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 5px;
    margin-top: 14px;
    margin-bottom: 12px;
  }}
  h2 {{
    font-size: 13pt;
    color: #1d4ed8;
    border-bottom: 1px solid #93c5fd;
    padding-bottom: 3px;
    margin-top: 18px;
    margin-bottom: 8px;
  }}
  h3 {{
    font-size: 11pt;
    color: #1e40af;
    margin-top: 14px;
    margin-bottom: 6px;
  }}
  h4 {{
    font-size: 10pt;
    color: #334155;
    margin-top: 10px;
    margin-bottom: 4px;
  }}
  p {{
    margin-top: 4px;
    margin-bottom: 8px;
    text-align: justify;
  }}
  ul {{
    padding-left: 24px;
    margin-top: 4px;
    margin-bottom: 8px;
  }}
  ol {{
    padding-left: 30px;
    margin-top: 4px;
    margin-bottom: 8px;
  }}
  li {{
    margin-bottom: 4px;
    text-align: justify;
  }}
  hr {{
    border: 0;
    height: 1px;
    background: #cbd5e1;
    margin: 16px 0;
  }}
  code {{
    font-family: 'Liberation Mono', 'DejaVu Sans Mono', Courier, monospace;
    font-size: 9pt;
    background-color: #f1f5f9;
    color: #b91c1c;
    padding: 1px 4px;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
  }}
  pre {{
    background-color: #f8fafc;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    padding: 10px 14px;
    border-radius: 4px;
    font-family: 'Liberation Mono', 'DejaVu Sans Mono', Courier, monospace;
    font-size: 8.5pt;
    line-height: 1.45;
    margin: 12px 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }}
  blockquote {{
    border-left: 4px solid #2563eb;
    background-color: #eff6ff;
    padding: 8px 14px;
    margin: 12px 0;
    color: #1e40af;
    border-radius: 0 4px 4px 0;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
  }}
  th {{
    background-color: #1e40af;
    color: #ffffff;
    font-weight: bold;
    padding: 7px 10px;
    border: 1px solid #1e3a8a;
    text-align: left;
  }}
  td {{
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }}
  a {{
    color: #2563eb;
    text-decoration: none;
  }}
  a:hover {{
    text-decoration: underline;
  }}
  .doc-footer {{
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 8pt;
    color: #94a3b8;
  }}
</style>
</head>
<body>
<div class="doc-header">
  <div class="doc-header-tag">DOCUMENTACIÓN OFICIAL DEL SISTEMA</div>
  <div class="doc-header-sub">Sistema Retail ERP & Punto de Venta • Heladerías y Minimarkets • DNIT / SET Paraguay</div>
</div>
{body}
<div class="doc-footer">
  Sistema de Gestión Comercial Retail ERP & POS • Facturación Legal Paraguay • Documento Interno de Consulta
</div>
</body>
</html>"""

def stripe_tables(html):
    def replace_tbody(match):
        tbody = match.group(0)
        rows = re.findall(r'<tr.*?>.*?</tr>', tbody, re.DOTALL)
        new_rows = []
        for i, row in enumerate(rows):
            if i % 2 == 1 and 'bgcolor' not in row:
                row = re.sub(r'<tr', '<tr bgcolor="#f8fafc" style="background-color: #f8fafc;"', row, count=1)
            new_rows.append(row)
        return '<tbody>' + ''.join(new_rows) + '</tbody>'
    return re.sub(r'<tbody>(.*?)</tbody>', replace_tbody, html, flags=re.DOTALL)

def process_markdown(file_path):
    filename = os.path.basename(file_path)
    base_name, _ = os.path.splitext(filename)
    
    with open(file_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convert to HTML
    body_html = markdown.markdown(
        md_text,
        extensions=['tables', 'fenced_code', 'sane_lists']
    )

    # Post-process tables for LibreOffice Writer
    body_html = re.sub(
        r'<table>',
        '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #94a3b8; margin: 14px 0; font-size: 9.5pt;">',
        body_html
    )
    body_html = re.sub(
        r'<th>',
        '<th bgcolor="#1e40af" style="background-color: #1e40af; color: #ffffff; padding: 7px 10px; font-weight: bold; border: 1px solid #1e3a8a; text-align: left;">',
        body_html
    )
    body_html = re.sub(
        r'<td>',
        '<td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top;">',
        body_html
    )
    body_html = stripe_tables(body_html)

    # Clean pre/code blocks
    body_html = re.sub(
        r'<pre><code(?:\s+class="[^"]*")?>',
        '<pre style="background-color: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 4px; font-family: monospace; font-size: 8.5pt; line-height: 1.45; margin: 12px 0;">',
        body_html
    )
    body_html = re.sub(r'</code></pre>', '</pre>', body_html)

    # Style blockquotes
    body_html = re.sub(
        r'<blockquote>',
        '<blockquote style="border-left: 4px solid #2563eb; background-color: #eff6ff; padding: 8px 14px; margin: 12px 0; color: #1e40af; border-radius: 0 4px 4px 0;">',
        body_html
    )

    # Replace .md links with .pdf links
    body_html = re.sub(r'href="([^"]+)\.md(#?[^"]*)"', r'href="\1.pdf\2"', body_html)

    # Build full document
    title = base_name.replace("_", " ").title()
    full_html = HTML_TEMPLATE.format(title=title, body=body_html)

    temp_html_path = os.path.join(TEMP_DIR, f"{base_name}.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(full_html)

    # Convert using LibreOffice with isolated temporary profile
    lo_prof = tempfile.mkdtemp(prefix=f"lo_{base_name}_")
    try:
        cmd = [
            "libreoffice",
            f"-env:UserInstallation=file://{lo_prof}",
            "--headless",
            "--convert-to", "pdf",
            temp_html_path,
            "--outdir", OUTPUT_DIR
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=45)
        if res.returncode != 0:
            print(f"Error converting {filename}: {res.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"Timeout converting {filename}")
        return False
    finally:
        shutil.rmtree(lo_prof, ignore_errors=True)

    pdf_path = os.path.join(OUTPUT_DIR, f"{base_name}.pdf")
    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"OK: {base_name}.pdf ({size_kb:.1f} KB)")
        return True
    else:
        print(f"Error: expected output {pdf_path} not found")
        return False

def main():
    # Remove any leftover .tmp files
    for tmp in glob.glob(os.path.join(OUTPUT_DIR, "*.tmp")):
        try:
            os.remove(tmp)
        except OSError:
            pass

    md_files = sorted(glob.glob(os.path.join(DOCS_DIR, "*.md")))
    print(f"Iniciando conversión de {len(md_files)} manuales en {DOCS_DIR}...")
    
    success_count = 0
    for f in md_files:
        if process_markdown(f):
            success_count += 1

    print(f"\nFinalizada conversión: {success_count}/{len(md_files)} archivos PDF generados.")

    # Create consolidated unified PDF
    numbered_pdfs = sorted(glob.glob(os.path.join(OUTPUT_DIR, "[0-9][0-9]_*.pdf")))
    general_pdf = os.path.join(OUTPUT_DIR, "MANUAL_DE_USUARIO_GENERAL.pdf")
    readme_pdf = os.path.join(OUTPUT_DIR, "README.pdf")
    
    all_pdfs_to_unite = []
    if os.path.exists(readme_pdf):
        all_pdfs_to_unite.append(readme_pdf)
    if os.path.exists(general_pdf):
        all_pdfs_to_unite.append(general_pdf)
    all_pdfs_to_unite.extend(numbered_pdfs)

    if all_pdfs_to_unite:
        consolidated_pdf = os.path.join(OUTPUT_DIR, "MANUAL_COMPLETO_CONSOLIDADO.pdf")
        unite_cmd = ["pdfunite"] + all_pdfs_to_unite + [consolidated_pdf]
        u_res = subprocess.run(unite_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if u_res.returncode == 0 and os.path.exists(consolidated_pdf):
            c_size_mb = os.path.getsize(consolidated_pdf) / (1024 * 1024)
            print(f"OK: MANUAL_COMPLETO_CONSOLIDADO.pdf unificado ({c_size_mb:.2f} MB)")
        else:
            print(f"Nota: No se pudo generar el manual consolidado: {u_res.stderr}")

if __name__ == "__main__":
    main()
