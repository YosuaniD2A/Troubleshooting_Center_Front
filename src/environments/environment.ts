// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  googleMaps: {
    apiKey: 'AIzaSyCp5YY4xKFC2LVaHswvkxli66bLg7Sxly0'
  },
  //Baselinker
  BASELINKER_API_URL: "https://api.baselinker.com/connector.php",
  BASELINKER_KEY: "8001422-8012947-18CSSMTMVMDQK5LD1KGWG1WTU7OIXM5SKTDACWP14H1N8QUFZVFIU164P9EIVLV2",
  //Shipstation
  SHIP_URL: 'https://ssapi.shipstation.com',
  SHIP_URL_MARKASSHIPPED: 'https://ssapi.shipstation.com/orders/markasshipped',
  SHIP_API_KEY: "d7fdcd4e64bb442582689e083d4ecfbd",
  SHIP_API_SECRET: "400abb4e9b234e878cca4f9d046007ad",
  tokenBase64: "ZDdmZGNkNGU2NGJiNDQyNTgyNjg5ZTA4M2Q0ZWNmYmQ6NDAwYWJiNGU5YjIzNGU4NzhjY2E0ZjlkMDQ2MDA3YWQ=",

  //Crea tu playera keys
  apiKey_1: "1562E79E6A69FFCBD6FD0F2E367",
  companyRefId_1: "631310",

  apiKey_2: "077E576B6D76247087F5BBE3D4B",
  companyRefId_2: "814688",

  callbackBaseURL: "https://d2america-integrator.up.railway.app/v1/orders/updateStatus/"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
