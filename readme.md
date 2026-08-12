Default Admin Credentials
Field Value
Email admin@admin.com
Password admin123
Emp ID ADMIN001
Role admin

I'll create the Daily Job Plan and Hazards models, controller, and routes for you. Let me set this up:

[12 tools called]

Done! Here's everything I created:

## Files Created

### 1. `src/models/dailyJobPlan.model.js`

| Field              | Type     | Notes                       |
| ------------------ | -------- | --------------------------- |
| id                 | INTEGER  | Primary key, auto-increment |
| permit_no          | STRING   | Unique, required            |
| date               | DATEONLY | Default: today              |
| type_of_work       | STRING   | Required                    |
| name_of_supervisor | STRING   | Required                    |
| sop_number         | STRING   | Required                    |
| job_description    | TEXT     | Required                    |
| user_id            | INTEGER  | Foreign key to users        |

### 2. `src/models/hazard.model.js`

| Field              | Type    | Notes                          |
| ------------------ | ------- | ------------------------------ |
| id                 | INTEGER | Primary key, auto-increment    |
| hazard_description | TEXT    | Required                       |
| necessary_step     | TEXT    | Required                       |
| daily_job_plan_id  | INTEGER | Foreign key to daily_job_plans |

### 3. `src/controllers/dailyJobPlan.controller.js`

- `create` - Create new plan with hazards
- `getMyPlans` - Get logged-in employee's plans
- `getAll` - Get all plans (admin only)
- `getById` - Get single plan by ID
- `update` - Update plan and hazards
- `remove` - Delete plan and its hazards

### 4. `src/routes/dailyJobPlan.routes.js`

---

## API Endpoints

| Method | Endpoint                        | Access                | Description     |
| ------ | ------------------------------- | --------------------- | --------------- |
| POST   | `/api/daily-job-plans`          | Employee, Admin       | Create new plan |
| GET    | `/api/daily-job-plans/my-plans` | Employee, Admin       | Get own plans   |
| GET    | `/api/daily-job-plans/all`      | Admin only            | Get all plans   |
| GET    | `/api/daily-job-plans/:id`      | Employee (own), Admin | Get plan by ID  |
| PUT    | `/api/daily-job-plans/:id`      | Employee (own), Admin | Update plan     |
| DELETE | `/api/daily-job-plans/:id`      | Employee (own), Admin | Delete plan     |

---

## Example Request - Create Daily Job Plan

```json
POST /api/daily-job-plans
Headers: Authorization: Bearer <employee_token>

{
  "permit_no": "PERMIT-2026-001",
  "date": "2026-01-06",
  "type_of_work": "Electrical Maintenance",
  "name_of_supervisor": "John Smith",
  "sop_number": "SOP-EL-001",
  "job_description": "Replace faulty circuit breakers in Panel B",
  "hazards": [
    {
      "hazard_description": "Electrical shock risk",
      "necessary_step": "Ensure power is isolated and LOTO applied"
    },
    {
      "hazard_description": "Arc flash hazard",
      "necessary_step": "Wear appropriate PPE including arc flash suit"
    }
  ]
}
```

## Database Relations

```
User (1) ──────< DailyJobPlan (Many)
                      │
                      └────< Hazard (Many)
```

Restart your server and the new tables will be created automatically! 🚀

## PPE Check list

| Field              | Type     | Notes                       |
| ------------------ | -------- | --------------------------- |
| id                 | INTEGER  | Primary key, auto-increment |
| permit_no          | STRING   | Unique, required            |
| date               | DATEONLY | Default: today              |
| type_of_work       | STRING   | Required                    |
| name_of_supervisor | STRING   | Required                    |
| sop_number         | STRING   | Required                    |
| job_description    | TEXT     | Required                    |
| user_id            | INTEGER  | Foreign key to users        |

Restart your server and the new tables will be created automatically! 🚀

## PPE Check list

I'll create the PPE Checklist feature with the PPEChecklistItem table. Let me set this up:

[9 tools called]

Done! Here's everything I created:

