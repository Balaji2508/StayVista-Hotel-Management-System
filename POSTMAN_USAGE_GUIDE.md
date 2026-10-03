# Hotel Management System - Postman Testing Guide

This guide explains how to import and run the automated Postman test collection for the **Hotel Management System (HMS)** microservices platform.

---

## 📁 Generated Files

1. **[`Hotel_Management_System.postman_collection.json`](file:///c:/Users/ELCOT/Documents/Hotel%20Management%20System/Hotel_Management_System.postman_collection.json)**:
   - Postman Collection v2.1.0 format with 12 organized functional folders.
   - Fully automated test scripts (`pm.test`, `pm.environment.set`) for JWT extraction, variable chaining, and assertions.
2. **[`Hotel_Management_System.postman_environment.json`](file:///c:/Users/ELCOT/Documents/Hotel%20Management%20System/Hotel_Management_System.postman_environment.json)**:
   - Pre-configured environment containing `baseUrl` (`http://localhost:8080`), default credentials for all 7 roles, and dynamic placeholders.

---

## 🚀 How to Import into Postman

1. Open **Postman**.
2. Click the **Import** button in the top left.
3. Drag & drop or select both files:
   - `Hotel_Management_System.postman_collection.json`
   - `Hotel_Management_System.postman_environment.json`
4. In the top-right environment dropdown, select **`Hotel Management System (Local)`**.

---

## ⚡ Running the Tests

### Option A: Interactive Testing (Single Request or Folder)
- You can expand any folder (e.g., `01. Authentication & Role Logins`) and run requests in order.
- When you run `1.2 Login as Owner` or `1.7 Login as Guest`, the test script automatically extracts the JWT token into `{{OWNER_TOKEN}}` and `{{GUEST_TOKEN}}` environment variables.
- Subsequent requests will automatically use these tokens without requiring manual copy-pasting.

### Option B: Automated Full-Suite Execution (Collection Runner)
1. In Postman, click on the collection **`Hotel Management System - Microservices API Collection`**.
2. Click **Run Collection**.
3. Ensure the environment is set to **`Hotel Management System (Local)`**.
4. Click **Run Hotel Management System...**.
5. All endpoints across all 14 microservices will execute sequentially with automated assertions validating 200/201 HTTP status codes and response bodies.

### Option C: Running via Newman CLI
```bash
npm install -g newman
newman run Hotel_Management_System.postman_collection.json -e Hotel_Management_System.postman_environment.json
```

---

## 📋 Collection Structure & Microservices Covered

| Folder | Microservices Covered | Description |
| :--- | :--- | :--- |
| **01. Authentication & Role Logins** | `auth-service` | User registration and logins for all 7 roles |
| **02. Master Data Setup** | `room-service`, `rate-service`, `operations-service` | Categories, amenities, rooms, dynamic rates, and room assignments |
| **03. Guest Profiles & Quotes** | `guest-service`, `rate-service` | Profiles, ownership enforcement, dynamic price quote calculation |
| **04. Reservation & Saga** | `reservation-service`, `payment-service`, `notification-service` | Bookings, idempotent payments, saga confirmation, notifications |
| **05. Front Desk Operations** | `reservation-service`, `room-service` | Check-in, check-out, room occupancy state machine, waitlist |
| **06. Guest QR Service** | `guest-experience-service` | In-room QR requests, complaints, feedback, loyalty rewards |
| **07. Housekeeping & Operations** | `operations-service`, `room-service` | Task dispatch, acceptance, delivery, manager verification |
| **08. Maintenance & Breakage** | `operations-service` | Maintenance issues, technician assignment, breakage damage review |
| **09. Billing & Invoicing** | `billing-service` | Folio itemization, damage charges, final invoice settlement & PDF |
| **10. Staff, Rosters & Cash** | `staff-service`, `operations-service` | HR profiles, attendance clock-in, leaves, cash drawer & shift handover |
| **11. Inventory Management** | `inventory-service` | Stock items, reorder thresholds, low-stock alerts |
| **12. Analytics & Reporting** | `reporting-service` | Dashboard KPIs, RevPAR, ADR, revenue reports, staff metrics |
