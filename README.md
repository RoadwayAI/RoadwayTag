# Roadway Attribution Tag (`tag.js`)

## 1. Why this matters (plain English)

1. Why this matters
Growth marketing teams need to attribute customers across all key growth metrics in order to effectively spend time and budgets. The lack of tools and integrations to pass the right IDs across data platforms to attribute every customer touchpoint across those metrics is the main reason why companies rarely do this. The **Roadway Attribution Tag** bridges the gap—starting with passing anonymousIDs to CRMs to enable end-to-end marketing attribution on sales funnel metrics. It works like this:


* **Before the form** – captures the anonymous ID your analytics tool (GA4 or Segment) assigns to each browser.  
* **During the form** – writes that ID into hidden form fields automatically.  
* **After the form** – when the submission becomes a CRM contact and lands in your data warehouse, you can join the visitor’s pre-signup behavior to the new customer record.

**Result:** full-funnel reporting that shows *which channels and campaigns actually turn visitors into revenue.*

---

## 2. How it works (technical overview)

| Step | What happens | Key functions |
|------|--------------|---------------|
| **1. Detect IDs** | Reads:<br>• **GA4 `user_pseudo_id`** – parsed from the browser’s `_ga` cookie<br>• **Segment anonymousId** – pulled via `analytics.user().anonymousId()` | `getUserPseudoId()`  `getSegmentAnonymousId()` |
| **2. Fill forms** | Looks for `<input>` fields named:<br>`ga4_pseudo_user_id`, `user_pseudo_id`, `pseudo_user_id`, `segment_anon_id`, `segment_anon_id__c`.<br>If found, sets their value to the IDs from step 1. | `initializeHubspotFormPseudoIdFillerJob()`  `initializeSegmentAnonymousIdFillerJob()` |
| **3. Send events** | On HubSpot form submit, fires a GA4 event **`hubspot_form_submission`** with the form ID and HubSpot UTK cookie. | `initializeHubspotFormSubmissionListener()` |

Jobs rerun every **1.5 s** until they succeed, so late-loaded forms are still covered.

---

## 3. Quick-start for developers

1. **Insert the script** (in the `<head>` or right before `</body>`):

   ```html
   <script defer src="//analytics.roadwayai.com/tag.js"></script>
   ```

2. **Create two custom properties** on the **Contact** entity in your CRM:

   | Property             | Type             | Purpose                        |
   |----------------------|------------------|--------------------------------|
   | `ga4_pseudo_user_id` | Single-line text | Stores GA4 visitor ID          |
   | `segment_anon_id`    | Single-line text | Stores Segment anonymous ID    |

   *Salesforce users:* append `__c` (e.g. `segment_anon_id__c`) to follow naming rules.

3. **Add hidden inputs** to every form you want attributed:

   ```html
   <input type="hidden" name="ga4_pseudo_user_id">
   <input type="hidden" name="segment_anon_id">
   ```

   *HubSpot forms:* just add these fields in HubSpot; the tag will populate them.

4. **Deploy** — no further frontend work required.

---

## 4. Link the IDs inside your CRM

Create contact properties with the **exact same names** as the form inputs (`ga4_pseudo_user_id`, `segment_anon_id`, etc.).  
This ensures the submitted IDs are stored on the contact record.

→ Detailed instructions:  
[docs.roadwayai.com › Add Anonymous IDs to CRM Contacts](https://docs.roadwayai.com/required-ids-for-attribution/add-anonymous-ids-to-crm-contacts)

---

## 5. Verify the data

1. Submit a form on a page where the tag is installed.  
2. Check your CRM: the new contact should have the ID fields populated.  

---

## 6. FAQ

| Question | Answer |
|----------|--------|
| **Does this slow my site?** | No — the script is loaded with `defer`, so it never blocks rendering. |
| **What about SPAs or late-loaded forms?** | The tag retries every 1.5 s until fields are found and populated. |
| **Does Roadway gets any telemetric data?** | No. There is no data sent to Roadway's server. You can quickly review the code by yourself. It's pretty straight forward. |
| **Can I add other tracking IDs?** | Yes — fork the script and extend the filler logic with more field names. |

---

## 7. Learn more about Roadway AI
Scale ARR profitably with AI growth marketers that use real attribution: [**roadwayai.com**](https://roadwayai)
