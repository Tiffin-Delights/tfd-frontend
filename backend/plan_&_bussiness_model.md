# 🍱 Online Tiffin / Mess Subscription Application

## 🚀 Overview

A subscription-based platform that connects **customers (students/professionals)** with **local mess/tiffin providers**, enabling affordable, hygienic, and reliable daily meals.

---

## 📌 Problem Statement

### Customers Face:

* Difficulty finding affordable & hygienic food
* Daily meal planning issues
* No centralized mess discovery system

### Providers Face:

* Lack of digital presence
* Unstable income
* Manual subscription handling

---

## 💡 Solution

A platform offering:

* 📍 Location-based mess discovery
* 📅 Monthly subscription model
* 💳 Online payments
* 📊 Provider & admin dashboards

---

## 👥 Users

### 1. Customers

* Students / working professionals
* Prefer subscription over daily ordering

### 2. Providers

* Local mess / tiffin owners
* Want stable monthly income

### 3. Admin

* Platform controller
* Manages approvals & analytics

---

# 🧠 Mind Map

```text
Users
 ├── Customers
 │     ├── Search Mess
 │     ├── View Menu
 │     ├── Subscribe
 │     ├── Payment
 │     └── Feedback
 │
 ├── Providers
 │     ├── Register
 │     ├── Add Menu
 │     ├── Manage Orders
 │     ├── Track Revenue
 │     └── Delivery
 │
 └── Admin
       ├── Approve Providers
       ├── Monitor System
       ├── Handle Complaints
       └── Analytics Dashboard
```

---

# 🧱 System Architecture Diagram