## Files Created

### 1. `src/models/ppeChecklist.model.js`

| Field              | Type     | Notes                       |
| ------------------ | -------- | --------------------------- |
| id                 | INTEGER  | Primary key, auto-increment |
| permit_no          | STRING   | Unique, required            |
| date               | DATEONLY | Default: today              |
| type_of_work       | STRING   | Required                    |
| name_of_supervisor | STRING   | Required                    |
| sop_number         | STRING   | Required                    |
| job_description    | TEXT     | Required                    |
| user_id            | INTEGER  | Foreign key to users        |

### 2. `src/models/ppeChecklistItem.model.js`

| Field                          | Type    | Notes                       |
| ------------------------------ | ------- | --------------------------- |
| id                             | INTEGER | Primary key, auto-increment |
| emp_name                       | STRING  | Required                    |
| safety_shoes                   | BOOLEAN | Default: false              |
| saftey_helmet_with_chain_strap | BOOLEAN | Default: false              |
| safety_ear_plug                | BOOLEAN | Default: false              |
| safety_hand_gloves             | BOOLEAN | Default: false              |
| safety_goggles                 | BOOLEAN | Default: false              |
| safety_florescent_jacket       | BOOLEAN | Default: false              |
| safety_resistant_jacket        | BOOLEAN | Default: false              |
| safety_heat_jacket             | BOOLEAN | Default: false              |
| safety_dust_mask               | BOOLEAN | Default: false              |
| safety_leg_guard               | BOOLEAN | Default: false              |
| safety_face_sheild             | BOOLEAN | Default: false              |
| ppe_checklist_id               | INTEGER | Foreign key                 |

---

## API Endpoints

| Method | Endpoint                         | Access                | Description          |
| ------ | -------------------------------- | --------------------- | -------------------- |
| POST   | `/api/ppe-checklists`            | Employee, Admin       | Create new checklist |
| GET    | `/api/ppe-checklists/my-records` | Employee, Admin       | Get own records      |
| GET    | `/api/ppe-checklists/all`        | Admin only            | Get all records      |
| GET    | `/api/ppe-checklists/:id`        | Employee (own), Admin | Get by ID            |
| PUT    | `/api/ppe-checklists/:id`        | Employee (own), Admin | Update record        |
| DELETE | `/api/ppe-checklists/:id`        | Employee (own), Admin | Delete record        |

---

## Example Request - Create PPE Checklist

```json
POST /api/ppe-checklists
Headers: Authorization: Bearer <employee_token>

{
  "permit_no": "PPE-2026-001",
  "date": "2026-01-06",
  "type_of_work": "Welding Operations",
  "name_of_supervisor": "Mike Johnson",
  "sop_number": "SOP-WD-003",
  "job_description": "Welding work in fabrication area",
  "ppe_checklist_items": [
    {
      "emp_name": "John Doe",
      "safety_shoes": true,
      "saftey_helmet_with_chain_strap": true,
      "safety_ear_plug": true,
      "safety_hand_gloves": true,
      "safety_goggles": true,
      "safety_florescent_jacket": false,
      "safety_resistant_jacket": true,
      "safety_heat_jacket": true,
      "safety_dust_mask": false,
      "safety_leg_guard": true,
      "safety_face_sheild": true
    },
    {
      "emp_name": "Jane Smith",
      "safety_shoes": true,
      "saftey_helmet_with_chain_strap": true,
      "safety_ear_plug": true,
      "safety_hand_gloves": true,
      "safety_goggles": true,
      "safety_florescent_jacket": false,
      "safety_resistant_jacket": true,
      "safety_heat_jacket": false,
      "safety_dust_mask": true,
      "safety_leg_guard": false,
      "safety_face_sheild": true
    }
  ]
}
```

## Database Relations

```
User (1) ──────< PPEChecklist (Many)
                      │
                      └────< PPEChecklistItem (Many)
```

Restart your server and the new tables will be created automatically! 🚀

## Tool Box Tackle

