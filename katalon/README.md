# SCRUM-82 — Katalon scripts: Sign in & Profile Setup

Four scripts, two use cases, two scenarios each, run against `http://localhost:3000`.

| Test case | Scenario | Expected |
|---|---|---|
| `UC01_SignIn_ValidCredentials` | valid credentials | leaves `/signin`, sign-in form gone |
| `UC01_SignIn_WrongPassword` | wrong password | generic error, stays on `/signin` |
| `UC02_ProfileSetup_SaveValidData` | fill wizard, save | values survive a page reload |
| `UC02_ProfileSetup_ValidationBlocksSave` | phone not in E.164 | inline error, save blocked |

Both UC02 scripts sign in for themselves — `/profile-setup` needs a token.
Neither use case touches the LLM or the scraper, so every run gives the same
result.

## Before the first run

**1. Start the stack**

```bash
make up
```

Wait until `http://localhost:3000` and `http://localhost:8000/health` both answer.

**2. Create the test account**

The scripts sign in with an account that must already exist. These are
throwaway credentials for a local test account — not a real secret:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"katalon@example.com","password":"Katalon1234","full_name":"Katalon Bot"}'
```

`201` means created, `409` means it already exists — either is fine.

To use a different account, edit `Profiles/default.glbl` (`email`, `password`).
The password must be at least 8 characters with a letter and a digit, per
`API_CONTRACT §A1`.

**3. Open the project in Katalon Studio**

`File → Open Project…` → select the `katalon` **folder** (Katalon 11 asks for
the folder, not the `.prj` file).

The Test Cases, Object Repository and the `default` profile load with it.

## Running

**One scenario:** open a test case → `Run` → pick Chrome.

**All four:** open `Test Suites/SCRUM-82 UC01-UC02` → `Run`.

Each script opens its own browser (`isReuseDriver = false`), so a failure in one
scenario cannot leave a session behind that changes the next one — this is the
"each script signs in by itself" acceptance criterion.

## Screenshots for the report

`WebUI.takeScreenshot()` fires at the end of every script, plus after saving in
`UC02_ProfileSetup_SaveValidData`. Katalon writes them to:

```
katalon/Reports/<timestamp>/…
```

Open the HTML report from `Test Explorer → Reports` to view them inline. The
five shots from the passing run are also copied to `katalon/screenshots/` with
descriptive names, ready for the PA report.

## Object Repository

Every selector was verified against the running app, so they match the real DOM
rather than a recording that may have drifted.

| Object | Selector |
|---|---|
| `SignIn/input_email` | `#l-email` |
| `SignIn/input_password` | `#l-password` |
| `SignIn/btn_login` | `//button[contains(., 'Log in to CareerNav')]` |
| `SignIn/txt_welcome` | `//*[contains(text(),'Welcome back')]` |
| `SignIn/msg_server_error` | `div[class*='server-error']` |
| `ProfileSetup/input_name` … `input_summary` | `#ps-name`, `#ps-headline`, `#ps-email`, `#ps-phone`, `#ps-location`, `#ps-summary` |
| `ProfileSetup/btn_next` / `btn_finish` | `button.ps-btn-next` / `button.ps-btn-finish` |
| `ProfileSetup/msg_field_error` | `p.ps-field-error` |
| `ProfileSetup/card_personal_info` | `//div[@class='ps-card-title'][contains(., 'Personal Info')]` |

The wizard is walked by button **class**, not by label: step names have changed
before (`Next: Projects` → `Next: Work Experience`) and broke tests that keyed
off the text.

## Notes on the scenarios

**UC01 valid credentials** — the app routes to `/dashboard`, `/profile-setup` or
`/profile-preferences` depending on how complete the profile is, so the check is
"no longer on `/signin`" rather than one fixed URL.

**UC01 wrong password** — the message is intentionally the same for a wrong
password and an unknown email, so it cannot be used to discover which accounts
exist. The script asserts that generic wording.

**UC02 save** — the headline carries a timestamp, so the reload check proves
*this* run's value was stored, not one left by an earlier run.

**UC02 validation** — the ticket says "leave a required field empty", but no
profile field is actually required: `API_CONTRACT §A2` accepts null for all of
them and the wizard offers "Skip for now" on purpose. Phone format (E.164) is
the one rule the wizard enforces, so the scenario uses that instead. Validation
runs on the Complete path only — "Skip all" bypasses it by design.

## Troubleshooting

**`Save failed: Request failed (500)`** — the database is missing a table added
in a later ticket. `01_schema.sql` only runs when the Postgres volume is first
created. Fix with `make clean && make up` (wipes data), or apply the missing DDL
by hand.

**Element not found** — check the app is on `http://localhost:3000` and that
`GlobalVariable.baseUrl` matches. If the UI changed, update the selector in the
Object Repository rather than in the script.

**Login does nothing** — confirm the account exists (step 2) and that
`api-gateway` is up: `curl http://localhost:8000/health`.
