# Product and Integration Notes

## Product scope

WashFlow is a reusable operations app for independent car washes and multi-branch operators. Business name, branch, location, contact, currency, payment details, and receipt text belong to the operator configuration. Seeded records in the current frontend are demonstration data, not a real business account.

## Supabase backend (planned)

- Use Supabase Auth for staff identity and membership.
- Scope every business-owned row to a `business_id`; use a separate `location_id` for branch-specific operations such as bays, cameras, and sales.
- Enforce tenant and role access with Row Level Security. The client must never be treated as the authorization boundary.
- Keep services, customers, vehicle events, sales, sale line items, payment records, and wash-bay state in separate relational records with stable IDs and timestamps.
- Do not connect this demo context directly to production data until schema, migrations, RLS policies, and account onboarding are tested.

## IoT vehicle-entry integration (planned, not connected)

The current camera/detection data and manual add-entry action are local demo behavior. The app must not claim that a camera or IoT device is online until a verified device connection reports that state.

After the camera and automatic plate-recognition device is tested and confirmed working:

1. Send signed/authenticated device events through a trusted ingestion endpoint; do not put Supabase service-role credentials on the device or in the browser.
2. Include a stable event ID, business/location and device IDs, observed timestamp, plate text, confidence, and review status. Store corrections as auditable updates rather than losing the original recognized value.
3. Deduplicate using device event identity and a configurable per-location cooldown, while retaining the source event for audit.
4. Treat an entry as a vehicle-arrival event, not a sale. Staff select or verify the vehicle, record the services provided, and complete payment as a separate POS transaction linked to the arrival when applicable.
5. Test offline buffering, retries, duplicate delivery, low-confidence plates, manual correction, device revocation, and cross-tenant access before enabling live ingestion.
