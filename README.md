# Quadrants26 🛒
### A Hyperlocal Multi-Seller Marketplace

**Discover local stores. Shop nearby. Support local businesses.**

Quadrants26 is a hyperlocal marketplace designed to connect customers with nearby sellers through a single digital platform. Instead of visiting multiple stores or relying on disconnected ordering systems, customers can discover products from different local businesses in one place.

## 🎯 Problem Statement

Local businesses often struggle with limited online visibility, while customers face difficulties discovering nearby stores, comparing available products, and placing orders conveniently.

Existing e-commerce platforms do not always prioritize neighborhood-level shopping or provide smaller sellers with a simple way to reach local customers.

## 💡 Our Solution

Quadrants26 brings multiple local sellers together on a unified marketplace.

Our goal is to make local shopping more accessible, organized, and convenient while helping neighborhood businesses establish a digital presence.

## ✨ Key Features

### Customer Experience
- Browse products from multiple local sellers.
- Discover neighborhood stores.
- Search for available products.
- Add products to a shopping cart.
- Select pickup or delivery during checkout.
- Place orders through a centralized ordering system.

### Seller Experience
- Dedicated seller dashboard interface.
- Seller profile, inventory, and order views are previews and are not connected to backend APIs.

Authentication, payments, seller management, and order history are not configured.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Database Hosting | Aiven |
| Event Streaming | Apache Kafka |
| Search | OpenSearch |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel (target) |

## 🏗️ System Architecture

The platform follows a frontend–backend architecture.

```text
                CUSTOMER
                   |
                   v
          Frontend Interface
          HTML / CSS / JS
                   |
                REST API
                   |
                   v
          Node.js + Express
                   |
       +-----------+-----------+
       |           |           |
       v           v           v
   PostgreSQL   OpenSearch    Kafka
       |           |           |
   Products      Product     Order
   Sellers       Search      Events
   Orders
```

### PostgreSQL
Stores structured marketplace data, including products, sellers, inventory, and orders.

### Apache Kafka
Supports event-driven order processing by publishing order creation events for downstream consumers.

### OpenSearch
Provides product-search capabilities through a dedicated search API.

## 🔌 Backend API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/products` | Retrieve products |
| GET | `/api/sellers` | Retrieve sellers |
| GET | `/api/search?q=milk` | Search products |
| POST | `/api/orders` | Create a customer order |

## 📁 Project Structure

```text
Quadrants26/
├── frontend/
│   └── dashboard.html
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── db/
│   ├── server.js
│   └── package.json
│
└── README.md
```

*The structure above shows the main components rather than every repository file.*

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Python 3 (for serving the static frontend locally)
- Access to the configured PostgreSQL database
- Kafka and OpenSearch credentials where required

### 1. Clone the repository

```bash
git clone https://github.com/drathava847-beep/quadrants26.git
cd quadrants26
```

### 2. Set up the backend

```bash
npm --prefix backend ci
```

Copy `backend/.env.example` to `backend/.env` and set the service values. Set `PGSSL_CA_PATH` to the Aiven CA certificate file; `KAFKA_CA_PATH` is used as the fallback when the PostgreSQL-specific path is unset.

Never commit credentials or private certificates to GitHub.

### 3. Start the backend

```bash
npm --prefix backend start
```

The backend listens on the host-provided `PORT` or port `5003` locally. Kafka and OpenSearch configuration is optional for API startup; search requires OpenSearch.

### 4. Start the frontend

Open a separate terminal from the project root:

```bash
cd frontend
python3 -m http.server 8000
```

Open:

`http://localhost:8000/dashboard.html`

The backend must be running and accessible for live API-powered features to work.

## 🔄 Order Processing Workflow

1. A customer browses products from local sellers.
2. The customer adds products to their cart.
3. The checkout request is sent to the Express backend.
4. The backend validates the order and processes database operations.
5. PostgreSQL stores the order and associated seller orders.
6. The backend publishes an order creation event to Kafka.
7. Downstream services can consume the event for further processing.

## 🌍 Deployment

Deploy the backend as a persistent Node.js service (not as a Vercel function) so Kafka connections can remain available. Configure the Aiven PostgreSQL, OpenSearch, and Kafka environment values, including the CA file paths, and set `CORS_ORIGINS` to the exact frontend origin.

Deploy the static frontend from the repository root to Vercel using the included `vercel.json`. Set `window.QUADRANTS_API_URL` in `frontend/config.js` to the deployed backend's HTTPS origin before deploying. Keep `.env` files and certificates out of Git.

Verify `/api/health`, `/api/products`, `/api/sellers`, and `/api/search?q=milk` after deployment. Checkout creates a database order but does not process a payment.

## 👥 Team

Quadrants26 was developed collaboratively by a team of four developers.

- **Frontend Team:** Customer and seller interfaces, UI design, and frontend interactions.
- **Backend Team:** REST APIs, database integration, order processing, Kafka, and OpenSearch.

## 🔮 Future Scope

- Secure customer and seller authentication.
- Real-time order tracking and notifications.
- Improved inventory management.
- Location-based store discovery.
- Payment gateway integration.
- Seller analytics and reporting.
- Personalized product recommendations.

## 📌 Project Status

Quadrants26 is a hackathon prototype. Customer browse, search, cart, and database-backed checkout are integrated; deployment still requires configuring the backend host and production API URL.

---

**Built with teamwork, curiosity, and a vision to make local commerce more connected.**