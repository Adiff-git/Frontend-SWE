# Feature Specification: Cart API Integration

**Feature Branch**: `003-cart-api-integration`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Connect the existing cart UI (customer storefront, currently using mock data, locate at src/features/customer/cart) to the real backend, keeping its visual design. Source of truth for behavior is docs/openapi.json: the /api/me/cart endpoints. Frontend only. Checkout and order placement are out of scope.

Access: the cart belongs to a signed-in customer. A visitor who is not signed in who opens the cart or tries to add an item is sent to log in and returned to where they were afterwards. If a session expires mid-use, the same happens.

User stories:
1. View my cart: I see each item (image, name, chosen options, unit price, quantity, subtotal), how many items I have, and the totals for the selected items. An empty cart shows a friendly empty state with a link to keep shopping.
2. Add to cart: from product detail I can add a chosen variant with a quantity. Adding the same variant again increases the quantity instead of creating a second row. The cart count in the header updates.
3. Change quantity: I can set quantity from 1 to 999. If there isn't enough stock, I see a clear message and the quantity stays as it was.
4. Switch variant: I can change the variant of an item within the same product (e.g. color or storage). If it matches another row already in the cart, they merge.
5. Select items: I can select or deselect single items or all at once, and only selected items count toward totals. Items that cannot be purchased (out of stock, unavailable) are visibly marked with the reason, cannot be selected, and do not count toward totals.
6. Remove an item.
7. Apply a voucher: I can pick one voucher from my available vouchers, see which ones are not applicable and why, and see the discount and final total. I can remove it. If the system clears my voucher (e.g. selection changed so it no longer qualifies), I am told why.

Edge cases: loading, empty cart, network or server error with retry, stock or price changed since last visit (cart is reconciled on load), item no longer available, rapid repeated clicks, and a failed update must not leave the screen showing a wrong quantity or total.

Where the API has no data for something the current UI shows (e.g. original price, delivery estimate), keep the mock value and mark it with a TODO. Show money amounts exactly as the API returns them; do not recalculate totals on the client."

## Clarifications

### Session 2026-11-26

- Q: Should the cart's displayed item count include every row in the cart or only the selected purchasable rows? → A: Count every row, including unselected and unavailable items.
- Q: What number should appear in the header cart badge when a shopper's cart contains multiple quantities of the same product? → A: Number of distinct cart rows.
- Q: When the cart service supplies a money amount, should shoppers see it in the existing Vietnamese currency style or as raw digits with no formatting? → A: Existing Vietnamese formatting of the supplied amount, such as `30.480.000₫`.
- Q: When loading a cart changes a shopper's previously seen price, stock level or availability, should the cart show a separate notice about the change or only display the reconciled values? → A: Show only the reconciled values and availability reasons, with no separate change notice.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View my cart (Priority: P1)

A signed-in shopper opens the cart and sees the existing cart design filled with the current, authoritative contents of their own cart: each item's image, name, chosen options, unit price, quantity and subtotal; the number of items in the cart; and totals based only on selected items. If the cart is empty, the shopper sees a friendly empty state with a way to continue shopping.

**Why this priority**: This is the core value of the feature: replacing mock rows with the shopper's real cart while preserving the familiar design.

**Independent Test**: Sign in, add or arrange known items in the cart, open the cart page, and verify that every displayed row and total matches the authoritative cart data; then empty the cart and verify the empty state and shopping link.

**Acceptance Scenarios**:

1. **Given** a signed-in shopper with items in the cart, **When** the cart is opened, **Then** every row shows the image, product name, selected options, unit price, quantity and line subtotal supplied by the authoritative cart data, using the existing visual design.
2. **Given** a cart with a mix of selected and unselected rows, **When** the cart is displayed, **Then** the item count includes every row, while every displayed total reflects only the selected, purchasable items and comes directly from the authoritative cart data.
3. **Given** a shopper whose stock, price or availability changed since the previous visit, **When** the cart opens, **Then** the displayed rows, quantities and prices match the reconciled cart data returned at that time, with any availability reason shown on affected rows and no separate change notice required.
4. **Given** an empty cart, **When** the cart opens, **Then** a friendly empty state is displayed with a link that returns the shopper to shopping.
5. **Given** any field that the authoritative cart data does not provide but the existing UI displays, **When** the cart renders, **Then** the previous placeholder value remains visible and is explicitly documented as a temporary placeholder in the source.

