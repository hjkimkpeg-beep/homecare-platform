# Replit 기존 플랫폼에 원격진단 기능 추가 요청서

## 1. 목적

기존 Replit으로 개발 중인 주택설비/수리 플랫폼에 **원격진단 기능(Remote Diagnosis Module)**을 추가한다.

고객이 수리 요청 전에 스마트폰으로 사진/영상과 간단한 증상 정보를 입력하면, 플랫폼이 1차로 문제 유형을 분류하고 예상 원인, 조치 방법, 예상 비용, 관련 안내 영상을 제공하도록 한다.

---

## 2. 추가할 기능 개요

### 기능명
**원격 점검 / 수리 전 현황파악**

### 신규 메뉴명
- 원격 점검
- 또는 수리 전 현황파악

### 신규 페이지 URL 예시
```text
/remote-diagnosis
```

---

## 3. 사용자 흐름

```text
고객 접속
 ↓
원격 점검 메뉴 선택
 ↓
문제 유형 선택
 ↓
사진/영상 업로드
 ↓
체크리스트 질문 답변
 ↓
진단 요청 제출
 ↓
1차 진단 결과 확인
 ↓
추천 영상 확인
 ↓
방문 요청 또는 상담 신청
```

---

## 4. 고객 입력 항목

### 4.1 기본 정보
- 이름
- 연락처
- 주소 또는 지역
- 희망 방문일
- 긴급 여부

### 4.2 문제 유형 선택
고객이 아래 항목 중 하나를 선택하도록 한다.

```text
1. 누수
2. 배수 막힘
3. 보일러 / 온수 문제
4. 에어컨 / 환기 문제
5. 전기 / 차단기 문제
6. 기타
```

### 4.3 사진/영상 업로드
고객이 다음 자료를 업로드할 수 있도록 한다.

- 문제 부위 전체 사진
- 문제 부위 근접 사진
- 작동 중 영상
- 소리/진동이 있는 경우 짧은 영상

권장 문구:
```text
정확한 진단을 위해 전체 사진 1장, 문제 부위 근접 사진 2~3장, 작동 중 영상 1개를 업로드해주세요.
```

---

## 5. 체크리스트 질문

### 5.1 누수
- 물이 계속 새고 있나요?
- 물을 사용할 때만 새나요?
- 벽이나 천장이 젖어 있나요?
- 최근 공사나 충격이 있었나요?

### 5.2 배수 막힘
- 물이 천천히 빠지나요?
- 물이 전혀 빠지지 않나요?
- 악취가 있나요?
- 다른 배수구도 동시에 막혔나요?

### 5.3 보일러 / 온수
- 온수가 전혀 나오지 않나요?
- 난방은 정상인가요?
- 보일러에 에러코드가 표시되나요?
- 압력계가 비정상 범위인가요?

### 5.4 에어컨 / 환기
- 찬바람이 약한가요?
- 실내기에서 물이 떨어지나요?
- 이상 소음이 있나요?
- 필터 청소를 최근에 했나요?

### 5.5 전기 / 차단기
- 차단기가 반복적으로 내려가나요?
- 특정 기기를 사용할 때만 문제가 발생하나요?
- 콘센트에 그을림이나 냄새가 있나요?
- 전체 정전인가요, 일부 공간만 문제인가요?

---

## 6. 1차 진단 결과 화면

진단 제출 후 아래 항목을 표시한다.

```text
문제 유형: 누수
예상 원인: 배관 연결부 패킹 손상 또는 조인트 느슨함
권장 조치: 연결부 조임 및 패킹 교체 필요
예상 비용: 50,000 ~ 120,000원
긴급도: 보통
추천 영상: 싱크대 하부 누수 점검 방법
방문 요청 버튼: 기사 방문 요청하기
```

---

## 7. 룰 기반 진단 로직 예시

초기 MVP 단계에서는 AI 이미지 분석 전, 아래와 같은 룰 기반 진단으로 구현한다.

