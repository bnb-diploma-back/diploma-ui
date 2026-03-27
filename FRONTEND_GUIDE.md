# Frontend Integration Guide

**Base URL:** `http://localhost:8070`
**Swagger UI:** `http://localhost:8070/swagger-ui.html`
**WebSocket:** `http://localhost:8070/ws/chat`

---

## 1. Dashboard Page

**The main home screen. One call gives you everything.**

```
GET /api/v1/dashboard/students/{studentId}?week=3
```

### Response

```json
{
  "profile": {
    "id": 1,
    "firstName": "Aldongar",
    "lastName": "Nuraskhan",
    "email": "aldongar@sdu.edu.kz",
    "studentId": "SDU_220107",
    "department": "Computer Science",
    "major": "Software Engineering",
    "enrollmentYear": 2022,
    "currentSemester": "SPRING"
  },
  "academicOverview": {
    "totalCourses": 5,
    "totalCredits": 18,
    "courses": [
      {
        "syllabusId": 1,
        "courseCode": "CS301",
        "courseTitle": "Data Structures",
        "instructor": "Dr. Smith",
        "credits": 4,
        "expectedGrade": "A+"
      }
    ]
  },
  "currentWeek": {
    "weekNumber": 3,
    "totalTasks": 8,
    "completedTasks": 3,
    "pendingTasks": 4,
    "overdueTasks": 1,
    "hasOrganizer": true
  },
  "upcomingDeadlines": [
    {
      "taskId": 12,
      "taskTitle": "Lab 3: Binary Trees",
      "courseCode": "CS301",
      "courseTitle": "Data Structures",
      "taskType": "LAB",
      "status": "PENDING",
      "dueDate": "2026-03-28",
      "daysRemaining": 5,
      "maxScore": 20
    }
  ],
  "taskProgress": {
    "totalTasks": 24,
    "pendingCount": 8,
    "inProgressCount": 3,
    "submittedCount": 5,
    "gradedCount": 7,
    "overdueCount": 1,
    "completionPercentage": 50,
    "averageScore": 85.5
  },
  "topCareers": [
    {
      "profession": "Backend Developer"
    }
  ],
  "todaySchedule": {
    "day": "Monday",
    "dailyTip": "Start with your hardest task while energy is high",
    "timeBlocks": [
      {
        "startTime": "09:00",
        "endTime": "10:30",
        "taskTitle": "Lab 3: Binary Trees",
        "courseCode": "CS301",
        "activityType": "DEEP_WORK",
        "effortLevel": "HIGH_FOCUS",
        "focusTip": "Turn off notifications, use Pomodoro 25/5",
        "estimatedMinutes": 90
      }
    ]
  }
}
```

### What to render

| Section | UI Component | Data |
|---------|-------------|------|
| Header | Profile card | `profile.firstName`, `profile.major`, `profile.currentSemester` |
| Stats row | 4 stat cards | `currentWeek.totalTasks`, `completedTasks`, `pendingTasks`, `overdueTasks` |
| Progress | Donut chart / progress bar | `taskProgress.completionPercentage`, `taskProgress.averageScore` |
| Deadlines | Sorted list with urgency colors | `upcomingDeadlines[]` — red if `daysRemaining <= 2`, yellow if `<= 5` |
| Today | Timeline / schedule view | `todaySchedule.timeBlocks[]` — color by `effortLevel` |
| Courses | Cards grid | `academicOverview.courses[]` — show grade badge |
| Careers | Small cards | `topCareers[]` — link to full careers page |
| Organizer CTA | Button | Show "Generate Plan" if `currentWeek.hasOrganizer === false` |

---

## 2. Students

### Get all students

```
GET /api/v1/students
```

### Get student by ID

```
GET /api/v1/students/{id}
```

### Get student by university ID

```
GET /api/v1/students/by-student-id/{studentId}
```

### Response

```json
{
  "id": 1,
  "firstName": "Aldongar",
  "lastName": "Nuraskhan",
  "email": "aldongar@sdu.edu.kz",
  "studentId": "SDU_220107",
  "department": "Computer Science",
  "major": "Software Engineering",
  "enrollmentYear": 2022,
  "currentSemester": "SPRING",
  "dateOfBirth": "2002-05-15",
  "phone": "+77001234567",
  "address": "Almaty, Kazakhstan",
  "studentSyllabi": [
    {
      "id": 1,
      "syllabusId": 1,
      "syllabusTitle": "Data Structures",
      "syllabusCourseCode": "CS301",
      "expectedGrade": "A+",
      "notes": "Focus on trees and graphs"
    }
  ],
  "studentCareers": [
    {
      "id": 1,
      "profession": "Backend Developer",
      "description": "Designs server-side applications...",
      "requiredSkills": "Java, Spring Boot, SQL"
    }
  ],
  "createdAt": "2026-03-20T10:30:00",
  "updatedAt": "2026-03-23T14:00:00"
}
```

