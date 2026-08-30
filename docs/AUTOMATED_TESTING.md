# Automated Testing Report

**Project:** Autonomous Career Agent (CareerNav)
**Tool:** Katalon Studio 11.4.0
**Browser:** Chrome 152.0.7977.64
**Target:** `http://localhost:3000` (full stack via `make up`)
**Executed:** 29 August 2026
**Tester:** Tien Le

---

## 1. Summary

| | |
|---|---|
| Use cases covered | 2 |
| Scenarios per use case | 2 |
| Total test cases | **4** |
| Passed | **4** |
| Failed | **0** |
| Total duration | 1m 32s |
| Second consecutive run | **4/4 Passed** |

Both use cases were chosen because they touch neither the LLM nor the scraper,
so every run returns the same result — a requirement for automation that has to
be repeatable.

Each script signs in for itself and opens its own browser
(`isReuseDriver = false`), so no scenario depends on state left behind by
another.

---

## 2. Test cases

### TC01 — UC01 Sign in, valid credentials

| | |
|---|---|
| **Test case name** | `UC01_SignIn_ValidCredentials` |
| **Objective** | A registered user can sign in and reach an authenticated page |
| **Precondition** | Account `katalon@example.com` exists; app running on port 3000 |
| **Duration** | 12.0s |
| **Result** | **PASSED** |

**Steps**

| # | Action | Data |
|---|---|---|
| 1 | Open browser, maximise | |
| 2 | Navigate to `/signin` | |
| 3 | Verify the sign-in form is present | "Welcome back" |
| 4 | Enter email | `katalon@example.com` |
| 5 | Enter password | *(from profile)* |
| 6 | Click **Log in to CareerNav** | |
| 7 | Verify the URL no longer contains `/signin` | |
| 8 | Verify the sign-in form is gone | |
| 9 | Capture screenshot | |

**Expected result** — the session is established and the app leaves the sign-in
page.

**Actual result** — the app navigated away from `/signin` and the form was no
longer present. Screenshot: `01_UC01_SignIn_ValidCredentials_PASSED.png`.

**Note** — after login the app routes to `/dashboard`, `/profile-setup` or
`/profile-preferences` depending on how complete the profile is, so the check is
"no longer on `/signin`" rather than one fixed URL.

---

### TC02 — UC01 Sign in, wrong password

| | |
|---|---|
| **Test case name** | `UC01_SignIn_WrongPassword` |
| **Objective** | A wrong password is rejected without revealing whether the account exists |
| **Precondition** | Same account exists |
| **Duration** | 6.5s |
| **Result** | **PASSED** |

**Steps**

| # | Action | Data |
|---|---|---|
| 1 | Open browser, navigate to `/signin` | |
| 2 | Enter a registered email | `katalon@example.com` |
| 3 | Enter a wrong password | `ThisIsNotThePassword123` |
| 4 | Click **Log in to CareerNav** | |
| 5 | Wait for the error message | |
| 6 | Verify the message matches "incorrect email or password" | |
| 7 | Verify the URL still contains `/signin` | |
| 8 | Verify the sign-in form is still shown | |
| 9 | Capture screenshot | |

**Expected result** — an error appears and the user stays on the sign-in page.

**Actual result** — the form displayed *"Incorrect email or password. Please try
again."*, the URL stayed on `/signin`, and no session was created. Screenshot:
`02_UC01_SignIn_WrongPassword_ErrorShown.png`.

**Note** — the message is deliberately the same for a wrong password and an
unknown email, so it cannot be used to discover which accounts exist. The script
asserts that generic wording rather than a specific one.

---

### TC03 — UC02 Profile setup, save valid data

| | |
|---|---|
| **Test case name** | `UC02_ProfileSetup_SaveValidData` |
| **Objective** | A completed profile is saved and survives a page reload |
| **Precondition** | Same account exists; `/profile-setup` requires a token, so the script signs in first |
| **Duration** | 36.8s |
| **Result** | **PASSED** |

