// azureNativeResources.ts
import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native";
import * as azuread from "@pulumi/azuread";

export const resourceGroup = new azure_native.resources.ResourceGroup("myResourceGroup", {
    location: "centralindia",
    resourceGroupName: "myResourceGroup",
});

export const appServicePlan = new azure_native.web.AppServicePlan("myAppServicePlan", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
        tier: "Basic",
        name: "B1",
    },
    kind: "Linux",
    reserved: true,
    tags: {
        environment: "production",
    },
});

export const appService = new azure_native.web.WebApp("myAppService", {
    name: "someAppServiceName",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    serverFarmId: appServicePlan.id,
    siteConfig: {
        linuxFxVersion: "JAVA|17-java17",
        appSettings: [
            {
                name: "WEBSITE_RUN_FROM_PACKAGE", 
                value: "1"
            },
            {
                name: "GITHUB_TOKEN",
                value: pulumi.secret(process.env.GITHUB_TOKEN).apply(token => {
                    if (!token) {
                        throw new Error("GitHub token is not set in the environment variables.");
                    }
                    return token;
                }),
            },
        ],
    },
});

export const sourceControl = new azure_native.web.WebAppSourceControl("sourceControl", {
    name: appService.name,
    resourceGroupName: resourceGroup.name,
    repoUrl: "https://github.com/human-artist/api.git",
    branch: "gh-pages",
    isManualIntegration: true,
    isGitHubAction: false,
});

export const roleAssignment = new azure_native.authorization.RoleAssignment("roleAssignment", {
    scope: appService.id,
    principalId: azuread.getClientConfig().then(config => config.clientId),
    roleDefinitionId: "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c",
    principalType: "ServicePrincipal",
});
