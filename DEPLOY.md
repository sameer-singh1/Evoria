# Evoria — AWS Deployment Guide

This guide walks you through every step to deploy Evoria on AWS.
Every command you need to run is shown exactly as-is — copy and paste them.

> **Directory legend used throughout this guide:**
> - 📁 `anywhere` — run from any directory
> - 📁 `C:\D\Evoria` — run from the project root
> - 📁 `C:\D\Evoria\infra` — run from the infra folder (CDK app)
> - 📁 `C:\D\Evoria\frontend` — run from the frontend folder

---

## Prerequisites — Install these first

📁 `anywhere` — run these to check what's already installed:

```powershell
node --version          # Need v18+
docker --version        # Need Docker Desktop running
aws --version           # Need AWS CLI v2
git --version
```

**Install AWS CLI v2** (if not installed):
→ Download: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

**Install CDK CLI:**

📁 `anywhere`
```powershell
npm install -g aws-cdk
cdk --version           # Should print 2.x.x
```

---

## Phase 1 — Configure AWS Credentials (one-time)

### Step 1: Configure your AWS CLI

📁 `anywhere`
```powershell
aws configure
```

It will ask for:
- **AWS Access Key ID** → get this from AWS Console → IAM → Users → Your user → Security credentials → Create access key
- **AWS Secret Access Key** → shown only once when you create the key
- **Default region name** → type: `ap-south-1`
- **Default output format** → type: `json`

Verify it works:

📁 `anywhere`
```powershell
aws sts get-caller-identity
```

Expected output (something like):
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

Note down your **Account ID** (12-digit number) — you'll need it later.

---

## Phase 2 — Deploy AWS Infrastructure with CDK (one-time)

### Step 2: Install CDK dependencies

📁 `C:\D\Evoria\infra`
```powershell
cd C:\D\Evoria\infra
npm install
```

### Step 3: Bootstrap CDK

CDK bootstrap creates an S3 bucket and IAM roles that CDK needs to deploy CloudFormation stacks.
You only ever need to do this once per AWS account + region combination.

📁 `C:\D\Evoria\infra`
```powershell
# Replace 123456789012 with your actual Account ID from Step 1
cdk bootstrap aws://123456789012/ap-south-1
```

Expected: `✅ Environment aws://123456789012/ap-south-1 bootstrapped.`

### Step 4: Deploy all infrastructure

📁 `C:\D\Evoria\infra`
```powershell
cdk deploy
```

This command:
- Creates the VPC, subnets, NAT Gateway
- Creates RDS MySQL 8 (takes ~5 min)
- Creates ECR repository
- Creates ECS cluster, task definition, service
- Creates ALB
- Creates both CloudFront distributions
- Creates S3 bucket
- Creates all IAM roles

**This takes about 10–15 minutes.** You'll see a progress bar.

When it finishes, it prints outputs like this — **copy all of them somewhere safe**:

```
Outputs:
EvoriaStack.ApiCloudFrontDistId       = EXXXXXXXXX
EvoriaStack.ApiCloudFrontUrl          = https://dBBBB.cloudfront.net
EvoriaStack.EcrRepositoryUri          = 123456789012.dkr.ecr.ap-south-1.amazonaws.com/evoria/backend
EvoriaStack.FargateSgId               = sg-0abc1234
EvoriaStack.FrontendCloudFrontDistId  = EYYYYYYYYY
EvoriaStack.FrontendCloudFrontUrl     = https://dAAAA.cloudfront.net
EvoriaStack.FrontendS3Bucket          = evoria-frontend-123456789012
EvoriaStack.GitHubActionsRoleArn      = arn:aws:iam::123456789012:role/evoria-github-actions-role
EvoriaStack.PrivateSubnetId           = subnet-0abc5678
EvoriaStack.RdsEndpoint               = evoria-db.xxxx.ap-south-1.rds.amazonaws.com
EvoriaStack.RdsSecretArn              = arn:aws:secretsmanager:ap-south-1:123456789012:secret:evoria/rds-credentials-xxxxxx
```

---

## Phase 3 — Set SSM Secrets (one-time)

