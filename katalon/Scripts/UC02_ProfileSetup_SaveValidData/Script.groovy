import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable as GlobalVariable

/**
 * UC02 — Profile setup, scenario 1: fill the wizard with valid data, save,
 * and confirm the data survives a page reload.
 *
 * The script signs in for itself because /profile-setup requires a token.
 * After login the app routes to /dashboard, /profile-setup or
 * /profile-preferences depending on onboarding state, so the script navigates
 * to the wizard explicitly instead of assuming where it landed.
 *
 * A timestamp goes into the headline so the value written by this run is
 * distinguishable from whatever a previous run left behind — otherwise a
 * reload check would pass on stale data.
 */
String baseUrl = GlobalVariable.baseUrl
String email = GlobalVariable.email
String password = GlobalVariable.password

String stamp = String.valueOf(System.currentTimeMillis())
String headline = 'Backend Engineer ' + stamp
String phone = '+84901234567'
String location = 'Ho Chi Minh City, Vietnam'

WebUI.openBrowser('')
WebUI.maximizeWindow()

// ---- Sign in ----
WebUI.navigateToUrl(baseUrl + '/signin')
WebUI.setText(findTestObject('SignIn/input_email'), email)
WebUI.setText(findTestObject('SignIn/input_password'), password)
WebUI.click(findTestObject('SignIn/btn_login'))
WebUI.waitForPageLoad(15)
WebUI.delay(3)
WebUI.verifyEqual(WebUI.getUrl().contains('/signin'), false)

// ---- Open the wizard ----
WebUI.navigateToUrl(baseUrl + '/profile-setup')
WebUI.verifyElementPresent(findTestObject('ProfileSetup/card_personal_info'), 15)

// ---- Fill step 1 ----
WebUI.setText(findTestObject('ProfileSetup/input_name'), 'Nguyen Van A')
WebUI.setText(findTestObject('ProfileSetup/input_headline'), headline)
WebUI.setText(findTestObject('ProfileSetup/input_phone'), phone)
WebUI.setText(findTestObject('ProfileSetup/input_location'), location)
WebUI.setText(findTestObject('ProfileSetup/input_summary'),
    'Backend engineer with 3 years of experience building Python APIs.')

// ---- Walk to the last step and save ----
// Step labels change as the wizard evolves, so the buttons are matched by their
// shared class: .ps-btn-next advances, .ps-btn-finish submits.
for (int i = 0; i < 6; i++) {
    if (WebUI.verifyElementPresent(findTestObject('ProfileSetup/btn_finish'), 2,
            FailureHandling.OPTIONAL)) {
        WebUI.click(findTestObject('ProfileSetup/btn_finish'))
        break
    }
    if (!WebUI.verifyElementPresent(findTestObject('ProfileSetup/btn_next'), 2,
            FailureHandling.OPTIONAL)) {
        break
    }
    WebUI.click(findTestObject('ProfileSetup/btn_next'))
    WebUI.delay(1)
}

// Saving is asynchronous: PUT /profile, then a toast, then a redirect.
WebUI.waitForPageLoad(15)
WebUI.delay(4)
WebUI.takeScreenshot()

// ---- Reload and confirm the data persisted ----
WebUI.navigateToUrl(baseUrl + '/profile-setup')
WebUI.verifyElementPresent(findTestObject('ProfileSetup/card_personal_info'), 15)
WebUI.delay(2)

String savedHeadline = WebUI.getAttribute(findTestObject('ProfileSetup/input_headline'), 'value')
String savedPhone = WebUI.getAttribute(findTestObject('ProfileSetup/input_phone'), 'value')
WebUI.comment('After reload — headline: ' + savedHeadline + ' | phone: ' + savedPhone)

WebUI.verifyMatch(savedHeadline, headline, false)
WebUI.verifyMatch(savedPhone, phone, false)

WebUI.takeScreenshot()
WebUI.closeBrowser()
