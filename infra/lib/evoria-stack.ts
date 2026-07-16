import * as cdk         from 'aws-cdk-lib';
import * as ec2         from 'aws-cdk-lib/aws-ec2';
import * as ecr         from 'aws-cdk-lib/aws-ecr';
import * as ecs         from 'aws-cdk-lib/aws-ecs';
import * as iam         from 'aws-cdk-lib/aws-iam';
import * as rds         from 'aws-cdk-lib/aws-rds';
import * as s3          from 'aws-cdk-lib/aws-s3';
import * as ssm         from 'aws-cdk-lib/aws-ssm';
import * as cloudfront  from 'aws-cdk-lib/aws-cloudfront';
import * as origins     from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2       from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs        from 'aws-cdk-lib/aws-logs';
import { Construct }    from 'constructs';

export class EvoriaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================================================================
    // 1. VPC
    // =========================================================================
    // Creates a VPC with:
    //   - 2 public subnets  (for the ALB — needs to be internet-facing)
    //   - 2 private subnets (for ECS Fargate tasks + RDS — not public)
    //   - 1 NAT Gateway     (lets private-subnet tasks reach ECR + SSM)
    // Using 2 AZs is the minimum for ALB (requires multi-AZ).
    const vpc = new ec2.Vpc(this, 'EvoriaVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // =========================================================================
    // 2. Security Groups
    // =========================================================================
    // Think of Security Groups as firewalls for each resource.
    // We follow the principle of least privilege: only allow what's needed.

    // ALB: receives HTTP traffic from the open internet
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      description: 'Evoria ALB - allows HTTP :80 from internet',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP from internet',
    );

    // Fargate: only accepts traffic from the ALB on port 3000
    const fargateSg = new ec2.SecurityGroup(this, 'FargateSg', {
      vpc,
      description: 'Evoria Fargate tasks - accepts :3000 from ALB only',
      allowAllOutbound: true, // needs outbound for ECR pull + SSM + RDS
    });
    fargateSg.addIngressRule(
      albSg,
      ec2.Port.tcp(3000),
      'Backend port from ALB only',
    );

    // RDS: accepts MySQL connections from Fargate tasks and local development clients
    const rdsSg = new ec2.SecurityGroup(this, 'RdsSg', {
      vpc,
      description: 'Evoria RDS - accepts :3306 from Fargate and developer',
      allowAllOutbound: false,
    });
    rdsSg.addIngressRule(
      fargateSg,
      ec2.Port.tcp(3306),
      'MySQL from Fargate only',
    );
    rdsSg.addIngressRule(
      ec2.Peer.anyIpv4(), // Allows connections for GUI clients
      ec2.Port.tcp(3306),
      'MySQL from developer GUI client',
    );

    // =========================================================================
    // 3. ECR Repository
    // =========================================================================
    // Amazon ECR stores your Docker images.
    // Lifecycle rule: automatically delete old images, keep only the last 5.
    const ecrRepo = new ecr.Repository(this, 'EvoriaBackendRepo', {
      repositoryName: 'evoria/backend',
      lifecycleRules: [
        {
          maxImageCount: 5,
          description: 'Keep only the 5 most recent images',
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // =========================================================================
    // 4. RDS MySQL 8
    // =========================================================================
    // Managed MySQL database in the private subnets.
    // CDK automatically creates a Secrets Manager secret with the generated password.
    // After cdk deploy, you get the RDS endpoint from the stack outputs,
    // and fetch the password from Secrets Manager to build the DATABASE_URL.
    const db = new rds.DatabaseInstance(this, 'EvoriaDb', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSg],
      databaseName: 'evoria',
      // CDK generates a random password and stores it in Secrets Manager
      credentials: rds.Credentials.fromGeneratedSecret('evoria_user', {
        secretName: 'evoria/rds-credentials',
      }),
      deletionProtection: false,     // set true for real production
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      storageType: rds.StorageType.GP2,
      allocatedStorage: 20,
      multiAz: false,
      backupRetention: cdk.Duration.days(1),
    });

    // =========================================================================
    // 5. IAM Roles
    // =========================================================================

    // ── 5a. ECS Task Execution Role ──────────────────────────────────────────
    // This role is assumed by ECS itself (not your code) to:
    //   - Pull the Docker image from ECR
    //   - Fetch secrets from SSM Parameter Store
    //   - Write logs to CloudWatch
    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      roleName: 'evoria-ecs-task-execution-role',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    // Allow ECS to read our secrets from SSM
    taskExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameters', 'ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/evoria/*`,
      ],
    }));

    // ── 5b. ECS Task Role ────────────────────────────────────────────────────
    // This role is assumed by YOUR running container code.
    // Currently the backend makes no direct AWS SDK calls,
    // so this role is minimal. Expand if you add S3, SES, etc. later.
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      roleName: 'evoria-ecs-task-role',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Allow ECS Exec / SSM Session Manager connection
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
      ],
      resources: ['*'],
    }));

    // ── 5c. GitHub Actions OIDC Role ─────────────────────────────────────────
    // OIDC = "OpenID Connect" — a way for GitHub Actions to prove its identity
    // to AWS without storing long-lived AWS access keys in GitHub.
    // Instead of keys, GitHub gets a short-lived token per pipeline run.
    //
    // Flow:
    //   GitHub Actions → presents OIDC token → AWS verifies it → issues
    //   temporary credentials scoped to THIS role → pipeline uses them
    const githubOidcProvider = new iam.OpenIdConnectProvider(
      this,
      'GitHubOidcProvider',
      {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
      },
    );

    const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: 'evoria-github-actions-role',
      assumedBy: new iam.WebIdentityPrincipal(
        githubOidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          // Only the sameer-singh1/Evoria repository can assume this role
          StringLike: {
            'token.actions.githubusercontent.com:sub':
              'repo:sameer-singh1/Evoria:*',
          },
        },
      ),
    });

    // ECR: allow pipeline to push images
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken'],
      resources: ['*'],
    }));
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'ecr:PutImage',
        'ecr:InitiateLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:CompleteLayerUpload',
      ],
      resources: [ecrRepo.repositoryArn],
    }));

    // ECS: allow pipeline to deploy and run one-off tasks (migrations)
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecs:RunTask',
        'ecs:StopTask',
        'ecs:DescribeTasks',
        'ecs:RegisterTaskDefinition',
        'ecs:DescribeTaskDefinition',
        'ecs:ListTaskDefinitions',
        'ecs:UpdateService',
        'ecs:DescribeServices',
      ],
      resources: ['*'],
    }));

    // IAM PassRole: required so ECS can assume the task roles on your behalf
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [taskExecutionRole.roleArn, taskRole.roleArn],
    }));

    // CloudWatch Logs: allow pipeline to read ECS task logs (for migration output)
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:GetLogEvents',
        'logs:DescribeLogStreams',
        'logs:DescribeLogGroups',
      ],
      resources: ['*'],
    }));

    // =========================================================================
    // 6. ECS Cluster
    // =========================================================================
    // A logical grouping of ECS services/tasks. With Fargate,
    // there are no actual EC2 instances to manage — AWS runs the containers.
    const cluster = new ecs.Cluster(this, 'EvoriaCluster', {
      clusterName: 'evoria-cluster',
      vpc,
    });

    // =========================================================================
    // 7. CloudWatch Log Group
    // =========================================================================
    // Container stdout/stderr goes here. You can stream these logs with:
    //   aws logs tail /ecs/evoria-backend --follow
    const logGroup = new logs.LogGroup(this, 'EcsLogGroup', {
      logGroupName: '/ecs/evoria-backend',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =========================================================================
    // 8. ECS Task Definition
    // =========================================================================
    // A "task definition" is like a blueprint for a container.
    // It describes: which image to run, how much CPU/memory, which ports,
    // environment variables, and where to send logs.
    //
    // The "secrets" block below tells ECS to fetch these values from SSM
    // Parameter Store at task startup time and inject them as env vars.
    // The container never sees the SSM parameters directly — ECS fetches
    // them securely and passes them in.
    //
    // IMPORTANT: You must create these SSM parameters (via CLI) before the
    // ECS service can start successfully. See DEPLOY.md for exact commands.
    const toSsmSecret = (paramName: string, id: string) =>
      ecs.Secret.fromSsmParameter(
        ssm.StringParameter.fromSecureStringParameterAttributes(this, id, {
          parameterName: paramName,
        }),
      );

    const taskDef = new ecs.FargateTaskDefinition(this, 'EvoriaTaskDef', {
      family: 'evoria-backend',
      cpu: 256,         // 0.25 vCPU
      memoryLimitMiB: 512,
      executionRole: taskExecutionRole,
      taskRole,
    });

    taskDef.addContainer('evoria-backend', {
      containerName: 'evoria-backend',
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      secrets: {
        DATABASE_URL:           toSsmSecret('/evoria/DATABASE_URL',           'SsmDbUrl'),
        JWT_SECRET:             toSsmSecret('/evoria/JWT_SECRET',             'SsmJwtSecret'),
        PAYMENT_WEBHOOK_SECRET: toSsmSecret('/evoria/PAYMENT_WEBHOOK_SECRET', 'SsmWebhookSecret'),
        RAZORPAY_KEY_ID:        toSsmSecret('/evoria/RAZORPAY_KEY_ID',        'SsmRazorpayKeyId'),
        RAZORPAY_KEY_SECRET:    toSsmSecret('/evoria/RAZORPAY_KEY_SECRET',    'SsmRazorpayKeySecret'),
        FRONTEND_URL:           toSsmSecret('/evoria/FRONTEND_URL',           'SsmFrontendUrl'),
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'evoria-backend',
        logGroup,
      }),
    });

    // =========================================================================
    // 9. Application Load Balancer (ALB)
    // =========================================================================
    // The ALB sits in the public subnets and receives HTTP traffic from the
    // internet (or from the API CloudFront distribution).
    // It forwards traffic to the Fargate task on port 3000.
    const alb = new elbv2.ApplicationLoadBalancer(this, 'EvoriaAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      loadBalancerName: 'evoria-alb',
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // =========================================================================
    // 10. ECS Fargate Service
    // =========================================================================
    // The service keeps 1 instance of the task running at all times.
    // If the container crashes, ECS automatically replaces it.
    // desiredCount=1 means: always keep 1 task running.
    //
    // NOTE: On the very first deploy, this will fail to start because:
    //   (a) ECR has no image yet — the pipeline will push one
    //   (b) SSM parameters are placeholders — you set real values via CLI
    // ECS retries with exponential backoff. It will succeed after you
    // complete the bootstrap steps in DEPLOY.md.
    const service = new ecs.FargateService(this, 'EvoriaService', {
      serviceName: 'evoria-service',
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [fargateSg],
      assignPublicIp: false,
    });

    // Target group: tells the ALB where to send traffic (Fargate task IPs)
    // Type must be IP (not Instance) because Fargate has no EC2 host
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'EvoriaTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targets: [service],
      healthCheck: {
        path: '/health',          // your backend already has GET /health → {status:"ok"}
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    listener.addTargetGroups('Default', {
      targetGroups: [targetGroup],
    });

    // =========================================================================
    // 11. API CloudFront Distribution  ← fixes the mixed-content error
    // =========================================================================
    // Problem: Frontend is HTTPS (CloudFront). ALB is HTTP (no SSL cert).
    //          Browsers block HTTP API calls made from an HTTPS page.
    //
    // Solution: Put CloudFront in front of the ALB.
    //   Browser (HTTPS) → API CloudFront → ALB (HTTP internally) → ECS
    //   CloudFront provides a free HTTPS URL. No custom domain needed.
    //
    // Key settings:
    //   - cachePolicy: CACHING_DISABLED  → API responses are never cached
    //   - originRequestPolicy: ALL_VIEWER_EXCEPT_HOST_HEADER
    //       → Forwards Authorization, Content-Type, x-webhook-signature, etc.
    //         to the backend. Excludes the Host header (important: if the
    //         CloudFront hostname were forwarded as Host, the ALB would reject it)
    //   - allowedMethods: ALL → passes GET, POST, PUT, PATCH, DELETE, OPTIONS
    const apiDistribution = new cloudfront.Distribution(this, 'ApiDistribution', {
      comment: 'Evoria API — HTTPS proxy over ALB (fixes mixed-content)',
      defaultBehavior: {
        origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods:         cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy:            cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy:    cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy:   cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      },
    });

    // =========================================================================
    // 12. Frontend S3 Bucket
    // =========================================================================
    // Stores the static files from `npm run build` (the React app).
    // The bucket is private — only CloudFront can read from it (via OAC).
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `evoria-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Allow GitHub Actions pipeline to sync files to S3
    frontendBucket.grantReadWrite(githubActionsRole);

    // =========================================================================
    // 13. Frontend CloudFront Distribution
    // =========================================================================
    // Serves the React app over HTTPS.
    // OAC (Origin Access Control) = CloudFront proves its identity to S3
    //   so the bucket stays private while CloudFront can still read it.
    //
    // Custom error pages: React Router handles /events/123, /bookings/xyz etc.
    // These are client-side routes. If a user opens that URL directly,
    // S3 doesn't know about it and returns 403/404.
    // We tell CloudFront: on 403 or 404, serve /index.html (HTTP 200).
    // Then React Router takes over and renders the correct page.
    const frontendDistribution = new cloudfront.Distribution(
      this,
      'FrontendDistribution',
      {
        comment: 'Evoria Frontend — React app from S3',
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.seconds(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.seconds(0),
          },
        ],
      },
    );

    // Allow GitHub Actions pipeline to invalidate both CloudFront distributions
    // (needed to clear cached files after a new frontend deploy)
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        `arn:aws:cloudfront::${this.account}:distribution/${frontendDistribution.distributionId}`,
        `arn:aws:cloudfront::${this.account}:distribution/${apiDistribution.distributionId}`,
      ],
    }));

    // =========================================================================
    // 14. Stack Outputs
    // =========================================================================
    // These values are printed after `cdk deploy` finishes.
    // You will use them to:
    //   - Set SSM parameter values (DATABASE_URL, FRONTEND_URL)
    //   - Set GitHub Secrets for the Actions pipeline
    //   - Configure the Razorpay webhook URL

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: db.instanceEndpoint.hostname,
      description: '→ Use this to build DATABASE_URL: mysql://evoria_user:<pw>@<this>:3306/evoria',
    });

    new cdk.CfnOutput(this, 'RdsSecretArn', {
      value: db.secret!.secretArn,
      description: '→ Fetch the RDS password from here: aws secretsmanager get-secret-value --secret-id <this>',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepo.repositoryUri,
      description: '→ GitHub Secret: ECR_REPOSITORY',
    });

    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: githubActionsRole.roleArn,
      description: '→ GitHub Secret: AWS_ROLE_ARN',
    });

    new cdk.CfnOutput(this, 'ApiCloudFrontUrl', {
      value: `https://${apiDistribution.distributionDomainName}`,
      description: '→ GitHub Secret: API_CLOUDFRONT_URL  |  Also set as /evoria/FRONTEND_URL... wait no, this is the API',
    });

    new cdk.CfnOutput(this, 'FrontendCloudFrontUrl', {
      value: `https://${frontendDistribution.distributionDomainName}`,
      description: '→ Open this URL in your browser  |  SSM: /evoria/FRONTEND_URL',
    });

    new cdk.CfnOutput(this, 'FrontendS3Bucket', {
      value: frontendBucket.bucketName,
      description: '→ GitHub Secret: S3_BUCKET',
    });

    new cdk.CfnOutput(this, 'FrontendCloudFrontDistId', {
      value: frontendDistribution.distributionId,
      description: '→ GitHub Secret: FRONTEND_CF_DIST_ID',
    });

    new cdk.CfnOutput(this, 'ApiCloudFrontDistId', {
      value: apiDistribution.distributionId,
      description: '→ GitHub Secret: API_CF_DIST_ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: vpc.privateSubnets[0].subnetId,
      description: '→ GitHub Secret: PRIVATE_SUBNET_ID',
    });

    new cdk.CfnOutput(this, 'FargateSgId', {
      value: fargateSg.securityGroupId,
      description: '→ GitHub Secret: FARGATE_SG_ID',
    });
  }
}
