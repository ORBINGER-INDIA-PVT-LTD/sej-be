# PPE Checklist API – Form-Data (cURL & Postman)

Base URL: `http://localhost:3000`  
Create/Update use **multipart/form-data** (for `before_imgs` and `after_imgs`).  
All endpoints need: **Authorization: Bearer \<your_jwt_token\>**

---

## Create PPE Checklist (POST)

**Endpoint:** `POST /api/ppe-checklists`  
**Content-Type:** `multipart/form-data`  
**Note:** `before_imgs` and `after_imgs` are **optional**. Omit them to create without images; missing slots are stored as empty strings in the DB.

### Form fields

| Key                 | Type        | Example                                 |
| ------------------- | ----------- | --------------------------------------- |
| permit_no           | Text        | PPE-2026-001                            |
| date                | Text        | 2026-01-06                              |
| type_of_work        | Text        | Welding Operations                      |
| name_of_supervisor  | Text        | Mike Johnson                            |
| sop_number          | Text        | SOP-WD-003                              |
| job_description     | Text        | Welding work in fabrication area        |
| status              | Text        | open or close (optional, default: open) |
| ppe_checklist_items | Text (JSON) | See below                               |

**ppe_checklist_items** is a **single JSON string** (one form field). If you send images, their order must match the items (1st file = 1st employee). You can omit all `before_imgs` and `after_imgs` to create with no images.

---

### cURL (Create)

```bash
curl -X POST "http://localhost:3000/api/ppe-checklists" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "permit_no=PPE-2026-001" \
  -F "date=2026-01-06" \
  -F "type_of_work=Welding Operations" \
  -F "name_of_supervisor=Mike Johnson" \
  -F "sop_number=SOP-WD-003" \
  -F "job_description=Welding work in fabrication area" \
  -F "status=open" \
  -F 'ppe_checklist_items=[{"emp_name":"John Doe","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":true,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":true,"safety_dust_mask":false,"safety_leg_guard":true,"safety_face_sheild":true},{"emp_name":"Jane Smith","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":true,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":false,"safety_dust_mask":true,"safety_leg_guard":false,"safety_face_sheild":true}]' \
  -F "before_imgs=@/path/to/john_before.jpg" \
  -F "before_imgs=@/path/to/jane_before.jpg" \
  -F "after_imgs=@/path/to/john_after.jpg" \
  -F "after_imgs=@/path/to/jane_after.jpg"
```

### cURL (Create) with index

```bash
curl -X POST "http://localhost:3000/api/ppe-checklists" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "permit_no=PPE-2026-001" \
  -F "date=2026-01-06" \
  -F "type_of_work=Welding Operations" \
  -F "name_of_supervisor=Mike Johnson" \
  -F "sop_number=SOP-WD-003" \
  -F "job_description=Welding work in fabrication area" \
  -F "status=open" \
  -F 'ppe_checklist_items=[{"emp_name":"John","safety_shoes":true,...},{"emp_name":"Jane","safety_shoes":true,...},{"emp_name":"Bob","safety_shoes":true,...},{"emp_name":"Tom","safety_shoes":false,...}]' \
  -F 'before_img_indexes=[1,3]' \
  -F "before_imgs=@/path/to/jane_before.jpg" \
  -F "before_imgs=@/path/to/tom_before.jpg"
```

### cURL (Create) with index & New Fields

```bash
curl -X POST http://localhost:8080/api/ppe-checklists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'permit_no=PPE-2026-010' \
  -F 'date=2026-01-06' \
  -F 'type_of_work=Welding Operations' \
  -F 'name_of_supervisor=Mike Johnson' \
  -F 'sop_number=SOP-WD-003' \
  -F 'job_description=Welding work in fabrication area' \
  -F 'status=open' \
  -F 'ppe_checklist_items=[{"emp_name":"John Doe","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":true,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":true,"safety_dust_mask":false,"safety_leg_guard":true,"safety_face_sheild":true,"cutting_goggles":false,"fire_resistant_trouser":true,"cotton_hand_gloves":false,"nitrile_hand_gloves":false,"leather_hand_gloves":true,"cut_resistant_hand_gloves":false,"welding_shield":true,"apron":true,"neck_guard":false,"full_body_harness":false,"co_gas_detector":true},{"emp_name":"Jane Smith","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":true,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":false,"safety_dust_mask":true,"safety_leg_guard":false,"safety_face_sheild":true,"cutting_goggles":true,"fire_resistant_trouser":false,"cotton_hand_gloves":true,"nitrile_hand_gloves":false,"leather_hand_gloves":false,"cut_resistant_hand_gloves":true,"welding_shield":false,"apron":false,"neck_guard":true,"full_body_harness":true,"co_gas_detector":false}]' \
  -F 'before_img_indexes=[0,0,0,1,1]' \
  -F 'before_imgs=@/path/to/john_img1.jpg' \
  -F 'before_imgs=@/path/to/john_img2.jpg' \
  -F 'before_imgs=@/path/to/john_img3.jpg' \
  -F 'before_imgs=@/path/to/jane_img1.jpg' \
  -F 'before_imgs=@/path/to/jane_img2.jpg'
```

