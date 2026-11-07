# Guided listening underline release verification

Release `29ec2c7a1bd1-92686544210f`, source `29ec2c7a1bd1a67751d0e9a9aef8fdbb8e980565`.

- Main: https://piclex.v2fy.com/piclex-web/
- Pages: https://zhaoolee.com/piclex-web/
- Successful full workflow: https://github.com/zhaoolee/piclex-web/actions/runs/42348697234

Twelve live Chrome/WebKit checks passed across both sites. The screenshots are from the deployed sites and use the official programmer English deck. `verification.json` records exact geometry, interactions, served-file hashes, CI and server cleanup. This verifies the requested listening input area; it does not assert whole-app pixel identity or iPhone hardware testing.

The first main-site version check used a manifest URL that is intentionally not public. It was replaced with checks against the actual active release manifest. Product assertions were unchanged. The light screenshot was recaptured after its actual icon/image assets loaded.