### Create student

```
POST /api/v1/students
Content-Type: application/json
```

```json
{
  "firstName": "Aldongar",
  "lastName": "Nuraskhan",
  "email": "aldongar@sdu.edu.kz",
  "studentId": "SDU_220107",
  "department": "Computer Science",
  "major": "Software Engineering",
  "enrollmentYear": 2022,
  "currentSemester": "SPRING",
  "dateOfBirth": "2002-05-15",
  "phone": "+77001234567",
  "address": "Almaty, Kazakhstan",
  "studentSyllabi": [
    {
      "syllabusId": 1,
      "expectedGrade": "A+",
      "notes": "Focus on trees"
    }
  ],
  "studentCareers": [
    {
      "profession": "Backend Developer",
      "description": "Server-side apps",
      "requiredSkills": "Java, Spring"
    }
  ]
}
```

**Response:** `201 Created` with body = student ID (Long)

**Required fields:** `firstName`, `lastName`, `email`, `studentId`

**Semester enum values:** `FALL`, `SPRING`, `SUMMER`

### Update student

```
PUT /api/v1/students/{id}
Content-Type: application/json
```

Same body as Create. Replaces syllabi and careers entirely.

### Delete student

```
DELETE /api/v1/students/{id}
```

**Response:** `204 No Content`

---

## 3. Syllabi (Courses)

### Get all syllabi

```
GET /api/v1/syllabi
```

### Get syllabus by ID

```
GET /api/v1/syllabi/{id}
```

### Get by course code

```
GET /api/v1/syllabi/by-course-code/{courseCode}
```

### Response

```json
{
  "id": 1,
  "courseCode": "CS301",
  "title": "Data Structures",
  "description": "Study of fundamental data structures...",
  "credits": 4,
  "department": "Computer Science",
  "instructor": "Dr. Smith",
  "prerequisites": "CS101, CS201",
  "objectives": "Understand trees, graphs, hash tables...",
  "learningOutcomes": "Students will be able to...",
  "assessmentCriteria": "Midterm 30%, Final 40%, Labs 30%",
  "requiredTextbooks": "CLRS Introduction to Algorithms",
  "recommendedReading": "Sedgewick Algorithms 4th ed",
  "academicYear": "2025-2026",
  "semester": "SPRING",
  "startDate": "2026-02-01",
  "endDate": "2026-06-15",
  "weeklyPlans": [
    {
      "id": 1,
      "weekNumber": 1,
      "topic": "Arrays and Linked Lists",
      "learningObjectives": "Understand linear data structures",
      "lectureContent": "Array internals, linked list types...",
      "practiceContent": "Implement singly/doubly linked list",
      "assignments": "Lab 1: LinkedList implementation",
      "readings": "CLRS Chapter 10"
    }
  ],
  "createdAt": "2026-02-01T09:00:00",
  "updatedAt": "2026-03-15T12:00:00"
}
```

### Create syllabus

```
POST /api/v1/syllabi
Content-Type: application/json
```

```json
{
  "courseCode": "CS301",
  "title": "Data Structures",
  "description": "Study of fundamental data structures...",
  "credits": 4,
  "department": "Computer Science",
  "instructor": "Dr. Smith",
  "prerequisites": "CS101",
  "objectives": "...",
  "learningOutcomes": "...",
  "assessmentCriteria": "Midterm 30%, Final 40%, Labs 30%",
  "requiredTextbooks": "CLRS",
  "recommendedReading": "Sedgewick",
  "academicYear": "2025-2026",
  "semester": "SPRING",
  "startDate": "2026-02-01",
  "endDate": "2026-06-15",
  "weeklyPlans": [
    {
      "weekNumber": 1,
      "topic": "Arrays and Linked Lists",
      "learningObjectives": "...",
      "lectureContent": "...",
      "practiceContent": "...",
      "assignments": "Lab 1",
      "readings": "CLRS Ch.10"
    }
  ]
}
```