**Steps**

| # | Action | Data |
|---|---|---|
| 1 | Open browser, sign in | |
| 2 | Navigate to `/profile-setup` | |
| 3 | Fill Full Name | `Katalon Bot` |
| 4 | Fill Professional Headline | `Backend Engineer <timestamp>` |
| 5 | Fill Phone | `+84901234567` |
| 6 | Fill Location | `Ho Chi Minh City, Vietnam` |
| 7 | Fill Professional Summary | *(3-line text)* |
| 8 | Walk the wizard to the last step and click **Complete** | |
| 9 | Capture screenshot after save | |
| 10 | Reload `/profile-setup` | |
| 11 | Verify the headline field still holds the saved value | |
| 12 | Verify the phone field still holds the saved value | |
| 13 | Capture screenshot after reload | |

**Expected result** — the profile is stored and the values reappear after a
reload.

**Actual result** — after saving and reloading, the wizard showed the same
headline and phone. Screenshots: `03_UC02_ProfileSetup_AfterSave.png`,
`04_UC02_ProfileSetup_DataAfterReload.png`.

**Note** — the headline carries a timestamp, so the reload check proves *this*
run's value was stored rather than one left behind by an earlier run.

---

### TC04 — UC02 Profile setup, invalid input is blocked

| | |
|---|---|
| **Test case name** | `UC02_ProfileSetup_ValidationBlocksSave` |
| **Objective** | Invalid input is caught with a validation message and the save is blocked |
| **Precondition** | Same as TC03 |
| **Duration** | 36.5s |
| **Result** | **PASSED** |

**Steps**

| # | Action | Data |
|---|---|---|
| 1 | Open browser, sign in | |
| 2 | Navigate to `/profile-setup` | |
| 3 | Fill Full Name and Headline with valid text | |
| 4 | Fill Phone with a local-format number | `0901-234-567` |
| 5 | Walk the wizard to the last step and click **Complete** | |
| 6 | Verify an inline validation message names the phone problem | |
| 7 | Verify the wizard is still on `/profile-setup` at step 1 | |
| 8 | Verify the invalid value is still in the field | |
| 9 | Capture screenshot | |

**Expected result** — the form is blocked with a validation message.

**Actual result** — the wizard showed *"Phone must be in international format,
e.g. +84 901 234 567."*, returned to step 1 with the Phone field outlined in
red, and did not save. Screenshot:
`05_UC02_ProfileSetup_ValidationBlocked.png`.

**Note on scenario choice** — the original plan was "leave a required field
empty", but no profile field is actually required: `API_CONTRACT §A2` accepts
null for all of them and the wizard offers a deliberate "Skip for now" path.
Phone format (E.164) is the one rule the wizard does enforce, so the scenario
exercises that instead. Validation runs on the Complete path only; "Skip all"
bypasses it by design.

---

## 3. Test scripts

Full scripts live in the repository:

```
katalon/
├── SCRUM-82.prj                        Katalon project
├── Test Cases/                         4 test case definitions (.tc)
├── Scripts/<test case>/Script.groovy   4 executable scripts
├── Object Repository/                  17 UI elements
│   ├── SignIn/                         6 objects
│   ├── ProfileSetup/                   10 objects
│   └── Dashboard/                      1 object
├── Profiles/default.glbl               baseUrl, email, password
├── Test Suites/SCRUM-82 UC01-UC02.ts   runs all four
├── screenshots/                        5 execution screenshots
└── README.md                           how to run, troubleshooting
```

### Example — `UC01_SignIn_WrongPassword`