### cURL (Create) without any images (all fields optional)

```bash
curl -X POST http://localhost:8080/api/ppe-checklists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'permit_no=PPE-2026-011' \
  -F 'date=2026-01-06' \
  -F 'type_of_work=Welding Operations' \
  -F 'name_of_supervisor=Mike Johnson' \
  -F 'sop_number=SOP-WD-003' \
  -F 'job_description=Welding work in fabrication area' \
  -F 'ppe_checklist_items=[{"emp_name":"John Doe","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":false,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":true,"safety_dust_mask":false,"safety_leg_guard":true,"safety_face_sheild":true,"cutting_goggles":false,"fire_resistant_trouser":true,"cotton_hand_gloves":false,"nitrile_hand_gloves":false,"leather_hand_gloves":true,"cut_resistant_hand_gloves":false,"welding_shield":true,"apron":true,"neck_guard":false,"full_body_harness":false,"co_gas_detector":true}]'
```

### cURL (Create) New All String Fields

```bash
curl -X POST http://localhost:8080/api/ppe-checklists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'permit_no=PPE-2026-020' \
  -F 'date=2026-01-06' \
  -F 'type_of_work=Welding Operations' \
  -F 'name_of_supervisor=Mike Johnson' \
  -F 'sop_number=SOP-WD-003' \
  -F 'job_description=Welding work in fabrication area' \
  -F 'status=open' \
  -F 'ppe_checklist_items=[{"emp_name":"John Doe","safety_shoes":"ok","saftey_helmet_with_chain_strap":"ok","safety_ear_plug":"ok","safety_hand_gloves":"ok","safety_goggles":"ok","safety_florescent_jacket":"na","safety_resistant_jacket":"ok","safety_heat_jacket":"ok","safety_dust_mask":"na","safety_leg_guard":"ok","safety_face_sheild":"ok","cutting_goggles":"na","fire_resistant_trouser":"ok","cotton_hand_gloves":"na","nitrile_hand_gloves":"na","leather_hand_gloves":"ok","cut_resistant_hand_gloves":"na","welding_shield":"ok","apron":"ok","neck_guard":"na","full_body_harness":"na","co_gas_detector":"ok"},{"emp_name":"Jane Smith","safety_shoes":"ok","saftey_helmet_with_chain_strap":"ok","safety_ear_plug":"ok","safety_hand_gloves":"ok","safety_goggles":"ok","safety_florescent_jacket":"na","safety_resistant_jacket":"ok","safety_heat_jacket":"na","safety_dust_mask":"ok","safety_leg_guard":"na","safety_face_sheild":"ok","cutting_goggles":"ok","fire_resistant_trouser":"na","cotton_hand_gloves":"ok","nitrile_hand_gloves":"na","leather_hand_gloves":"na","cut_resistant_hand_gloves":"ok","welding_shield":"na","apron":"na","neck_guard":"ok","full_body_harness":"ok","co_gas_detector":"na"}]' \
  -F 'before_img_indexes=[0,0,0,1,1]' \
  -F 'before_imgs=@/path/to/john_img1.jpg' \
  -F 'before_imgs=@/path/to/john_img2.jpg' \
  -F 'before_imgs=@/path/to/john_img3.jpg' \
  -F 'before_imgs=@/path/to/jane_img1.jpg' \
  -F 'before_imgs=@/path/to/jane_img2.jpg'
```

Replace `YOUR_JWT_TOKEN` and the `@/path/to/...` paths with your token and image paths.

---