I'll create the Tool Box Tackle feature based on the form in the image. Let me set this up:

[9 tools called]

Done! Here's everything I created based on the form image:

## Files Created

### 1. `src/models/toolBoxTackle.model.js`

| Field                         | Type     | Notes                              |
| ----------------------------- | -------- | ---------------------------------- |
| id                            | INTEGER  | Primary key, auto-increment        |
| date                          | DATEONLY | Default: today                     |
| section                       | STRING   | Required                           |
| department                    | STRING   | Required                           |
| company_supervisor            | STRING   | Required                           |
| safety_representative         | STRING   | Optional                           |
| contractor_representative     | STRING   | Optional                           |
| contract_employees            | TEXT     | Optional                           |
| point_discussed               | TEXT     | Point 1: Safety contact & review   |
| general_safety_items          | TEXT     | Point 2: General safety items      |
| safety_interest_items         | TEXT     | Point 3: Safety interest to group  |
| standard_operating_procedures | TEXT     | Point 4: SOPs                      |
| employee_reminders            | TEXT     | Point 5: Employee responsibilities |
| safety_message_handouts       | TEXT     | Point 6: Safety messages/circulars |
| user_id                       | INTEGER  | Foreign key to users               |

### 2. `src/models/toolBoxTackleAction.model.js` (Point 7)

| Field              | Type    | Notes                       |
| ------------------ | ------- | --------------------------- |
| id                 | INTEGER | Primary key, auto-increment |
| item               | TEXT    | Required                    |
| action_by          | STRING  | Required                    |
| when               | STRING  | Required                    |
| tool_box_tackle_id | INTEGER | Foreign key                 |

---

## API Endpoints

| Method | Endpoint                           | Access                | Description       |
| ------ | ---------------------------------- | --------------------- | ----------------- |
| POST   | `/api/tool-box-tackles`            | Employee, Admin       | Create new record |
| GET    | `/api/tool-box-tackles/my-records` | Employee, Admin       | Get own records   |
| GET    | `/api/tool-box-tackles/all`        | Admin only            | Get all records   |
| GET    | `/api/tool-box-tackles/:id`        | Employee (own), Admin | Get by ID         |
| PUT    | `/api/tool-box-tackles/:id`        | Employee (own), Admin | Update record     |
| DELETE | `/api/tool-box-tackles/:id`        | Employee (own), Admin | Delete record     |

---

## Example Request - Create Tool Box Tackle

```json
POST /api/tool-box-tackles
Headers: Authorization: Bearer <employee_token>

{
  "date": "2026-01-06",
  "section": "Fabrication",
  "department": "Manufacturing",
  "company_supervisor": "John Smith",
  "safety_representative": "Mike Johnson",
  "contractor_representative": "ABC Contractors",
  "contract_employees": "Tom, Jerry, Bob",
  "point_discussed": "Reviewed last meeting safety incidents. No major issues reported.",
  "general_safety_items": "New scaffold erected in Area B. All personnel must use designated walkways.",
  "safety_interest_items": "Red Stripes zone near welding area. Green stripe for safe passage.",
  "standard_operating_procedures": "SOP-WD-001, SOP-EL-003 applicable for today's work.",
  "employee_reminders": "Ensure PPE compliance. No mobile phones in work area. Report near-misses.",
  "safety_message_handouts": "Fire drill scheduled for next week. Emergency assembly point updated.",
  "action_items": [
    {
      "item": "Repair damaged guardrail on Platform 3",
      "action_by": "Maintenance Team",
      "when": "2026-01-07"
    },
    {
      "item": "Replace expired fire extinguisher in Zone A",
      "action_by": "Safety Officer",
      "when": "2026-01-06"
    },
    {
      "item": "Conduct toolbox training for new joiners",
      "action_by": "HR Team",
      "when": "2026-01-10"
    }
  ]
}
```

## Database Relations

```
User (1) ──────< ToolBoxTackle (Many)
                       │
                       └────< ToolBoxTackleAction (Many)
```

Restart your server and the new tables will be created automatically! 🚀