The CDK stack creates the ECS task definition referencing SSM parameters.
Now you need to put the real values into those parameters.

### Step 5: Get the RDS password

CDK generated a random password and stored it in Secrets Manager. Fetch it:

📁 `anywhere`
```powershell
# Replace with your actual RdsSecretArn from Step 4
aws secretsmanager get-secret-value `
  --secret-id arn:aws:secretsmanager:ap-south-1:123456789012:secret:evoria/rds-credentials-xxxxxx `
  --query SecretString `
  --output text
```

You'll get a JSON like:
```json
{"username":"evoria_user","password":"AbCdEf1234!","host":"evoria-db.xxxx.rds.amazonaws.com","port":3306,"dbname":"evoria"}
```

Note the **password**.

### Step 6: Store all secrets in SSM Parameter Store

📁 `anywhere` — run each command below. Replace the values in `<angle brackets>`:

```powershell
# DATABASE_URL — use RdsEndpoint from Step 4 and password from Step 5
aws ssm put-parameter `
  --name "/evoria/DATABASE_URL" `
  --value "mysql://evoria_user:<password-from-step-5>@<RdsEndpoint>:3306/evoria" `
  --type SecureString `
  --overwrite

# JWT_SECRET — a random secret for signing JWTs
aws ssm put-parameter `
  --name "/evoria/JWT_SECRET" `
  --value "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" `
  --type SecureString `
  --overwrite

# PAYMENT_WEBHOOK_SECRET — used to verify Razorpay webhook signatures
# Use the same value you'll enter in the Razorpay dashboard
aws ssm put-parameter `
  --name "/evoria/PAYMENT_WEBHOOK_SECRET" `
  --value "evoria-webhook-secret-prod-$(node -e "console.log(require('crypto').randomBytes(8).toString('hex'))")" `
  --type SecureString `
  --overwrite

# RAZORPAY_KEY_ID — test key from your .env
aws ssm put-parameter `
  --name "/evoria/RAZORPAY_KEY_ID" `
  --value "rzp_test_TBNPo8aBmjiaVS" `
  --type SecureString `
  --overwrite

# RAZORPAY_KEY_SECRET — test secret from your .env
aws ssm put-parameter `
  --name "/evoria/RAZORPAY_KEY_SECRET" `
  --value "ewKdDgKS66nVhj7SwmpPmj2x" `
  --type SecureString `
  --overwrite

# FRONTEND_URL — the Frontend CloudFront URL from Step 4 (controls CORS)
aws ssm put-parameter `
  --name "/evoria/FRONTEND_URL" `
  --value "<FrontendCloudFrontUrl from Step 4>" `
  --type SecureString `
  --overwrite
```

Verify all 6 parameters are set:

📁 `anywhere`
```powershell
aws ssm get-parameters-by-path `
  --path "/evoria" `
  --with-decryption `
  --query "Parameters[*].{Name:Name,Value:Value}"
```

---

## Phase 4 — Configure GitHub Actions Secrets (one-time)

These are the secrets the pipeline reads during every deploy.

### Step 7: Add secrets to your GitHub repository

Go to: **GitHub → sameer-singh1/Evoria → Settings → Secrets and variables → Actions → New repository secret**

Add each of these (values come from the CDK outputs in Step 4):

| Secret Name | Value |
|---|---|
| `AWS_ROLE_ARN` | `GitHubActionsRoleArn` from Step 4 |
| `AWS_REGION` | `ap-south-1` |
| `ECR_REPOSITORY` | `EcrRepositoryUri` from Step 4 |
| `PRIVATE_SUBNET_ID` | `PrivateSubnetId` from Step 4 |
| `FARGATE_SG_ID` | `FargateSgId` from Step 4 |
| `S3_BUCKET` | `FrontendS3Bucket` from Step 4 |
| `FRONTEND_CF_DIST_ID` | `FrontendCloudFrontDistId` from Step 4 |
| `API_CF_DIST_ID` | `ApiCloudFrontDistId` from Step 4 |
| `API_CLOUDFRONT_URL` | `ApiCloudFrontUrl` from Step 4 |

---

## Phase 5 — Trigger the First Deployment