---

### User Story 2 - Sign-in required for cart access and add-to-cart (Priority: P1)

The cart belongs to a signed-in shopper. A visitor who opens the cart or tries to add an item is sent to sign in and returned to where they were afterwards. If the session expires while the cart is being used, the shopper is sent to sign in again and returned to the same place after signing in.

**Why this priority**: Without reliable sign-in and return navigation, shoppers cannot trust that their own cart is shown or that an add action completed.

**Independent Test**: As a visitor, open the cart and attempt an add from a product detail page; verify both are redirected to sign-in and returned to the original destination after signing in. Then sign in, expire the session during a cart action, and verify the same return behavior without displaying stale private cart data.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open the cart, **Then** they are sent to sign in and, after signing in successfully, return to the cart.
2. **Given** a visitor who is not signed in, **When** they try to add a product from its detail page, **Then** they are sent to sign in and, after signing in successfully, return to that product detail page with the chosen variant and quantity still available to add.
3. **Given** a signed-in shopper whose session expires during a cart view or update, **When** the expired session is detected, **Then** private cart information is cleared from view, the shopper is sent to sign in, and they return to the interrupted page after signing in.
4. **Given** a shopper who returns from sign-in, **When** the cart or product page loads, **Then** the displayed cart data belongs to the newly signed-in shopper and no data from a previous shopper is shown.

---

### User Story 3 - Add a variant from product detail (Priority: P1)

A signed-in shopper selects a variant and quantity on a product detail page and adds it to the cart. Adding the same variant again increases the existing row's quantity instead of creating a duplicate row, and the cart count in the header updates to the authoritative count.

**Why this priority**: This is the primary way items enter the cart; duplicate rows or a stale header count would directly damage trust.

**Independent Test**: From a product detail page, add a chosen variant, add it again, then check that the cart contains one row with the combined quantity and the header count matches the cart's authoritative item count.

**Acceptance Scenarios**:

1. **Given** a chosen variant and a quantity within the allowed range, **When** the shopper adds it to the cart, **Then** the cart reflects the added item and the header badge matches the authoritative count of distinct cart rows.
2. **Given** the same variant is already in the cart, **When** the shopper adds it again, **Then** the existing row's quantity increases and no second row for that variant appears.
3. **Given** the combined quantity would exceed the allowed maximum or available stock, **When** the shopper adds the item, **Then** no duplicate or invalid row is created and a clear message explains why the add did not complete.
4. **Given** repeated rapid add clicks, **When** the requests settle, **Then** the displayed cart row and header badge match the final authoritative count of distinct cart rows with no duplicated rows or double-counted badge changes.

---

### User Story 4 - Change quantity (Priority: P2)

A shopper can set an item's quantity to any whole number from 1 to 999. If there is not enough stock, the shopper sees a clear message and both the displayed quantity and the totals remain at the last confirmed values.

**Why this priority**: Quantity control is a frequent action and an incorrect quantity or total could mislead a purchase decision.

**Independent Test**: Change a quantity to a valid value, then attempt a value above available stock and observe the message plus unchanged quantity and totals; also test the boundaries 1 and 999.

**Acceptance Scenarios**:

1. **Given** an item with sufficient stock, **When** the shopper sets its quantity to a value between 1 and 999, **Then** the displayed quantity and totals update to the authoritative values returned for that change.
2. **Given** a requested quantity of 0, a negative number, a fraction or a number above 999, **When** the shopper attempts the change, **Then** the change is rejected with a clear message and the displayed quantity stays unchanged.
3. **Given** a requested quantity greater than the available stock, **When** the change fails, **Then** a clear out-of-stock message is shown and the previously confirmed quantity and totals remain displayed.
4. **Given** an update request fails because of a network or server error, **When** the failure is reported, **Then** the UI keeps the last confirmed quantity and totals and offers a way to retry.
5. **Given** rapid repeated quantity changes, **When** all attempts settle, **Then** the displayed quantity and totals match the last successful authoritative result, not an older response.