**Required fields:** `courseCode`, `title`, `credits`
**Weekly plan required:** `weekNumber` (1-15), `topic`

---

## 4. Weekly Planner

### Get tasks by student + week

```
GET /api/v1/weekly/students/{studentId}/weeks/{weekNumber}
```

### Response

```json
{
  "studentId": 1,
  "studentFirstName": "Aldongar",
  "studentLastName": "Nuraskhan",
  "weekNumber": 3,
  "courses": [
    {
      "syllabusId": 1,
      "courseCode": "CS301",
      "courseTitle": "Data Structures",
      "department": "Computer Science",
      "instructor": "Dr. Smith",
      "credits": 4,
      "semester": "SPRING",
      "expectedGrade": "A+",
      "tasks": [
        {
          "id": 12,
          "title": "Lab 3: Binary Trees",
          "description": "Implement BST with insert, delete, search",
          "instructions": "Use Java, submit via GitHub",
          "taskType": "LAB",
          "status": "PENDING",
          "dueDate": "2026-03-28",
          "maxScore": 20,
          "score": null,
          "feedback": null,
          "submissionUrl": null,
          "submittedAt": null,
          "createdAt": "2026-03-20T10:00:00"
        }
      ]
    }
  ]
}
```

### Task types

`HOMEWORK`, `LAB`, `PROJECT`, `QUIZ`, `MIDTERM`, `FINAL`, `PRESENTATION`, `ESSAY`

### Task statuses

`PENDING`, `IN_PROGRESS`, `SUBMITTED`, `GRADED`, `RETURNED`, `OVERDUE`

### What to render

- Tab/dropdown to select week (1-15)
- Course cards with grade badge
- Task list under each course with status chips and due date countdown
- Color coding: `OVERDUE` = red, `PENDING` = yellow, `SUBMITTED/GRADED` = green

---

## 5. AI Weekly Organizer

### Generate organizer (calls OpenAI)

```
POST /api/v1/weekly/students/{studentId}/weeks/{weekNumber}/organize
```

**Takes 5-15 seconds** (AI generation). Show a loading spinner.

### Get saved organizer

```
GET /api/v1/weekly/students/{studentId}/weeks/{weekNumber}/organize
```

### Response

```json
{
  "studentId": 1,
  "weekNumber": 3,
  "weeklySummary": "Moderate week with 2 labs and a quiz. Front-load heavy tasks Mon-Wed.",
  "dailyPlans": [
    {
      "day": "Monday",
      "timeBlocks": [
        {
          "startTime": "09:00",
          "endTime": "10:30",
          "taskTitle": "Lab 3: Binary Trees",
          "courseCode": "CS301",
          "courseName": "Data Structures",
          "activityType": "DEEP_WORK",
          "effortLevel": "HIGH_FOCUS",
          "focusTip": "Break into subtasks: BST insert first, then delete",
          "estimatedMinutes": 90
        },
        {
          "startTime": "10:30",
          "endTime": "10:45",
          "taskTitle": "Break",
          "courseCode": null,
          "courseName": null,
          "activityType": "BREAK",
          "effortLevel": "REST",
          "focusTip": "Walk outside, stretch, hydrate",
          "estimatedMinutes": 15
        }
      ],
      "dailyTip": "Start strong — tackle the hardest coding task first while fresh"
    }
  ],
  "additionalTasks": [
    {
      "courseCode": "CS301",
      "courseName": "Data Structures",
      "expectedGrade": "A+",
      "taskTitle": "Extra: Solve 5 tree problems on LeetCode",
      "description": "Medium difficulty: validate BST, level-order traversal, max depth",
      "reason": "Targeting A+ — need practice beyond lab assignments to master edge cases",
      "activityType": "PRACTICE",
      "effortLevel": "MODERATE",
      "estimatedMinutes": 60
    }
  ],
  "wellBeing": {
    "activeRestSuggestions": [
      "15-min walk between morning study blocks",
      "Light stretching after 90 min of coding"
    ],
    "breakStrategies": [
      "Pomodoro 25/5 for heavy tasks",
      "Take a full 30-min lunch break away from screen"
    ],
    "nutritionTips": [
      "Stay hydrated — keep water bottle at desk",
      "Snack on nuts/fruits during breaks, not sugar"
    ],
    "sleepRecommendations": [
      "Wind down by 22:00 on heavy days",
      "No screens 30 min before sleep"
    ],
    "mindfulnessTips": [
      "2-min deep breathing before starting study",
      "End each study day with 5-min reflection"
    ],
    "overallAdvice": "This week is manageable. Focus Mon-Wed, keep Thu-Fri lighter for review."
  },
  "generatedAt": "2026-03-23T14:30:00"
}
```

