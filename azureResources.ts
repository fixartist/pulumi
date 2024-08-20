import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as azuread from "@pulumi/azuread";

export const resourceGroup = new azure.core.ResourceGroup("myResourceGroup", {
    location: "Central India",
});

export const appServicePlan = new azure.appservice.ServicePlan("myAppServicePlan", {
    name: "someAppServicePlan",
    location: resourceGroup.location,
    resourceGroupName: resourceGroup.name,
    osType: "Linux",
    skuName:"P1v2", // B1
    // sku: {
    //     tier: "Basic",
    //     size: "B1",
    // },
    tags: {
        environment: "production",
    },
});

const githubToken = pulumi.secret(process.env.GITHUB_TOKEN).apply(token => {
    if (!token) {
        throw new Error("GitHub token is not set in the environment variables.");
    }
    return token;
});

const appSettings = {
    "WEBSITE_RUN_FROM_PACKAGE": "1",
    "GITHUB_TOKEN": githubToken,
};

export const appService = new azure.appservice.LinuxWebApp("myAppService", {
    name: "someAppServiceName",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    servicePlanId: appServicePlan.id,
    siteConfig: {
        //linuxFxVersion: "JAVA|17-java17",
        applicationStack:{
            javaServer:"JAVA",
            javaServerVersion:"17",
            javaVersion: "17",
        }
    },
    //appSettings: appSettings,
});

export const sourceControlToken = new azure.appservice.SourceControlToken('GithubToken',{
    token: githubToken,
    type: "GitHub"
})

export const sourceControl = new azure.appservice.SourceControl('mySourceControl',{
    appId:appService.id,
    repoUrl: "https://github.com/human-artist/api.git",
    branch: "gh-pages",
})

export const roleAssignment =  (sp: azuread.ServicePrincipal) => new azure.authorization.Assignment("roleAssignment", {
    scope: pulumi.interpolate`${appService.id}`,
    roleDefinitionName: "Contributor",
    principalId: sp.id,
});

// export const appServiceUrl = pulumi.interpolate`https://${appService.defaultHostname}`;
