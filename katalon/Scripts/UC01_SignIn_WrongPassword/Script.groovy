import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable as GlobalVariable

/**
 * UC01 — Sign in, scenario 2: wrong password.
 *
 * Confirms an error is shown and the user stays on the sign-in page.
 *
 * The message is deliberately generic ("Incorrect email or password") for both
 * a wrong password and an unknown email, so an attacker cannot use it to find
 * out which accounts exist.
 */
String baseUrl = GlobalVariable.baseUrl
String email = GlobalVariable.email

WebUI.openBrowser('')
WebUI.maximizeWindow()

WebUI.navigateToUrl(baseUrl + '/signin')
WebUI.verifyElementPresent(findTestObject('SignIn/txt_welcome'), 10)

WebUI.setText(findTestObject('SignIn/input_email'), email)
WebUI.setText(findTestObject('SignIn/input_password'), 'ThisIsNotThePassword123')
WebUI.click(findTestObject('SignIn/btn_login'))

// Wait for the server to answer 401 and the form to render the error.
WebUI.waitForElementPresent(findTestObject('SignIn/msg_server_error'), 15)

String shown = WebUI.getText(findTestObject('SignIn/msg_server_error'))
WebUI.comment('Error shown: ' + shown)
WebUI.verifyMatch(shown, '(?i).*incorrect email or password.*', true)

// The user must still be on the sign-in page, with the form still visible.
WebUI.verifyEqual(WebUI.getUrl().contains('/signin'), true)
WebUI.verifyElementPresent(findTestObject('SignIn/txt_welcome'), 5)

WebUI.takeScreenshot()
WebUI.closeBrowser()
