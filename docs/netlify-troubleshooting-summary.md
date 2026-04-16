# Sage Wellness — Netlify Troubleshooting Summary

*Retrieved from Gmail draft dated April 15, 2026*

---

## Site Details

| Item | Value |
|------|-------|
| Site Name | sagewellness |
| Live URL | https://sagewellness.netlify.app |
| Netlify Site ID | `076b8071-963a-4378-95f1-935e3b39ff99` |
| Deploy Status | ✅ Ready |
| Plan | Netlify Dev (Free) |
| Forms / Password Protection | Not enabled |
| GitHub Repo | https://github.com/paulbpereira-md/sage-wellness |

---

## Known Issues Found in Last Deploy

1. **No environment variables configured** — could cause silent failures if app depends on API keys/config.
2. **Framework detected as "unknown"** — Netlify couldn't identify the framework; may affect build output.
3. **No redirect rules** — critical for SPAs. Missing `_redirects` file causes 404s on any route other than `/`.
4. **No functions deployed** — if the app uses serverless functions, none are active.

---

## Fix for the 404 Error

The 404 is caused by the missing `_redirects` file.

**Option 1 — Via GitHub**
1. Go to https://github.com/paulbpereira-md/sage-wellness
2. Navigate to the `public/` folder
3. Create a new file named `_redirects` (no extension)
4. Add this line:
   ```
   /*    /index.html   200
   ```
5. Commit to `main` — Netlify will auto-deploy.

**Option 2 — Via terminal**
```bash
echo "/*    /index.html   200" > public/_redirects
git add public/_redirects
git commit -m "Fix SPA routing with Netlify redirects"
git push
```

---

## Deployment Options (reference)

- **Git-based deploy:** Connect GitHub/GitLab repo, configure build (`npm run build` / `dist`), click Deploy.
- **Drag & Drop:** Build locally, drag the build folder into the Netlify dashboard.
- **Netlify CLI:** `netlify deploy --dir=dist --prod`

---

## Open Items / Next Steps

- [ ] Re-upload `wellness-companion.jsx` (previous upload was corrupted — filled with null bytes)
- [ ] Connect GitHub integration so Claude can push directly to the repo
- [ ] Add the `_redirects` file to fix the 404