```javascript
const diagnosisRules = {
  leak: {
    label: "누수",
    conditions: ["물이 계속 새고 있음", "물을 사용할 때만 샘", "벽 또는 천장 젖음"],
    result: "배관 연결부, 패킹, 또는 내부 배관 손상 가능성",
    action: "연결부 확인, 패킹 교체, 내부 누수 의심 시 방문 점검 필요",
    cost: "50,000 ~ 150,000원",
    urgency: "보통 ~ 긴급",
    videoTitle: "싱크대 및 배관 누수 점검 방법"
  },
  drain: {
    label: "배수 막힘",
    conditions: ["물이 천천히 빠짐", "악취 발생", "역류 발생"],
    result: "배수구 또는 하부 배관 막힘 가능성",
    action: "배수구 청소, 트랩 점검, 배관 세척 필요",
    cost: "70,000 ~ 180,000원",
    urgency: "보통",
    videoTitle: "배수구 막힘 원인과 점검 방법"
  },
  boiler: {
    label: "보일러 / 온수 문제",
    conditions: ["온수 안 나옴", "에러코드 표시", "난방 불량"],
    result: "보일러 압력, 센서, 점화 또는 열교환기 문제 가능성",
    action: "에러코드 확인 후 전문 기사 점검 권장",
    cost: "80,000 ~ 250,000원",
    urgency: "보통 ~ 긴급",
    videoTitle: "보일러 온수 불량 기본 점검 방법"
  },
  aircon: {
    label: "에어컨 / 환기 문제",
    conditions: ["물 떨어짐", "찬바람 약함", "소음 발생"],
    result: "배수관 막힘, 필터 오염, 팬 또는 실외기 문제 가능성",
    action: "필터 및 배수 상태 확인, 필요 시 방문 점검",
    cost: "70,000 ~ 200,000원",
    urgency: "보통",
    videoTitle: "에어컨 물 떨어짐 및 풍량 저하 점검 방법"
  },
  electrical: {
    label: "전기 / 차단기 문제",
    conditions: ["차단기 내려감", "특정 기기 사용 시 문제", "콘센트 냄새 또는 그을림"],
    result: "과부하, 누전, 배선 문제 가능성",
    action: "위험 가능성이 있으므로 전문 기사 방문 점검 필요",
    cost: "80,000 ~ 250,000원",
    urgency: "긴급 가능",
    videoTitle: "차단기 트립 시 안전 점검 방법"
  }
};
```

---

## 8. 추천 영상 매칭 구조

문제 유형별로 사전 제작된 영상 또는 영상 링크를 매칭한다.

```javascript
const repairVideos = {
  leak: {
    title: "싱크대 하부 누수 점검 방법",
    description: "배관 연결부와 패킹 상태를 확인하는 기본 방법",
    url: "/videos/leak-check.mp4"
  },
  drain: {
    title: "배수구 막힘 원인과 점검 방법",
    description: "물이 천천히 빠질 때 확인해야 할 주요 포인트",
    url: "/videos/drain-clog.mp4"
  },
  boiler: {
    title: "보일러 온수 불량 기본 점검",
    description: "에러코드, 압력계, 전원 상태 확인 방법",
    url: "/videos/boiler-check.mp4"
  },
  aircon: {
    title: "에어컨 물 떨어짐 점검",
    description: "필터와 배수관 상태 확인 방법",
    url: "/videos/ac-water-leak.mp4"
  },
  electrical: {
    title: "차단기 트립 안전 점검",
    description: "차단기 반복 트립 시 확인해야 할 사항",
    url: "/videos/breaker-check.mp4"
  }
};
```

---

## 9. 관리자 기능

관리자는 접수된 원격진단 요청을 확인할 수 있어야 한다.

### 관리자 화면 항목
- 접수 일시
- 고객명
- 연락처
- 주소/지역
- 문제 유형
- 업로드 사진/영상
- 체크리스트 답변
- 자동 진단 결과
- 긴급도
- 처리 상태

### 처리 상태 예시
```text
접수됨
검토 중
방문 예약 완료
수리 완료
취소
```

---

## 10. 데이터베이스 테이블 예시

### remote_diagnosis_requests

| Field | Type | Description |
|---|---|---|
| id | string / uuid | 요청 ID |
| customer_name | string | 고객명 |
| phone | string | 연락처 |
| address | string | 주소 또는 지역 |
| problem_type | string | 문제 유형 |
| description | text | 고객 설명 |
| checklist_answers | json | 체크리스트 답변 |
| uploaded_files | json | 사진/영상 URL |
| diagnosis_result | json | 자동 진단 결과 |
| estimated_cost | string | 예상 비용 |
| urgency | string | 긴급도 |
| status | string | 처리 상태 |
| created_at | datetime | 접수일 |
| updated_at | datetime | 수정일 |

---

## 11. UI 요구사항

