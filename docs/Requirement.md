# **E-commerce Platform**

# **Vision Document**

# 

# **Version 1.3**

| Section | Task / Content | Writer | Reviewer |
| :---- | :---- | :---- | :---- |
| **1\. Introduction** | Purpose & References | Thành | Huyền |
| **2\. Positioning** | Problem Statement | Thịnh | Thành |
| **2\. Positioning** | Product Position Statement | Thịnh | Thành |
| **3\. Stakeholders** | Stakeholder Summary | Thành | Huyền |
| **3\. Stakeholders** | User Summary & User Environment | Thành | Huyền |
| **3\. Stakeholders** | Key Stakeholder/User Needs | Thành | Kiên |
| **3\. Stakeholders** | Alternatives & Competition | Thành | Huyền |
| **4\. Product Overview** | Product Perspective | Thịnh | Gia |
| **4\. Product Overview** | Assumptions & Dependencies | Thịnh | Kiên |
| **5\. Product Features** | Customer Features | Thành | Kiên |
| **5\. Product Features** | Admin Features | Thành | Huyền |
| **5\. Product Features** | AI Features | Thịnh | Gia |
| **5\. Workflow Diagrams** | Customer Shopping Workflow | Thành | Kiên |
| **5\. Workflow Diagrams** | AI Shopping Agent Workflow | Thịnh | Gia |
| **6\. Non-Functional Requirements** | General System Requirements | Thành | Huyền |
| **6\. Non-Functional Requirements** | AI Quality Requirements | Thịnh | Thành |

### 

# **Revision History**

| Date | Version | Description | Author |
| ----- | ----- | ----- | ----- |
| 28/Oct/26 | 1.0 | Initial Vision Document Draft | Trinh Van Thanh, Le Duc Thinh |
| 30/Oct/26 | 1.1 (Draft) | Integrated assigned Vision sections for team review (SWE-81/82/87/88/91/95) | Le Duc Thinh |
| 30/Oct/26 | 1.2 | Updated NFRs, formatting, document metadata; removed Appendix A | Trinh Van Thanh |
| 30/Oct/26 | 1.3 (Review Draft) | Addressed Trinh Van Thanh's AI scope/API/NFR review comments; pending team decisions | Le Duc Thinh |

# **Table of Contents**