---

### User Story 5 - Switch a product variant (Priority: P2)

A shopper can change an item to another variant of the same product, such as a different color or storage size. If the target variant is already a separate row in the cart, the two rows merge into one with the combined quantity.

**Why this priority**: Shoppers often change their mind about options; merging prevents the same variant from appearing twice.

**Independent Test**: Put two variants of the same product in the cart, switch one to match the other, and verify that a single row remains with the authoritative merged quantity and totals.

**Acceptance Scenarios**:

1. **Given** an item and another variant of the same product, **When** the shopper switches the item to that variant, **Then** the row shows the new options and any authoritative price or image for that variant.
2. **Given** the target variant already has its own row, **When** the switch is completed, **Then** the rows merge into one row with the authoritative combined quantity and no duplicate remains.
3. **Given** a target variant from a different product or a variant with insufficient stock, **When** the shopper attempts the switch, **Then** the change is rejected with a clear message and the original row remains unchanged.
4. **Given** a failed variant switch, **When** the failure is reported, **Then** the UI continues to show the last confirmed options, quantity and totals.

---

### User Story 6 - Select items and understand unavailable items (Priority: P2)

A shopper can select or deselect an individual item or all available items at once. Only selected, purchasable items contribute to the displayed totals. Items that cannot be purchased are visibly marked with the reason, cannot be selected, and are excluded from totals even if they were previously selected.

**Why this priority**: Selection controls which items are included in totals; showing unavailable items as selectable would misrepresent what can be bought.

**Independent Test**: With a cart containing selected, unselected, out-of-stock and otherwise unavailable rows, toggle single and all-selection controls and verify that unavailable rows cannot be selected and never affect the displayed totals.

**Acceptance Scenarios**:

1. **Given** a purchasable item, **When** the shopper selects or deselects it, **Then** the selection state and the displayed totals match the authoritative cart data.
2. **Given** a cart containing purchasable items, **When** the shopper chooses to select all, **Then** every purchasable item becomes selected and the totals match the authoritative cart data.
3. **Given** a cart containing purchasable items, **When** the shopper chooses to deselect all, **Then** no purchasable item remains selected and the totals reflect no selected items.
4. **Given** an item that is out of stock, has no price, has unavailable inventory or is otherwise unavailable, **When** the cart is displayed, **Then** the item is visibly marked with a clear reason, its selection control cannot be turned on, and it does not contribute to any total.
5. **Given** an item that became unavailable since the last visit, **When** the cart loads, **Then** the reconciled availability reason is shown and the item is excluded from totals.

---

### User Story 7 - Remove items (Priority: P2)

A shopper can remove an individual item from the cart and can remove the currently selected items using the existing bulk action. The cart count and totals update to the authoritative values after removal.

**Why this priority**: Removal is a basic cart control and stale rows would leave incorrect totals.

**Independent Test**: Remove one item and then the selected items, checking that the rows disappear and the count and totals match the authoritative cart each time.

**Acceptance Scenarios**:

1. **Given** a cart with multiple items, **When** the shopper removes one item, **Then** only that row disappears and the count and totals match the authoritative cart data.
2. **Given** one or more selected items, **When** the shopper uses the remove-selected action, **Then** those rows disappear and the count and totals match the authoritative cart data.
3. **Given** no selected items, **When** the shopper looks at the remove-selected action, **Then** it is unavailable.
4. **Given** a failed removal, **When** the failure is reported, **Then** the row remains displayed and no count or total is changed to an unconfirmed value.

---

### User Story 8 - Apply, replace and remove a voucher (Priority: P2)

A signed-in shopper can choose one voucher from their available vouchers, see which vouchers are not applicable and why, and see the discount and final total supplied by the cart service. The shopper can remove the applied voucher. If the cart service clears the voucher because the current selection no longer qualifies, the shopper is told why and sees the updated discount and final total.

