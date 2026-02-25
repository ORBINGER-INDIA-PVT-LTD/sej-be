## Create

```bash
curl -X POST "http://localhost:3000/api/tool-box-tackle" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "date=2026-01-06" \
  -F "section=Fabrication" \
  -F "department=Manufacturing" \
  -F "company_supervisor=John Smith" \
  -F "safety_representative=Mike Johnson" \
  -F "contractor_representative=ABC Contractors" \
  -F "contract_employees=Tom, Jerry, Bob" \
  -F "point_discussed=Reviewed last meeting safety incidents. No major issues reported." \
  -F "general_safety_items=New scaffold erected in Area B. All personnel must use designated walkways." \
  -F "safety_interest_items=Red Stripes zone near welding area. Green stripe for safe passage." \
  -F "standard_operating_procedures=SOP-WD-001, SOP-EL-003 applicable for today's work." \
  -F "employee_reminders=Ensure PPE compliance. No mobile phones in work area. Report near-misses." \
  -F "safety_message_handouts=Fire drill scheduled for next week. Emergency assembly point updated." \
  -F 'employees=["Rahul","Amit","Suresh"]' \
  -F 'action_items=[{"item":"Repair damaged guardrail on Platform 3","action_by":"Maintenance Team","when":"2026-01-07"}]' \
  -F "employee_group_photo=@/path/to/group.jpg"
```
