import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable as GlobalVariable

/**
 * UC02 — Profile setup, scenario 2: invalid input is blocked with a validation
 * message and the wizard does not move on.
 *
 * The ticket says "leave a required field empty", but no profile field is
 * actually required — API_CONTRACT §A2 accepts null for all of them, and the
 * wizard has a deliberate "Skip for now" path. Phone format is the one rule the
 * wizard does enforce (E.164), so that is what this scenario exercises.
 *
 * Validation runs on the Complete path only; "Skip all" bypasses it on purpose,
 * since blocking someone who chose to skip would be counterproductive.
 */
String baseUrl = GlobalVariable.baseUrl
String email = GlobalVariable.email
String password = GlobalVariable.password

String badPhone = '0901-234-567'   // local format, missing country code

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

// ---- Enter a phone number that is not in international format ----
WebUI.setText(findTestObject('ProfileSetup/input_name'), 'Nguyen Van A')
WebUI.setText(findTestObject('ProfileSetup/input_headline'), 'Backend Engineer')
WebUI.setText(findTestObject('ProfileSetup/input_phone'), badPhone)
WebUI.setText(findTestObject('ProfileSetup/input_location'), 'Ho Chi Minh City, Vietnam')

// ---- Walk to the last step and try to save ----
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

WebUI.delay(3)

// 1. an inline validation message names the problem
WebUI.waitForElementPresent(findTestObject('ProfileSetup/msg_field_error'), 10)
String message = WebUI.getText(findTestObject('ProfileSetup/msg_field_error'))
WebUI.comment('Validation message: ' + message)
WebUI.verifyMatch(message, '(?i).*(phone|international format).*', true)

// 2. the save is blocked: the wizard sends the user back to step 1 and stays put
WebUI.verifyEqual(WebUI.getUrl().contains('/profile-setup'), true)
WebUI.verifyElementPresent(findTestObject('ProfileSetup/card_personal_info'), 5)

// the bad value is still in the box, waiting to be corrected
WebUI.verifyMatch(
    WebUI.getAttribute(findTestObject('ProfileSetup/input_phone'), 'value'),
    badPhone, false)

WebUI.takeScreenshot()
WebUI.closeBrowser()
