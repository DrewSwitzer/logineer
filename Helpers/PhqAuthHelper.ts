import puppeteer from 'puppeteer';
import Logger from './Logger';

export default class  PhqAuthHelper {
    private _clientSecret: string;
    private _logger: Logger;

    constructor(logger: Logger, clientSecret: string) {
        this._logger = logger;
        this._clientSecret = clientSecret;
    }

    private getBrowser() {
        if(!this._clientSecret) {
            this._logger.logWarn('Client secret not found. Launching chromium locally.');
        }

        return this._clientSecret
            ?
            puppeteer.connect({ browserWSEndpoint: `wss://chrome.browserless.io?token=${this._clientSecret}` })
            :
            puppeteer.launch({ headless: false });
    }

    private mask(str: string) {
        return ('' + str).replace(/./g, '*');
    }

    public async phqAuth(email: string, password: string, clientName: string, url: string, getClientUrl: string) {

        this._logger.log("Launching browser");

        const emailAddressSelector = 'input[id=signInName]';
        const passwordInputSelector = 'input[id=password]';
        const loginButtonSelector = 'button[id=next]';
        let browser = null;
        let accessToken: string = null;
        try {
            browser = await this.getBrowser();
            const page = await browser.newPage();

            this._logger.log(`Navigating to ${url}`);

            await page.goto(url);

            this._logger.log(`Waiting for selector ${emailAddressSelector}`);

            this._logger.log(`Setting selector ${emailAddressSelector}`);

            this._logger.log(`Setting value ${email} for selector ${emailAddressSelector}`);
            let emailInput = null;

            try {
                emailInput = await page.waitForSelector(emailAddressSelector);
            } catch (error) {
                throw new Error(`${error.message}. Verify the authUrl and the login page template.`);
            }

            await emailInput.type(email);

            this._logger.log(`Setting value ${this.mask(password)} for selector ${passwordInputSelector}`);
            let passwordInput = null;

            try {
                passwordInput = await page.waitForSelector(passwordInputSelector);
            } catch (error) {
                throw new Error(`${error.message}. Verify the authUrl and the login page template.`);
            }

            await passwordInput.type(password);

            this._logger.log(`Logging in using selector ${loginButtonSelector}`);

            await page.$eval(loginButtonSelector, el => el.click());

            try {
                await page.waitForNavigation();
            } catch(error) {
                throw new Error(`${error.message}. Verify the loginUsername and loginUserPassword.`);
            }

            this._logger.log(`Waiting for getClient call ${getClientUrl}`);
            let firstResponse = null;

            try {
                firstResponse = await page.waitForResponse(getClientUrl);
            } catch(error) {
                throw new Error(`${error.message}. Verify the getClientUrl.`);
            }

            if (firstResponse.ok) {

                this._logger.log(`Waiting for client buttons`);

                //Wait for the first client button to show
                await page.waitForXPath('//*[@id="app"]/div/div[2]/div/div/div/div/div[2]/div/div[1]/button');

                this._logger.log(`Client buttons loaded`);

                //Find the span with the client name supplied in it, then grab its parent which will be the button to click
                const button = await page.$x(`//span[text() = '${clientName}']/parent::*`); //button

                //Even with waitForXPath above, sometimes the click happens too fast, so delay it for a second here
                await new Promise(x => setTimeout(x, 1000));
                try {
                    await button[0].click();
                } catch (error) {
                    throw new Error(`No clickable button found for clientName: ${clientName}`);
                }

                this._logger.log(`Waiting for page to load`);

                await page.waitForNavigation();

                this._logger.log(`Page loaded`);

                const localStorage = await page.evaluate(() => Object.assign({}, window.localStorage));

                accessToken = localStorage.accessToken;

                if(accessToken) {
                    this._logger.log('Access token retrieved successfully');
                } else {
                    throw new Error('Access token not found.');
                }
            }
        } finally {
            if (browser) {
                this._logger.log('Closing browser');
                browser.close();
            }
        }

        return accessToken;
    }
}