# NH SMS 발송 본문 점검 대시보드 (PoC)

NH SMS · PoC — 마케팅 SMS/LMS 발송 **본문을 발송 전에 점검·분석**하는 웹 대시보드 초안.
한 화면에서 다음 3가지를 제공합니다.

1. **발송 본문 입력 UI** — 본문 붙여넣기 + 실시간 글자수/바이트(SMS·LMS 자동 판별)
2. **오탈자 검사 + 광고성/정보성 AI 분류** — Claude 로 분류·근거·키워드·주제·어조 추출,
   정보통신망법 **광고 표기 의무**(`(광고)` 접두 · 무료수신거부 · 발신주체) 점검, 오탈자/맞춤법 교정 제안
3. **메시지 트렌드 분석** — 누적 데이터로 **광고/정보 비율 · 키워드 빈도 · 주제 분포 · 최근 점검 내역**

## 스택

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**
- **Claude API** (`claude-opus-4-8`) — 서버 라우트(`/api/analyze`)에서만 호출하여 키를 보호
- **Supabase** (Postgres) — 분석 결과 적재 및 트렌드 집계
- **Vercel** 배포 대응

> Supabase / Claude 키가 없어도 앱은 뜹니다. 키 미설정 시 해당 기능만 비활성화됩니다.

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev                         # http://localhost:3000
```

### 환경 변수

| 키 | 용도 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API (서버 전용) |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용) |

> 셋 모두 **서버 전용**입니다. `NEXT_PUBLIC_` 접두를 붙이지 마세요(브라우저 노출 위험).

### Supabase 준비

`supabase/schema.sql` 을 Supabase **SQL Editor** 에 붙여넣어 `analyses` 테이블을 생성합니다.

## Vercel 배포

1. 이 저장소를 Vercel 에 import
2. **Project Settings → Environment Variables** 에 위 3개 키 등록
3. Deploy (프레임워크 자동 감지 — Next.js)

## 구조

```
app/
  page.tsx              # 한 화면 3패널 대시보드
  layout.tsx
  api/
    analyze/route.ts    # POST: 본문 → Claude 분석 → Supabase 저장
    trends/route.ts     # GET: 누적 데이터 집계
components/
  MessageInput.tsx      # ① 입력
  AnalysisResult.tsx    # ② 분류·오탈자·표기점검
  TrendPanel.tsx        # ③ 트렌드
lib/
  analyze.ts            # Claude 호출 + 프롬프트
  sms.ts                # SMS/LMS 바이트 계산
  supabase.ts           # 서버 Supabase 클라이언트
  types.ts
supabase/schema.sql
```

## 참고

분석 결과는 AI 추정값으로 **참고용**이며, 실제 발송 전 담당자 최종 검수가 필요합니다.