```groovy
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

String baseUrl = GlobalVariable.baseUrl
String email = GlobalVariable.email

WebUI.openBrowser('')
WebUI.maximizeWindow()

WebUI.navigateToUrl(baseUrl + '/signin')
WebUI.verifyElementPresent(findTestObject('SignIn/txt_welcome'), 10)

WebUI.setText(findTestObject('SignIn/input_email'), email)
WebUI.setText(findTestObject('SignIn/input_password'), 'ThisIsNotThePassword123')
WebUI.click(findTestObject('SignIn/btn_login'))

WebUI.waitForElementPresent(findTestObject('SignIn/msg_server_error'), 15)

String shown = WebUI.getText(findTestObject('SignIn/msg_server_error'))
WebUI.verifyMatch(shown, '(?i).*incorrect email or password.*', true)

WebUI.verifyEqual(WebUI.getUrl().contains('/signin'), true)
WebUI.verifyElementPresent(findTestObject('SignIn/txt_welcome'), 5)

WebUI.takeScreenshot()
WebUI.closeBrowser()
```

### Object Repository

| Object | Selector |
|---|---|
| `SignIn/input_email` | `#l-email` |
| `SignIn/input_password` | `#l-password` |
| `SignIn/btn_login` | `//button[contains(., 'Log in to CareerNav')]` |
| `SignIn/txt_welcome` | `//*[contains(text(),'Welcome back')]` |
| `SignIn/msg_server_error` | `div[class*='server-error']` |
| `ProfileSetup/input_name` | `#ps-name` |
| `ProfileSetup/input_headline` | `#ps-headline` |
| `ProfileSetup/input_phone` | `#ps-phone` |
| `ProfileSetup/input_location` | `#ps-location` |
| `ProfileSetup/input_summary` | `#ps-summary` |
| `ProfileSetup/btn_next` | `button.ps-btn-next` |
| `ProfileSetup/btn_finish` | `button.ps-btn-finish` |
| `ProfileSetup/msg_field_error` | `p.ps-field-error` |
| `ProfileSetup/card_personal_info` | `//div[@class='ps-card-title'][contains(., 'Personal Info')]` |

The wizard is walked by button **class**, not by label: step names have changed
during development (`Next: Projects` → `Next: Work Experience`) and broke tests
that keyed off the text.

---

## 4. Results

| # | Test case | Scenario | Duration | Result |
|---|---|---|---|---|
| TC01 | `UC01_SignIn_ValidCredentials` | valid credentials | 12.0s | **PASSED** |
| TC02 | `UC01_SignIn_WrongPassword` | wrong password | 6.5s | **PASSED** |
| TC03 | `UC02_ProfileSetup_SaveValidData` | save and reload | 36.8s | **PASSED** |
| TC04 | `UC02_ProfileSetup_ValidationBlocksSave` | invalid phone | 36.5s | **PASSED** |
| | **Test Suite `SCRUM-82 UC01-UC02`** | | **1m 32s** | **4/4 PASSED** |

A second consecutive run also returned 4/4 PASSED, confirming the scripts do not
depend on a clean starting state.

Katalon reports (HTML, CSV, JUnit XML) are written to `katalon/Reports/` and are
regenerated on each run, so they are not committed.

---

## 5. Screenshots

| File | What it shows |
|---|---|
| `01_UC01_SignIn_ValidCredentials_PASSED.png` | the app after a successful sign in |
| `02_UC01_SignIn_WrongPassword_ErrorShown.png` | the generic error message on the sign-in page |
| `03_UC02_ProfileSetup_AfterSave.png` | the wizard right after saving |
| `04_UC02_ProfileSetup_DataAfterReload.png` | the saved headline and phone still present after reload |
| `05_UC02_ProfileSetup_ValidationBlocked.png` | the phone field outlined in red, wizard held at step 1 |

All five are in `katalon/screenshots/`.

---

## 6. How to reproduce

```bash
# 1. start the stack
make up

# 2. create the test account (201 = created, 409 = already there)
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"katalon@example.com","password":"Katalon1234","full_name":"Katalon Bot"}'
```

Then open Katalon Studio → `File → Open Project…` → select the `katalon` folder
→ open `Test Suites/SCRUM-82 UC01-UC02` → **Run** → Chrome.

`katalon/README.md` covers troubleshooting, including the ChromeDriver version
mismatch that appears when Chrome auto-updates.
