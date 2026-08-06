# Data Model

## Core entities
- Creator
- Idea
- Content
- Workflow
- Task
- Calendar Event
- Performance Record
- AI Request
- System Log

## Relationships
Creator 1→N Ideas
Idea 1→0..1 Content
Content 1→N Tasks
Content 1→N Performance Records
Workflow 1→N Workflow Steps
Workflow Steps generate Tasks
Task 0..1 Calendar Event

## ID format
CRT-000001
IDE-000001
CNT-000001
TSK-000001
WF-000001
EVT-000001
PER-000001
LOG-000001