### Step 8: Push to main

📁 `C:\D\Evoria`
```powershell
cd C:\D\Evoria
git add .
git commit -m "feat: add AWS deployment infrastructure"
git push origin main
```

This triggers the GitHub Actions pipeline. Go to:
**GitHub → sameer-singh1/Evoria → Actions** to watch it run.

The pipeline takes **~8–10 minutes**. Each step is labeled and explained.

---

## Phase 6 — Configure Razorpay Webhook (one-time)

### Step 9: Set the webhook URL

After the pipeline succeeds:

1. Go to [Razorpay Dashboard (Test Mode)](https://dashboard.razorpay.com/app/webhooks)
2. Click **+ Add New Webhook**
3. Fill in:
   - **Webhook URL**: `<ApiCloudFrontUrl>/webhooks/payment` (e.g., `https://dBBBB.cloudfront.net/webhooks/payment`)
   - **Secret**: The exact value you used for `/evoria/PAYMENT_WEBHOOK_SECRET` in Step 6
   - **Active Events**: ✅ `payment.captured` and ✅ `payment.failed`
4. Click **Create Webhook**

---

## Phase 7 — Verify

### Step 10: Test the backend

📁 `anywhere`
```powershell
# Replace with your ApiCloudFrontUrl
curl https://dBBBB.cloudfront.net/health
# Expected: {"status":"ok"}
```

📁 `anywhere`
```powershell
# Test user registration
curl -X POST https://dBBBB.cloudfront.net/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@test.com","password":"Test1234","name":"Test User","role":"ATTENDEE"}'
```

### Step 11: Open the frontend

Open your browser and go to the **FrontendCloudFrontUrl** from Step 4:
```
https://dAAAA.cloudfront.net
```

You should see the Evoria event browsing page.

### Step 12: View backend logs (if anything is wrong)

📁 `anywhere`
```powershell
aws logs tail /ecs/evoria-backend --follow --region ap-south-1
```

---

## Ongoing Deployments

After the initial setup, deploying new changes is just:

📁 `C:\D\Evoria`
```powershell
git add .
git commit -m "your change"
git push origin main
```

The pipeline automatically:
1. Builds a new Docker image
2. Runs Prisma migrations
3. Rolling-deploys the new backend
4. Rebuilds and re-uploads the frontend
5. Clears CloudFront caches

**Total time: ~8–10 minutes from push to live.**

---

## Tear Down (if you want to stop and avoid charges)

📁 `C:\D\Evoria\infra`
```powershell
cd C:\D\Evoria\infra

# Remove all infrastructure (VPC, RDS, ECS, CloudFront, S3, etc.)
cdk destroy
```

> ⚠️ This permanently deletes RDS data. Make sure to export a backup first if needed:
>
> 📁 `anywhere`
> ```powershell
> aws rds create-db-snapshot --db-instance-identifier evoria-db --db-snapshot-identifier evoria-final-backup
> ```

---

## Troubleshooting

### "ECS service has 0 running tasks"

📁 `anywhere`
```powershell
aws logs tail /ecs/evoria-backend --follow
```
Common causes:
- SSM parameters have placeholder values → re-run Step 6
- ECR has no image → make sure the pipeline ran successfully

### "Migration task failed"

📁 `anywhere`
```powershell
# Find the stopped task ARN from the pipeline logs, then:
aws ecs describe-tasks --cluster evoria-cluster --tasks <task-arn> `
  --query 'tasks[0].stoppedReason'
```

### "Frontend shows blank page / API calls fail"
- Check `VITE_API_URL` is the API CloudFront URL (not the ALB URL)
- Check the GitHub Secret `API_CLOUDFRONT_URL` is set correctly
- Check the browser console for errors

### "CORS error in browser"
- Check `/evoria/FRONTEND_URL` in SSM matches the Frontend CloudFront URL exactly
- Force a new ECS deployment to pick up the updated SSM value:

📁 `anywhere`
```powershell
aws ecs update-service --cluster evoria-cluster --service evoria-service --force-new-deployment
aws ecs wait services-stable --cluster evoria-cluster --services evoria-service
```
