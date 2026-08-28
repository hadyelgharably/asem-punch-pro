# ASEM MMA Coach

Build a complete ASEM MMA 🥊 Client Management App in Google AppSheet.

I want you to create the application structure and configuration, not just explain how to build it.

The app is for an MMA coach who needs to manage clients, packages, subscriptions, attendance, and remaining sessions.

The app must be mobile-first and work perfectly on Android phones and tablets.



1. APP NAME

ASEM MMA 🥊

Style:

Premium

Minimal

Athletic

Modern

Strong

Professional MMA coaching brand

Use a dark/black visual style with white text and a strong red accent where possible.



2. USER ROLES

Create two roles:

ADMIN / COACH

The coach can:

View all clients

Add clients

Edit clients

Create packages

Edit packages

Record attendance

Renew subscriptions

View current subscriptions

View previous subscriptions

View complete attendance history

Search clients

Filter clients

See clients with 3 or fewer sessions

See expired subscriptions

CLIENT

A client can:

Sign in securely

View ONLY their own information

View their current package

View remaining sessions

View used sessions

View progress

View subscription start date

View subscription end date

View attendance history

See alerts when their package is almost finished

See alerts when their package is expired

Clients must NEVER be able to see another client’s information.

Use AppSheet security filters / USEREMAIL() / appropriate access control rather than relying only on view visibility.



3. DATA TABLES

Create the following tables.

USERS

Columns:

UserID

Name

Email

Role

Photo

Role values:

Admin
Client

Use Email as the user’s authentication identifier.



CLIENTS

Columns:

ClientID

UserEmail

ClientCode

FullName

Phone

Photo

Notes

CurrentSubscriptionID

Example Client Codes:

ASEM001
ASEM002
ASEM003
ASEM004
ASEM005



PACKAGES

Columns:

PackageID

PackageName

TotalSessions

DurationDays

Price

Active

Description

Create these sample packages:

8 Sessions
12 Sessions
16 Sessions
20 Sessions

Example:

8 Sessions:
TotalSessions = 8
DurationDays = 30

12 Sessions:
TotalSessions = 12
DurationDays = 45

16 Sessions:
TotalSessions = 16
DurationDays = 60

20 Sessions:
TotalSessions = 20
DurationDays = 90



SUBSCRIPTIONS

This table is extremely important.

Every time a client buys or renews a package, create a NEW subscription record.

Columns:

SubscriptionID

ClientID

PackageID

StartDate

EndDate

TotalSessions

Status

Status:

Active
Expired
Completed

NEVER delete previous subscriptions.

This allows lifetime history.



ATTENDANCE

Columns:

AttendanceID

ClientID

SubscriptionID

ClientEmail

DateTime

Status

Notes

Status:

Attended
Cancelled
No Show

Only “Attended” should consume a session.



4. CURRENT PACKAGE LOGIC

The Client table should display information from the client’s CurrentSubscriptionID.

Calculate:

Used Sessions

Count Attendance records where:

ClientID = current client

AND

SubscriptionID = current subscription

AND

Status = “Attended”

Remaining Sessions

TotalSessions - UsedSessions

Never allow the value to go below 0.

Progress Percentage

UsedSessions / TotalSessions × 100

Days Remaining

EndDate - TODAY()



5. STATUS LOGIC

Create a calculated status:

If:

Remaining Sessions <= 0

→ “COMPLETED”

Else if:

End Date < TODAY()

→ “EXPIRED”

Else if:

Remaining Sessions <= 3

→ “LOW SESSIONS”

Else:

→ “ACTIVE”



6. CLIENT ALERTS

If status is:

LOW SESSIONS

show:

🔥 You have 3 or fewer sessions remaining. Contact Coach Asem to renew.

If:

COMPLETED

show:

⚠️ Your package is finished. Contact Coach Asem to renew.

If:

EXPIRED

show:

⚠️ Your subscription has expired. Contact Coach Asem.

Otherwise show nothing.



7. ADMIN DASHBOARD

Create a dashboard called:

Coach Dashboard

Display:

🥊 ASEM MMA

Statistics:

Total Clients

Active Clients

Sessions Today

Low Session Clients

Expired Clients

Create a section:

⚠️ ATTENTION REQUIRED

Show clients where:

Status = LOW SESSIONS

OR

Status = EXPIRED

Sort by Remaining Sessions ascending.



8. TODAY’S ATTENDANCE

Create a prominent section:

TODAY’S TRAINING

Show active clients.

Each client should have a large action:

✓ MARK PRESENT

When the coach taps it:

Create a new Attendance record:

ClientID = selected client

SubscriptionID = selected client’s CurrentSubscriptionID

ClientEmail = selected client’s UserEmail

DateTime = NOW()

Status = “Attended”

Then show:

Attendance Recorded ✓

Prevent duplicate attendance for the same client on the same day if possible.



9. CLIENT LIST

Create:

CLIENTS

Use a card/list layout.

Show:

Photo
Full Name
Client Code
Current Package
Remaining Sessions
Status

Make status visually clear:

🟢 Active

🟠 Low Sessions

🔴 Expired / Completed

