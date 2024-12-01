import { Duration, StackProps, Stack } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Effect, IManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  Code,
  DockerImageFunction,
  Function,
  ILayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { createIAMRole } from "./iam";

export interface CommonProps extends StackProps {
  readonly stage: string;
  readonly region: string;
  readonly accountId: string;
  readonly isProd: boolean;
  readonly senderEmail: string;
}

export interface IAMRoleProps {
  readonly roleName: string;
  readonly managedPolicies: IManagedPolicy[];
  readonly actions: string[];
  readonly resources: string[];
}

export const createLambdaFunction = (
  scope: Construct,
  lambdaName: string,
  code: string,
  handler: string,
  stageName: string,
  iamProps: IAMRoleProps,
  environmentVariables: { [key: string]: string },
  timeout?: Duration,
  layers?: ILayerVersion[],
  vpc?: IVpc
): Function => {
  const iamRole = createIAMRole(scope, iamProps, stageName);
  if (vpc) {
    iamRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "ec2:DescribeNetworkInterfaces",
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeInstances",
          "ec2:AttachNetworkInterface",
          "cloudwatch:PutMetricData",
        ],
        resources: ["*"],
      })
    );
  }

  const lambdaFunction = new Function(scope, `${lambdaName}-${stageName}`, {
    runtime: Runtime.NODEJS_LATEST,
    code: Code.fromAsset(code),
    handler: handler,
    environment: {
      ...environmentVariables,
    },
    role: iamRole,
    memorySize: 1024,
    timeout,
    layers,
    vpc,
  });

  if (environmentVariables) {
    for (var key in environmentVariables) {
      lambdaFunction.addEnvironment(key, environmentVariables[key]);
    }
  }
  return lambdaFunction;
};

export const createDockerLambdaFunction = (
  construct: Construct,
  lambdaDockerName: string,
  code: string,
  handler: string,
  stageName: string,
  iamProps: IAMRoleProps,
  environmentVariables: { [key: string]: string },
  duration: Duration
): DockerImageFunction => {
  const lambdaDockerFunction = new DockerImageFunction(
    construct,
    `${lambdaDockerName}-${stageName}`,
    {
      code: lambda.DockerImageCode.fromImageAsset(code, { cmd: [handler] }),
      environment: {},
      role: createIAMRole(construct, iamProps, stageName),
      memorySize: 2024,
      timeout: duration,
      architecture: lambda.Architecture.X86_64,
    }
  );

  if (environmentVariables) {
    for (var key in environmentVariables) {
      lambdaDockerFunction.addEnvironment(key, environmentVariables[key]);
    }
  }
  return lambdaDockerFunction;
};

export const createPythonLambdaFunction = (
  scope: Construct,
  lambdaName: string,
  code: string,
  handler: string,
  stageName: string,
  iamProps: IAMRoleProps,
  environmentVariables: { [key: string]: string },
  timeout?: Duration,
  layers?: ILayerVersion[]
): Function => {
  const lambdaFunction = new Function(scope, `${lambdaName}-${stageName}`, {
    runtime: Runtime.PYTHON_3_11,
    code: Code.fromAsset(code),
    handler: handler,
    environment: {
      ...environmentVariables,
    },
    role: createIAMRole(scope, iamProps, stageName),
    timeout,
    layers,
    memorySize: 512,
  });

  if (environmentVariables) {
    for (var key in environmentVariables) {
      lambdaFunction.addEnvironment(key, environmentVariables[key]);
    }
  }
  return lambdaFunction;
};

export const getLambdaRoleArn = (
  accountId: string,
  lambdaName: string,
  stage: string
): string => {
  return `arn:aws:iam::${accountId}:role/${lambdaName}-Role-${stage}`;
};
