import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import Logger from '../Helpers/Logger';
import PhqAuthHelper from "../Helpers/PhqAuthHelper";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const clientSecret: string = process.env.BROWSERLESS_IO_APP_SECRET;
    const logger = new Logger(context);
    const phqAutHelper = new PhqAuthHelper(logger, clientSecret);

    logger.log('HTTP trigger function processed a request.');
    try {
        const email: string = (req.query.loginUserName || (req.body && req.body.loginUserName));
        const password: string = (req.query.loginUserPassword || (req.body && req.body.loginUserPassword));
        const clientName: string = (req.query.clientName || (req.body && req.body.clientName));
        const url: string = (req.query.authUrl || (req.body && req.body.authUrl));
        const getClientUrl: string = (req.query.getClientUrl || (req.body && req.body.getClientUrl));

        const token = await phqAutHelper.phqAuth(email, password, clientName, url, getClientUrl);

        context.res = {
            status: 200,
            body: { authToken: token },
        };
    } catch (error) {
        logger.log(error);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
};

export default httpTrigger;