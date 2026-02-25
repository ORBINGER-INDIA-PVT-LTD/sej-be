### How your current code “tracks” which `before_img` belongs to which tool

In your `create` code, **the tracking is done by an index mapping**.

You first create this array:

- **`toolStatusRecords`** = same order as `tools_status`
- So:

- tool index `0` → `tools_status[0]` → `toolStatusRecords[0]`
- tool index `1` → `tools_status[1]` → `toolStatusRecords[1]`
- tool index `2` → `tools_status[2]` → `toolStatusRecords[2]`
- …and so on.

Then you upload files and assign URLs into `toolStatusRecords[toolIndex].before_img`.

---

## Case A) You send `before_img_indexes` (recommended for “only damaged tools”)

Example:

- You have 5 tools in `tools_status`
- Only tool **index 1** and **index 3** are damaged
- You upload 2 files: `before_imgs=[fileA, fileB]`
- You also send: `before_img_indexes=[1,3]`

Your code does:

- `idxs = before_img_indexes` → `[1,3]`
- Loop over uploaded files:

**File 0** (`before_imgs[0]`) goes to tool index `idxs[0] = 1`  
→ `toolStatusRecords[1].before_img = uploadedUrlA`

**File 1** (`before_imgs[1]`) goes to tool index `idxs[1] = 3`  
→ `toolStatusRecords[3].before_img = uploadedUrlB`

So the mapping is:  
**file order ↔ index list ↔ tool position in tools_status**

That is exactly how it “tracks”.

---

## Case B) You do NOT send `before_img_indexes`

Then your code assumes **file order = tool order**:

```js
idxs = beforeFiles.map((_, i) => i); // [0,1,2,...]
```

So:

- `before_imgs[0]` → tool index 0
- `before_imgs[1]` → tool index 1
- `before_imgs[2]` → tool index 2

This only works if you upload an image for **every tool in order**.

---

## Important takeaway

### **In your code, the tool is identified by `toolIndex` (array position), not by tool_name or DB id.**

So to track correctly when only some tools have images, you must send:

- `before_img_indexes` for `before_imgs`
- `after_img_indexes` for `after_imgs`

Later, when you fetch the created record, each tool row gets a DB `id` (ToolStatus.id). That’s what you use for PATCH updates like “only update 2 after images”.

If you want, I can show you an exact Postman form-data example for 5 tools with only 2 before images using `before_img_indexes`.
