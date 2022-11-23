import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import puppeteer from 'puppeteer';
const clientSecret: string = process.env.BROWSERLESS_IO_APP_SECRET;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    try {
        const email: string = (req.query.loginUserName || (req.body && req.body.loginUserName));
        const password: string = (req.query.loginUserPassword || (req.body && req.body.loginUserPassword));
        const clientName: string = (req.query.clientName || (req.body && req.body.clientName));
        const url: string = (req.query.authUrl || (req.body && req.body.authUrl));
        const getClientUrl: string = (req.query.getClientUrl || (req.body && req.body.getClientUrl));

        const token = await phqAuth(email, password, clientName, url, getClientUrl);

        context.res = {
            status: 200,
            body: { authToken: token },
        };
    } catch (error) {
        context.log(error);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
};

const log = (message: string) => {
    var currentDate = '[' + new Date().toLocaleTimeString() + ']';
    console.log(`${currentDate}: ${message}`);
}

const getBrowser = () =>
    clientSecret
        ?
        puppeteer.connect({ browserWSEndpoint: `wss://chrome.browserless.io?token=${clientSecret}` })
        :
        puppeteer.launch({ headless: false });

const phqAuth = async (email: string, password: string, clientName: string, url: string, getClientUrl: string) => {

    log("Launching browser");

    const emailAddressSelector = 'input[id=signInName]';
    const passwordInputSelector = 'input[id=password]';
    const loginButtonSelector = 'button[id=next]';
    let browser = null;
    let accessToken: string = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        log(`Navigating to ${url}`);

        await page.goto(url);

        log(`Waiting for selector ${emailAddressSelector}`);

        log(`Setting selector ${emailAddressSelector}`);

        log(`Setting value ${email} for selector ${emailAddressSelector}`);
        const emailInput = await page.waitForSelector(emailAddressSelector);
        await emailInput.type(email);

        log(`Setting value ${password} for selector ${passwordInputSelector}`);
        const passwordInput = await page.waitForSelector(passwordInputSelector);
        await passwordInput.type(password);

        log(`Logging in using selector ${loginButtonSelector}`);

        await page.$eval(loginButtonSelector, el => el.click());

        log(`Waiting for getClient call ${getClientUrl}`);
        const firstResponse = await page.waitForResponse(getClientUrl);

        if (firstResponse.ok) {

            log(`Waiting for client buttons`);

            //Wait for the first client button to show
            await page.waitForXPath('//*[@id="app"]/div/div[2]/div/div/div/div/div[2]/div/div[1]/button');

            log(`Client buttons loaded`);

            //Find the span with the client name supplied in it, then grab its parent which will be the button to click
            const button = await page.$x(`//span[text() = '${clientName}']/parent::*`); //button

            //Even with waitForXPath above, sometimes the click happens too fast, so delay it for a second here
            await new Promise(x => setTimeout(x, 1000));

            await button[0].click();

            log(`Waiting for page to load`);

            await page.waitForNavigation();

            log(`Page loaded`);

            const localStorage = await page.evaluate(() => Object.assign({}, window.localStorage));

            log(`accessToken: ${localStorage.accessToken}`);

            accessToken = localStorage.accessToken;
        }
    } finally {
        if (browser) {
            browser.close();
        }
    }

    return accessToken;

};

export default httpTrigger;