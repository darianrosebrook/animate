### Rule: No duplicate "enhanced/unified/new/final" modules

* Before adding or renaming any file, run:
  * `rg -n --no-ignore -g '!node_modules' '(?i)\b(enhanced|unified|better|new|next|final|copy|revamp|improved)\b'`
  * `rg -n --no-ignore -g '!node_modules' '(?i)(enhanced|unified|new|final|copy).*\.([tj]sx?|mjs|cjs|mts|cts)$'`
* If a hit occurs in a **filename** proposal or a **declaration name**, do not proceed. Replace with a purpose-first name and edit existing modules.
* If two files represent the same domain (e.g., `enhanced-pdf-processor.ts` and `pdf-processor.ts`), refactor by merging into the canonical name and deleting the duplicate; update all imports.
* Prefer Strategy/feature-flag patterns over file forks.
* Every refactor must include tests asserting unchanged public behavior unless the refactor is explicitly behavioral (then update tests and CHANGELOG).

(Keep this rule at the top; Cursor will consult it before proposing changes.)
