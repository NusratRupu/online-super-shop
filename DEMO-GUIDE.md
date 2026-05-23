# NityoMart BD Demo Guide

## Project
NityoMart BD — Online Super Shop & Daily Essentials  
Academic title: Development of Multi-Vendor Resale & Super Shop System

## Demo Setup on Another Laptop

1. Clone the GitHub repository.
2. Open the project folder in VS Code.
3. Run `SETUP-NITYOMART.bat`.
4. Stop XAMPP MySQL.
5. Run `RESTORE-DATABASE.bat`.
6. Start XAMPP MySQL.
7. Run `START-NITYOMART.bat`.
8. Website opens at `http://localhost:3000`.

## Demo Login Credentials

| Role | URL | Email | Password |
|---|---|---|---|
| Customer | `/login` | rupu@gmail.com | 123456 |
| Vendor | `/vendor-login` | ahad@gmail.com | 1234 |
| Deliveryman | `/deliveryman-login` | delivery@nityomartbd.com | delivery123 |
| Admin | `/admin` | admin@nityomartbd.com | admin123 |

## Recommended Multi-Role Testing

Use separate browsers/profiles:
- Chrome normal: Customer
- Chrome incognito: Admin
- Edge: Vendor
- Another browser/profile: Deliveryman

## Main Demo Flow

1. Customer browses products and places an order.
2. Admin opens Orders and confirms the order.
3. Deliveryman logs in, takes the order, updates delivery progress, and marks delivered.
4. Customer opens My Account and confirms received.
5. Admin opens Delivery tab and approves deliveryman payout.
6. Admin opens Sales Records and checks seller earnings and platform commission.
7. Vendor/customer resale seller checks Earnings panel.

## Key Features to Show

- Customer shopping, cart, checkout, order tracking
- Customer resale product posting with admin approval
- Vendor product posting with admin approval
- Admin product/category/order/user/vendor/stock/product approval control
- Deliveryman order handling
- Customer received confirmation
- Admin delivery payout approval
- All Sale Records with seller earnings and platform commission
- Vendor/customer resale earnings records
- Portable setup with database backup and one-click start scripts

## Important Note

GitHub Pages is not used because this project requires React frontend, Express backend, MySQL database, login sessions, uploads, and dynamic APIs.
