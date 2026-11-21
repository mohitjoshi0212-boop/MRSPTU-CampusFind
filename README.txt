# MRSPTU CAMPUSFIND – FUNCTIONAL WEBSITE DEMO

**Created and developed by Mohit Joshi**  
© 2026 MRSPTU CampusFind. All rights reserved.

## Pages Included

- **index.html** – Home page, search, category filtering, and community board.
- **report.html** – Report lost or found items, optional photo upload, and form validation.
- **lost-items.html** – Browse lost items with search and filtering.
- **found-items.html** – Browse found items with search and filtering.
- **login.html** – Demo browser-based login system.
- **register.html** – Demo account registration.
- **dashboard.html / my-reports.html** – View and manage personal reports, edit, delete, mark items as returned, and reopen reports.

## Functions

1. Reports are saved in browser LocalStorage and persist across pages and browser reloads.
2. Search matches item name, description, location, and category.
3. Category filtering works on the home page and listing pages.
4. Item cards open a detail popup containing report information.
5. Contact Reporter opens the user's email application using a `mailto:` link.
6. Claim Item opens an email draft for ownership verification.
7. Registration and login work within the same browser using demo accounts.
8. Dashboard allows users to edit, delete, and mark reports as returned.
9. Optional item photographs can be uploaded and stored in browser storage, with a maximum size limit of 900 KB.

## Important Limitations

This is a **frontend-only demonstration project**.

- Reports and accounts are stored in the visitor's own browser.
- Different visitors and devices do not share reports.
- Login is not secure real-world authentication.
- LocalStorage is not a shared online database.
- The demo should not be used to store sensitive personal information.

To convert this project into a real public multi-user platform, it requires:

- A shared backend and database such as Firebase or Supabase.
- Secure user authentication.
- Database security rules.
- Cloud image storage.
- Server-side validation and access control.

## Public Hosting

The website can be deployed using **Netlify Drop** or another static hosting service.

Upload the extracted project folder with `index.html` located in the root directory.

**Project:** MRSPTU CampusFind  
**Developer:** Mohit Joshi  
**Purpose:** Campus Lost and Found Platform