Allow search by:

Name
Phone
Client Code



10. CLIENT PROFILE — ADMIN

When Admin opens a client, show:

Profile photo

Full Name

Phone

Client Code

Current Package

Total Sessions

Used Sessions

Remaining Sessions

Progress %

Start Date

End Date

Status

Actions:

✓ MARK PRESENT

🔄 RENEW PACKAGE

✏️ EDIT CLIENT

📋 VIEW HISTORY



11. RENEW PACKAGE WORKFLOW

Create an Admin action:

RENEW PACKAGE

When clicked:

Show a form allowing Admin to select:

Package

Start Date

Then automatically calculate:

EndDate =
StartDate + Package.DurationDays

TotalSessions =
Package.TotalSessions

Create a NEW Subscription record.

Then update:

Client.CurrentSubscriptionID

to the newly created SubscriptionID.

IMPORTANT:

DO NOT delete old subscriptions.

DO NOT delete old attendance.

DO NOT reset or delete old history.



12. ATTENDANCE HISTORY

Admin should be able to see:

Attendance History

For every client:

Date
Time
Status
Package / Subscription
Notes

Sort newest first.



13. CLIENT HOME

When a Client signs in, show only their own dashboard.

Header:

Welcome, [Client Name] 🥊

Main card:

CURRENT PACKAGE

Example:

12 SESSIONS

Then:

8 USED

🔥 4 REMAINING

Show a progress bar.

Then:

Started:
28 Aug 2026

Expires:
12 Oct 2026

Status:
ACTIVE



14. CLIENT SESSIONS

Create:

MY SESSIONS

Show only the signed-in client’s attendance.

Sort newest first.

Each row:

Date
Time
Status

Example:

28 Aug 2026
✓ Attended

26 Aug 2026
✓ Attended

24 Aug 2026
✓ Attended

Clients must not be able to access another client’s attendance.



15. CLIENT PROFILE

Show:

Profile photo
Name
Client Code
Phone
Join Date

Do not allow the client to edit sensitive package/session information.



16. SECURITY

This is critical.

Use AppSheet authentication.

Require users to sign in.

Use:

USEREMAIL()

and Security Filters / appropriate AppSheet access controls.

For Clients:

Only return rows where:

Client.UserEmail = USEREMAIL()

Attendance must also be filtered so:

Attendance.ClientEmail = USEREMAIL()

Admin users must be able to access all clients and attendance.

Do NOT rely only on Show_If or view visibility for security.



17. SAMPLE DATA

Create these test clients:

Ahmed Ali
Omar Hassan
Youssef Mohamed
Karim Ahmed
Mahmoud Adel

Create sample Client Codes:

ASEM001
ASEM002
ASEM003
ASEM004
ASEM005

Create sample packages:

8 Sessions
12 Sessions
16 Sessions
20 Sessions

Create realistic subscriptions and attendance.

Test cases:

Ahmed Ali

Old subscription:
12 sessions

10 old attendance records.

Then create a NEW current subscription:
12 sessions

Expected current package:

12 total
0 used
12 remaining
0% progress

But the 10 old attendance records MUST remain visible in lifetime history.

Omar Hassan

3 sessions remaining.

Expected status:

LOW SESSIONS

Youssef Mohamed

Expired subscription.

Expected:

EXPIRED

Karim Ahmed

0 remaining sessions.

Expected:

COMPLETED

Mahmoud Adel

Active package with several sessions remaining.

Expected:

ACTIVE



18. IMPORTANT RENEWAL TEST

Test this exact scenario:

Ahmed had:

12 sessions

10 sessions attended.

Then renew Ahmed:

New package:
12 sessions

Expected:

CURRENT PACKAGE

Total:
12

Used:
0

Remaining:
12

Progress:
0%

But the old 10 attendance records must still exist.

This is mandatory.



19. NAVIGATION

Admin:

🏠 Dashboard
👥 Clients
📋 Attendance
📦 Packages
⚠️ Alerts

Client:

🏠 Home
🥊 My Package
📋 My Sessions
👤 Profile

Do not show Admin screens to Clients.

Do not show other clients’ information to Clients.



20. MOBILE UX

The app will primarily be used from an Android tablet.

Make:

Buttons large

Text readable

Attendance action extremely fast

Dashboard simple

Important numbers prominent

Minimal scrolling where possible

The most important client information is:

🔥 REMAINING SESSIONS

Make this visually dominant.



21. APP GOAL

The finished application should feel like a real professional MMA coaching platform, not a spreadsheet.

The coach should be able to manage approximately 20–200 clients.

The entire workflow should be possible from an Android tablet.



FINAL INSTRUCTION

Do not give me a tutorial.

Do not just describe the configuration.

Build and configure the AppSheet application using the available AppSheet creation capabilities.

Create the data structure, formulas, relationships, views, actions, workflows, security filters, sample data, and UI.

If something cannot be automatically created, tell me exactly what manual action is required.

Prioritize making the MVP functional first, then improve the visual design.

App name:

ASEM MMA 🥊

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://asem-punch-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/866ee5e6-ae5c-4365-870c-0e8bd907fb20).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
