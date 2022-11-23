# Logineer
The Logineer is an Azure function app created to wrap automated login and access token scrapping in callable API.

# Getting Started

Clone the repo and install the dependencies.

```bash
git clone https://github.com/DrewSwitzer/logineer.git
npm i
```

To start the function app, run the following

```bash
npm run start
```

The Logineer uses a library called Puppeteer, which provides an API to control a Chromium instance. You do not need any environment variables to run this locally.

In production, the Logineer Puppeteer connects via websockets to a service called Browserless.io. This is only required in production as Chromium cannot be executed in Azure due to its Win32 GDI restrictions.

# Build and Test

To build the Logineer, run the following

```bash
npm run build
```

To test the Logineer, run the following (Note: There currently are no test cases)
```bash
npm run test
```

# Contribute
If you would like to contribute, please open a pull request.