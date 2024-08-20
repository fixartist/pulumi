// index.ts
import * as azuread from "@pulumi/azuread";
import * as pulumi from "@pulumi/pulumi";
// import { appService, resourceGroup, appServicePlan, sourceControl, roleAssignment } from "./azureNativeResources";
import { appService, resourceGroup, appServicePlan, roleAssignment, sourceControl, sourceControlToken } from "./azureResources";

// Create an Azure AD Application
const app = new azuread.Application("myApp", {
    displayName: "my-app",
});

// Create a Service Principal for the Application
const sp = new azuread.ServicePrincipal("mySp", {
    //applicationId: app.applicationId,
    clientId: app.clientId
});

const ra = roleAssignment(sp) // For azureResources

// Create a Service Principal Password (Client Secret)
const spPassword = new azuread.ServicePrincipalPassword("mySpPassword", {
    servicePrincipalId: sp.id,
    endDate: "2099-01-01T00:00:00Z",
});

// Export the Client ID, Client Secret, and Tenant ID
// export const clientId = app.applicationId;
export const clientId = app.clientId;
export const clientSecret = spPassword.value;
export const tenantId = azuread.getClientConfig().then(config => config.tenantId);
export const appServiceUrl = pulumi.interpolate`https://${appService.defaultHostname}`; // For azureResources
//export const appServiceUrl = pulumi.interpolate`https://${appService.defaultHostName}`;  // For azureNativeResources
