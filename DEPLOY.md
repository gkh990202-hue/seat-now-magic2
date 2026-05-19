# Cloudflare Workers 배포 (SeatNow / 온반)

## 중요: Lovable / Cloudflare에서 반드시 할 일

GitHub(`gkh990202-hue/seat-now-magic2` **main**)에는 수정이 올라가 있지만,  
로그에 `#tanstack-router-entry` 오류가 나면 **예전 캐시·예전 Deploy command**를 쓰는 것입니다.

### 1) Build cache 삭제 (필수)

Cloudflare 대시보드 → Worker → **Settings → Build → Build cache → Clear cache**

### 2) Deploy command 변경 (필수)

**Settings → Build → Deploy command** 를 아래 **한 줄**로 바꿉니다:

```bash
npm run cf:deploy
```

또는:

```bash
npm run build && npx wrangler deploy --config dist/server/wrangler.json
```

**하지 말 것:** `npx wrangler deploy` 만 두기 (소스 번들링 → TanStack 오류)

### 3) 연결 저장소 확인

- Repository: `gkh990202-hue/seat-now-magic2`
- Branch: `main`
- Lovable에서 배포 중이면, Lovable 프로젝트가 **이 GitHub repo와 동기화**돼 있는지 확인

### 4) 성공 로그

- `[deploy-cloudflare]` 또는 `vite build` 출력
- `Attaching additional modules` / `Total Upload:`
- `#tanstack-router-entry` **없음**

---

## 로컬 배포

```bash
npm run cf:deploy
```

코드 수정 후 `dist/`를 커밋하지 않으려면 위 명령만 쓰면 됩니다.

## 환경 변수 (Production)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`

Build variables에도 `VITE_*` 두 개 권장.