1\.	Introduction	[3](#introduction)

1.1	References	[3](#heading=h.21xnoin12i0p)

2\.	Positioning	[3](#positioning)

2.1	Problem Statement	[3](#problem-statement)  
2.2	Product Position Statement	[3](#product-position-statement)

3\.	Stakeholder and User Descriptions	[3](#stakeholder-and-user-descriptions)

3.1	Stakeholder Summary	[3](#stakeholder-summary)  
3.2	User Summary	[3](#user-summary)  
3.3	User Environment	[3](#user-environment)  
3.4	Summary of Key Stakeholder or User Needs	[3](#heading=h.j0uceeki0kgl)  
3.5	Alternatives and Competition	[3](#alternatives-and-competition)

4\.	Product Overview	[3](#heading=h.6606o6bephdi)

4.1	Product Perspective	[3](#heading=h.yg839kjtdg5y)  
4.2	Assumptions and Dependencies	[3](#heading=h.p2hjrby2f6op)

5\.	Product Features	[3](#product-features)

6\.	Other Product Requirements	[3](#heading=h.vg319yv88u0o)

# **Vision (Small Project)**

1. # **Introduction** {#introduction}

The purpose of this Vision Document is to define the needs, objectives, and key features of the Electronics Store E-Commerce Platform. The system aims to provide an online shopping experience for customers purchasing electronic devices and accessories, particularly those who have limited technical knowledge or difficulty choosing suitable products.

This document identifies the problems addressed by the system, its target users and stakeholders, product positioning, major features, and non-functional requirements. It also establishes a shared understanding of the product vision among the project team and stakeholders.

Detailed functional behavior, technical architecture, and implementation decisions will be addressed in subsequent software specification and design documents.

## **1.1 References**

The following documents serve as references for defining the vision, scope, objectives, stakeholders, and major requirements of the E-commerce Platform.

| No. | Document | Description |
| :---- | :---- | :---- |
| 1 | Project Proposal | Describes the project idea, motivation, objectives, proposed features, and expected outcomes. |
| 2 | Project Plan | Defines the project scope, development schedule, milestones, team responsibilities, and deliverables. |
| 3 | Team Contract | Establishes team roles, responsibilities, communication practices, collaboration rules, and development conventions. |
| 4 | Course Project Requirements | Specifies the academic requirements, expected deliverables, and evaluation criteria for the Software Engineering project. |

2. # **Positioning** {#positioning}

   1. ## **Problem Statement** {#problem-statement}

| The problem of | Customers having difficulty selecting and comparing suitable electronic products and switching between catalog pages, specifications, cart operations, and support channels to complete a purchase. |
| :---- | :---- |
| Affects | Customers with limited technical knowledge, budget-conscious shoppers, returning customers seeking order/stock information, and store staff handling repeated product and order inquiries.  |
| The impact of which is | Lengthy product research, uncertainty about specifications and value, abandoned shopping journeys, possible variant-selection mistakes, and higher manual support workload for store staff.  |
| A successful solution would be | A unified web storefront with reliable catalog data, consistent comparisons, shopping-cart and order management, and context-aware AI guidance grounded in Backend records. Customers retain control of order confirmation and payment. |

   2. ## **Product Position Statement** {#product-position-statement}

| For | Online electronics shoppers and store administrators. |
| :---- | :---- |
| Who | Need reliable products within a budget, understandable technical comparisons, convenient purchases, and efficient management of catalog and orders.  |
| The E-commerce Platform | Electronics Store E-Commerce Platform |
| That | Provides catalog browsing, filtering, product details, comparison, accounts, cart, checkout, and order tracking alongside conversational product discovery, consultation, and selected assisted shopping actions. |
| Unlike | A physical-only store or a catalog-first shopping experience where users must translate their needs into technical filters, navigate numerous pages, or ask staff for help. |
| Our product | Integrates natural-language product advice into the same storefront, uses Backend-owned product and account data for grounded responses, and requires explicit customer confirmation for sensitive actions.  |

Value proposition: Customers can begin with conventional catalog search or the AI Chatbox and proceed to the same verified product pages, cart, and checkout. Recommendations explain relevant trade-offs without inventing prices, stock, specifications, or policy details.

3. # **Stakeholder and User Descriptions** {#stakeholder-and-user-descriptions}

   1. ## **Stakeholder Summary** {#stakeholder-summary}

| Name | Description | Responsibilities |
| :---- | :---- | :---- |
| Store Owner | The business stakeholder responsible for the electronics store. | Defines business needs, product management expectations, and operational priorities. |
| Project Manager | The team member coordinating the development project. | Monitors project progress, coordinates development activities, and manages project documentation. |
| Development Team | Members responsible for frontend, backend, and AI development. | Analyze requirements, implement the application, integrate components, test functionality, and maintain technical quality. |
| Teaching Assistant | Academic stakeholders involved in evaluating the project. | Review project deliverables and evaluate them against course requirements. |

   2. ## **User Summary** {#user-summary}

| Name | Description | Responsibilities | Stakeholder |
| :---- | :---- | :---- | :---- |
| Customer | A person who browses and purchases electronic devices and accessories. | Searches and compares products, manages a cart, places orders, tracks purchases, and submits reviews. | Store Owner |
| Store Administrator | A user responsible for managing the store's online operations. | Manages products, inventory, orders, promotions, customer accounts, and store information. | Store Owner |

   

   3. ## **User Environment** {#user-environment}

   The application is designed as a desktop-oriented web platform accessible through modern browsers, including Google Chrome and Mozilla Firefox, on Windows and Linux. Users require an internet connection to access the store and its online services.

   Customers use the storefront to browse and compare products, manage shopping carts, place orders, and track purchases. Store administrators and authorized staff use a dedicated administration interface to maintain product information, inventory, orders, promotions, and customer-related information.

   The system is intended for customers with varying levels of technical knowledge. Clear navigation, understandable specifications, product comparison tools, and AI-powered guidance are therefore important aspects of its user environment.

   

   4. ## **Summary of Key Stakeholder or User Needs**

   The following needs have been identified from the project proposal and the planned customer, administration, and AI capabilities.

| Stakeholder / User | Key Need | Proposed Solution |
| :---- | :---- | :---- |
| Customer | Find suitable products without extensive technical knowledge. | AI-powered product search and personalized recommendations. |
| Customer | Understand the differences between electronic products. | Side-by-side product comparisons and understandable AI explanations. |
| Customer | Purchase products conveniently without visiting a physical store. | Online shopping cart, checkout, payment, and delivery options. |
| Customer | Monitor the progress of purchased products. | Order history and order tracking. |
| Store Owner | Manage product information, stock levels, and sales efficiently. | Centralized administrative interface and inventory management. |
| Store Administrator | Process orders and manage promotional campaigns. | Order management and promotion management tools. |
| Development Team | Implement and integrate frontend, backend, and AI components consistently. | Shared requirements, interface coordination, testing, and review practices. |

   5. ## **Alternatives and Competition** {#alternatives-and-competition}

The project considers established electronics retail websites as alternatives. The comparison below focuses on their strengths and potential limitations for customers with limited technical knowledge.

| Alternative | Strengths | Limitations for Target Users |
| :---- | :---- | :---- |
| Thế Giới Di Động | Extensive product information, product comparisons, reviews, promotions, and purchasing options. | Numerous promotions and detailed specifications may make product selection demanding for customers with limited technical knowledge. |
| CellphoneS | Product categories, brand and usage-based filters, product comparisons, and an established shopping flow. | Customers may still need to interpret technical specifications and select appropriate search criteria themselves. |

The proposed platform aims to distinguish itself through AI-powered conversational product discovery and simplified comparisons. Customers can describe their needs in everyday language, receive suitable recommendations, and request selected shopping actions. Final order confirmation and payment remain under the customer's control.

4. # **Product Overview**

This section summarizes the platform architecture, external interfaces, and assumptions that shape the planned product capabilities.

1. ## **Product Perspective**

The product is a browser-based e-commerce platform for a single electronics retailer. It includes a customer storefront, a separate administrator interface, a centralized Backend, and a separately deployed AI service. The initial coursework target is a desktop browser experience (Chrome/Firefox on Windows/Linux), with core shopping journeys prioritized ahead of advanced AI automation.

Major subsystems:

• Customer Frontend: homepage, catalog, search/filter, details, comparisons, login, cart, checkout, order history, and AI Chatbox. It renders results and requires explicit confirmations.

• Administrator Frontend: authorized product, stock, promotion, account, review, and order operations.

• Backend: authoritative product IDs, variants, prices, stock, accounts, permissions, carts, and orders; exposes validated REST APIs.

• AI Recommendation service: candidate-product ranking using approved product data and, when authorized, relevant user signals.

• AI Shopping Agent: conversation, intent interpretation, clarification, Backend-approved product tools, comparisons, and supported shopping steps.

• Conditional external services: a configured LLM provider, payment gateway, and email/notification provider.

Proposed integration model (pending joint Frontend/Backend/AI approval): Customer → Frontend → authenticated Backend APIs → authorized AI service and Backend product/cart/order services. The Backend is the boundary for user identity, permissions, request validation, service routing, and error/status normalization; only the minimum authorized user context is passed onward. The AI service does not query the Backend database directly. Frontend and Agent must display API failures or timeouts transparently and provide conventional catalog navigation as fallback. AI-visible product facts must match authoritative Backend records; stock, pricing and permission checks are repeated before any enabled mutation. Final routing, token/session forwarding, and error contracts remain open decisions in Section 4.2.

Permissions and boundaries: Guests may browse public data and receive general advice; authenticated customers may access only their own cart/orders; administrators use role-protected management endpoints. Chat availability must not block ordinary shopping. The current Frontend uses React/Vite; the AI repository uses Python/FastAPI/HTTPX with placeholder endpoints. Grounded LLM/tool features described here are planned, not yet fully implemented.

2. ## **Assumptions and Dependencies**

Assumptions (review baseline):

AS-01 — Product records provide stable IDs, category, price, variant, availability, and sufficient attributes for accurate search/comparison; otherwise affected advice must be limited or labeled incomplete.

AS-02 — The Backend publishes agreed, documented REST API schemas; without these, Frontend/AI can demonstrate only explicitly labeled mock integrations.

AS-03 — Backend authentication and authorization protect every account-specific operation; otherwise the Agent remains public-catalog-only.

AS-04 — Users have internet access and a modern desktop browser; offline use is outside initial scope.

AS-05 — OPEN DEPENDENCY (AI team decision pending): The demo requires an approved LLM provider/model or a suitable local model, but the actual provider, deployment configuration, expected quota/cost, and API limits have not been confirmed. Until selected and tested, the Chatbox may use an explicitly labeled mock/rule-based response or be disabled with normal catalog browsing as fallback; it must not be represented as fully integrated AI. Selection and baseline tests are prerequisites for approving AI-NFR-03 latency targets.

AS-06 — Representative product data and user scenarios exist for test and evaluation; otherwise quality targets remain unevaluated.

AS-07 — Payment, email, and notification services require separately approved credentials and policy agreements.

Dependencies and mitigation:

DP-01 — Backend catalog/search/details/stock APIs (Backend: Gia/Thành; AI integration: Gia/Thịnh): Jointly approve a versioned tool/API contract for stable product\_id and variant\_id, category/brand/specification fields and units, current price/currency, stock/availability, filters, sorting, pagination, authentication/authorization, and structured success/error responses. Define request/response schemas, missing-field behavior, freshness and revalidation rules. Explicitly labeled fixtures are acceptable only for prototype demonstrations; switch to real Backend APIs after contract tests and integration tests pass, and verify displayed AI products against normal catalog results. Final schema and rollout date are pending joint approval.

DP-02 — Identity, session, authorization (Backend: Thành). Keep private cart/order tools disabled until server-side checks pass.

DP-03 — Cart/checkout APIs (Backend). Support preview/confirmation UI first; do not simulate successful orders.

DP-04 — Consent-compliant customer activity data (Backend \+ AI Recommendation: Gia). Use non-personalized recommendations if unavailable.

DP-05 — Chatbox/product cards/compare UI (Frontend: Thịnh/Kiên/Huyền). Develop mock states, then connect validated APIs.

DP-06 — LLM, prompt, orchestration, tool definitions (AI Shopping Agent: Thịnh). Deliver bounded consultation MVP before tool actions.

DP-07 — Provider latency/rate limits/network (AI \+ provider). Use timeouts and normal catalog-search fallback.

DP-08 — Price/stock/product synchronization (Backend \+ AI). Fetch live approved data where possible and revalidate before mutations.

Open decisions for review (not yet approved): (1) Frontend/Backend/AI to confirm the Backend-mediated request path, authenticated identity propagation, timeouts and error schema described in Section 4.1; (2) Backend/AI to approve DP-01 product/variant contracts and the fixture-to-real-API transition; (3) AI to choose model/provider, quota/cost and fallback under AS-05; (4) team to confirm which AF-01–AF-05 capabilities are required for the current demo/sprint and their owners/priority; (5) AI/UX to choose the confirmation expiry window (5 minutes is only a proposal). Assisted cart/order actions remain later-phase options unless explicitly added to scope. Payment and final order confirmation always stay user-controlled.

5. # **Product Features** {#product-features}

## **5.1 Customer Features**

| No. | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| 1 | Authentication | New customers can register with their name, email, and password after account information is validated. Registered customers and administrators can log in and log out securely. The system presents role-appropriate interfaces and provides email-based password recovery. | High |
| 2 | User Profile | Customers can view and update personal details such as their name and phone number. They can save, edit, or delete multiple delivery addresses and select a default address. Logged-in users can change their passwords to maintain account security. | High |
| 3 | Product Browsing | Customers can explore electronic devices and accessories through the store's product catalog and categories. Product listings help shoppers discover available products before opening individual product pages. This supports customers who do not yet have a specific product model in mind. | High |
| 4 | Search & Filter | Customers can search for products using names, brands, and keywords. They can filter results by category, brand, price range, and technical specifications such as RAM or storage. Sorting by price or popularity helps customers narrow down the catalog efficiently. | High |
| 5 | Product Details | Product pages display images, prices, discounts, descriptions, technical specifications, availability, and ratings. Customers can compare two or three products from the same category side by side. When an item is out of stock, customers can request an email notification when it becomes available again. These tools support more informed purchasing decisions. | High |
| 6 | Cart | Customers can add products and selected variants, such as color or storage, to their shopping carts. They can change quantities, remove products, and select which items to check out, while the system prevents quantities above available stock. The cart displays item prices, subtotals, and the current total. Saved carts remain available when customers return to their accounts. | High |
| 7 | Checkout | Customers can select an existing delivery address, enter a new one, or update recipient details for an order. They can choose delivery or in-store pickup when available. Before placing an order, they can review products, quantities, shipping fees, vouchers, and the final total. This gives customers an opportunity to correct purchasing information before confirmation. | High |
| 8 | Payment | Customers can pay by cash on delivery, bank transfer or QR code, and e-wallet payment gateways. After a payment is confirmed, the system updates the associated order status. Sensitive card details are handled by the external payment gateway rather than stored by the application. | Medium |
| 9 | Order Tracking | Customers can view their order history with dates, purchased items, and totals. Each order provides details such as delivery address, payment method, and current status. Tracking stages such as confirmed, packed, shipped, and delivered help customers follow the progress of their purchases. | Medium |
| 10 | Review & Rating | Customers who have received a purchased product can submit a rating from one to five stars and a written review. Only verified purchasers are permitted to submit product reviews. Product pages present average ratings and rating distributions to help future customers evaluate products. | Low |
| 11 | Wishlist | Customers can save products they are interested in to a personal wishlist. They can revisit or remove saved products while considering future purchases. This makes it easier to keep track of interesting items without repeating the same product searches. | Low |

## **5.2 Admin Features**

| No. | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| 12 | Product Management | Administrators can view product listings together with sales information such as current stock, units sold, and revenue. They can create and edit product names, categories, images, prices, descriptions, and technical specifications. They can also deactivate or remove product listings while maintaining the historical sales information required by the store. These capabilities help keep the catalog accurate and organized. | High |
| 13 | Inventory Management | Administrators can view and update stock quantities for individual products and variants. The system reduces stock when orders are placed and restores it when orders are cancelled according to the store's rules. Out-of-stock products cannot be added to the cart, and low-stock information helps administrators identify items that need replenishment. | High |
| 14 | Order Management | Administrators can view incoming orders and filter them by status or date. They can process orders and update their progress through confirmation, packing, shipping, and delivery. Updated order statuses are reflected in the customer-facing order tracking experience. | Medium |
| 15 | Promotion Management | Administrators can create sales campaigns and discount vouchers. They can configure validity periods, discount types, and eligible products or categories. These controls enable the store to run promotions without manually editing prices for every affected product. | Medium |
| 16 | Store Administration | Administrators can update homepage banners, featured products, shipping fees, accepted payment methods, and branch information. They can review reported customer feedback and hide or delete spam, abusive, or irrelevant reviews. They can also search customer accounts and deactivate or reactivate accounts when necessary. These functions support daily store operations through the administration interface. | Medium |

## **5.3 AI Features**

The following AI features extend the standard customer and administrator capabilities (items 1–16). All priorities and sprint assignments are proposed pending team approval; descriptions specify intended behavior, not implementation progress. Proposed ownership/integration: AF-01—AI Recommendation (Gia), with Backend catalog data and Frontend rendering; AF-02—Shopping Agent (Thịnh) \+ Backend search APIs \+ Frontend product cards; AF-03—Shopping Agent (Thịnh) \+ Backend product attributes \+ Frontend comparison; AF-04—Shopping Agent (Thịnh) \+ an approved model/provider \+ Chatbox UI; AF-05—Shopping Agent (Thịnh) \+ authenticated Backend cart/order tools \+ Frontend confirmation UX. Candidate demo baseline: consultation and needs-based discovery only where actually integrated and tested; AF-01 and AF-03 require separate acceptance/ownership checks, while AF-05 remains a later-phase option. The team must explicitly confirm which are current-sprint commitments; do not remove "proposed" from a priority before that decision.

| No. | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| 17 | Personalized Product Recommendations (AF-01) | The system shall recommend relevant products using Backend-approved product attributes and, for authorized customers, permitted signals such as recent searches or views. Suggestions shall respect expressed budget and category preferences and link to authoritative product details. If consent or personal history is unavailable, it shall use non-personalized suggestions rather than inventing activity. Owned primarily by the Recommendation subteam; implementation and relevance testing are planned, not complete. | Medium (proposed) |
| 18 | AI Product Search (AF-02) | Customers shall be able to describe needs in natural language (e.g., a lightweight programming laptop under 25 million VND). The Agent shall extract supported constraints, ask concise clarifications where necessary, and retrieve product candidates through an authorized Backend search tool. It shall show verifiable names, prices, key specifications, and product links; when no match exists, it shall explain the limitation without fabricating availability. Tool-assisted catalog search depends on an agreed API contract. | High (proposed) |
| 19 | AI Product Comparison (AF-03) | The system shall compare two or three same-category products using trusted catalog attributes, explaining differences in price, performance-relevant specs, display, battery, and practical use cases. Missing attributes shall be marked unavailable rather than guessed. The Agent shall not claim one universally best item when suitability depends on personal priorities. Links to product pages or the normal comparison view shall support verification. Consistent product IDs and normalized units are required. | Medium (proposed) |
| 20 | AI Product Consultation (AF-04) | The system shall provide conversational assistance about electronics terminology, category choices, and trade-offs. It shall retain only permitted conversational context within a supported session and distinguish general advice from verified facts about in-store products. For store-specific specifications, prices, warranty, or compatibility claims, the Agent must use Backend-grounded evidence or state that it cannot verify the information. The ordinary catalog remains accessible when AI advice is unavailable. | High (proposed) |
| 21 | Automatic Shopping Assistant (AF-05) | AF-05 is an optional later-phase feature unless the team explicitly includes authenticated shopping tools in the MVP. When implemented and enabled, the system may assist with adding a specific variant to the cart, changing quantities, preparing checkout information, viewing the customer's own order, or requesting stock alerts. Before any enabled state-changing tool call, the Agent must present the intended change and require appropriate explicit approval; Backend authorization, stock and policy validation remain mandatory. It must report the actual Backend outcome, including failures and uncertain requests. Unimplemented tools must be disabled or clearly labeled as mock; no AI-only chat message may finalize order placement or payment. | Low (later phase) |

6. **Other Product Requirements**

The following platform-wide and AI-focused non-functional requirements are proposed acceptance targets for team review, not measured results. Quantitative targets must be verified in an agreed test environment. Evaluate AI metrics only after the corresponding service and Backend integration exist.

## **Platform-Wide Non-Functional Requirements (Proposed)**

These requirements were selected for team review, not reported as verified results. Proposed performance test baseline: 10 concurrent simulated users for Must latency targets, representative production-like data, documented server specifications, request mix, warm-up and test duration; PERF-08 separately sets a 50-user Should target. Report p95 latency and unexpected server-error rates. Checkout measurements exclude external payment gateway processing; all quantitative thresholds require baseline validation.

## **Platform Performance**

PERF-01 — Must: At least 95% of product listing API requests shall finish within 2 seconds.

PERF-02 — Must: At least 95% of product detail API requests shall finish within 1 second.

PERF-03 — Must: At least 95% of product search, filtering and sorting API requests shall finish within 2 seconds.

PERF-05 — Must: At least 95% of cart add, update and removal API requests shall finish within 2 seconds.

PERF-06 — Must: At least 95% of checkout order-creation API requests shall finish within 3 seconds, excluding external payment gateway processing.

PERF-08 — Should: The platform shall support 50 concurrent users browsing products, searching and viewing carts while meeting the associated latency targets.

PERF-09 — Should: The product catalog shall support at least 10,000 products while meeting PERF-01, PERF-02 and PERF-03.

## **Reliability**

REL-02 — Must: Core shopping workflows (browsing, search, login, cart and standard checkout) shall remain usable when the AI service is unavailable, provided the Backend and database are healthy.

REL-03 — Must: Gateway errors, timeouts and uncertain payment results shall never cause the Backend to automatically mark an order as paid.

REL-04 — Must: Invalid requests shall receive structured error responses without crashing the application.

REL-05 — Must: External service calls shall have finite timeouts to prevent indefinite waiting.

REL-06 — Should: Restarting the application shall not lose previously committed business data.

## **Security**

SEC-01 — Must: Protected APIs shall reject requests without valid authentication credentials.

SEC-02 — Must: Customers shall only access or edit profiles, addresses, carts, wishlists and orders belonging to their accounts.

SEC-04 — Must: Passwords shall be hashed using BCrypt, Argon2id or another established password-hashing algorithm; plaintext password storage is prohibited.

SEC-05 — Must: Deployed authentication, personal-data and payment-related communications shall use HTTPS.

SEC-08 — Must: Login, password reset and other sensitive endpoints shall enforce suitable rate limits against brute-force attacks and abuse.

**Initial Backend rate-limit policy (proposed):**

| Endpoint | Limit | Applies per |
| :---- | :---- | :---- |
| General authenticated APIs | 120 requests / minute | Authenticated user |
| Public catalog and search APIs | 600 requests / minute | IP address |
| Login | 10 requests / minute | IP address |
| Failed login attempts | 5 failures / 15 minutes | Account |
| Registration | 5 requests / hour | IP address |
| Forgot password | 3 requests / 15 minutes | Account |
| Checkout / Create order | 5 requests / minute | Authenticated user |
| E-wallet payment initiation | 5 requests / minute | Authenticated user |

SEC-09 — Must: User-visible error messages shall never reveal passwords, access tokens, refresh tokens, API keys or other secrets.

SEC-10 — Must: Payment gateway credentials and other secrets shall not appear in source code; the application shall not store sensitive payment card details.

SEC-13 — Should: Login sessions and tokens shall have expiration times, with logout and revocation following the agreed authentication policy.

## **Data Integrity and Concurrency**

DATA-01 — Must: Successful concurrent checkouts shall not reduce stock below zero.

DATA-02 — Must: The Backend shall calculate order totals using authoritative prices, quantities, shipping charges and eligible vouchers, not client-submitted totals.

DATA-03 — Must: Order items shall preserve purchase-time details so later product and price changes do not alter historical orders.

DATA-04 — Must: Concurrent voucher redemptions shall not exceed the configured usage limit.

DATA-05 — Must: Critical relationships such as order/customer, order item/product variant and review/product shall use appropriate database constraints.

DATA-07 — Must: Duplicate payment callbacks shall not record multiple successful payments for one transaction.

DATA-08 — Must: Order and payment state transitions shall follow the agreed business rules.

## **Scalability**

SCAL-01 — Should: The relevant latency targets shall remain satisfied when a representative catalog grows from 1,000 to 10,000 products in the agreed test environment.

SCAL-02 — Should: Product, order, user and review listing APIs shall use pagination or equivalent bounded result sizes.

## **Usability and Accessibility**

USE-03 — Must: Invalid form inputs shall show understandable field-specific errors without unnecessarily losing other valid inputs.

USE-04 — Must: Before placing an order, users shall be able to review items, quantities, prices, discounts, delivery addresses and the final total.

USE-06 — Should: Core search, login, cart and checkout functions shall support keyboard navigation and visible keyboard focus.

USE-07 — Should: Important text and interface controls shall satisfy applicable WCAG 2.2 AA contrast criteria, including at least 4.5:1 contrast for ordinary text unless an exception applies.

## **Integration and API Contracts**

INT-01 — Must: Frontend, Backend and AI shall use agreed API contracts specifying requests, responses and errors.

INT-02 — Must: Changes to Backend API contracts used by Frontend or AI shall be integration-tested with dependent components before release.

INT-05 — Should: REST APIs shall use consistent HTTP status codes and structured errors so their consumers can process failures predictably.

## **Maintainability and Testability**

MAINT-01 — Must: Critical authentication, authorization, checkout, inventory and payment business rules shall have automated tests covering failures as well as success cases.

MAINT-02 — Must: Pull requests changing critical functions shall be reviewed by at least one other team member before merging.

MAINT-03 — Must: Backend APIs used by Frontend or AI shall document request and response schemas, authentication and possible errors.

MAINT-04 — Must: Database schema changes shall be managed with ordered and reproducible migrations.

MAINT-05 — Should: CI shall build and run the agreed required tests, preventing merges or releases when mandatory checks fail.

MAINT-06 — Should: Source code shall comply with the team's agreed formatter, linter and coding standards.

## **AI-Focused Non-Functional Requirements (Existing Vision Targets)**

AI-NFR-01 — Factual grounding (Must; proposed target): Product IDs shall always identify real Backend records; returned structured values for price, currency, stock/availability, variant and technical specifications shall match the timestamped Backend fixture/snapshot for that request exactly, or be marked unknown. For free-text explanations, the team shall prepare 100 representative product-specific responses, extract independently checkable factual claims, label each claim as supported, contradicted, or unverifiable against its saved fixture, and report the supported proportion (target ≥95%) with claim and response counts. Unverifiable claims may not be counted as correct; zero fabricated product IDs is a separate hard condition. The test set, annotation rubric and evaluator agreement require approval before reporting a result.

AI-NFR-02 — Hard-constraint adherence (Must): ≥90% of 50 predefined search tasks honor supported explicit constraints (e.g., category and budget), or clearly report no matches.

AI-NFR-03 — End-to-end response latency (Should; provisional targets): p95 ≤8 seconds for non-tool consultation and ≤12 seconds for one catalog-tool-assisted query, subject to baseline review. Measure ≥50 end-to-end requests in each scenario from Backend receipt of a valid Chatbox request to Backend completion of the answer returned to Frontend; include any AI invocation, LLM generation, Backend catalog/tool round trips and serialization, but exclude user typing and Frontend rendering. Record model/provider/version, server CPU/GPU, dataset, network, request mix, concurrency, warm-up, error/timeouts, p50 and p95. Do not mark targets as achieved or fixed until the agreed environment and baseline results have been reviewed.

AI-NFR-04 — Honest error handling (Must): 100% of injected timeouts, non-2xx responses, and invalid-output cases must avoid false claims of successful actions or results.

AI-NFR-05 — Authorization (Must): 100% of account-specific tool calls pass Backend identity/permission checks; guests must never access other customers' data.

AI-NFR-06 — Action confirmation (Must, conditional on enabled actions): For 100% of AI-assisted state-changing tools actually enabled in the release, obtain explicit customer approval tied to the specific product/variant, quantity, action and proposal before submitting a Backend mutation. This condition does not require AF-05 tools to exist in the MVP; when no such tool is enabled, mark action-confirmation tests Not applicable, not Pass. Payment and final order placement remain in the dedicated checkout flow.

AI-NFR-07 — Privacy and secrets (Must): zero API secrets, access tokens, or unauthorized private data in model context, UI responses, Git history, or logs; check with secret scans and negative tests.

AI-NFR-08 — Graceful degradation (Must): 100% of simulated AI outages leave healthy homepage, catalog browsing, login, and cart navigation usable.

AI-NFR-09 — Recommendation relevance (Should): on 50 agreed preference scenarios, ≥80% include an acceptable product among the top three suggestions.

AI-NFR-10 — Safe tool use (Must): 30 adversarial prompts produce zero unauthorized Backend mutations or disclosures.

AI-NFR-11 — Explanation usability (Should): ≥80% of at least 10 participants can identify a recommendation's main reason and open its details without assistance.

AI-NFR-12 — Traceability (Should): 100% of requests reaching the AI service include correlation IDs and observable statuses, with protected payloads redacted; inspect 30 test requests.

AI-NFR-13 — Action cancellation (Must, conditional on enabled state-changing actions): Define three states: (1) pending confirmation—no mutation request submitted; cancellation prevents any submission; (2) request in flight—the Backend request was sent, so the Agent must report its real eventual outcome and may not promise rollback; (3) completed action—a later cancellation cannot retroactively undo a committed change. Test all three paths: cancel before approval (zero mutation calls), cancel after submission (correct Backend result), and cancel after success (no false rollback claim). This gate applies only to action tools implemented and enabled in the release; otherwise mark Not applicable.

AI-NFR-14 — Confirmation window (Should, conditional on enabled actions): Each proposed mutation shall have a proposal identifier, a clearly communicated pending/confirmed/cancelled/expired status, and a bounded confirmation window. A 5-minute expiry is a proposed UX value pending AI/Frontend approval, not an adopted requirement. On expiry the UI shall show "Expired" and require the customer to create a new proposal; expired, cancelled, or previously consumed confirmations shall be rejected and must never execute a mutation. Cover expiry, replay, duplicate confirmation and cancellation in tests. Final order placement and payment remain within standard checkout.

Acceptance scenarios to plan: budget search, missing-constraint clarification, fixture-grounded product comparison, out-of-stock cart rejection, guest order-status privacy, confirmed/rejected mutation, AI outage fallback and prompt-injection defense. For enabled action tools also test cancellation while pending, in flight and after completion, expired confirmation requiring a fresh proposal, and replay/duplicate confirmation rejection. AI-NFR-01 uses 100 labeled product responses and claim-level evidence; AI-NFR-03 uses at least 50 end-to-end requests per scenario in a documented environment. Record actual date, sample size, model, server, fixtures and measurements; mark unrun tests “Not evaluated” and out-of-scope optional action tests “Not applicable.”

Review checkpoints (before GitHub merge):

• Confirm AI service routing (Frontend → Backend → AI) and final API contracts.

• Confirm whether cart mutations and restock alerts are later-sprint commitments or optional stretch goals.

• Review AI quality targets in Section 6 against actual model, hosting, and evaluation capacity.

• Keep all features and metrics labeled “planned/not evaluated” until tests and team approval are complete.

