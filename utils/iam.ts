import { Construct } from "constructs";
import { IAMRoleProps } from "./lambda";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

export const createIAMRole = (
  scope: Construct,
  props: IAMRoleProps,
  stageName: string
): Role => {
  const iamRole: Role = new Role(scope, `${props.roleName}-${stageName}`, {
    roleName: `${props.roleName}-${stageName}`,
    assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    managedPolicies: props.managedPolicies,
  });

  if (props.actions.length === 0 || props.resources.length === 0) {
    return iamRole;
  }

  iamRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: props.actions,
      resources: props.resources,
    })
  );

  iamRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName(
      "CloudWatchLambdaInsightsExecutionRolePolicy"
    )
  );

  return iamRole;
};