### Postman (Create)

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/ppe-checklists` (or `{{baseUrl}}/api/ppe-checklists`)
3. **Headers:**
   - `Authorization`: `Bearer {{token}}`
4. **Body** → **form-data**:

| KEY                 | TYPE | VALUE                                    |
| ------------------- | ---- | ---------------------------------------- |
| permit_no           | Text | PPE-2026-001                             |
| date                | Text | 2026-01-06                               |
| type_of_work        | Text | Welding Operations                       |
| name_of_supervisor  | Text | Mike Johnson                             |
| sop_number          | Text | SOP-WD-003                               |
| job_description     | Text | Welding work in fabrication area         |
| status              | Text | open                                     |
| ppe_checklist_items | Text | (paste the JSON below)                   |
| before_imgs         | File | Select file (add 2 rows for 2 employees) |
| before_imgs         | File | Select file                              |
| after_imgs          | File | Select file                              |
| after_imgs          | File | Select file                              |

**Value for `ppe_checklist_items` (paste as one line or pretty-printed):**

```json
[
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
```

**Single-line version** (for Postman/cURL):

```
[{"emp_name":"John Doe","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":true,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":true,"safety_dust_mask":false,"safety_leg_guard":true,"safety_face_sheild":true},{"emp_name":"Jane Smith","safety_shoes":true,"saftey_helmet_with_chain_strap":true,"safety_ear_plug":true,"safety_hand_gloves":true,"safety_goggles":true,"safety_florescent_jacket":false,"safety_resistant_jacket":true,"safety_heat_jacket":false,"safety_dust_mask":true,"safety_leg_guard":false,"safety_face_sheild":true}]
```

---

### cURL (Update) with item index

```bash
curl -X PATCH "http://localhost:3000/api/ppe-checklists/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F 'after_img_ppe_item_ids=[12,15]' \
  -F "after_imgs=@/path/to/jane_after.jpg" \
  -F "after_imgs=@/path/to/tom_after.jpg"
```

### PATCH — update after_images for specific items (3 images for item id 3, 2 for item id 4)

```bash
curl -X PATCH http://localhost:8080/api/ppe-checklists/8 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'status=close' \
  -F 'after_img_ppe_item_ids=[3,3,3,4,4]' \
  -F 'after_imgs=@/path/to/item3_after1.jpg' \
  -F 'after_imgs=@/path/to/item3_after2.jpg' \
  -F 'after_imgs=@/path/to/item3_after3.jpg' \
  -F 'after_imgs=@/path/to/item4_after1.jpg' \
  -F 'after_imgs=@/path/to/item4_after2.jpg'
```

### Notes

- **Order:** 1st `before_imgs` file = 1st item in `ppe_checklist_items`, 2nd file = 2nd item, and same for `after_imgs`.
- **Optional images:** If you don’t send a file for a slot, the server stores an empty string for that `before_img`/`after_img`.
- **Upload failure:** If any image upload to S3 fails, the API returns **400** and does **not** create the PPE checklist.

PATCH — update after_images (3 images for item id 5, 2 for item id 6)

```bash
curl -X PATCH http://localhost:8080/api/ppe-checklists/10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'status=close' \
  -F 'after_img_ppe_item_ids=[5,5,5,6,6]' \
  -F 'after_imgs=@/path/to/item5_after1.jpg' \
  -F 'after_imgs=@/path/to/item5_after2.jpg' \
  -F 'after_imgs=@/path/to/item5_after3.jpg' \
  -F 'after_imgs=@/path/to/item6_after1.jpg' \
  -F 'after_imgs=@/path/to/item6_after2.jpg'
```

CREATE — without images

```bash
curl -X POST http://localhost:8080/api/ppe-checklists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'permit_no=PPE-2026-021' \
  -F 'date=2026-01-06' \
  -F 'type_of_work=Welding Operations' \
  -F 'name_of_supervisor=Mike Johnson' \
  -F 'sop_number=SOP-WD-003' \
  -F 'job_description=Welding work in fabrication area' \
  -F 'ppe_checklist_items=[{"emp_name":"John Doe","safety_shoes":"ok","saftey_helmet_with_chain_strap":"ok","safety_ear_plug":"na","safety_hand_gloves":"ok","safety_goggles":"ok","safety_florescent_jacket":"na","safety_resistant_jacket":"ok","safety_heat_jacket":"ok","safety_dust_mask":"na","safety_leg_guard":"ok","safety_face_sheild":"ok","cutting_goggles":"na","fire_resistant_trouser":"ok","cotton_hand_gloves":"na","nitrile_hand_gloves":"na","leather_hand_gloves":"ok","cut_resistant_hand_gloves":"na","welding_shield":"ok","apron":"ok","neck_guard":"na","full_body_harness":"na","co_gas_detector":"ok"}]'
```

PATCH — update only status (no images)

```bash
curl -X PATCH http://localhost:8080/api/ppe-checklists/10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'status=close'
```
