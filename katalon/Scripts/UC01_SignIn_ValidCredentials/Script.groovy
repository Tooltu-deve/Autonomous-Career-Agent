import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable as GlobalVariable

/**
 * UC01 — Sign in, scenario 1: valid credentials.
 *
 * Signs in with a registered account and confirms the app leaves the sign-in
 * page for an authenticated one.
 *
 * The account in Profiles/default must already exist. Onboarding decides where
 * a user lands after login — /dashboard, /profile-setup or /profile-preferences
 * depending on how far the profile is filled in — so the check is "no longer on
 * /signin" rather than one fixed URL.
 */
String baseUrl = GlobalVariable.baseUrl
String email = GlobalVariable.email
String password = GlobalVariable.password

WebUI.openBrowser('')
WebUI.maximizeWindow()

WebUI.navigateToUrl(baseUrl + '/signin')
WebUI.verifyElementPresent(findTestObject('SignIn/txt_welcome'), 10)

WebUI.setText(findTestObject('SignIn/input_email'), email)
WebUI.setText(findTestObject('SignIn/input_password'), password)
WebUI.click(findTestObject('SignIn/btn_login'))

// Redirect happens after the token is stored and onboarding state is read.
WebUI.waitForPageLoad(15)
WebUI.delay(3)

String landedOn = WebUI.getUrl()
WebUI.comment('Landed on: ' + landedOn)

WebUI.verifyEqual(landedOn.contains('/signin'), false)

// The sign-in form must be gone — proof the session was actually established.
WebUI.verifyElementNotPresent(findTestObject('SignIn/txt_welcome'), 5)

WebUI.takeScreenshot()
WebUI.closeBrowser()
