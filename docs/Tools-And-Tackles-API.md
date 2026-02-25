## Create (POST) – sparse before/after images (only damaged tools)

If only some tools are damaged, you can upload images for only those tools by sending index mapping arrays.

- `before_img_indexes`: JSON array mapping each uploaded `before_imgs` file to a **tool index** in `tools_status`
- `after_img_indexes`: JSON array mapping each uploaded `after_imgs` file to a **tool index** in `tools_status`

Example: 5 tools, only tool index 1 and 3 have before images:

```bash
curl -X POST "http://localhost:3000/api/tools-and-tackles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "permit_no=TAT-2026-001" \
  -F "date=2026-01-06" \
  -F "type_of_work=Mechanical Maintenance" \
  -F "name_of_supervisor=Jane Doe" \
  -F "sop_number=SOP-MM-005" \
  -F "job_description=Pump maintenance in boiler room" \
  -F "status=open" \
  -F 'tools_status=[{"tool_name":"A","tool_status":"Good"},{"tool_name":"B","tool_status":"Damaged"},{"tool_name":"C","tool_status":"Good"},{"tool_name":"D","tool_status":"Damaged"},{"tool_name":"E","tool_status":"Good"}]' \
  -F 'before_img_indexes=[1,3]' \
  -F "before_imgs=@/path/to/b_before.jpg" \
  -F "before_imgs=@/path/to/d_before.jpg"
```

## Full PUT (replaces tools_status)

```bash
curl -X PUT "http://localhost:3000/api/tools-and-tackles/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "status=close" \
  -F 'tools_status=[{"tool_name":"Torque Wrench","tool_status":"Good"},{"tool_name":"Safety Harness","tool_status":"Needs Inspection"},{"tool_name":"Multimeter","tool_status":"Good"}]' \
  -F "before_imgs=@/path/to/before1.jpg" \
  -F "after_imgs=@/path/to/after1.jpg"
```

## PATCH – update status only

```bash
curl -X PATCH "http://localhost:3000/api/tools-and-tackles/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "status=close"
```

## PATCH – update after images only (sparse, by tool_status_id)

1) First, get the tool status ids:

```bash
curl -X GET "http://localhost:3000/api/tools-and-tackles/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response includes `tools_status: [{ id, tool_name, ... }]`. Use those `id`s.

2) Upload after images for only damaged tools:

```bash
curl -X PATCH "http://localhost:3000/api/tools-and-tackles/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F 'after_img_tool_status_ids=[12,15]' \
  -F "after_imgs=@/path/to/b_after.jpg" \
  -F "after_imgs=@/path/to/d_after.jpg"
```

## PATCH – full after-images by index (requires one file per tool)

```bash
curl -X PATCH "http://localhost:3000/api/tools-and-tackles/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "after_imgs=@/path/to/after1.jpg" \
  -F "after_imgs=@/path/to/after2.jpg" \
  -F "after_imgs=@/path/to/after3.jpg"
```