### 필수 조건
- 모바일 우선 디자인
- 한국어 UI
- 기존 플랫폼 디자인과 일관성 유지
- 기존 기능은 삭제하거나 변경하지 말 것
- 사진/영상 업로드는 사용자가 쉽게 이해할 수 있도록 안내 문구 표시
- 진단 결과는 너무 단정적으로 표현하지 말고 “가능성” 중심으로 표현

### 결과 표시 문구 예시
```text
아래 결과는 사진과 입력 정보를 기반으로 한 1차 진단입니다.
정확한 원인 확인 및 수리는 현장 방문 점검이 필요할 수 있습니다.
```

---

## 12. Replit AI에게 전달할 개발 요청 프롬프트

아래 내용을 Replit AI에게 그대로 전달한다.

```text
Add a new Remote Diagnosis module to the existing platform.

Important:
- Do not remove or break existing features.
- Keep the current design style consistent.
- Use Korean language for the UI.
- Make the page mobile-friendly.

Required features:
1. Add a new navigation menu: “원격 점검”.
2. Create a new route/page: /remote-diagnosis.
3. On the page, allow users to input:
   - Name
   - Phone number
   - Address or service area
   - Preferred visit date
   - Problem type
   - Description
   - Photo/video upload
   - Checklist answers

4. Problem types:
   - 누수
   - 배수 막힘
   - 보일러 / 온수 문제
   - 에어컨 / 환기 문제
   - 전기 / 차단기 문제
   - 기타

5. After submission, show a first-level diagnosis result:
   - Problem category
   - Possible cause
   - Recommended action
   - Estimated cost range
   - Urgency level
   - Recommended repair video
   - Button: “기사 방문 요청하기”

6. Use rule-based diagnosis first.
7. Prepare the structure so that OpenAI API image/text analysis can be added later.
8. Add an admin view or section where submitted diagnosis requests can be reviewed.
9. Store submitted data in the existing database if possible. If no database exists, create a simple data structure or mock storage first.
10. Add clear disclaimer text:
   “본 결과는 입력 정보 기반의 1차 진단이며, 정확한 수리는 현장 점검이 필요할 수 있습니다.”
```

---

## 13. 향후 확장 기능

MVP 이후 다음 기능을 추가할 수 있다.

### 13.1 AI 이미지 분석
고객이 올린 사진을 OpenAI Vision API 등으로 분석하여 문제 부위를 자동 분류한다.

### 13.2 자동 견적 고도화
지역, 작업 난이도, 긴급도, 부품비를 반영하여 예상 견적을 계산한다.

### 13.3 스토리 영상 자동 생성
문제 유형별로 AI 영상 생성 도구를 연동하여 고객 맞춤형 설명 영상을 자동 생성한다.

### 13.4 기사 배정 기능
접수된 요청을 지역별/전문 분야별 기사에게 자동 배정한다.

### 13.5 카카오톡/문자 알림
접수, 진단 결과, 방문 예약 정보를 고객에게 자동 발송한다.

---

## 14. 우선 구현 범위

처음에는 아래 범위까지만 구현하는 것을 권장한다.

```text
1. 원격 점검 메뉴 추가
2. /remote-diagnosis 페이지 생성
3. 문제 유형 선택
4. 사진/영상 업로드
5. 체크리스트 입력
6. 룰 기반 진단 결과 표시
7. 추천 영상 표시
8. 방문 요청 버튼
9. 관리자 접수 목록 확인
```

AI 이미지 분석과 영상 자동 생성은 MVP 이후 2단계로 추가한다.

---

## 15. 핵심 주의사항

- 진단 결과를 확정적으로 표현하지 말 것
- 전기/가스/보일러 관련 문제는 안전 경고 표시 필요
- 사용자가 직접 위험한 작업을 하도록 유도하지 말 것
- 현장 방문이 필요한 경우를 명확히 표시할 것
- 업로드된 사진/영상은 개인정보가 포함될 수 있으므로 저장 및 접근 권한 관리 필요

---

## 16. 요약

이 기능은 기존 플랫폼에 다음 가치를 추가한다.

```text
고객 사진/영상 입력
 → 원격 현황 파악
 → 1차 문제 분류
 → 예상 원인 및 비용 안내
 → 관련 영상 제공
 → 방문 요청 전환
```

즉, 단순 수리 접수 플랫폼이 아니라 **수리 전 현황파악 + 고객 신뢰 확보 + 방문 전 준비가 가능한 플랫폼**으로 확장된다.
