# CSV Import Quick Reference

## Quick Start

1. Click **📥 Import** button in header
2. Select import type from 4 options
3. Upload CSV file (drag & drop or browse)
4. Review preview and fix any validation errors
5. Click through mapping and execute steps
6. Review results - undo if needed

## CSV Column Names (Exact Match Required)

### Person & Family Intake

```
Timestamp, Your Name, Person's Full Name, Family Name, Area/Street, Age Group
Phone, Email, School Name, Employment Status, Current Categories
Connected to Activities, Ruhi Level, Home Visit Date, Conversation Topics
Follow-Up Needed, Follow-Up Date, Notes
```

### Activity Attendance

```
Timestamp, Your Name, Activity Name, Activity Type, Date
Facilitator Name, Attendee Names, Total Attendance, New Attendees
Highlights/Notes, Materials Covered
```

### Learning Progress

```
Timestamp, Your Name, Person's Name, Learning Type
Book/Text/Grade Number, Date Completed, Facilitator Name, Next Steps, Notes
```

### Home Visits & Conversations

```
Timestamp, Your Name(s), Family/Person Visited, Area, Visit Date, Purpose
Conversation Topics, Relationships Discovered, Interests Expressed
Next Steps, Follow-Up Date, Follow-Up Completed
```

## Valid Values (Case-Sensitive)

| Field              | Valid Values                              |
| ------------------ | ----------------------------------------- |
| Age Group          | child, JY, youth, adult, elder            |
| Current Categories | JY, CC, Youth, Parents                    |
| Employment Status  | student, employed, unemployed, retired    |
| Activity Type      | JY, CC, StudyCircle, Devotional           |
| Learning Type      | Ruhi Book, JY Text, CC Grade              |
| Purpose            | Introduction, Follow-up, Social, Teaching |
| Follow-Up Needed   | Yes, No, Scheduled                        |

## Date Format

**Use**: `YYYY-MM-DD` (e.g., `2026-02-11`)

## Delimited Fields

**Pipe-delimited** (use `|` for multiple values):

- Current Categories: `JY|Youth|Parents`
- Connected to Activities: `Activity 1|Activity 2|Activity 3`

**Comma-separated** (use `,` for lists):

- Attendee Names: `Maria Garcia, Ali Hassan, Emma Wilson`
- Your Name(s): `John Smith, Sarah Johnson`

## Fuzzy Matching

If exact name not found, system shows similar matches:

- Tolerance for typos: "Maria Grcia" → "Maria Garcia" ✓
- Handles name variations: "John" → "John Smith" ✓
- Multiple results: Review and select best match

## Error Symbols

| Symbol    | Meaning                      |
| --------- | ---------------------------- |
| 🔴 Red    | Error - blocks import        |
| 🟡 Yellow | Warning - review recommended |
| ✓ Green   | Valid row                    |

## What Gets Created vs Updated

### Created

- New Person entities
- New Family entities (if family name not found)
- New Activity entities (if activity name not found)

### Updated

- Existing Person records (adds connections, learning progress)
- Existing Activity records (updates facilitator, notes)
- Existing Family records (links new people)

## Export & Undo

**Download Error Report**:

- Appears after failed import
- CSV format with row numbers
- Use to identify and fix issues

**Undo Import**:

- Available in Step 6 (Review)
- Reverts ALL changes from that import
- One undo per import session

## Limits & Constraints

- **Max rows**: No limit (tested to 10,000+)
- **Name matching**: Case-insensitive, whitespace-trimmed
- **Area matching**: Case-insensitive for Person + Area
- **Activity/Family**: Created if not found (auto-generated IDs)
- **Relationships**: Fuzzy matching at 70% threshold

## Troubleshooting Checklist

- [ ] CSV has correct column names (case-sensitive header row)
- [ ] Required columns all present
- [ ] No empty cells in required fields
- [ ] Dates in YYYY-MM-DD format
- [ ] Enum values exactly match (copy-paste from reference)
- [ ] Names spelled consistently
- [ ] File is valid CSV format (not XLSX)
- [ ] File uses UTF-8 encoding

## Common Errors & Fixes

| Error                         | Fix                                             |
| ----------------------------- | ----------------------------------------------- |
| "Required column X not found" | Check CSV headers match exactly                 |
| "Required field is empty"     | Fill in the value                               |
| "Person X not found"          | Check spelling; system will suggest matches     |
| "Invalid age group"           | Use exact value: child, JY, youth, adult, elder |
| "Invalid date format"         | Use YYYY-MM-DD                                  |
| "Invalid email"               | Enter valid email or leave empty                |
| "Invalid category"            | Use exact value: JY, CC, Youth, Parents         |

## Tips & Best Practices

1. **Start small**: Import 5-10 rows first to test format
2. **Check headers**: Copy exact column names from spec
3. **Consistent names**: Use same spelling throughout CSV
4. **Use areas**: Create area list first for consistency
5. **Backup data**: Export JSON before large imports
6. **Review preview**: Check Step 3 table for obvious errors
7. **Use fuzzy matching**: Typos are auto-corrected
8. **Batch by type**: One import per type for cleaner audit trail

## Support Files

- **CSV_Import_Specifications.md** - Full technical specifications
- **CSV_IMPORT_SYSTEM.md** - Complete documentation with examples
- **Example CSVs** - Sample files in docs/ folder

## Key Insights

✅ **Intelligent**: Fuzzy matching handles typos and variations  
✅ **Safe**: Preview before import, undo available  
✅ **Fast**: Bulk operations in seconds  
✅ **Flexible**: 4 import types cover all data entry scenarios  
✅ **Reliable**: Comprehensive validation prevents data corruption
