No errors. Here's a summary of the changes and the curl examples:

---

## What Changed

**Model** — All 22 PPE fields changed from `BOOLEAN` (true/false) to `STRING` (any text, default `""`). Now you can send values like `"ok"`, `"damaged"`, `"na"`, `"yes"`, `"no"`, etc.

**Controller** — `buildItemRecord` now defaults each PPE field to `""` instead of `false`.

---

## Curl API Examples

### CREATE — with images and string PPE values

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

### CREATE — without images

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

### PATCH — update after_images (3 images for item id 5, 2 for item id 6)

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

### PATCH — update only status (no images)

```bash
curl -X PATCH http://localhost:8080/api/ppe-checklists/10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'status=close'
```

---

**Note**: Since the DB columns changed type (BOOLEAN to STRING), Sequelize needs to sync/alter the table. Make sure your server restarts and the table gets updated. If using `{ alter: true }`, it will auto-migrate.
