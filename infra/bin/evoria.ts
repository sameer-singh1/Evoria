import * as cdk from 'aws-cdk-lib';
import { EvoriaStack } from '../lib/evoria-stack';

const app = new cdk.App();

new EvoriaStack(app, 'EvoriaStack', {
  // Deploy to the account and region set by your AWS CLI profile.
  // Make sure to run: aws configure (or set AWS_PROFILE env var)
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:  process.env.CDK_DEFAULT_REGION ?? 'ap-south-1',
  },
  description: 'Evoria event ticketing platform — full AWS infrastructure',
});