### Activity types

`DEEP_WORK`, `LIGHT_REVIEW`, `PRACTICE`, `READING`, `BREAK`, `ACTIVE_REST`

### Effort levels

`HIGH_FOCUS`, `MODERATE`, `LOW_EFFORT`, `REST`

### What to render

| Component | Data |
|-----------|------|
| Week summary banner | `weeklySummary` |
| Day tabs (Mon-Sun) | `dailyPlans[].day` |
| Timeline / calendar view | `dailyPlans[].timeBlocks[]` — color by `effortLevel` |
| Daily tip callout | `dailyPlans[].dailyTip` |
| Additional tasks section | `additionalTasks[]` — show `reason` as tooltip |
| Well-being sidebar/cards | `wellBeing.*` — icons per category |
| "Regenerate" button | POST again to replace |

### Color scheme suggestion

| effortLevel | Color |
|-------------|-------|
| `HIGH_FOCUS` | Red / Orange |
| `MODERATE` | Blue |
| `LOW_EFFORT` | Green |
| `REST` | Gray / Light purple |

---

## 6. AI Career Cards

### Generate career cards (calls OpenAI)

```
POST /api/v1/careers/students/{studentId}/generate
```

**Takes 5-15 seconds.** Show loading. Replaces existing cards.

### Get saved career cards

```
GET /api/v1/careers/students/{studentId}
```

Returns basic info only: `{ studentId, studentName, careerCards: [{ id, profession, description, requiredSkills }] }`

### Full AI response (from POST)

```json
{
  "studentId": 1,
  "studentName": "Aldongar Nuraskhan",
  "major": "Software Engineering",
  "careerCards": [
    {
      "profession": "Backend Developer",
      "description": "Designs and builds server-side applications, APIs, and microservices...",
      "requiredSkills": "Java, Spring Boot, SQL, REST APIs, Docker, Kubernetes",
      "industryDomain": "Software Engineering / FinTech",
      "seniorityPath": "Junior (0-2y) → Mid (2-4y) → Senior (4-7y) → Staff (7-10y) → Principal",
      "averageSalaryRange": "$65,000 - $160,000",
      "demandLevel": "HIGH",
      "matchingCourses": ["CS301 - Data Structures", "CS401 - Databases", "CS501 - Software Engineering"],
      "matchPercentage": 92,
      "strengthAreas": [
        "Strong algorithmic foundation from CS301 (A+)",
        "Database design skills from CS401 (A)"
      ],
      "gapAreas": [
        "No cloud/DevOps coursework yet",
        "Missing system design experience"
      ],
      "recommendedActions": [
        "Build a REST API project with Spring Boot + PostgreSQL",
        "Learn Docker basics (2-week course)",
        "Contribute to an open-source Java project"
      ],
      "whyThisFits": "Your strong CS301 (A+) and CS401 (A) grades show natural backend aptitude. Combined with your SE major, backend development is a high-demand path with excellent growth."
    }
  ],
  "generatedAt": "2026-03-23T14:45:00"
}
```

### Demand levels

`HIGH`, `MEDIUM`, `LOW`, `EMERGING`

### What to render

| Component | Data |
|-----------|------|
| Career card | `profession` as title, `description` as body |
| Match badge | `matchPercentage` — circular progress (green >80%, yellow >60%, red <60%) |
| Demand chip | `demandLevel` — colored badge |
| Salary range | `averageSalaryRange` |
| Growth path | `seniorityPath` — horizontal stepper/timeline |
| Matching courses | `matchingCourses[]` — tag list |
| Strengths | `strengthAreas[]` — green checkmarks |
| Gaps | `gapAreas[]` — orange warning icons |
| Actions | `recommendedActions[]` — checklist |
| Fit explanation | `whyThisFits` — highlighted quote block |
| "Regenerate" button | POST again |

---

## 7. AI Chat (WebSocket)

### Connection

