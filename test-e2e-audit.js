// StayVista HMS - Exhaustive E2E Service and Feature Traceability Test Suite
// Executes against API Gateway (http://localhost:8080) using real HTTP calls and real MySQL persistence

const GATEWAY_URL = 'http://localhost:8080';
const EUREKA_URL = 'http://localhost:8761';
const CONFIG_URL = 'http://localhost:8888';

const testResults = [];

function recordTest(service, endpoint, frontendPage, role, testCase, expected, actual, persistence, status, evidence, defect = null) {
    const entry = {
        service,
        endpoint,
        frontendPage,
        role,
        testCase,
        expected,
        actual,
        persistence,
        status,
        evidence: typeof evidence === 'object' ? JSON.stringify(evidence).substring(0, 300) : String(evidence).substring(0, 300),
        defect
    };
    testResults.push(entry);
    const badge = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'BLOCKED' ? '⚠️' : 'ℹ️';
    console.log(`${badge} [${service}] ${endpoint} - ${testCase}: ${status} (${actual})`);
}

async function api(path, options = {}, token = null) {
    const url = `${GATEWAY_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const start = Date.now();
    try {
        const response = await fetch(url, { ...options, headers });
        const latency = Date.now() - start;
        let data = null;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
        return { status: response.status, data, latency, ok: response.ok };
    } catch (err) {
        return { status: 0, error: err.message, latency: Date.now() - start, ok: false };
    }
}

async function runAudit() {
    console.log('===============================================================');
    console.log('   STAYVISTA HMS - COMPREHENSIVE E2E TRACEABILITY AUDIT        ');
    console.log('===============================================================');

    // 1. Config Server
    try {
        const res = await fetch(`${CONFIG_URL}/auth-service/default`);
        const text = await res.text();
        recordTest('Config Server', 'GET /auth-service/default', 'N/A', 'PUBLIC', 'TC-CFG-01: Load service config', 'HTTP 200 with propertySources', `HTTP ${res.status}`, 'Loaded git/native properties', res.ok ? 'PASS' : 'FAIL', text);
    } catch (e) {
        recordTest('Config Server', 'GET /auth-service/default', 'N/A', 'PUBLIC', 'TC-CFG-01: Load service config', 'HTTP 200', 'Connect Error', 'N/A', 'FAIL', e.message);
    }

    // 2. Eureka Server
    try {
        const res = await fetch(`${EUREKA_URL}/eureka/apps`, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        const apps = (data.applications?.application || []).map(a => a.name);
        recordTest('Eureka Server', 'GET /eureka/apps', 'N/A', 'PUBLIC', 'TC-EUR-01: Service discovery catalog', 'Catalog of registered services', `HTTP ${res.status}, ${apps.length} apps`, 'Eureka in-memory registry', apps.length >= 10 ? 'PASS' : 'FAIL', apps);
    } catch (e) {
        recordTest('Eureka Server', 'GET /eureka/apps', 'N/A', 'PUBLIC', 'TC-EUR-01: Service discovery catalog', 'Catalog of registered services', 'Error', 'N/A', 'FAIL', e.message);
    }

    // 3. API Gateway Actuator Health
    const gwHealth = await api('/actuator/health');
    recordTest('API Gateway', 'GET /actuator/health', 'App Shell', 'PUBLIC', 'TC-GW-01: Gateway health check', 'HTTP 200 status UP', `HTTP ${gwHealth.status} status ${gwHealth.data?.status}`, 'Gateway reactive routing', gwHealth.status === 200 ? 'PASS' : 'FAIL', gwHealth.data);

    // 4. Auth Service - Invalid Login (HTTP 401)
    const badLogin = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: 'invalid@hms.com', password: 'WrongPassword' })
    });
    recordTest('Auth Service', 'POST /api/auth/login', '/login', 'ANONYMOUS', 'TC-AUTH-01: Invalid credentials rejected', 'HTTP 401 Unauthorized', `HTTP ${badLogin.status}`, 'No token issued', (badLogin.status === 401 || badLogin.status === 400) ? 'PASS' : 'FAIL', badLogin.data);

    // 5. Auth Service - Valid Admin Login
    const adminLogin = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: 'admin@hms.com', password: 'Admin@123' })
    });
    const adminToken = adminLogin.data?.accessToken || adminLogin.data?.token;
    recordTest('Auth Service', 'POST /api/auth/login', '/login', 'ANONYMOUS', 'TC-AUTH-02: Valid Admin login and JWT', 'HTTP 200 with JWT and ADMIN role', `HTTP ${adminLogin.status} role: ${adminLogin.data?.role}`, 'JWT generated', adminLogin.status === 200 && adminToken ? 'PASS' : 'FAIL', { role: adminLogin.data?.role, expiresIn: adminLogin.data?.expiresIn });

    // 6. Auth Service - Receptionist Login
    const recLogin = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: 'receptionist@hms.com', password: 'Reception@123' })
    });
    const recToken = recLogin.data?.accessToken || recLogin.data?.token;
    recordTest('Auth Service', 'POST /api/auth/login', '/login', 'ANONYMOUS', 'TC-AUTH-03: Receptionist login', 'HTTP 200 with RECEPTIONIST role', `HTTP ${recLogin.status} role: ${recLogin.data?.role}`, 'JWT generated', recLogin.status === 200 ? 'PASS' : 'FAIL', { role: recLogin.data?.role });

    // 7. Auth Service - List Users
    const usersRes = await api('/api/users', { method: 'GET' }, adminToken);
    recordTest('Auth Service', 'GET /api/users', '/staff', 'ADMIN', 'TC-AUTH-04: Retrieve all users', 'HTTP 200 with user list', `HTTP ${usersRes.status}, count: ${Array.isArray(usersRes.data) ? usersRes.data.length : 0}`, 'MySQL auth_db.users', usersRes.status === 200 ? 'PASS' : 'FAIL', usersRes.data?.length);

    // 8. Guest Service - Create Test Guest
    const testGuestEmail = `sv-guest-${Date.now()}@stayvista.com`;
    const testPhone = `+1-555-${Math.floor(100000 + Math.random() * 900000)}`;
    const createGuestRes = await api('/api/guests', {
        method: 'POST',
        body: JSON.stringify({
            firstName: 'Aurelia',
            lastName: 'Vanderbilt',
            email: testGuestEmail,
            phone: testPhone,
            company: 'StayVista Luxury Travel',
            gender: 'FEMALE',
            address: '742 Evergreen Terrace, Suite 100'
        })
    }, adminToken);
    const guestId = createGuestRes.data?.id;
    recordTest('Guest Service', 'POST /api/guests', '/guests', 'RECEPTIONIST/ADMIN', 'TC-GST-01: Create guest profile', 'HTTP 201 with generated memberCode', `HTTP ${createGuestRes.status} id: ${guestId} code: ${createGuestRes.data?.memberCode}`, 'Persisted in guest_db.guests', createGuestRes.status === 201 && guestId ? 'PASS' : 'FAIL', createGuestRes.data);

    // 9. Guest Service - List All Guests
    const getGuestsRes = await api('/api/guests', { method: 'GET' }, adminToken);
    recordTest('Guest Service', 'GET /api/guests', '/guests', 'STAFF', 'TC-GST-02: List all guests', 'HTTP 200 with list containing created guest', `HTTP ${getGuestsRes.status}, count: ${Array.isArray(getGuestsRes.data) ? getGuestsRes.data.length : 0}`, 'MySQL query', getGuestsRes.status === 200 ? 'PASS' : 'FAIL', getGuestsRes.data?.length);

    // 10. Guest Service - Get Guest by ID
    let guestDetailRes = null;
    if (guestId) {
        guestDetailRes = await api(`/api/guests/${guestId}`, { method: 'GET' }, adminToken);
        recordTest('Guest Service', 'GET /api/guests/{id}', '/guests', 'AUTHENTICATED', 'TC-GST-03: Retrieve guest by ID', 'HTTP 200 matching created record', `HTTP ${guestDetailRes.status} name: ${guestDetailRes.data?.firstName} ${guestDetailRes.data?.lastName}`, 'Verified persistence', guestDetailRes.status === 200 && guestDetailRes.data?.email === testGuestEmail ? 'PASS' : 'FAIL', guestDetailRes.data);
    }

    // 11. Room Service - List Room Categories (with Bearer token)
    const roomCatsRes = await api('/api/room-categories', { method: 'GET' }, adminToken);
    recordTest('Room Service', 'GET /api/room-categories', '/room-categories', 'PUBLIC/STAFF', 'TC-RM-01: List room categories', 'HTTP 200 with category list', `HTTP ${roomCatsRes.status}, count: ${Array.isArray(roomCatsRes.data) ? roomCatsRes.data.length : 0}`, 'MySQL room_db.room_categories', roomCatsRes.status === 200 ? 'PASS' : 'FAIL', roomCatsRes.data?.length);

    // 12. Room Service - List Rooms (with Bearer token)
    const roomsRes = await api('/api/rooms', { method: 'GET' }, adminToken);
    const roomId = roomsRes.data?.[0]?.id || 1;
    const categoryId = roomsRes.data?.[0]?.category?.id || 1;
    recordTest('Room Service', 'GET /api/rooms', '/rooms', 'PUBLIC/STAFF', 'TC-RM-02: List all rooms', 'HTTP 200 with room list', `HTTP ${roomsRes.status}, count: ${Array.isArray(roomsRes.data) ? roomsRes.data.length : 0}`, 'room_db.rooms', roomsRes.status === 200 ? 'PASS' : 'FAIL', roomsRes.data?.length);

    // 13. Room Service - Get Room by ID
    const roomDetail = await api(`/api/rooms/${roomId}`, { method: 'GET' }, adminToken);
    recordTest('Room Service', 'GET /api/rooms/{id}', '/rooms', 'AUTHENTICATED', 'TC-RM-03: Retrieve room by ID', 'HTTP 200 room details', `HTTP ${roomDetail.status} roomNumber: ${roomDetail.data?.roomNumber}`, 'room_db.rooms', roomDetail.status === 200 ? 'PASS' : 'FAIL', roomDetail.data);

    // 14. Room Service - Amenities (with Bearer token)
    const amenitiesRes = await api('/api/amenities', { method: 'GET' }, adminToken);
    recordTest('Room Service', 'GET /api/amenities', '/rooms', 'PUBLIC/STAFF', 'TC-RM-04: List amenities', 'HTTP 200', `HTTP ${amenitiesRes.status}`, 'room_db.amenities', amenitiesRes.status === 200 ? 'PASS' : 'FAIL', amenitiesRes.data);

    // 15. Rate Service - List Rates
    const ratesRes = await api('/api/rates', { method: 'GET' }, adminToken);
    recordTest('Rate Service', 'GET /api/rates', '/rates', 'AUTHENTICATED', 'TC-RT-01: List rate configurations', 'HTTP 200', `HTTP ${ratesRes.status}, count: ${Array.isArray(ratesRes.data) ? ratesRes.data.length : 0}`, 'rate_db.rates', ratesRes.status === 200 ? 'PASS' : 'FAIL', ratesRes.data?.length);

    // 16. Rate Service - Dynamic Pricing Quote
    const quotePayload = {
        categoryId: categoryId,
        checkInDate: '2026-11-01',
        checkOutDate: '2026-11-05',
        guestsCount: 1
    };
    const quoteRes = await api('/api/rates/quote', {
        method: 'POST',
        body: JSON.stringify(quotePayload)
    }, adminToken);
    recordTest('Rate Service', 'POST /api/rates/quote', '/rates', 'AUTHENTICATED', 'TC-RT-02: Dynamic price calculation', 'HTTP 200 with daily breakdown', `HTTP ${quoteRes.status} total: ${quoteRes.data?.totalQuotedAmount}`, 'Dynamic pricing engine', quoteRes.status === 200 && quoteRes.data?.totalQuotedAmount > 0 ? 'PASS' : 'FAIL', quoteRes.data);

    // 17. Reservation Service - List Reservations
    const getResList = await api('/api/reservations', { method: 'GET' }, adminToken);
    recordTest('Reservation Service', 'GET /api/reservations', '/reservations', 'STAFF', 'TC-RSV-01: List all reservations', 'HTTP 200 with reservation catalog', `HTTP ${getResList.status}, count: ${Array.isArray(getResList.data) ? getResList.data.length : 0}`, 'reservation_db.reservations', getResList.status === 200 ? 'PASS' : 'FAIL', getResList.data?.length);

    // 18. Reservation Service - Create Reservation Lifecycle
    const createResPayload = {
        guestId: guestId || 1,
        roomId: roomId,
        roomCategoryId: categoryId,
        adults: 1,
        children: 0,
        checkInDateTime: '2026-11-01T14:00:00',
        checkOutDateTime: '2026-11-05T11:00:00',
        specialRequests: 'StayVista VIP Arrival'
    };

    const createResResponse = await api('/api/reservations', {
        method: 'POST',
        body: JSON.stringify(createResPayload)
    }, adminToken);
    const reservationId = createResResponse.data?.id;
    const reservationCode = createResResponse.data?.reservationCode;
    recordTest('Reservation Service', 'POST /api/reservations', '/reservations/new', 'AUTHENTICATED', 'TC-RSV-02: Create reservation', 'HTTP 201 with reservationCode', `HTTP ${createResResponse.status} id: ${reservationId} code: ${reservationCode}`, 'reservation_db.reservations', createResResponse.status === 201 && reservationId ? 'PASS' : 'FAIL', createResResponse.data);

    // 19. Reservation Service - Get Reservation by ID
    if (reservationId) {
        const resDetail = await api(`/api/reservations/${reservationId}`, { method: 'GET' }, adminToken);
        recordTest('Reservation Service', 'GET /api/reservations/{id}', '/reservations', 'AUTHENTICATED', 'TC-RSV-03: Retrieve reservation by ID', 'HTTP 200 details', `HTTP ${resDetail.status} status: ${resDetail.data?.status}`, 'reservation_db.reservations', resDetail.status === 200 ? 'PASS' : 'FAIL', resDetail.data);
    }

    // 20. Reservation Service - Waitlist
    const waitlistRes = await api('/api/waitlist', { method: 'GET' }, adminToken);
    recordTest('Reservation Service', 'GET /api/waitlist', '/waitlist', 'STAFF', 'TC-RSV-04: List waitlist items', 'HTTP 200', `HTTP ${waitlistRes.status}`, 'reservation_db.waitlist', waitlistRes.status === 200 ? 'PASS' : 'FAIL', waitlistRes.data);

    // 21. Billing Service - Create Bill for Reservation
    let billId = null;
    if (reservationId) {
        const createBillRes = await api('/api/bills', {
            method: 'POST',
            body: JSON.stringify({
                reservationId: reservationId,
                guestId: guestId || 1,
                roomId: roomId,
                checkInDate: '2026-10-15',
                checkOutDate: '2026-10-20'
            })
        }, adminToken);
        billId = createBillRes.data?.id;
        recordTest('Billing Service', 'POST /api/bills', '/billing', 'STAFF', 'TC-BIL-01: Generate bill for reservation', 'HTTP 201 with itemized charges', `HTTP ${createBillRes.status} billId: ${billId} total: ${createBillRes.data?.totalAmount}`, 'billing_db.bills', createBillRes.status === 201 && billId ? 'PASS' : 'FAIL', createBillRes.data);

        // 22. Billing Service - Finalize Bill
        if (billId) {
            const finalizeRes = await api(`/api/bills/${billId}/finalize`, {
                method: 'POST',
                body: JSON.stringify({
                    paidAmount: 0,
                    discountAmount: 0,
                    taxPercentage: 10.0
                })
            }, adminToken);
            recordTest('Billing Service', 'POST /api/bills/{id}/finalize', '/billing', 'STAFF', 'TC-BIL-02: Finalize bill with taxes', 'HTTP 200 with FINALIZED status', `HTTP ${finalizeRes.status} status: ${finalizeRes.data?.status} total: ${finalizeRes.data?.totalAmount}`, 'billing_db.bills', finalizeRes.status === 200 && finalizeRes.data?.status === 'FINALIZED' ? 'PASS' : 'FAIL', finalizeRes.data);

            // 23. Payment Service - Process Payment for Finalized Bill
            const paymentPayload = {
                reservationId: reservationId,
                amount: finalizeRes.data?.totalAmount || 500.00,
                paymentMethod: 'CARD',
                idempotencyKey: `IDEMP-${Date.now()}`
            };
            const paymentRes = await api('/api/payments', {
                method: 'POST',
                body: JSON.stringify(paymentPayload)
            }, adminToken);
            const paymentId = paymentRes.data?.id;
            recordTest('Payment Service', 'POST /api/payments', '/payments', 'STAFF', 'TC-PAY-01: Process payment', 'HTTP 201 with SUCCESS status', `HTTP ${paymentRes.status} id: ${paymentId} status: ${paymentRes.data?.status}`, 'payment_db.payments', (paymentRes.status === 200 || paymentRes.status === 201) && paymentRes.data?.status === 'SUCCESS' ? 'PASS' : 'FAIL', paymentRes.data);

            // 24. Billing Service - Verify Bill Updated to PAID
            const updatedBill = await api(`/api/bills/${billId}`, { method: 'GET' }, adminToken);
            recordTest('Billing Service', 'GET /api/bills/{id}', '/billing', 'STAFF', 'TC-BIL-03: Bill state transitions to PAID', 'HTTP 200 with PAID status and 0 outstanding', `HTTP ${updatedBill.status} status: ${updatedBill.data?.status} balance: ${updatedBill.data?.outstandingAmount}`, 'billing_db.bills', updatedBill.status === 200 && updatedBill.data?.status === 'PAID' ? 'PASS' : 'FAIL', updatedBill.data);

            // 25. Payment Service - Get Payments for Reservation
            const getPaymentsRes = await api(`/api/payments/reservation/${reservationId}`, { method: 'GET' }, adminToken);
            recordTest('Payment Service', 'GET /api/payments/reservation/{id}', '/payments', 'STAFF', 'TC-PAY-02: Retrieve reservation payment records', 'HTTP 200 array of payments', `HTTP ${getPaymentsRes.status}, count: ${Array.isArray(getPaymentsRes.data) ? getPaymentsRes.data.length : 0}`, 'payment_db.payments', getPaymentsRes.status === 200 ? 'PASS' : 'FAIL', getPaymentsRes.data);
        }
    }

    // 26. Staff Service - List Staff
    const staffListRes = await api('/api/staff', { method: 'GET' }, adminToken);
    recordTest('Staff Service', 'GET /api/staff', '/staff', 'ADMIN/MANAGER', 'TC-STF-01: List staff profiles', 'HTTP 200 with staff list', `HTTP ${staffListRes.status}, count: ${Array.isArray(staffListRes.data) ? staffListRes.data.length : 0}`, 'staff_db.staff', staffListRes.status === 200 ? 'PASS' : 'FAIL', staffListRes.data?.length);

    // 27. Staff Service - Attendance
    const attendanceRes = await api('/api/attendance', { method: 'GET' }, adminToken);
    recordTest('Staff Service', 'GET /api/attendance', '/staff/attendance', 'STAFF', 'TC-STF-02: List staff attendance records', 'HTTP 200', `HTTP ${attendanceRes.status}`, 'staff_db.attendance', attendanceRes.status === 200 ? 'PASS' : 'FAIL', attendanceRes.data);

    // 28. Staff Service - Shifts
    const shiftsRes = await api('/api/shifts', { method: 'GET' }, adminToken);
    recordTest('Staff Service', 'GET /api/shifts', '/staff/shifts', 'STAFF', 'TC-STF-03: List scheduled shifts', 'HTTP 200', `HTTP ${shiftsRes.status}`, 'staff_db.shifts', shiftsRes.status === 200 ? 'PASS' : 'FAIL', shiftsRes.data);

    // 29. Staff Service - Leave
    const leaveRes = await api('/api/leave', { method: 'GET' }, adminToken);
    recordTest('Staff Service', 'GET /api/leave', '/staff/leave', 'STAFF', 'TC-STF-04: List leave requests', 'HTTP 200', `HTTP ${leaveRes.status}`, 'staff_db.leave_requests', leaveRes.status === 200 ? 'PASS' : 'FAIL', leaveRes.data);

    // 30. Inventory Service - Create Item with correct enum & fields
    const testItemCode = `SV-LINEN-${Date.now().toString().slice(-4)}`;
    const createItemRes = await api('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
            name: 'Luxury Egyptian Cotton Towels',
            itemCode: testItemCode,
            category: 'LINEN',
            unitOfMeasure: 'PIECE',
            initialQuantity: 50,
            minimumThreshold: 10,
            unitCost: 15.50,
            description: 'Premium bath towels for luxury suites'
        })
    }, adminToken);
    const itemId = createItemRes.data?.id;
    recordTest('Inventory Service', 'POST /api/inventory', '/inventory', 'ADMIN/MANAGER', 'TC-INV-01: Create inventory item', 'HTTP 201 with generated item record', `HTTP ${createItemRes.status} id: ${itemId} code: ${testItemCode}`, 'inventory_db.inventory_items', createItemRes.status === 201 && itemId ? 'PASS' : 'FAIL', createItemRes.data);

    // 31. Inventory Service - List Inventory
    const getInventoryRes = await api('/api/inventory', { method: 'GET' }, adminToken);
    recordTest('Inventory Service', 'GET /api/inventory', '/inventory', 'STAFF', 'TC-INV-02: List inventory items', 'HTTP 200 with catalog', `HTTP ${getInventoryRes.status}, count: ${Array.isArray(getInventoryRes.data) ? getInventoryRes.data.length : 0}`, 'inventory_db.inventory_items', getInventoryRes.status === 200 ? 'PASS' : 'FAIL', getInventoryRes.data?.length);

    // 32. Inventory Service - Stock Movements (Stock Out to trigger low stock)
    if (itemId) {
        const stockOutRes = await api(`/api/inventory/${itemId}/stock-out`, {
            method: 'POST',
            body: JSON.stringify({
                quantity: 45,
                reason: 'Luxury Suite Deployment',
                referenceCode: 'SV-DEP-001'
            })
        }, adminToken);
        recordTest('Inventory Service', 'POST /api/inventory/{id}/stock-out', '/inventory', 'STAFF', 'TC-INV-03: Stock Out movement', 'HTTP 200 with new balance 5', `HTTP ${stockOutRes.status} newQty: ${stockOutRes.data?.balanceAfter}`, 'inventory_db.stock_movements', stockOutRes.status === 200 && stockOutRes.data?.balanceAfter === 5 ? 'PASS' : 'FAIL', stockOutRes.data);

        // 33. Inventory Service - Get Movements
        const movementsRes = await api(`/api/inventory/${itemId}/movements`, { method: 'GET' }, adminToken);
        recordTest('Inventory Service', 'GET /api/inventory/{id}/movements', '/inventory', 'STAFF', 'TC-INV-04: Retrieve item movement history', 'HTTP 200 with ledger entries', `HTTP ${movementsRes.status}, count: ${Array.isArray(movementsRes.data) ? movementsRes.data.length : 0}`, 'inventory_db.stock_movements', movementsRes.status === 200 ? 'PASS' : 'FAIL', movementsRes.data);
    }

    // 34. Inventory Service - Low Stock Items
    const lowStockRes = await api('/api/inventory/low-stock', { method: 'GET' }, adminToken);
    recordTest('Inventory Service', 'GET /api/inventory/low-stock', '/inventory', 'STAFF', 'TC-INV-05: Query low stock threshold', 'HTTP 200 array of low stock items', `HTTP ${lowStockRes.status}, count: ${Array.isArray(lowStockRes.data) ? lowStockRes.data.length : 0}`, 'inventory_db query', lowStockRes.status === 200 ? 'PASS' : 'FAIL', lowStockRes.data);

    // 35. Purchase Service - List Suppliers
    const suppliersRes = await api('/api/suppliers', { method: 'GET' }, adminToken);
    recordTest('Purchase Service', 'GET /api/suppliers', '/purchase/suppliers', 'STAFF', 'TC-PUR-01: List approved suppliers', 'HTTP 200 with supplier directory', `HTTP ${suppliersRes.status}, count: ${Array.isArray(suppliersRes.data) ? suppliersRes.data.length : 0}`, 'purchase_db.suppliers', suppliersRes.status === 200 ? 'PASS' : 'FAIL', suppliersRes.data);

    // 36. Purchase Service - Purchase Requests
    const prRes = await api('/api/purchase-requests', { method: 'GET' }, adminToken);
    recordTest('Purchase Service', 'GET /api/purchase-requests', '/purchase/requests', 'STAFF', 'TC-PUR-02: List purchase requisitions', 'HTTP 200', `HTTP ${prRes.status}, count: ${Array.isArray(prRes.data) ? prRes.data.length : 0}`, 'purchase_db.purchase_requests', prRes.status === 200 ? 'PASS' : 'FAIL', prRes.data);

    // 37. Purchase Service - Purchase Orders
    const poRes = await api('/api/purchase-orders', { method: 'GET' }, adminToken);
    recordTest('Purchase Service', 'GET /api/purchase-orders', '/purchase/orders', 'STAFF', 'TC-PUR-03: List purchase orders', 'HTTP 200', `HTTP ${poRes.status}, count: ${Array.isArray(poRes.data) ? poRes.data.length : 0}`, 'purchase_db.purchase_orders', poRes.status === 200 ? 'PASS' : 'FAIL', poRes.data);

    // 38. Guest Experience Service - Service Requests for Reservation
    const srRes = await api(`/api/service-requests/reservation/${reservationId || 1}`, { method: 'GET' }, adminToken);
    recordTest('Guest Experience', 'GET /api/service-requests/reservation/{id}', '/guest-experience', 'STAFF', 'TC-EXP-01: List guest service requests', 'HTTP 200', `HTTP ${srRes.status}, count: ${Array.isArray(srRes.data) ? srRes.data.length : 0}`, 'guest_experience_db.service_requests', srRes.status === 200 ? 'PASS' : 'FAIL', srRes.data);

    // 39. Guest Experience Service - Feedback for Reservation
    const fbRes = await api(`/api/feedback/reservation/${reservationId || 1}`, { method: 'GET' }, adminToken);
    recordTest('Guest Experience', 'GET /api/feedback/reservation/{id}', '/guest-experience', 'STAFF', 'TC-EXP-02: List feedback for reservation', 'HTTP 200', `HTTP ${fbRes.status}`, 'guest_experience_db.feedback', fbRes.status === 200 ? 'PASS' : 'FAIL', fbRes.data);

    // 40. Guest Experience Service - Complaints
    const compRes = await api('/api/complaints', { method: 'GET' }, adminToken);
    recordTest('Guest Experience', 'GET /api/complaints', '/guest-experience', 'STAFF', 'TC-EXP-03: List guest complaints', 'HTTP 200', `HTTP ${compRes.status}`, 'guest_experience_db.complaints', compRes.status === 200 ? 'PASS' : 'FAIL', compRes.data);

    // 41. Guest Experience Service - Loyalty Account
    const loyRes = await api(`/api/loyalty/guest/${guestId || 1}`, { method: 'GET' }, adminToken);
    recordTest('Guest Experience', 'GET /api/loyalty/guest/{id}', '/loyalty', 'STAFF', 'TC-EXP-04: Loyalty account and tier', 'HTTP 200 or 404 (if not enrolled)', `HTTP ${loyRes.status}`, 'guest_experience_db.loyalty', (loyRes.status === 200 || loyRes.status === 404) ? 'PASS' : 'FAIL', loyRes.data);

    // 42. Operations Service - Housekeeping Tasks
    const hkRes = await api('/api/housekeeping/tasks', { method: 'GET' }, adminToken);
    recordTest('Operations Service', 'GET /api/housekeeping/tasks', '/operations', 'STAFF', 'TC-OPS-01: List housekeeping tasks', 'HTTP 200', `HTTP ${hkRes.status}, count: ${Array.isArray(hkRes.data) ? hkRes.data.length : 0}`, 'operations_db.housekeeping', hkRes.status === 200 ? 'PASS' : 'FAIL', hkRes.data);

    // 43. Operations Service - Room Assignments
    const raRes = await api('/api/room-assignments', { method: 'GET' }, adminToken);
    recordTest('Operations Service', 'GET /api/room-assignments', '/operations/room-assignments', 'STAFF', 'TC-OPS-02: Room cleaning allocations', 'HTTP 200', `HTTP ${raRes.status}`, 'operations_db.room_assignments', raRes.status === 200 ? 'PASS' : 'FAIL', raRes.data);

    // 44. Operations Service - Maintenance
    const maintRes = await api('/api/maintenance', { method: 'GET' }, adminToken);
    recordTest('Operations Service', 'GET /api/maintenance', '/operations/maintenance', 'STAFF', 'TC-OPS-03: Work orders and repairs', 'HTTP 200', `HTTP ${maintRes.status}`, 'operations_db.maintenance', maintRes.status === 200 ? 'PASS' : 'FAIL', maintRes.data);

    // 45. Operations Service - Expenses
    const expRes = await api('/api/expenses', { method: 'GET' }, adminToken);
    recordTest('Operations Service', 'GET /api/expenses', '/operations/expenses', 'STAFF', 'TC-OPS-04: Operational expenses', 'HTTP 200', `HTTP ${expRes.status}`, 'operations_db.expenses', expRes.status === 200 ? 'PASS' : 'FAIL', expRes.data);

    // 46. Operations Service - Cash Drawer Current
    const cashRes = await api('/api/cash-drawer/current', { method: 'GET' }, adminToken);
    recordTest('Operations Service', 'GET /api/cash-drawer/current', '/operations/cash-drawer', 'STAFF', 'TC-OPS-05: Current cash drawer status', 'HTTP 200 or 404 (no active drawer)', `HTTP ${cashRes.status}`, 'operations_db.cash_drawer', (cashRes.status === 200 || cashRes.status === 404) ? 'PASS' : 'FAIL', cashRes.data);

    // 47. Operations Service - Shift Handover
    const hoRes = await api('/api/shift-handover', { method: 'GET' }, adminToken);
    recordTest('Operations Service', 'GET /api/shift-handover', '/operations/shift-handover', 'STAFF', 'TC-OPS-06: Shift handover notes and logs', 'HTTP 200', `HTTP ${hoRes.status}`, 'operations_db.shift_handover', hoRes.status === 200 ? 'PASS' : 'FAIL', hoRes.data);

    // 48. Reporting Service - Daily Summary
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const rptSummary = await api(`/api/reports/daily-summary?date=${today}`, { method: 'GET' }, adminToken);
    recordTest('Reporting Service', 'GET /api/reports/daily-summary', '/reports', 'STAFF', 'TC-RPT-01: Executive daily operations summary', 'HTTP 200 aggregated summary', `HTTP ${rptSummary.status}`, 'Aggregated reporting tables', rptSummary.status === 200 ? 'PASS' : 'FAIL', rptSummary.data);

    // 49. Reporting Service - Occupancy Report
    const rptOcc = await api(`/api/reports/occupancy?startDate=${today}&endDate=${nextWeek}`, { method: 'GET' }, adminToken);
    recordTest('Reporting Service', 'GET /api/reports/occupancy', '/reports', 'STAFF', 'TC-RPT-02: Hotel occupancy metrics', 'HTTP 200 metrics and percentages', `HTTP ${rptOcc.status}`, 'Occupancy aggregation', rptOcc.status === 200 ? 'PASS' : 'FAIL', rptOcc.data);

    // 50. Reporting Service - Revenue Report
    const rptRev = await api(`/api/reports/revenue?startDate=${today}&endDate=${nextWeek}`, { method: 'GET' }, adminToken);
    recordTest('Reporting Service', 'GET /api/reports/revenue', '/reports', 'STAFF', 'TC-RPT-03: Revenue and income breakdown', 'HTTP 200 financial figures', `HTTP ${rptRev.status}`, 'Revenue analytics', rptRev.status === 200 ? 'PASS' : 'FAIL', rptRev.data);

    // 51. Notification Service - List Notifications
    const notifRes = await api('/api/notifications', { method: 'GET' }, adminToken);
    recordTest('Notification Service', 'GET /api/notifications', '/notifications', 'AUTHENTICATED', 'TC-NTF-01: List notifications for user', 'HTTP 200 notification list', `HTTP ${notifRes.status}, count: ${Array.isArray(notifRes.data) ? notifRes.data.length : 0}`, 'notification_db.notifications', notifRes.status === 200 ? 'PASS' : 'FAIL', notifRes.data);

    // 52. Security Test - Unauthorized Access without Token
    const unauthRes = await api('/api/guests', { method: 'GET' }, null);
    recordTest('API Gateway', 'GET /api/guests (No Token)', '/guests', 'ANONYMOUS', 'TC-SEC-01: Reject unauthenticated request', 'HTTP 401 Unauthorized', `HTTP ${unauthRes.status}`, 'Security filter blocked', unauthRes.status === 401 ? 'PASS' : 'FAIL', unauthRes.data);

    // 53. Security Test - Invalid Bearer Token
    const badTokenRes = await api('/api/guests', { method: 'GET' }, 'invalid.jwt.token.string');
    recordTest('API Gateway', 'GET /api/guests (Bad Token)', '/guests', 'ANONYMOUS', 'TC-SEC-02: Reject corrupted/forged token', 'HTTP 401 Unauthorized', `HTTP ${badTokenRes.status}`, 'JWT filter rejected signature', badTokenRes.status === 401 ? 'PASS' : 'FAIL', badTokenRes.data);

    console.log('===============================================================');
    const passed = testResults.filter(t => t.status === 'PASS').length;
    const failed = testResults.filter(t => t.status === 'FAIL').length;
    const blocked = testResults.filter(t => t.status === 'BLOCKED').length;
    console.log(`TOTAL AUDIT TESTS: ${testResults.length} | PASS: ${passed} | FAIL: ${failed} | BLOCKED: ${blocked}`);
    console.log('===============================================================');

    // Write results JSON file for reporting
    const fs = require('fs');
    fs.writeFileSync('audit-results.json', JSON.stringify({
        summary: { total: testResults.length, passed, failed, blocked },
        tests: testResults
    }, null, 2));
    console.log('Saved detailed audit results to audit-results.json');
}

runAudit().catch(console.error);