**Why this priority**: Voucher preview affects the final amount a shopper expects to pay; hidden ineligibility or a silently removed voucher would be misleading.

**Independent Test**: With vouchers that are applicable and inapplicable, apply one, verify the discount and final total, remove it, then change the selection so the voucher no longer qualifies and verify the reason and updated totals.

**Acceptance Scenarios**:

1. **Given** available vouchers, **When** the voucher picker is opened, **Then** each voucher is shown with its status, and a voucher that is not applicable is shown with the reason supplied for it.
2. **Given** an applicable voucher, **When** the shopper applies it, **Then** only that voucher is applied and the discount and final total match the authoritative cart data.
3. **Given** an applied voucher, **When** the shopper applies a different one, **Then** only the new voucher remains applied and the discount and final total match the authoritative cart data.
4. **Given** an applied voucher, **When** the shopper removes it, **Then** the voucher summary disappears and the discount and final total match the authoritative cart data.
5. **Given** a selection change that makes the applied voucher ineligible, **When** the cart service clears the voucher, **Then** the shopper sees the supplied reason and the updated discount and final total.
6. **Given** an attempt to apply an inapplicable voucher, **When** the attempt is rejected, **Then** the previously applied voucher, if any, remains in effect and a clear reason is shown.

---

### Edge Cases