```javascript
import SockJS from 'sockjs-client/dist/sockjs'
import { Client } from '@stomp/stompjs'

const stompClient = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8070/ws/chat'),
  reconnectDelay: 5000,
  onConnect: () => {
    console.log('Connected')

    // Subscribe to receive AI responses
    stompClient.subscribe('/user/queue/chat', (message) => {
      const response = JSON.parse(message.body)

      switch (response.type) {
        case 'CHUNK':
          // Append text to chat bubble (streaming effect)
          appendToCurrentMessage(response.content)
          break
        case 'DONE':
          // AI finished responding
          finishCurrentMessage()
          break
        case 'ERROR':
          // Show error
          showError(response.content)
          break
      }
    })
  }
})

stompClient.activate()
```

### Send message

```javascript
function sendMessage(studentId, text) {
  stompClient.publish({
    destination: '/app/chat',
    body: JSON.stringify({
      studentId: studentId,
      message: text
    })
  })
}
```

### Response types

```json
{ "content": "Based on your",  "type": "CHUNK", "timestamp": "2026-03-23T14:50:00" }
{ "content": " CS301 course",  "type": "CHUNK", "timestamp": "2026-03-23T14:50:00" }
{ "content": "",               "type": "DONE",  "timestamp": "2026-03-23T14:50:01" }
{ "content": "Error message",  "type": "ERROR", "timestamp": "2026-03-23T14:50:01" }
```

### What to render

- Chat window with message bubbles (user on right, AI on left)
- AI message builds up character by character as CHUNK messages arrive
- Show typing indicator until DONE
- Input field with send button at bottom
- Suggested questions: "How should I prepare for my midterm?", "What career fits me best?", "Plan my study week"

### Important notes

- The AI knows the student's profile, courses, grades, and career cards automatically
- Each message is independent (no conversation history stored server-side)
- No authentication required currently — `studentId` identifies the context

---

## 8. Enums Reference

### Semester

```
FALL | SPRING | SUMMER
```

### TaskType

```
HOMEWORK | LAB | PROJECT | QUIZ | MIDTERM | FINAL | PRESENTATION | ESSAY
```

### TaskStatus

```
PENDING | IN_PROGRESS | SUBMITTED | GRADED | RETURNED | OVERDUE
```

### ActivityType (AI organizer)

```
DEEP_WORK | LIGHT_REVIEW | PRACTICE | READING | BREAK | ACTIVE_REST
```

### EffortLevel (AI organizer)

```
HIGH_FOCUS | MODERATE | LOW_EFFORT | REST
```

### DemandLevel (AI careers)

```
HIGH | MEDIUM | LOW | EMERGING
```

---

## 9. Suggested Vue Pages & Routes

```javascript
const routes = [
  { path: '/',                    name: 'Dashboard',   component: DashboardPage },
  { path: '/profile',             name: 'Profile',     component: ProfilePage },
  { path: '/weekly/:week',        name: 'Weekly',      component: WeeklyPage },
  { path: '/weekly/:week/plan',   name: 'WeeklyPlan',  component: WeeklyPlanPage },
  { path: '/careers',             name: 'Careers',     component: CareersPage },
  { path: '/chat',                name: 'Chat',        component: ChatPage },
  { path: '/courses',             name: 'Courses',     component: CoursesPage },
  { path: '/courses/:id',         name: 'CourseDetail', component: CourseDetailPage },
]
```

### API calls per page

| Page | API Calls |
|------|-----------|
| Dashboard | `GET /dashboard/students/{id}?week=N` |
| Profile | `GET /students/{id}`, `PUT /students/{id}` |
| Weekly | `GET /weekly/students/{id}/weeks/{week}` |
| Weekly Plan | `GET .../organize` or `POST .../organize` |
| Careers | `GET /careers/students/{id}` or `POST /careers/students/{id}/generate` |
| Chat | WebSocket `/ws/chat` |
| Courses | `GET /syllabi` |
| Course Detail | `GET /syllabi/{id}` |

---

## 10. NPM Packages

```bash
npm install axios @stomp/stompjs sockjs-client
npm install vue-chartjs chart.js        # for dashboard charts
npm install -D tailwindcss              # or: npm install vuetify
```

### Axios setup

```javascript
// src/api/index.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8070/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

export default api
```

```javascript
// Usage
import api from '@/api'

const { data } = await api.get(`/dashboard/students/${studentId}?week=${week}`)
const { data } = await api.post(`/weekly/students/${studentId}/weeks/${week}/organize`)
const { data } = await api.post(`/careers/students/${studentId}/generate`)
```