# Cloudflare Workers 배포 (SeatNow / 온반)

이 프로젝트는 **정적 Pages**가 아니라 **TanStack Start + Cloudflare Worker**입니다.  
`vite build`로 `dist/server/`·`dist/client/`를 만든 뒤 Worker로 배포해야 합니다.

## 배포 실패 원인

로그에 `Executing user deploy command: npx wrangler deploy`만 있고 **빌드 단계가 없으면**  
Wrangler가 `wrangler.jsonc`의 `src/server.ts`를 직접 번들링하려다 아래 오류가 납니다.

- `#tanstack-router-entry`
- `tanstack-start-manifest:v`
- 기타 TanStack Start 가상 모듈

## Cloudflare 대시보드 설정 (권장)

Workers & Pages → 해당 Worker → **Settings → Build**

| 항목 | 값 |
|------|-----|
| **Deploy command** | `npm run deploy` |

또는 분리:

| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config dist/server/wrangler.json` |

저장 후 **Retry deployment**를 누르세요.

### 대시보드를 못 바꾸는 경우

`package.json`의 `postinstall`이 Cloudflare CI(`WORKERS_CI=1`)에서 자동으로 `npm run build`를 실행합니다.  
Deploy command가 `npx wrangler deploy`여도, **이 변경을 GitHub에 push한 뒤** 재배포하면 동작해야 합니다.

로그에 `Executing user deploy command: npx wrangler deploy`만 보이면 대시보드는 아직 기본값입니다.

## 환경 변수 (Settings → Variables)

런타임(Production)에 추가:

| 이름 | 설명 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon / publishable key |
| `SUPABASE_URL` | 위와 동일 URL |
| `SUPABASE_PUBLISHABLE_KEY` | 위와 동일 key |

빌드 시에도 Vite가 `VITE_*`를 읽으므로, **Build variables**에도 같은 `VITE_*` 두 개를 넣는 것을 권장합니다.

## 로컬에서 확인

```bash
npm run build
npm run deploy
```

배포 URL은 Cloudflare Worker 이름(`seat-now-magic2`) 기준 `*.workers.dev`입니다.