- **Loading**: While cart data is being loaded, a clear loading state is shown; mock rows are never presented as the shopper's real cart.
- **Empty cart**: An empty cart shows the friendly empty state and a keep-shopping link; selection, quantity and voucher controls do not imply purchasable items exist.
- **Network or server error**: Any failed load or update shows a user-friendly error with a retry action. Retrying a load re-reads current authoritative data; retrying an update re-submits only the shopper's latest intent.
- **Reconciliation on load**: Changed stock, changed price, a reduced quantity, a cleared selection or an unavailable item is displayed exactly as reconciled by the authoritative cart data rather than from a previous local copy; no separate change notice is required, but supplied availability reasons remain visible.
- **Unavailable items**: An unavailable item is visibly marked with its reason, cannot be selected, and is excluded from all totals; it can still be removed.
- **Stock conflicts**: An add, quantity change or variant switch that lacks sufficient stock is rejected with a clear message and does not change the displayed quantity, options or totals.
- **Rapid repeated clicks**: Repeated add, quantity, selection, removal or voucher actions settle on one authoritative result; no duplicate rows, double-applied vouchers or stale values remain visible.
- **Failed or stale updates**: A failed, superseded or out-of-order response never overwrites a newer confirmed quantity, selection, voucher state or total with an incorrect value.
- **Session expiry**: Expiry during a view or action clears private cart data from view, redirects to sign-in and returns the shopper to the interrupted destination afterwards.
- **Money values**: Amounts, subtotals, discounts and final totals use the supplied numeric values from the authoritative cart data, displayed in the existing Vietnamese currency style without client-side arithmetic; no inferred or mock financial value replaces a supplied one.
- **Missing display-only data**: Fields previously shown for design purposes but absent from the authoritative contract keep their existing placeholder values and are visibly documented as temporary placeholders in the source.
- **Out-of-scope checkout**: Existing checkout calls to action remain visually present but must not place an order or start checkout as part of this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The cart MUST display only the signed-in shopper's authoritative cart data; mock rows MUST NOT be presented as real cart contents.
- **FR-002**: For every cart row, the cart MUST display the image, product name, chosen options, unit price, quantity and line subtotal supplied by the authoritative cart data.
- **FR-003**: The cart MUST display an item count that includes every row, including unselected and unavailable items, and MUST display totals for selected items only, using only values supplied by the authoritative cart data.
- **FR-004**: All money amounts MUST use the supplied numeric value from the authoritative cart data and MUST be displayed in the existing Vietnamese currency style; the storefront MUST NOT calculate, change the numeric value of, or infer any subtotal, discount or total on the client.
- **FR-005**: The existing cart visual design, layout and component styling MUST be preserved for all real-data states.
- **FR-006**: An empty cart MUST display a friendly empty state with a link to continue shopping.
- **FR-007**: A visible loading state MUST be shown while cart data is pending, and no previous shopper's or mock data MAY be shown as current during that time.
- **FR-008**: A network or server failure MUST display a user-friendly error message and a retry action that re-reads current cart data.
- **FR-009**: Opening the cart while not signed in MUST send the visitor to sign in and return them to the cart after successful sign-in.
- **FR-010**: Attempting to add an item while not signed in MUST send the visitor to sign in and return them to the product detail page with the chosen variant and quantity still available for the add.
- **FR-011**: Expiry of a session during a cart view or update MUST clear private cart data from view, send the shopper to sign in, and return them to the interrupted destination after successful sign-in.
- **FR-012**: After sign-in following a redirect, the cart MUST show only the newly signed-in shopper's data; no data from a previous session MAY remain visible.
- **FR-013**: A shopper MUST be able to add a selected variant with a quantity from the product detail page.
- **FR-014**: Adding a variant already present in the cart MUST increase that row's quantity rather than create a second row for the same variant.
- **FR-015**: Quantity changes MUST accept only whole numbers from 1 through 999 inclusive.
- **FR-016**: An add or quantity change that exceeds available stock or the maximum allowed quantity MUST be rejected with a clear message and MUST leave the displayed quantity and totals unchanged.
- **FR-017**: A shopper MUST be able to switch an item to another variant of the same product, and a switch to a variant already in the cart MUST merge the rows into one with the authoritative quantity.
- **FR-018**: A rejected variant switch MUST leave the item's original options, quantity and totals unchanged and MUST display a clear reason.
- **FR-019**: A shopper MUST be able to select and deselect an individual purchasable item and select or deselect all purchasable items at once.
- **FR-020**: Only selected, purchasable items MAY contribute to the displayed totals; the displayed item count MUST include all rows regardless of selection or availability.
- **FR-021**: An item that is unavailable, out of stock, missing a price or otherwise not purchasable MUST be visibly marked with a clear reason, MUST NOT be selectable, and MUST NOT contribute to any total.
- **FR-022**: A shopper MUST be able to remove a single item and remove the currently selected items using the existing bulk action.
- **FR-023**: The remove-selected action MUST be unavailable when no items are selected, and a failed removal MUST leave the row, count and totals at their last confirmed values.
- **FR-024**: The header cart badge MUST show the authoritative count of distinct cart rows, not the sum of quantities, after every add, quantity change, variant switch, removal, selection reconciliation and cart load.
- **FR-025**: A shopper MUST be able to view their available vouchers, including each voucher's applicability status and the reason supplied when it is not applicable.
- **FR-026**: A shopper MUST be able to apply one voucher at a time, and the displayed discount and final total MUST match the authoritative cart data after applying it.
- **FR-027**: Applying an inapplicable voucher MUST be rejected with a clear reason and MUST NOT disturb a previously applied voucher.
- **FR-028**: Applying a different voucher MUST replace the previously applied voucher with only the newly selected one.
- **FR-029**: A shopper MUST be able to remove the applied voucher, and the discount and final total MUST match the authoritative cart data afterwards.
- **FR-030**: When the authoritative cart data reports that a voucher was cleared, the cart MUST display the supplied reason and the updated discount and final total.
- **FR-031**: A failed or superseded update MUST NOT leave the screen showing a quantity, selection state, voucher state, count or total that differs from the last successful authoritative result.
- **FR-032**: Rapid repeated actions MUST settle on the latest authoritative result without duplicate rows, double-applied vouchers or stale displayed values.
- **FR-033**: Cart data loaded after a return to the page MUST reflect the reconciled stock, price, availability and selection state supplied at that time, with supplied availability reasons visible where applicable and no separate change notice fabricated.
- **FR-034**: Any display-only value that the authoritative cart data does not supply, such as an original price or delivery estimate, MUST keep its existing placeholder value and MUST be marked with a TODO where it is defined.
- **FR-035**: Checkout and order placement MUST NOT be initiated by any cart interaction in this feature; existing checkout calls to action MUST remain visually unchanged.

