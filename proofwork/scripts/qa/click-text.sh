#!/bin/bash
# click-text.sh "<exact visible text>"  → clicks the first visible button/link/role=button with that text in the QA harness.
DIR="$(cd "$(dirname "$0")" && pwd)"
T=$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1")
"$DIR/q" eval js="(()=>{const want=$T.toLowerCase();const els=[...document.querySelectorAll('button,a,[role=button],[role=tab],label')].filter(e=>e.offsetParent!==null&&((e.innerText||'').trim().toLowerCase()===want||(e.getAttribute('aria-label')||'').toLowerCase()===want));if(!els.length)return 'missing: '+$T;els[0].click();return 'clicked: '+$T})()"