![Image](https://images.openai.com/static-rsc-4/-_YVMJRgNtw00762ZlUS9It3FvF7Wb-wULRIZOzKoa0uHGPLn0t0V4NuhI1Ruel8yRSSDhAQgnibCi7ezWjbx2qHD-aW5A1jtZS2J4ar3ALkZUd0WR_fAk2c8onGarfjqik4lsbs9BsThpz11xWz1uZMaxW50rSqQrkozvjNMxjOeenqmr9WYEe5quZ5B92s?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/HcHtBpPqblV4WnfpQwkSdp12P47VClu9KRlo9aPH2J4EV1b3vTaX-ysnBTQFpfAG8op9qkvdEsakw-bm6ODBQvMVG0rP-PzCLKCJm6UKBtp-Fj7Qfnrdv5wQSOhezzRnbwq4gyidA3pxwJhJBbnSMbu9gFBpCDQe3we71LuPHL0bZ_p8OMhGODj3Z6s7nv5r?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/VO7fzSUZ_7EBtFIyrX2Ir4TUWaqSVMBXrqkIn6OhvaMDxMTnAevq7-CoxeFhWCUYAu2-D9qt5OJ8mJ-2nOSiTAZ2ECAYpMxEPYJiKDvJib2NhNccjV-p0-_J-67EbKxuXaMPd7Ccew8mCA8SY1I4L9wYk8BC5m_Vb8TEVK1OSMRspI667qP-xtC9zdExwdH4?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/_SJku3hlt-D4OZXXRrFgc6hqf98GyGzjiz-kpKau8uYadgS_NctX0WVP27Qm4wQ150Fcm1sOG6GJo2ry7eerX50Y55hlXvYNAnhg96JBo-I0sco27J6d0sXL468xeJYhKItglrojd3B3vh4TYlJVJh_DDgBktz807DShrDdDJpZX9fXOMz-28jm3jKALOeig?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/2LRjsy4GERRt9sg_xInbEHL5akTMEtVdg5UcylDV4254OEEtkIBIkdja96pRUDQp5Gl3DKGczd42t9TueV-HYIlGx_zihsJl4IUwfc9j29OLueR2d-c3KqisNZVgCRpfsQNLB8eh0ph99kw7hlHya8oQOO16SQIfVeitYk6LvlA1mpHYZweGkzvCF-vgWMDx?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/nm79SPTDh8UWlJPGO9D2WM3F4tqu7XFMUkEINUn0VeCS0kUT1FOHvYrLvRLzhr6_UJwfqbLDB7goNLVV5I6yQlPkBZXD3oELF-9PAlmzw8uLjWE9QJjG6GXB6vcWWeCIJS6AWIU19j8eF9WSc7S16CuQ9VkZPToE_ZtR37X0uT13LEZ17zmfSR_kc9nrzQnN?purpose=fullsize)

```text
Frontend (React)
        ↓
Backend (FastAPI)
        ↓
Database (PostgreSQL / MongoDB)
        ↓
External Services (Razorpay, AWS S3)
```

---

# 🗂 ER Diagram (Database Design)

![Image](https://images.openai.com/static-rsc-4/nm79SPTDh8UWlJPGO9D2WM3F4tqu7XFMUkEINUn0VeCS0kUT1FOHvYrLvRLzhr6_UJwfqbLDB7goNLVV5I6yQlPkBZXD3oELF-9PAlmzw8uLjWE9QJjG6GXB6vcWWeCIJS6AWIU19j8eF9WSc7S16CuQ9VkZPToE_ZtR37X0uT13LEZ17zmfSR_kc9nrzQnN?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/0jDj4pfLScEGRFesi_dQqvsGSwQUmY9acRvoLkQNb1zb8WfodmE4DXc58Y1YDcRQ6-FrG4GNR675GfOB53uhU3p0E9OJFuwxSKN_lBzPsrSV8l5EwhUOnh3OHxLCxx5Xc1l1_TLhsW4OUAYFy3PYDKB4LGTXcWNptmlN0sebgsyAKYCIqp5t9MlGX3dawbPR?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/qWYss5kmK9EVVmcw9ilw0Ica3_tQQt7TULVVmeEUsg96WJlicCDzRjkOn2V1CSytpWiRoSMGPZodiYZjO2JQG2siOzvsGDy1kbUiV10FSXtW2n7NDQouuieVEUd-FsRKWXKWY8RygT-Nxu_51yHcz4oWoVLKtLdBI9ezxNNppadBc5WpyIQUS0bfb_dIlGXS?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/rRrRgbfZYmnjrZdViQZnvZYI9LUsxmjfqIxu8ESIYae9iDPme8kaLjAr7Y3i4TxhX9yJpnocxElaj4rK9KH1WXrxKCrazmsWincWWDL7e5kDUqWBjODqlxw4q6ei1QBy7SKaQJQmQDb_g4teMrWOS__lW7kRdJQh-tvXvfOHmqU6yuFjc9QKBdnGdqUXVGPq?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/Mraz7FED8svM7EPoerlFRkJhbol_05vEm2VHcsNCF4jKw2yUVbri_epsNr1tgC9M8ujQiMgbXDR-_0cS2_d8EN9JpVjPkVZhawJEvfPrcLedUSjeD7Un2dThpK5xcG2F1FR7i3OvAYgFLpQLo-I1nnrttdrEIheaB-0OcSbbFqN-gjL5UY9pd3QQdOxz5pBw?purpose=fullsize)

### Entities Relationship (Text Version)

```text
Users (1) ────< Orders >──── (1) Providers
   │                           │
   │                           │
   └────< Feedback >───────────┘

Providers (1) ────< Menu

Users (1) ────< Subscriptions >──── (1) Providers

Orders (1) ──── (1) Payments
```

---

# ⚙️ Features

## 🧑‍🍳 Customer Features

* Register/Login
* Location-based search
* Filters (Veg/Non-veg, price, rating)
* View menu
* Monthly subscription
* One-time order
* Online payment
* Cancel/modify subscription
* Ratings & reviews

---

## 🍽 Provider Features

* Registration & approval
* Menu management
* Pricing control
* Subscriber tracking
* Revenue analytics
* Delivery management

---

## 🛡 Admin Features

* Approve/reject providers
* Monitor system
* Complaint handling
* Analytics dashboard

---

# 🧑‍💻 Tech Stack

## Frontend

* React
* Tailwind CSS

## Backend

* FastAPI
* JWT Authentication

## Database

* PostgreSQL
* MongoDB

## External Services

* Razorpay
* AWS S3

## Deployment

* AWS / Render / Vercel

---

# 🛠 Implementation Plan

## 🔴 Phase 1: MVP

* Auth system
* Provider listing
* Menu system
* Subscription basic

## 🟡 Phase 2

* Filters
* Reviews
* Dashboard

## 🟢 Phase 3

* Payments (Razorpay)

## 🔵 Phase 4

* Delivery tracking
* Notifications

## 🧪 Phase 5

* Testing

## 🚀 Phase 6

* Deployment

---

# ⚡ Future Enhancements

* Subscription pause
* Trial meals
* AI recommendations
* Multi-city scaling

---

# 💰 Business Model

## Revenue

* Commission per subscription
* Featured listings
* Ads (future)

---

# 🎯 Conclusion

✅ Real problem
✅ Recurring revenue
✅ Scalable
✅ Startup potential 🚀

---

**Built by:**
Nikhil Verma & Team
