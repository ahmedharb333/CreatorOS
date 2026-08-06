# 21 — Test Specification

## 1. Test layers

- schema tests;
- unit tests;
- service tests;
- integration tests;
- acceptance tests;
- regression tests;
- copy-and-install tests.

## 2. Required test data

Provide sample data for:

- one new creator;
- one YouTube-led creator;
- three ideas;
- two content records;
- one published item;
- one overdue task;
- one blocked task;
- one overloaded week;
- one repurposed item.

## 3. Schema tests

- all required sheets exist;
- all headers exist;
- no duplicate header;
- protected columns are protected;
- named ranges resolve;
- schema version matches.

## 4. ID tests

- sequential IDs are unique;
- concurrent requests do not collide;
- deleted IDs are not reused;
- sorting rows does not alter IDs.

## 5. Idea tests

- create valid idea;
- reject missing title;
- reject score outside 1–5;
- calculate priority;
- convert approved idea;
- prevent accidental duplicate conversion.

## 6. Content tests

- create content;
- select correct workflow;
- reject invalid platform-format combination;
- enforce valid status transition;
- mark published with URL and date.

## 7. Task tests

- generate ordered tasks;
- calculate backward dates;
- preserve completed tasks during regeneration;
- detect invalid dependency;
- mark completed;
- block with required reason.

## 8. Planning tests

- build normal-capacity week;
- warn at >85%;
- overload at >100%;
- prioritize blocking task;
- exclude completed tasks;
- approve plan.

## 9. Calendar tests

- connection success;
- permission failure;
- create event;
- prevent duplicate;
- update changed event;
- detect missing event;
- partial batch failure;
- delete with confirmation.

## 10. Recovery tests

- detect overdue;
- reschedule to next slot;
- defer content;
- update linked calendar event;
- log recovery action;
- avoid automatic cancellation.

## 11. AI tests

- disabled mode;
- missing key;
- invalid key;
- valid structured response;
- malformed JSON;
- unknown task ID;
- provider rate limit;
- fallback to rule-based planning;
- verify key absent from logs.

## 12. Dashboard tests

- valid empty state;
- correct planned vs published;
- correct task completion;
- filter by platform;
- filter by pillar;
- no formula errors.

## 13. Installation tests

- copy workbook;
- initialize scripts;
- run setup;
- authorize scopes;
- create first idea;
- generate first tasks;
- connect calendar.

## 14. Acceptance exit criteria

Release candidate passes when:

- 100% critical tests pass;
- 100% high-risk integration tests pass;
- >=95% total planned tests pass;
- no critical defect;
- no unresolved high-severity defect;
- no API key exposure;
- no duplicate calendar events in repeated sync tests.

## 15. Test evidence

Claude Code must provide:

- test case ID;
- requirement ID;
- expected result;
- actual result;
- pass/fail;
- evidence link or screenshot;
- defect ID if failed.