### Key Entities *(include if feature involves data)*

- **Cart**: The signed-in shopper's collected items plus the count of all rows, the selected count, selected totals, discount, final total and optional applied voucher.
- **Cart item**: One product-variant row with an identity, product and variant identity, image, name, options, unit price, quantity, selection state, purchasable state, availability reason and line subtotal.
- **Availability information**: The current sellable quantity and status used to mark an item as purchasable or to explain why it is not.
- **Money amount**: An exact value supplied by the authoritative cart data for a unit price, subtotal, discount or total, displayed in the existing Vietnamese currency style; never a client-derived number.
- **Voucher wallet entry**: A voucher available to the shopper with its applicability status and, when inapplicable, the reason.
- **Applied voucher**: The single voucher currently applied to the cart, with its discount and the reason it was cleared if the system removes it.
- **Return destination**: The page and, for an interrupted add, the chosen variant and quantity to restore after sign-in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of displayed cart rows, the count of all rows and the totals match the authoritative cart data returned for the current shopper, with no client-calculated financial values.
- **SC-002**: 100% of money amounts shown in the cart display the supplied numeric value in the existing Vietnamese currency style, without conversion, altered values or inferred amounts.
- **SC-003**: 100% of unauthenticated cart opens and add attempts result in sign-in followed by a return to the original destination; the same is true for session expiry during use.
- **SC-004**: Adding the same variant twice results in exactly one row with the authoritative combined quantity in 100% of trials.
- **SC-005**: Quantities 1 and 999 are accepted when stock permits, while 0, negative, fractional and values above 999 are rejected in 100% of trials; insufficient-stock attempts leave quantity and totals unchanged in 100% of trials.
- **SC-006**: 100% of unavailable items are visibly marked with a reason, cannot be selected and are excluded from all totals.
- **SC-007**: Voucher apply, replace, remove and automatic-clear flows produce the authoritative discount and final total and, when applicable, the supplied reason in 100% of trials.
- **SC-008**: After any failed or out-of-order update, 0 incorrect quantities, selections, voucher states, counts or totals remain visible on the cart screen.
- **SC-009**: A visible loading, empty, error-with-retry and reconciled state is reachable for every corresponding edge case listed above in 100% of test scenarios.
- **SC-010**: For a signed-in shopper on a normal connection, the cart's first visible state appears within 2 seconds at the 95th percentile.
- **SC-011**: The existing cart design is preserved with no unintended visual differences at supported desktop and mobile widths.
- **SC-012**: 100% of fields shown without authoritative data retain their previous placeholder value and have an explicit TODO marking them as temporary.
- **SC-013**: 100% of header badge values match the authoritative count of distinct cart rows after every cart change.

## Assumptions

- The authoritative cart contract defined by the project's OpenAPI document is the source of truth for behavior and data fields; this feature is frontend only.
- The existing sign-in flow can return a shopper to the originating page after authentication; the product detail page can retain the chosen variant and quantity across that round trip.
- The existing header cart icon can be extended with a count badge without changing its overall visual style.
- Unavailable item reasons and voucher ineligibility reasons are shown in clear Vietnamese text derived from the authoritative reason values; no new reason values are invented.
- The existing UI language and visual design, including the static shipping-fee note, remain unchanged; a shipping note with no authoritative field is treated as a documented placeholder.
- No new runtime dependencies, environment variables or backend changes are introduced; the existing shared access path and configuration are reused.
- Checkout and order placement remain out of scope; the existing checkout call to action is not wired to an order in this feature.
- The product detail page already presents variant options and a chosen quantity that can be used as the add-to-cart input.
- In the original request, "show money amounts exactly as supplied" means preserving the supplied numeric value; the existing Vietnamese currency style is retained for display.
- Manual verification is used for UI flows because no automated component-test framework is configured in the project.
