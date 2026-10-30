#!/usr/bin/env python3
"""Generate _review.html -- a one-page auditioner for the clips in the manifest.

WHY THIS IS A TRACKED TOOL
--------------------------
This page has now been hand-rebuilt three times, because it was always treated
as a throwaway. It is the thing that lets a batch of clips be signed off by ear
in one sitting, and rebuilding it from scratch each time is the only reason that
is expensive. It writes to _review.html, which is gitignored: the PAGE is still
not part of the app, but the generator is.

    tools/make_review_page.py                 # every clip, newest status first
    tools/make_review_page.py --status pending_listen_2026-10-30
    tools/make_review_page.py --compare because is has as was

⛔ SERVE THE WORKING TREE WITH `Cache-Control: no-store` WHEN USING THIS.
   This repo's stale-asset trap otherwise has you auditioning the OLD wav while
   debugging the new one. A plain `python -m http.server` does NOT do that.
"""
import argparse, html, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ap = argparse.ArgumentParser()
ap.add_argument("--status", help="only clips whose status contains this")
ap.add_argument("--compare", nargs="*", default=[],
                help="word names to pull into a side-by-side row at the top")
ap.add_argument("--out", default="_review.html")
a = ap.parse_args()

man = json.loads((ROOT / "audio/manifest-tts.json").read_text())
clips = [c for c in man["clips"] if (ROOT / "audio" / c["file"]).exists()]
if a.status:
    clips = [c for c in clips if a.status in c.get("status", "")]

# Group by status, with anything un-approved first: that is what needs ears.
def rank(c):
    s = c.get("status", "")
    return (0 if "pending" in s else 1 if "rejected" in s else 2, s)
groups = {}
for c in sorted(clips, key=rank):
    groups.setdefault(c.get("status", "(no status)"), []).append(c)

def row(c):
    f = html.escape(c["file"])
    word = html.escape(str(c.get("word", c.get("text", ""))))
    text = html.escape(str(c.get("text", "")))
    note = c.get("note", "")
    seed = c.get("seed", "")
    spoken = f' <span class="t">said as "{text}"</span>' if text and text != word else ""
    return (f'<div class="r"><button class="p" data-src="audio/{f}">▶</button>'
            f'<b>{word}</b>{spoken}<span class="f">{f}</span>'
            f'<span class="d">{c.get("duration_seconds","?")}s</span>'
            f'<span class="s">{"seed "+str(seed) if seed!="" else ""}</span>'
            + (f'<div class="n">{html.escape(note)}</div>' if note else '')
            + '</div>')

cmp_html = ""
if a.compare:
    byword = {}
    for c in man["clips"]:
        byword.setdefault(str(c.get("word", c.get("text", ""))), c)
    picked = [byword[w] for w in a.compare if w in byword]
    if picked:
        cmp_html = ('<section><h2>Side by side</h2><p class="h">Listen to these in '
                    'order. The first is the new clip; the rest are already approved '
                    'and end the same way.</p>'
                    + f'<button class="all" data-group="cmp">▶ play all in order</button>'
                    + f'<div data-g="cmp">{"".join(row(c) for c in picked)}</div></section>')

body = cmp_html
for status, cs in groups.items():
    gid = "g" + str(abs(hash(status)) % 99999)
    body += (f'<section><h2>{html.escape(status)} <span class="c">{len(cs)} clips</span></h2>'
             f'<button class="all" data-group="{gid}">▶ play all in order</button>'
             f'<div data-g="{gid}">{"".join(row(c) for c in cs)}</div></section>')

(ROOT / a.out).write_text(f"""<!doctype html><meta charset="utf-8">
<title>clip review</title>
<style>
 body{{background:#141414;color:#eee;font:15px/1.5 system-ui,sans-serif;margin:0;padding:24px 28px;max-width:1000px}}
 h1{{font-size:20px;margin:0 0 4px}} h2{{font-size:15px;margin:28px 0 6px;color:#9ad}}
 .c{{color:#777;font-weight:400}} .h{{color:#999;margin:4px 0 10px}}
 .r{{display:flex;align-items:center;gap:10px;padding:5px 8px;border-radius:7px;flex-wrap:wrap}}
 .r:nth-child(odd){{background:#1c1c1c}} .r.now{{background:#2b4a2b}}
 b{{min-width:84px;font-size:17px}} .t{{color:#e8c06a}} .f{{color:#666;font-size:12px;min-width:190px}}
 .d,.s{{color:#777;font-size:12px}}
 .n{{flex-basis:100%;color:#c9a;font-size:12.5px;padding:2px 0 4px 2px}}
 button{{background:#2d2d2d;color:#eee;border:1px solid #444;border-radius:6px;cursor:pointer}}
 .p{{width:34px;height:30px;font-size:13px}} .p:hover{{background:#3b3b3b}}
 .all{{padding:5px 12px;margin:2px 0 8px;font-size:13px}}
</style>
<h1>clip review</h1>
<p class="h">Un-approved clips are listed first. Nothing here is part of the app.</p>
{body}
<script>
 let cur=null;
 function play(src){{ if(cur)cur.pause(); cur=new Audio(src); return cur.play().then(()=>cur); }}
 document.addEventListener('click',async e=>{{
   const p=e.target.closest('.p');
   if(p){{ play(p.dataset.src); return; }}
   const all=e.target.closest('.all');
   if(!all) return;
   const rows=[...document.querySelector(`[data-g="${{all.dataset.group}}"]`).querySelectorAll('.r')];
   for(const r of rows){{
     rows.forEach(x=>x.classList.remove('now')); r.classList.add('now');
     r.scrollIntoView({{block:'center',behavior:'smooth'}});
     const aud=new Audio(r.querySelector('.p').dataset.src);
     await aud.play().catch(()=>{{}});
     await new Promise(res=>{{ aud.onended=res; setTimeout(res,6000); }});
     await new Promise(res=>setTimeout(res,260));
   }}
   rows.forEach(x=>x.classList.remove('now'));
 }});
</script>
""")
print(f"wrote {a.out}: {len(clips)} clips in {len(groups)} group(s)"
      + (f", compare row: {', '.join(a.compare)}" if a.compare else ""))
